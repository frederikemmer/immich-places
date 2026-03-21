package main

import (
	"context"
	"encoding/json"
	"fmt"
	"net/http"
	"net/url"
	"strconv"
	"sync"
	"time"

	"golang.org/x/time/rate"
)

const googleGeocodeURL = "https://maps.googleapis.com/maps/api/geocode/json"

type GoogleMapsClient struct {
	apiKey     string
	httpClient *http.Client
	cache      map[string]string
	cacheMu    sync.Mutex
	limiter    *rate.Limiter
}

func newGoogleMapsClient(apiKey string, timeout time.Duration) *GoogleMapsClient {
	return &GoogleMapsClient{
		apiKey:     apiKey,
		httpClient: &http.Client{Timeout: timeout},
		cache:      make(map[string]string),
		limiter:    rate.NewLimiter(rate.Every(50*time.Millisecond), 10),
	}
}

type googleGeocodeResponse struct {
	Status  string              `json:"status"`
	Results []googleGeocodeItem `json:"results"`
}

type googleGeocodeItem struct {
	PlaceID          string `json:"place_id"`
	FormattedAddress string `json:"formatted_address"`
	Geometry         struct {
		Location struct {
			Lat float64 `json:"lat"`
			Lng float64 `json:"lng"`
		} `json:"location"`
	} `json:"geometry"`
	Types             []string                 `json:"types"`
	AddressComponents []googleAddressComponent `json:"address_components"`
}

type googleAddressComponent struct {
	LongName string   `json:"long_name"`
	Types    []string `json:"types"`
}

func (g *GoogleMapsClient) ReverseGeocode(ctx context.Context, lat, lon float64) (string, error) {
	key := fmt.Sprintf("%.2f,%.2f", lat, lon)

	g.cacheMu.Lock()
	if label, ok := g.cache[key]; ok {
		g.cacheMu.Unlock()
		return label, nil
	}
	g.cacheMu.Unlock()

	if err := g.limiter.Wait(ctx); err != nil {
		return "", fmt.Errorf("Google Maps rate limiter: %w", err)
	}

	params := url.Values{}
	params.Set("latlng", fmt.Sprintf("%f,%f", lat, lon))
	params.Set("key", g.apiKey)

	reqURL := googleGeocodeURL + "?" + params.Encode()

	req, err := http.NewRequestWithContext(ctx, "GET", reqURL, nil)
	if err != nil {
		return "", fmt.Errorf("Google Maps request build: %w", err)
	}

	resp, err := g.httpClient.Do(req)
	if err != nil {
		return "", fmt.Errorf("Google Maps request: %w", err)
	}
	defer resp.Body.Close()

	if resp.StatusCode != http.StatusOK {
		return "", fmt.Errorf("Google Maps reverse geocode returned status %d", resp.StatusCode)
	}

	var result googleGeocodeResponse
	if err := json.NewDecoder(resp.Body).Decode(&result); err != nil {
		return "", fmt.Errorf("Google Maps response decode: %w", err)
	}

	if err := checkGoogleStatus(result.Status); err != nil {
		return "", err
	}

	if len(result.Results) == 0 {
		return formatCoords(lat, lon), nil
	}

	item := result.Results[0]
	label := buildLabelFromGoogleComponents(item.AddressComponents)
	if label == "Unknown" {
		label = item.FormattedAddress
	}
	if label == "" {
		return formatCoords(lat, lon), nil
	}

	g.cacheMu.Lock()
	if len(g.cache) >= maxGeocodeCacheSize {
		g.cache = make(map[string]string)
	}
	g.cache[key] = label
	g.cacheMu.Unlock()

	return label, nil
}

func (g *GoogleMapsClient) ForwardSearch(ctx context.Context, query string, limit int, lang string) ([]SearchResult, error) {
	if err := g.limiter.Wait(ctx); err != nil {
		return nil, fmt.Errorf("Google Maps rate limiter: %w", err)
	}

	params := url.Values{}
	params.Set("address", query)
	params.Set("key", g.apiKey)
	if lang == "" {
		lang = "en"
	}
	params.Set("language", lang)

	reqURL := googleGeocodeURL + "?" + params.Encode()

	req, err := http.NewRequestWithContext(ctx, "GET", reqURL, nil)
	if err != nil {
		return nil, fmt.Errorf("Google Maps request build: %w", err)
	}

	resp, err := g.httpClient.Do(req)
	if err != nil {
		return nil, fmt.Errorf("Google Maps request: %w", err)
	}
	defer resp.Body.Close()

	if resp.StatusCode != http.StatusOK {
		return nil, fmt.Errorf("Google Maps search returned status %d", resp.StatusCode)
	}

	var data googleGeocodeResponse
	if err := json.NewDecoder(resp.Body).Decode(&data); err != nil {
		return nil, fmt.Errorf("Google Maps response decode: %w", err)
	}

	if err := checkGoogleStatus(data.Status); err != nil {
		return nil, err
	}

	items := data.Results
	if len(items) > limit {
		items = items[:limit]
	}

	results := make([]SearchResult, len(items))
	for i, item := range items {
		resultType := "place"
		if len(item.Types) > 0 {
			resultType = item.Types[0]
		}
		results[i] = SearchResult{
			PlaceID:     i + 1,
			Lat:         strconv.FormatFloat(item.Geometry.Location.Lat, 'f', -1, 64),
			Lon:         strconv.FormatFloat(item.Geometry.Location.Lng, 'f', -1, 64),
			DisplayName: item.FormattedAddress,
			Type:        resultType,
		}
	}
	return results, nil
}

func checkGoogleStatus(status string) error {
	switch status {
	case "OK", "ZERO_RESULTS":
		return nil
	case "OVER_QUERY_LIMIT":
		return fmt.Errorf("Google Maps API rate limited (OVER_QUERY_LIMIT)")
	case "REQUEST_DENIED":
		return fmt.Errorf("Google Maps API request denied (check API key)")
	default:
		return fmt.Errorf("Google Maps API error: %s", status)
	}
}

func buildLabelFromGoogleComponents(components []googleAddressComponent) string {
	var city, state, country string
	for _, c := range components {
		for _, t := range c.Types {
			switch t {
			case "locality":
				city = c.LongName
			case "administrative_area_level_1":
				state = c.LongName
			case "country":
				country = c.LongName
			}
		}
	}
	return buildLabel(city, "", "", state, country)
}

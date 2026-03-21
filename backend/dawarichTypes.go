package main

import (
	"fmt"
	"strconv"
	"time"
)

type DawarichTrackFeature struct {
	Type       string                       `json:"type"`
	Properties DawarichTrackFeatureProperties `json:"properties"`
}

type DawarichTrackFeatureProperties struct {
	ID         int     `json:"id"`
	Name       string  `json:"name"`
	StartedAt  string  `json:"started_at"`
	FinishedAt string  `json:"finished_at"`
	Distance   float64 `json:"distance"`
	Duration   int     `json:"duration"`
}

type DawarichFeatureCollection struct {
	Type     string                 `json:"type"`
	Features []DawarichTrackFeature `json:"features"`
}

type DawarichTrackListItem struct {
	ID         int     `json:"ID"`
	Name       string  `json:"name"`
	StartedAt  string  `json:"startedAt"`
	FinishedAt string  `json:"finishedAt"`
	Distance   float64 `json:"distance"`
	Duration   int     `json:"duration"`
}

type DawarichPoint struct {
	Timestamp int    `json:"timestamp"`
	Latitude  string `json:"latitude"`
	Longitude string `json:"longitude"`
	Altitude  int    `json:"altitude"`
}

type DawarichPreviewRequest struct {
	TrackIDs      []int `json:"trackIDs" validate:"required,min=1"`
	MaxGapSeconds int   `json:"maxGapSeconds"`
}

type DawarichSettingsRequest struct {
	APIKey string `json:"apiKey" validate:"required"`
}

func convertDawarichPointsToTrackPoints(points []DawarichPoint) ([]trackPoint, error) {
	result := make([]trackPoint, 0, len(points))
	for _, p := range points {
		lat, err := strconv.ParseFloat(p.Latitude, 64)
		if err != nil {
			return nil, fmt.Errorf("parse latitude %q: %w", p.Latitude, err)
		}
		lon, err := strconv.ParseFloat(p.Longitude, 64)
		if err != nil {
			return nil, fmt.Errorf("parse longitude %q: %w", p.Longitude, err)
		}
		result = append(result, trackPoint{
			latitude:  lat,
			longitude: lon,
			elevation: float64(p.Altitude),
			time:      time.Unix(int64(p.Timestamp), 0).UTC(),
		})
	}
	return result, nil
}

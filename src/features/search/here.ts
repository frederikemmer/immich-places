import type {TNominatimResult} from '@/shared/types/nominatim';

type THereSearchOptions = {
	apiKey: string;
	signal?: AbortSignal;
	limit?: number;
	acceptLanguage?: string;
};

type THereSearchItem = {
	id: string;
	title: string;
	resultType: string;
	position: {lat: number; lng: number};
	address: {label: string};
};

type THereSearchResponse = {
	items: THereSearchItem[];
};

/**
 * Forward-search through the HERE Geocoding & Search API.
 * Results are normalised into TNominatimResult so the rest of the
 * frontend can consume them without knowing which provider was used.
 */
export async function searchPlacesFromHere(
	query: string,
	options: THereSearchOptions
): Promise<TNominatimResult[]> {
	const trimmed = query.trim();
	if (!trimmed) {
		return [];
	}

	const params = new URLSearchParams({
		q: trimmed,
		limit: String(options.limit ?? 5),
		apiKey: options.apiKey
	});
	if (options.acceptLanguage?.trim()) {
		params.set('lang', options.acceptLanguage.slice(0, 128));
	}

	const response = await fetch(`https://geocode.search.hereapi.com/v1/geocode?${params}`, {
		signal: options.signal,
		cache: 'no-store'
	});
	if (!response.ok) {
		throw new Error(`HERE search failed: ${response.status}`);
	}

	const data = (await response.json()) as THereSearchResponse;
	return (data.items ?? []).map((item, index) => ({
		placeID: index + 1,
		lat: String(item.position.lat),
		lon: String(item.position.lng),
		displayName: item.address?.label ?? item.title,
		type: item.resultType ?? 'place'
	}));
}

import {parseCoordinatePair} from '@/utils/coordinates';

import type {TNominatimResult} from '@/shared/types/nominatim';

const GEOCODE_SEARCH_PATH = '/api/backend/geocode/search';
const GEOCODE_QUERY_MIN_LENGTH = 2;

function parsePlaceID(rec: Record<string, unknown>): number | null {
	const val = rec.placeID;
	if (typeof val === 'number' && Number.isFinite(val)) {
		return Math.trunc(val);
	}
	if (typeof val === 'string') {
		const parsed = Number.parseInt(val, 10);
		if (Number.isFinite(parsed)) {
			return parsed;
		}
	}
	return null;
}

function parseStringField(value: unknown): string | null {
	if (typeof value === 'string') {
		return value;
	}
	return null;
}

function toTNominatimResult(item: unknown): TNominatimResult | null {
	if (typeof item !== 'object' || item === null) {
		return null;
	}
	const rec = item as Record<string, unknown>;

	const placeID = parsePlaceID(rec);
	const rawLat = parseStringField(rec.lat);
	const rawLon = parseStringField(rec.lon);
	const type = parseStringField(rec.type);
	const displayName = parseStringField(rec.displayName);

	if (placeID === null || rawLat === null || rawLon === null || type === null || displayName === null) {
		return null;
	}

	const coordinates = parseCoordinatePair(rawLat, rawLon);
	if (!coordinates) {
		return null;
	}
	return {
		placeID,
		lat: rawLat,
		lon: rawLon,
		displayName,
		type
	};
}

function parseTNominatimResults(data: unknown): TNominatimResult[] {
	if (!Array.isArray(data)) {
		throw new Error('Invalid geocode response payload');
	}
	const results: TNominatimResult[] = [];
	for (const item of data) {
		const parsed = toTNominatimResult(item);
		if (parsed) {
			results.push(parsed);
		}
	}
	return results;
}

export async function searchPlaces(query: string, signal?: AbortSignal): Promise<TNominatimResult[]> {
	const trimmed = query.trim();
	if (!trimmed || trimmed.length < GEOCODE_QUERY_MIN_LENGTH) {
		return [];
	}

	const params = new URLSearchParams({q: trimmed});
	const response = await fetch(`${GEOCODE_SEARCH_PATH}?${params}`, {
		signal,
		credentials: 'same-origin'
	});

	if (!response.ok) {
		throw new Error(`Geocode search failed: ${response.status}`);
	}
	const data: unknown = await response.json();
	return parseTNominatimResults(data);
}

import {NextResponse} from 'next/server';

import {searchPlacesFromNominatim} from '@/features/search/nominatim';
import {
	DEFAULT_GEOCODE_RESULT_LIMIT,
	GEOCODE_QUERY_MAX_LENGTH,
	GEOCODE_QUERY_MIN_LENGTH,
	GEOCODE_UPSTREAM_TIMEOUT_MS,
	MAX_GEOCODE_RESULT_LIMIT
} from '@/utils/geocoding';
import {hasControlChars} from '@/utils/string';

import type {NextRequest} from 'next/server';

const MAX_RESULTS = Math.min(MAX_GEOCODE_RESULT_LIMIT, DEFAULT_GEOCODE_RESULT_LIMIT);

function validateQuery(raw: string | null): string | null {
	if (!raw) {
		return null;
	}
	const query = raw.trim();
	if (query.length < GEOCODE_QUERY_MIN_LENGTH || query.length > GEOCODE_QUERY_MAX_LENGTH) {
		return null;
	}
	if (hasControlChars(query)) {
		return null;
	}
	return query;
}

export async function GET(request: NextRequest): Promise<NextResponse> {
	const query = validateQuery(request.nextUrl.searchParams.get('q'));
	if (!query) {
		return NextResponse.json(
			{error: `Query must be ${GEOCODE_QUERY_MIN_LENGTH}-${GEOCODE_QUERY_MAX_LENGTH} characters.`},
			{status: 400}
		);
	}

	const timeoutController = new AbortController();
	let isTimedOut = false;
	const timeoutID = setTimeout(() => {
		isTimedOut = true;
		timeoutController.abort();
	}, GEOCODE_UPSTREAM_TIMEOUT_MS);
	const handleRequestAbort = (): void => timeoutController.abort();
	request.signal.addEventListener('abort', handleRequestAbort, {once: true});

	try {
		const results = await searchPlacesFromNominatim(query, {
			limit: MAX_RESULTS,
			signal: timeoutController.signal,
			acceptLanguage: request.headers.get('accept-language') ?? undefined
		});

		return NextResponse.json(results, {
			headers: {'Cache-Control': 'private, no-store, max-age=0'} //eslint-disable-line
		});
	} catch {
		if (isTimedOut) {
			return NextResponse.json({error: 'Geocode request timed out.'}, {status: 504});
		}
		return NextResponse.json({error: 'Geocode provider request failed.'}, {status: 502});
	} finally {
		clearTimeout(timeoutID);
		request.signal.removeEventListener('abort', handleRequestAbort);
	}
}

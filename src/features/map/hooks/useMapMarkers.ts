'use client';

import {useCallback, useEffect, useRef, useState} from 'react';

import {isAuthErrorWithCode} from '@/features/auth/authApi';
import {useAuth} from '@/features/auth/AuthContext';
import {fetchMapMarkers} from '@/shared/services/backendApi';
import {MAP_BOUNDS_KEY_DECIMALS} from '@/utils/map';

import type {TViewportBounds} from '@/shared/types/api';
import type {TMapMarker} from '@/shared/types/map';

type TUseMapMarkersReturn = {
	mapMarkers: TMapMarker[];
	error: string | null;
};

/**
 * Builds a stable cache key from viewport bounds for deduplicating map requests.
 *
 * @param bounds - Optional viewport bounds.
 * @returns Normalized key string.
 */
function boundsKey(bounds?: TViewportBounds | null): string {
	if (!bounds) {
		return '';
	}
	return `${bounds.north.toFixed(MAP_BOUNDS_KEY_DECIMALS)}:${bounds.south.toFixed(MAP_BOUNDS_KEY_DECIMALS)}:${bounds.east.toFixed(MAP_BOUNDS_KEY_DECIMALS)}:${bounds.west.toFixed(MAP_BOUNDS_KEY_DECIMALS)}`;
}

/**
 * Loads map markers by album, version, and bounds.
 *
 * @param albumID - Optional album filter.
 * @param version - Change token triggering a reload.
 * @param bounds - Viewport bounds for server-side filtering.
 * @returns Map marker list and any fetch error.
 */
export function useMapMarkers(
	albumID?: string | null,
	version = 0,
	bounds?: TViewportBounds | null
): TUseMapMarkersReturn {
	const [mapMarkers, setMapMarkers] = useState<TMapMarker[]>([]);
	const [error, setError] = useState<string | null>(null);
	const {logout} = useAuth();
	const requestIDRef = useRef(0);
	const abortRef = useRef<AbortController | null>(null);
	const effectiveBounds = albumID ? null : (bounds ?? null);
	const currentBoundsKey = boundsKey(effectiveBounds);

	const load = useCallback(
		async (currentAlbumID?: string, currentBounds?: TViewportBounds | null) => {
			requestIDRef.current += 1;
			const requestID = requestIDRef.current;
			abortRef.current?.abort();
			const controller = new AbortController();
			abortRef.current = controller;
			try {
				const markers = await fetchMapMarkers(currentAlbumID, currentBounds, {signal: controller.signal});
				if (requestIDRef.current !== requestID) {
					return;
				}
				setMapMarkers(markers);
				setError(null);
			} catch (error) {
				if (controller.signal.aborted) {
					return;
				}
				if (requestIDRef.current !== requestID) {
					return;
				}
				if (isAuthErrorWithCode(error, 'notAuthenticated')) {
					void logout();
					return;
				}
				setError('Failed to refresh map markers.');
				// Keep the previous successful markers so transient failures do not blank the map.
			}
		},
		[logout]
	);

	const prevAlbumID = useRef(albumID);
	const prevVersion = useRef(version);
	const prevBoundsKey = useRef(currentBoundsKey);
	const hasLoadedRef = useRef(false);

	useEffect(() => {
		const isAlbumChanged = prevAlbumID.current !== albumID;
		const isVersionChanged = prevVersion.current !== version;
		const isBoundsChanged = prevBoundsKey.current !== currentBoundsKey;

		prevAlbumID.current = albumID;
		prevVersion.current = version;
		prevBoundsKey.current = currentBoundsKey;

		if (!albumID && !effectiveBounds) {
			return;
		}

		if (isAlbumChanged || isVersionChanged || isBoundsChanged || !hasLoadedRef.current) {
			hasLoadedRef.current = true;
			if (isAlbumChanged) {
				setMapMarkers([]);
				setError(null);
				load(albumID ?? undefined, effectiveBounds);
				return;
			}
			load(albumID ?? undefined, effectiveBounds);
		}
	}, [albumID, effectiveBounds, currentBoundsKey, load, version]);

	useEffect(() => {
		return () => {
			abortRef.current?.abort();
		};
	}, []);

	return {mapMarkers, error};
}

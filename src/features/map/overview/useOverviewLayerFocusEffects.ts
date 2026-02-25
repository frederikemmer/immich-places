'use client';

import {useEffect} from 'react';

import {overviewIcon} from '@/features/map/icons';
import {isGPSFilterWithLocations} from '@/utils/view';

import type {TUseOverviewLayerArgs} from '@/shared/types/mapLayer';

/**
 * Inputs used by focus-effect synchronization for overview markers.
 */
type TFocusEffectsArgs = Pick<
	TUseOverviewLayerArgs,
	'pendingLocation' | 'focusedOverviewIDRef' | 'focusedOverviewCoordsRef' | 'overviewMarkersRef' | 'gpsFilter'
>;

/**
 * Clears focused marker icon when pending location changes or no focus exists.
 *
 * @param args - Focus state references and current pending location.
 */
export function useOverviewLayerFocusEffects({
	pendingLocation,
	focusedOverviewIDRef,
	focusedOverviewCoordsRef,
	overviewMarkersRef,
	gpsFilter
}: TFocusEffectsArgs): void {
	useEffect(() => {
		if (pendingLocation || !focusedOverviewIDRef.current) {
			return;
		}
		const prev = overviewMarkersRef.current.get(focusedOverviewIDRef.current);
		if (prev) {
			const isGreyscale = !isGPSFilterWithLocations(gpsFilter);
			prev.setIcon(overviewIcon(focusedOverviewIDRef.current, false, isGreyscale));
		}
		focusedOverviewIDRef.current = null;
		focusedOverviewCoordsRef.current = null;
	}, [pendingLocation, gpsFilter, focusedOverviewIDRef, focusedOverviewCoordsRef, overviewMarkersRef]);
}

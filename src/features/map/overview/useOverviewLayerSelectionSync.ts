'use client';

import {useEffect} from 'react';

import type {TAssetRow} from '@/shared/types/asset';
import type L from 'leaflet';
import type {RefObject} from 'react';

/**
 * Arguments used to sync overview layer marker visibility with current selection.
 */
type TUseOverviewLayerSelectionSyncArgs = {
	selectedAssets: TAssetRow[];
	overviewLayerRef: RefObject<L.MarkerClusterGroup | null>;
	overviewMarkersRef: RefObject<Map<string, L.Marker>>;
	visibleMarkerIDsRef: RefObject<Set<string>>;
	previousSelectedIDsRef: RefObject<Set<string>>;
	focusedOverviewIDRef: RefObject<string | null>;
	focusedOverviewCoordsRef: RefObject<{lat: number; lng: number} | null>;
};

/**
 * Synchronizes marker visibility in the overview cluster layer based on selected assets.
 *
 * Selected assets are hidden from the map by removing their markers from the visible
 * overlay set. Unselected markers are reintroduced.
 *
 * @param args - Current selection and overview ref state.
 */
export function useOverviewLayerSelectionSync({
	selectedAssets,
	overviewLayerRef,
	overviewMarkersRef,
	visibleMarkerIDsRef,
	previousSelectedIDsRef,
	focusedOverviewIDRef,
	focusedOverviewCoordsRef
}: TUseOverviewLayerSelectionSyncArgs): void {
	useEffect(() => {
		if (!overviewLayerRef.current) {
			return;
		}
		const nextSelectedIDs = new Set(selectedAssets.map(a => a.immichID));
		const previousSelectedIDs = previousSelectedIDsRef.current;
		const changedIDs = new Set<string>();

		for (const assetID of nextSelectedIDs) {
			if (!previousSelectedIDs.has(assetID)) {
				changedIDs.add(assetID);
			}
		}
		for (const assetID of previousSelectedIDs) {
			if (!nextSelectedIDs.has(assetID)) {
				changedIDs.add(assetID);
			}
		}

		if (changedIDs.size === 0) {
			return;
		}
		let hasLayerChanges = false;
		for (const assetID of changedIDs) {
			const marker = overviewMarkersRef.current.get(assetID);
			if (!marker) {
				continue;
			}
			const shouldBeVisible = !nextSelectedIDs.has(assetID);
			const isVisible = visibleMarkerIDsRef.current.has(assetID);
			if (shouldBeVisible && !isVisible) {
				overviewLayerRef.current.addLayer(marker);
				visibleMarkerIDsRef.current.add(assetID);
				hasLayerChanges = true;
			} else if (!shouldBeVisible && isVisible) {
				overviewLayerRef.current.removeLayer(marker);
				visibleMarkerIDsRef.current.delete(assetID);
				if (focusedOverviewIDRef.current === assetID) {
					focusedOverviewIDRef.current = null;
					focusedOverviewCoordsRef.current = null;
				}
				hasLayerChanges = true;
			}
		}
		if (hasLayerChanges) {
			overviewLayerRef.current.refreshClusters();
		}
		previousSelectedIDsRef.current = nextSelectedIDs;
	}, [
		selectedAssets,
		overviewLayerRef,
		overviewMarkersRef,
		visibleMarkerIDsRef,
		previousSelectedIDsRef,
		focusedOverviewIDRef,
		focusedOverviewCoordsRef
	]);
}

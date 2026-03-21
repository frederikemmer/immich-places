import {overviewIcon} from '@/features/map/icons';
import {
	buildMarker,
	clearFocusedMarker,
	resolveMarkerData,
	resolveMarkerGreyscale
} from '@/features/map/overview/overviewLayerHandlers';

import type {TMarkerRenderData} from '@/features/map/overview/overviewLayerHandlers';
import type {TMapMarker} from '@/shared/types/map';
import type {TUseOverviewLayerReconcileArgs} from '@/shared/types/mapLayer';
import type L from 'leaflet';

type TLayerWithElement = L.Layer & {
	getElement: () => HTMLElement | null | undefined;
};

export function syncMarkers(args: TUseOverviewLayerReconcileArgs, isGreyscale: boolean): boolean {
	if (!args.mapInstanceRef.current || !args.overviewLayerRef.current) {
		return false;
	}
	const map = args.mapInstanceRef.current;
	const nextMarkerDataByID = buildNextMarkerDataByID(args.mapMarkers);
	args.markerDataByIDRef.current = nextMarkerDataByID;

	if (!args.groupMovePillRef.current && !args.groupAnchorMarkerRef.current && args.overviewLayerRef.current) {
		clearGroupMoveInlineStyles(args.overviewLayerRef.current);
	}

	let hasLayerChanges = removeStaleMarkers(args, nextMarkerDataByID);

	for (const markerData of args.mapMarkers) {
		if (syncSingleMarker(args, map, markerData, isGreyscale)) {
			hasLayerChanges = true;
		}
	}

	return hasLayerChanges;
}

function clearGroupMoveInlineStyles(overviewLayer: L.LayerGroup): void {
	overviewLayer.eachLayer(layer => {
		const markerLayer = layer as TLayerWithElement;
		if (typeof markerLayer.getElement !== 'function') {
			return;
		}
		const markerElement = markerLayer.getElement();
		if (!markerElement) {
			return;
		}
		markerElement.style.removeProperty('opacity');
		markerElement.style.removeProperty('filter');
		markerElement.style.removeProperty('pointer-events');
	});
}

function removeStaleMarkers(
	args: TUseOverviewLayerReconcileArgs,
	nextMarkerDataByID: Map<string, TMapMarker>
): boolean {
	const {overviewLayerRef, overviewMarkersRef, visibleMarkerIDsRef, focusedOverviewIDRef, focusedOverviewCoordsRef} =
		args;
	let hasLayerChanges = false;

	for (const [assetID, marker] of overviewMarkersRef.current.entries()) {
		if (nextMarkerDataByID.has(assetID)) {
			continue;
		}
		if (visibleMarkerIDsRef.current.has(assetID)) {
			overviewLayerRef.current?.removeLayer(marker);
		}
		overviewMarkersRef.current.delete(assetID);
		visibleMarkerIDsRef.current.delete(assetID);
		if (focusedOverviewIDRef.current === assetID) {
			focusedOverviewIDRef.current = null;
			focusedOverviewCoordsRef.current = null;
		}
		hasLayerChanges = true;
	}

	return hasLayerChanges;
}

function syncSingleMarker(
	args: TUseOverviewLayerReconcileArgs,
	map: L.Map,
	markerData: TMapMarker,
	isGreyscale: boolean
): boolean {
	const assetID = markerData.immichID;
	const isMarkerVisible = true;
	const renderedMarkerData = resolveMarkerData(args, assetID, markerData);
	const hasEffectiveGreyscale = resolveMarkerGreyscale(args, assetID, isGreyscale);
	clearOptimisticSavedLocation(args, assetID, markerData);

	if (createMarkerIfMissing(args, map, renderedMarkerData, hasEffectiveGreyscale, isMarkerVisible)) {
		return true;
	}

	const existingMarker = args.overviewMarkersRef.current.get(assetID);
	if (!existingMarker) {
		return false;
	}

	let hasChanges = false;
	if (syncMarkerIcon(args, existingMarker, assetID, hasEffectiveGreyscale)) {
		hasChanges = true;
	}
	if (syncMarkerPosition(args, existingMarker, assetID, renderedMarkerData)) {
		hasChanges = true;
	}
	if (syncMarkerVisibility(args, existingMarker, assetID, isMarkerVisible)) {
		hasChanges = true;
	}
	return hasChanges;
}

function createMarkerIfMissing(
	args: TUseOverviewLayerReconcileArgs,
	map: L.Map,
	markerData: TMarkerRenderData,
	isGreyscale: boolean,
	isMarkerVisible: boolean
): boolean {
	const assetID = markerData.immichID;
	const existingMarker = args.overviewMarkersRef.current.get(assetID);
	if (existingMarker) {
		return false;
	}
	const marker = buildMarker(assetID, markerData, isGreyscale, args, map);
	args.overviewMarkersRef.current.set(assetID, marker);
	if (isMarkerVisible) {
		args.overviewLayerRef.current?.addLayer(marker);
		args.visibleMarkerIDsRef.current.add(assetID);
	}
	return true;
}

function syncMarkerPosition(
	args: TUseOverviewLayerReconcileArgs,
	existingMarker: L.Marker,
	assetID: string,
	renderedMarkerData: TMarkerRenderData
): boolean {
	const currentLatLng = existingMarker.getLatLng();
	if (currentLatLng.lat === renderedMarkerData.latitude && currentLatLng.lng === renderedMarkerData.longitude) {
		return false;
	}
	existingMarker.setLatLng([renderedMarkerData.latitude, renderedMarkerData.longitude]);
	if (args.focusedOverviewIDRef.current === assetID) {
		args.focusedOverviewCoordsRef.current = {lat: renderedMarkerData.latitude, lng: renderedMarkerData.longitude};
	}
	return true;
}

function syncMarkerVisibility(
	args: TUseOverviewLayerReconcileArgs,
	existingMarker: L.Marker,
	assetID: string,
	isMarkerVisible: boolean
): boolean {
	const isVisible = args.visibleMarkerIDsRef.current.has(assetID);
	if (isMarkerVisible && !isVisible) {
		args.overviewLayerRef.current?.addLayer(existingMarker);
		args.visibleMarkerIDsRef.current.add(assetID);
		return true;
	}
	if (!isMarkerVisible && isVisible) {
		args.overviewLayerRef.current?.removeLayer(existingMarker);
		args.visibleMarkerIDsRef.current.delete(assetID);
		clearFocusedMarker(args, assetID);
		return true;
	}
	return false;
}

function syncMarkerIcon(
	args: TUseOverviewLayerReconcileArgs,
	existingMarker: L.Marker,
	assetID: string,
	effectiveGreyscale: boolean
): boolean {
	const typedMarker = existingMarker as L.Marker & {markerGreyscale?: boolean};
	if (typedMarker.markerGreyscale === effectiveGreyscale) {
		return false;
	}
	const isSelected = args.selectedAssetIDsRef.current.has(assetID);
	existingMarker.setIcon(overviewIcon(assetID, isSelected, effectiveGreyscale));
	typedMarker.markerGreyscale = effectiveGreyscale;
	return true;
}

function clearOptimisticSavedLocation(
	args: TUseOverviewLayerReconcileArgs,
	assetID: string,
	markerData: TMapMarker
): void {
	if (args.pendingLocationsByAssetIDRef.current[assetID]) {
		return;
	}
	const savedLocation = args.savedLocationsByAssetIDRef.current[assetID];
	if (!savedLocation) {
		return;
	}
	if (savedLocation.latitude !== markerData.latitude) {
		return;
	}
	if (savedLocation.longitude !== markerData.longitude) {
		return;
	}
	args.clearSavedLocationsRef.current([assetID]);
}

function buildNextMarkerDataByID(mapMarkers: TMapMarker[]): Map<string, TMapMarker> {
	return new Map(mapMarkers.map(markerData => [markerData.immichID, markerData]));
}

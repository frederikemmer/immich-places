import L from 'leaflet';

import {clearGroupMoveArtifacts} from '@/features/map/groupMoveHelpers';
import {overviewIcon} from '@/features/map/icons';
import {
	MAP_FIT_SAME_SPOT_MAX_ZOOM,
	MAP_FLY_DURATION_SECONDS,
	MAP_LOCATION_SOURCE_MAP_CLICK,
	MAP_LOCATION_SOURCE_MARKER_DRAG
} from '@/utils/map';

import type {TMapMarker} from '@/shared/types/map';
import type {TUseOverviewLayerReconcileArgs} from '@/shared/types/mapLayer';

type TMarkerClickArgs = {
	assetID: string;
	markerData: TMarkerRenderData;
	isGreyscale: boolean;
	map: L.Map;
};

type TMarkerDragState = {wasDragged: boolean};

type TMarkerClickAction = 'assign-location' | 'focus-marker' | 'blur-marker';

export type TMarkerRenderData = {
	immichID: string;
	latitude: number;
	longitude: number;
};

export function resolveMarkerGreyscale(
	args: TUseOverviewLayerReconcileArgs,
	assetID: string,
	isGreyscale: boolean
): boolean {
	return isGreyscale || Boolean(args.pendingLocationsByAssetIDRef.current[assetID]?.isAlreadyApplied);
}

export function resolveMarkerData(
	args: TUseOverviewLayerReconcileArgs,
	assetID: string,
	markerData: TMapMarker
): TMarkerRenderData {
	const pendingLocation = args.pendingLocationsByAssetIDRef.current[assetID];
	if (pendingLocation) {
		return {
			immichID: markerData.immichID,
			latitude: pendingLocation.latitude,
			longitude: pendingLocation.longitude
		};
	}
	const savedLocation = args.savedLocationsByAssetIDRef.current[assetID];
	if (!savedLocation) {
		return markerData;
	}
	return {
		immichID: markerData.immichID,
		latitude: savedLocation.latitude,
		longitude: savedLocation.longitude
	};
}

export function buildMarker(
	assetID: string,
	markerData: TMapMarker,
	isGreyscale: boolean,
	args: TUseOverviewLayerReconcileArgs,
	map: L.Map
): L.Marker {
	const marker = createOverviewMarker(assetID, markerData, args, isGreyscale);
	const dragState: TMarkerDragState = {wasDragged: false};
	attachDragHandlers(marker, args, assetID, dragState);
	attachClickHandlers(marker, args, map, assetID, isGreyscale, dragState);
	return marker;
}

function createOverviewMarker(
	assetID: string,
	markerData: TMarkerRenderData,
	args: TUseOverviewLayerReconcileArgs,
	isGreyscale: boolean
): L.Marker {
	const marker = L.marker(L.latLng(markerData.latitude, markerData.longitude), {
		icon: overviewIcon(assetID, args.selectedAssetIDsRef.current.has(assetID), isGreyscale),
		zIndexOffset: 0,
		draggable: true
	});
	const overviewMarker = marker as L.Marker & {immichID: string; markerGreyscale: boolean};
	overviewMarker.immichID = assetID;
	overviewMarker.markerGreyscale = isGreyscale;
	return marker;
}

function attachDragHandlers(
	marker: L.Marker,
	args: TUseOverviewLayerReconcileArgs,
	assetID: string,
	dragState: TMarkerDragState
): void {
	marker.on('dragstart', () => {
		dragState.wasDragged = true;
	});

	marker.on('dragend', (event: L.DragEndEvent) => {
		const newLatLng = (event.target as L.Marker).getLatLng();
		let targetAssetIDs = [assetID];
		if (args.selectedAssetIDsRef) {
			const selectedAssetIDs = args.selectedAssetIDsRef.current;
			if (selectedAssetIDs.has(assetID)) {
				targetAssetIDs = [...selectedAssetIDs];
			}
		}
		args.setLocationRef.current({
			latitude: newLatLng.lat,
			longitude: newLatLng.lng,
			source: MAP_LOCATION_SOURCE_MARKER_DRAG,
			targetAssetIDs,
			shouldSkipPendingLocation: true
		});
		clearGroupMoveArtifacts(args.groupMovePillRef, args.groupAnchorMarkerRef, args.overviewLayerRef);
	});
}

function attachClickHandlers(
	marker: L.Marker,
	args: TUseOverviewLayerReconcileArgs,
	map: L.Map,
	assetID: string,
	isGreyscale: boolean,
	dragState: TMarkerDragState
): void {
	marker.on('click', (event: L.LeafletMouseEvent) => {
		const latestMarkerData = args.markerDataByIDRef.current.get(assetID);
		if (!latestMarkerData) {
			return;
		}
		if (dragState.wasDragged) {
			dragState.wasDragged = false;
			return;
		}
		L.DomEvent.stopPropagation(event);
		const isClickGreyscale = resolveMarkerGreyscale(args, assetID, isGreyscale);
		handleMarkerClick(args, marker, {
			assetID,
			markerData: resolveMarkerData(args, assetID, latestMarkerData),
			isGreyscale: isClickGreyscale,
			map
		});
	});

	marker.on('contextmenu', (event: L.LeafletMouseEvent) => {
		if (event.originalEvent) {
			event.originalEvent.preventDefault();
			event.originalEvent.stopPropagation();
		}
		const pendingEntry = args.pendingLocationsByAssetIDRef.current[assetID];
		const canResetPosition =
			pendingEntry?.source === 'gpx-import' &&
			!pendingEntry.isAlreadyApplied &&
			pendingEntry.hasExistingLocation &&
			pendingEntry.originalLatitude !== undefined &&
			pendingEntry.originalLongitude !== undefined;
		args.openContextMenuRef.current({
			type: 'marker',
			x: event.originalEvent.clientX,
			y: event.originalEvent.clientY,
			assetID,
			canResetPosition,
			originalLatitude: pendingEntry?.originalLatitude,
			originalLongitude: pendingEntry?.originalLongitude
		});
	});
}

function handleMarkerClick(args: TUseOverviewLayerReconcileArgs, marker: L.Marker, params: TMarkerClickArgs): void {
	const {assetID, markerData} = params;
	switch (resolveMarkerClickAction(args, assetID)) {
		case 'assign-location':
			args.setLocationRef.current({
				latitude: markerData.latitude,
				longitude: markerData.longitude,
				source: MAP_LOCATION_SOURCE_MAP_CLICK,
				targetAssetIDs: Array.from(args.selectedAssetIDsRef.current)
			});
			args.focusedOverviewIDRef.current = assetID;
			args.focusedOverviewCoordsRef.current = {lat: markerData.latitude, lng: markerData.longitude};
			return;
		case 'focus-marker': {
			const assetRow = args.resolveAssetByIDRef.current(assetID);
			if (assetRow) {
				args.toggleAssetRef.current(assetRow, 'single');
			}
			focusMarker(args, marker, assetID, markerData, params.isGreyscale);
			if (params.map.getZoom() < MAP_FIT_SAME_SPOT_MAX_ZOOM) {
				params.map.flyTo([markerData.latitude, markerData.longitude], MAP_FIT_SAME_SPOT_MAX_ZOOM, {
					duration: MAP_FLY_DURATION_SECONDS
				});
			}
			return;
		}
		case 'blur-marker': {
			const assetRow = args.resolveAssetByIDRef.current(assetID);
			if (assetRow) {
				args.toggleAssetRef.current(assetRow, 'single');
			}
			marker.setIcon(overviewIcon(assetID, false, params.isGreyscale));
			clearFocusedMarker(args, assetID);
			return;
		}
	}
}

function resolveMarkerClickAction(args: TUseOverviewLayerReconcileArgs, assetID: string): TMarkerClickAction {
	if (args.selectedAssetIDsRef.current.has(assetID)) {
		return 'blur-marker';
	}
	if (args.hasSelectionRef.current && !args.allSelectedHaveGPSRef.current) {
		return 'assign-location';
	}
	if (args.isSpiderfiedRef.current || args.focusedOverviewIDRef.current === assetID) {
		return 'blur-marker';
	}
	return 'focus-marker';
}

function focusMarker(
	args: TUseOverviewLayerReconcileArgs,
	marker: L.Marker,
	assetID: string,
	markerData: TMarkerRenderData,
	isGreyscale: boolean
): void {
	if (args.focusedOverviewIDRef.current) {
		const previousMarker = args.overviewMarkersRef.current.get(args.focusedOverviewIDRef.current);
		if (previousMarker) {
			previousMarker.setIcon(overviewIcon(args.focusedOverviewIDRef.current, false, isGreyscale));
		}
	}
	args.focusedOverviewIDRef.current = assetID;
	args.focusedOverviewCoordsRef.current = {lat: markerData.latitude, lng: markerData.longitude};
	marker.setIcon(overviewIcon(assetID, true, isGreyscale));
}

export function clearFocusedMarker(args: TUseOverviewLayerReconcileArgs, assetID: string): void {
	if (args.focusedOverviewIDRef.current !== assetID) {
		return;
	}
	args.focusedOverviewIDRef.current = null;
	args.focusedOverviewCoordsRef.current = null;
}

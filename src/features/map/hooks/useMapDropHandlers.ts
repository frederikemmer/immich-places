'use client';

import L from 'leaflet';
import {useCallback} from 'react';

import {DRAG_DROP_EFFECT_MOVE, DRAG_DROP_MIME_TEXT} from '@/utils/dragDrop';

import type {TAssetRow} from '@/shared/types/asset';
import type {DragEvent, MutableRefObject} from 'react';

type TUseMapDropHandlersArgs = {
	mapInstanceRef: MutableRefObject<L.Map | null>;
	containerRef: MutableRefObject<HTMLDivElement | null>;
	resolveAssetByID: (assetID: string) => TAssetRow | null;
	onDropAction?: (asset: TAssetRow, position: {latitude: number; longitude: number}) => void;
};

/**
 * Return contract for map drag/drop handlers.
 */
type TUseMapDropHandlersReturn = {
	handleDragOver: (event: DragEvent<HTMLDivElement>) => void;
	handleDrop: (event: DragEvent<HTMLDivElement>) => void;
};

/**
 * Manages drag-over/drop interaction and converts cursor position to map coordinates.
 *
 * @param params - Map and drop handler inputs.
 * @returns Event handlers used by map container.
 */
export function useMapDropHandlers({
	mapInstanceRef,
	containerRef,
	resolveAssetByID,
	onDropAction
}: TUseMapDropHandlersArgs): TUseMapDropHandlersReturn {
	const handleDragOver = useCallback((event: DragEvent<HTMLDivElement>) => {
		event.preventDefault();
		if (event.dataTransfer) {
			event.dataTransfer.dropEffect = DRAG_DROP_EFFECT_MOVE;
		}
	}, []);

	const handleDrop = useCallback(
		(event: DragEvent<HTMLDivElement>) => {
			event.preventDefault();
			const mapInstance = mapInstanceRef.current;
			const container = containerRef.current;
			if (!mapInstance || !container) {
				return;
			}

			const dataTransfer = event.dataTransfer;
			if (!dataTransfer) {
				return;
			}
			const assetID = dataTransfer.getData(DRAG_DROP_MIME_TEXT);
			if (!assetID) {
				return;
			}

			const rect = container.getBoundingClientRect();
			if (!rect) {
				return;
			}

			const point = L.point(event.clientX - rect.left, event.clientY - rect.top);
			const latlng = mapInstance.containerPointToLatLng(point);

			const droppedAsset = resolveAssetByID(assetID);
			if (!droppedAsset) {
				return;
			}
			onDropAction?.(droppedAsset, {latitude: latlng.lat, longitude: latlng.lng});
		},
		[mapInstanceRef, containerRef, resolveAssetByID, onDropAction]
	);

	return {handleDragOver, handleDrop};
}

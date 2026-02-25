'use client';

import {useEffect} from 'react';

import type {TAssetRow} from '@/shared/types/asset';

/**
 * Inputs used by focused-asset selection synchronizer.
 */
type TUsePhotoGridFocusArgs = {
	focusedAssetID: string | null;
	assets: TAssetRow[];
	toggleAssetAction: (asset: TAssetRow, mode?: 'single' | 'additive') => void;
	clearFocusedAssetAction: () => void;
};

/**
 * Looks up focused asset index in the provided list.
 *
 * @param assets - Current grid assets.
 * @param focusedAssetID - Asset id to find.
 * @returns Zero-based index, or -1 when no match.
 */
function getAssetIndex(assets: TAssetRow[], focusedAssetID: string | null): number {
	if (!focusedAssetID) {
		return -1;
	}
	return assets.findIndex(asset => asset.immichID === focusedAssetID);
}

/**
 * Syncs focused asset state into selection when focus moves into the grid.
 *
 * When focus lands on an asset in the current page, this selects it once and
 * clears the global focused marker to avoid repeat selection side effects.
 *
 * @param args - Focus context and selection callbacks.
 */
export function usePhotoGridFocusSelection({
	focusedAssetID,
	assets,
	toggleAssetAction,
	clearFocusedAssetAction
}: TUsePhotoGridFocusArgs): void {
	useEffect(() => {
		const targetIndex = getAssetIndex(assets, focusedAssetID);
		if (targetIndex === -1) {
			return;
		}
		const targetAsset = assets[targetIndex];
		if (!targetAsset) {
			return;
		}
		toggleAssetAction(targetAsset, 'single');
		clearFocusedAssetAction();
	}, [assets, focusedAssetID, toggleAssetAction, clearFocusedAssetAction]);
}

/**
 * Inputs used by focused-asset scroll synchronizer.
 */
type TUsePhotoGridScrollArgs = {
	focusedAssetID: string | null;
	assets: TAssetRow[];
	rowHeight: number;
	gridColumns: number;
	viewportHeight: number;
	scrollContainerRef: React.RefObject<HTMLDivElement | null>;
};

/**
 * Scrolls the grid so the focused asset is centered in the viewport.
 *
 * @param args - Focus target and computed geometry values.
 */
export function usePhotoGridFocusScroll({
	focusedAssetID,
	assets,
	rowHeight,
	gridColumns,
	viewportHeight,
	scrollContainerRef
}: TUsePhotoGridScrollArgs): void {
	useEffect(() => {
		const targetIndex = getAssetIndex(assets, focusedAssetID);
		if (targetIndex === -1) {
			return;
		}
		const targetRow = Math.floor(targetIndex / gridColumns);
		const targetTop = Math.max(0, targetRow * rowHeight - viewportHeight / 2 + rowHeight / 2);
		scrollContainerRef.current?.scrollTo({top: targetTop, behavior: 'smooth'});
	}, [assets, focusedAssetID, gridColumns, rowHeight, scrollContainerRef, viewportHeight]);
}

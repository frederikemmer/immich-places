'use client';

import {useEffect, useRef} from 'react';

import type {TAssetRow} from '@/shared/types/asset';

/**
 * Keeps selected-lightbox state coherent with the current single selection.
 *
 * If a lightbox is open and the selected set changes to a different single asset,
 * the hook updates the active lightbox asset to the selected asset.
 *
 * @param selectedAssets - Currently selected asset list from catalog context.
 * @param lightboxAssetID - Active lightbox asset identifier.
 * @param setLightboxAssetID - Setter used to update the active lightbox id.
 */
export function useLightboxSelectionSync(
	selectedAssets: TAssetRow[],
	lightboxAssetID: string | null,
	setLightboxAssetID: (assetID: string | null) => void
): void {
	const previousSelectedAssetsRef = useRef<string[]>([]);

	useEffect(() => {
		if (selectedAssets.length !== 1) {
			previousSelectedAssetsRef.current = selectedAssets.map(asset => asset.immichID);
			return;
		}

		const selectedAssetID = selectedAssets[0].immichID;
		const isMatchingLightbox = selectedAssetID === lightboxAssetID;
		if (isMatchingLightbox) {
			previousSelectedAssetsRef.current = [selectedAssetID];
			return;
		}

		const previousSelectedAssetID =
			previousSelectedAssetsRef.current.length === 1 ? previousSelectedAssetsRef.current[0] : null;
		if (previousSelectedAssetID !== null && previousSelectedAssetID === lightboxAssetID) {
			setLightboxAssetID(selectedAssetID);
		}
		previousSelectedAssetsRef.current = [selectedAssetID];
	}, [selectedAssets, lightboxAssetID, setLightboxAssetID]);
}

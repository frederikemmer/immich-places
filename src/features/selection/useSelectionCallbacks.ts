'use client';

import {useCallback} from 'react';

type TUseSelectionCallbacksArgs = {
	removeAsset: (assetID: string) => void;
	refreshHealth: () => Promise<void>;
	loadAlbumsAction: () => Promise<void>;
};

/**
 * Return contract for side-effect callbacks tied to selection persistence flow.
 */
type TUseSelectionCallbacksResult = {
	onAssetSavedAction: (assetID: string) => void;
	onBatchSavedAction: () => Promise<void>;
};

/**
 * Provides reusable callbacks for selection persistence side effects.
 *
 * - `onAssetSavedAction` updates local catalog state for single saves.
 * - `onBatchSavedAction` refreshes health and album data after batch saves.
 *
 * @param args - Callback dependencies from application context/services.
 * @returns Wrapped callbacks ready for controller wiring.
 */
export function useSelectionCallbacks({
	removeAsset,
	refreshHealth,
	loadAlbumsAction
}: TUseSelectionCallbacksArgs): TUseSelectionCallbacksResult {
	const onAssetSavedAction = useCallback(
		(assetID: string) => {
			removeAsset(assetID);
		},
		[removeAsset]
	);

	const onBatchSavedAction = useCallback(async () => {
		await Promise.all([refreshHealth(), loadAlbumsAction()]);
	}, [refreshHealth, loadAlbumsAction]);

	return {onAssetSavedAction, onBatchSavedAction};
}

'use client';

import {useCallback, useRef, useState} from 'react';

import type {TAssetRow} from '@/shared/types/asset';
import type {TPendingLocation, TPendingLocationsByAssetID} from '@/shared/types/map';
import type {Dispatch, SetStateAction} from 'react';

/** Selection interaction mode supported by asset selection helpers. */
export type TSelectMode = 'single' | 'additive';

/** Selection state hook return contract used across controller and UI features. */
type TUseSelectionStateReturn = {
	selectedAssets: TAssetRow[];
	pendingLocation: TPendingLocation | null;
	pendingLocationsByAssetID: TPendingLocationsByAssetID;
	savedLocationsByAssetID: TPendingLocationsByAssetID;
	error: string | null;
	setError: (value: string | null) => void;
	setSelectedAssets: Dispatch<SetStateAction<TAssetRow[]>>;
	setPendingLocation: Dispatch<SetStateAction<TPendingLocation | null>>;
	setSavedLocationsByAssetID: Dispatch<SetStateAction<TPendingLocationsByAssetID>>;
	toggleAsset: (asset: TAssetRow, mode?: TSelectMode) => void;
	shiftSelect: (asset: TAssetRow, allAssets: TAssetRow[]) => void;
	selectAll: (assets: TAssetRow[]) => void;
	clearSelection: () => void;
	setLocation: (
		latitude: number,
		longitude: number,
		source: TPendingLocation['source'],
		targetAssetIDs?: string[],
		skipPendingLocation?: boolean
	) => void;
	clearLocation: (clearPendingOnly?: boolean) => void;
	setPendingLocationsByAssetID: Dispatch<SetStateAction<TPendingLocationsByAssetID>>;
};

function resolveAnchorID(lastClickedID: string | null, nextSelected: TAssetRow[]): string | null {
	if (nextSelected.length === 0) {
		return null;
	}
	if (!lastClickedID) {
		return nextSelected[0].immichID;
	}

	const matchingAsset = nextSelected.find(asset => asset.immichID === lastClickedID);
	if (matchingAsset) {
		return matchingAsset.immichID;
	}
	return nextSelected[0].immichID;
}

function buildTargetAssetIDs(targetAssetIDs: string[] | undefined, selectedAssetIDs: string[]): string[] {
	if (targetAssetIDs && targetAssetIDs.length > 0) {
		return Array.from(new Set(targetAssetIDs));
	}
	if (selectedAssetIDs.length === 0) {
		return [];
	}
	return selectedAssetIDs;
}

function createPendingLocation(
	latitude: number,
	longitude: number,
	source: TPendingLocation['source']
): TPendingLocation {
	return {latitude, longitude, source};
}

/**
 * Centralizes selection state and low-level update operations.
 *
 * Maintains selected assets, pending map coordinates, and the anchor used for shift-range selection.
 */
export function useSelectionState(): TUseSelectionStateReturn {
	const [selectedAssets, setSelectedAssets] = useState<TAssetRow[]>([]);
	const [pendingLocation, setPendingLocation] = useState<TPendingLocation | null>(null);
	const [pendingLocationsByAssetID, setPendingLocationsByAssetID] = useState<TPendingLocationsByAssetID>({});
	const [savedLocationsByAssetID, setSavedLocationsByAssetID] = useState<TPendingLocationsByAssetID>({});
	const [error, setError] = useState<string | null>(null);
	const lastClickedID = useRef<string | null>(null);
	const selectedAssetsRef = useRef<TAssetRow[]>(selectedAssets);
	selectedAssetsRef.current = selectedAssets;

	const updateAnchor = useCallback((nextSelected: TAssetRow[]): void => {
		lastClickedID.current = resolveAnchorID(lastClickedID.current, nextSelected);
	}, []);

	const toggleAsset = useCallback(
		(asset: TAssetRow, mode: TSelectMode = 'single') => {
			if (mode === 'additive') {
				setSelectedAssets(prev => {
					const isSelected = prev.some(a => a.immichID === asset.immichID);
					if (isSelected) {
						const next = prev.filter(a => a.immichID !== asset.immichID);
						updateAnchor(next);
						return next;
					}
					updateAnchor([...prev, asset]);
					return [...prev, asset];
				});
			} else {
				setSelectedAssets(prev => {
					const isSelected = prev.some(a => a.immichID === asset.immichID);
					if (isSelected && prev.length === 1) {
						updateAnchor([]);
						return [];
					}
					updateAnchor([asset]);
					return [asset];
				});
			}

			setError(null);
		},
		[updateAnchor]
	);

	const shiftSelect = useCallback(
		(asset: TAssetRow, allAssets: TAssetRow[]) => {
			if (!lastClickedID.current) {
				toggleAsset(asset, 'single');
				return;
			}
			const anchorIdx = allAssets.findIndex(a => a.immichID === lastClickedID.current);
			const targetIdx = allAssets.findIndex(a => a.immichID === asset.immichID);
			if (anchorIdx === -1 || targetIdx === -1) {
				toggleAsset(asset, 'single');
				return;
			}

			const start = Math.min(anchorIdx, targetIdx);
			const end = Math.max(anchorIdx, targetIdx);
			const rangeAssets = allAssets.slice(start, end + 1);
			const rangeIDs = new Set(rangeAssets.map(a => a.immichID));

			setSelectedAssets(prev => {
				const isTargetSelected = prev.some(a => a.immichID === asset.immichID);
				let next = prev;
				if (isTargetSelected) {
					next = prev.filter(a => !rangeIDs.has(a.immichID));
				} else {
					const existingIDs = new Set(prev.map(a => a.immichID));
					next = [...prev];
					for (const item of rangeAssets) {
						if (!existingIDs.has(item.immichID)) {
							next.push(item);
						}
					}
				}
				updateAnchor(next);
				return next;
			});
			setError(null);
		},
		[updateAnchor, toggleAsset]
	);

	const selectAll = useCallback(
		(assets: TAssetRow[]) => {
			setSelectedAssets(() => {
				const next = [...assets];
				updateAnchor(next);
				if (next.length === 0) {
					return [];
				}
				return next;
			});
			setError(null);
		},
		[updateAnchor]
	);

	const clearSelection = useCallback(() => {
		setSelectedAssets([]);
		setPendingLocation(null);
		setPendingLocationsByAssetID({});
		setSavedLocationsByAssetID({});
		lastClickedID.current = null;
		setError(null);
	}, [setError, setPendingLocation, setPendingLocationsByAssetID, setSavedLocationsByAssetID, setSelectedAssets]);

	const clearLocation = useCallback((clearPendingOnly?: boolean) => {
		setPendingLocation(null);
		if (!clearPendingOnly) {
			setPendingLocationsByAssetID({});
		}
		setError(null);
	}, []);

	const setLocation = useCallback(
		(
			latitude: number,
			longitude: number,
			source: TPendingLocation['source'],
			targetAssetIDs?: string[],
			skipPendingLocation?: boolean
		) => {
			const selectedAssetIDs = selectedAssetsRef.current.map(asset => asset.immichID);
			const nextAssetIDs = buildTargetAssetIDs(targetAssetIDs, selectedAssetIDs);
			const nextPendingLocation = createPendingLocation(latitude, longitude, source);
			if (skipPendingLocation) {
				setPendingLocation(null);
			} else {
				setPendingLocation(nextPendingLocation);
			}
			setSavedLocationsByAssetID(prev => {
				const next = {...prev};
				for (const assetID of nextAssetIDs) {
					delete next[assetID];
				}
				return next;
			});
			if (nextAssetIDs.length > 0) {
				setPendingLocationsByAssetID(prev => {
					const next = {...prev};
					for (const assetID of nextAssetIDs) {
						next[assetID] = nextPendingLocation;
					}
					return next;
				});
			}
			setError(null);
		},
		[]
	);

	return {
		selectedAssets,
		pendingLocation,
		pendingLocationsByAssetID,
		savedLocationsByAssetID,
		error,
		setError,
		setSelectedAssets,
		setPendingLocation,
		setSavedLocationsByAssetID,
		toggleAsset,
		shiftSelect,
		selectAll,
		clearSelection,
		setLocation,
		clearLocation,
		setPendingLocationsByAssetID
	};
}

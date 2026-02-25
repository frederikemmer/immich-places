'use client';

import {useCallback, useMemo, useState} from 'react';

import {SAVE_LOCATION_ERROR_MESSAGE} from '@/features/selection/constant';
import {useSelection} from '@/shared/context/AppContext';
import {LOCATION_CONFIRM_COORDINATES_DECIMALS} from '@/utils/locationAssignment';

import type {TPendingLocation} from '@/shared/types/map';
import type {ReactElement} from 'react';

/**
 * Floating confirmation bar for applying pending locations to edited assets.
 *
 * Displays edited count, pending coordinates, error state, and Save/Cancel actions.
 *
 * @returns Confirmation UI, or `null` when no unsaved edits exist.
 */
export function LocationConfirm(): ReactElement | null {
	const {
		pendingLocation,
		pendingLocationsByAssetID,
		selectedAssets,
		isSaving,
		saveError,
		saveAction,
		clearLocationAction
	} = useSelection();
	const [localSaveError, setLocalSaveError] = useState<string | null>(null);

	const pendingAssetIDs = useMemo(() => Object.keys(pendingLocationsByAssetID), [pendingLocationsByAssetID]);
	const pendingImageCount = pendingAssetIDs.length;
	const selectedImageCount = selectedAssets.length;
	const editedImageCount = pendingImageCount > 0 ? pendingImageCount : selectedImageCount;
	let editedImageLabel = 'photos';
	if (editedImageCount === 1) {
		editedImageLabel = 'photo';
	}

	const visibleError = saveError || localSaveError;
	const referencePendingLocation = useMemo<TPendingLocation | null>(() => {
		if (pendingLocation) {
			return pendingLocation;
		}
		if (pendingAssetIDs.length === 0) {
			return null;
		}
		return pendingLocationsByAssetID[pendingAssetIDs[0]] ?? null;
	}, [pendingAssetIDs, pendingLocation, pendingLocationsByAssetID]);
	const referenceCoordinateLabel = useMemo<string | null>(() => {
		if (pendingLocation) {
			return `${pendingLocation.latitude.toFixed(LOCATION_CONFIRM_COORDINATES_DECIMALS)}, ${pendingLocation.longitude.toFixed(LOCATION_CONFIRM_COORDINATES_DECIMALS)}`;
		}
		if (pendingAssetIDs.length === 0) {
			return null;
		}
		const seenCoordinates = new Set<string>();
		const firstLocation = pendingLocationsByAssetID[pendingAssetIDs[0]];
		if (!firstLocation) {
			return null;
		}
		seenCoordinates.add(`${firstLocation.latitude},${firstLocation.longitude}`);
		for (const assetID of pendingAssetIDs.slice(1)) {
			const location = pendingLocationsByAssetID[assetID];
			if (!location) {
				continue;
			}
			seenCoordinates.add(`${location.latitude},${location.longitude}`);
			if (seenCoordinates.size > 1) {
				return 'Multiple coordinates';
			}
		}
		if (firstLocation) {
			return `${firstLocation.latitude.toFixed(LOCATION_CONFIRM_COORDINATES_DECIMALS)}, ${firstLocation.longitude.toFixed(LOCATION_CONFIRM_COORDINATES_DECIMALS)}`;
		}
		return null;
	}, [pendingAssetIDs, pendingLocation, pendingLocationsByAssetID]);

	const handleSave = useCallback(async () => {
		setLocalSaveError(null);
		try {
			const result = await saveAction();
			if (result.status === 'partial') {
				setLocalSaveError(result.errorMessage);
			}
		} catch {
			setLocalSaveError(SAVE_LOCATION_ERROR_MESSAGE);
		}
	}, [saveAction]);

	const handleCancel = useCallback(() => {
		clearLocationAction();
	}, [clearLocationAction]);

	if ((pendingImageCount === 0 && selectedImageCount === 0) || !referencePendingLocation) {
		return null;
	}

	const shouldDisableSave = isSaving;

	return (
		<div
			className={
				'w-full min-w-md flex items-center gap-3 rounded-lg bg-(--color-surface) px-4 py-2.5 shadow-[0_2px_8px_rgba(0,0,0,0.1)]'
			}>
			<div className={'flex min-w-0 flex-1 flex-col gap-0.5'}>
				<span className={'block truncate text-[0.8125rem] font-medium'}>
					{editedImageCount}
					{' edited image'}
					{editedImageLabel === 'photos' ? 's' : ''}
				</span>
				<span className={'block font-mono text-[0.75rem] text-(--color-text-secondary)'}>
					{referenceCoordinateLabel}
				</span>
			</div>
			{visibleError && <div className={'text-[0.75rem] text-[#b91c1c]'}>{visibleError}</div>}
			<div className={'flex shrink-0 gap-2'}>
				<button
					className={
						'cursor-pointer rounded-md border border-(--color-border) bg-(--color-bg) px-3 py-1.5 text-[0.8125rem] text-(--color-text) transition-all duration-150 hover:border-(--color-text-secondary) disabled:cursor-not-allowed disabled:opacity-50'
					}
					onClick={handleCancel}
					disabled={shouldDisableSave}>
					{'Cancel'}
				</button>
				<button
					className={
						'cursor-pointer rounded-md border-0 bg-(--color-primary) px-3 py-1.5 text-[0.8125rem] font-medium text-white transition-opacity duration-150 hover:enabled:opacity-90 disabled:cursor-not-allowed disabled:opacity-50'
					}
					onClick={handleSave}
					disabled={shouldDisableSave}>
					{isSaving ? 'Saving...' : 'Save Location'}
				</button>
			</div>
		</div>
	);
}

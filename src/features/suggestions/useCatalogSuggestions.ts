'use client';

import {useMemo} from 'react';

import {useSuggestions} from '@/features/suggestions/useSuggestions';

import type {TCatalogContextValue, TSelectionContextValue, TViewContextValue} from '@/shared/types/context';

type TUseCatalogSuggestionsArgs = {
	selectedAssets: TSelectionContextValue['selectedAssets'];
	viewMode: TViewContextValue['viewMode'];
	selectedAlbumID: string | null;
	albums: TCatalogContextValue['albums'];
};

/**
 * Finds first selected asset without GPS coordinates.
 *
 * @param selectedAssets - Current selected assets.
 * @returns ID of first asset missing location, otherwise null.
 */
function useNoGPSSelectedAssetID(selectedAssets: TSelectionContextValue['selectedAssets']): string | null {
	return useMemo(() => {
		const noGPSAsset = selectedAssets.find(asset => asset.latitude === null || asset.longitude === null);
		return noGPSAsset?.immichID ?? null;
	}, [selectedAssets]);
}

/**
 * Maps catalog + UI context into suggestion payload required by the suggestion panel.
 *
 * Excludes frequent locations in album mode and selects the active album entity.
 *
 * @param args - Selection, view, and catalog context inputs.
 * @returns Suggestions, categories, error state, and selected album.
 */
export function useCatalogSuggestions({
	selectedAssets,
	viewMode,
	selectedAlbumID,
	albums
}: TUseCatalogSuggestionsArgs): Pick<
	TCatalogContextValue,
	'suggestions' | 'categories' | 'suggestionsError' | 'selectedAlbum'
> {
	const firstSelectedID = useNoGPSSelectedAssetID(selectedAssets);
	const shouldExcludeFrequentLocations = viewMode === 'album' && selectedAlbumID !== null;
	const {
		suggestions,
		categories,
		error: suggestionsError
	} = useSuggestions(firstSelectedID, selectedAlbumID, shouldExcludeFrequentLocations);
	const selectedAlbum = albums.find(album => album.immichID === selectedAlbumID) ?? null;

	return {suggestions, categories, suggestionsError, selectedAlbum};
}

export type TAlbumRow = {
	immichID: string;
	albumName: string;
	thumbnailAssetID: string | null;
	assetCount: number;
	filteredCount: number;
	noGPSCount: number;
	updatedAt: string;
	startDate: string | null;
};

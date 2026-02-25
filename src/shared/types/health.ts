export type THealthResponse = {
	status: string;
	syncedAssets: number;
	noGPSAssets: number;
	lastSyncAt: string | null;
	immichURL: string;
};

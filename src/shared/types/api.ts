export type TRequestOptions = {
	signal?: AbortSignal;
	timeoutMs?: number;
};

export type TViewportBounds = {
	north: number;
	south: number;
	east: number;
	west: number;
};

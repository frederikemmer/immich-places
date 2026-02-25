import {getClientBackendBaseURL} from '@/utils/client';

const BACKEND_BASE = getClientBackendBaseURL();

/**
 * Returns the configured backend base URL used by UI-facing services.
 *
 * @returns Backend service base URL string.
 */
export function getBackendBaseURL(): string {
	return BACKEND_BASE;
}

/**
 * Builds a stable thumbnail URL for a specific asset.
 *
 * @param assetID - Asset identifier.
 * @returns Relative API URL pointing to the asset thumbnail endpoint.
 */
export function thumbnailURL(assetID: string): string {
	return `${BACKEND_BASE}/assets/${encodeURIComponent(assetID)}/thumbnail`;
}

/**
 * Builds a stable preview URL for a specific asset.
 *
 * @param assetID - Asset identifier.
 * @returns Relative API URL pointing to the asset preview endpoint.
 */
export function previewURL(assetID: string): string {
	return `${BACKEND_BASE}/assets/${encodeURIComponent(assetID)}/preview`;
}

/**
 * Builds a link to the Immich web photo route when the base URL is valid.
 *
 * @param immichURL - Immich web base URL.
 * @param assetID - Asset identifier.
 * @returns Normalized web URL or `null` when URL is invalid or unsupported.
 */
export function immichPhotoURL(immichURL: string, assetID: string): string | null {
	if (!immichURL) {
		return null;
	}
	try {
		const base = new URL(immichURL);
		if (base.protocol !== 'http:' && base.protocol !== 'https:') {
			return null;
		}
		return new URL(`/photos/${encodeURIComponent(assetID)}`, base).toString();
	} catch {
		return null;
	}
}

const DEFAULT_BACKEND_BASE_URL = '/api/backend';

/**
 * Returns backend base URL from environment or the default API path.
 *
 * @returns Backend base URL used by API helpers.
 */
export function getClientBackendBaseURL(): string {
	return process.env.NEXT_PUBLIC_BACKEND_BASE || DEFAULT_BACKEND_BASE_URL;
}

/**
 * Geocoding integration constants.
 */
/** Public Nominatim host used for geocode requests. */
export const NOMINATIM_BASE_URL = 'https://nominatim.openstreetmap.org';
/** Internal reverse geocoding proxy route. */
export const LOCAL_GEOCODE_SEARCH_PATH = '/api/geocode/search';
/** Default number of geocode suggestions to request. */
export const DEFAULT_GEOCODE_RESULT_LIMIT = 5;
/** Maximum number of geocode suggestions to request. */
export const MAX_GEOCODE_RESULT_LIMIT = 10;
/** Minimum query length to run geocode search. */
export const GEOCODE_QUERY_MIN_LENGTH = 2;
/** Maximum query length accepted for geocode search. */
export const GEOCODE_QUERY_MAX_LENGTH = 200;
/** Upstream geocoding request timeout in milliseconds. */
export const GEOCODE_UPSTREAM_TIMEOUT_MS = 4000;

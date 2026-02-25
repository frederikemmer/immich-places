/**
 * Place search history constants used by local persistence and cleanup windows.
 */
/** Maximum number of place suggestions persisted in history. */
export const PLACE_SEARCH_HISTORY_MAX_ITEMS = 8;
/** Expiration window for place history entries in milliseconds (30 days). */
export const PLACE_SEARCH_HISTORY_TTL_MS = 30 * 24 * 60 * 60 * 1000;
/** Decimal precision when deduplicating/serializing coordinates in history. */
export const PLACE_SEARCH_HISTORY_COORDINATE_DECIMALS = 3;

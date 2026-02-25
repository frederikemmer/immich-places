/**
 * Sync polling strategy constants.
 */
/** Initial polling delay in milliseconds for sync status polling. */
export const RESYNC_INITIAL_POLL_DELAY_MS = 2_000;
/** Maximum polling delay in milliseconds while awaiting sync completion. */
export const RESYNC_MAX_POLL_DELAY_MS = 10_000;
/** Maximum total time spent polling before giving up. */
export const RESYNC_MAX_POLL_DURATION_MS = 5 * 60 * 1000;
/** Exponential backoff multiplier applied between successful polls. */
export const RESYNC_BACKOFF_MULTIPLIER = 1.5;

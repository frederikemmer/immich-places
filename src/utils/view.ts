import {normalizePositiveInteger} from '@/utils/math';

import type {TGPSFilter} from '@/shared/types/map';
import type {TViewMode} from '@/shared/types/view';

/**
 * Default rendering behavior for gallery view mode and filters.
 */
/** Default view mode for catalog rendering. */
export const VIEW_MODE_DEFAULT: TViewMode = 'album';
/** GPS filter selecting assets with geolocation. */
export const GPS_FILTER_WITH_GPS: TGPSFilter = 'with-gps';
/** Default GPS filter. */
export const GPS_FILTER_DEFAULT: TGPSFilter = GPS_FILTER_WITH_GPS;
/** Alias for no-GPS filter. */
export const GPS_FILTER_NO_GPS: TGPSFilter = 'no-gps';
/** Default number of items per page. */
export const DEFAULT_PAGE_SIZE = 90;
/** Default grid column count. */
export const DEFAULT_GRID_COLUMNS = 3;

/** Allowed page size options available in pagination controls. */
export const PAGE_SIZE_OPTIONS = [30, 60, 90, 120] as const;
/** Allowed grid column options available in view controls. */
export const GRID_COLUMN_OPTIONS = [1, 2, 3, 4] as const;

/** Query key for GPS filter. */
export const URL_PARAM_GPS_FILTER = 'gps';
/** Query key for view mode. */
export const URL_PARAM_VIEW_MODE = 'view';
/** Query key for album id. */
export const URL_PARAM_ALBUM_ID = 'album';
/** Query key for page size. */
export const URL_PARAM_PAGE_SIZE = 'pageSize';
/** Query key for grid columns. */
export const URL_PARAM_GRID_COLUMNS = 'gridCols';

/**
 * Checks whether the active filter is with-GPS.
 *
 * @param gpsFilter - Filter value from state or URL.
 * @returns `true` for with-gps filter.
 */
export function isGPSFilterWithLocations(gpsFilter: TGPSFilter): boolean {
	return gpsFilter === GPS_FILTER_WITH_GPS;
}

/**
 * Checks whether the active filter is no-GPS.
 *
 * @param gpsFilter - Filter value from state or URL.
 * @returns `true` for no-gps filter.
 */
export function isGPSFilterWithoutLocations(gpsFilter: TGPSFilter): boolean {
	return gpsFilter === GPS_FILTER_NO_GPS;
}

/**
 * Normalizes page size with fallback to avoid invalid values.
 *
 * @param value - Raw page-size input.
 * @param fallback - Fallback value when normalized size is invalid.
 * @returns Normalized page-size integer.
 */
export function normalizePageSize(value: number, fallback: number): number {
	return normalizePositiveInteger(value, fallback);
}

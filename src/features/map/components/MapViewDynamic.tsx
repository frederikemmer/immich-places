'use client';

import {createMapDynamic} from '@/features/map/components/createMapDynamic';

/**
 * Lazy-loaded dynamic version of {@link MapView} for route-level code splitting.
 *
 * @see createMapDynamic
 */
export const MapViewDynamic = createMapDynamic(async () =>
	import('@/features/map/components/MapView').then(mod => mod.MapView)
);

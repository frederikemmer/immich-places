'use client';

import {createMapDynamic} from '@/features/map/components/createMapDynamic';

/**
 * Lazy-loaded auth map component for client bundles.
 */
export const AuthMapDynamic = createMapDynamic(async () => import('@/features/auth/AuthMap').then(mod => mod.AuthMap));

'use client';

import dynamic from 'next/dynamic';

import type {ComponentType} from 'react';

type TDynamicMapLoader<TProps extends object> = () => Promise<ComponentType<TProps>>;

/**
 * Creates a client-only dynamically loaded map component wrapper.
 *
 * @typeParam TProps - Component props supported by the loaded map module.
 * @param loader - Async loader function passed to `next/dynamic`.
 * @returns Dynamic component with SSR disabled and a loading placeholder.
 */
export function createMapDynamic<TProps extends object>(loader: TDynamicMapLoader<TProps>): ComponentType<TProps> {
	return dynamic<TProps>(loader, {
		ssr: false,
		loading: () => (
			<div
				className={'relative h-full w-full overflow-hidden rounded-xl border border-(--color-border) bg-white'}
			/>
		)
	});
}

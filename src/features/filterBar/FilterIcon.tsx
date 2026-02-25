'use client';

import type {ReactElement} from 'react';

/**
 * Filter icon used in the filter bar tool controls.
 *
 * @returns A compact SVG icon for filter actions.
 */
export function FilterIcon(): ReactElement {
	return (
		<svg
			width={'12'}
			height={'12'}
			viewBox={'0 0 16 16'}
			fill={'currentColor'}>
			<path d={'M1.5 1.5h13l-5 6v5l-3 2v-7z'} />
		</svg>
	);
}

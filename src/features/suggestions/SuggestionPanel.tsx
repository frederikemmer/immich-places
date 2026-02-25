'use client';

import {RecentPill} from '@/features/suggestions/RecentPill';
import {SuggestionsPill} from '@/features/suggestions/SuggestionsPill';
import {useCatalog} from '@/shared/context/AppContext';

import type {ReactElement} from 'react';

/**
 * Wrapper panel that hosts suggestion pills and displays catalog suggestion errors.
 *
 * @returns Suggestion UI row with suggestion and recent-location pills.
 */
export function SuggestionPanel(): ReactElement {
	const {suggestionsError} = useCatalog();

	return (
		<div className={'mt-2'}>
			<div className={'flex items-start gap-2'}>
				<SuggestionsPill />
				<RecentPill />
			</div>
			{suggestionsError && (
				<p
					className={
						'mt-1 rounded-md bg-white/75 px-2 py-1 text-[11px] text-[#b91c1c] shadow-sm backdrop-blur-sm'
					}>
					{suggestionsError}
				</p>
			)}
		</div>
	);
}

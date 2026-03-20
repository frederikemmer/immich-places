'use client';

import {togglePillClass} from '@/utils/togglePill';

import type {TGPXStatusFilter} from '@/shared/types/map';
import type {ReactElement} from 'react';

type TGPXStatusFilterGroupProps = {
	gpxStatusFilter: TGPXStatusFilter;
	onGPXStatusFilterAction: (filter: TGPXStatusFilter) => void;
};

const GPX_STATUS_LABEL: Record<TGPXStatusFilter, string> = {
	all: 'All',
	alreadySet: 'Already Set',
	new: 'New',
	edited: 'Edited'
};

const gpxStatusOptions: readonly TGPXStatusFilter[] = ['all', 'alreadySet', 'new', 'edited'];

export function GPXStatusFilterGroup({
	gpxStatusFilter,
	onGPXStatusFilterAction
}: TGPXStatusFilterGroupProps): ReactElement {
	return (
		<div className={'flex-1 rounded-lg bg-(--color-bg) p-2.5'}>
			<div
				className={
					'mb-1 text-[0.5625rem] font-semibold uppercase tracking-[0.08em] text-(--color-text-secondary)'
				}>
				{'Status'}
			</div>
			<div className={'flex gap-1.5'}>
				{gpxStatusOptions.map(option => {
					const isActive = gpxStatusFilter === option;
					return (
						<button
							key={option}
							onClick={() => onGPXStatusFilterAction(option)}
							disabled={isActive}
							className={togglePillClass(isActive)}>
							{GPX_STATUS_LABEL[option]}
						</button>
					);
				})}
			</div>
		</div>
	);
}

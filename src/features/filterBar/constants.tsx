'use client';

import type {TGPSFilter} from '@/shared/types/map';
import type {TViewMode} from '@/shared/types/view';
import type {ReactNode} from 'react';

/**
 * Human-readable labels for GPS filter values.
 */
export const GPS_LABEL: Record<TGPSFilter, string> = {
	'no-gps': 'Missing location',
	'with-gps': 'With location' //eslint-disable-line
};
/**
 * GPS filter values rendered by filter controls.
 */
export const gpsOptions: readonly TGPSFilter[] = ['no-gps', 'with-gps'];
/**
 * Precomputed mapping between timeline and album modes.
 */
export const oppositeMode: Record<TViewMode, TViewMode> = {album: 'timeline', timeline: 'album'};
/**
 * Tooltips for switching between album and timeline mode.
 */
export const viewTitle: Record<TViewMode, string> = {album: 'Switch to timeline', timeline: 'Switch to albums'};

/**
 * Icons used in the view mode toggle.
 */
export const viewIcon: Record<TViewMode, ReactNode> = {
	album: (
		<svg
			width={'12'}
			height={'12'}
			viewBox={'0 0 16 16'}
			fill={'currentColor'}>
			<rect
				x={'1'}
				y={'1'}
				width={'6'}
				height={'6'}
				rx={'1'}
			/>
			<rect
				x={'9'}
				y={'1'}
				width={'6'}
				height={'6'}
				rx={'1'}
			/>
			<rect
				x={'1'}
				y={'9'}
				width={'6'}
				height={'6'}
				rx={'1'}
			/>
			<rect
				x={'9'}
				y={'9'}
				width={'6'}
				height={'6'}
				rx={'1'}
			/>
		</svg>
	),
	timeline: (
		<svg
			width={'12'}
			height={'12'}
			viewBox={'0 0 16 16'}
			fill={'currentColor'}>
			<circle
				cx={'3'}
				cy={'3'}
				r={'1.5'}
			/>
			<rect
				x={'6'}
				y={'2'}
				width={'9'}
				height={'2'}
				rx={'1'}
			/>
			<circle
				cx={'3'}
				cy={'8'}
				r={'1.5'}
			/>
			<rect
				x={'6'}
				y={'7'}
				width={'9'}
				height={'2'}
				rx={'1'}
			/>
			<circle
				cx={'3'}
				cy={'13'}
				r={'1.5'}
			/>
			<rect
				x={'6'}
				y={'12'}
				width={'9'}
				height={'2'}
				rx={'1'}
			/>
		</svg>
	)
};

/**
 * Base class for view toggle and sync buttons.
 */
export const toolButtonClass =
	'flex h-6 w-6 cursor-pointer items-center justify-center rounded-md border-0 bg-(--color-bg) text-(--color-text-secondary) transition-all duration-150 hover:text-(--color-text)';
/**
 * Base class for filter-collapse control button.
 */
export const filterButtonClass =
	'flex h-6 w-6 cursor-pointer items-center justify-center rounded-md border-0 transition-all duration-150';
/**
 * Shared class for numeric option buttons.
 */
export const optionButtonClass =
	'cursor-pointer rounded-md border px-2 py-1 text-[0.6875rem] font-medium transition-all duration-150';

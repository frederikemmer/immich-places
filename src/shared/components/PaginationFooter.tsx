'use client';

import {buildPageRange} from '@/utils/pagination';

import type {ReactElement} from 'react';

/**
 * Pagination footer props for paging through timeline asset pages.
 */
type TPaginationFooterProps = {
	currentPage: number;
	totalPages: number;
	isLoading: boolean;
	onPageChangeAction: (page: number) => void;
};

/**
 * Single-step back icon used by previous-page control.
 */
const chevronLeft = (
	<svg
		viewBox={'0 0 16 16'}
		fill={'currentColor'}
		className={'h-2.5 w-2.5'}>
		<path
			fillRule={'evenodd'}
			d={
				'M11.354 1.646a.5.5 0 010 .708L5.707 8l5.647 5.646a.5.5 0 01-.708.708l-6-6a.5.5 0 010-.708l6-6a.5.5 0 01.708 0z'
			}
			clipRule={'evenodd'}
		/>
	</svg>
);

/**
 * Single-step forward icon used by next-page control.
 */
const chevronRight = (
	<svg
		viewBox={'0 0 16 16'}
		fill={'currentColor'}
		className={'h-2.5 w-2.5'}>
		<path
			fillRule={'evenodd'}
			d={
				'M4.646 1.646a.5.5 0 01.708 0l6 6a.5.5 0 010 .708l-6 6a.5.5 0 01-.708-.708L10.293 8 4.646 2.354a.5.5 0 010-.708z'
			}
			clipRule={'evenodd'}
		/>
	</svg>
);

/**
 * Double-step left icon used by first-page control.
 */
const chevronDoubleLeft = (
	<svg
		viewBox={'0 0 16 16'}
		fill={'currentColor'}
		className={'h-2.5 w-2.5'}>
		<path
			fillRule={'evenodd'}
			d={
				'M8.354 1.646a.5.5 0 010 .708L2.707 8l5.647 5.646a.5.5 0 01-.708.708l-6-6a.5.5 0 010-.708l6-6a.5.5 0 01.708 0z'
			}
			clipRule={'evenodd'}
		/>
		<path
			fillRule={'evenodd'}
			d={
				'M14.354 1.646a.5.5 0 010 .708L8.707 8l5.647 5.646a.5.5 0 01-.708.708l-6-6a.5.5 0 010-.708l6-6a.5.5 0 01.708 0z'
			}
			clipRule={'evenodd'}
		/>
	</svg>
);

/**
 * Double-step right icon used by last-page control.
 */
const chevronDoubleRight = (
	<svg
		viewBox={'0 0 16 16'}
		fill={'currentColor'}
		className={'h-2.5 w-2.5'}>
		<path
			fillRule={'evenodd'}
			d={
				'M1.646 1.646a.5.5 0 01.708 0l6 6a.5.5 0 010 .708l-6 6a.5.5 0 01-.708-.708L7.293 8 1.646 2.354a.5.5 0 010-.708z'
			}
			clipRule={'evenodd'}
		/>
		<path
			fillRule={'evenodd'}
			d={
				'M7.646 1.646a.5.5 0 01.708 0l6 6a.5.5 0 010 .708l-6 6a.5.5 0 01-.708-.708L13.293 8 7.646 2.354a.5.5 0 010-.708z'
			}
			clipRule={'evenodd'}
		/>
	</svg>
);

/** Base style for navigation controls. */
const NAV_BTN =
	'flex h-6 w-6 cursor-pointer items-center justify-center rounded-md border-0 bg-transparent text-(--color-text-secondary) transition-colors duration-100 hover:bg-(--color-hover) hover:text-(--color-text) disabled:cursor-default disabled:opacity-20';
/** Base style for page number buttons. */
const PAGE_BTN =
	'flex h-6 min-w-6 cursor-pointer items-center justify-center rounded-md border-0 text-[0.6875rem] font-medium tabular-nums transition-all duration-100';
/** Style for the active page button state. */
const PAGE_ACTIVE = 'bg-(--color-primary) text-white';
/** Style for inactive page button state. */
const PAGE_IDLE = 'bg-transparent text-(--color-text-secondary) hover:bg-(--color-hover) hover:text-(--color-text)';
/** Style for ellipsis separator in page range output. */
const ELLIPSIS_CLS = 'flex h-6 w-6 items-center justify-center text-[0.6875rem] text-(--color-text-secondary)';

/**
 * Renders navigation controls and page chips for the grid timeline.
 *
 * Computes visible page ranges using `buildPageRange` and disables controls when
 * data loading is in progress.
 *
 * @param props - Page range and callback controls.
 * @returns Footer UI with first/prev/page/next/last actions.
 */
export function PaginationFooter({
	currentPage,
	totalPages,
	isLoading,
	onPageChangeAction
}: TPaginationFooterProps): ReactElement {
	const pages = buildPageRange(currentPage, totalPages);

	return (
		<div className={'flex items-center justify-center gap-0.75 border-t border-(--color-border) px-3 py-2'}>
			<button
				className={NAV_BTN}
				onClick={() => onPageChangeAction(1)}
				disabled={currentPage <= 1 || isLoading}>
				{chevronDoubleLeft}
			</button>
			<button
				className={NAV_BTN}
				onClick={() => onPageChangeAction(currentPage - 1)}
				disabled={currentPage <= 1 || isLoading}>
				{chevronLeft}
			</button>
			{pages.map((item, i) => {
				if (item === 'ellipsis') {
					return (
						<span
							key={`e${i}`}
							className={ELLIPSIS_CLS}>
							{'...'}
						</span>
					);
				}
				const isActive = item === currentPage;
				return (
					<button
						key={item}
						className={`${PAGE_BTN} ${isActive ? PAGE_ACTIVE : PAGE_IDLE}`}
						onClick={() => onPageChangeAction(item)}
						disabled={isLoading}>
						{item}
					</button>
				);
			})}
			<button
				className={NAV_BTN}
				onClick={() => onPageChangeAction(currentPage + 1)}
				disabled={currentPage >= totalPages || isLoading}>
				{chevronRight}
			</button>
			<button
				className={NAV_BTN}
				onClick={() => onPageChangeAction(totalPages)}
				disabled={currentPage >= totalPages || isLoading}>
				{chevronDoubleRight}
			</button>
		</div>
	);
}

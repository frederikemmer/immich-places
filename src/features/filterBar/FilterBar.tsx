'use client';

import {useState} from 'react';

import {
	FILTER_BAR_CLOSED_MAX_HEIGHT_PX,
	FILTER_BAR_OPEN_MAX_HEIGHT_PX,
	FILTER_BAR_TRANSITION_CLASS
} from '@/features/filterBar/constant';
import {filterButtonClass, oppositeMode, toolButtonClass, viewIcon, viewTitle} from '@/features/filterBar/constants';
import {FilterIcon} from '@/features/filterBar/FilterIcon';
import {GPSFilterGroup} from '@/features/filterBar/GPSFilterGroup';
import {HeaderTitle} from '@/features/filterBar/HeaderTitle';
import {NumericOptionGroup} from '@/features/filterBar/NumericOptionGroup';
import {cn} from '@/utils/cn';
import {GRID_COLUMN_OPTIONS, PAGE_SIZE_OPTIONS} from '@/utils/view';

import type {TGPSFilter} from '@/shared/types/map';
import type {TViewMode} from '@/shared/types/view';
import type {ReactElement} from 'react';

/**
 * Props for the main filter bar container.
 */
type TFilterBarProps = {
	gpsFilter: TGPSFilter;
	onGPSFilterAction: (filter: TGPSFilter) => void;
	missingCount: number | null;
	pageSize: number;
	onPageSizeAction: (size: number) => void;
	gridColumns: number;
	onGridColumnsAction: (cols: number) => void;
	viewMode: TViewMode;
	onViewModeAction: (mode: TViewMode) => void;
	isSyncing: boolean;
	syncError?: string | null;
	onSyncAction: () => Promise<void>;
	albumName?: string | null;
	onBackAction?: () => void;
	trailingAction?: ReactElement;
};

/**
 * Renders the top-level filter toolbar and expandable filter controls.
 *
 * Includes:
 * - current title / back button,
 * - sync trigger,
 * - timeline/album mode toggle,
 * - filter expansion state,
 * - and numeric options for paging/grid settings.
 *
 * @param gpsFilter - Current GPS filter selection.
 * @param onGPSFilterAction - Callback to update GPS filter.
 * @param missingCount - Count used for missing-location badge.
 * @param pageSize - Selected page size.
 * @param onPageSizeAction - Callback to update page size.
 * @param gridColumns - Selected grid column count.
 * @param onGridColumnsAction - Callback to update grid columns.
 * @param viewMode - Active view mode.
 * @param onViewModeAction - Callback to switch view mode.
 * @param isSyncing - Whether sync action is in progress.
 * @param syncError - Optional sync error message.
 * @param onSyncAction - Action to trigger remote sync.
 * @param albumName - Optional album label when focused on an album.
 * @param onBackAction - Optional callback to return to default title context.
 * @returns Filter toolbar and controls.
 */
export function FilterBar({
	gpsFilter,
	onGPSFilterAction,
	missingCount,
	pageSize,
	onPageSizeAction,
	gridColumns,
	onGridColumnsAction,
	viewMode,
	onViewModeAction,
	isSyncing,
	syncError,
	onSyncAction,
	albumName,
	onBackAction,
	trailingAction
}: TFilterBarProps): ReactElement {
	const [isOpen, setIsOpen] = useState(true);
	const nextMode = oppositeMode[viewMode];

	return (
		<div className={'border-b border-(--color-border)'}>
			<div className={'flex items-center gap-2 px-3 py-2'}>
				<div className={'min-w-0 flex-1 overflow-hidden'}>
					<HeaderTitle
						albumName={albumName}
						onBackAction={onBackAction}
					/>
				</div>
				<button
					onClick={() => {
						void onSyncAction();
					}}
					disabled={isSyncing}
					title={isSyncing ? 'Syncing...' : 'Resync with Immich'}
					className={`${toolButtonClass} disabled:cursor-default disabled:opacity-40`}>
					<svg
						width={'12'}
						height={'12'}
						viewBox={'0 0 16 16'}
						fill={'currentColor'}
						className={isSyncing ? 'animate-spin' : ''}>
						<path d={'M8 1a7 7 0 0 1 7 7h-1.5A5.5 5.5 0 0 0 8 2.5V1z'} />
						<path d={'M8 15a7 7 0 0 1-7-7h1.5A5.5 5.5 0 0 0 8 13.5V15z'} />
						<path d={'M8 1v2.5L10.5 2 8 1z'} />
						<path d={'M8 15v-2.5L5.5 14 8 15z'} />
					</svg>
				</button>
				<button
					onClick={() => onViewModeAction(nextMode)}
					title={viewTitle[viewMode]}
					className={toolButtonClass}>
					{viewIcon[nextMode]}
				</button>
				<button
					onClick={() => setIsOpen(value => !value)}
					className={cn(
						filterButtonClass,
						isOpen && 'bg-(--color-primary) text-white',
						!isOpen && 'bg-(--color-bg) text-(--color-text-secondary) hover:text-(--color-text)'
					)}>
					<FilterIcon />
				</button>
				{trailingAction && <div className={'ml-1'}>{trailingAction}</div>}
			</div>
			<div
				className={FILTER_BAR_TRANSITION_CLASS}
				style={{
					maxHeight: isOpen ? `${FILTER_BAR_OPEN_MAX_HEIGHT_PX}px` : `${FILTER_BAR_CLOSED_MAX_HEIGHT_PX}px`,
					opacity: isOpen ? 1 : 0
				}}>
				<div className={'flex flex-col gap-1.5 px-3 pb-2.5'}>
					<GPSFilterGroup
						gpsFilter={gpsFilter}
						missingCount={missingCount}
						onGPSFilterAction={onGPSFilterAction}
					/>
					<div className={'flex gap-1.5'}>
						<NumericOptionGroup
							label={'Per Page'}
							value={pageSize}
							options={PAGE_SIZE_OPTIONS}
							onChangeAction={onPageSizeAction}
						/>
						<NumericOptionGroup
							label={'Grid'}
							value={gridColumns}
							options={GRID_COLUMN_OPTIONS}
							onChangeAction={onGridColumnsAction}
						/>
					</div>
				</div>
			</div>
			{syncError && <div className={'px-3 pb-2 text-[0.6875rem] text-[#b91c1c]'}>{syncError}</div>}
		</div>
	);
}

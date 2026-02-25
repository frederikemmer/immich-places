'use client';

import type {ReactElement} from 'react';

/**
 * Header title props for list and album context.
 */
type THeaderTitleProps = {
	albumName?: string | null;
	onBackAction?: () => void;
};

/**
 * Renders the feature title and optional album breadcrumb button.
 *
 * When an album is selected, shows a back action with album name; otherwise
 * displays the default application title.
 *
 * @param albumName - Active album name; when present the title becomes navigable.
 * @param onBackAction - Optional callback for returning to default title state.
 * @returns A title heading or back button.
 */
export function HeaderTitle({albumName, onBackAction}: THeaderTitleProps): ReactElement {
	if (albumName) {
		return (
			<button
				key={albumName}
				onClick={onBackAction}
				style={{animation: 'titleSwap 300ms ease-out both'}}
				className={
					'flex w-full cursor-pointer items-center gap-1 border-0 bg-transparent p-0 text-[0.9375rem] font-semibold hover:text-(--color-primary)'
				}>
				<svg
					width={'12'}
					height={'12'}
					viewBox={'0 0 16 16'}
					fill={'currentColor'}
					className={'shrink-0'}>
					<path
						d={
							'M10.354 2.646a.5.5 0 0 1 0 .708L5.707 8l4.647 4.646a.5.5 0 0 1-.708.708l-5-5a.5.5 0 0 1 0-.708l5-5a.5.5 0 0 1 .708 0z'
						}
					/>
				</svg>
				<span className={'truncate'}>{albumName}</span>
			</button>
		);
	}

	return (
		<h2
			key={'title'}
			style={{animation: 'titleSwap 300ms ease-out both'}}
			className={'flex items-center gap-1.5 text-[0.9375rem] font-semibold'}>
			<img
				src={'/logo.svg'}
				alt={''}
				width={16}
				height={23}
				className={'shrink-0'}
			/>
			{'Immich Places'}
		</h2>
	);
}

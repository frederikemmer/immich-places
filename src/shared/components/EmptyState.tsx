'use client';

import type {ReactElement} from 'react';

/**
 * Empty-state illustration displayed when no geolocated items are available.
 *
 * @returns Animated placeholder section with copy for completed geolocation state.
 */
export function EmptyState(): ReactElement {
	return (
		<div
			className={'flex flex-col items-center justify-center px-4 py-16'}
			style={{animation: 'elFadeIn 400ms ease-out'}}>
			<div className={'flex flex-col items-center gap-6'}>
				<div className={'relative size-18'}>
					<svg
						width={'72'}
						height={'72'}
						viewBox={'0 0 72 72'}
						fill={'none'}
						className={'animate-[emptySlowSpin_20s_linear_infinite]'}>
						<circle
							cx={'36'}
							cy={'36'}
							r={'28'}
							stroke={'var(--color-border)'}
							strokeWidth={'1'}
						/>
						<ellipse
							cx={'36'}
							cy={'36'}
							rx={'12'}
							ry={'28'}
							stroke={'var(--color-border)'}
							strokeWidth={'1'}
						/>
						<path
							d={'M8 36h56'}
							stroke={'var(--color-border)'}
							strokeWidth={'1'}
						/>
						<path
							d={'M12 22h48'}
							stroke={'var(--color-border)'}
							strokeWidth={'0.5'}
							opacity={'0.5'}
						/>
						<path
							d={'M12 50h48'}
							stroke={'var(--color-border)'}
							strokeWidth={'0.5'}
							opacity={'0.5'}
						/>
						<circle
							cx={'24'}
							cy={'28'}
							r={'2.5'}
							fill={'var(--color-primary)'}
							opacity={'0.8'}
							className={'animate-[emptyPulse_2s_ease-in-out_infinite]'}
						/>
						<circle
							cx={'46'}
							cy={'34'}
							r={'2.5'}
							fill={'#0d9488'}
							opacity={'0.8'}
							className={'animate-[emptyPulse_2s_ease-in-out_0.5s_infinite]'}
						/>
						<circle
							cx={'36'}
							cy={'48'}
							r={'2.5'}
							fill={'#d97706'}
							opacity={'0.8'}
							className={'animate-[emptyPulse_2s_ease-in-out_1s_infinite]'}
						/>
					</svg>
				</div>
				<div className={'flex flex-col items-center gap-1.5'}>
					<p className={'text-[0.9375rem] font-medium text-(--color-text)'}>{'All set'}</p>
					<p className={'text-[0.8125rem] text-(--color-text-secondary)'}>{'Every photo has a location'}</p>
				</div>
			</div>
		</div>
	);
}

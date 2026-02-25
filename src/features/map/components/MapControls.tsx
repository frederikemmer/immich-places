'use client';

import {
	MAP_CONTROL_BUTTON_CLASS,
	MAP_CONTROL_ICON_BUTTON_STYLE,
	MAP_CONTROL_OFFSET,
	MAP_CONTROL_PANEL_CLASS,
	MAP_CONTROL_STACK_GAP
} from '@/features/map/constants';
import {MAP_CONTROL_Z_INDEX} from '@/utils/map';

import type {ReactElement} from 'react';

type TMapControlsProps = {
	onZoomInAction: () => void;
	onZoomOutAction: () => void;
	onLocateMeAction: () => void;
};

/**
 * Floating map controls for zoom and geolocation actions.
 *
 * @param onZoomInAction - Increases map zoom.
 * @param onZoomOutAction - Decreases map zoom.
 * @param onLocateMeAction - Centers map on browser geolocation.
 * @returns Control button cluster.
 */
export function MapControls({onZoomInAction, onZoomOutAction, onLocateMeAction}: TMapControlsProps): ReactElement {
	return (
		<>
			<div
				className={MAP_CONTROL_PANEL_CLASS}
				style={{
					top: MAP_CONTROL_OFFSET,
					right: MAP_CONTROL_OFFSET,
					zIndex: MAP_CONTROL_Z_INDEX,
					flexDirection: 'column',
					gap: MAP_CONTROL_STACK_GAP
				}}>
				<button
					className={MAP_CONTROL_BUTTON_CLASS}
					style={MAP_CONTROL_ICON_BUTTON_STYLE}
					onClick={onZoomInAction}
					title={'Zoom in'}>
					<svg
						width={'16'}
						height={'16'}
						viewBox={'0 0 16 16'}
						fill={'none'}>
						<path
							d={'M8 3v10M3 8h10'}
							stroke={'currentColor'}
							strokeWidth={'1.5'}
							strokeLinecap={'round'}
						/>
					</svg>
				</button>
				<button
					className={MAP_CONTROL_BUTTON_CLASS}
					style={MAP_CONTROL_ICON_BUTTON_STYLE}
					onClick={onZoomOutAction}
					title={'Zoom out'}>
					<svg
						width={'16'}
						height={'16'}
						viewBox={'0 0 16 16'}
						fill={'none'}>
						<path
							d={'M3 8h10'}
							stroke={'currentColor'}
							strokeWidth={'1.5'}
							strokeLinecap={'round'}
						/>
					</svg>
				</button>
			</div>
			<button
				className={MAP_CONTROL_BUTTON_CLASS}
				style={{
					...MAP_CONTROL_ICON_BUTTON_STYLE,
					position: 'absolute',
					right: MAP_CONTROL_OFFSET,
					bottom: MAP_CONTROL_OFFSET,
					zIndex: MAP_CONTROL_Z_INDEX
				}}
				onClick={onLocateMeAction}
				title={'Center on my location'}>
				<svg
					width={'16'}
					height={'16'}
					viewBox={'0 0 16 16'}
					fill={'none'}>
					<circle
						cx={'8'}
						cy={'8'}
						r={'3'}
						stroke={'currentColor'}
						strokeWidth={'1.5'}
					/>
					<path
						d={'M8 1v3M8 12v3M1 8h3M12 8h3'}
						stroke={'currentColor'}
						strokeWidth={'1.5'}
						strokeLinecap={'round'}
					/>
				</svg>
			</button>
		</>
	);
}

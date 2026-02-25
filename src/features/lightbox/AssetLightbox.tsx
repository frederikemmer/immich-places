'use client';

import Image from 'next/image';
import {useCallback} from 'react';

import {useLightboxAnimation} from '@/features/lightbox/useLightboxAnimation';
import {useLightboxKeyboard} from '@/features/lightbox/useLightboxKeyboard';
import {useBackend, useCatalog, useSelection, useUIMap} from '@/shared/context/AppContext';
import {immichPhotoURL, previewURL} from '@/utils/backendUrls';

import type {ReactElement} from 'react';

/**
 * Fullscreen lightbox overlay for viewing and navigating selected assets.
 *
 * Handles mount/animation state, keyboard control wiring, previous/next navigation
 * within current asset list, and deep-link open to Immich.
 *
 * @returns Rendered lightbox overlay or `null` when not mounted.
 */
export function AssetLightbox(): ReactElement | null {
	const {health} = useBackend();
	const {assets} = useCatalog();
	const {toggleAssetAction} = useSelection();
	const {lightboxAssetID, openLightboxAction, closeLightboxAction} = useUIMap();
	const immichURL = health?.immichURL ?? '';
	const {isMounted, isVisible, displayAssetID} = useLightboxAnimation(lightboxAssetID);

	const currentIndex = lightboxAssetID ? assets.findIndex(a => a.immichID === lightboxAssetID) : -1;
	const hasPrev = currentIndex > 0;
	const hasNext = currentIndex >= 0 && currentIndex < assets.length - 1;

	const goPrev = useCallback(() => {
		if (!hasPrev) {
			return;
		}
		const prev = assets[currentIndex - 1];
		toggleAssetAction(prev, 'single');
		openLightboxAction(prev.immichID);
	}, [hasPrev, currentIndex, assets, toggleAssetAction, openLightboxAction]);

	const goNext = useCallback(() => {
		if (!hasNext) {
			return;
		}
		const next = assets[currentIndex + 1];
		toggleAssetAction(next, 'single');
		openLightboxAction(next.immichID);
	}, [hasNext, currentIndex, assets, toggleAssetAction, openLightboxAction]);

	useLightboxKeyboard({
		isEnabled: Boolean(lightboxAssetID),
		closeLightbox: closeLightboxAction,
		goPrev,
		goNext
	});

	if (!isMounted) {
		return null;
	}

	const asset = displayAssetID ? assets.find(a => a.immichID === displayAssetID) : null;
	const safeImmichPhotoURL = displayAssetID ? immichPhotoURL(immichURL, displayAssetID) : null;
	const imageWidth = 1920;
	const imageHeight = 1080;

	return (
		<div
			className={
				'absolute inset-0 z-2000 flex items-center justify-center rounded-xl transition-[background-color] duration-200 ease-out'
			}
			style={{backgroundColor: isVisible ? 'rgba(0,0,0,0.7)' : 'rgba(0,0,0,0)'}}
			onClick={closeLightboxAction}>
			<div
				className={'relative max-h-[80%] max-w-[90%] transition-[opacity,transform] duration-200 ease-out'}
				style={{
					opacity: isVisible ? 1 : 0,
					transform: isVisible ? 'scale(1)' : 'scale(0.95)'
				}}>
				{displayAssetID && (
					<Image
						unoptimized
						src={previewURL(displayAssetID)}
						alt={''}
						width={imageWidth}
						height={imageHeight}
						className={'h-auto max-h-[80vh] max-w-[90vw] rounded-xl object-contain shadow-2xl w-full'}
						onClick={e => e.stopPropagation()}
					/>
				)}
				{asset?.stackID && (
					<div
						className={
							'absolute top-3 right-3 flex items-center gap-1 drop-shadow-[0_1px_3px_rgba(0,0,0,0.6)]'
						}
						onClick={e => e.stopPropagation()}>
						<span className={'text-sm font-medium text-white'}>{asset.stackAssetCount}</span>
						<svg
							width={'24'}
							height={'24'}
							viewBox={'0 0 24 24'}
							fill={'white'}>
							<path
								d={
									'M1,5H3V19H1V5M5,5H7V19H5V5M22,5H10A1,1 0 0,0 9,6V18A1,1 0 0,0 10,19H22A1,1 0 0,0 23,18V6A1,1 0 0,0 22,5M11,17L13.5,13.85L15.29,16L17.79,12.78L21,17H11Z'
								}
							/>
						</svg>
					</div>
				)}
			</div>
			{safeImmichPhotoURL && (
				<button
					className={
						'absolute right-4 bottom-4 flex h-9 w-9 cursor-pointer items-center justify-center rounded-full border-0 bg-white/90 text-[#1e1e2e] shadow-lg backdrop-blur-sm transition-all duration-150 hover:bg-white'
					}
					title={'Open in Immich'}
					onClick={e => {
						e.stopPropagation();
						window.open(safeImmichPhotoURL, '_blank', 'noopener,noreferrer');
					}}>
					<svg
						width={'16'}
						height={'16'}
						viewBox={'0 0 16 16'}
						fill={'none'}
						stroke={'currentColor'}
						strokeWidth={'1.5'}
						strokeLinecap={'round'}
						strokeLinejoin={'round'}>
						<path
							d={
								'M12 8.667v4A1.333 1.333 0 0 1 10.667 14H3.333A1.333 1.333 0 0 1 2 12.667V5.333A1.333 1.333 0 0 1 3.333 4h4M10 2h4v4M6.667 9.333 14 2'
							}
						/>
					</svg>
				</button>
			)}
		</div>
	);
}

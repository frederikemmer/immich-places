'use client';

import {useCallback, useEffect, useRef, useState} from 'react';

import {errorBannerClass, inputClass} from '@/features/gpxImport/constant';
import {DawarichTab} from '@/features/gpxImport/DawarichTab';
import {DialogShell} from '@/shared/components/DialogShell';
import {togglePillClass} from '@/utils/togglePill';

import type {TGPXPreviewResponse} from '@/features/gpxImport/gpxImportTypes';
import type {ChangeEvent, DragEvent, ReactElement} from 'react';

type TSource = 'gpx' | 'dawarich';

type TGPXImportDialogProps = {
	isOpen: boolean;
	onClose: () => void;
	uploadAndPreview: (files: File[], maxGapSeconds?: number) => Promise<void>;
	setPreviews: (previews: TGPXPreviewResponse[]) => void;
	isLoading: boolean;
	error: string | null;
	hasDawarichCredentials: boolean;
	onOpenAPIKeys: () => void;
};

function SourceTabs({source, onSourceChange}: {source: TSource; onSourceChange: (s: TSource) => void}): ReactElement {
	const options: {value: TSource; label: string}[] = [
		{value: 'gpx', label: 'GPX File'},
		{value: 'dawarich', label: 'Dawarich'}
	];

	return (
		<div className={'flex gap-1.5'}>
			{options.map(option => {
				const isActive = source === option.value;
				return (
					<button
						key={option.value}
						onClick={() => onSourceChange(option.value)}
						disabled={isActive}
						className={togglePillClass(isActive)}>
						{option.label}
					</button>
				);
			})}
		</div>
	);
}

function MaxGapInput({value, onChange}: {value: number; onChange: (v: number) => void}): ReactElement {
	return (
		<div className={'rounded-lg bg-(--color-bg) p-2.5'}>
			<div
				className={
					'mb-2 text-[0.5625rem] font-semibold uppercase tracking-[0.08em] text-(--color-text-secondary)'
				}>
				{'Settings'}
			</div>
			<div>
				<label className={'mb-1 block text-[0.625rem] text-(--color-text-secondary)'}>{'Max Gap (sec)'}</label>
				<input
					type={'number'}
					value={value}
					onChange={e => {
						const parsed = Number(e.target.value);
						if (Number.isFinite(parsed) && parsed >= 0) {
							onChange(parsed);
						}
					}}
					min={0}
					className={inputClass}
				/>
			</div>
		</div>
	);
}

function GPXTab({
	uploadAndPreview,
	maxGap,
	isLoading,
	error
}: {
	uploadAndPreview: (files: File[], maxGapSeconds?: number) => Promise<void>;
	maxGap: number;
	isLoading: boolean;
	error: string | null;
}): ReactElement {
	const fileInputRef = useRef<HTMLInputElement | null>(null);
	const [isDragOver, setIsDragOver] = useState(false);
	const [dropError, setDropError] = useState<string | null>(null);

	const handleFilesSelected = useCallback(
		(files: File[]) => {
			void uploadAndPreview(files, maxGap);
		},
		[uploadAndPreview, maxGap]
	);

	const handleInputChange = useCallback(
		(e: ChangeEvent<HTMLInputElement>) => {
			const fileList = e.target.files;
			if (!fileList || fileList.length === 0) {
				return;
			}
			handleFilesSelected(Array.from(fileList));
		},
		[handleFilesSelected]
	);

	const handleDrop = useCallback(
		(e: DragEvent) => {
			e.preventDefault();
			setIsDragOver(false);
			setDropError(null);
			const fileList = e.dataTransfer.files;
			if (!fileList || fileList.length === 0) {
				return;
			}
			const gpxFiles = Array.from(fileList).filter(f => f.name.endsWith('.gpx'));
			if (gpxFiles.length === 0) {
				setDropError('Only .gpx files are supported');
				return;
			}
			handleFilesSelected(gpxFiles);
		},
		[handleFilesSelected]
	);

	const dropzoneBaseClass =
		'flex cursor-pointer flex-col items-center justify-center rounded-lg border-2 border-dashed p-6 transition-colors';
	let dropzoneClass = `${dropzoneBaseClass} border-(--color-border) hover:border-(--color-text-secondary)`;
	if (isDragOver) {
		dropzoneClass = `${dropzoneBaseClass} border-(--color-primary) bg-(--color-primary)/5`;
	}
	let dropzoneLabel = 'Drop .gpx files or click to browse';
	let dropzoneTabIndex = 0;
	if (isLoading) {
		dropzoneLabel = 'Processing...';
		dropzoneTabIndex = -1;
	}

	return (
		<div>
			{(error || dropError) && <div className={`mb-3 ${errorBannerClass}`}>{error || dropError}</div>}

			<div
				role={'button'}
				tabIndex={dropzoneTabIndex}
				aria-disabled={isLoading}
				onDragOver={e => {
					e.preventDefault();
					if (!isLoading) {
						setIsDragOver(true);
					}
				}}
				onDragLeave={() => setIsDragOver(false)}
				onDrop={e => {
					if (isLoading) {
						e.preventDefault();
						setIsDragOver(false);
						return;
					}
					handleDrop(e);
				}}
				onClick={() => {
					if (!isLoading) {
						fileInputRef.current?.click();
					}
				}}
				onKeyDown={e => {
					if ((e.key === 'Enter' || e.key === ' ') && !isLoading) {
						e.preventDefault();
						fileInputRef.current?.click();
					}
				}}
				className={dropzoneClass}>
				<svg
					width={'24'}
					height={'24'}
					viewBox={'0 0 24 24'}
					fill={'none'}
					stroke={'currentColor'}
					strokeWidth={'1.5'}
					className={'mb-1.5 text-(--color-text-secondary)'}>
					<path d={'M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4'} />
					<polyline points={'17 8 12 3 7 8'} />
					<line
						x1={'12'}
						y1={'3'}
						x2={'12'}
						y2={'15'}
					/>
				</svg>
				<p className={'text-xs text-(--color-text-secondary)'}>{dropzoneLabel}</p>
			</div>
			<input
				ref={fileInputRef}
				type={'file'}
				accept={'.gpx'}
				multiple
				onChange={handleInputChange}
				className={'hidden'}
			/>
		</div>
	);
}

export function GPXImportDialog({
	isOpen,
	onClose,
	uploadAndPreview,
	setPreviews,
	isLoading,
	error,
	hasDawarichCredentials,
	onOpenAPIKeys
}: TGPXImportDialogProps): ReactElement {
	const [source, setSource] = useState<TSource>('gpx');
	const [maxGap, setMaxGap] = useState(600);

	useEffect(() => {
		if (!isOpen) {
			setSource('gpx');
		}
	}, [isOpen]);

	return (
		<DialogShell
			isOpen={isOpen}
			onClose={onClose}
			title={'Import Tracks'}
			subtitle={'Match photos to GPS tracks.'}
			maxWidth={'sm'}>
			<div className={'flex flex-col gap-3 px-4 py-3'}>
				<SourceTabs
					source={source}
					onSourceChange={setSource}
				/>
				<div className={'flex min-h-[118px] flex-col'}>
					{source === 'gpx' && (
						<GPXTab
							uploadAndPreview={uploadAndPreview}
							maxGap={maxGap}
							isLoading={isLoading}
							error={error}
						/>
					)}
					{source === 'dawarich' && (
						<DawarichTab
							hasDawarichCredentials={hasDawarichCredentials}
							isOpen={isOpen}
							onPreviewReady={setPreviews}
							onClose={onClose}
							onOpenAPIKeys={onOpenAPIKeys}
							maxGap={maxGap}
						/>
					)}
				</div>
				<MaxGapInput
					value={maxGap}
					onChange={setMaxGap}
				/>
			</div>
		</DialogShell>
	);
}

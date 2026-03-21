'use client';

import {useEffect, useState} from 'react';

import {useAuth} from '@/features/auth/AuthContext';
import {DialogShell} from '@/shared/components/DialogShell';

import type {ChangeEvent, ReactElement} from 'react';

type TAPIKeyDialogProps = {
	isOpen: boolean;
	onClose: () => void;
	onImmichSuccess: () => void;
};

const inputClass =
	'w-full rounded-lg border border-(--color-border) bg-(--color-bg) px-3 py-2 pr-16 text-sm outline-none focus:border-(--color-primary)';

const toggleButtonClass =
	'absolute top-1/2 right-2 -translate-y-1/2 cursor-pointer border-0 bg-transparent px-2 py-1 text-xs text-(--color-text-secondary) hover:text-(--color-text)';

const sectionLabelClass = 'mb-2 text-[0.625rem] font-medium text-(--color-text-secondary)';

function PasswordInput({
	value,
	onChange,
	placeholder
}: {
	value: string;
	onChange: (value: string) => void;
	placeholder: string;
}): ReactElement {
	const [shouldShow, setShouldShow] = useState(false);

	let inputType = 'password';
	if (shouldShow) {
		inputType = 'text';
	}

	let toggleLabel = 'Show';
	if (shouldShow) {
		toggleLabel = 'Hide';
	}

	return (
		<div className={'relative'}>
			<input
				type={inputType}
				placeholder={placeholder}
				value={value}
				onChange={e => onChange(e.target.value)}
				className={inputClass}
			/>
			<button
				type={'button'}
				onClick={() => setShouldShow(!shouldShow)}
				className={toggleButtonClass}>
				{toggleLabel}
			</button>
		</div>
	);
}

export function APIKeyDialog({isOpen, onClose, onImmichSuccess}: TAPIKeyDialogProps): ReactElement {
	const {updateAPIKey, updateDawarichSettings, deleteDawarichSettings, hasDawarichCredentials, error} = useAuth();
	const [immichKey, setImmichKey] = useState('');
	const [dawarichKey, setDawarichKey] = useState('');
	const [isSubmitting, setIsSubmitting] = useState(false);
	const [isDisconnectingDawarich, setIsDisconnectingDawarich] = useState(false);

	useEffect(() => {
		if (!isOpen) {
			setImmichKey('');
			setDawarichKey('');
			setIsSubmitting(false);
			setIsDisconnectingDawarich(false);
		}
	}, [isOpen]);

	async function handleSubmit(e: ChangeEvent): Promise<void> {
		e.preventDefault();
		const hasImmich = immichKey.trim().length > 0;
		const hasDawarich = dawarichKey.trim().length > 0;
		if (!hasImmich && !hasDawarich) {
			return;
		}
		setIsSubmitting(true);
		try {
			let isImmichOK = true;
			let isDawarichOK = true;
			if (hasImmich) {
				isImmichOK = await updateAPIKey(immichKey.trim());
			}
			if (hasDawarich && isImmichOK) {
				isDawarichOK = await updateDawarichSettings(dawarichKey.trim());
			}
			if (isImmichOK && isDawarichOK) {
				onClose();
				if (hasImmich) {
					onImmichSuccess();
				}
			}
		} finally {
			setIsSubmitting(false);
		}
	}

	async function handleDawarichDisconnect(): Promise<void> {
		setIsDisconnectingDawarich(true);
		try {
			await deleteDawarichSettings();
		} finally {
			setIsDisconnectingDawarich(false);
		}
	}

	const hasInput = immichKey.trim().length > 0 || dawarichKey.trim().length > 0;

	let submitLabel = 'Save';
	if (isSubmitting) {
		submitLabel = 'Validating...';
	}

	return (
		<DialogShell
			isOpen={isOpen}
			onClose={onClose}
			title={'API Keys'}
			subtitle={'Manage your API keys.'}>
			<div className={'px-4 py-3'}>
				<form
					onSubmit={handleSubmit}
					className={'flex flex-col gap-4'}>
					<div className={'flex flex-col gap-2'}>
						<p className={sectionLabelClass}>{'Immich'}</p>
						<PasswordInput
							value={immichKey}
							onChange={setImmichKey}
							placeholder={'Immich API Key'}
						/>
					</div>
					<div className={'flex flex-col gap-2 border-t border-(--color-border) pt-3'}>
						<p className={sectionLabelClass}>{'Dawarich'}</p>
						{hasDawarichCredentials && (
							<div className={'flex items-center justify-between'}>
								<span className={'text-sm text-(--color-text-secondary)'}>{'Connected'}</span>
								<button
									type={'button'}
									disabled={isDisconnectingDawarich}
									onClick={handleDawarichDisconnect}
									className={
										'cursor-pointer rounded-md border border-red-300 bg-transparent px-2 py-1 text-xs text-red-600 hover:bg-red-50 disabled:opacity-50 dark:border-red-800 dark:text-red-400 dark:hover:bg-red-950'
									}>
									{isDisconnectingDawarich && 'Disconnecting...'}
									{!isDisconnectingDawarich && 'Disconnect'}
								</button>
							</div>
						)}
						{!hasDawarichCredentials && (
							<PasswordInput
								value={dawarichKey}
								onChange={setDawarichKey}
								placeholder={'Dawarich API Key'}
							/>
						)}
					</div>
					{error && <p className={'text-sm text-red-600'}>{error}</p>}
					<button
						type={'submit'}
						disabled={isSubmitting || !hasInput}
						className={
							'cursor-pointer rounded-lg border-0 bg-(--color-primary) py-2 text-sm font-medium text-white disabled:opacity-50'
						}>
						{submitLabel}
					</button>
				</form>
			</div>
		</DialogShell>
	);
}

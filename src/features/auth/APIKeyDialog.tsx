'use client';

import * as Dialog from '@radix-ui/react-dialog';
import {useEffect, useState} from 'react';

import {useAuth} from '@/features/auth/AuthContext';

import type {ChangeEvent, ReactElement} from 'react';

type TAPIKeyDialogProps = {
	isOpen: boolean;
	onClose: () => void;
	onSuccess: () => void;
};

export function APIKeyDialog({isOpen, onClose, onSuccess}: TAPIKeyDialogProps): ReactElement {
	const {updateAPIKey, error} = useAuth();
	const [apiKey, setAPIKey] = useState('');
	const [shouldShowKey, setShouldShowKey] = useState(false);
	const [isSubmitting, setIsSubmitting] = useState(false);

	useEffect(() => {
		if (!isOpen) {
			setAPIKey('');
			setShouldShowKey(false);
			setIsSubmitting(false);
		}
	}, [isOpen]);

	async function handleSubmit(e: ChangeEvent): Promise<void> {
		e.preventDefault();
		if (!apiKey.trim()) {
			return;
		}
		setIsSubmitting(true);
		try {
			const didSucceed = await updateAPIKey(apiKey.trim());
			if (didSucceed) {
				onClose();
				onSuccess();
			}
		} finally {
			setIsSubmitting(false);
		}
	}

	let inputType = 'password';
	if (shouldShowKey) {
		inputType = 'text';
	}

	let toggleLabel = 'Show';
	if (shouldShowKey) {
		toggleLabel = 'Hide';
	}

	let submitLabel = 'Save API Key';
	if (isSubmitting) {
		submitLabel = 'Validating...';
	}

	return (
		<Dialog.Root
			open={isOpen}
			onOpenChange={open => {
				if (!open) {
					onClose();
				}
			}}>
			<Dialog.Portal>
				<Dialog.Overlay className={'fixed inset-0 z-[2000] bg-black/50'} />
				<Dialog.Content
					className={
						'fixed top-1/2 left-1/2 z-[2001] w-full max-w-md -translate-x-1/2 -translate-y-1/2 rounded-lg border border-(--color-border) bg-(--color-surface) shadow-lg focus:outline-none'
					}>
					<div className={'flex items-center justify-between border-b border-(--color-border) px-4 py-3'}>
						<div>
							<Dialog.Title className={'text-sm font-semibold text-(--color-text)'}>
								{'API Key'}
							</Dialog.Title>
							<p className={'mt-0.5 text-xs text-(--color-text-secondary)'}>
								{'Update your Immich API key.'}
							</p>
						</div>
						<Dialog.Close
							className={
								'flex h-6 w-6 cursor-pointer items-center justify-center rounded border-0 bg-transparent text-(--color-text-secondary) hover:text-(--color-text)'
							}>
							{'\u00D7'}
						</Dialog.Close>
					</div>

					<div className={'min-h-16 px-4 py-3'}>
						<form
							onSubmit={handleSubmit}
							className={'flex flex-col gap-3'}>
							<div className={'relative'}>
								<input
									type={inputType}
									placeholder={'Immich API Key'}
									value={apiKey}
									onChange={e => setAPIKey(e.target.value)}
									required
									className={
										'w-full rounded-lg border border-(--color-border) bg-(--color-bg) px-3 py-2 pr-16 text-sm outline-none focus:border-(--color-primary)'
									}
								/>
								<button
									type={'button'}
									onClick={() => setShouldShowKey(!shouldShowKey)}
									className={
										'absolute top-1/2 right-2 -translate-y-1/2 cursor-pointer border-0 bg-transparent px-2 py-1 text-xs text-(--color-text-secondary) hover:text-(--color-text)'
									}>
									{toggleLabel}
								</button>
							</div>
							{error && <p className={'text-sm text-red-600'}>{error}</p>}
							<button
								type={'submit'}
								disabled={isSubmitting || !apiKey.trim()}
								className={
									'cursor-pointer rounded-lg border-0 bg-(--color-primary) py-2 text-sm font-medium text-white disabled:opacity-50'
								}>
								{submitLabel}
							</button>
						</form>
					</div>
				</Dialog.Content>
			</Dialog.Portal>
		</Dialog.Root>
	);
}

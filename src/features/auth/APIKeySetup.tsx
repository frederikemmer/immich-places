'use client';

import {useState} from 'react';

import {useAuth} from '@/features/auth/AuthContext';

import type {ChangeEvent, ReactElement} from 'react';

/**
 * API key setup form for connecting an existing Immich integration.
 *
 * Collects an API key, sends it through auth context, and allows sign out.
 *
 * @returns Rendered API key setup panel.
 */
export function APIKeySetup(): ReactElement {
	const {updateAPIKey, error, logout} = useAuth();
	const [apiKey, setAPIKey] = useState('');
	const [shouldShowKey, setShouldShowKey] = useState(false);
	const [isSubmitting, setIsSubmitting] = useState(false);

	async function handleSubmit(e: ChangeEvent): Promise<void> {
		e.preventDefault();
		if (!apiKey.trim()) {
			return;
		}
		setIsSubmitting(true);
		try {
			await updateAPIKey(apiKey.trim());
		} finally {
			setIsSubmitting(false);
		}
	}

	return (
		<div className={'w-full max-w-sm p-8'}>
			<h1 className={'mb-2 text-xl font-semibold text-(--color-text)'}>{'Connect to Immich'}</h1>
			<p className={'mb-6 text-sm text-(--color-text-secondary)'}>
				{'Paste your Immich API key to start managing your photos. You can find it in Immich under Account'}
				{'Settings '}&rarr;{' API Keys.'}
			</p>
			<form
				onSubmit={handleSubmit}
				className={'flex flex-col gap-4'}>
				<div className={'relative'}>
					<input
						type={shouldShowKey ? 'text' : 'password'}
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
						{shouldShowKey ? 'Hide' : 'Show'}
					</button>
				</div>
				{error && <p className={'text-sm text-red-600'}>{error}</p>}
				<button
					type={'submit'}
					disabled={isSubmitting || !apiKey.trim()}
					className={
						'cursor-pointer rounded-lg border-0 bg-(--color-primary) py-2 text-sm font-medium text-white disabled:opacity-50'
					}>
					{isSubmitting ? 'Validating...' : 'Save API Key'}
				</button>
			</form>
			<button
				onClick={logout}
				className={
					'mt-4 w-full cursor-pointer border-0 bg-transparent py-1 text-sm text-(--color-text-secondary) hover:text-(--color-text)'
				}>
				{'Sign out'}
			</button>
		</div>
	);
}

'use client';

/**
 * Shared health-check hook for validating backend availability and surfacing status.
 */
import {useCallback, useEffect, useRef, useState} from 'react';

import {checkHealth} from '@/shared/services/backendApi';

import type {THealthResponse} from '@/shared/types/health';

/**
 * Return shape for backend health polling state and actions.
 *
 * - `isReady` indicates whether a valid health payload has been successfully loaded.
 * - `health` stores the last successfully loaded health response, or `null` before success.
 * - `error` stores a human-readable backend status error, or `null` when healthy.
 * - `retry` re-runs the backend health check and updates state.
 * - `refreshHealth` is an alias for `retry`, provided for explicit call sites.
 */
type TUseBackendStatusReturn = {
	isReady: boolean;
	health: THealthResponse | null;
	error: string | null;
	retry: () => Promise<void>;
	refreshHealth: () => Promise<void>;
};

/**
 * Checks backend availability and keeps health metadata reactive.
 *
 * Performs an initial check when mounted and exposes handlers to re-check.
 *
 * @returns The latest health payload and helper methods for refreshing it.
 */
export function useBackendStatus(): TUseBackendStatusReturn {
	const [health, setHealth] = useState<THealthResponse | null>(null);
	const [error, setError] = useState<string | null>(null);
	const abortRef = useRef<AbortController | null>(null);

	const check = useCallback(async (): Promise<void> => {
		abortRef.current?.abort();
		const controller = new AbortController();
		abortRef.current = controller;

		setError(null);
		try {
			const result = await checkHealth({signal: controller.signal});
			if (controller.signal.aborted) {
				return;
			}
			setHealth(result);
		} catch {
			if (controller.signal.aborted) {
				return;
			}
			setHealth(null);
			setError('Backend not reachable. Make sure the backend service is running.');
		}
	}, []);

	useEffect(() => {
		check();
		return () => {
			abortRef.current?.abort();
		};
	}, [check]);

	return {
		isReady: health !== null,
		health,
		error,
		retry: check,
		refreshHealth: check
	};
}

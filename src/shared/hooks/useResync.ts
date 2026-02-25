'use client';

/**
 * Shared resync hook for running backend synchronization and updating local state.
 */
import {useCallback, useEffect, useRef, useState} from 'react';

import {fetchSyncStatus, triggerSync} from '@/shared/services/backendApi';
import {isAbortError, waitForDelay} from '@/utils/abort';
import {
	RESYNC_BACKOFF_MULTIPLIER,
	RESYNC_INITIAL_POLL_DELAY_MS,
	RESYNC_MAX_POLL_DELAY_MS,
	RESYNC_MAX_POLL_DURATION_MS
} from '@/utils/resync';

/**
 * Polls sync status until sync finishes or a hard timeout is reached.
 *
 * @param controller - Abort signal controller allowing callers to cancel polling.
 * @returns Resolves when sync is no longer in progress or timeout is reached.
 */
async function pollUntilDone(controller: AbortController): Promise<void> {
	const startTime = Date.now();
	let delayMs = RESYNC_INITIAL_POLL_DELAY_MS;

	while (true) {
		await waitForDelay(delayMs, controller.signal);
		if (Date.now() - startTime > RESYNC_MAX_POLL_DURATION_MS) {
			break;
		}
		const status = await fetchSyncStatus({signal: controller.signal});
		if (!status.syncing) {
			break;
		}
		delayMs = Math.min(Math.round(delayMs * RESYNC_BACKOFF_MULTIPLIER), RESYNC_MAX_POLL_DELAY_MS);
	}
}

/**
 * Resync caller dependencies consumed by the hook.
 *
 * - `retryBackendAction` re-runs backend connectivity or auth checks.
 * - `refreshData` refetches data once sync completes.
 */
type TUseResyncArgs = {
	isReady: boolean;
	retryBackendAction: () => Promise<void>;
	refreshData: () => Promise<void>;
};

/**
 * Return shape for the resync hook.
 *
 * - `isSyncing` indicates whether a resync request is actively running.
 * - `syncError` stores the last sync error message, or `null` when none exists.
 * - `resyncAction` executes a full resync flow with status polling.
 */
type TUseResyncResult = {
	isSyncing: boolean;
	syncError: string | null;
	resyncAction: () => Promise<void>;
};

/**
 * Execute backend resync cycles and refresh application data after completion.
 *
 * Starts a sync when needed, then polls status with exponential backoff until the backend
 * reports completion or timeout. Errors are exposed through `syncError` for UI rendering.
 *
 * @param retryBackendAction - Hook consumer function to re-check backend prerequisites.
 * @param refreshData - Hook consumer function to refresh local application data after sync.
 * @returns Whether syncing is active, current sync error, and an action to trigger resync.
 */
export function useResync({isReady, retryBackendAction, refreshData}: TUseResyncArgs): TUseResyncResult {
	const [isSyncing, setIsSyncing] = useState(false);
	const [syncError, setSyncError] = useState<string | null>(null);
	const isSyncingRef = useRef(false);
	const abortRef = useRef<AbortController | null>(null);
	const initialSyncCheckDoneRef = useRef(false);

	const retryBackendActionRef = useRef(retryBackendAction);
	retryBackendActionRef.current = retryBackendAction;
	const refreshDataRef = useRef(refreshData);
	refreshDataRef.current = refreshData;

	const reloadData = useCallback(async () => {
		await retryBackendActionRef.current();
		await refreshDataRef.current();
	}, []);

	const runSyncFlow = useCallback(
		async (controller: AbortController, shouldStartSync: boolean): Promise<void> => {
			if (shouldStartSync) {
				await triggerSync({signal: controller.signal});
			} else {
				const status = await fetchSyncStatus({signal: controller.signal});
				if (!status.syncing) {
					return;
				}
			}

			await pollUntilDone(controller);
			await reloadData();
		},
		[reloadData]
	);

	const executeSync = useCallback(
		async (shouldStartSync: boolean): Promise<void> => {
			if (isSyncingRef.current) {
				return;
			}
			isSyncingRef.current = true;
			setIsSyncing(true);
			setSyncError(null);
			abortRef.current?.abort();
			const controller = new AbortController();
			abortRef.current = controller;

			try {
				await runSyncFlow(controller, shouldStartSync);
			} catch (error) {
				if (isAbortError(error)) {
					return;
				}
				setSyncError(error instanceof Error ? error.message : 'Sync failed');
			} finally {
				if (abortRef.current === controller) {
					abortRef.current = null;
				}
				isSyncingRef.current = false;
				setIsSyncing(false);
			}
		},
		[runSyncFlow]
	);

	const resyncAction = useCallback(async () => {
		await executeSync(true);
	}, [executeSync]);

	useEffect(() => {
		return () => {
			abortRef.current?.abort();
		};
	}, []);

	useEffect(() => {
		if (isReady && !initialSyncCheckDoneRef.current) {
			initialSyncCheckDoneRef.current = true;
			void executeSync(false);
		}
	}, [isReady, executeSync]);

	return {isSyncing, syncError, resyncAction};
}

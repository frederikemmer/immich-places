'use client';

import {useEffect, useRef} from 'react';

/**
 * Parameters required to perform the initial catalog bootstrap sequence.
 * `isReady` indicates the catalog context is ready and initial fetches can start.
 * `loadPageAction` loads the first photo page.
 * `loadAlbumsAction` loads the album index set.
 */
type TInitialCatalogLoadArgs = {
	isReady: boolean;
	loadPageAction: (page: number) => Promise<void>;
	loadAlbumsAction: () => Promise<void>;
};

/**
 * Runs the first-time catalog initialization side effects exactly once per mount.
 *
 * This hook gates the first page load and albums load behind `isReady` and uses
 * refs to avoid duplicate fetches when effects re-run.
 *
 * @param args - Bootstrap actions and readiness state.
 *   - isReady: Indicates catalog context is ready.
 *   - loadPageAction: Loads the first photo page.
 *   - loadAlbumsAction: Loads the album index set.
 */
export function useInitialCatalogLoad({isReady, loadPageAction, loadAlbumsAction}: TInitialCatalogLoadArgs): void {
	const initialLoadDoneRef = useRef(false);
	useEffect(() => {
		if (isReady && !initialLoadDoneRef.current) {
			initialLoadDoneRef.current = true;
			void loadPageAction(1);
		}
	}, [isReady, loadPageAction]);

	const initialAlbumsLoadDoneRef = useRef(false);
	useEffect(() => {
		if (isReady && !initialAlbumsLoadDoneRef.current) {
			initialAlbumsLoadDoneRef.current = true;
			void loadAlbumsAction();
		}
	}, [isReady, loadAlbumsAction]);
}

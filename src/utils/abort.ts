/**
 * Utility helpers for abort-aware async workflows.
 */
export function isAbortError(error: unknown): boolean {
	return error instanceof DOMException && error.name === 'AbortError';
}

/**
 * Waits for the given delay, but rejects early when the abort signal is triggered.
 *
 * @param ms - Delay in milliseconds before resolving.
 * @param signal - Abort signal to cancel the delay.
 * @returns Promise that resolves after timeout or rejects with `AbortError`.
 */
export async function waitForDelay(ms: number, signal: AbortSignal): Promise<void> {
	return new Promise((resolve, reject) => {
		const timer = setTimeout(() => {
			signal.removeEventListener('abort', onAbort);
			resolve();
		}, ms);
		const onAbort = (): void => {
			clearTimeout(timer);
			signal.removeEventListener('abort', onAbort);
			reject(new DOMException('Aborted', 'AbortError'));
		};
		signal.addEventListener('abort', onAbort, {once: true});
	});
}

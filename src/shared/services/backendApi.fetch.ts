import {DEFAULT_BACKEND_REQUEST_TIMEOUT_MS} from '@/utils/request';

import type {TRequestOptions} from '@/shared/types/api';

/**
 * Parses response JSON and validates it with a runtime type guard.
 *
 * @param response - Browser `Response` object returned by fetch.
 * @param validator - Type guard to validate parsed payload shape.
 * @param errorMessage - Error message thrown when parse or validation fails.
 * @returns Parsed and typed response payload.
 * @throws Error when JSON parsing or runtime validation fails.
 */
export async function parseJSON<T>(
	response: Response,
	validator: (value: unknown) => value is T,
	errorMessage: string
): Promise<T> {
	let value: unknown;
	try {
		value = await response.json();
	} catch {
		throw new Error(errorMessage);
	}
	if (!validator(value)) {
		throw new Error(errorMessage);
	}
	return value;
}

/**
 * Executes a fetch request with default client headers and timeout behavior.
 *
 * @param url - Endpoint URL.
 * @param init - Native fetch options.
 * @param opts - Shared request options including optional timeout and abort signal.
 * @returns Native `Response` object from the fetch call.
 * @throws Error if the request times out due to configured timeout policy.
 */
export async function backendFetch(url: string, init: RequestInit = {}, opts: TRequestOptions = {}): Promise<Response> {
	const headers = new Headers(init.headers);
	const timeoutMs =
		typeof opts.timeoutMs === 'number' && opts.timeoutMs > 0 ? opts.timeoutMs : DEFAULT_BACKEND_REQUEST_TIMEOUT_MS;
	const timeoutController = new AbortController();
	const timeoutID = setTimeout(() => timeoutController.abort(), timeoutMs);
	const upstreamSignal = opts.signal ?? init.signal;
	const handleUpstreamAbort = (): void => timeoutController.abort();
	if (upstreamSignal) {
		if (upstreamSignal.aborted) {
			timeoutController.abort();
		} else {
			upstreamSignal.addEventListener('abort', handleUpstreamAbort, {once: true});
		}
	}

	try {
		return await fetch(url, {
			...init,
			headers,
			credentials: 'same-origin',
			signal: timeoutController.signal
		});
	} finally {
		clearTimeout(timeoutID);
		if (upstreamSignal) {
			upstreamSignal.removeEventListener('abort', handleUpstreamAbort);
		}
	}
}

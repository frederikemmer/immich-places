/**
 * Normalizes values intended to represent positive integer pagination-like settings.
 *
 * @param value - Raw number input from caller/query.
 * @param fallback - Fallback used when value is not a finite positive integer.
 * @returns A finite, strictly positive integer.
 */
export function normalizePositiveInteger(value: number, fallback: number): number {
	const normalized = Math.trunc(value);
	if (!Number.isFinite(normalized) || normalized <= 0) {
		return fallback;
	}
	return normalized;
}

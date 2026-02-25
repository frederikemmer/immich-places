/**
 * Runtime type guards shared across service and domain parsing.
 */
/**
 * Checks whether a value is a plain object record.
 */
export function isRecord(value: unknown): value is Record<string, unknown> {
	return typeof value === 'object' && value !== null && !Array.isArray(value);
}

/**
 * Checks whether a value is a finite number.
 */
export function isFiniteNumber(value: unknown): value is number {
	return typeof value === 'number' && Number.isFinite(value);
}

/**
 * Checks whether a value is a string.
 */
export function isString(value: unknown): value is string {
	return typeof value === 'string';
}

/**
 * Checks whether a value is either null or a string.
 */
export function isNullableString(value: unknown): value is string | null {
	return value === null || typeof value === 'string';
}

/**
 * Checks whether a value is either null or a finite number.
 */
export function isNullableFiniteNumber(value: unknown): value is number | null {
	return value === null || isFiniteNumber(value);
}

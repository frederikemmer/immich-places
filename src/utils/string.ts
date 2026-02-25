const ASCII_CONTROL_CHAR_MAX_CODE_POINT = 31;
const ASCII_DELETE_CODE_POINT = 127;

/**
 * Checks whether a string contains ASCII control characters.
 *
 * @param value - Input string.
 * @returns `true` when value contains control characters, otherwise `false`.
 */
export function hasControlChars(value: string): boolean {
	for (let i = 0; i < value.length; i += 1) {
		const code = value.charCodeAt(i);
		if (code <= ASCII_CONTROL_CHAR_MAX_CODE_POINT || code === ASCII_DELETE_CODE_POINT) {
			return true;
		}
	}
	return false;
}

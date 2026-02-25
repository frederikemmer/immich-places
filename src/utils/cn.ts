/**
 * Class name utility to join conditional Tailwind/string values.
 *
 * @param c - Optional class name tokens. Falsy values are ignored.
 * @returns A space-separated className string.
 */
export function cn(...c: (string | false | undefined | null)[]): string {
	return c.filter(Boolean).join(' ');
}

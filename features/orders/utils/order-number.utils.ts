/**
 * Order Number Utilities
 *
 * Shared utility functions for formatting order numbers consistently
 * across the application.
 */

/**
 * Formats an order ID into a display-friendly order number
 * Takes the first 6 characters of the ID and prefixes with #
 * @param id - The order ID to format
 * @returns Formatted order number (e.g., "#ABC123")
 */
export function formatOrderNumber(id: string): string {
  return `#${id.slice(0, 6).toUpperCase()}`;
}

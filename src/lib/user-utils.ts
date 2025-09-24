/**
 * Utility functions for user-related operations
 */

/**
 * Get the initials from a user's name
 *
 * @param name The name to extract initials from
 * @param maxChars The maximum number of characters to extract (default: 2)
 * @returns The uppercase initials of the name, or a fallback if name is undefined
 */
export function getUserInitials(name?: string | null, maxChars = 2): string {
  if (!name) return "U";

  // Split the name by spaces and get the first letter of each part
  const parts = name.trim().split(/\s+/);

  if (parts.length === 1) {
    // If single name, take the first two characters
    return name.substring(0, maxChars).toUpperCase();
  } else {
    // If multiple parts, take first letter from first and last part
    const firstPart = parts[0].charAt(0);
    const lastPart = parts[parts.length - 1].charAt(0);
    return (firstPart + lastPart).toUpperCase();
  }
}

/**
 * Format a user name for display by capitalizing first letter of each word
 *
 * @param name The name to format
 * @returns The formatted name, or undefined if input is undefined
 */
export function formatUserName(name?: string | null): string | undefined {
  if (!name) return undefined;

  return name
    .trim()
    .split(/\s+/)
    .map((part) => part.charAt(0).toUpperCase() + part.slice(1).toLowerCase())
    .join(" ");
}

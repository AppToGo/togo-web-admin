/**
 * Generates a URL-friendly slug from a product name.
 *
 * @param name - The product name to convert to a slug
 * @returns A lowercase, hyphen-separated, accent-stripped slug
 */
export function generateSlug(name: string): string {
  return name
    .toLowerCase()
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "")
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-+|-+$/g, "");
}

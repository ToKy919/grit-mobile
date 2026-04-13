/**
 * GRIT — ID Generator
 * No external deps needed — timestamp + random is sufficient for local-first app
 */

export function generateId(): string {
  const timestamp = Date.now().toString(36);
  const random = Math.random().toString(36).substring(2, 8);
  return `${timestamp}-${random}`;
}

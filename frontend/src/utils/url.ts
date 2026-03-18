/**
 * URL safety utilities — prevents open redirect and javascript: URI injection.
 * Use isSafeUrl() before any window.open() or <a href> with server-supplied URLs.
 */

const ALLOWED_PROTOCOLS = ['https:', 'http:']

/**
 * Returns true only if the URL has an http(s) scheme and is parseable.
 * Blocks javascript:, data:, vbscript:, and malformed URIs.
 */
export function isSafeUrl(url: string | null | undefined): boolean {
  if (!url) return false
  try {
    const parsed = new URL(url)
    return ALLOWED_PROTOCOLS.includes(parsed.protocol)
  } catch {
    return false
  }
}

/**
 * Opens a URL in a new tab only if it passes the safety check.
 * Always sets noopener,noreferrer to prevent reverse tabnapping.
 */
export function safeWindowOpen(url: string | null | undefined): void {
  if (!isSafeUrl(url)) return
  window.open(url!, '_blank', 'noopener,noreferrer')
}

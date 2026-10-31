/**
 * Imperative triggers for the top viewport loading bar.
 * Can be called during fetch requests, button actions, or modal opens.
 */
export function startTopLoading() {
  if (typeof window !== 'undefined') {
    window.dispatchEvent(new CustomEvent('cadence-loading-start'))
  }
}
export function stopTopLoading() {
  if (typeof window !== 'undefined') {
    window.dispatchEvent(new CustomEvent('cadence-loading-done'))
  }
}

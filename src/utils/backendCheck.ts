/**
 * Utility to check if the backend API is available
 * Used to conditionally enable/disable features that require the backend
 * (e.g., domain scanner)
 */

const BACKEND_URL = import.meta.env.VITE_BACKEND_URL || 'http://localhost:5001';
const HEALTH_ENDPOINT = `${BACKEND_URL}/health`;

let backendAvailable: boolean | null = null;
let checkPromise: Promise<boolean> | null = null;

/**
 * Check if the backend is available by attempting to fetch the health endpoint
 * Returns cached result if already checked
 */
export async function isBackendAvailable(): Promise<boolean> {
  // Return cached result if available
  if (backendAvailable !== null) {
    return backendAvailable;
  }

  // Return existing promise if check is in progress
  if (checkPromise) {
    return checkPromise;
  }

  // Perform the check
  checkPromise = (async () => {
    try {
      const controller = new AbortController();
      const timeoutId = setTimeout(() => controller.abort(), 3000); // 3 second timeout

      const response = await fetch(HEALTH_ENDPOINT, {
        method: 'GET',
        signal: controller.signal,
      });

      clearTimeout(timeoutId);

      backendAvailable = response.ok;
      return backendAvailable;
    } catch (error) {
      // Backend not available (network error, timeout, or CORS issue)
      backendAvailable = false;
      return false;
    } finally {
      checkPromise = null;
    }
  })();

  return checkPromise;
}

/**
 * Reset the backend availability check
 * Call this if you want to re-check availability
 */
export function resetBackendCheck(): void {
  backendAvailable = null;
  checkPromise = null;
}

/**
 * Get the backend URL
 */
export function getBackendUrl(): string {
  return BACKEND_URL;
}

// MARK: SYSTEM(Audio) -> Audio Preview Blob URL Management
// Purpose: Create and revoke Object URLs for audio preview without memory leaks
// Success: createPreviewURL returns valid audio URL, revokePreviewURL cleans up memory
// Failure: URL created but not revoked, memory leak on repeated calls

/**
 * Current preview URL.
 * Stored to ensure proper revocation.
 */
let currentPreviewURL: string | null = null;

/**
 * Create a preview URL from audio Blob.
 * Called after recording stops, before save dialog.
 * @param blob - Audio Blob from stopRecording()
 * @returns Object URL string (blob:https://...)
 */
export function createPreviewURL(blob: Blob): string {
	// Revoke previous URL if exists
	if (currentPreviewURL) {
		URL.revokeObjectURL(currentPreviewURL);
	}

	currentPreviewURL = URL.createObjectURL(blob);
	return currentPreviewURL;
}

/**
 * Revoke current preview URL to free memory.
 * Called on component unmount or when archiving story.
 */
export function revokePreviewURL(): void {
	if (currentPreviewURL) {
		URL.revokeObjectURL(currentPreviewURL);
		currentPreviewURL = null;
	}
}

/**
 * Get current preview URL without creating a new one.
 * Used by audio player <audio src={getPreviewURL()}>
 * @returns Current preview URL or null
 */
export function getPreviewURL(): string | null {
	return currentPreviewURL;
}

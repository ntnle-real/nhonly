// MARK: errors — Classified error hierarchy for user-facing messages
// Purpose: Map browser exceptions to typed errors with platform detection and remediation hints
// Success: DOMException classified as PermissionError, BrowserError, or StorageError; user gets contextual message
// Failure: Unknown exception type; falls back to generic message

/**
 * Base error class for all nhonly recording errors.
 * All errors thrown from recording, archive, and capability modules extend this.
 */
export class NhonlyError extends Error {
	constructor(
		public code: string,
		message: string,
		public context?: Record<string, any>
	) {
		super(message);
		this.name = 'NhonlyError';
	}
}

/**
 * Recording-specific error.
 * Thrown by src/lib/recording.ts functions when recording fails.
 */
export class RecordingError extends NhonlyError {
	constructor(message: string, context?: Record<string, any>) {
		super('RECORDING_ERROR', message, context);
		this.name = 'RecordingError';
	}
}

/**
 * Microphone permission error.
 * Thrown when user denies permission or browser blocks access.
 * Includes platform-specific remediation (iOS vs Windows vs macOS).
 */
export class PermissionError extends NhonlyError {
	public platform: 'iOS' | 'Android' | 'macOS' | 'Windows' | 'Linux' | 'unknown';

	constructor(message: string, context?: Record<string, any>) {
		super('PERMISSION_ERROR', message, context);
		this.name = 'PermissionError';
		this.platform = detectPlatform();
	}
}

/**
 * Browser compatibility error.
 * Thrown when Web Audio API, MediaRecorder, or IndexedDB unavailable.
 */
export class BrowserError extends NhonlyError {
	public missingAPIs: string[];

	constructor(message: string, missingAPIs: string[] = [], context?: Record<string, any>) {
		super('BROWSER_ERROR', message, { ...context, missingAPIs });
		this.name = 'BrowserError';
		this.missingAPIs = missingAPIs;
	}
}

/**
 * Storage/IndexedDB error.
 * Thrown when database writes fail or quota exceeded.
 */
export class StorageError extends NhonlyError {
	constructor(message: string, context?: Record<string, any>) {
		super('STORAGE_ERROR', message, context);
		this.name = 'StorageError';
	}
}

/**
 * Detect platform from user agent.
 * Used for platform-specific error remediation hints.
 */
function detectPlatform(): PermissionError['platform'] {
	if (typeof navigator === 'undefined') return 'unknown';
	const ua = navigator.userAgent.toLowerCase();
	if (ua.includes('iphone') || ua.includes('ipad')) return 'iOS';
	if (ua.includes('android')) return 'Android';
	if (ua.includes('mac')) return 'macOS';
	if (ua.includes('win')) return 'Windows';
	if (ua.includes('linux')) return 'Linux';
	return 'unknown';
}

/**
 * Classify DOMException or Error into typed error.
 * Inspects error message and context to determine most specific error type.
 * @param error - Caught error from browser API
 * @param context - Contextual information (which API failed, what were we doing)
 * @returns Typed error (PermissionError, BrowserError, StorageError, or RecordingError)
 */
export function classifyError(
	error: any,
	context?: { operation?: string; api?: string }
): NhonlyError {
	const message = error?.message ?? String(error);
	const op = context?.operation ?? 'unknown operation';
	const api = context?.api ?? 'unknown API';

	// Permission-related errors
	if (
		message.includes('Permission denied') ||
		message.includes('NotAllowedError') ||
		message.includes('user denied') ||
		error?.name === 'NotAllowedError'
	) {
		return new PermissionError(
			`Microphone access required to ${op}. Check your browser permissions.`,
			{ originalMessage: message, operation: op, api }
		);
	}

	// Browser compatibility errors
	if (
		message.includes('not supported') ||
		message.includes('undefined') ||
		message.includes('is not a function')
	) {
		return new BrowserError(
			`Your browser doesn't support this feature. Please use a modern browser.`,
			[api],
			{ originalMessage: message, operation: op, api }
		);
	}

	// Storage/quota errors
	if (
		message.includes('QuotaExceededError') ||
		message.includes('quota') ||
		message.includes('storage')
	) {
		return new StorageError(
			`Storage space full. Please delete old recordings to continue.`,
			{ originalMessage: message, operation: op, api }
		);
	}

	// Default: recording error
	return new RecordingError(
		`Recording failed: ${message}`,
		{ originalMessage: message, operation: op, api }
	);
}

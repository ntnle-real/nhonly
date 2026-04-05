// MARK: capabilities — Browser API feature detection
// Purpose: Detect required Web Audio/MediaRecorder/IndexedDB support at startup
// Success: All required APIs present; capabilities object shows full support
// Failure: One or more required APIs missing; triggers graceful degradation UI

import { BrowserError } from './errors';

/**
 * Browser capability detection result.
 * Each capability reflects support for a core feature.
 */
export interface BrowserCapabilities {
	/**
	 * MediaRecorder API available (required for recording)
	 * Chrome 49+, Firefox 25+, Safari 14.1+, Edge 79+
	 */
	hasMediaRecorder: boolean;

	/**
	 * Web Audio API / AnalyserNode available (required for waveform)
	 * Chrome 14+, Firefox 25+, Safari 6+, Edge 12+
	 */
	hasWebAudioAPI: boolean;

	/**
	 * getUserMedia available (required for microphone access)
	 * Chrome 53+, Firefox 55+, Safari 14.1+, Edge 79+
	 */
	hasGetUserMedia: boolean;

	/**
	 * IndexedDB available (required for storage)
	 * IE 10+, all modern browsers
	 */
	hasIndexedDB: boolean;

	/**
	 * All required features present?
	 */
	isSupported: boolean;

	/**
	 * Human-readable browser name and version
	 */
	browser: string;

	/**
	 * List of missing APIs (empty if all present)
	 */
	missingAPIs: string[];
}

/**
 * Detect browser capabilities at startup.
 * Called in +page.svelte onMount to show "unsupported browser" message if needed.
 * @returns BrowserCapabilities object
 */
export function checkBrowserCapabilities(): BrowserCapabilities {
	const capabilities: BrowserCapabilities = {
		hasMediaRecorder: typeof MediaRecorder !== 'undefined',
		hasWebAudioAPI:
			typeof (window as any).AudioContext !== 'undefined' ||
			typeof (window as any).webkitAudioContext !== 'undefined',
		hasGetUserMedia:
			navigator?.mediaDevices?.getUserMedia !== undefined,
		hasIndexedDB: typeof window !== 'undefined' && window.indexedDB !== undefined,
		isSupported: false,
		browser: detectBrowser(),
		missingAPIs: []
	};

	// Determine which APIs are missing
	if (!capabilities.hasMediaRecorder) {
		capabilities.missingAPIs.push('MediaRecorder');
	}
	if (!capabilities.hasWebAudioAPI) {
		capabilities.missingAPIs.push('Web Audio API');
	}
	if (!capabilities.hasGetUserMedia) {
		capabilities.missingAPIs.push('getUserMedia');
	}
	if (!capabilities.hasIndexedDB) {
		capabilities.missingAPIs.push('IndexedDB');
	}

	// All required APIs present?
	capabilities.isSupported =
		capabilities.hasMediaRecorder &&
		capabilities.hasWebAudioAPI &&
		capabilities.hasGetUserMedia &&
		capabilities.hasIndexedDB;

	return capabilities;
}

/**
 * Get user-friendly browser name and version.
 * @returns Browser name like "Chrome 120" or "Safari 17"
 */
function detectBrowser(): string {
	const ua = navigator.userAgent;

	// Chrome
	if (/Chrome\/(\d+)/.test(ua)) {
		const match = ua.match(/Chrome\/(\d+)/);
		return `Chrome ${match?.[1] ?? 'unknown'}`;
	}

	// Firefox
	if (/Firefox\/(\d+)/.test(ua)) {
		const match = ua.match(/Firefox\/(\d+)/);
		return `Firefox ${match?.[1] ?? 'unknown'}`;
	}

	// Safari
	if (/Version\/(\d+).*Safari/.test(ua)) {
		const match = ua.match(/Version\/(\d+)/);
		return `Safari ${match?.[1] ?? 'unknown'}`;
	}

	// Edge
	if (/Edg\/(\d+)/.test(ua)) {
		const match = ua.match(/Edg\/(\d+)/);
		return `Edge ${match?.[1] ?? 'unknown'}`;
	}

	return 'Unknown browser';
}

/**
 * Assert browser has required capabilities.
 * Throws BrowserError if any required API missing.
 * @param caps - Capabilities from checkBrowserCapabilities()
 * @throws BrowserError if not supported
 */
export function assertBrowserSupported(caps: BrowserCapabilities): void {
	if (!caps.isSupported) {
		throw new BrowserError(
			`Your browser (${caps.browser}) is not supported. Please upgrade to a modern browser like Chrome, Firefox, Safari, or Edge.`,
			caps.missingAPIs,
			{ browser: caps.browser, missingAPIs: caps.missingAPIs }
		);
	}
}

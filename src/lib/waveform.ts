// MARK: SYSTEM(Audio) -> Waveform Visualization Service
// Purpose: Stream frequency data from microphone audio stream via AnalyserNode for real-time visualization
// Success: AnalyserNode connected to MediaStream, getFrequencyData returns byte array at 30+ FPS, cleanup disconnects properly
// Failure: AnalyserNode creation fails, frequency data empty, memory leak from RAF

import type { ObservationSession } from './obs';

/**
 * Singleton AudioContext reused across app lifetime.
 * Created lazily on first waveform analysis start.
 */
let audioContext: AudioContext | null = null;

/**
 * Current AnalyserNode for streaming frequency data.
 * Set when startWaveformAnalysis called, cleared on stopWaveformAnalysis.
 */
let analyserNode: AnalyserNode | null = null;

/**
 * Source node connecting MediaStream to AnalyserNode.
 * Cleared on stopWaveformAnalysis.
 */
let sourceNode: MediaStreamAudioSourceNode | null = null;

/**
 * RAF ID for cleanup on stopWaveformAnalysis.
 */
let rafId: number | null = null;

/**
 * Get or create singleton AudioContext.
 * Uses webkit prefix for Safari compatibility.
 * @returns AudioContext instance
 */
function getAudioContext(): AudioContext {
	if (audioContext !== null) {
		return audioContext;
	}

	const contextClass = (window as any).AudioContext || (window as any).webkitAudioContext;
	if (!contextClass) {
		throw new Error('Web Audio API not supported in this browser');
	}

	audioContext = new contextClass() as AudioContext;
	return audioContext;
}

/**
 * Start waveform analysis from MediaStream.
 * Called when recording starts in +page.svelte.
 * Connects AnalyserNode to microphone stream.
 * @param stream - MediaStream from getUserMedia
 * @param obs - Observation session for contract tracing
 */
export function startWaveformAnalysis(stream: MediaStream, obs?: ObservationSession): void {
	obs?.step('start_waveform_analysis');

	try {
		const context = getAudioContext();
		obs?.observe('audio_context_ready');

		// Create AnalyserNode for frequency analysis
		analyserNode = context.createAnalyser();
		analyserNode.fftSize = 256; // 128 frequency bins
		obs?.observe('analyser_node_created');

		// Connect MediaStream to AnalyserNode
		sourceNode = context.createMediaStreamSource(stream);
		sourceNode.connect(analyserNode);
		obs?.observe('media_stream_connected');

		obs?.return_('waveform_analysis_started', { binCount: analyserNode.frequencyBinCount });
	} catch (error) {
		obs?.observe('waveform_analysis_error', String(error));
		throw error;
	}
}

/**
 * Get current frequency data for Canvas rendering.
 * Called repeatedly by Waveform.svelte render loop.
 * Returns byte frequency values (0-255) for each bin.
 * @param obs - Observation session for contract tracing
 * @returns Array of frequency bytes, length = analyserNode.frequencyBinCount
 */
export function getFrequencyData(obs?: ObservationSession): Uint8Array {
	obs?.step('get_frequency_data');

	if (!analyserNode) {
		obs?.observe('analyser_not_ready');
		return new Uint8Array(0);
	}

	const data = new Uint8Array(analyserNode.frequencyBinCount);
	analyserNode.getByteFrequencyData(data);
	obs?.return_('frequency_data_fetched', { binCount: data.length });

	return data;
}

/**
 * Stop waveform analysis and cleanup AnalyserNode.
 * Called when recording stops or user cancels.
 * Disconnects source and clears analyser reference.
 * @param obs - Observation session for contract tracing
 */
export function stopWaveformAnalysis(obs?: ObservationSession): void {
	obs?.step('stop_waveform_analysis');

	// Cancel any pending animation frame
	if (rafId !== null) {
		cancelAnimationFrame(rafId);
		rafId = null;
		obs?.observe('raf_cancelled');
	}

	// Disconnect source from analyser
	if (sourceNode && analyserNode) {
		sourceNode.disconnect(analyserNode);
		obs?.observe('source_disconnected');
	}

	// Clear analyser reference (but keep AudioContext for reuse)
	analyserNode = null;
	sourceNode = null;
	obs?.return_('waveform_analysis_stopped', null);
}

/**
 * Store RAF ID for cleanup.
 * Called by Waveform.svelte animation loop.
 * @param id - requestAnimationFrame ID
 */
export function setRAFId(id: number): void {
	rafId = id;
}

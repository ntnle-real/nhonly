import { describe, it, expect, beforeEach, vi, afterEach } from 'vitest';
import { startWaveformAnalysis, getFrequencyData, stopWaveformAnalysis, setRAFId } from './waveform';
import type { ObservationSession } from './obs';

/**
 * Mock Web Audio API for testing.
 * Tests run in jsdom (not a real browser), so we stub the APIs.
 */

// Global state for tracking analyser between calls
let globalAnalyser: MockAnalyserNode | null = null;
let globalSourceNode: MockMediaStreamAudioSourceNode | null = null;

// Mock AnalyserNode
class MockAnalyserNode {
	frequencyBinCount = 128;
	fftSize = 256;
	connected = false;

	getByteFrequencyData(array: Uint8Array) {
		// Return mock frequency data (varying values for testing)
		for (let i = 0; i < array.length; i++) {
			array[i] = Math.floor((i / array.length) * 255);
		}
	}
}

// Mock MediaStreamAudioSourceNode
class MockMediaStreamAudioSourceNode {
	analyser: MockAnalyserNode | null = null;

	connect(node: MockAnalyserNode) {
		this.analyser = node;
		node.connected = true;
		globalAnalyser = node;
	}

	disconnect(node?: MockAnalyserNode) {
		if (node) {
			this.analyser = null;
			globalAnalyser = null;
		}
	}
}

// Mock AudioContext
class MockAudioContext {
	analyser: MockAnalyserNode | null = null;
	mediaStreamSource: MockMediaStreamAudioSourceNode | null = null;

	createAnalyser(): MockAnalyserNode {
		this.analyser = new MockAnalyserNode();
		globalAnalyser = this.analyser;
		return this.analyser;
	}

	createMediaStreamSource(stream: any): MockMediaStreamAudioSourceNode {
		this.mediaStreamSource = new MockMediaStreamAudioSourceNode();
		globalSourceNode = this.mediaStreamSource;
		return this.mediaStreamSource;
	}
}

// Mock observation session
const createMockObsSession = (): ObservationSession => ({
	read: vi.fn(),
	step: vi.fn(),
	observe: vi.fn(),
	return_: vi.fn((name: string, value: any) => value)
});

// Setup: Mock Web Audio APIs before each test
beforeEach(() => {
	// Reset global state
	globalAnalyser = null;
	globalSourceNode = null;

	(window as any).AudioContext = MockAudioContext;
	(window as any).webkitAudioContext = undefined;

	// Reset RAF mock
	vi.clearAllMocks();
});

afterEach(() => {
	// Clean up global state
	globalAnalyser = null;
	globalSourceNode = null;

	// Clean up any pending animation frames
	vi.clearAllTimers();
	vi.clearAllMocks();
});

describe('waveform.ts - Waveform Visualization Service', () => {
	describe('startWaveformAnalysis', () => {
		it('should create an AudioContext on first call', () => {
			const mockStream = { id: 'mock-stream' } as any;
			startWaveformAnalysis(mockStream);

			// Verify analyser is connected by checking globalAnalyser
			expect(globalAnalyser).not.toBeNull();
			expect(globalAnalyser?.frequencyBinCount).toBe(128);
		});

		it('should connect AnalyserNode to MediaStream', () => {
			const mockStream = { id: 'mock-stream' } as any;
			const obs = createMockObsSession();

			startWaveformAnalysis(mockStream, obs);

			// Verify observation calls
			expect(obs.step).toHaveBeenCalledWith('start_waveform_analysis');
			expect(obs.observe).toHaveBeenCalledWith('audio_context_ready');
			expect(obs.observe).toHaveBeenCalledWith('analyser_node_created');
			expect(obs.observe).toHaveBeenCalledWith('media_stream_connected');
		});

		it('should record waveform_analysis_started observation', () => {
			const mockStream = { id: 'mock-stream' } as any;
			const obs = createMockObsSession();

			startWaveformAnalysis(mockStream, obs);

			expect(obs.return_).toHaveBeenCalledWith(
				'waveform_analysis_started',
				expect.objectContaining({
					binCount: 128
				})
			);
		});
	});

	describe('getFrequencyData', () => {
		it('should return Uint8Array of frequency data', () => {
			const mockStream = { id: 'mock-stream' } as any;
			startWaveformAnalysis(mockStream);

			const data = getFrequencyData();

			expect(data).toBeInstanceOf(Uint8Array);
			expect(data.length).toBe(128);
		});

		it('should return non-empty data from analyser', () => {
			const mockStream = { id: 'mock-stream' } as any;
			startWaveformAnalysis(mockStream);

			const data = getFrequencyData();

			// Mock data varies from 0 to 255
			expect(data.some((val) => val > 0)).toBe(true);
		});

		it('should return empty array when analyser not initialized', () => {
			// Ensure analyser is not initialized
			stopWaveformAnalysis();
			globalAnalyser = null;

			const data = getFrequencyData();

			expect(data).toBeInstanceOf(Uint8Array);
			expect(data.length).toBe(0);
		});

		it('should record frequency_data_fetched observation', () => {
			const mockStream = { id: 'mock-stream' } as any;
			startWaveformAnalysis(mockStream);

			const obs = createMockObsSession();
			getFrequencyData(obs);

			expect(obs.step).toHaveBeenCalledWith('get_frequency_data');
			expect(obs.return_).toHaveBeenCalledWith(
				'frequency_data_fetched',
				expect.objectContaining({
					binCount: 128
				})
			);
		});
	});

	describe('stopWaveformAnalysis', () => {
		it('should disconnect source and clear analyser reference', () => {
			const mockStream = { id: 'mock-stream' } as any;
			startWaveformAnalysis(mockStream);

			// Verify analyser is active
			const dataBeforeStop = getFrequencyData();
			expect(dataBeforeStop.length).toBe(128);

			stopWaveformAnalysis();

			// After stop, getFrequencyData should return empty array
			const dataAfterStop = getFrequencyData();
			expect(dataAfterStop.length).toBe(0);
		});

		it('should cancel pending animation frames', () => {
			const mockStream = { id: 'mock-stream' } as any;
			startWaveformAnalysis(mockStream);

			const rafId = 42;
			setRAFId(rafId);

			// Mock cancelAnimationFrame
			const cancelAnimationFrameSpy = vi.spyOn(window, 'cancelAnimationFrame');

			stopWaveformAnalysis();

			expect(cancelAnimationFrameSpy).toHaveBeenCalledWith(rafId);
		});

		it('should record observation calls', () => {
			const mockStream = { id: 'mock-stream' } as any;
			startWaveformAnalysis(mockStream);

			const obs = createMockObsSession();
			stopWaveformAnalysis(obs);

			expect(obs.step).toHaveBeenCalledWith('stop_waveform_analysis');
			// Verify observe was called (order depends on state)
			expect(obs.observe).toHaveBeenCalled();
			expect(obs.return_).toHaveBeenCalledWith('waveform_analysis_stopped', null);
		});
	});

	describe('setRAFId', () => {
		it('should store RAF ID for cleanup', () => {
			const mockStream = { id: 'mock-stream' } as any;
			startWaveformAnalysis(mockStream);

			const rafId = 123;
			setRAFId(rafId);

			// Verify RAF ID is used in stopWaveformAnalysis
			const cancelAnimationFrameSpy = vi.spyOn(window, 'cancelAnimationFrame');
			stopWaveformAnalysis();

			expect(cancelAnimationFrameSpy).toHaveBeenCalledWith(rafId);
		});
	});

	describe('integration tests', () => {
		it('should support start -> get data -> stop lifecycle', () => {
			const mockStream = { id: 'mock-stream' } as any;
			const obs = createMockObsSession();

			// Start analysis
			startWaveformAnalysis(mockStream, obs);
			expect(getFrequencyData().length).toBe(128);

			// Get data multiple times
			const data1 = getFrequencyData();
			const data2 = getFrequencyData();
			expect(data1.length).toBe(128);
			expect(data2.length).toBe(128);

			// Stop analysis
			stopWaveformAnalysis(obs);
			expect(getFrequencyData().length).toBe(0);
		});

		it('should reuse AudioContext across multiple start/stop cycles', () => {
			const mockStream = { id: 'mock-stream' } as any;

			// First cycle
			startWaveformAnalysis(mockStream);
			expect(getFrequencyData().length).toBe(128);
			stopWaveformAnalysis();

			// Second cycle (should reuse same AudioContext)
			startWaveformAnalysis(mockStream);
			expect(getFrequencyData().length).toBe(128);
			stopWaveformAnalysis();
		});
	});
});

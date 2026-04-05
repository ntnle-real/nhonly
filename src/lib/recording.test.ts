import { describe, it, expect, beforeEach, vi } from 'vitest';
import {
	startRecording,
	pauseRecording,
	resumeRecording,
	stopRecording,
	getElapsedMs,
	isRecording,
	isPausedRecording,
	cancelRecording
} from './recording';

/**
 * Mock Web Audio API and MediaRecorder.
 * These tests run in jsdom, not a real browser, so we stub the APIs.
 */

// Mock MediaRecorder
class MockMediaRecorder {
	state: 'inactive' | 'recording' | 'paused' = 'inactive';
	ondataavailable: ((event: any) => void) | null = null;
	onstop: (() => void) | null = null;
	stream: any;

	constructor(stream: any) {
		this.stream = stream;
	}

	start() {
		this.state = 'recording';
	}

	pause() {
		this.state = 'paused';
	}

	resume() {
		this.state = 'recording';
	}

	stop() {
		this.state = 'inactive';
		// Simulate onstop callback
		if (this.onstop) {
			setTimeout(() => this.onstop?.(), 0);
		}
	}

	static isTypeSupported(type: string): boolean {
		return type === 'audio/wav' || type === 'audio/webm';
	}
}

// Setup: Mock navigator APIs
beforeEach(() => {
	const globalAny = globalThis as any;
	globalAny.MediaRecorder = MockMediaRecorder as any;

	// Mock getUserMedia
	globalAny.navigator = {
		mediaDevices: {
			getUserMedia: vi.fn(async () => ({
				getTracks: () => [{ stop: vi.fn() }]
			}))
		}
	} as any;

	// Mock window.setInterval (for timer)
	globalAny.window = {
		setInterval: vi.fn((cb: any, ms: number) => {
			const id = Math.random();
			return id as any;
		}),
		clearInterval: vi.fn()
	};

	// Reset recording state by calling cancelRecording
	// (Note: elapsedMs is module-scoped, so we cancel to reset it)
	try {
		cancelRecording();
	} catch {
		// Ignore if recording not started
	}
});

describe('recording.ts', () => {
	describe('startRecording()', () => {
		it('should start recording when permission granted', async () => {
			await startRecording();
			expect(isRecording()).toBe(true);
			expect(getElapsedMs()).toBe(0);
		});

		it('should initialize timer on start', async () => {
			await startRecording();
			expect(window.setInterval).toHaveBeenCalled();
		});

		it('should throw RecordingError on permission denied', async () => {
			(navigator.mediaDevices.getUserMedia as any).mockRejectedValueOnce(
				new DOMException('Permission denied', 'NotAllowedError')
			);

			await expect(startRecording()).rejects.toThrow();
			expect(isRecording()).toBe(false);
		});
	});

	describe('pauseRecording()', () => {
		it('should pause active recording', async () => {
			await startRecording();
			expect(isRecording()).toBe(true);

			pauseRecording();
			expect(isPausedRecording()).toBe(true);
		});

		it('should throw if recording not active', () => {
			expect(() => pauseRecording()).toThrow('Recording not active');
		});
	});

	describe('resumeRecording()', () => {
		it('should resume paused recording', async () => {
			await startRecording();
			pauseRecording();
			expect(isPausedRecording()).toBe(true);

			resumeRecording();
			expect(isRecording()).toBe(true);
			expect(isPausedRecording()).toBe(false);
		});

		it('should throw if recording not paused', async () => {
			await startRecording();
			expect(() => resumeRecording()).toThrow('Recording not paused');
		});
	});

	describe('stopRecording()', () => {
		it('should return audio blob on stop', async () => {
			await startRecording();
			const blob = await stopRecording();

			expect(blob).toBeInstanceOf(Blob);
			expect(isRecording()).toBe(false);
		});

		it('should throw if recording not started', async () => {
			await expect(stopRecording()).rejects.toThrow('Recording not started');
		});

		it('should cleanup timer on stop', async () => {
			await startRecording();
			await stopRecording();

			expect(window.clearInterval).toHaveBeenCalled();
		});

		it('should cleanup stream tracks on stop', async () => {
			const mockStop = vi.fn();
			(navigator.mediaDevices.getUserMedia as any).mockResolvedValueOnce({
				getTracks: () => [{ stop: mockStop }]
			});

			await startRecording();
			await stopRecording();

			// Wait for async cleanup
			await new Promise((resolve) => setTimeout(resolve, 10));

			expect(mockStop).toHaveBeenCalled();
		});
	});

	describe('getElapsedMs()', () => {
		it('should return 0 before recording starts', () => {
			expect(getElapsedMs()).toBe(0);
		});

		it('should return elapsed time during recording', async () => {
			await startRecording();
			const elapsed = getElapsedMs();
			expect(elapsed).toBeGreaterThanOrEqual(0);
		});
	});

	describe('isRecording()', () => {
		it('should return false initially', () => {
			expect(isRecording()).toBe(false);
		});

		it('should return true during recording', async () => {
			await startRecording();
			expect(isRecording()).toBe(true);
		});

		it('should return false after stop', async () => {
			await startRecording();
			await stopRecording();
			expect(isRecording()).toBe(false);
		});
	});

	describe('cancelRecording()', () => {
		it('should cleanup all resources', async () => {
			await startRecording();
			expect(isRecording()).toBe(true);

			cancelRecording();

			expect(isRecording()).toBe(false);
			expect(window.clearInterval).toHaveBeenCalled();
		});
	});

	describe('pause/resume cycle', () => {
		it('should support multiple pause/resume cycles', async () => {
			await startRecording();
			expect(isRecording()).toBe(true);

			// Cycle 1
			pauseRecording();
			expect(isPausedRecording()).toBe(true);
			resumeRecording();
			expect(isRecording()).toBe(true);

			// Cycle 2
			pauseRecording();
			expect(isPausedRecording()).toBe(true);
			resumeRecording();
			expect(isRecording()).toBe(true);

			// Stop
			const blob = await stopRecording();
			expect(blob).toBeInstanceOf(Blob);
		});
	});
});

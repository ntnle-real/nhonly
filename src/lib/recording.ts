// MARK: SYSTEM(Audio) -> Web Audio API Recording
// Purpose: Capture audio stream from microphone with pause/resume support and complete lifecycle cleanup
// Success: startRecording() begins capture, pauseRecording() pauses without losing audio, resumeRecording() continues, stopRecording() returns complete Blob
// Failure: Permission denied, recording not started, or MediaRecorder error

import type { ObservationSession } from './obs';
import { createObservationSession } from './obs';
import { RecordingError, classifyError } from './errors';

// Contract interfaces matching kernel/CONTRACTS.md TypeScript template

/**
 * Contract for startRecording function.
 * Declares: Reads audio_stream_request, returns recording_started
 */
interface StartRecordingContract {
	serves: string;
	declares: {
		input: 'audio_stream_request';
		output: 'recording_started';
	};
	succeeds_if: {
		reads: ['audio_stream_request'];
		steps: ['request_permission', 'initialize_recorder', 'start_timer'];
		observes: ['permission_granted', 'media_recorder_ready', 'recording_active'];
		returns: ['recording_started'];
	};
	fails_if: {
		observes: ['permission_denied', 'media_recorder_error'];
	};
}

/**
 * Contract for pauseRecording function.
 * Declares: Reads pause_request, returns paused_state
 */
interface PauseRecordingContract {
	serves: string;
	declares: {
		input: 'pause_request';
		output: 'paused_state';
	};
	succeeds_if: {
		reads: ['pause_request'];
		steps: ['pause_media_recorder', 'pause_timer'];
		observes: ['recording_paused'];
		returns: ['paused_state'];
	};
	fails_if: {
		observes: ['recording_not_active', 'pause_failed'];
	};
}

/**
 * Contract for resumeRecording function.
 * Declares: Reads resume_request, returns recording_resumed
 */
interface ResumeRecordingContract {
	serves: string;
	declares: {
		input: 'resume_request';
		output: 'recording_resumed';
	};
	succeeds_if: {
		reads: ['resume_request'];
		steps: ['resume_media_recorder', 'resume_timer'];
		observes: ['recording_active'];
		returns: ['recording_resumed'];
	};
	fails_if: {
		observes: ['recording_not_paused', 'resume_failed'];
	};
}

/**
 * Contract for stopRecording function.
 * Declares: Reads stop_request, returns audio_blob
 */
interface StopRecordingContract {
	serves: string;
	declares: {
		input: 'stop_request';
		output: 'audio_blob';
	};
	succeeds_if: {
		reads: ['stop_request'];
		steps: ['stop_timer', 'stop_media_recorder', 'collect_chunks', 'cleanup_stream'];
		observes: ['audio_collected', 'stream_cleanup_complete'];
		returns: ['audio_blob'];
	};
	fails_if: {
		observes: ['recording_not_started', 'media_recorder_error'];
	};
}

// Recording state tracking

export interface RecordingSession {
	isRecording: boolean;
	isPaused: boolean;
	elapsedMs: number;
	audioBlob: Blob | null;
}

let mediaRecorder: MediaRecorder | null = null;
let audioChunks: Blob[] = [];
let startTime: number = 0;
let elapsedMs: number = 0;
let timerInterval: number | null = null;
let pausedAt: number = 0; // Time when paused
let totalPausedMs: number = 0; // Accumulated pause duration
let isPaused = false;

const startRecordingContract: StartRecordingContract = {
	serves: 'initiate audio capture from microphone',
	declares: {
		input: 'audio_stream_request',
		output: 'recording_started'
	},
	succeeds_if: {
		reads: ['audio_stream_request'],
		steps: ['request_permission', 'initialize_recorder', 'start_timer'],
		observes: ['permission_granted', 'media_recorder_ready', 'recording_active'],
		returns: ['recording_started']
	},
	fails_if: {
		observes: ['permission_denied', 'media_recorder_error']
	}
};

/**
 * Start recording audio from microphone.
 * Success: browser has getUserMedia support and user grants permission
 * Failure: microphone not available or permission denied
 * @throws RecordingError if recording fails
 */
export async function startRecording(
	obs: ObservationSession = createObservationSession()
): Promise<void> {
	obs.read('audio_stream_request', {});
	obs.step('request_permission');

	try {
		// Request microphone access
		const stream = await navigator.mediaDevices.getUserMedia({ audio: true });
		obs.observe('permission_granted', 'user allowed microphone access');

		obs.step('initialize_recorder');
		mediaRecorder = new MediaRecorder(stream);
		audioChunks = [];
		startTime = Date.now();
		elapsedMs = 0;
		isPaused = false;
		pausedAt = 0;
		totalPausedMs = 0;

		// Setup data available handler
		mediaRecorder.ondataavailable = (event: BlobEvent) => {
			audioChunks.push(event.data);
		};

		obs.observe('media_recorder_ready', `recorder initialized, state=${mediaRecorder.state}`);

		mediaRecorder.start();

		obs.step('start_timer');
		timerInterval = window.setInterval(() => {
			if (mediaRecorder && mediaRecorder.state === 'recording') {
				elapsedMs = Date.now() - startTime - totalPausedMs;
			}
		}, 100);

		obs.observe('recording_active', 'timer started, recording active');
		return obs.return_('recording_started', undefined);
	} catch (error) {
		obs.observe('permission_denied', (error as Error).message);
		throw classifyError(error, { operation: 'start_recording', api: 'getUserMedia' });
	}
}

const pauseRecordingContract: PauseRecordingContract = {
	serves: 'pause recording without losing audio data',
	declares: {
		input: 'pause_request',
		output: 'paused_state'
	},
	succeeds_if: {
		reads: ['pause_request'],
		steps: ['pause_media_recorder', 'pause_timer'],
		observes: ['recording_paused'],
		returns: ['paused_state']
	},
	fails_if: {
		observes: ['recording_not_active', 'pause_failed']
	}
};

/**
 * Pause recording without stopping.
 * Audio data is preserved; resumeRecording() continues from this point.
 * @throws RecordingError if recording not active
 */
export function pauseRecording(
	obs: ObservationSession = createObservationSession()
): void {
	obs.read('pause_request', {});

	if (!mediaRecorder || mediaRecorder.state !== 'recording') {
		obs.observe('recording_not_active', 'mediaRecorder not in recording state');
		throw new RecordingError('Recording not active; cannot pause');
	}

	obs.step('pause_media_recorder');
	mediaRecorder.pause();
	obs.observe('media_recorder_paused', `recorder paused at state=${mediaRecorder.state}`);

	obs.step('pause_timer');
	pausedAt = Date.now();
	isPaused = true;

	obs.observe('recording_paused', 'pause_timer stopped');
	return obs.return_('paused_state', undefined);
}

const resumeRecordingContract: ResumeRecordingContract = {
	serves: 'resume recording after pause',
	declares: {
		input: 'resume_request',
		output: 'recording_resumed'
	},
	succeeds_if: {
		reads: ['resume_request'],
		steps: ['resume_media_recorder', 'resume_timer'],
		observes: ['recording_active'],
		returns: ['recording_resumed']
	},
	fails_if: {
		observes: ['recording_not_paused', 'resume_failed']
	}
};

/**
 * Resume recording after pause.
 * Continues capturing audio from pause point without losing data.
 * @throws RecordingError if recording not paused
 */
export function resumeRecording(
	obs: ObservationSession = createObservationSession()
): void {
	obs.read('resume_request', {});

	if (!mediaRecorder || mediaRecorder.state !== 'paused') {
		obs.observe('recording_not_paused', 'mediaRecorder not in paused state');
		throw new RecordingError('Recording not paused; cannot resume');
	}

	obs.step('resume_media_recorder');
	mediaRecorder.resume();
	obs.observe('media_recorder_resumed', `recorder resumed at state=${mediaRecorder.state}`);

	obs.step('resume_timer');
	if (pausedAt > 0) {
		totalPausedMs += Date.now() - pausedAt;
		pausedAt = 0;
	}
	isPaused = false;

	obs.observe('recording_active', 'recording resumed');
	return obs.return_('recording_resumed', undefined);
}

const stopRecordingContract: StopRecordingContract = {
	serves: 'stop recording and return audio blob',
	declares: {
		input: 'stop_request',
		output: 'audio_blob'
	},
	succeeds_if: {
		reads: ['stop_request'],
		steps: ['stop_timer', 'stop_media_recorder', 'collect_chunks', 'cleanup_stream'],
		observes: ['audio_collected', 'stream_cleanup_complete'],
		returns: ['audio_blob']
	},
	fails_if: {
		observes: ['recording_not_started', 'media_recorder_error']
	}
};

/**
 * Stop recording and return audio blob.
 * Success: stops stream, collects audio into blob, returns WAV-encoded Blob
 * Failure: mediaRecorder not initialized or error during processing
 * @returns Promise resolving to audio Blob
 * @throws RecordingError if recording not started
 */
export function stopRecording(
	obs: ObservationSession = createObservationSession()
): Promise<Blob> {
	return new Promise((resolve, reject) => {
		obs.read('stop_request', {});

		if (!mediaRecorder) {
			obs.observe('recording_not_started', 'mediaRecorder is null');
			reject(classifyError(new Error('Recording not started'), { operation: 'stop_recording' }));
			return;
		}

		obs.step('stop_timer');
		if (timerInterval !== null) {
			clearInterval(timerInterval);
			timerInterval = null;
		}
		obs.observe('timer_stopped', `timer cleared, elapsedMs=${elapsedMs}`);

		obs.step('stop_media_recorder');
		mediaRecorder.onstop = () => {
			obs.step('collect_chunks');
			try {
				// WAV is most compatible; fallback to webm if needed
				const mimeType = MediaRecorder.isTypeSupported('audio/wav')
					? 'audio/wav'
					: MediaRecorder.isTypeSupported('audio/webm')
						? 'audio/webm'
						: 'audio/mp4';

				const audioBlob = new Blob(audioChunks, { type: mimeType });
				audioChunks = [];
				obs.observe('audio_collected', `blob created, size=${audioBlob.size}, type=${mimeType}`);

				obs.step('cleanup_stream');
				// Stop all tracks on stream
				if (mediaRecorder) {
					mediaRecorder.stream.getTracks().forEach((track) => {
						track.stop();
					});
					mediaRecorder = null;
				}
				obs.observe('stream_cleanup_complete', 'all tracks stopped, mediaRecorder nulled');

				resolve(obs.return_('audio_blob', audioBlob));
			} catch (error) {
				obs.observe('media_recorder_error', (error as Error).message);
				reject(classifyError(error, { operation: 'stop_recording', api: 'MediaRecorder' }));
			}
		};

		try {
			mediaRecorder.stop();
		} catch (error) {
			obs.observe('media_recorder_error', (error as Error).message);
			reject(classifyError(error, { operation: 'stop_recording', api: 'MediaRecorder' }));
		}
	});
}

/**
 * Get elapsed time in milliseconds.
 * Returns accurate duration even across pause/resume cycles.
 * Success: returns numeric ms since startRecording() called
 * Failure: returns 0 if not recording
 */
export function getElapsedMs(): number {
	return elapsedMs;
}

/**
 * Check if recording is active.
 * Success: returns true if mediaRecorder.state === 'recording'
 * Failure: returns false if not initialized
 */
export function isRecording(): boolean {
	return mediaRecorder !== null && mediaRecorder.state === 'recording';
}

/**
 * Check if recording is paused.
 */
export function isPausedRecording(): boolean {
	return isPaused;
}

/**
 * Force cancel recording and cleanup all resources.
 * Called on navigation away or emergency cleanup.
 */
export function cancelRecording(
	obs: ObservationSession = createObservationSession()
): void {
	obs.step('cancel_recording');

	if (timerInterval !== null) {
		clearInterval(timerInterval);
		timerInterval = null;
	}

	if (mediaRecorder) {
		try {
			if (mediaRecorder.state !== 'inactive') {
				mediaRecorder.stop();
			}
			mediaRecorder.stream.getTracks().forEach((track) => {
				track.stop();
			});
		} catch (error) {
			obs.observe('cleanup_error', (error as Error).message);
		}
		mediaRecorder = null;
	}

	audioChunks = [];
	startTime = 0;
	elapsedMs = 0;
	pausedAt = 0;
	totalPausedMs = 0;
	isPaused = false;

	obs.observe('recording_cancelled', 'all resources released');
	return obs.return_('cancelled', undefined);
}

// MARK: SYSTEM(Audio) -> Web Audio Diorama Soundscape
// Purpose: Create immersive ambient audio environment: ocean waves, market murmur, water impact
// Success: AudioContext running with three synthesized layers, master gain at 0.5
// Failure: AudioContext blocked (iOS requires user gesture), low memory

import type { ObservationSession } from './obs';
import { createObservationSession } from './obs';

export interface AudioHandle {
	context: AudioContext;
	masterGain: GainNode;
	resume: () => Promise<void>;
	triggerImpact: () => void;
	setMarketMurmurVolume: (volume: number) => void;
	destroy: () => void;
}

function createNoiseBuffer(ctx: AudioContext, durationSeconds: number): AudioBuffer {
	const sampleRate = ctx.sampleRate;
	const buffer = ctx.createBuffer(1, sampleRate * durationSeconds, sampleRate);
	const data = buffer.getChannelData(0);
	for (let i = 0; i < data.length; i++) {
		data[i] = Math.random() * 2 - 1;
	}
	return buffer;
}

export function initAudio(obs: ObservationSession = createObservationSession()): AudioHandle {
	// MARK: FUNCTION(initAudio) -> audio context bootstrap
	// Purpose: Initialize Web Audio context and all three synthesized audio layers
	// Success: returns AudioHandle with running audio context and control methods
	// Failure: throws if AudioContext not available (very old browsers)
	obs.step('init_audio_context', {});

	const context = new AudioContext();
	const masterGain = context.createGain();
	masterGain.gain.value = 0.5;
	masterGain.connect(context.destination);
	obs.observe('audio_context_created', { sampleRate: context.sampleRate });

	// === LAYER 1: WAVES FOUNDATION ===
	obs.step('create_wave_layer', {});

	// Sub-bass oscillator (felt more than heard)
	const waveOsc = context.createOscillator();
	waveOsc.type = 'sine';
	waveOsc.frequency.value = 80; // Low rumble (80 Hz, audible bass)

	const waveGain = context.createGain();
	waveGain.gain.setValueAtTime(0, context.currentTime);
	waveGain.gain.linearRampToValueAtTime(0.3, context.currentTime + 2); // 2s fade in

	waveOsc.connect(waveGain);
	waveGain.connect(masterGain);
	waveOsc.start();

	// Noise layer (ocean texture)
	const noiseBuffer = createNoiseBuffer(context, 3);
	const noiseSource = context.createBufferSource();
	noiseSource.buffer = noiseBuffer;
	noiseSource.loop = true;

	const noiseFilter = context.createBiquadFilter();
	noiseFilter.type = 'lowpass';
	noiseFilter.frequency.value = 400;
	noiseFilter.Q.value = 2;

	const noiseGain = context.createGain();
	noiseGain.gain.value = 0.2;

	noiseSource.connect(noiseFilter);
	noiseFilter.connect(noiseGain);
	noiseGain.connect(masterGain);
	noiseSource.start();
	obs.observe('wave_layer_started', {});

	// === LAYER 2: MARKET MURMUR (start silent, activated by scroll) ===
	obs.step('create_murmur_layer', {});

	const murmurBuffer = createNoiseBuffer(context, 4);
	const murmurSource = context.createBufferSource();
	murmurSource.buffer = murmurBuffer;
	murmurSource.loop = true;

	const murmurFilter = context.createBiquadFilter();
	murmurFilter.type = 'highpass';
	murmurFilter.frequency.value = 800;
	murmurFilter.Q.value = 1;

	const murmurGain = context.createGain();
	murmurGain.gain.value = 0; // Start silent; raised by setMarketMurmurVolume()

	murmurSource.connect(murmurFilter);
	murmurFilter.connect(murmurGain);
	murmurGain.connect(masterGain);
	murmurSource.start();
	obs.observe('murmur_layer_started', { initialVolume: 0 });

	// === LAYER 3: IMPACT CRACK (triggered once on fragment 5) ===
	// (Implemented as triggerImpact function below — no ongoing source needed)

	function triggerImpact(): void {
		// MARK: FUNCTION(triggerImpact) -> water impact sound
		// Purpose: Fire single impact sound when fragment 5 enters view
		// Success: brief frequency sweep + noise burst plays at 0.8 volume
		// Failure: silent if context suspended
		if (context.state === 'suspended') return;

		const impactGain = context.createGain();
		impactGain.gain.value = 0.8;
		impactGain.connect(masterGain);

		const impactOsc = context.createOscillator();
		impactOsc.type = 'sine';
		impactOsc.frequency.setValueAtTime(4000, context.currentTime);
		impactOsc.frequency.exponentialRampToValueAtTime(1000, context.currentTime + 0.3);

		impactOsc.connect(impactGain);
		impactOsc.start(context.currentTime);
		impactOsc.stop(context.currentTime + 0.4);

		// Layer thin noise burst
		const burstBuffer = createNoiseBuffer(context, 0.2);
		const burstSource = context.createBufferSource();
		burstSource.buffer = burstBuffer;
		const burstGain = context.createGain();
		burstGain.gain.setValueAtTime(0.4, context.currentTime);
		burstGain.gain.linearRampToValueAtTime(0, context.currentTime + 0.2);
		burstSource.connect(burstGain);
		burstGain.connect(masterGain);
		burstSource.start(context.currentTime);
	}

	function setMarketMurmurVolume(volume: number): void {
		// Smoothly ramp to target volume (prevents clicking artifacts)
		murmurGain.gain.linearRampToValueAtTime(
			Math.max(0, Math.min(0.25, volume)), // Clamp 0-0.25
			context.currentTime + 0.5
		);
	}

	function destroy(): void {
		// Stop all sources gracefully
		masterGain.gain.linearRampToValueAtTime(0, context.currentTime + 0.5);
		setTimeout(() => {
			try {
				waveOsc.stop();
				noiseSource.stop();
				murmurSource.stop();
				context.close();
			} catch {
				// Sources may already be stopped
			}
		}, 600);
	}

	obs.observe('audio_initialized', {});
	return obs.return_('audio_handle', {
		context,
		masterGain,
		resume: () => context.resume(),
		triggerImpact,
		setMarketMurmurVolume,
		destroy,
	});
}

export function destroyAudio(handle: AudioHandle | null, obs: ObservationSession = createObservationSession()): void {
	// MARK: FUNCTION(destroyAudio) -> audio cleanup
	// Purpose: Stop audio context and free resources
	// Success: audio stops and context closes
	// Failure: context already closed or error during cleanup
	obs.step('destroy_audio', {});

	if (!handle) {
		obs.observe('no_audio_handle', {});
		obs.return_('cleanup_skipped', undefined);
		return;
	}

	try {
		handle.destroy();
		obs.observe('audio_destroyed', {});
		obs.return_('cleanup_complete', undefined);
	} catch (error) {
		obs.observe('audio_destroy_error', { error: String(error) });
		obs.return_('cleanup_failed', undefined);
	}
}

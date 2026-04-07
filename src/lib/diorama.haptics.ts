// MARK: SYSTEM(Haptics) -> Vibration API Sensory Feedback
// Purpose: Trigger device haptic vibration at emotional peak moments in the diorama
// Success: device vibrates on jump and water impact moments
// Failure: Vibration API unavailable (silent fail, no UI indication)

import type { ObservationSession } from './obs';
import { createObservationSession } from './obs';

export function triggerJumpHaptic(obs: ObservationSession = createObservationSession()): void {
	// MARK: FUNCTION(triggerJumpHaptic) -> jump moment haptic
	// Purpose: Fire 80ms sharp pulse when "He jumped." fragment animates in
	// Success: navigator.vibrate(80) called on supported devices
	// Failure: Vibration API not supported → silent skip
	obs.step('trigger_jump_haptic', {});

	const supported = 'vibrate' in navigator;
	if (!supported) {
		obs.observe('vibration_not_supported', {});
		obs.return_('haptic_skipped', undefined);
		return;
	}

	navigator.vibrate(80); // 80ms sharp impulse (simulates jump energy)
	obs.observe('jump_haptic_fired', { pattern: 80 });
	obs.return_('haptic_complete', undefined);
}

export function triggerWaterHaptic(obs: ObservationSession = createObservationSession()): void {
	// MARK: FUNCTION(triggerWaterHaptic) -> water impact haptic
	// Purpose: Fire rolling pulse pattern when "The water rose up" fragment appears
	// Success: navigator.vibrate([40,60,40,60,40]) called on supported devices
	// Failure: Vibration API not supported → silent skip
	obs.step('trigger_water_haptic', {});

	const supported = 'vibrate' in navigator;
	if (!supported) {
		obs.observe('vibration_not_supported', {});
		obs.return_('haptic_skipped', undefined);
		return;
	}

	navigator.vibrate([40, 60, 40, 60, 40]); // Rising pulse (simulates wave motion)
	obs.observe('water_haptic_fired', { pattern: [40, 60, 40, 60, 40] });
	obs.return_('haptic_complete', undefined);
}

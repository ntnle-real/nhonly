// MARK: obs — Observation API for temporal contract proofs
// Purpose: Provide injectable observation session for tracing execution against contracts
// Success: Functions receive obs parameter and call obs.read/step/observe/return_ at boundaries
// Failure: obs parameter missing or calls not matching contract declaration

/**
 * Observation session interface for contract binding.
 * Injected into functions to create temporal proof that execution matches intent.
 * Per kernel/THEORY.md: obs calls mark every boundary (read input, step through logic, observe conditions, return output).
 */
export interface ObservationSession {
	/**
	 * Mark input read.
	 * Called at function entry to record what input was provided.
	 * @param name - Input variable name (e.g., "audio_stream_request")
	 * @param value - Actual input value
	 */
	read(name: string, value: any): void;

	/**
	 * Mark execution step.
	 * Called before each major logic boundary to name the step being executed.
	 * @param name - Step name (e.g., "request_permission", "save_to_storage")
	 */
	step(name: string): void;

	/**
	 * Mark observation condition.
	 * Called when contract condition is observed (success or failure).
	 * @param type - Observation type (e.g., "permission_granted", "error_classification")
	 * @param detail - Optional detail message for debugging
	 */
	observe(type: string, detail?: string): void;

	/**
	 * Mark return value.
	 * Called before returning from function to record what was returned.
	 * @param name - Output variable name (e.g., "normalized_user")
	 * @param value - Return value
	 * @returns The value passed in (enables transparent return)
	 */
	return_<T>(name: string, value: T): T;
}

/**
 * Create a new observation session.
 * For now, implements pass-through (no-op) to allow gradual contract migration.
 * Future: wire to logging, tracing, or verification systems.
 * @returns ObservationSession ready for injection
 */
export function createObservationSession(): ObservationSession {
	return {
		read: (name, value) => {
			console.debug(`[obs.read] ${name}:`, value);
		},
		step: (name) => {
			console.debug(`[obs.step] ${name}`);
		},
		observe: (type, detail) => {
			console.debug(`[obs.observe] ${type}:`, detail ?? '');
		},
		return_: <T,>(name: string, value: T): T => {
			console.debug(`[obs.return_] ${name}:`, value);
			return value;
		}
	};
}

/**
 * Bind a contract to a function.
 * Decorator pattern for marking functions that follow contract shape.
 * @param contract - Contract interface (for documentation)
 * @returns Decorator function
 */
export function bindContract(contract: any) {
	return function <T extends (...args: any[]) => any>(fn: T): T {
		// For now, return function as-is
		// Future: add runtime contract verification
		return fn;
	};
}

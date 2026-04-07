// MARK: SYSTEM(Scene) -> Three.js Diorama Renderer
// Purpose: Initialize and manage Three.js particle scene for immersive diorama experience
// Success: fullscreen canvas with particle atmosphere renders at 60 FPS on target devices
// Failure: WebGL not supported, canvas element not mounted, memory leak on destroy

import * as THREE from 'three';
import type { ObservationSession } from './obs';
import { createObservationSession } from './obs';

// Contract interfaces

interface DetectParticleCountContract {
	serves: string;
	declares: {
		input: 'device_capability_check';
		output: 'particle_count';
	};
	succeeds_if: {
		reads: ['device_capability_check'];
		steps: ['detect_device_capability'];
		observes: ['device_classified'];
		returns: ['particle_count'];
	};
	fails_if: {
		observes: ['detection_failed'];
	};
}

interface InitSceneContract {
	serves: string;
	declares: {
		input: 'canvas_element';
		output: 'scene_initialized';
	};
	succeeds_if: {
		reads: ['canvas_element'];
		steps: [
			'create_renderer',
			'create_scene_camera',
			'create_particles',
			'create_particle_material',
			'start_animation_loop',
			'attach_resize_listener'
		];
		observes: [
			'renderer_created',
			'scene_camera_created',
			'particles_created',
			'particle_mesh_added',
			'animation_loop_started',
			'resize_listener_attached'
		];
		returns: ['scene_initialized'];
	};
	fails_if: {
		observes: ['webgl_not_supported', 'canvas_not_mounted'];
	};
}

export interface SceneHandle {
	renderer: THREE.WebGLRenderer;
	scene: THREE.Scene;
	camera: THREE.PerspectiveCamera;
	animationId: number;
	dispose: () => void;
}

const detectParticleCountContract: DetectParticleCountContract = {
	serves: 'determine particle count appropriate for device capability',
	declares: {
		input: 'device_capability_check',
		output: 'particle_count'
	},
	succeeds_if: {
		reads: ['device_capability_check'],
		steps: ['detect_device_capability'],
		observes: ['device_classified'],
		returns: ['particle_count']
	},
	fails_if: {
		observes: ['detection_failed']
	}
};

/**
 * Detect device capability and return appropriate particle count.
 * Performance-adaptive: low-end mobile 400, mobile 800-1200, desktop 2000-3000
 *
 * @param obs - Observation session (injected)
 * @returns particle_count - Number of particles appropriate for device
 */
export function detectParticleCount(obs = createObservationSession()): number {
	// MARK: FUNCTION(detectParticleCount) -> performance heuristic
	// Purpose: Choose particle count appropriate for device capability
	// Success: returns count within device-appropriate range
	// Failure: none (falls back to conservative 400)

	obs.read('device_capability_check', {});
	obs.step('detect_device_capability');

	const isMobile = window.innerWidth < 1000;
	const cores = navigator.hardwareConcurrency ?? 2;
	const isLowEnd = isMobile && cores <= 4;

	let count: number;
	if (isLowEnd) {
		count = 400;
		obs.observe('device_classified', `low_end_mobile, cores=${cores}`);
	} else if (isMobile) {
		count = 800 + Math.floor(Math.random() * 400); // 800-1200
		obs.observe('device_classified', `mobile, cores=${cores}, count=${count}`);
	} else {
		count = 2000 + Math.floor(Math.random() * 1000); // 2000-3000
		obs.observe('device_classified', `desktop, cores=${cores}, count=${count}`);
	}

	return obs.return_('particle_count', count);
}

const initSceneContract: InitSceneContract = {
	serves: 'create and initialize Three.js scene with particle system on provided canvas',
	declares: {
		input: 'canvas_element',
		output: 'scene_initialized'
	},
	succeeds_if: {
		reads: ['canvas_element'],
		steps: [
			'create_renderer',
			'create_scene_camera',
			'create_particles',
			'create_particle_material',
			'start_animation_loop',
			'attach_resize_listener'
		],
		observes: [
			'renderer_created',
			'scene_camera_created',
			'particles_created',
			'particle_mesh_added',
			'animation_loop_started',
			'resize_listener_attached'
		],
		returns: ['scene_initialized']
	},
	fails_if: {
		observes: ['webgl_not_supported', 'canvas_not_mounted']
	}
};

/**
 * Initialize Three.js scene with particle atmosphere on canvas.
 * Creates renderer, scene, camera, particle system, animation loop, and resize handler.
 *
 * @param canvas - DOM canvas element to render into
 * @param obs - Observation session (injected)
 * @returns SceneHandle - Object with renderer, scene, camera, and dispose() cleanup function
 * @throws {Error} If WebGL context unavailable or canvas not mounted
 */
export function initScene(
	canvas: HTMLCanvasElement,
	obs = createObservationSession()
): SceneHandle {
	// MARK: FUNCTION(initScene) -> Three.js scene bootstrap
	// Purpose: Create renderer, camera, particle system and start animation loop on provided canvas
	// Success: returns SceneHandle with running animation loop and dispose callback
	// Failure: throws if WebGL context unavailable

	obs.read('canvas_element', { canvas: canvas.tagName });

	// Step 1: Create renderer
	obs.step('create_renderer');
	let renderer: THREE.WebGLRenderer;
	try {
		renderer = new THREE.WebGLRenderer({
			canvas,
			antialias: true,
			alpha: true,
			powerPreference: 'high-performance',
			logarithmicDepthBuffer: false
		});
	} catch (error) {
		obs.observe('webgl_not_supported', (error as Error).message);
		throw error;
	}

	renderer.setPixelRatio(Math.min(window.devicePixelRatio, 2));
	renderer.setSize(window.innerWidth, window.innerHeight);
	renderer.setClearColor(0x000000, 0); // Transparent — CSS gradient shows through
	obs.observe('renderer_created', {
		width: window.innerWidth,
		height: window.innerHeight,
		pixelRatio: renderer.getPixelRatio()
	});

	// Step 2: Create scene and camera
	obs.step('create_scene_camera');
	const scene = new THREE.Scene();
	scene.fog = new THREE.Fog(0x000000, 50, 500);

	const camera = new THREE.PerspectiveCamera(
		60,
		window.innerWidth / window.innerHeight,
		0.1,
		1000
	);
	camera.position.z = 50;
	obs.observe('scene_camera_created', { fov: 60, z: 50 });

	// Step 3: Create particle geometry
	obs.step('create_particles');
	const particleCount = detectParticleCount(obs);
	const positions = new Float32Array(particleCount * 3);
	const sizes = new Float32Array(particleCount);
	const colors = new Float32Array(particleCount * 3);

	// Color palette: white, warm amber, light teal
	const palette = [
		new THREE.Color('#ffffff'),
		new THREE.Color('#f5e6d3'),
		new THREE.Color('#a0d8e8')
	];

	for (let i = 0; i < particleCount; i++) {
		// Random positions in a box around the camera
		positions[i * 3] = (Math.random() - 0.5) * 200; // X: spread wide
		positions[i * 3 + 1] = (Math.random() - 0.5) * 150; // Y: spread tall
		positions[i * 3 + 2] = (Math.random() - 0.5) * 100; // Z: depth

		sizes[i] = 2 + Math.random() * 6; // 2-8 pixels

		const color = palette[Math.floor(Math.random() * palette.length)];
		colors[i * 3] = color.r;
		colors[i * 3 + 1] = color.g;
		colors[i * 3 + 2] = color.b;
	}

	const geometry = new THREE.BufferGeometry();
	geometry.setAttribute('position', new THREE.BufferAttribute(positions, 3));
	geometry.setAttribute('size', new THREE.BufferAttribute(sizes, 1));
	geometry.setAttribute('color', new THREE.BufferAttribute(colors, 3));
	obs.observe('particles_created', { particleCount });

	// Step 4: Create particle material and mesh
	obs.step('create_particle_material');
	const material = new THREE.PointsMaterial({
		size: 3,
		vertexColors: true,
		transparent: true,
		opacity: 0.5,
		sizeAttenuation: true,
		blending: THREE.AdditiveBlending,
		depthWrite: false
	});
	const particles = new THREE.Points(geometry, material);
	scene.add(particles);
	obs.observe('particle_mesh_added', { materialProperties: 'additive, transparent' });

	// Step 5: Start animation loop
	obs.step('start_animation_loop');
	let animationId: number;
	const clock = new THREE.Clock();

	function animate() {
		animationId = requestAnimationFrame(animate);
		const elapsed = clock.getElapsedTime();

		// Slow sinusoidal drift of particle system as a whole
		particles.rotation.y = elapsed * 0.01;
		particles.rotation.x = Math.sin(elapsed * 0.005) * 0.05;

		// Individual particle drift via position updates
		const posArray = geometry.attributes.position.array as Float32Array;
		for (let i = 0; i < particleCount; i++) {
			const idx = i * 3;
			posArray[idx] += Math.sin(elapsed * 0.0005 + posArray[idx + 1] * 0.1) * 0.01;
			posArray[idx + 1] += Math.cos(elapsed * 0.0003 + posArray[idx] * 0.1) * 0.008;

			// Recycle out-of-bounds particles
			if (posArray[idx] > 100) posArray[idx] = -100;
			if (posArray[idx] < -100) posArray[idx] = 100;
			if (posArray[idx + 1] > 75) posArray[idx + 1] = -75;
			if (posArray[idx + 1] < -75) posArray[idx + 1] = 75;
		}
		geometry.attributes.position.needsUpdate = true;

		renderer.render(scene, camera);
	}
	animate();
	obs.observe('animation_loop_started', { frameId: animationId });

	// Step 6: Attach resize handler
	obs.step('attach_resize_listener');
	function handleResize() {
		camera.aspect = window.innerWidth / window.innerHeight;
		camera.updateProjectionMatrix();
		renderer.setSize(window.innerWidth, window.innerHeight);
	}
	window.addEventListener('resize', handleResize);
	obs.observe('resize_listener_attached', {});

	// Dispose function: clean up all resources
	function dispose() {
		cancelAnimationFrame(animationId);
		window.removeEventListener('resize', handleResize);
		geometry.dispose();
		material.dispose();
		renderer.dispose();
	}

	// Return scene handle
	return obs.return_('scene_initialized', {
		renderer,
		scene,
		camera,
		animationId,
		dispose
	});
}

// Bind contracts (no-op for now, but preserves C3 contract shape)
// const detectParticleCountBound = bindContract(detectParticleCountContract)(detectParticleCount);
// const initSceneBound = bindContract(initSceneContract)(initScene);

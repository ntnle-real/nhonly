<!-- MARK: SCENE(Diorama) -> Living Memory Render -->
<!-- Purpose: Render a pure, seamless atmospheric background for the boy-on-beach memory. -->
<!-- Success: Seamless color transition without horizontal seams or boundaries. -->
<!-- Failure: Shader compilation error. -->

<script lang="ts">
	/**
	 * @component DioramaCanvas
	 * @serves "Seamless atmospheric field"
	 * @declares "u_warmth"
	 */

	import { onMount } from 'svelte';
	import * as THREE from 'three';

	interface Props {
		warmth: number;
	}

	let { warmth }: Props = $props();

	let canvasEl: HTMLCanvasElement;
	let renderer: THREE.WebGLRenderer;
	let scene: THREE.Scene;
	let camera: THREE.OrthographicCamera;
	let material: THREE.ShaderMaterial;
	let mesh: THREE.Mesh;
	let frameId: number;

	const fragmentShader = `
		uniform float u_warmth;
		varying vec2 vUv;

		void main() {
			// Single atmospheric base to prevent banding or "boundary" seams
			vec3 baseTeal = vec3(0.02, 0.06, 0.06);
			vec3 goldGlow = vec3(0.32, 0.18, 0.06);

			// Pure field transition based on warmth
			vec3 color = mix(baseTeal, goldGlow, u_warmth);

			gl_FragColor = vec4(color, 1.0);
		}
	`;

	const vertexShader = `
		varying vec2 vUv;
		void main() {
			vUv = uv;
			gl_Position = projectionMatrix * modelViewMatrix * vec4(position, 1.0);
		}
	`;

	onMount(() => {
		scene = new THREE.Scene();
		camera = new THREE.OrthographicCamera(-1, 1, 1, -1, 0.1, 10);
		camera.position.z = 1;

		// Set alpha to false to ensure the canvas is fully opaque and doesn't bleed parent backgrounds
		renderer = new THREE.WebGLRenderer({ canvas: canvasEl, antialias: true, alpha: false });
		renderer.setPixelRatio(window.devicePixelRatio);
		renderer.setSize(window.innerWidth, window.innerHeight);

		const geometry = new THREE.PlaneGeometry(2, 2);
		material = new THREE.ShaderMaterial({
			uniforms: {
				u_warmth: { value: 0 }
			},
			vertexShader,
			fragmentShader
		});

		mesh = new THREE.Mesh(geometry, material);
		scene.add(mesh);

		const animate = () => {
			material.uniforms.u_warmth.value = warmth;
			renderer.render(scene, camera);
			frameId = requestAnimationFrame(animate);
		};

		const handleResize = () => {
			renderer.setSize(window.innerWidth, window.innerHeight);
		};

		window.addEventListener('resize', handleResize);
		frameId = requestAnimationFrame(animate);

		return () => {
			window.removeEventListener('resize', handleResize);
			cancelAnimationFrame(frameId);
			renderer.dispose();
			geometry.dispose();
			material.dispose();
		};
	});

	$effect(() => {
		if (material) {
			material.uniforms.u_warmth.value = warmth;
		}
	});
</script>

<canvas bind:this={canvasEl} class="diorama-canvas"></canvas>

<style>
	.diorama-canvas {
		position: absolute;
		inset: 0;
		width: 100%;
		height: 100%;
		display: block;
		z-index: 1;
	}
</style>

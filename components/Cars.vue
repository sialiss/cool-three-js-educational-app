<template>
	<div ref="threeCanvas" class="three-canvas"></div>
</template>

<script>
import * as THREE from "three";
import { GLTFLoader } from "three/examples/jsm/loaders/GLTFLoader";

export default {
	mounted() {
		const scene = new THREE.Scene();

		const camera = new THREE.PerspectiveCamera(
			75,
			this.$refs.threeCanvas.offsetWidth / this.$refs.threeCanvas.offsetHeight,
			0.1,
			1000
		);
		camera.position.z = 5;

		const renderer = new THREE.WebGLRenderer();
		renderer.setSize(this.$refs.threeCanvas.offsetWidth, this.$refs.threeCanvas.offsetHeight);
		this.$refs.threeCanvas.appendChild(renderer.domElement);

		// Добавим свет для модели
		const light = new THREE.AmbientLight(0xffffff, 1); // Мягкое освещение
		scene.add(light);

		// Загрузка модели GLTF/GLB
		const loader = new GLTFLoader();
		loader.load(
			"models/Car3.glb?url",
			(gltf) => {
				const car = gltf.scene;
				car.scale.set(0.5, 0.5, 0.5);
				scene.add(car);

				// Анимация модели
				const animate = () => {
					requestAnimationFrame(animate);
					car.rotation.y += 0.01; // Поворот модели
					renderer.render(scene, camera);
				};
				animate();
			},
			(undefined) => {
				console.log("Загрузка модели...");
			},
			(error) => {
				console.error("Ошибка загрузки модели: ", error);
			}
		);
	},
};
</script>

<style>
	.three-canvas {
		width: 100%;
		height: 100%;
		overflow: hidden;
	}
</style>
<template>
	<div ref="threeCanvas" class="three-canvas"></div>
</template>

<script>
	import * as THREE from "three"

	export default {
		mounted() {
			const scene = new THREE.Scene()

			const camera = new THREE.PerspectiveCamera(
				75,
				this.$refs.threeCanvas.offsetWidth / this.$refs.threeCanvas.offsetHeight,
				0.1,
				1000
			)
			camera.position.z = 5

			const renderer = new THREE.WebGLRenderer()
			renderer.setSize(this.$refs.threeCanvas.offsetWidth, this.$refs.threeCanvas.offsetHeight)
			this.$refs.threeCanvas.appendChild(renderer.domElement)

			const geometry = new THREE.BoxGeometry()
			const material = new THREE.MeshBasicMaterial({ color: 0x00ff00 })
			const cube = new THREE.Mesh(geometry, material)
			scene.add(cube)

			const animate = () => {
				requestAnimationFrame(animate)
				cube.rotation.x += 0.01
				cube.rotation.y += 0.01
				renderer.render(scene, camera)
			}

			animate()
		},
	}
</script>

<style>
	.three-canvas {
		width: 100%;
		height: 100%;
		overflow: hidden;
	}
</style>

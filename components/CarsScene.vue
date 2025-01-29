<template>
	<div ref="threeCanvas" class="three-canvas"></div>
</template>

<script setup lang="ts">
	import { onMounted, ref } from "vue"
	import * as THREE from "three"
	import { GLTFLoader } from "three/examples/jsm/loaders/GLTFLoader.js"
	import { OrbitControls } from "three/examples/jsm/controls/OrbitControls.js"

	let scene: THREE.Scene
	let camera: THREE.PerspectiveCamera
	let renderer: THREE.WebGLRenderer
	let car: THREE.Object3D
	let wheels: Record<string, THREE.Object3D> = {}
	let controls: OrbitControls
	const threeCanvas = ref<HTMLDivElement | null>(null)
	const keys = { w: false, ц: false, a: false, ф: false, s: false, ы: false, d: false, в: false }

	const init = () => {
		scene = new THREE.Scene()
		camera = new THREE.PerspectiveCamera(75, window.innerWidth / window.innerHeight, 0.1, 1000)
		renderer = new THREE.WebGLRenderer({ antialias: true })
		renderer.setSize(window.innerWidth, window.innerHeight)
		controls = new OrbitControls(camera, renderer.domElement)
		controls.enableDamping = true
		controls.dampingFactor = 0.05
		controls.minDistance = 2
		controls.maxDistance = 15
		if (threeCanvas.value) threeCanvas.value.appendChild(renderer.domElement)

		const light = new THREE.AmbientLight(0xffffff, 0.5)
		scene.add(light)
		const directionalLight = new THREE.DirectionalLight(0xffffff, 1)
		directionalLight.position.set(5, 5, 5)
		scene.add(directionalLight)

		const plane = new THREE.Mesh(
			new THREE.PlaneGeometry(20, 20),
			new THREE.MeshBasicMaterial({ color: 0x808080, side: THREE.DoubleSide })
		)
		plane.rotation.x = -Math.PI / 2
		scene.add(plane)

		const loader = new GLTFLoader()
		loader.load("models/Car3.glb?url", gltf => {
			car = gltf.scene
			car.scale.set(0.5, 0.5, 0.5)
			car.position.set(0, 0.5, 0)
			scene.add(car)

			wheels.Wheel1 = car.getObjectByName("Wheel1")!
			wheels.Wheel2 = car.getObjectByName("Wheel2")!
			wheels.Wheel3 = car.getObjectByName("Wheel3")!
			wheels.Wheel4 = car.getObjectByName("Wheel4")!

			animate()
		})

		camera.position.set(0, 5, 10)
	}

	const animate = () => {
		requestAnimationFrame(animate)
		const speed = 0.1
		const rotationSpeed = 0.03

		if (keys.w || keys.ц) car.position.z += speed
		if (keys.s || keys.ы) car.position.z -= speed
		if (keys.a || keys.ф) car.rotation.y += rotationSpeed
		if (keys.d || keys.в) car.rotation.y -= rotationSpeed

		// Object.values(wheels).forEach(wheel => {
		// 	wheel.rotation.x -= 0.1 * (keys.w ? 1 : keys.s ? -1 : 0)
		// })
		Object.values(wheels).forEach(wheel => {
			wheel.rotateX(-0.1 * (keys.w ? 1 : keys.s ? -1 : 0))
		})

		controls.target.set(car.position.x, car.position.y, car.position.z)
		controls.update()
		renderer.render(scene, camera)
	}

	const handleKeyDown = (event: KeyboardEvent) => {
		if (event.key in keys) {
			keys[event.key as keyof typeof keys] = true
		}
	}

	const handleKeyUp = (event: KeyboardEvent) => {
		if (event.key in keys) {
			keys[event.key as keyof typeof keys] = false
		}
	}

	const onWindowResize = () => {
		if (renderer && camera) {
			const width = window.innerWidth
			const height = window.innerHeight
			renderer.setSize(width, height)
			camera.aspect = width / height
			camera.updateProjectionMatrix()
		}
	}

	const focusWindow = () => {
		window.focus()
		document.body.focus()
	}

	onMounted(() => {
		init()
		window.addEventListener("keydown", handleKeyDown)
		window.addEventListener("keyup", handleKeyUp)
		window.addEventListener("resize", onWindowResize)
		threeCanvas.value?.addEventListener("click", focusWindow)
	})
</script>

<style>
	.three-canvas {
		width: 100%;
		height: 100%;
		overflow: hidden;
	}
</style>

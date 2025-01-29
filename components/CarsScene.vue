<template>
	<div ref="threeCanvas" class="three-canvas"></div>
</template>

<script setup lang="ts">
	import { onMounted, ref } from "vue"
	import * as THREE from "three"
	import { GLTFLoader } from "three/examples/jsm/loaders/GLTFLoader.js"
	import * as CANNON from "cannon-es"

	// Переменные сцены
	let scene: THREE.Scene
	let camera: THREE.PerspectiveCamera
	let renderer: THREE.WebGLRenderer
	let world: CANNON.World
	let car: THREE.Object3D
	let carBody: CANNON.Body
	const threeCanvas = ref<HTMLDivElement | null>(null)
	const keys = { w: false, a: false, s: false, d: false }

	const init = () => {
		// === Инициализация THREE.js ===
		scene = new THREE.Scene()
		camera = new THREE.PerspectiveCamera(75, window.innerWidth / window.innerHeight, 0.1, 1000)
		renderer = new THREE.WebGLRenderer({ antialias: true })
		renderer.setSize(window.innerWidth, window.innerHeight)
		if (threeCanvas.value) {
			threeCanvas.value.appendChild(renderer.domElement)
		}

		// Свет
		const light = new THREE.DirectionalLight(0xffffff, 1)
		light.position.set(5, 5, 5)
		scene.add(light)

		// === Инициализация Cannon.js ===
		world = new CANNON.World()
		world.gravity.set(0, -9.82, 0)

		// Плоскость (дорога)
		const groundMaterial = new CANNON.Material("groundMaterial")
		const groundBody = new CANNON.Body({
			mass: 0, // Нерушимая
			shape: new CANNON.Plane(),
			material: groundMaterial,
		})
		groundBody.quaternion.setFromEuler(-Math.PI / 2, 0, 0)
		world.addBody(groundBody)

		const planeGeometry = new THREE.PlaneGeometry(20, 20)
		const planeMaterial = new THREE.MeshStandardMaterial({ color: 0x808080, side: THREE.DoubleSide })
		const plane = new THREE.Mesh(planeGeometry, planeMaterial)
		plane.rotation.x = -Math.PI / 2
		scene.add(plane)

		// === Загрузка 3D-модели машины ===
		const loader = new GLTFLoader()
		loader.load(
			"models/Car3.glb?url",
			(gltf: { scene: THREE.Object3D<THREE.Object3DEventMap> }) => {
				car = gltf.scene
				car.scale.set(0.5, 0.5, 0.5)
				scene.add(car)

				// === Создание физического тела для машины ===
				const shape = new CANNON.Box(new CANNON.Vec3(0.5, 0.25, 1)) // Размер машины
				carBody = new CANNON.Body({
					mass: 1, // Должна двигаться
					shape: shape,
				})
				carBody.position.set(0, 0.25, 0)
				world.addBody(carBody)

				animate()
			},
			undefined,
			(error: any) => console.error("Ошибка загрузки модели: ", error)
		)

		camera.position.set(0, 2, 5)
		camera.lookAt(0, 0, 0)
	}

	// Обработка нажатий клавиш
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

	// Анимация
	const animate = () => {
		requestAnimationFrame(animate)

		world.step(1 / 60) // Физика

		let speed = 2
		let rotationSpeed = 2

		if (keys.w) {
			carBody.velocity.z -= speed * Math.cos(carBody.quaternion.y)
			carBody.velocity.x -= speed * Math.sin(carBody.quaternion.y)
		}
		if (keys.s) {
			carBody.velocity.z += speed * Math.cos(carBody.quaternion.y)
			carBody.velocity.x += speed * Math.sin(carBody.quaternion.y)
		}
		if (keys.a) carBody.angularVelocity.y += rotationSpeed
		if (keys.d) carBody.angularVelocity.y -= rotationSpeed

		// Обновление позиции Three.js по Cannon.js
		if (car) {
			car.position.copy(carBody.position as unknown as THREE.Vector3)
			car.quaternion.copy(carBody.quaternion as unknown as THREE.Quaternion)
		}

		camera.position.set(carBody.position.x, carBody.position.y + 2, carBody.position.z + 5)
		camera.lookAt(new THREE.Vector3(carBody.position.x, carBody.position.y, carBody.position.z))

		renderer.render(scene, camera)
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

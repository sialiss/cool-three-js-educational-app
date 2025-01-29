<template>
	<div ref="threeCanvas" class="three-canvas"></div>
</template>

<script setup lang="ts">
	import { onMounted, ref } from "vue"
	import * as THREE from "three"
	import { GLTFLoader } from "three/examples/jsm/loaders/GLTFLoader.js"
	import * as CANNON from "cannon-es"

	let scene: THREE.Scene
	let camera: THREE.PerspectiveCamera
	let renderer: THREE.WebGLRenderer
	let world: CANNON.World
	let car: THREE.Object3D
	let carBody: CANNON.Body
	let vehicle: CANNON.RaycastVehicle
	let wheelMeshes: THREE.Object3D[] = []
	const threeCanvas = ref<HTMLDivElement | null>(null)
	const keys = { w: false, a: false, s: false, d: false }

	const init = () => {
		// === Инициализация THREE.js ===
		scene = new THREE.Scene()
		camera = new THREE.PerspectiveCamera(75, window.innerWidth / window.innerHeight, 0.1, 1000)
		renderer = new THREE.WebGLRenderer({ antialias: true })
		renderer.setSize(window.innerWidth, window.innerHeight)
		if (threeCanvas.value) threeCanvas.value.appendChild(renderer.domElement)

		const light = new THREE.DirectionalLight(0xffffff, 1)
		light.position.set(5, 5, 5)
		scene.add(light)

		// === Инициализация Cannon.js ===
		world = new CANNON.World()
		world.gravity.set(0, -9.82, 0)

		const groundMaterial = new CANNON.Material("groundMaterial")
		const groundBody = new CANNON.Body({
			mass: 0,
			shape: new CANNON.Plane(),
			material: groundMaterial,
		})
		groundBody.quaternion.setFromEuler(-Math.PI / 2, 0, 0)
		world.addBody(groundBody)

		const plane = new THREE.Mesh(
			new THREE.PlaneGeometry(20, 20),
			new THREE.MeshStandardMaterial({ color: 0x808080, side: THREE.DoubleSide })
		)
		plane.rotation.x = -Math.PI / 2
		scene.add(plane)

		// === Загрузка 3D-модели машины ===
		const loader = new GLTFLoader()
		loader.load("models/Car3.glb?url", gltf => {
			car = gltf.scene
			car.scale.set(0.5, 0.5, 0.5)
			scene.add(car)

			const shape = new CANNON.Box(new CANNON.Vec3(0.5, 0.25, 1))
			carBody = new CANNON.Body({ mass: 1, shape })
			carBody.position.set(0, 0.5, 0)
			world.addBody(carBody)

			initWheels()
			animate()
		})

		camera.position.set(0, 2, 5)
		camera.lookAt(new THREE.Vector3(0, 0, 0))
	}

	const initWheels = () => {
		vehicle = new CANNON.RaycastVehicle({ chassisBody: carBody })

		const wheelPositions = [
			[0.6, -0.2, 0.8],
			[-0.6, -0.2, 0.8],
			[0.6, -0.2, -0.8],
			[-0.6, -0.2, -0.8],
		]

		wheelPositions.forEach(pos => {
			vehicle.addWheel({
				chassisConnectionPointLocal: new CANNON.Vec3(...pos),
				suspensionStiffness: 20,
				suspensionRestLength: 0.3,
				maxSuspensionForce: 100000,
				radius: 0.2,
				directionLocal: new CANNON.Vec3(0, -1, 0),
				axleLocal: new CANNON.Vec3(1, 0, 0),
			})
		})

		vehicle.addToWorld(world)
	}

	const handleKeyDown = (event: KeyboardEvent) => {
		if (keys[event.key as keyof typeof keys] !== undefined) keys[event.key as keyof typeof keys] = true
        console.log('down')
	}

	const handleKeyUp = (event: KeyboardEvent) => {
		if (keys[event.key as keyof typeof keys] !== undefined) keys[event.key as keyof typeof keys] = false
	}

	const animate = () => {
		requestAnimationFrame(animate)
		world.step(1 / 60)

		if (keys.w) vehicle.applyEngineForce(5, 2), vehicle.applyEngineForce(5, 3)
		if (keys.s) vehicle.applyEngineForce(-5, 2), vehicle.applyEngineForce(-5, 3)
		if (keys.a) vehicle.setSteeringValue(0.5, 0), vehicle.setSteeringValue(0.5, 1)
		if (keys.d) vehicle.setSteeringValue(-0.5, 0), vehicle.setSteeringValue(-0.5, 1)

		vehicle.wheelInfos.forEach((wheelInfo, index) => {
			if (!wheelMeshes[index]) return

			vehicle.updateWheelTransform(index) // 🔥 ОБЯЗАТЕЛЬНО перед обновлением позиции!

			const wheelTransform = wheelInfo.worldTransform
			wheelMeshes[index].position.copy(wheelTransform.position as unknown as THREE.Vector3)
			wheelMeshes[index].quaternion.copy(wheelTransform.quaternion as unknown as THREE.Quaternion)
			wheelMeshes[index].quaternion.multiply(
				new THREE.Quaternion().setFromAxisAngle(new THREE.Vector3(0, 0, 1), Math.PI / 2)
			)
		})

		camera.position.set(carBody.position.x, carBody.position.y + 2, carBody.position.z + 5)
		camera.lookAt(new THREE.Vector3(carBody.position.x, carBody.position.y, carBody.position.z))

		car.position.copy(carBody.position as unknown as THREE.Vector3)
		car.quaternion.copy(carBody.quaternion as unknown as THREE.Quaternion)

		renderer.render(scene, camera)
	}

	onMounted(() => {
		init()
		window.addEventListener("keydown", handleKeyDown)
		window.addEventListener("keyup", handleKeyUp)
	})
</script>

<style>
	.three-canvas {
		width: 100%;
		height: 100%;
		overflow: hidden;
	}
</style>

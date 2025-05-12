<template>
	<div ref="threeCanvas" class="three-canvas"></div>
</template>

<script setup lang="ts">
	import { onMounted, ref } from "vue"
	import * as THREE from "three"
	import { GLTFLoader } from "three/examples/jsm/loaders/GLTFLoader.js"
	import { OrbitControls } from "three/examples/jsm/controls/OrbitControls.js"

	import { useRoute } from "vue-router"
	import type { Level } from "../utils/types"

	const route = useRoute()
	const levelData = ref<Level | null>(null)

	const loadLevel = async () => {
		const id = Number(route.params.id)
		const res = await fetch(`http://localhost:8000/practice-lessons/${id}`, {
			headers: { "Content-Type": "application/json" },
		})
		const data = await res.json()
		levelData.value = data.lesson
		console.log(levelData.value)
	}

	const textureLoader = new THREE.TextureLoader()
	const textureUrls = {
		grass: import("../assets/images/grass.png"),
		road: import("../assets/images/road.png"),
		road_with_line: import("../assets/images/road_with_line.png"),
		road_with_wide_line: import("../assets/images/road_with_wide_line.png"),
		road_with_long_dashes: import("../assets/images/road_with_long_dashes.png"),
		road_with_wide_dashes: import("../assets/images/road_with_wide_dashes.png"),
		road_with_dashes: import("../assets/images/road_with_dashes.png"),
		road_for_crossroad: import("../assets/images/road_for_crossroad.png"),
	}
	const texturePromises = Object.fromEntries(
		Object.entries(textureUrls).map(([key, path]) => [key, path.then(module => textureLoader.load(module.default))])
	)

	let scene: THREE.Scene
	let camera: THREE.PerspectiveCamera
	let renderer: THREE.WebGLRenderer
	let car: THREE.Object3D
	let wheels: Record<string, THREE.Object3D> = {}
	let steeringWheel: THREE.Object3D
	let controls: OrbitControls
	const threeCanvas = ref<HTMLDivElement | null>(null)
	const keys = { w: false, ц: false, a: false, ф: false, s: false, ы: false, d: false, в: false }
	let isFirstPerson = false

	const init = () => {
		scene = new THREE.Scene()

		// Проверяем, что threeCanvas уже доступен
		if (!threeCanvas.value) return

		camera = new THREE.PerspectiveCamera(75, threeCanvas.value.offsetWidth / threeCanvas.value.offsetHeight, 0.1, 1000)

		renderer = new THREE.WebGLRenderer({ antialias: true })
		renderer.setSize(threeCanvas.value.offsetWidth, threeCanvas.value.offsetHeight)
		threeCanvas.value.appendChild(renderer.domElement)

		controls = new OrbitControls(camera, renderer.domElement)
		controls.enableDamping = true
		controls.dampingFactor = 0.05
		controls.minDistance = 2
		controls.maxDistance = 15

		const light = new THREE.AmbientLight(0xffffff, 0.5)
		scene.add(light)
		const directionalLight = new THREE.DirectionalLight(0xffffff, 1)
		directionalLight.position.set(5, 5, 5)
		scene.add(directionalLight)

		const textureLoader = new THREE.TextureLoader()
		textureLoader.load("../images/Skyboxes/BlueSkySkybox.png", texture => {
			const geometry = new THREE.SphereGeometry(500, 60, 40)
			const material = new THREE.MeshBasicMaterial({
				map: texture,
				side: THREE.BackSide, // отрисовываем внутреннюю часть сферы
			})
			const skyDome = new THREE.Mesh(geometry, material)
			scene.add(skyDome)
		})

		const loader = new GLTFLoader()
		loader.load("../models/Car3_2.glb?url", gltf => {
			car = gltf.scene
			car.scale.set(0.5, 0.5, 0.5)
			const width = levelData.value?.size.x || 0
			const length = levelData.value?.size.y || 0
			car.position.set(width / 2, 0.1, length / 2)
			scene.add(car)

			wheels.Wheel1 = car.getObjectByName("Wheel1")!
			wheels.Wheel2 = car.getObjectByName("Wheel2")!
			wheels.Wheel3 = car.getObjectByName("Wheel3")!
			wheels.Wheel4 = car.getObjectByName("Wheel4")!
			steeringWheel = car.getObjectByName("Steer")!

			animate()
		})

		camera.position.set(0, 5, 10)
	}

	const drawField = async (
		size: { x: number; y: number },
		field: Tile[][],
		scene: THREE.Scene,
		withWalls = true,
		withBuildings = true
	) => {
		const tileSize = 4

		// Загрузка текстур
		const textures = await Promise.all(Object.values(texturePromises))
		const textureMap = Object.keys(textureUrls).reduce((map, key, i) => {
			map[key] = textures[i]
			return map
		}, {} as Record<string, THREE.Texture>)

		// Построение поля
		for (let y = 0; y < size.y; y++) {
			if (!field[y]) field[y] = []
			for (let x = 0; x < size.x; x++) {
				let tile = field[y][x]
				if (!tile) tile = { type: "grass", angle: 0 }
				const texture = textureMap[tile.type]
				if (!texture) continue

				const material = new THREE.MeshBasicMaterial({ map: texture })
				const geometry = new THREE.PlaneGeometry(tileSize, tileSize)
				const mesh = new THREE.Mesh(geometry, material)
				mesh.rotation.x = -Math.PI / 2
				mesh.position.set(y * tileSize, 0.01, x * tileSize)

				if (tile.angle) {
					mesh.rotation.z = -THREE.MathUtils.degToRad(tile.angle)
				}

				scene.add(mesh)
			}
		}

		// Добавляем невидимые стены по границе
		if (withWalls) {
			const wallHeight = 2
			const wallThickness = 0.1
			const wallMaterial = new THREE.MeshBasicMaterial({ visible: true })

			for (let y = 0; y < size.y; y++) {
				;[
					[-1, y],
					[size.x, y],
				].forEach(([x, y]) => {
					const geometry = new THREE.BoxGeometry(wallThickness, wallHeight, tileSize)
					const wall = new THREE.Mesh(geometry, wallMaterial)
					wall.position.set(x * tileSize, wallHeight / 2, y * tileSize)
					scene.add(wall)
				})
			}
			for (let x = 0; x < size.x; x++) {
				;[
					[x, -1],
					[x, size.y],
				].forEach(([x, y]) => {
					const geometry = new THREE.BoxGeometry(tileSize, wallHeight, wallThickness)
					const wall = new THREE.Mesh(geometry, wallMaterial)
					wall.position.set(x * tileSize, wallHeight / 2, y * tileSize)
					scene.add(wall)
				})
			}
		}

		// Загружаем и размещаем домики по периметру
		if (withBuildings) {
			const loader = new GLTFLoader()
			loader.load("../models/coolhouse.glb?url", gltf => {
				const buildingModel = gltf.scene
				let tileSize = 18

				const addBuilding = (x: number, y: number) => {
					const building = buildingModel.clone()
					building.scale.set(0.8, 0.8, 0.8)
					building.position.set(x * tileSize, 0, y * tileSize)
					scene.add(building)
				}

				for (let y = 0; y < size.y / tileSize; y++) {
					addBuilding(-1.5, y)
					addBuilding(size.x + tileSize, y + tileSize)
				}
				for (let x = 0; x < size.x / tileSize; x++) {
					addBuilding(x, -1.5)
					addBuilding(x + tileSize, size.y + tileSize)
				}
			})
		}
	}

	const steeringWheelTurnSpeed = 0.5 // Скорость поворота руля, настраиваемая по желанию
	const updateSteeringWheel = () => {
		if (!steeringWheel) return

		const maxSteeringAngle = Math.PI / 4
		const turnSpeed = 0.05

		// Целевой угол поворота
		let targetAngle = 0
		if (keys.a || keys.ф) targetAngle = maxSteeringAngle
		if (keys.d || keys.в) targetAngle = -maxSteeringAngle

		// Плавное приближение текущего угла к целевому
		steeringWheel.rotation.y += (targetAngle - steeringWheel.rotation.y) * turnSpeed
	}

	let lastFrameTime = 0
	const fps = 60
	const frameDuration = 1000 / fps
	const animate = (time: number = 0) => {
		requestAnimationFrame(animate)
		if (time - lastFrameTime < frameDuration) return
		lastFrameTime = time
		const speed = 0.1
		const rotationSpeed = 0.03
		const maxSteerAngle = Math.PI / 6 // Максимальный угол поворота передних колёс (30°)
		const steerReturnSpeed = 0.05 // Скорость возвращения колёс в центр

		const direction = new THREE.Vector3()
		car.getWorldDirection(direction)

		if (keys.w || keys.ц) {
			car.position.addScaledVector(direction, speed)
		}
		if (keys.s || keys.ы) {
			car.position.addScaledVector(direction, -speed)
		}
		if (keys.a || keys.ф) {
			car.rotation.y += rotationSpeed
		}
		if (keys.d || keys.в) {
			car.rotation.y -= rotationSpeed
		}

		// Вращение колёс (вперёд-назад)
		const rollingDirection = keys.w || keys.ц ? 1 : keys.s || keys.ы ? -1 : 0
		Object.values(wheels).forEach(wheel => {
			wheel.rotateX(-0.1 * rollingDirection)
		})

		// Поворот передних колёс влево/вправо с плавным возвращением в центр
		let targetSteerAngle = 0
		if (keys.a || keys.ф) targetSteerAngle = maxSteerAngle
		if (keys.d || keys.в) targetSteerAngle = -maxSteerAngle

		wheels.Wheel1.rotation.y += (targetSteerAngle - wheels.Wheel1.rotation.y) * steerReturnSpeed
		wheels.Wheel2.rotation.y += (targetSteerAngle - wheels.Wheel2.rotation.y) * steerReturnSpeed

		// Центрируем камеру на машине
		if (isFirstPerson) {
			const carDirection = new THREE.Vector3()
			car.getWorldDirection(carDirection)

			const carPosition = new THREE.Vector3()
			car.getWorldPosition(carPosition)

			const cameraOffset = carDirection.clone().multiplyScalar(0.5)
			const heightOffset = new THREE.Vector3(0, 0.9, 0) // выше
			const backwardOffset = carDirection.clone().multiplyScalar(-0.37)
			const leftOffset = new THREE.Vector3()
				.crossVectors(carDirection, new THREE.Vector3(0, -0.3, 0))
				.multiplyScalar(0.2)

			camera.position.copy(carPosition).add(cameraOffset).add(heightOffset).add(backwardOffset).add(leftOffset)

			const lookAtTarget = carPosition
				.clone()
				.add(carDirection.clone().multiplyScalar(10))
				.add(new THREE.Vector3(0, 2.5, 0))
			camera.lookAt(lookAtTarget)
		} else {
			controls.target.set(car.position.x, car.position.y, car.position.z)
			controls.update()
		}

		updateSteeringWheel()
		renderer.render(scene, camera)
	}

	const handleKeyDown = (event: KeyboardEvent) => {
		if (event.key in keys) {
			keys[event.key as keyof typeof keys] = true
		}
		if (event.key === "1") {
			toggleCameraMode()
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

	const toggleCameraMode = () => {
		isFirstPerson = !isFirstPerson
		if (isFirstPerson) {
			controls.enabled = false
		} else {
			controls.enabled = true
		}
	}

	onMounted(async () => {
		await loadLevel()
		console.log(levelData.value)
		if (levelData.value) {
			init()
			await drawField(levelData.value.size, levelData.value.field, scene, true, true)
		}
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

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
		loader.load("../models/Car3_3.glb?url", gltf => {
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

			// const steeringWheelHelper = new THREE.AxesHelper(10)
			// steeringWheel.add(steeringWheelHelper)

			animate()
		})

		camera.position.set(0, 5, 10)
	}

	const modelPaths = [
		{ name: "coolhouse", path: "../models/coolhouse.glb?url" },
		{ name: "whitehouse", path: "../models/whitehouse.glb?url" },
		{ name: "pinkhouse", path: "../models/pinkhouse.glb?url" },
	]

	const loadModels = async () => {
		const loader = new GLTFLoader()
		const promises = modelPaths.map(
			info =>
				new Promise<{ name: string; scene: THREE.Object3D; width: number }>((resolve, reject) => {
					loader.load(info.path, gltf => {
						const model = gltf.scene
						model.scale.set(0.5, 0.5, 0.5)

						// Получаем ширину bounding box
						const box = new THREE.Box3().setFromObject(model)
						const size = new THREE.Vector3()
						box.getSize(size)

						resolve({ name: info.name, scene: model, width: size.x })
					})
				})
		)
		return Promise.all(promises)
	}

	const placeBuildingsAlongSide = (
		start: THREE.Vector3,
		direction: THREE.Vector3,
		length: number,
		scene: THREE.Scene,
		models: { scene: THREE.Object3D; width: number }[]
	) => {
		let position = 0
		while (position <= length) {
			const modelData = models[Math.floor(Math.random() * models.length)]
			if (position > length) break

			const building = modelData.scene.clone()
			const offset = direction.clone().multiplyScalar(position + modelData.width / 2)
			const finalPos = start.clone().add(offset)
			building.position.copy(finalPos)

			// Правильный поворот модели внутрь поля
			if (direction.z === 1 && start.x < 0) building.rotation.y = Math.PI / 2
			else if (direction.z === 1 && start.x > 0) building.rotation.y = -Math.PI / 2
			else if (direction.x === 1 && start.z > 0) building.rotation.y = -Math.PI
			else if (direction.x === 1 && start.z < 0) building.rotation.y = 0

			scene.add(building)
			position += modelData.width
		}
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

		// Построение поля с расширением по 3 тайла с каждой стороны
		const grassTile: Tile = { type: "grass", angle: 0 }

		for (let y = -3; y < size.y + 3; y++) {
			for (let x = -3; x < size.x + 3; x++) {
				let tile: Tile

				// Проверяем, есть ли реальный тайл внутри границ
				if (y >= 0 && y < size.y && x >= 0 && x < size.x) {
					tile = field[y]?.[x] ?? grassTile
				} else {
					tile = grassTile
				}

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
			const wallMaterial = new THREE.MeshBasicMaterial({ visible: false })

			for (let y = 0; y < size.y; y++) {
				;[
					[-0.5, y],
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
					[x, -0.5],
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
			const models = await loadModels()
			const sideLength = (size.x + 2) * tileSize
			placeBuildingsAlongSide(
				new THREE.Vector3(-tileSize * 2, 0, -tileSize + tileSize * 0.2),
				new THREE.Vector3(1, 0, 0),
				sideLength,
				scene,
				models
			)
			placeBuildingsAlongSide(
				new THREE.Vector3(-tileSize, 0, size.y * tileSize - tileSize * 0.2),
				new THREE.Vector3(1, 0, 0),
				sideLength,
				scene,
				models
			)
			placeBuildingsAlongSide(
				new THREE.Vector3(-tileSize + tileSize * 0.2, 0, -tileSize),
				new THREE.Vector3(0, 0, 1),
				(size.y + 2) * tileSize,
				scene,
				models
			)
			placeBuildingsAlongSide(
				new THREE.Vector3(size.x * tileSize - tileSize * 0.2, 0, -tileSize),
				new THREE.Vector3(0, 0, 1),
				(size.y + 2) * tileSize,
				scene,
				models
			)
		}
	}

	const updateSteeringWheel = () => {
		if (!steeringWheel) return

		const maxSteeringAngle = Math.PI / 4
		const turnSpeed = 0.05

		// Целевой угол поворота
		let targetAngle = 0
		if (keys.a || keys.ф) targetAngle = maxSteeringAngle
		if (keys.d || keys.в) targetAngle = -maxSteeringAngle

		// Плавное приближение текущего угла к целевому
		steeringWheel.rotation.z += (targetAngle - steeringWheel.rotation.z) * turnSpeed
	}

	let velocity = 0
	const acceleration = 0.002
	const deceleration = 0.001
	const maxSpeed = 0.2
	const rotationSpeedFactor = 0.02
	const updateCarMovement = (car: THREE.Object3D) => {
		const direction = new THREE.Vector3()
		car.getWorldDirection(direction)

		// Управление ускорением и замедлением
		if (keys.w || keys.ц) {
			velocity += acceleration
		} else if (keys.s || keys.ы) {
			velocity -= acceleration
		} else {
			if (velocity > 0 && velocity >= deceleration) velocity -= deceleration
			if (velocity < 0 && velocity <= deceleration) velocity += deceleration
			if (Math.abs(velocity) < deceleration) velocity = 0
		}

		velocity = Math.max(-maxSpeed, Math.min(maxSpeed, velocity))

		// Поворот зависит от направления движения
		if (keys.a || keys.ф) {
			car.rotation.y += rotationSpeedFactor * (velocity >= 0 ? 1 : -1)
		}
		if (keys.d || keys.в) {
			car.rotation.y -= rotationSpeedFactor * (velocity >= 0 ? 1 : -1)
		}

		// Перемещение
		const movement = direction.clone().multiplyScalar(velocity)
		car.position.add(movement)

		// Вращение колёс
		Object.values(wheels).forEach(wheel => {
			wheel.rotateX(-velocity * 10)
		})

		// Поворот передних колёс визуально
		const maxSteerAngle = Math.PI / 6
		const steerReturnSpeed = 0.05
		let targetSteerAngle = 0
		if (keys.a || keys.ф) targetSteerAngle = maxSteerAngle
		if (keys.d || keys.в) targetSteerAngle = -maxSteerAngle

		wheels.Wheel1.rotation.y += (targetSteerAngle - wheels.Wheel1.rotation.y) * steerReturnSpeed
		wheels.Wheel2.rotation.y += (targetSteerAngle - wheels.Wheel2.rotation.y) * steerReturnSpeed
	}

	let lastFrameTime = 0
	const fps = 60
	const frameDuration = 1000 / fps
	const animate = (time: number = 0) => {
		requestAnimationFrame(animate)
		if (time - lastFrameTime < frameDuration) return
		lastFrameTime = time

		const direction = new THREE.Vector3()
		car.getWorldDirection(direction)

		updateCarMovement(car)

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

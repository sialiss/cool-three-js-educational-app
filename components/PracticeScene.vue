<template>
	<div ref="threeCanvas" class="three-canvas"></div>
	<div id="speedometer" v-show="isFirstPerson" class="speedometer">{{ speed.toFixed(0) }} км/ч</div>

	<!-- Нарушение правил -->
	<div v-if="violationMessageVisible" class="violation-message">
		{{ violationMessage }}
	</div>

	<!-- Результат -->
	<ViolationSummary
		v-if="showSummary"
		:log="violationLogObject"
		:id="Number(route.params.id)"
		@close="showSummary = false"
	/>
</template>

<script setup lang="ts">
	import { onMounted, ref } from "vue"
	import * as THREE from "three"
	import * as CANNON from "cannon-es"
	import { GLTFLoader } from "three/examples/jsm/loaders/GLTFLoader.js"
	import { OrbitControls } from "three/examples/jsm/controls/OrbitControls.js"
	import { useRoute } from "vue-router"
	import type { Level } from "../utils/types"
	import { trafficSigns } from "../utils/signs"
	import { useAuth } from "@/composables/useAuth"
	import { loadObject } from "../utils/modelLoader"

	const route = useRoute()
	const { getRole, isOffline } = useAuth()
	const levelData = ref<Level | null>(null)
	const config = useRuntimeConfig()

	const loadLevel = async () => {
		const id = Number(route.params.id)
		let lesson
		if (!isOffline) {
			const res = await fetch(`http://localhost:8000/practice-lessons/${id}`, {
				headers: { "Content-Type": "application/json" },
			})
			const data = await res.json()
			lesson = data.lesson
		} else {
			const localRes = await fetch(`${config.app.baseURL}data/lessons.json`)
			if (!localRes.ok) throw new Error("Локальный файл не найден")
			const allLessons = await localRes.json()
			const lessons = allLessons
				.filter((lesson: { practice: any }) => lesson.practice)
				.map((lesson: { practice: any }) => lesson.practice)
			lesson = lessons.find((l: { id: number }) => l.id === id)
		}
		levelData.value = lesson
		console.log(levelData.value)
	}

	const textureLoader = new THREE.TextureLoader()
	const textureUrls = {
		grass: import("../assets/images/grass.png"),
		road: import("../assets/images/road.png"),
		turning_road: import("../assets/images/turning_road.png"),
		road_with_line: import("../assets/images/road_with_line.png"),
		road_with_wide_line: import("../assets/images/road_with_wide_line.png"),
		road_with_long_dashes: import("../assets/images/road_with_long_dashes.png"),
		road_with_wide_dashes: import("../assets/images/road_with_wide_dashes.png"),
		road_with_dashes: import("../assets/images/road_with_dashes.png"),
		road_for_crossroad: import("../assets/images/road_for_crossroad.png"),
		crosswalk: import("../assets/images/crosswalk.png"),
	}
	const world = new CANNON.World()
	world.gravity.set(0, -9.82, 0)
	let scene: THREE.Scene
	let camera: THREE.PerspectiveCamera
	let renderer: THREE.WebGLRenderer
	let car: THREE.Object3D
	const carBody = new CANNON.Body({
		mass: 1, // статическое тело, если не двигать его через физику
	})
	let wheels: Record<string, THREE.Object3D> = {}
	let steeringWheel: THREE.Object3D
	let controls: OrbitControls
	const wheelMaxAngle = (Math.PI * 5) / 2
	const kms = 300
	const threeCanvas = ref<HTMLDivElement | null>(null)
	const keys = { w: false, ц: false, a: false, ф: false, s: false, ы: false, d: false, в: false }
	const isFirstPerson = ref(true)
	const speed = ref(0)
	const loader = new GLTFLoader()
	let gamepad: Gamepad | null = null

	let texturePromises: {
		[k: string]: Promise<THREE.Texture>
	}
	let trafficlights: THREE.Object3D[] = []
	let pedlights: THREE.Object3D[] = []
	const signZones: {
		sign: THREE.Object3D<THREE.Object3DEventMap>
		radius: number
		logic: string
		position: THREE.Vector3
		message?: string
		entered: boolean
	}[] = []
	const showSummary = ref(false)
	const violationMessage = ref("")
	const violationMessageVisible = ref(false)
	const violationLog = ref(new Map<string, number>())
	const violationLogObject = computed(() => {
		const obj: Record<string, number> = {}
		for (const [key, value] of violationLog.value.entries()) {
			obj[key] = value
		}
		return obj
	})
	let violationTimeout: ReturnType<typeof setTimeout> | null = null

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
		textureLoader.load("../images/BlueSkySkybox.png", texture => {
			const geometry = new THREE.SphereGeometry(500, 60, 40)
			const material = new THREE.MeshBasicMaterial({
				map: texture,
				side: THREE.BackSide, // отрисовываем внутреннюю часть сферы
			})
			const skyDome = new THREE.Mesh(geometry, material)
			scene.add(skyDome)
		})

		loader.load("../models/Car3_3.glb?url", gltf => {
			car = gltf.scene
			car.scale.set(0.5, 0.5, 0.5)
			const width = levelData.value?.size.x || 0
			const length = levelData.value?.size.y || 0
			car.position.set(width / 2, 0.1, length / 2)
			scene.add(car)

			const carShape = new CANNON.Box(new CANNON.Vec3(0.5, 0.25, 1)) // примерные размеры
			carBody.addShape(carShape)
			carBody.position.set(car.position.x, car.position.y, car.position.z)
			world.addBody(carBody)

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

				// Проверяем, есть ли реальный тайл
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
				mesh.rotation.z = -Math.PI / 2
				if (tile.angle) {
					mesh.rotation.z += THREE.MathUtils.degToRad(tile.angle)
				}

				scene.add(mesh)
			}
		}

		if (withWalls) {
			const wallHeight = 2
			const wallThickness = 0.1
			const wallMaterial = new THREE.MeshBasicMaterial({ visible: false })
			const wallPhysicsMaterial = new CANNON.Material("wallMaterial")

			for (let y = 0; y < size.y; y++) {
				;[
					[-0.5, y],
					[size.x, y],
				].forEach(([x, y]) => {
					const geometry = new THREE.BoxGeometry(wallThickness, wallHeight, tileSize)
					const wall = new THREE.Mesh(geometry, wallMaterial)
					wall.position.set(x * tileSize, wallHeight / 2, y * tileSize)
					scene.add(wall)

					const shape = new CANNON.Box(new CANNON.Vec3(wallThickness / 2, wallHeight / 2, tileSize / 2))
					const body = new CANNON.Body({ mass: 0, material: wallPhysicsMaterial })
					body.addShape(shape)
					body.position.set(x * tileSize, wallHeight / 2, y * tileSize)
					world.addBody(body)
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

					const shape = new CANNON.Box(new CANNON.Vec3(tileSize / 2, wallHeight / 2, wallThickness / 2))
					const body = new CANNON.Body({ mass: 0, material: wallPhysicsMaterial })
					body.addShape(shape)
					body.position.set(x * tileSize, wallHeight / 2, y * tileSize)
					world.addBody(body)
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

	const drawExtras = async (extras: any[], scene: THREE.Scene) => {
		const tileSize = 4
		const texture = await texturePromises.crosswalk

		for (const extra of extras) {
			const { type, position } = extra
			const px = position.x * tileSize
			const pz = position.y * tileSize

			if (type === "crosswalk") {
				const material = new THREE.MeshBasicMaterial({ map: texture, transparent: true })
				const geometry = new THREE.PlaneGeometry(tileSize, tileSize)
				const mesh = new THREE.Mesh(geometry, material)
				mesh.rotation.x = -Math.PI / 2
				mesh.position.set(pz, 0.015, px)
				scene.add(mesh)
				mesh.rotation.z = -Math.PI / 2
				if (extra.angle) {
					mesh.rotation.z += THREE.MathUtils.degToRad(extra.angle)
				}
			} else if (type === "trafficlight") {
				const light = await loadObject(type)
				light.userData.name = "trafficLight"
				light.scale.set(3.5, 3.5, 3.5)
				light.position.set(pz - tileSize / 2 + 0.5, 0, px - tileSize / 2 + 0.5)
				light.rotation.y = -THREE.MathUtils.degToRad(extra.angle) + Math.PI
				scene.add(light)

				const lightobj1 = light.getObjectByName("trafficlight1")
				const lightobj2 = light.getObjectByName("trafficlight2")
				const lightobj3 = light.getObjectByName("trafficlight3")

				if (lightobj1 && lightobj2 && lightobj3) {
					lightobj1.userData.angle = extra.angle
					lightobj2.userData.angle = extra.angle + 90
					lightobj3.userData.angle = extra.angle
					trafficlights.push(lightobj1, lightobj2)
					pedlights.push(lightobj3)
					getLightMaterials(lightobj1, lightobj3)
				}
			} else if (type === "fence") {
				const fence = await loadObject(type)
				fence.scale.set(1, 1, 1)

				let posX = pz
				let posZ = px
				const offset = tileSize * 0.5
				let rotY = 0

				switch (extra.angle) {
					case 0:
						posX += offset
						break
					case 90:
						posZ -= offset
						rotY = Math.PI / 2
						break
					case 180:
						posX -= offset
						rotY = Math.PI
						break
					case 270:
						posZ += offset
						rotY = -Math.PI / 2
						break
				}

				fence.position.set(posX, 0, posZ)
				fence.rotation.y = rotY + Math.PI / 2
				scene.add(fence)

				const box = new THREE.Box3().setFromObject(fence)
				const size = new THREE.Vector3()
				box.getSize(size)

				const wallHeight = size.y
				const wallThickness = 0.3

				const wallPhysicsMaterial = new CANNON.Material("wallMaterial")
				const shape = new CANNON.Box(new CANNON.Vec3(tileSize / 2, wallHeight / 2, wallThickness / 2))
				const body = new CANNON.Body({ mass: 0, material: wallPhysicsMaterial })
				body.addShape(shape)
				body.position.set(posX, wallHeight / 2, posZ)
				body.quaternion.setFromEuler(0, rotY + Math.PI / 2, 0)
				world.addBody(body)
			} else if (type === "sign") {
				const originalSign = await loadObject(type)

				// Клонируем объект и его материалы
				const sign = originalSign.clone(true)

				sign.traverse(obj => {
					if ((obj as THREE.Mesh).isMesh) {
						const mesh = obj as THREE.Mesh
						mesh.material = (mesh.material as THREE.Material).clone()
					}
				})

				const textureLoader = new THREE.TextureLoader()
				const signinfo = trafficSigns.find(sign => sign.name === extra.name)

				if (signinfo) {
					const texturePath = `../models/traffic_signs-01-3ds/${signinfo.texture}`
					textureLoader.load(texturePath, texture => {
						texture.flipY = false
						const targetChild = sign.children[0].children[0]
						if (!(targetChild instanceof THREE.Mesh)) throw Error("uhhh not mesh")
						;(targetChild.material as THREE.MeshStandardMaterial).map = texture
						targetChild.material.needsUpdate = true
					})
				}

				sign.rotation.y = -THREE.MathUtils.degToRad(extra.angle) + Math.PI / 2
				sign.position.set(pz - tileSize / 2 + 0.5, 0, px - tileSize / 2 + 0.5)
				sign.userData = { type: "sign", logic: extra.function, radius: extra.radius }
				scene.add(sign)

				if (extra.function) {
					const zoneGeometry = new THREE.CylinderGeometry(extra.radius, extra.radius, 0.01, 32)
					const zoneMaterial = new THREE.MeshBasicMaterial({
						color: 0x00ff00,
						opacity: 0,
						transparent: true,
					})
					const zone = new THREE.Mesh(zoneGeometry, zoneMaterial)
					zone.position.set(pz, 0.005, px)
					scene.add(zone)

					signZones.push({
						sign,
						radius: extra.radius,
						logic: extra.function,
						position: new THREE.Vector3(pz, 0, px),
						message: signinfo?.message,
						entered: false,
					})
				}
			}
		}
	}

	function checkSignLogic(logic: string, player: any): boolean {
		if (logic === "") return true
		if (logic === "stopped") return player.speed === 0
		if (logic === "onRightLane") return player.lane === "right"
		if (logic === "onLeftLane") return player.lane === "left"

		const speedMatch = logic.match(/^speed([<>]=?)(\d+)$/)
		if (speedMatch) {
			const op = speedMatch[1]
			const value = parseFloat(speedMatch[2])
			switch (op) {
				case "<":
					return velocity * kms < value
				case "<=":
					return velocity * kms <= value
				case ">":
					return velocity * kms > value
				case ">=":
					return velocity * kms >= value
			}
		}

		console.warn("Неизвестная логика:", logic)
		return false
	}

	const clock = new THREE.Clock()
	let switchTimer = 0
	let state = "green_NS" // N-S (0/180) зелёный, E-W (90/270) красный
	const switchInterval = 10000 // мс
	let lightmaterials: Record<string, THREE.Material> = {}
	const lightnames = {
		red: ["trafficlight1_2", "trafficlight2_2", "trafficlight3_2"],
		yellow: ["trafficlight1_3", "trafficlight2_3"],
		green: ["trafficlight1_4", "trafficlight2_4", "trafficlight3_2"],
		black: ["trafficlight3_2"],
	}

	function getLightMaterials(obj: THREE.Object3D<THREE.Object3DEventMap>, obj2: THREE.Object3D<THREE.Object3DEventMap>) {
		let mesh
		for (let i = 1; i < obj.children.length; i++) {
			mesh = obj.children[i]
			if (!(mesh instanceof THREE.Mesh)) throw Error("uhhh not mesh")
			lightmaterials[mesh.material.name] = mesh.material
		}
		for (let i = 1; i < obj2.children.length; i++) {
			mesh = obj2.children[i]
			if (!(mesh instanceof THREE.Mesh)) throw Error("uhhh not mesh")
			lightmaterials[mesh.material.name] = mesh.material
		}
	}

	function updateTrafficLights() {
		const deltaTime = clock.getDelta() * 1000
		switchTimer += deltaTime

		if (switchTimer >= switchInterval) {
			switchTimer = 0

			if (state === "green_NS") {
				updateGroupLights([0, 180], "yellow")
				updateGroupLights([90, 270], "red")
				updatePedestrianLights([0, 180], "red")
				state = "yellow_NS"
			} else if (state === "yellow_NS") {
				updateGroupLights([0, 180], "red")
				updateGroupLights([90, 270], "green")
				updatePedestrianLights([90, 270], "red")
				updatePedestrianLights([0, 180], "green")
				state = "green_EW"
			} else if (state === "green_EW") {
				updateGroupLights([90, 270], "yellow")
				updateGroupLights([0, 180], "red")
				updatePedestrianLights([0, 180], "red")
				state = "yellow_EW"
			} else if (state === "yellow_EW") {
				updateGroupLights([90, 270], "red")
				updateGroupLights([0, 180], "green")
				updatePedestrianLights([90, 270], "green")
				updatePedestrianLights([0, 180], "red")
				state = "green_NS"
			}
		}
	}

	function updateGroupLights(angles: number[], color: "black" | "red" | "yellow" | "green") {
		trafficlights.forEach(light => {
			if (angles.includes(light.userData.angle)) setTrafficLightColor(light, color)
		})
	}

	function updatePedestrianLights(angles: number[], color: "black" | "red" | "yellow" | "green") {
		pedlights.forEach(light => {
			if (angles.includes(light.userData.angle)) setPedestrianLightColor(light, color)
		})
	}

	function setTrafficLightColor(light: THREE.Object3D, color: "black" | "red" | "yellow" | "green") {
		let child
		for (let i = 1; i < light.children.length; i++) {
			child = light.children[i]
			if (!(child instanceof THREE.Mesh)) throw Error("uhhh not mesh")
			child.material = lightnames[color].includes(child.name)
				? lightmaterials[`${color}light`]
				: lightmaterials["blacklight"]
		}
	}

	function setPedestrianLightColor(light: THREE.Object3D, color: "black" | "red" | "yellow" | "green") {
		let child
		for (let i = 1; i < light.children.length; i++) {
			child = light.children[i]
			if (!(child instanceof THREE.Mesh)) throw Error("uhhh not mesh")
			child.material = lightnames[color].includes(child.name)
				? lightmaterials[`${color}light`]
				: lightmaterials["blacklight"]
		}
	}

	// Возвращает правильный материал для лампы в зависимости от текущей фазы
	function getMaterialForLight(lightName: string, activeColor: string) {
		return lightName === activeColor ? lightmaterials[`${activeColor}light`] : lightmaterials["blacklight"]
	}

	const updateSteeringWheel = () => {
		if (!steeringWheel) return

		const maxSteeringAngle = Math.PI / 4
		const turnSpeed = 0.05

		if (gamepad) {
			steeringWheel.rotation.z = gamepad.axes[0] * wheelMaxAngle
		} else {
			// Целевой угол поворота
			let targetAngle = 0
			if (keys.a || keys.ф) targetAngle = maxSteeringAngle
			if (keys.d || keys.в) targetAngle = -maxSteeringAngle

			// Плавное приближение текущего угла к целевому
			steeringWheel.rotation.z += (targetAngle - steeringWheel.rotation.z) * turnSpeed
		}
	}

	let velocity = 0
	const acceleration = 0.002
	const deceleration = 0.001
	const maxSpeed = 0.4
	const rotationSpeedFactor = 0.02
	let isColliding = false
	const updateCarMovement = (car: THREE.Object3D) => {
		const direction = new THREE.Vector3()
		car.getWorldDirection(direction)

		// Управление ускорением и замедлением
		if (gamepad) {
			const gasInput = pedalToLinear(gamepad.axes[1]) * getGamepadGearDirection(gamepad)
			const breakInput = pedalToLinear(gamepad.axes[2])
			if (gasInput) velocity += gasInput * acceleration
			// Замедление если нажат тормоз или не нажат газ
			if (!gasInput || breakInput) decelerate(breakInput)
		} else {
			if (keys.w || keys.ц) {
				velocity += acceleration
			} else if (keys.s || keys.ы) {
				velocity -= acceleration
			} else {
				decelerate()
			}
		}

		velocity = Math.max(-maxSpeed, Math.min(maxSpeed, velocity))

		// Поворот зависит от направления движения
		if (gamepad) {
			car.rotation.y += -gamepad.axes[0] * rotationSpeedFactor * (velocity >= 0 ? 1 : -1)
		} else {
			if (keys.a || keys.ф) {
				car.rotation.y += rotationSpeedFactor * (velocity >= 0 ? 1 : -1)
			}
			if (keys.d || keys.в) {
				car.rotation.y -= rotationSpeedFactor * (velocity >= 0 ? 1 : -1)
			}
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

	carBody.addEventListener("collide", function (e: { body: any }) {
		const otherBody = e.body
		isColliding = true
		// console.log("Столкновение с", otherBody)

		// отталкивание машины назад
		stopCarMovement()
	})

	const getGamepadGearDirection = (gamepad: Gamepad) => {
		// Реверс
		if (gamepad.buttons[11].pressed) return -1
		// Передачи с 1 по 6
		if (
			gamepad.buttons[12].pressed ||
			gamepad.buttons[13].pressed ||
			gamepad.buttons[14].pressed ||
			gamepad.buttons[15].pressed ||
			gamepad.buttons[16].pressed ||
			gamepad.buttons[17].pressed
		)
			return 1
		// Нейтральная
		return 0
	}

	const decelerate = (breakingFactor = 0) => {
		const decelerationPower = deceleration * (1 + breakingFactor)
		if (velocity > 0 && velocity >= deceleration) velocity -= decelerationPower
		if (velocity < 0 && velocity <= deceleration) velocity += decelerationPower
		if (Math.abs(velocity) < decelerationPower) velocity = 0
	}

	const stopCarMovement = () => {
		velocity = -acceleration * 10
		const direction = new THREE.Vector3()
		car.getWorldDirection(direction)
		const movement = direction.clone().multiplyScalar(velocity)
		car.position.add(movement)
		isColliding = false
	}

	let lastFrameTime = 0
	const fps = 60
	const frameDuration = 1000 / fps
	const animate = (time: number = 0) => {
		requestAnimationFrame(animate)
		if (time - lastFrameTime < frameDuration) return
		lastFrameTime = time

		updateTrafficLights()

		const direction = new THREE.Vector3()
		car.getWorldDirection(direction)

		if (!isColliding) {
			// обновляем позицию машины
			updateCarMovement(car)
		}

		carBody.position.set(car.position.x, car.position.y, car.position.z)
		carBody.quaternion.set(car.quaternion.x, car.quaternion.y, car.quaternion.z, car.quaternion.w)

		world.step(1 / 60)

		for (const zone of signZones) {
			const distance = car.position.distanceTo(zone.position)
			const isInside = distance < zone.radius

			if (isInside) {
				if (!zone.entered) {
					zone.entered = true // машина находится в зоне действия

					if (zone.logic === "win") {
						endLevel()
					} else {
						const success = checkSignLogic(zone.logic, car)
						if (!success) {
							showViolation(`Нарушение: ${zone.message}`)
						}
					}
				}
			} else {
				zone.entered = false // машина выехала
			}
		}

		// Центрируем камеру на машине
		if (isFirstPerson.value) {
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

		speed.value = velocity * kms

		updateSteeringWheel()
		renderer.render(scene, camera)
	}

	function showViolation(message: string) {
		if (violationLog.value.has(message)) {
			violationLog.value.set(message, violationLog.value.get(message)! + 1)
		} else {
			violationLog.value.set(message, 1)
		}

		violationMessage.value = message
		violationMessageVisible.value = true

		if (violationTimeout) {
			clearTimeout(violationTimeout)
		}
		violationTimeout = setTimeout(() => {
			violationMessageVisible.value = false
		}, 5000)
	}

	function endLevel() {
		showSummary.value = true
	}

	const handleKeyDown = (event: KeyboardEvent) => {
		if (event.key in keys) {
			keys[event.key as keyof typeof keys] = true
		}
		if (getRole() == "admin" && event.key === "1") {
			toggleCameraMode()
		}
	}

	const handleKeyUp = (event: KeyboardEvent) => {
		if (event.key in keys) {
			keys[event.key as keyof typeof keys] = false
		}
	}

	const pedalToLinear = (pedalInput: number) => {
		return (1 - pedalInput) / 2
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
		isFirstPerson.value = !isFirstPerson.value
		controls.enabled = !isFirstPerson.value
	}

	onMounted(async () => {
		texturePromises = Object.fromEntries(
			Object.entries(textureUrls).map(([key, path]) => [key, path.then(module => textureLoader.load(module.default))])
		)
		await loadLevel()
		if (levelData.value) {
			init()
			if (getRole() == "admin") isFirstPerson.value = false
			await drawField(levelData.value.size, levelData.value.field, scene, true, true)
			if (levelData.value.extras) {
				await drawExtras(levelData.value.extras, scene)
			}
		}

		if ("getGamepads" in navigator) {
			for (const gpad of navigator.getGamepads()) {
				console.log(gpad)
				if (!gpad) continue
				gamepad = gpad
				break
			}
			window.addEventListener("gamepadconnected", e => {
				gamepad = e.gamepad
				console.log(gamepad)
			})
			window.addEventListener("gamepaddisconnected", e => {
				if (e.gamepad == gamepad) gamepad = null
				console.log(gamepad)
			})
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

	.speedometer {
		position: absolute;
		bottom: 20px;
		right: 20px;
		padding: 8px 14px;
		background: rgba(0, 0, 0, 0.6);
		color: #fff;
		font-size: 18px;
		font-family: sans-serif;
		border-radius: 8px;
		pointer-events: none;
		user-select: none;
	}

	.violation-message {
		position: absolute;
		top: 20px;
		left: 50%;
		transform: translateX(-50%);
		background-color: rgba(255, 0, 0, 0.85);
		color: #fff;
		padding: 12px 24px;
		font-size: 20px;
		font-weight: bold;
		font-family: sans-serif;
		border-radius: 10px;
		box-shadow: 0 4px 10px rgba(0, 0, 0, 0.4);
		z-index: 100;
		transition: opacity 0.3s ease;
		pointer-events: none;
	}
</style>

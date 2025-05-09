<template>
	<div class="horizontalContainer">
		<div ref="canvasContainer" class="canvas-container"></div>
		<div class="controls">
			<div class="buttons">
				<button @click="close" title="Выйти">❌</button>
				<button @click="save" title="Сохранить">💾</button>
				<button @click="clearAll" title="Очистить всё">🧹</button>
			</div>
			<div class="sections">
				<details open>
					<summary>Targets</summary>
					<div>
						<div>
							<label for="goal-score">Score</label>
							<input
								id="goal-score"
								type="number"
								placeholder="goal"
								min="0"
								step="1"
								value="50"
								title="goal"
							/>
						</div>
						<div>
							<label for="goal-wood">Wood</label>
							<input
								id="goal-wood"
								type="number"
								placeholder="wood goal"
								min="0"
								step="1"
								value="0"
								title="wood goal"
							/>
						</div>
					</div>
				</details>
				<details open>
					<summary>Modes</summary>
					<div class="modes">
						<div class="mode-buttons">
							<!-- Кнопки выбора дороги -->
							<div class="road-texture-buttons">
								<button
									v-for="(url, name) in loadedUrls"
									:key="name"
									@click="setRoadType(name)"
									:class="{ selected: mode.name === 'road' && mode.type === name }"
									class="road-button"
									:title="name"
								>
									<img :src="url" :alt="name" />
								</button>
							</div>

							<!-- Кнопки поворота -->
							<div v-if="mode.name === 'road'" class="rotation-buttons">
								<button
									v-for="angle in [0, 90, 180, 270]"
									:key="angle"
									@click="setRoadRotation(angle)"
									:class="{ selected: mode.angle === angle }"
								>
									{{ angle }}°
								</button>
							</div>
						</div>
					</div>
				</details>
			</div>
		</div>
	</div>
</template>

<script setup lang="ts">
	import { onMounted, ref, reactive } from "vue"
	import { Application, Assets, Container, Point, Sprite, Texture } from "pixi.js"
	import type { Level, Tile } from "../utils/types"
	import { createDefaultLevel } from "../utils/level"
	import { useRouter } from "vue-router"

	const router = useRouter()

	const loadedUrls: Record<string, string> = reactive({})

	const canvasContainer = ref<HTMLDivElement | null>(null)
	const app = new Application()
	const center = new Point()
	const level: Level = createDefaultLevel()
	const tiles = ref<Tile[][]>([])

	const textureSize = 50
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
	const textures: Record<string, Texture> = {}
	const slots = new Map<Sprite, Point>()

	const mode = ref<{ name: "idle" } | { name: "grass" } | { name: "road"; type: string; angle: number }>({
		name: "idle",
	})

	onMounted(() => {
		init()

		// window.addEventListener("keydown", handleKeyDown)
		// window.addEventListener("keyup", handleKeyUp)
		// window.addEventListener("resize", onWindowResize)
		// threeCanvas.value?.addEventListener("click", focusWindow)
	})

	const init = async () => {
		if (!canvasContainer.value) return

		// await app.init({ width: 600, height: 600, backgroundColor: "F5F3E5" })
		await app.init({ width: 550, height: 550, backgroundColor: "F5F3E5" })
		canvasContainer.value.append(app.canvas)

		const texturePromises = Object.entries(textureUrls).map(async ([name, importThing]) => {
			const mod = await importThing
			loadedUrls[name] = mod.default // путь к картинке
			textures[name] = await Assets.load(mod.default)
		})

		await Promise.all(texturePromises)

		// center.set(app.canvas.width / 2, app.canvas.height / 2)
		app.canvas.style.touchAction = "auto"

		spawnSlots()
	}

	function setRoadType(type: string) {
		if (mode.value.name === "road" && mode.value.type === type) {
			mode.value = { name: "idle" }
		} else {
			mode.value = { name: "road", type, angle: 0 }
		}
		console.log(mode.value)
	}

	function setRoadRotation(angle: number) {
		if (mode.value.name === "road") {
			mode.value.angle = angle
		}
	}

	function spawnSlots() {
		// Spawn slots
		for (let y = 0; y <= 21; y += 1) {
			tiles.value.push([])
			for (let x = 0; x <= 21; x += 1) {
				const scale = 0.5
				let slotX = x * textureSize * scale + textureSize * 0.25
				let slotY = y * textureSize * scale + textureSize * 0.25

				const container = new Container()
				container.position = new Point(center.x + slotX, center.y + slotY)
				const slot = new Sprite(textures.grass)
				slot.scale = scale
				slot.anchor.set(0.5, 0.5)

				if (level.field[y]?.[x]) {
					tiles.value[y][x] = level.field[y][x]
				}

				container.eventMode = "static"
				container.on("pointermove", event => {
					if (event.pressure != 0) onSlotClick(slot, x, y)
				})

				container.addChild(slot)
				app.stage.addChild(container)
				slots.set(slot, new Point(x, y))
			}
		}
	}

	function onSlotClick(slot: Sprite, x: number, y: number) {
		// const slotContainer = slot.parent
		// road mode.value
		if (mode.value.name == "road") {
			tiles.value[x][y] = { type: mode.value.type, angle: mode.value.angle }
			slot.texture = textures[mode.value.type]
			slot.angle = mode.value.angle
		}
	}

	function clearAll() {
		for (const [sprite, pos] of slots.entries()) {
			sprite.texture = textures.grass
			sprite.angle = 0
			tiles.value[pos.y][pos.x] = { type: "grass", angle: 0 }
		}
		mode.value = { name: "idle" }
	}

	function close() {
		router.push("/dashboard")
	}

	async function save() {
		const goalScoreInput = document.getElementById("goal-score") as HTMLInputElement

		const levelToSave: Level = {
			...level,
			field: tiles.value,
			goal: {
				score: parseInt(goalScoreInput.value || "0"),
			},
		}

		try {
			const res = await fetch("http://localhost:8000/practice-lessons", {
				method: "POST",
				headers: {
					"Content-Type": "application/json",
				},
				body: JSON.stringify(levelToSave),
			})
			if (!res.ok) throw new Error(`Ошибка: ${res.statusText}`)

			alert("Уровень успешно сохранён!")
		} catch (err) {
			console.error("Ошибка при сохранении:", err)
			alert("Не удалось сохранить уровень.")
		}
	}
</script>

<style>
	.horizontalContainer {
		margin-top: 1rem;
		display: flex;
	}

	.canvas-container {
		/* 		width: 100%;
		height: 100%; */
		display: flex;
		justify-content: center;
		overflow: hidden;
		flex-grow: 1;
	}

	details {
		padding: 1rem;
		background-color: white;
		border: 2px solid #777777;
		border-radius: 5px;
		box-shadow: 0 2rem 4rem -2rem #0003;
	}

	.controls {
		display: flex;
		flex-direction: column;
		max-width: 300px;
		gap: 1rem;
		padding: 1rem;
	}

	.controls > .buttons {
		grid-row: 1;
		grid-column: 2;
		display: flex;
		flex-direction: row-reverse;
		justify-content: end;
		gap: 1rem;
	}
	[data-action="close"],
	[data-action="save"] {
		width: 6rem;
		display: flex;
		justify-content: center;
		align-items: center;
	}

	.controls > .sections {
		display: flex;
		flex-direction: column;
		gap: 1rem;
	}

	.road-texture-buttons {
		display: flex;
		flex-wrap: wrap;
		gap: 4px;
		margin-bottom: 8px;
	}

	.road-button {
		width: 40px;
		height: 40px;
		padding: 0;
		border: none;
		background: transparent;
		filter: brightness(0.5);
		cursor: pointer;
		transition: filter 0.2s, transform 0.2s;
	}

	.road-button.selected {
		filter: brightness(1);
		transform: scale(1.1);
		border: 2px solid #007bff;
		border-radius: 4px;
	}

	.road-button img {
		width: 100%;
		height: 100%;
		object-fit: cover;
	}

	.rotation-buttons {
		display: flex;
		gap: 6px;
	}

	.rotation-buttons button {
		padding: 4px 10px;
		border: 1px solid #ccc;
		background: #f0f0f0;
		cursor: pointer;
		border-radius: 4px;
	}

	.rotation-buttons button.selected {
		background: #007bff;
		color: white;
		border-color: #007bff;
	}
</style>

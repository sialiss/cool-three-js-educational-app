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
					<summary>Урок</summary>
					<div class="lesson-select">
						<label>Привязать к уроку:</label>
						<select v-model="selectedLessonId">
							<option disabled value="">Выберите урок</option>
							<option v-for="lesson in lessons" :key="lesson.id" :value="lesson.id">
								{{ lesson.title }}
							</option>
						</select>
						<button @click="showModal = true">Создать новый</button>
					</div>
				</details>
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
				<details open>
					<summary>Extras</summary>
					<div class="extras-buttons">
						<button
							@click="setExtraMode('trafficlight')"
							:class="{ selected: mode.name === 'extra' && mode.extraType === 'trafficlight', active: true }"
						>
							🚦
						</button>
						<button
							@click="setExtraMode('sign')"
							:class="{ selected: mode.name === 'extra' && mode.extraType === 'sign', active: true }"
						>
							🚧
						</button>
						<button
							@click="setExtraMode('crosswalk')"
							:class="{ selected: mode.name === 'extra' && mode.extraType === 'crosswalk', active: true }"
						>
							🚶‍♂️
						</button>
						<button
							@click="setExtraMode('finish')"
							:class="{ selected: mode.name === 'extra' && mode.extraType === 'finish', active: true }"
						>
							🏁
						</button>
					</div>
				</details>
			</div>
		</div>
		<div v-if="showModal" class="modal-overlay">
			<div class="modal">
				<h3>Создание нового урока</h3>
				<label>Название:</label>
				<input v-model="newLessonTitle" />
				<label>Описание:</label>
				<textarea v-model="newLessonDescription"></textarea>
				<div class="modal-buttons">
					<button @click="createLesson">Создать</button>
					<button @click="showModal = false">Отмена</button>
				</div>
			</div>
		</div>
		<div v-if="showReplaceModal" class="modal-overlay">
			<div class="modal">
				<h3>Практика уже существует</h3>
				<p>Для этого урока уже создан уровень. Заменить существующий?</p>
				<div class="modal-buttons">
					<button @click="replaceLevel">Заменить</button>
					<button @click="showReplaceModal = null">Отмена</button>
				</div>
			</div>
		</div>
		<ExtraEditor v-if="editExtra" :extra="editExtra" @close="editExtra = null" />
	</div>
</template>

<script setup lang="ts">
	import { onMounted, ref, reactive } from "vue"
	import { Application, Assets, Container, Point, Sprite, Texture } from "pixi.js"
	import type { Level, Tile } from "../utils/types"
	import { createDefaultLevel } from "../utils/level"
	import { useRouter } from "vue-router"

	const router = useRouter()

	const lessons = ref<{ id: number; title: string }[]>([])
	const selectedLessonId = ref("")
	const showModal = ref(false)
	const showReplaceModal = ref(null)
	const newLessonTitle = ref("")
	const newLessonDescription = ref("")

	const loadedUrls: Record<string, string> = reactive({})

	const canvasContainer = ref<HTMLDivElement | null>(null)
	const app = new Application()
	const center = new Point()
	const level: Level = createDefaultLevel()
	const tiles = ref<Tile[][]>([])
	const extrasLayer = new Container()

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
	const extraTextureUrls = {
		crosswalk: import("../assets/images/crosswalk.png"),
	}
	const textures: Record<string, Texture> = {}
	const slots = new Map<Sprite, Point>()

	type Mode =
		| { name: "idle" }
		| { name: "grass" }
		| { name: "road"; type: string; angle: number }
		| { name: "extra"; extraType: "trafficlight" | "sign" | "crosswalk" | "finish" }

	const mode = ref<Mode>({ name: "idle" })
	const editExtra = ref<Extra | null>(null)

	onMounted(() => {
		init()
		loadLessons()

		// window.addEventListener("keydown", handleKeyDown)
		// window.addEventListener("keyup", handleKeyUp)
		// window.addEventListener("resize", onWindowResize)
		// threeCanvas.value?.addEventListener("click", focusWindow)
	})

	const init = async () => {
		if (!canvasContainer.value) return

		await app.init({ width: 550, height: 550, backgroundColor: "F5F3E5" })
		canvasContainer.value.append(app.canvas)

		const texturePromises = Object.entries(textureUrls).map(async ([name, importThing]) => {
			const mod = await importThing
			loadedUrls[name] = mod.default // путь к картинке
			textures[name] = await Assets.load(mod.default)
		})

		const extraTexturePromises = Object.entries(extraTextureUrls).map(async ([name, importThing]) => {
			const mod = await importThing
			// extraLoadedUrls[name] = mod.default // путь к картинке
			textures[name] = await Assets.load(mod.default)
		})

		await Promise.all([...texturePromises, ...extraTexturePromises])

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
	}

	function setRoadRotation(angle: number) {
		if (mode.value.name === "road") {
			mode.value.angle = angle
		}
	}

	function setExtraMode(extraType: "trafficlight" | "sign" | "crosswalk" | "finish") {
		if (mode.value.name === "extra" && mode.value.extraType === extraType) {
			mode.value = { name: "idle" }
		} else {
			mode.value = { name: "extra", extraType }
		}
	}

	function spawnSlots() {
		// Spawn slots
		for (let y = 0; y <= level.size.y; y += 1) {
			tiles.value.push([])
			for (let x = 0; x <= level.size.x; x += 1) {
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
				app.stage.addChild(extrasLayer)
				slots.set(slot, new Point(x, y))
			}
		}
	}

	function onSlotClick(slot: Sprite, x: number, y: number) {
		if (mode.value.name == "road") {
			tiles.value[y][x] = { type: mode.value.type, angle: mode.value.angle }
			slot.texture = textures[mode.value.type]
			slot.angle = mode.value.angle
		}

		if (mode.value.name === "extra") {
			let newExtra: Extra
			switch (mode.value.extraType) {
				case "trafficlight":
					newExtra = { type: "trafficlight", position: { x, y }, angle: 0 }
					break
				case "crosswalk":
					newExtra = { type: "crosswalk", position: { x, y }, angle: slot.angle }
					break
				case "sign":
					newExtra = {
						type: "sign",
						name: "Въезд запрещён",
						function: "",
						radius: 10,
						position: { x, y },
						angle: 0,
					}
					break
				case "finish":
					newExtra = {
						type: "sign",
						name: "Финиш",
						function: "win",
						radius: 10,
						position: { x, y },
						angle: 0,
					}
					break
			}
			const existingIndex = level.extras.findIndex(e => e.position.x === x && e.position.y === y)
			if (existingIndex !== -1) {
				level.extras.splice(existingIndex, 1)
				extrasLayer.removeChildAt(existingIndex)
			}
			level.extras.push(newExtra)

			// визуализация
			let marker: Sprite
			const pos = slots.get(slot)
			if (mode.value.extraType === "crosswalk") {
				marker = new Sprite(textures["crosswalk"])
				marker.scale = 0.5
				marker.anchor.set(0.5, 0.5)
				marker.angle = newExtra.angle
				if (pos) {
					marker.position.set(
						pos.x * textureSize * 0.5 + textureSize * 0.25,
						pos.y * textureSize * 0.5 + textureSize * 0.25
					)
				}
			} else {
				marker = new Sprite(Texture.WHITE)
				marker.tint =
					mode.value.extraType === "trafficlight"
						? 0xffffff
						: mode.value.extraType === "finish"
						? 0x00ff00
						: 0xff0000

				marker.width = 5
				marker.height = 5
				marker.angle = newExtra.angle
				if (pos) {
					marker.position.set(pos.x * textureSize * 0.5, pos.y * textureSize * 0.5)
				}
				marker.eventMode = "static"
				marker.cursor = "pointer"
				marker.on("pointertap", () => {
					editExtra.value = newExtra as Extra
				})
			}

			extrasLayer.addChild(marker)
		}
	}

	function clearAll() {
		for (const [sprite, pos] of slots.entries()) {
			sprite.texture = textures.grass
			sprite.angle = 0
			tiles.value[pos.y][pos.x] = { type: "grass", angle: 0 }
		}
		level.extras = []
		extrasLayer.removeChildren()
		mode.value = { name: "idle" }
	}

	function close() {
		router.push("/dashboard")
	}

	// для сохранения

	async function save() {
		const goalScoreInput = document.getElementById("goal-score") as HTMLInputElement
		if (Number(selectedLessonId.value) == -1) alert("Не выбран урок.")
		const levelToSave: Level = {
			...level,
			field: tiles.value,
			goal: {
				score: parseInt(goalScoreInput.value || "0"),
			},
			extras: level.extras,
			lessonId: Number(selectedLessonId.value),
		}

		try {
			const res = await fetch("http://localhost:8000/practice-lessons", {
				method: "POST",
				headers: { "Content-Type": "application/json" },
				body: JSON.stringify(levelToSave),
			})
			const data = await res.json()
			if (!res.ok && !data.alreadyExists) throw new Error(`Ошибка: ${res.statusText}`)
			else if (data.alreadyExists) {
				showReplaceModal.value = data.existingLessonId
				return
			}
			alert("Уровень успешно сохранён!")
		} catch (err) {
			console.error("Ошибка при сохранении:", err)
			alert("Не удалось сохранить уровень.")
		}
	}

	async function replaceLevel() {
		const goalScoreInput = document.getElementById("goal-score") as HTMLInputElement
		const levelToSave: Level = {
			...level,
			field: tiles.value,
			goal: {
				score: parseInt(goalScoreInput.value || "0"),
			},
			extras: level.extras,
			lessonId: Number(selectedLessonId.value),
		}

		try {
			const res = await fetch(`http://localhost:8000/practice-lessons/${showReplaceModal.value}`, {
				method: "PUT",
				headers: { "Content-Type": "application/json" },
				body: JSON.stringify(levelToSave),
			})
			console.log(res)
			if (!res.ok) throw new Error("Ошибка при замене")
			alert("Уровень успешно обновлён!")
			showReplaceModal.value = null
		} catch (err) {
			console.error("Ошибка при замене:", err)
			alert("Не удалось обновить уровень.")
		}
	}

	async function loadLessons() {
		try {
			const res = await fetch("http://localhost:8000/lessons")
			lessons.value = await res.json()
		} catch (err) {
			console.error("Ошибка загрузки уроков:", err)
		}
	}

	async function createLesson() {
		try {
			const res = await fetch("http://localhost:8000/lessons", {
				method: "POST",
				headers: { "Content-Type": "application/json" },
				body: JSON.stringify({
					title: newLessonTitle.value,
					description: newLessonDescription.value,
				}),
			})
			if (!res.ok) throw new Error("Ошибка при создании урока")
			const lesson = await res.json()
			lessons.value.push(lesson)
			selectedLessonId.value = lesson.id
			showModal.value = false
			newLessonTitle.value = ""
			newLessonDescription.value = ""
		} catch (err) {
			console.error("Ошибка создания урока:", err)
			alert("Не удалось создать урок.")
		}
	}
</script>

<style>
	.horizontalContainer {
		/* width: 100%;
		height: 100%; */
		margin-top: 1rem;
		display: flex;
	}

	.canvas-container {
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

	.modal-overlay {
		position: fixed;
		top: 0;
		left: 0;
		width: 100vw;
		height: 100vh;
		background: rgba(0, 0, 0, 0.5);
		display: flex;
		justify-content: center;
		align-items: center;
		z-index: 999;
	}

	.modal {
		background: #fff;
		padding: 20px;
		border-radius: 12px;
		box-shadow: 0 4px 20px rgba(0, 0, 0, 0.2);
		width: 400px;
		max-width: 90%;
	}

	.modal h3 {
		margin-top: 0;
	}

	.modal label {
		display: block;
		margin-top: 10px;
		font-weight: bold;
	}

	.modal input,
	.modal textarea {
		width: 100%;
		padding: 8px;
		margin-top: 4px;
		border: 1px solid #ccc;
		border-radius: 6px;
	}

	.modal-buttons {
		margin-top: 16px;
		display: flex;
		justify-content: flex-end;
		gap: 10px;
	}

	.modal-buttons button {
		padding: 6px 12px;
		border: none;
		border-radius: 6px;
		cursor: pointer;
		background-color: #4caf50;
		color: white;
		transition: background-color 0.2s ease;
	}

	.modal-buttons button:last-child {
		background-color: #f44336;
	}

	.modal-buttons button:hover {
		opacity: 0.9;
	}

	/* селект */
	select {
		width: 100%;
	}

	/* Эффект при наведении на селект */
	.lesson-select:hover {
		border-color: #4caf50;
		box-shadow: 0 0 5px rgba(76, 175, 80, 0.2);
	}

	/* Эффект активного состояния */
	.lesson-select:focus {
		border-color: #4caf50;
		box-shadow: 0 0 5px rgba(76, 175, 80, 0.5);
		outline: none;
	}

	/* Стили для опций селекта */
	.lesson-select option {
		padding: 8px;
		font-size: 14px;
	}

	/* Стили для кнопки выбора */
	.lesson-select-btn {
		padding: 10px 15px;
		background-color: #4caf50;
		color: #fff;
		font-size: 16px;
		border: none;
		border-radius: 8px;
		cursor: pointer;
		transition: background-color 0.2s ease;
	}

	.lesson-select-btn:hover {
		background-color: #45a049;
	}

	/* Стили для сообщения об ошибке */
	.error-message {
		color: red;
		font-size: 14px;
		margin-top: 5px;
	}

	button.selected {
		filter: brightness(1);
		transform: scale(1.1);
		border: 2px solid #007bff;
		border-radius: 4px;
	}

	button:active {
		transform: scale(0.95);
	}

	.edit-extra-button {
		margin-top: 0.5rem;
	}

	.edit-extra-button button {
		background: #f0f0f0;
		border: 1px solid #ccc;
		padding: 5px 10px;
		cursor: pointer;
	}
</style>

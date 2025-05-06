<template>
	<div class="horizontalContainer">
		<div ref="canvasContainer" class="canvas-container"></div>
		<div class="controls">
			<div class="buttons">
				<button data-action="close">❌</button>
				<button data-action="save">💾</button>
			</div>
			<div class="sections">
				<details>
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
				<details>
					<summary>Modes</summary>
					<div class="modes">
						<div class="mode-buttons">
							<button @click="setModeRoad" class="mode-button road"></button>
							<input id="mode-input" type="number" min="0" step="90" value="0" disabled />
						</div>
						<div>
							<p>Hexes</p>
							<div class="hexes">
								<div id="palette">
									<button data-action="set-mode-stacks-delete" class="delete-hexes">🗑️</button>
								</div>

								<details id="edit-colors-details" data-action="toggle:toggle-edit-color">
									<summary><input type="checkbox" id="edit-colors-checkbox" />🌈 Edit Colors</summary>
									<div class="color-management">
										<p>Add Preset Colors</p>
										<div class="preset-colors"></div>
										<p>Add Custom Colors</p>
										<div class="custom-color">
											<img data-skin-icon="picker" alt="color picker" />
											<input type="color" id="custom-color-input" value="#FFFFFF" />
											<button data-action="add-color-to-palette">➕ Add this color</button>
										</div>
									</div>
								</details>
							</div>
						</div>
					</div>
				</details>
			</div>
		</div>
	</div>
</template>

<script setup lang="ts">
	import { onMounted, ref } from "vue"
	import { Application, Assets, Color, Container, Point, Sprite, Text, Texture } from "pixi.js"
	import type { Level, Tile } from "../utils/types"
	import { createDefaultLevel } from "../utils/level"

	const canvasContainer = ref<HTMLDivElement | null>(null)
	const app = new Application()
	const center = new Point()
	const level: Level = createDefaultLevel()
	const tiles = ref<Tile[][]>([])

	const textureSize = 50
	const textureUrls = {
		grass: import("../assets/images/grass.png"),
		road: import("../assets/images/road.png"),
	}
	const textures: Record<string, Texture> = {}
	const slots = new Map<Sprite, Point>()

	let mode: { name: "idle" } | { name: "grass" } | { name: "road"; type: string; angle: number } = {
		name: "idle",
	}

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

		const texturePromises = Object.entries(textureUrls).map(
			async ([name, importThing]) => (textures[name] = await Assets.load((await importThing).default))
		)

		await Promise.all(texturePromises)
		// center.set(app.canvas.width / 2, app.canvas.height / 2)
		app.canvas.style.touchAction = "auto"

		spawnSlots()
	}

    function setModeRoad() {
        mode = { name: "road", type: "basic", angle: 0 }
        console.log(mode)
    }

	function spawnSlots() {
		// Spawn slots
		for (let y = 0; y <= 21; y += 1) {
			tiles.value.push([])
			for (let x = 0; x <= 21; x += 1) {
                const scale = 0.5
				let slotX = x * textureSize * scale
				let slotY = y * textureSize * scale

				const container = new Container()
				container.position = new Point(center.x + slotX, center.y + slotY)
				const slot = new Sprite(textures.grass)
                slot.scale = scale

				if (level.field[y]?.[x]) {
					tiles.value[y][x] = level.field[y][x]
				}

				container.eventMode = "static"
				container.on("pointertap", () => onSlotClick(slot, x, y))

				container.addChild(slot)
				app.stage.addChild(container)
				slots.set(slot, new Point(x, y))
			}
		}

		// for (const extra of level.extras) {
		// const slot = findSlot(extra.position)
		// if (!slot) continue
		// // Spawn locked
		// if (extra.type == "locked") {
		// 	addLock(slot, slot.parent, extra.goal)
		// }
		// if (extra.type == "wood") {
		// 	addWood(slot, slot.parent, extra.health)
		// }
		// // Spawn stacks
		// else if (extra.type == "stack") {
		// 	addStack(slot, extra.hexes)
		// }
		// }
	}

	function onSlotClick(slot: Sprite, x: number, y: number) {
		// const slotContainer = slot.parent
		// road mode
		if (mode.name == "road") {
			tiles.value[x][y] = { type: mode.type, angle: mode.angle }
            slot.texture = textures.road
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
</style>

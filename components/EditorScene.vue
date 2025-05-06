<template>
	<div ref="canvasContainer" class="canvas-container"></div>
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

	onMounted(() => {
		init()

		// window.addEventListener("keydown", handleKeyDown)
		// window.addEventListener("keyup", handleKeyUp)
		// window.addEventListener("resize", onWindowResize)
		// threeCanvas.value?.addEventListener("click", focusWindow)
	})

	const init = async () => {
		if (!canvasContainer.value) return

		await app.init({ width: 600, height: 600, backgroundColor: "F5F3E5" })
		canvasContainer.value.append(app.canvas)

		spawnSlots()

		// center.set(app.canvas.width / 2, app.canvas.height / 2)
		// app.canvas.style.touchAction = "auto"
	}

	const spawnSlots = () => {
		// Spawn slots
		for (let y = -5; y <= 5; y += 1) {
			tiles.value.push([])
			for (let x = -5; x <= 5; x += 1) {
				let slotX = x
				let slotY = y

				const container = new Container()
				container.position = new Point(center.x + slotX, center.y + slotY)
				const slot = new Sprite(this.textures.slot)
				slot.anchor.set(0.5, 0.5)

				if (level.field[x][y]) {
					tiles.value[x][y] = level.field[x][y]
				}

				container.eventMode = "static"
				container.on("pointertap", () => onSlotClick(slot))

				container.addChild(slot)
				app.stage.addChild(container)
				slots.set(slot, new Point(x, y))
			}
		}

		// for (const extra of this.level.extras) {
		// const slot = this.findSlot(extra.position)
		// if (!slot) continue
		// // Spawn locked
		// if (extra.type == "locked") {
		// 	this.addLock(slot, slot.parent, extra.goal)
		// }
		// if (extra.type == "wood") {
		// 	this.addWood(slot, slot.parent, extra.health)
		// }
		// // Spawn stacks
		// else if (extra.type == "stack") {
		// 	this.addStack(slot, extra.hexes)
		// }
		// }
	}
</script>

<style>
	.canvas-container {
		width: 100%;
		height: 100%;
		overflow: hidden;
	}

	canvas {
		/* height: 100%;
        width: 100%; */
	}
</style>

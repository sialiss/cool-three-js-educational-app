<template>
	<div class="modal-overlay">
		<div class="modal">
			<h3>Редактировать {{ getExtraLabel(extra.type) }}</h3>

			<!-- Только для типа "sign" -->
			<div v-if="extra.type === 'sign'">
				<label>Знак:</label>
				<select v-model="extra.name">
					<option v-for="sign in signs" :key="sign.name" :value="sign.name">
						{{ sign.name }}
					</option>
				</select>

				<template v-if="extra.name.startsWith('Ограничение скорости')">
					<label>Ограничение (км/ч):</label>
					<select v-model.number="speedLimit">
						<option v-for="value in speedOptions" :key="value" :value="value">{{ value }} км/ч</option>
					</select>
				</template>
				<!-- <template v-else>
					<label>Функция (JS-условие):</label> -->
				<!-- <input v-model="extra.function" placeholder="например: car.speed > 30" /> -->
				<!-- </template> -->

				<label>Радиус:</label>
				<input type="number" v-model.number="extra.radius" />
			</div>

			<div v-else-if="extra.type === 'trafficlight'">
				<p>Светофор — нет настраиваемых параметров.</p>
			</div>

			<div v-else-if="extra.type === 'crosswalk'">
				<p>Пешеходный переход — нет настраиваемых параметров.</p>
			</div>

			<div class="modal-buttons">
				<button @click="$emit('close')">Закрыть</button>
			</div>
		</div>
	</div>
</template>

<script setup lang="ts">
	import type { Extra } from "../utils/types"
	import { trafficSigns } from "../utils/signs"

	const signs = trafficSigns

	const props = defineProps<{
		extra: Extra
	}>()
	const { extra } = toRefs(props)

	const speedOptions = [40, 50, 60, 70, 80, 90, 100, 110, 120, 130]
	const speedLimit = ref(60)

	const emit = defineEmits(["close"])

	function getExtraLabel(type: Extra["type"]) {
		switch (type) {
			case "trafficlight":
				return "светофор"
			case "sign":
				return "знак"
			case "crosswalk":
				return "переход"
		}
	}

	watch(speedLimit, value => {
		if (extra.value.type === "sign" && extra.value.name.startsWith("Ограничение скорости")) {
			extra.value.function = `speed<=${value}`
			extra.value.name = `Ограничение скорости ${value}`
		}
	})

	watch(
		() => (extra.value.type === "sign" ? extra.value.name : null),
		name => {
			if (extra.value.type !== "sign") return

			if (name?.startsWith("Ограничение скорости")) {
				const match = name.match(/(\d+)/)
				const limit = match ? parseInt(match[1]) : 60
				speedLimit.value = limit
				extra.value.function = `speed<=${limit}`
			} else {
				extra.value.function = signs.find(sign => sign.name === extra.value.type)?.function || ""
			}
		}
	)
</script>

<style scoped>
	.modal-overlay {
		position: fixed;
		inset: 0;
		background-color: rgba(0, 0, 0, 0.4);
		display: flex;
		justify-content: center;
		align-items: center;
	}
	.modal {
		background: white;
		padding: 20px;
		border-radius: 8px;
		min-width: 300px;
	}
	.modal-buttons {
		margin-top: 16px;
		display: flex;
		justify-content: flex-end;
	}
</style>

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

				<template v-if="extra.name === 'Ограничение скорости'">
					<label>Ограничение (км/ч):</label>
					<select v-model.number="speedLimit">
						<option v-for="value in speedOptions" :key="value" :value="value">{{ value }} км/ч</option>
					</select>
				</template>
				<template v-else>
					<label>Функция (JS-условие):</label>
					<input v-model="extra.function" placeholder="например: car.speed > 30" />
				</template>

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

	const props = defineProps<{
		extra: Extra
	}>()
	const { extra } = toRefs(props)

	const signs = [
		{ name: "Стоп", function: "🛑" },
		{ name: "Уступи дорогу", function: "⚠️" },
		{ name: "Главная дорога", function: "🟡" },
		{ name: "Пешеходный переход", function: "🚸" },
		{ name: "Ограничение скорости", function: "🚫🚗" },
		{ name: "Движение запрещено", function: "🚫" },
		{ name: "Обгон запрещён", function: "↔️🚫" },
		{ name: "Опасный поворот", function: "↩️" },
		{ name: "Дети", function: "🚸👶" },
		{ name: "Дорожные работы", function: "🚧" },
	]
	const speedOptions = [20, 30, 40, 50, 60, 70, 80, 90, 100]
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
		if (extra.value.type === "sign" && extra.value.name === "Ограничение скорости") {
			extra.value.function = `car.speed > ${speedLimit.value}`
		}
	})

	watch(
		() => (extra.value.type === "sign" ? extra.value.name : null),
		name => {
			if (extra.value.type !== "sign") return

			if (name === "Ограничение скорости") {
				speedLimit.value = 60
				extra.value.function = `car.speed > 60`
			} else if (name === "Стоп") {
				extra.value.function = "stop"
			} else {
				extra.value.function = ""
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

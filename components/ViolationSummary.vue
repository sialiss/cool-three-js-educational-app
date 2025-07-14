<template>
	<div class="modal-overlay" @click.self="close">
		<div class="modal">
			<h2 v-if="hasViolations">Нарушения за уровень</h2>
			<h2 v-else>Уровень пройден без нарушений 🎉</h2>

			<ul v-if="hasViolations">
				<li v-for="[message, count] in Object.entries(log)" :key="message">
					<strong>{{ message }}</strong
					>: {{ count }} раз
				</li>
			</ul>

			<div class="button-group">
				<button @click="goToDashboard">К списку уроков</button>
				<button @click="repeatLevel">Повторить</button>
				<button @click="close">Закрыть</button>
			</div>
		</div>
	</div>
</template>

<script setup lang="ts">
	import { useRouter, useRoute } from "vue-router"
	import { onMounted } from "vue"
	import { useAuth } from "@/composables/useAuth"
	const { togglePracticeComplete, getRole } = useAuth()

	const props = defineProps<{
		log: Record<string, number>
		id: number
	}>()

	const emit = defineEmits(["close", "passed"])
	const router = useRouter()

	// Уровень засчитывается пройденным, если нет нарушений
	const hasViolations = Object.keys(props.log).length > 0

	onMounted(() => {
		if (!hasViolations && getRole() != "admin") {
			togglePracticeComplete(props.id)
		}
	})

	function close() {
		emit("close")
	}

	function goToDashboard() {
		router.push("/dashboard")
	}

	function repeatLevel() {
		// Перезапускаем текущий маршрут (перезагрузка компонента без перезагрузки страницы)
		router.go(0)
	}
</script>

<style scoped>
	.button-group {
		display: flex;
		gap: 10px;
		margin-top: 20px;
	}

	.modal-overlay {
		position: fixed;
		top: 0;
		left: 0;
		width: 100%;
		height: 100%;
		background: rgba(0, 0, 0, 0.5);
		display: flex;
		align-items: center;
		justify-content: center;
		z-index: 9999;
	}

	.modal {
		background: white;
		padding: 24px 32px;
		border-radius: 12px;
		max-width: 500px;
		width: 100%;
		box-shadow: 0 10px 30px rgba(0, 0, 0, 0.3);
		font-family: sans-serif;
	}

	h2 {
		margin-top: 0;
	}

	ul {
		padding: 0;
		list-style: none;
		margin: 1em 0;
	}

	li {
		margin-bottom: 0.5em;
	}

	button {
		padding: 8px 16px;
		border: none;
		background: #007bff;
		color: white;
		font-size: 16px;
		border-radius: 6px;
		cursor: pointer;
	}
</style>

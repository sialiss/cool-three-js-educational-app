<template>
	<div class="modal-overlay" @click.self="close">
		<div class="modal">
			<h2>Нарушения за уровень</h2>
			<ul>
				<li v-for="[message, count] in Object.entries(log)" :key="message">
					<strong>{{ message }}</strong
					>: {{ count }} раз
				</li>
			</ul>
			<button @click="close">Закрыть</button>
		</div>
	</div>
</template>

<script setup lang="ts">
	defineProps<{
		log: Record<string, number>
	}>()

	const emit = defineEmits(["close"])

	function close() {
		emit("close")
	}
</script>

<style scoped>
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

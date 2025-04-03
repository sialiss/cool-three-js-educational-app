<template>
	<div class="lesson-page">
		<template v-if="lesson">
			<h1>{{ lesson.title }}</h1>
			<p>{{ lesson.description }}</p>
			<button @click="goBack">Назад</button>
		</template>
		<p v-else>Загрузка урока...</p>
	</div>
</template>

<script setup>
	import { ref, onMounted } from "vue"
	import { useRoute, useRouter } from "vue-router"

	const route = useRoute()
	const router = useRouter()
	const lesson = ref(null)

	onMounted(async () => {
		const res = await fetch("/lessons/theory.json")
		const lessons = await res.json()

		// Получаем id из URL и ищем нужный урок
		lesson.value = lessons.find(l => l.id === Number(route.params.id))
	})

	const goBack = () => {
		router.push("/dashboard")
	}
</script>

<style scoped>
	.lesson-page {
		width: 100%;
        height: 100%;
		margin: auto;
		padding: 20px;
	}
	button {
		padding: 10px;
		background: #007bff;
		color: white;
		border: none;
		cursor: pointer;
		border-radius: 5px;
		cursor: pointer;
	}
	button:hover {
		background: #0056b3;
	}
</style>

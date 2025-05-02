<template>
	<div class="dashboard">
		<div v-if="getRole() == 'user'">
			<h1 class="title">Прогресс обучения</h1>
			<div class="progress-bar">
				<div class="progress" :style="{ width: progress + '%' }"></div>
			</div>
			<p class="progress-text">{{ progress }}% завершено</p>
		</div>

		<h2 class="subtitle">Список уроков</h2>
		<div class="lessons">
			<ul class="lesson-list">
				<li
					v-for="lesson in lessons"
					:key="lesson.id"
					@click="selectLesson(lesson)"
					:class="{ completed: lesson.completed }"
				>
					<span>{{ lesson.title }}</span>
					<span v-if="lesson.completed" class="status">✓</span>
				</li>
			</ul>

			<LessonDescription v-if="selectedLesson" :lesson="selectedLesson" />
		</div>
	</div>
</template>

<script setup>
	import { ref, computed, onMounted, provide } from "vue"
	import LessonDescription from "~/components/LessonDescription.vue"
	import { useAuth } from "@/composables/useAuth"
	const { getRole } = useAuth()

	const lessons = ref([])
	const selectedLesson = ref(null)

	onMounted(async () => {
		const res = await fetch("/lessons/theory.json")
		lessons.value = await res.json()

		// Выбираем первый НЕ пройденный урок
		selectedLesson.value = lessons.value.find(lesson => !lesson.completed) || lessons.value[0]
	})

	provide("lessons", lessons)
	provide("selectedLesson", selectedLesson)

	const progress = computed(() => {
		const completedLessons = lessons.value.filter(lesson => lesson.completed).length
		return Math.round((completedLessons / lessons.value.length) * 100)
	})

	const selectLesson = lesson => {
		selectedLesson.value = lesson
	}
</script>

<style scoped>
	.dashboard {
		width: 100%;
		height: 100%;
		margin: auto;
		padding: 20px;
		border-radius: 10px;
		background: #f8f9fa;
		box-shadow: 0 4px 8px rgba(0, 0, 0, 0.1);
	}
	.title,
	.subtitle {
		text-align: center;
		color: #333;
	}
	.progress-bar {
		height: 10px;
		background: #ddd;
		margin-bottom: 20px;
		border-radius: 5px;
		overflow: hidden;
	}
	.progress-bar div {
		height: 100%;
		background: #4caf50;
		width: 0;
		transition: width 1s;
	}
	.progress-text {
		text-align: center;
		font-size: 14px;
		color: #666;
		margin-bottom: 20px;
	}
	.lessons {
		display: grid;
		grid-template-columns: 1.5fr 1fr;
		gap: 1rem;
	}
	.lesson-list {
		list-style: none;
		padding: 0;
	}
	.lesson-list li {
		padding: 10px;
		cursor: pointer;
		border-bottom: 1px solid #ddd;
		display: flex;
		justify-content: space-between;
		padding: 10px;
		background: #fff;
		border-radius: 5px;
		margin-bottom: 8px;
		box-shadow: 0 2px 4px rgba(0, 0, 0, 0.1);
	}
	.lesson-list li:hover {
		background: #c2e2ca;
	}
	.lesson-list .completed {
		background: #d4edda;
		color: green;
		font-weight: bold;
	}
	.status {
		color: #28a745;
		font-weight: bold;
	}
</style>

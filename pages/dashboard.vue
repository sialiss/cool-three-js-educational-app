<template>
	<div class="dashboard">
		<div v-if="getRole() == 'user'">
			<h2 class="text-center pad-top-m">Прогресс обучения</h2>
			<div class="progress-bar">
				<div class="progress" :style="{ width: progress + '%' }"></div>
			</div>
			<p class="progress-text">{{ progress }}% завершено</p>
		</div>

		<h2 class="text-center pad-top-m">Список уроков</h2>
		<div class="lessons">
			<ul class="item-list lesson-list">
				<li
					v-for="lesson in lessons"
					:key="lesson.id"
					@click="selectLesson(lesson)"
					:class="{ completed: lesson.completed, selected: lesson === selectedLesson }"
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
	const { getRole, getMe } = useAuth()

	const lessons = ref([])
	const selectedLesson = ref(null)

	onMounted(async () => {
		try {
			// 1. Получаем все уроки
			const resLessons = await fetch("http://localhost:8000/lessons/", {
				headers: { "Content-Type": "application/json" },
			})
			if (!resLessons.ok) throw new Error("Не удалось загрузить уроки")
			const allLessons = await resLessons.json()

			// 2. Получаем данные пользователя (включая completedTheoryLessons)
			const resUser = await getMe()
			if (!resUser.ok) throw new Error("Не удалось загрузить пользователя")

			// 3. Отмечаем уроки как завершённые
			const completedIds = new Set(resUser.user.completedTheoryLessons.map(l => l.id))
			allLessons.forEach(lesson => {
				lesson.completed = completedIds.has(lesson.id)
			})

			lessons.value = allLessons

			// 4. Выбираем первый непройденный
			selectedLesson.value = lessons.value.find(lesson => !lesson.completed) || lessons.value[0]
		} catch (err) {
			console.error("Ошибка загрузки данных:", err)
		}
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
    .pad-top-m {
        padding-top: var(--pad-m);
    }
    
	.dashboard {
		width: 100%;
		height: 100%;
		padding: 0 1rem 1rem 1rem;
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
</style>

<template>
	<div class="lesson-detail pad-l">
		<h2>{{ lesson.title }}</h2>
		<p>{{ lesson.description }}</p>
		<div class="button-group">
			<!-- Кнопка "Открыть теорию", только если есть теория -->
			<button v-if="lesson.theory" @click="goToLesson(lesson.theory.id)" class="primary">Открыть теорию</button>

			<!-- Кнопка "Открыть практику", только если есть практика -->
			<button v-if="lesson.practice" @click="goToPractice(lesson.practice.id)" class="secondary">Открыть практику</button>

			<!-- Кнопка "Пройдено" только для пользователей -->
			<button
				v-if="getRole() == 'user'"
				@click="toggleCompletion(lesson.id)"
				:class="lesson.completed ? 'completed completed-active' : 'completed'"
			>
				✔ {{ lesson.completed ? "Пройдено" : "Отметить пройденным" }}
			</button>
		</div>
	</div>
</template>

<script setup>
	import { useRouter } from "vue-router"
	import { defineProps, inject } from "vue"
	import { useAuth } from "@/composables/useAuth"
	const { getRole, toggleComplete } = useAuth()

	const router = useRouter()
	const props = defineProps({ lesson: Object })

	const lessons = inject("lessons")
	const selectedLesson = inject("selectedLesson")

	const goToLesson = id => {
		router.push(`/lesson/${id}`)
	}

	const goToPractice = id => {
		router.push(`/practice/${id}`)
	}

	const toggleCompletion = async id => {
		try {
			const res = toggleComplete(id)

			// 💡 Обновляем локальные данные (моментальное изменение UI)
			const localLesson = lessons.value.find(lesson => lesson.id === id)
			if (localLesson) {
				localLesson.completed = !localLesson.completed
			}

			// 💡 Если поставили отметку, выбираем первый непройденный урок
			if (localLesson.completed) {
				selectedLesson.value = lessons.value.find(l => !l.completed) || selectedLesson.value
			}
		} catch (error) {
			console.error("Ошибка при обновлении статуса урока:", error)
		}
	}
</script>

<style scoped>
	.lesson-detail {
		text-align: center;
	}

	.button-group {
		display: flex;
		justify-content: center;
		gap: 15px;
		margin-top: 20px;
	}

	button {
		padding: 10px 20px;
		border: none;
		border-radius: 8px;
		cursor: pointer;
		font-size: 16px;
		transition: all 0.3s ease;
	}

	/* Основная кнопка */
	button.primary {
		background-color: var(--color-dark-s-blue);
		color: white;
	}

	button.primary:hover {
		background-color: var(--color-dark-m);
	}

	/* Второстепенная кнопка */
	button.secondary {
		background-color: #28a745;
		color: white;
	}

	button.secondary:hover {
		background-color: #1e7e34;
	}

	/* Кнопка "Пройдено" */
	button.completed {
		background-color: #6c757d;
		color: white;
	}

	button.completed:hover {
		background-color: #5a6268;
		transform: scale(1.05);
	}

	/* Если урок пройден, кнопка становится тёмно-зелёной */
	button.completed.completed-active {
		background-color: #1e7e34;
	}

	button.completed.completed-active:hover {
		background-color: #155d27;
		transform: scale(1.05);
	}
</style>

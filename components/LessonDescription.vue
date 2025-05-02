<template>
	<div class="lesson-detail">
		<h2>{{ lesson.title }}</h2>
		<p>{{ lesson.description }}</p>
		<div class="button-group">
			<button @click="goToLesson(lesson.id)" class="primary">Открыть теорию</button>
			<button @click="goToPractice(lesson.id)" class="secondary">Открыть практику</button>
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
	const { getRole } = useAuth()

	const router = useRouter()
	const props = defineProps({ lesson: Object })

	const lessons = inject("lessons")
	const selectedLesson = inject("selectedLesson")

	const goToLesson = id => {
		router.push(`/lesson/${id}`)
	}

	const goToPractice = id => {
		router.push(`/lesson/${id}/practice`)
	}

	const toggleCompletion = async id => {
		try {
			const response = await fetch("/lessons/theory.json")
			let lessonsData = await response.json()

			// Найти нужный урок
			const lessonIndex = lessonsData.findIndex(lesson => lesson.id === id)
			if (lessonIndex !== -1) {
				// Инвертируем состояние (отмечаем/снимаем "Пройдено")
				lessonsData[lessonIndex].completed = !lessonsData[lessonIndex].completed

				// Обновляем JSON на сервере
				await fetch("/lessons/theory.json", {
					method: "PUT",
					headers: { "Content-Type": "application/json" },
					body: JSON.stringify(lessonsData),
				})

				// 💡 Обновляем локальные данные (моментальное изменение UI)
				const localLesson = lessons.value.find(lesson => lesson.id === id)
				if (localLesson) {
					localLesson.completed = !localLesson.completed
				}

				// 💡 Если сняли отметку, выбираем первый непройденный урок
				if (!localLesson.completed) {
					selectedLesson.value = lessons.value.find(l => !l.completed) || selectedLesson.value
				}
			}
		} catch (error) {
			console.error("Ошибка при обновлении урока:", error)
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
		background-color: #007bff;
		color: white;
	}

	button.primary:hover {
		background-color: #0056b3;
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

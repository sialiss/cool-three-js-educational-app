<template>
	<div class="lesson-page">
		<template v-if="lesson">
			<h1>{{ lesson.title }}</h1>
			<div class="lesson-text" v-html="formattedLesson"></div>
			<div class="buttons" :style="gridStyle">
				<button v-if="prevLesson" @click="goBack">Назад</button>
				<button @click="goToPractice(lesson.id)" class="secondary">Открыть практику</button>
				<button @click="goList">К списку</button>
				<button
					:style="{ backgroundColor: lesson.completed ? 'darkgreen' : '' }"
					@click="toggleCompletion(lesson.id)"
				>
					{{ lesson.completed ? "Отметить непройденным" : "Отметить пройденным" }}
				</button>
				<button v-if="nextLesson" @click="goToNextLesson">Дальше</button>
			</div>
		</template>
		<p v-else>Загрузка урока...</p>
	</div>
</template>

<script setup>
	import { ref, onMounted } from "vue"
	import { useRoute, useRouter } from "vue-router"
	import { marked } from "marked"

	const route = useRoute()
	const router = useRouter()
	let lessons = ref(null)
	const lesson = ref(null)

	onMounted(async () => {
		const res = await fetch("/lessons/theory.json")
		lessons = await res.json()

		// Получаем id из URL и ищем нужный урок
		lesson.value = lessons.find(l => l.id === Number(route.params.id))
	})

	const formattedLesson = computed(() => {
		if (lesson.value) {
			return marked(lesson.value.lesson)
		}
		return ""
	})

	const goList = () => {
		router.push("/dashboard")
	}

	const prevLesson = computed(() => {
		// Проверяем, если lessons пуст, возвращаем null
		if (!lessons) {
			return null
		}

		const currentLessonIndex = lessons.findIndex(l => l.id === lesson.value.id)
		return lessons[currentLessonIndex - 1] || null
	})

	const goBack = () => {
		router.push("/dashboard")
	}

	const nextLesson = computed(() => {
		// Проверяем, если lessons пуст, возвращаем null
		if (!lessons) {
			return null
		}

		const currentLessonIndex = lessons.findIndex(l => l.id === lesson.value.id)
		return lessons[currentLessonIndex + 1] || null
	})

	const gridStyle = computed(() => {
		if (nextLesson.value && prevLesson.value) {
			return { "grid-template-columns": "repeat(5, 1fr)" }
		} else if (prevLesson.value) {
			return { "grid-template-columns": "repeat(4, 1fr)" }
		} else if (nextLesson.value) {
			return { "grid-template-columns": "repeat(4, 1fr)" }
		}
	})

    const goToPrevLesson = () => {
		if (prevLesson.value) {
			// Переход на следующий урок
			router.push(`/lesson/${prevLesson.value.id}`)
		}
	}

	// Функция для перехода к следующему уроку
	const goToNextLesson = () => {
		if (nextLesson.value) {
			// Переход на следующий урок
			router.push(`/lesson/${nextLesson.value.id}`)
		}
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

				// Обновляем локальные данные (моментальное изменение UI)
				const localLesson = lesson.value
				if (localLesson) {
					localLesson.completed = !localLesson.completed
				}
			}
		} catch (error) {
			console.error("Ошибка при обновлении урока:", error)
		}
	}
</script>

<style>
	.lesson-page {
		width: 100%;
		height: 100%;
		margin: auto;
		padding: 20px;
	}
	.lesson-text {
		margin: auto;
		display: flex;
		flex-direction: column;
		white-space: pre-line;
		gap: 0rem;
	}
	.buttons {
		display: grid;
		grid-template-columns: repeat(3, 1fr);
		margin: auto 15% auto 15%;
		gap: 3rem;
	}
	button {
		margin-top: 1rem;
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

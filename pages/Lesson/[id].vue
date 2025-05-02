<template>
	<div class="lesson-page">
		<template v-if="lesson && !editing">
			<h1>{{ lesson.title }}</h1>
			<div class="lesson-text" v-html="formattedLesson"></div>
			<div class="buttons">
				<button v-if="prevLesson" @click="goToPrevLesson">Назад</button>
				<button @click="goToPractice(lesson.id)" class="secondary">Открыть практику</button>
				<button @click="goList">К списку</button>
				<button v-if="getRole() == 'user'"
					:style="{ backgroundColor: lesson.completed ? 'darkgreen' : '' }"
					@click="toggleCompletion(lesson.id)"
				>
					{{ lesson.completed ? "Отметить непройденным" : "Отметить пройденным" }}
				</button>
				<button v-if="nextLesson" @click="goToNextLesson">Дальше</button>
			</div>

			<!-- Кнопки редактирования и удаления -->
			<div v-if="getRole() != 'user'" class="admin-actions">
				<button @click="editing = true" class="edit">✏️ Редактировать</button>
				<button @click="deleteLesson" class="delete">🗑 Удалить</button>
			</div>
		</template>

		<!-- Форма редактирования BB-кодами -->
		<template v-if="editing && getRole() != 'user'">
			<h2>Редактировать урок</h2>
			<input v-model="lesson.title" placeholder="Заголовок" class="edit-input" />
			<div v-if="editing">
				<div class="bb-toolbar">
					<button @click="wrapBB('[b]', '[/b]')">Жирный</button>
					<button @click="wrapBB('[i]', '[/i]')">Курсив</button>
					<button @click="wrapBB('[u]', '[/u]')">Подчёркнутый</button>
					<button @click="wrapBB('[url]', '[/url]')">Ссылка</button>
					<button @click="wrapBB('[code]', '[/code]')">Код</button>
					<button @click="wrapBB('[quote]', '[/quote]')">Цитата</button>
					<button @click="wrapBB('[color=#ff0000]', '[/color]')">Цвет</button>
					<button @click="wrapBB('[size=20]', '[/size]')">Размер</button>
					<button @click="wrapBB('[img]', '[/img]')">Изображение</button>
				</div>

				<textarea class="edit-textarea content" v-model="lessonContent" ref="textarea"></textarea>

				<h3>Предпросмотр:</h3>
				<div class="lesson-preview" v-html="renderedContent"></div>
			</div>

			<div class="admin-actions">
				<button @click="saveChanges">💾 Сохранить</button>
				<button @click="cancelEditing">❌ Отмена</button>
			</div>
		</template>

		<p v-else-if="!lesson">Загрузка урока...</p>
	</div>
</template>

<script setup>
	import { ref, onMounted, computed } from "vue"
	import { useRoute, useRouter } from "vue-router"
	import { useAuth } from "@/composables/useAuth"
	import bbcode from "bbcode"

	const { getRole, getToken, toggleComplete } = useAuth()

	const route = useRoute()
	const router = useRouter()
	let lessons = ref(null)
	let lesson = ref(null)

	onMounted(async () => {
		try {
			const res = await fetch(`http://localhost:8000/theory-lessons/`, {
				headers: {
					"Content-Type": "application/json",
				},
			})

			if (!res.ok) throw new Error("Не удалось загрузить уроки")

			lessons = await res.json()
			lesson.value = lessons.find(l => l.id === Number(route.params.id))
			console.log(lesson)
			if (lesson.value?.content) {
				lessonContent.value = lesson.value.content
			}
		} catch (err) {
			console.error("Ошибка загрузки уроков:", err)
		}
	})

	const formattedLesson = computed(() => {
		if (lesson.value) {
			return bbcode.parse(lesson.value.content)
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
            const res = toggleComplete(id)

			// Обновляем локальное состояние
			if (lesson.value) {
				lesson.value.completed = res
			}
		} catch (error) {
			console.error("Ошибка при обновлении статуса урока:", error)
		}
	}

	// АДМИНСКАЯ ЧАСТЬ
	const editing = ref(false)

	const cancelEditing = () => {
		editing.value = false
	}

	const saveChanges = async () => {
		try {
			// Здесь можно сделать PATCH или PUT на сервер
			await fetch(`/lessons/${lesson.value.id}`, {
				method: "PUT",
				headers: { "Content-Type": "application/json" },
				body: JSON.stringify(lesson.value),
			})
			editing.value = false
		} catch (err) {
			console.error("Ошибка при сохранении:", err)
		}
	}

	const deleteLesson = async () => {
		if (confirm("Удалить урок?")) {
			try {
				await fetch(`/lessons/${lesson.value.id}`, {
					method: "DELETE",
				})
				goList()
			} catch (err) {
				console.error("Ошибка при удалении:", err)
			}
		}
	}

	const lessonContent = ref("")

	const renderedContent = computed(() => {
		return bbcode.parse(lessonContent.value)
	})

	const textarea = ref(null)

	const wrapBB = (startTag, endTag) => {
		const el = textarea.value
		const [start, end] = [el.selectionStart, el.selectionEnd]
		const selected = lessonContent.value.substring(start, end)
		const newText =
			lessonContent.value.substring(0, start) + startTag + selected + endTag + lessonContent.value.substring(end)

		lessonContent.value = newText

		// Ставим курсор после вставленного текста
		nextTick(() => {
			el.focus()
			el.selectionStart = el.selectionEnd = start + startTag.length + selected.length + endTag.length
		})
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
		display: flex;
		justify-content: center;
		margin: auto 15% auto 15%;
		gap: 3rem;
	}
	button {
		margin-top: 1rem;
		padding: 12px;
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

	.admin-actions {
		margin-top: 2rem;
		display: flex;
		gap: 1rem;
		justify-content: center;
	}

	.edit,
	.delete {
		background-color: #99ff80;
		color: #000;
	}
	.delete {
		background-color: #dc3545;
		color: #fff;
	}

	.edit-input,
	.edit-textarea {
		width: 100%;
		padding: 10px;
		margin-top: 10px;
		font-family: inherit;
		font-size: 1rem;
		border: 1px solid #ccc;
		border-radius: 5px;
		resize: vertical;
	}
	.edit-textarea.content {
		height: 15rem;
	}
	.bb-toolbar {
		display: flex;
		gap: 0.5rem;
		margin-bottom: 0.5rem;
	}

	.bb-toolbar button {
		padding: 5px 10px;
		border: none;
		background: #3228bd;
		cursor: pointer;
		border-radius: 5px;
	}

	.bb-toolbar button:hover {
		background: #ccc;
	}

	.lesson-preview {
		background: #f5f5f5;
		padding: 1rem;
		border-radius: 5px;
		margin-top: 1rem;
	}

	pre {
		background-color: #f1f1f1;
		padding: 1rem;
		border-radius: 5px;
		overflow-x: auto;
	}

	blockquote {
		border-left: 4px solid #007bff;
		padding-left: 1rem;
		font-style: italic;
		background-color: #f9f9f9;
	}

	img {
		max-width: 100%;
		height: auto;
		border-radius: 5px;
	}
</style>

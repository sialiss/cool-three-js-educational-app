<template>
	<div class="lesson-page">
		<template v-if="lesson && !editing">
			<h1>{{ lesson.lesson.title }}</h1>
			<div class="lesson-text" v-html="formattedLesson"></div>
			<div class="buttons">
				<button v-if="prevLesson" @click="goToPrevLesson">Назад</button>
				<!-- <button @click="goToPractice(lesson.id)" class="secondary">Открыть практику</button> -->
				<button @click="goList">К списку</button>
				<button
					v-if="getRole() == 'user'"
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
			<input v-model="lesson.lesson.title" placeholder="Заголовок" class="edit-input" />
			<textarea v-model="lesson.lesson.description" placeholder="Описание урока" class="edit-textarea description" />
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
	import bbobHTML from "@bbob/html"
	import presetHTML5 from "@bbob/preset-html5"

	const { getRole, toggleComplete } = useAuth()
	const config = useRuntimeConfig()

	const route = useRoute()
	const router = useRouter()
	let lessons = ref(null)
	let lesson = ref(null)

	onMounted(async () => {
		try {
			// Пытаемся загрузить с сервера
			const res = await fetch(`http://localhost:8000/theory-lessons/`, {
				headers: {
					"Content-Type": "application/json",
				},
			})

			if (!res.ok) throw new Error("Не удалось загрузить уроки")

			lessons = await res.json()
		} catch (err) {
			console.warn("Сервер недоступен, загружаем локальные уроки:", err)
			try {
				const localRes = await fetch(`${config.app.baseURL}data/lessons.json`)
				if (!localRes.ok) throw new Error("Локальный файл не найден")

				const allLessons = await localRes.json()

				// Извлекаем только теории
				lessons = allLessons
					.filter(lesson => lesson.theory)
					.map(lesson => ({
						...lesson.theory,
						lesson: { title: lesson.title, description: lesson.description },
					}))
			} catch (localErr) {
				console.error("Ошибка загрузки локальных данных:", localErr)
				return
			}
		}

		// Находим теоретический урок по ID
		lesson.value = lessons.find(l => l.id === Number(route.params.id))
		if (lesson.value?.content) {
			lessonContent.value = lesson.value.content
		}
	})

	const formattedLesson = computed(() => {
		if (lesson.value) {
			const processed = bbobHTML(lesson.value.content, presetHTML5())
			return processed
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
			// Отправляем PUT запрос на сервер для обновления данных урока
			const res = await fetch(`http://localhost:8000/theory-lessons/${lesson.value.id}`, {
				method: "PUT",
				headers: {
					"Content-Type": "application/json",
				},
				body: JSON.stringify({
					title: lesson.value.lesson.title,
					description: lesson.value.lesson.description,
					content: lessonContent.value,
				}),
			})

			if (!res.ok) throw new Error("Не удалось сохранить изменения")

			const updatedLesson = await res.json()
			lesson.value = updatedLesson.lesson // Обновляем локальные данные

			editing.value = false // Выходим из режима редактирования
		} catch (err) {
			console.error("Ошибка при сохранении:", err)
		}
	}

	const deleteLesson = async () => {
		if (confirm("Удалить урок?")) {
			try {
				// Отправляем DELETE запрос на сервер для удаления урока
				const res = await fetch(`http://localhost:8000/theory-lessons/${lesson.value.id}`, {
					method: "DELETE",
				})

				if (res.ok) {
					// После успешного удаления переходим к списку уроков
					goList()
				} else {
					throw new Error("Ошибка при удалении")
				}
			} catch (err) {
				console.error("Ошибка при удалении:", err)
			}
		}
	}

	const lessonContent = ref("")

	const renderedContent = computed(() => {
		const processed = bbobHTML(lessonContent.value, presetHTML5())
		return processed
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

<style scoped>
	.lesson-page {
		margin: 0 auto;
		padding: var(--pad-l) var(--pad-xl);
		display: flex;
		flex-direction: column;
		gap: var(--pad-m);
	}

	.lesson-page h1 {
		text-align: center;
		font-size: 2rem;
		color: var(--text-main, #222);
	}

	.lesson-text {
		display: flex;
		flex-direction: column;
		gap: var(--pad-m);
		line-height: 1.6;
		font-size: 1.1rem;
	}

	.buttons {
		display: flex;
		flex-wrap: wrap;
		justify-content: center;
		gap: var(--pad-m);
	}

	button {
		padding: 12px 20px;
		background-color: var(--color-dark-s-blue);
		color: white;
		border: none;
		border-radius: 8px;
		font-size: 1rem;
		cursor: pointer;
		transition: background-color 0.5s ease;
	}

	button:hover {
		background-color: var(--color-dark-m);
	}

	button.secondary {
		background-color: #e0e0e0;
		color: #333;
	}

	button.secondary:hover {
		background-color: #ccc;
	}

	button[style*="darkgreen"] {
		background-color: darkgreen !important;
	}

	.admin-actions {
		display: flex;
		justify-content: center;
		flex-wrap: wrap;
		gap: var(--pad-m);
		margin-top: 1rem;
	}

	.edit,
	.delete {
		color: #fff;
	}

	.edit {
		background-color: #28a745;
	}

	.delete {
		background-color: #dc3545;
	}

	.edit-input,
	.edit-textarea {
		width: 100%;
		padding: 10px;
		font-family: inherit;
		font-size: 1rem;
		border: 1px solid #ccc;
		border-radius: 5px;
		resize: vertical;
	}

	.edit-textarea.description {
		min-height: 60px;
	}

	.edit-textarea.content {
		height: 15rem;
	}

	.bb-toolbar {
		display: flex;
		flex-wrap: wrap;
		gap: 0.5rem;
		margin-top: 1rem;
		margin-bottom: 0.5rem;
	}

	.bb-toolbar button {
		padding: 6px 12px;
		background-color: var(--color-dark-s);
		color: white;
		border-radius: 5px;
		border: none;
		cursor: pointer;
		transition: background-color 0.2s ease;
	}

	.bb-toolbar button:hover {
		background-color: #777;
	}

	.lesson-preview {
		background-color: #f5f5f5;
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
		border-left: 4px solid var(--color-dark-s);
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

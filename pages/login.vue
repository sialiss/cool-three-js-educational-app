<template>
	<div class="container">
		<div class="form-box">
			<h2 class="title">Вход в аккаунт</h2>

			<form @submit.prevent="handleLogin" class="form">
				<div class="input-group">
					<label for="email">Email</label>
					<input id="email" v-model="email" type="email" required />
				</div>

				<div class="input-group">
					<label for="password">Пароль</label>
					<input id="password" v-model="password" type="password" required />
				</div>

				<button type="submit" :disabled="loading" class="submit-btn">
					<span v-if="!loading">Войти</span>
					<span v-else class="loading">
						<svg class="spinner" viewBox="0 0 24 24">
							<circle class="circle" cx="12" cy="12" r="10"></circle>
							<path class="path" d="M4 12a8 8 0 018-8v4l4-4-4-4v4A8 8 0 004 12z"></path>
						</svg>
						Вход...
					</span>
				</button>

				<div class="links">
					<a href="/forgot-password" class="forgot-password">Забыли пароль?</a>
					<a href="/register" class="create-account">Создать аккаунт</a>
				</div>
			</form>
		</div>
	</div>
</template>

<script setup lang="ts">
	import { ref } from "vue"
	import { useRouter } from "vue-router"
	import { useAuth } from "@/composables/useAuth" // Подключаем useAuth

	const email = ref("")
	const password = ref("")
	const loading = ref(false)
	const router = useRouter()
	const { login } = useAuth() // Берем функцию login из useAuth

	const handleLogin = async () => {
		loading.value = true

		// Имитация запроса на сервер
		setTimeout(() => {
			loading.value = false
			login() // Запоминаем, что пользователь залогинился
			router.push("/dashboard")
		}, 2000)
	}
</script>

<style scoped>
	.container {
		display: flex;
		width: 100%;
		height: 100%;
		justify-content: center;
		align-items: center;
		background-color: #f3f4f6;
	}

	/* Форма */
	.form-box {
		width: 100%;
		max-width: 380px;
		background: #fff;
		padding: 30px;
		border: 1px solid #ddd;
		box-shadow: 0 2px 8px rgba(0, 0, 0, 0.1);
	}

	/* Заголовок */
	.title {
		text-align: center;
		font-size: 1.4rem;
		font-weight: bold;
		color: #333;
		margin-bottom: 20px;
	}

	/* Поля ввода */
	.input-group {
		margin-bottom: 15px;
	}

	.input-group label {
		display: block;
		font-size: 0.9rem;
		color: #555;
		margin-bottom: 5px;
	}

	.input-group input {
		width: 100%;
		padding: 10px;
		border: 1px solid #bbb;
		font-size: 1rem;
		transition: border-color 0.2s;
	}

	.input-group input:focus {
		border-color: #007bff;
		outline: none;
	}

	/* Кнопка входа */
	.submit-btn {
		width: 100%;
		padding: 10px;
		background: #007bff;
		color: white;
		font-size: 1rem;
		border: none;
		cursor: pointer;
		transition: background 0.2s;
	}

	.submit-btn:hover {
		background: #0056b3;
	}

	.submit-btn:disabled {
		background: #a0aec0;
		cursor: not-allowed;
	}

	/* Дополнительные ссылки */
	.links {
		display: flex;
		justify-content: space-between;
		margin-top: 15px;
		font-size: 0.9rem;
	}

	.links a {
		color: #007bff;
		text-decoration: none;
	}

	.links a:hover {
		text-decoration: underline;
	}

	/* Индикатор загрузки */
	.loading {
		display: flex;
		align-items: center;
		justify-content: center;
	}

	.spinner {
		width: 18px;
		height: 18px;
		margin-right: 8px;
		animation: spin 1s linear infinite;
	}

	.circle {
		opacity: 0.25;
		fill: none;
		stroke: white;
		stroke-width: 4;
	}

	.path {
		fill: white;
		opacity: 0.75;
	}

	/* Анимация */
	@keyframes spin {
		100% {
			transform: rotate(360deg);
		}
	}
</style>

<template>
	<div class="login-page">
		<div class="login-card">
			<h2 class="title">Вход в аккаунт</h2>

			<form @submit.prevent="handleLogin" class="form">
				<div class="input-group">
					<label for="login">Логин</label>
					<input id="login" v-model="login_input" type="text" required autocomplete="username" />
				</div>

				<div class="input-group">
					<label for="password">Пароль</label>
					<input id="password" v-model="password" type="password" required />
				</div>

				<button type="submit" :disabled="loading" class="primary-btn">
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
					<a href="/forgot-password">Забыли пароль?</a>
				</div>
			</form>
		</div>

		<!-- Модальное окно -->
		<div v-if="showModal" class="modal-overlay" @click.self="closeModal">
			<div class="modal-content">
				<p>Вы вышли из аккаунта</p>
				<button class="close-btn" @click="closeModal">Закрыть</button>
			</div>
		</div>
	</div>
</template>

<script setup lang="ts">
	import { ref, watch } from "vue"
	import { useRouter, useRoute } from "vue-router"
	import { useAuth } from "@/composables/useAuth"

	const route = useRoute()
	const router = useRouter()
	const { login, logout } = useAuth()

	const login_input = ref("")
	const password = ref("")
	const loading = ref(false)
	const showModal = ref(false)

	const handleLogin = async () => {
		loading.value = true
		try {
			await login(login_input.value, password.value)
			router.push("/dashboard")
		} catch (err) {
			console.error("Ошибка входа: ", err)
		} finally {
			loading.value = false
		}
	}

	// Показать модалку при ?loggedOut=true
	if (route.query.loggedOut === "true") {
		showModal.value = true
	}

	const closeModal = () => {
		showModal.value = false
	}
</script>

<style scoped>
	.login-page {
		display: flex;
		justify-content: center;
		align-items: center;
		height: 85vh;
	}

	.login-card {
		background: white;
		padding: 2rem;
		border-radius: 1rem;
		box-shadow: 0 4px 20px rgba(0, 0, 0, 0.1);
		width: 100%;
		max-width: 400px;
	}

	.title {
		text-align: center;
		font-size: 1.6rem;
		margin-bottom: 1rem;
		color: #1f2937;
	}

	.input-group {
		margin-bottom: 1rem;
		display: flex;
		flex-direction: column;
	}

	.input-group label {
		margin-bottom: 0.5rem;
		color: #374151;
		font-size: 0.95rem;
	}

	.input-group input {
		padding: 10px;
		border: 1px solid #d1d5db;
		border-radius: 0.5rem;
		font-size: 1rem;
	}

	.input-group input:focus {
		border-color: #3b82f6;
		outline: none;
	}

	.primary-btn {
		width: 100%;
		padding: 12px;
		background: #007bff;
		color: white;
		border: none;
		border-radius: 0.5rem;
		font-size: 1rem;
		cursor: pointer;
		transition: background 0.2s ease;
	}

	.primary-btn:hover {
		background: #0056b3;
	}

	.primary-btn:disabled {
		background: #9ca3af;
		cursor: not-allowed;
	}

	.links {
		margin-top: 1rem;
		display: flex;
		justify-content: space-between;
		font-size: 0.9rem;
	}

	.links a {
		color: #3b82f6;
		text-decoration: none;
	}

	.links a:hover {
		text-decoration: underline;
	}

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

	/* Модалка */
	.modal-overlay {
		position: fixed;
		inset: 0;
		background: rgba(0, 0, 0, 0.5);
		display: flex;
		align-items: center;
		justify-content: center;
		z-index: 1000;
	}

	.modal-content {
		background: white;
		padding: 1.5rem 2rem;
		border-radius: 1rem;
		box-shadow: 0 10px 25px rgba(0, 0, 0, 0.2);
		text-align: center;
		min-width: 300px;
		font-size: 1.1rem;
		color: #111;
		position: relative;
	}

	.close-btn {
		margin-top: 1rem;
		padding: 8px 16px;
		background: #007bff;
		color: white;
		border: none;
		border-radius: 0.5rem;
		cursor: pointer;
		transition: background 0.2s ease;
	}

	.close-btn:hover {
		background: #0056b3;
	}

	@keyframes spin {
		100% {
			transform: rotate(360deg);
		}
	}
</style>

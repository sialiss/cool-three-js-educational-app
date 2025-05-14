<script setup>
	import { useAuth } from "@/composables/useAuth" // Файл кастомного хука

	const { isAuthenticated, getRole } = useAuth()
</script>

<template>
	<div class="minimenu">
		<div class="account">
			<NuxtLink v-if="!isAuthenticated" to="/login" exact-active-class="active">Войти</NuxtLink>
			<NuxtLink v-if="isAuthenticated" to="/logout" exact-active-class="active">Выйти</NuxtLink>
		</div>
		<nav class="navbar pad-m">
			<ul>
				<li>
					<NuxtLink to="/" exact-active-class="active">Главная</NuxtLink>
				</li>
				<li v-if="!isAuthenticated"><NuxtLink to="/about" exact-active-class="active">О нас</NuxtLink></li>
				<li v-if="isAuthenticated">
					<NuxtLink to="/dashboard" exact-active-class="active">Панель обучения</NuxtLink>
				</li>
				<li v-if="getRole() == 'admin'">
					<NuxtLink to="/adminpanel" exact-active-class="active">Панель администратора</NuxtLink>
				</li>
				<li v-if="getRole() == 'admin'">
					<NuxtLink to="/editor" exact-active-class="active">Редактор практики</NuxtLink>
				</li>
			</ul>
		</nav>
	</div>
</template>

<style>
	.minimenu {
		top: 0;
		left: 0;
		display: grid;
		width: 100%;
		background-color: var(--color-light-l);
		padding: 1rem 1rem 0 1rem;
	}

	.minimenu .navbar {
		display: flex;
		width: 100%;
		justify-self: center;
		border-top: 2px solid var(--color-dark-l);
		border-bottom: 2px solid var(--color-dark-l);
	}

	.minimenu ul {
		width: 100%;
		list-style: none;
		gap: 1rem;
		margin: 0;
		padding: 0;
		display: flex;
		justify-content: space-evenly;
		align-items: center;
	}

	.minimenu li {
		display: inline;
		text-align: center;
	}

	.minimenu a {
		text-decoration: none;
		color: var(--color-dark-l);
		transition: color 0.3s;
	}

	.minimenu a:hover {
		color: var(--color-primary-dark);
	}

	.minimenu a.active {
		color: var(--color-dark-l);
		font-weight: 600;
	}

	.account {
		text-align: right;
	}
</style>

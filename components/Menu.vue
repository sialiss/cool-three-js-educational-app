<script setup>
	import { useAuth } from "@/composables/useAuth" // Файл кастомного хука

	const { isAuthenticated } = useAuth()
    console.log(isAuthenticated)
</script>

<template>
	<div class="minimenu">
		<div class="account">
			<NuxtLink v-if="!isAuthenticated" to="/login" exact-active-class="active">Войти</NuxtLink>
            <NuxtLink v-if="isAuthenticated" to="/logout" exact-active-class="active">Выйти</NuxtLink>
		</div>
		<nav class="navbar">
			<ul>
				<li>
					<NuxtLink to="/" exact-active-class="active">Главная</NuxtLink>
				</li>
				<li v-if="!isAuthenticated"><NuxtLink to="/about" exact-active-class="active">О нас</NuxtLink></li>
				<li v-if="isAuthenticated">
					<NuxtLink to="/dashboard" exact-active-class="active">Главная панель</NuxtLink>
				</li>
				<!-- <li>
					<NuxtLink to="/cube" exact-active-class="active">Куб</NuxtLink>
				</li> -->
				<li v-if="isAuthenticated">
					<NuxtLink to="/cars" exact-active-class="active">Машинки</NuxtLink>
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
		background-color: #333;
		padding: 1rem;
	}

	.minimenu .navbar {
		display: flex;
		width: 100%;
		justify-self: center;
	}

	.minimenu ul {
		width: 100%;
		list-style: none;
		gap: 1rem;
		margin: 0;
		padding: 0;
		display: grid;
		grid-template-columns: repeat(3, 1fr);
		justify-content: center;
		align-items: center;
	}

	.minimenu li {
		display: inline;
		text-align: center;
	}

	.minimenu a {
		text-decoration: none;
		color: white;
		transition: color 0.3s;
	}

	.minimenu a:hover {
		color: #00ff00;
	}

	.minimenu a.active {
		color: #00ff00;
		font-weight: bold;
	}

	.account {
		text-align: right;
	}
</style>

<template>
	<nav class="navbar">
		<ul>
			<li>
				<NuxtLink to="/" exact-active-class="active">Главная</NuxtLink>
			</li>
			<!-- <li><NuxtLink to="/about" exact-active-class="active">О нас</NuxtLink></li> -->
			<li>
				<NuxtLink to="/cube" exact-active-class="active">Куб</NuxtLink>
			</li>
			<li>
				<NuxtLink to="/cars" exact-active-class="active">Машинки</NuxtLink>
			</li>
		</ul>
	</nav>
</template>

<style>
	.navbar {
		top: 0;
		left: 0;
		width: 100%;
		background-color: #333;
		padding: 1rem;
	}

	.navbar ul {
		list-style: none;
		display: flex;
		gap: 1rem;
		margin: 0;
		padding: 0;
	}

	.navbar li {
		display: inline;
	}

	.navbar a {
		text-decoration: none;
		color: white;
		transition: color 0.3s;
	}

	.navbar a:hover {
		color: #00ff00;
	}

	.navbar a.active {
		color: #00ff00;
		font-weight: bold;
	}
</style>

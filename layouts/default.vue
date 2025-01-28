<template>
	<div class="main">
		<Menu />
		<slot />
	</div>
</template>

<script>
	import "~/assets/css/main.css"
</script>

<style>
	.main {
		display: grid;
		grid-template-rows: auto 1fr;
		height: 100vh;
	}
</style>

<template>
	<div :class="['main', { 'full100vh-height': isFullHeight }]">
		<Menu />
		<slot />
	</div>
</template>

<script setup>
	import "~/assets/css/main.css"
	import { useRoute } from "vue-router"
	import { computed } from "vue"

	const route = useRoute()

	const isFullHeight = computed(() => route.meta?.fullHeight === true)
</script>

<style>
	.main {
		display: grid;
		grid-template-rows: auto 1fr;
		height: auto;
	}

	/* Только для практики и редактора */
	.full100vh-height {
		height: 100vh;
	}
</style>

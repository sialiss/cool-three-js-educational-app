<template>
	<div :class="['main', { 'practice-full-height': isPracticeFullHeight }]">
		<Menu />
		<slot />
	</div>
</template>

<script setup>
	import "~/assets/css/main.css"
	import { useRoute } from "vue-router"
	import { computed } from "vue"

	const route = useRoute()

	const isPracticeFullHeight = computed(() => route.meta?.practiceFullHeight === true)
</script>

<style>
	.main {
		display: grid;
		grid-template-rows: auto 1fr;
		height: auto;
	}

	/* Только для practice-страницы */
	.practice-full-height {
		height: 100vh;
	}
</style>

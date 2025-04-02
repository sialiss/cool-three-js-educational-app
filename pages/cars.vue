<template>
	<div class="cars">
		<CarsScene />
	</div>
</template>

<script>
	import CarsScene from "~/components/CarsScene.vue"

	export default {
		components: {
			CarsScene,
		},
	}
</script>

<style>
	.cars {
		height: 100%;
	}
</style>

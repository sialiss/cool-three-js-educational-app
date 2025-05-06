<template>
	<div class="editor">
		<EditorScene />
	</div>
</template>

<script>
	import EditorScene from "~/components/EditorScene.vue"

	export default {
		components: {
			EditorScene,
		},
	}
</script>

<style>
	.editor {
		height: 100%;
	}
</style>

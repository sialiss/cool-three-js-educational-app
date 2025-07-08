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
    definePageMeta({
		layout: "default",
		fullHeight: true,
	})
</script>

<style scoped>
	.editor {
		height: 100%;
        width: 100%;
	}
</style>

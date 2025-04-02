<script setup lang="ts">
	import { useRouter } from "vue-router"
	import { useAuth } from "@/composables/useAuth"

	const router = useRouter()
	const { logout } = useAuth()

	logout() // Выход из аккаунта
</script>

<template>
	<div>Вы вышли из аккаунта</div>
</template>

<style>

</style>

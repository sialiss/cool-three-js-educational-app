import { useAuth } from "@/composables/useAuth"

export default defineNuxtRouteMiddleware((to: { path: string }, from: { path: string }) => {
	const { token } = useAuth()

	// Если пользователь не авторизован и пытается зайти на защищенную страницу
	if (!token.value && to.path !== "/login") {
		return navigateTo("/login")
	}

	// Если уже залогинен и пытается попасть на логин или регистрацию, отправляем на dashboard
	if (token.value && ["/login", "/register"].includes(to.path)) {
		return navigateTo("/dashboard")
	}
})
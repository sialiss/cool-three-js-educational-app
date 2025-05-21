import { useAuth } from "@/composables/useAuth"

export default defineNuxtRouteMiddleware((to: { path: string }, from: { path: string }) => {
	const { isAuthenticated, getRole } = useAuth()

	// Если пользователь не авторизован и пытается зайти на защищенную страницу
	if (!isAuthenticated.value && !["/login", "/"].includes(to.path)) {
		return navigateTo("/login")
	}

	// Если уже залогинен и пытается попасть на логин или регистрацию, отправляем на dashboard
	if (isAuthenticated.value && ["/login", "/register"].includes(to.path)) {
		return navigateTo("/dashboard")
	}

    if (getRole() !== "admin" && ["/adminpanel", "/editor"].includes(to.path)) {
        if (isAuthenticated.value) return navigateTo("/dashboard")
		else return navigateTo("/login")
	}
})
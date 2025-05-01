import { useAuth } from "@/composables/useAuth"

export default defineNuxtRouteMiddleware((to: { path: string }, from: { path: string }) => {
	const { isAuthenticated, getRole } = useAuth()
    console.log("переадресация")
    console.log(isAuthenticated.value)
    console.log(getRole())

	// Если пользователь не авторизован и пытается зайти на защищенную страницу
	if (!isAuthenticated.value && to.path !== "/login") {
		return navigateTo("/login")
	}

	// Если уже залогинен и пытается попасть на логин или регистрацию, отправляем на dashboard
	if (isAuthenticated.value && ["/login", "/register"].includes(to.path)) {
		return navigateTo("/dashboard")
	}

    if (getRole() !== "admin" && ["/adminpanel"].includes(to.path)) {
        if (isAuthenticated.value) return navigateTo("/dashboard")
		else return navigateTo("/login")
	}
})
import { useState, useCookie } from "#app"

export const useAuth = () => {
	const authCookie = useCookie("auth")
	const isAuthenticated = useState("auth", () => Boolean(authCookie.value))

	const login = () => {
		isAuthenticated.value = true
		authCookie.value = "true"
	}

	const logout = () => {
		isAuthenticated.value = false
		authCookie.value = null
	}

	return { isAuthenticated, login, logout }
}

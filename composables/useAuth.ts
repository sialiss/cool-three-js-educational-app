import { useState } from "#app"
import { onMounted } from "vue"

export const useAuth = () => {
	const isAuthenticated = useState("auth", () => false)

	onMounted(() => {
		if (import.meta.client) {
			isAuthenticated.value = Boolean(localStorage.getItem("auth"))
		}
	})

	const login = () => {
		isAuthenticated.value = true
		if (import.meta.client) {
			localStorage.setItem("auth", "true")
		}
	}

	const logout = () => {
		isAuthenticated.value = false
		if (import.meta.client) {
			localStorage.removeItem("auth")
		}
	}

	return { isAuthenticated, login, logout }
}

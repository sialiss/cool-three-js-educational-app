import { useState, useCookie } from "#app"

export const useAuth = () => {
	const tokenCookie = useCookie("token")
	const isAuthenticated = useState("auth", () => Boolean(tokenCookie.value))
	const roleCookie = useCookie("role")

	const login = async (email: string, password: string) => {
		const res = await fetch("http://localhost:8000/user/login", {
			method: "POST",
			headers: { "Content-Type": "application/json" },
			body: JSON.stringify({ login: email, password }),
		})

		const data = await res.json()
		if (!data.ok) {
			throw new Error(data.text || "Ошибка авторизации")
		} else {
            tokenCookie.value = data.token
			isAuthenticated.value = Boolean(tokenCookie.value)
            roleCookie.value = data.role
            console.log(data)
			// await fetchUserProfile()
		}
	}

	// const fetchUserProfile = async () => {
	// 	if (!tokenCookie.value) return
	// 	const res = await fetch("http://localhost:8000/profile", {
	// 		headers: { Authorization: `Bearer ${tokenCookie.value}` },
	// 	})
	// 	if (res.ok) user.value = await res.json()
	// }

	const logout = () => {
		tokenCookie.value = null
		isAuthenticated.value = Boolean(tokenCookie.value)
		roleCookie.value = undefined
	}

	const getRole = () => {
		return roleCookie.value
	}

	return { isAuthenticated, login, logout, getRole }
}
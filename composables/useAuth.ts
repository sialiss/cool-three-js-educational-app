import { useState, useCookie } from "#app"

export const useAuth = () => {
	const authCookie = useCookie("auth")
	const tokenCookie = useCookie("token")
	const isAuthenticated = useState("auth", () => Boolean(authCookie.value))

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
			isAuthenticated.value = true
			authCookie.value = "true"
			tokenCookie.value = data.text
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
		isAuthenticated.value = false
		authCookie.value = null
		tokenCookie.value = null
	}

	return { isAuthenticated, login, logout }
}

// import { ref } from "vue"

// export function useAuth() {
// 	const token = ref(localStorage.getItem("token") || null)
// 	const user = ref(null)

// 	const login = async (email: string, password: string) => {
// 		const res = await fetch("http://localhost:8000/login", {
// 			method: "POST",
// 			headers: { "Content-Type": "application/json" },
// 			body: JSON.stringify({ username: email, password }),
// 		})

// 		const data = await res.json()
// 		if (!res.ok) throw new Error(data.error || "Ошибка авторизации")

// 		token.value = data.token
// 		localStorage.setItem("token", data.token)
// 		await fetchUserProfile()
// 	}

// 	const fetchUserProfile = async () => {
// 		if (!token.value) return
// 		const res = await fetch("http://localhost:8000/profile", {
// 			headers: { Authorization: `Bearer ${token.value}` },
// 		})
// 		if (res.ok) user.value = await res.json()
// 	}

// 	const logout = () => {
// 		token.value = null
// 		user.value = null
// 		localStorage.removeItem("token")
// 	}

// 	return { token, user, login, logout }
// }

import { ref } from "vue"

export function useAuth() {
	const token = ref(localStorage.getItem("token") || null)
	const user = ref(null)

	const login = async (email: string, password: string) => {
		const res = await fetch("http://localhost:8000/login", {
			method: "POST",
			headers: { "Content-Type": "application/json" },
			body: JSON.stringify({ username: email, password }),
		})

		const data = await res.json()
		if (!res.ok) throw new Error(data.error || "Ошибка авторизации")

		token.value = data.token
		localStorage.setItem("token", data.token)
		await fetchUserProfile()
	}

	const fetchUserProfile = async () => {
		if (!token.value) return
		const res = await fetch("http://localhost:8000/profile", {
			headers: { Authorization: `Bearer ${token.value}` },
		})
		if (res.ok) user.value = await res.json()
	}

	const logout = () => {
		token.value = null
		user.value = null
		localStorage.removeItem("token")
	}

	return { token, user, login, logout }
}

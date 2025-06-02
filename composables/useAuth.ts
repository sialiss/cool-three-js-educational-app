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
		}
	}

	const logout = () => {
		tokenCookie.value = null
		isAuthenticated.value = Boolean(tokenCookie.value)
		roleCookie.value = undefined
	}

	const getToken = () => {
		return tokenCookie.value
	}

	const getRole = () => {
		return roleCookie.value
	}

	const getMe = async () => {
		const token = getToken()
		const res = await fetch("http://localhost:8000/me", {
			method: "GET",
			headers: {
				"Content-Type": "application/json",
				Authorization: `Bearer ${token}`,
			},
		})
        const user = await res.json()
		return user
	}

    const toggleComplete = async (id: Number) => {
        const token = getToken()
		const res = await fetch(`http://localhost:8000/theory-lessons/${id}/complete`, {
			method: "PUT",
			headers: {
				"Content-Type": "application/json",
			},
			body: JSON.stringify({ token }),
		})

		if (!res.ok) {
			throw new Error("Не удалось изменить статус урока")
		}

        const data = await res.json()

        return data.completed
    }

    const togglePracticeComplete = async (id: Number) => {
		const token = getToken()
		const res = await fetch(`http://localhost:8000/practice-lessons/${id}/complete`, {
			method: "PUT",
			headers: {
				"Content-Type": "application/json",
			},
			body: JSON.stringify({ token }),
		})

		if (!res.ok) {
			throw new Error("Не удалось изменить статус урока")
		}

		const data = await res.json()

		return data.completed
	}

	return { isAuthenticated, login, logout, getRole, getToken, getMe, toggleComplete, togglePracticeComplete }
}
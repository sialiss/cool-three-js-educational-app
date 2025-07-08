import { useState, useCookie } from "#app"

export const useAuth = () => {
	const tokenCookie = useCookie("token")
	const isAuthenticated = useState("auth")
	isAuthenticated.value = Boolean(tokenCookie.value)
	const roleCookie = useCookie("role")
	const isServerOff = useState("server-off")
	isServerOff.value = true
	const isOffline = useState("login-off")
	isOffline.value = tokenCookie.value == "faketoken" ? true : false

	const checkServerStatus = async () => {
		try {
			const res = await fetch("http://localhost:8000/ping")
			isServerOff.value = !res.ok
		} catch (e) {
			isServerOff.value = true
		}
	}

	const login = async (email: string, password: string) => {
		let data
		if (!isServerOff.value) {
			const res = await fetch("http://localhost:8000/user/login", {
				method: "POST",
				headers: { "Content-Type": "application/json" },
				body: JSON.stringify({ login: email, password }),
			})
			data = await res.json()
		} else {
			data = { ok: true, token: "faketoken", role: "admin" }
		}

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

	return {
		isAuthenticated,
		isServerOff,
		isOffline,
		checkServerStatus,
		login,
		logout,
		getRole,
		getToken,
		getMe,
		toggleComplete,
		togglePracticeComplete,
	}
}

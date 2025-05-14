<template>
	<div class="dashboard">

		<div class="top-controls">
			<h2>Список пользователей</h2>
			<button class="create-btn" @click="creating = !creating">
				{{ creating ? "Отмена" : "Создать пользователя" }}
			</button>
		</div>

		<div class="users">
			<!-- Форма создания нового пользователя -->
			<div v-if="creating" class="create-user-form">
				<form @submit.prevent="createUser">
					<input v-model="newUser.surname" placeholder="Фамилия" required />
					<input v-model="newUser.name" placeholder="Имя" required />
					<input v-model="newUser.patronymic" placeholder="Отчество" />
					<input v-model="newUser.email" placeholder="Email" required />
					<input v-model="newUser.login" placeholder="Логин" required />
					<input v-model="newUser.password" placeholder="Пароль" type="password" required />
					<input v-model="newUser.phone" placeholder="Телефон" />
					<select v-model="newUser.role" required>
						<option v-for="role in roles" :key="role" :value="role">
							{{ role.charAt(0).toUpperCase() + role.slice(1) }}
						</option>
					</select>
					<button type="submit" class="submit-btn">Сохранить</button>
				</form>
			</div>

			<!-- Список пользователей и детали -->
			<template v-else>
				<ul class="item-list user-list">
					<li
						v-for="user in users"
						:key="user.id"
						@click="selectUser(user)"
						:class="{ admin: user.role === 'admin', selected: user === selectedUser }"
					>
						<span>{{ user.surname }} {{ user.name }} ({{ user.login }})</span>
						<span v-if="user.role === 'admin'" class="status">👑</span>
					</li>
				</ul>

				<UserDetails v-if="selectedUser" :user="selectedUser" @refresh="fetchUsers" />
			</template>
		</div>
	</div>
</template>

<script setup>
	import { ref, onMounted } from "vue"
	import UserDetails from "~/components/UserDetails.vue"

	const users = ref([])
	const selectedUser = ref(null)
	const creating = ref(false)
	const roles = ["user", "admin", "moderator"]

	const newUser = ref({
		surname: "",
		name: "",
		patronymic: "",
		email: "",
		login: "",
		password: "",
		phone: "",
		role: "user",
	})

	const fetchUsers = async () => {
		const res = await fetch("http://localhost:8000/user")
		users.value = await res.json()
		selectedUser.value = null
	}

	onMounted(fetchUsers)

	const selectUser = user => {
		selectedUser.value = user
	}

	const createUser = async () => {
		await fetch("http://localhost:8000/user/create", {
			method: "POST",
			headers: {
				"Content-Type": "application/json",
			},
			body: JSON.stringify({
                surname: newUser.value.surname,
                name: newUser.value.name,
                patronymic: newUser.value.patronymic,
				login: newUser.value.login,
				role: newUser.value.role,
				password: newUser.value.password,
				email: newUser.value.email,
				phone: newUser.value.phone,
			}),
		})
		await fetchUsers()
		creating.value = false
		newUser.value = {
			surname: "",
			name: "",
			patronymic: "",
			email: "",
			login: "",
			password: "",
			phone: "",
			role: "user",
		}
	}
</script>

<style scoped>
	.dashboard {
		width: 100%;
		height: 100%;
		padding: 20px;
	}
	.top-controls {
		display: flex;
		justify-content: space-between;
		align-items: center;
		margin-bottom: 1rem;
	}
	.create-btn {
		background: #28a745;
		color: white;
		padding: 8px 12px;
	}
	.create-btn:hover {
		background: #45a049;
	}
	.create-user-form select {
		padding: 10px;
		border: 1px solid #ccc;
		border-radius: 5px;
	}
	.users {
		display: grid;
		grid-template-columns: 1.5fr 1fr;
		gap: 1rem;
	}
	.create-user-form {
		grid-column: span 2;
		display: flex;
		flex-direction: column;
		gap: 0.75rem;
		background: #ffffff;
		padding: 20px;
		border-radius: 10px;
		box-shadow: 0 2px 6px rgba(0, 0, 0, 0.1);
	}
	.create-user-form input {
		padding: 10px;
		border: 1px solid #ccc;
		border-radius: 5px;
	}
	.submit-btn {
		background: #007bff;
		color: white;
		padding: 10px;
		border: none;
		border-radius: 5px;
		font-weight: bold;
		cursor: pointer;
	}
	.submit-btn:hover {
		background: #0069d9;
	}
</style>

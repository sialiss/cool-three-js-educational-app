<template>
	<div class="dashboard">
		<div class="top-controls">
			<h2>Список пользователей</h2>

			<!-- Фильтры -->
			<div class="filters">
				<select v-model="selectedGroup" @change="fetchUsers" class="filter-select">
					<option value="">Все группы</option>
					<option v-for="group in groups" :key="group.id" :value="group.id">
						{{ group.name }}
					</option>
				</select>

				<select v-model="selectedStatus" @change="fetchUsers" class="filter-select">
					<option value="">Все статусы</option>
					<option value="active">Активные</option>
					<option value="finished">Завершённые</option>
				</select>
			</div>

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

					<!-- Выбор групп -->
					<label>Группы:</label>
					<select v-model="newUser.groupIds" multiple>
						<option v-for="group in groups" :key="group.id" :value="group.id">
							{{ group.name }}
						</option>
					</select>

					<button type="submit" class="submit-btn">Сохранить</button>
				</form>
			</div>

			<!-- Список пользователей -->
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
	import { useAuth } from "@/composables/useAuth"

	const { isOffline } = useAuth()

	const users = ref([])
	const groups = ref([])
	const selectedGroup = ref("")
	const selectedStatus = ref("")
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
		groupIds: [],
	})

	const fetchUsers = async () => {
		const params = new URLSearchParams()
		if (selectedGroup.value) params.append("groupId", selectedGroup.value)
		if (selectedStatus.value) params.append("status", selectedStatus.value)

		try {
			let usersData, groupsData

			if (isOffline.value) {
				const [usersRes, groupsRes] = await Promise.all([fetch("/data/users.json"), fetch("/data/groups.json")])
				usersData = await usersRes.json()
				groupsData = await groupsRes.json()

				const now = new Date()
				const groupId = selectedGroup.value ? Number(selectedGroup.value) : null

				const groupMap = new Map(groupsData.map(g => [g.id, g]))

				users.value = usersData.filter(user => {
					const isInGroup = groupId == null || (user.groups || []).includes(groupId)

					const isActive = user.groups?.some(gid => {
						const group = groupMap.get(gid)
						if (!group || !group.endDate) return false
						return new Date(group.endDate) > now
					})

					const statusMatch =
						!selectedStatus.value ||
						(selectedStatus.value === "active" && isActive) ||
						(selectedStatus.value === "finished" && !isActive)
					return isInGroup && statusMatch
				})
			} else {
				const res = await fetch(`http://localhost:8000/user?${params.toString()}`)
				users.value = await res.json()
			}

			selectedUser.value = null
		} catch (e) {
			console.error("Ошибка загрузки пользователей:", e)
		}
	}

	const fetchGroups = async () => {
		try {
			let res
			if (isOffline.value) {
				res = await fetch("/data/groups.json")
			} else {
				res = await fetch("http://localhost:8000/group")
			}
			groups.value = await res.json()
		} catch (e) {
			console.error("Ошибка загрузки групп:", e)
		}
	}

	onMounted(() => {
		fetchGroups()
		fetchUsers()
	})

	const selectUser = user => {
		selectedUser.value = user
	}

	const createUser = async () => {
		await fetch("http://localhost:8000/user/create", {
			method: "POST",
			headers: {
				"Content-Type": "application/json",
			},
			body: JSON.stringify(newUser.value),
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
			groupIds: [],
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

	.filters {
		display: flex;
		gap: 1rem;
		margin-bottom: 1rem;
	}

	.filter-select {
		padding: 8px 12px;
		border: 1px solid #ccc;
		border-radius: 6px;
		background-color: #f8f9fa;
		color: #333;
		font-size: 14px;
		cursor: pointer;
	}

	.filter-select:hover {
		border-color: #999;
		background-color: #f1f1f1;
	}
</style>

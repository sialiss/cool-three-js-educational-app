<template>
	<div class="details">
		<h3 class="subtitle">Информация о пользователе</h3>

		<div v-if="!isEditing">
			<p><strong>ID:</strong> {{ user.id }}</p>
			<p><strong>ФИО:</strong> {{ userData.surname + " " + userData.name + " " + userData.patronymic }}</p>
			<p>
				<strong>Группы: </strong>
				<span v-if="userData.groups?.length > 0">
					{{ userData.groups.map(g => g.name).join(", ") }}
				</span>
				<span v-else>—</span>
			</p>
			<p><strong>Телефон:</strong> {{ userData.phone }}</p>
			<p><strong>Email:</strong> {{ userData.email }}</p>
			<p><strong>Логин:</strong> {{ userData.login }}</p>
			<p><strong>Роль:</strong> {{ userData.role }}</p>

			<div class="buttons">
				<button @click="enableEdit" class="edit-btn">Изменить</button>
				<button @click="deleteUser" class="delete-btn">Удалить</button>
			</div>
		</div>

		<div v-else>
			<p><strong>Имя:</strong> <input v-model="userData.name" /></p>
			<p><strong>Фамилия:</strong> <input v-model="userData.surname" /></p>
			<p><strong>Отчество:</strong> <input v-model="userData.patronymic" /></p>
			<p><strong>Телефон:</strong> <input v-model="userData.phone" /></p>
			<p><strong>Email:</strong> <input v-model="userData.email" /></p>
			<p><strong>Логин:</strong> <input v-model="userData.login" /></p>
			<p>
				<strong>Пароль:</strong>
				<input v-model="newPassword" type="password" placeholder="(оставьте пустым, если не меняется)" />
			</p>
			<p>
				<strong>Роль:</strong>
				<select v-model="userData.role">
					<option value="user">user</option>
					<option value="admin">admin</option>
					<option value="moderator">moderator</option>
				</select>
			</p>

			<p>
				<strong>Группы:</strong>
				<select v-model="selectedGroupIds" multiple>
					<option v-for="group in groups" :key="group.id" :value="group.id">
						{{ group.name }}
					</option>
				</select>
			</p>

			<div class="buttons">
				<button @click="saveChanges" class="save-btn">Сохранить</button>
				<button @click="cancelEdit" class="cancel-btn">Отмена</button>
			</div>
		</div>
	</div>
</template>

<script setup>
	import { reactive, ref, watch, onMounted } from "vue"

	const props = defineProps({ user: Object })
	const emit = defineEmits(["refresh"])

	const isEditing = ref(false)
	const userData = reactive({ ...props.user, groups: props.user.groups || [] })
	const newPassword = ref("")
	const groups = ref([])
	const selectedGroupIds = ref([])

	watch(
		() => props.user,
		newUser => {
			Object.assign(userData, newUser, { groups: newUser.groups || [] })
			selectedGroupIds.value = newUser.groups?.map(g => g.id) || []
			isEditing.value = false
		}
	)

	onMounted(async () => {
		await fetchGroups()
		if (props.user.groups) {
			selectedGroupIds.value = props.user.groups.map(g => g.id)
		}
	})

	const fetchGroups = async () => {
		const res = await fetch("http://localhost:8000/group")
		const data = await res.json()
		groups.value = data
	}

	const enableEdit = () => {
		isEditing.value = true
	}

	const cancelEdit = () => {
		Object.assign(userData, props.user)
		selectedGroupIds.value = props.user.groups?.map(g => g.id) || []
		newPassword.value = ""
		isEditing.value = false
	}

	const saveChanges = async () => {
		const body = {
			name: userData.name,
			surname: userData.surname,
			patronymic: userData.patronymic,
			login: userData.login,
			email: userData.email,
			phone: userData.phone,
			role: userData.role,
			groupIds: selectedGroupIds.value,
		}

		if (newPassword.value) {
			body.password = newPassword.value
		}

		await fetch(`http://localhost:8000/user/${userData.id}`, {
			method: "PUT",
			headers: { "Content-Type": "application/json" },
			body: JSON.stringify(body),
		})

		isEditing.value = false
		newPassword.value = ""
		emit("refresh")
	}

	const deleteUser = async () => {
		if (confirm("Удалить пользователя?")) {
			await fetch(`http://localhost:8000/user/${userData.id}`, {
				method: "DELETE",
			})
			emit("refresh")
		}
	}
</script>

<style scoped>
	.details {
		background: #fff;
		padding: 20px;
		border-radius: 8px;
		box-shadow: 0 2px 4px rgba(0, 0, 0, 0.1);
	}
	.subtitle {
		text-align: center;
		color: #333;
		margin-bottom: 10px;
	}
	p {
		margin: 6px 0;
		color: #444;
	}
	input,
	select {
		padding: 6px;
		border: 1px solid #ccc;
		border-radius: 4px;
		width: 100%;
	}
	.buttons {
		display: flex;
		justify-content: center;
		gap: 10px;
		margin-top: 15px;
	}
	.edit-btn {
		background-color: #3498db;
		color: #fff;
	}
	.save-btn {
		background-color: #2ecc71;
		color: #fff;
	}
	.cancel-btn {
		background-color: #bdc3c7;
		color: #333;
	}
	.delete-btn {
		background-color: #e74c3c;
		color: #fff;
	}
</style>

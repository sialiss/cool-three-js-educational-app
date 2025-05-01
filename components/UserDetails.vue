<template>
	<div class="details">
		<h3 class="subtitle">Информация о пользователе</h3>

		<div v-if="!isEditing">
			<p><strong>ID:</strong> {{ user.id }}</p>
			<p><strong>Имя:</strong> {{ userData.name }}</p>
			<p><strong>Логин:</strong> {{ userData.login }}</p>
			<p><strong>Роль:</strong> {{ userData.role }}</p>

			<div class="buttons">
				<button @click="enableEdit" class="edit-btn">Изменить</button>
				<button @click="deleteUser" class="delete-btn">Удалить</button>
			</div>
		</div>

		<div v-else>
			<p><strong>Имя:</strong> <input v-model="userData.name" /></p>
			<p><strong>Логин:</strong> <input v-model="userData.login" /></p>
			<p>
				<strong>Роль:</strong>
				<select v-model="userData.role">
					<option value="user">user</option>
					<option value="admin">admin</option>
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
	import { reactive, ref, watch } from "vue"

	const props = defineProps({
		user: Object,
	})

	const emit = defineEmits(["refresh"])

	const isEditing = ref(false)
	const userData = reactive({ ...props.user })

	watch(
		() => props.user,
		newUser => {
			Object.assign(userData, newUser)
			isEditing.value = false
		}
	)

	const enableEdit = () => {
		isEditing.value = true
	}

	const cancelEdit = () => {
		Object.assign(userData, props.user)
		isEditing.value = false
	}

	const saveChanges = async () => {
		await fetch(`http://localhost:8000/user/${userData.id}`, {
			method: "PUT",
			headers: { "Content-Type": "application/json" },
			body: JSON.stringify({
				name: userData.name,
				login: userData.login,
				role: userData.role,
			}),
		})
		isEditing.value = false
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
		gap: 10px;
		margin-top: 15px;
	}
	.edit-btn,
	.save-btn,
	.cancel-btn,
	.delete-btn {
		padding: 6px 12px;
		border: none;
		border-radius: 4px;
		cursor: pointer;
		font-weight: bold;
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

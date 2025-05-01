<template>
	<div class="dashboard">
		<h1 class="title">Панель администратора</h1>

		<h2 class="subtitle">Список пользователей</h2>
		<div class="users">
			<ul class="user-list">
				<li v-for="user in users" :key="user.id" @click="selectUser(user)" :class="{ admin: user.role === 'admin' }">
					<span>{{ user.name }} ({{ user.login }})</span>
					<span v-if="user.role === 'admin'" class="status">👑</span>
				</li>
			</ul>

			<UserDetails v-if="selectedUser" :user="selectedUser" @refresh="fetchUsers" />
		</div>
	</div>
</template>

<script setup>
	import { ref, onMounted } from "vue"
	import UserDetails from "~/components/UserDetails.vue"

	const users = ref([])
	const selectedUser = ref(null)

	onMounted(async () => {
		fetchUsers()
	})

	const fetchUsers = async () => {
		const res = await fetch("http://localhost:8000/user")
		users.value = await res.json()
	}

	const selectUser = user => {
		selectedUser.value = user
	}
</script>

<style scoped>
	.dashboard {
		width: 100%;
		height: 100%;
		margin: auto;
		padding: 20px;
		border-radius: 10px;
		background: #f8f9fa;
		box-shadow: 0 4px 8px rgba(0, 0, 0, 0.1);
	}
	.title,
	.subtitle {
		text-align: center;
		color: #333;
	}
	.users {
		display: grid;
		grid-template-columns: 1.5fr 1fr;
		gap: 1rem;
	}
	.user-list {
		margin: 0;
		list-style: none;
		padding: 0;
	}
	.user-list li {
		padding: 10px;
		cursor: pointer;
		border-bottom: 1px solid #ddd;
		display: flex;
		justify-content: space-between;
		padding: 10px;
		background: #fff;
		border-radius: 5px;
		margin-bottom: 8px;
		box-shadow: 0 2px 4px rgba(0, 0, 0, 0.1);
	}
	.user-list li:hover {
		background: #c2e2ca;
	}
	.user-list .admin {
		background: #d4edda;
		font-weight: bold;
	}
</style>

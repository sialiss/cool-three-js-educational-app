<template>
	<div class="screen pad-l">
		<!-- HERO -->
		<section class="hero-section hero flex align-center just-between wrap fix-width gap-l">
			<div class="stack gap-m text-block">
				<h1 class="text-center">Добро пожаловать в AutoLab</h1>
				<p class="intro">
					Наша платформа — это удобный способ изучить ПДД, подготовиться к экзаменам и отточить навыки в
					симуляторе.
				</p>
				<div class="flex just-center gap-m cta-buttons">
					<button class="btn-primary" @click="startLearning">Начать обучение</button>
					<button class="btn-outline" @click="showModal = true">Узнать больше</button>
				</div>
			</div>
			<div class="image-block">
				<img src="../assets/images/undraw_vintage_q09n.svg" alt="Обучение в автошколе" />
			</div>
		</section>

		<!-- FEATURES -->
		<section class="features pad-l fix-width">
			<h2 class="text-center">Почему выбирают нас?</h2>
			<div class="flex wrap gap-m just-center">
				<div class="feature-card">
					<img src="../assets/images/undraw_right-direction_arvo.svg" alt="Интерактивность" />
					<h3>Интерактивные уроки</h3>
					<p>Увлекательные модули для лучшего понимания ПДД и ситуаций на дороге.</p>
				</div>
				<div class="feature-card">
					<img src="../assets/images/undraw_team-effort_2mrb.svg" alt="Прогресс" />
					<h3>Контроль прогресса</h3>
					<p>Отслеживайте успехи и проходите обучение в удобном темпе.</p>
				</div>
				<div class="feature-card">
					<img src="../assets/images/undraw_hello_ccwj.svg" alt="Поддержка" />
					<h3>Поддержка преподавателей</h3>
					<p>Наши инструкторы помогут вам на каждом этапе обучения.</p>
				</div>
			</div>
		</section>

		<!-- CONTACTS -->
		<section class="contacts pad-l fix-width">
			<h2 class="text-center">Контакты</h2>
			<div class="stack align-center contact-info">
				<p><strong>Email:</strong> support@autoschool-online.ru</p>
				<p><strong>Телефон:</strong> +7 (800) 123-45-67</p>
				<p><strong>Адрес:</strong> г. Санкт-Петербург, ул. Учебная, д. 1</p>
				<p><strong>Время работы:</strong> Пн–Пт с 9:00 до 18:00</p>
			</div>
		</section>

		<!-- MODAL -->
		<div v-if="showModal" class="modal-overlay" @click.self="showModal = false">
			<div class="modal-window stack gap-m">
				<h3>Хотите узнать больше?</h3>
				<p>Позвоните нам по номеру</p>
                <p><strong>+7 (800) 123-45-67</strong></p>
				<p><strong>Время работы:</strong> Пн–Пт с 9:00 до 18:00</p>
				<button class="btn-outline" @click="showModal = false">Закрыть</button>
			</div>
		</div>
	</div>
</template>

<script setup>
	import { ref } from "vue"
	import { useRouter } from "vue-router"
	import { useAuth } from "@/composables/useAuth"

	const { isAuthenticated } = useAuth()

	const router = useRouter()
	const showModal = ref(false)

	function startLearning() {
		router.push(isAuthenticated.value ? "/dashboard" : "/login")
	}
</script>

<style scoped>
	.screen {
		width: 100%;
		height: 100%;
	}
	.hero-section {
		width: 100%;
		min-height: 75vh;
		display: flex;
		align-items: center;
		justify-content: center;
	}

	h1 {
		font-size: 2.5rem;
		color: var(--color-dark-l);
		padding-bottom: var(--pad-m);
		text-align: center;
	}

	.intro {
		font-size: 1.2rem;
		color: var(--color-dark-m);
		max-width: 600px;
		text-align: center;
		margin: 0 auto;
	}

	.hero {
		margin-bottom: var(--pad-xl);
	}

	.image-block {
		flex: 1;
		min-width: 300px;
		display: flex;
		justify-content: center;
	}

	.text-block {
		flex: 1;
		min-width: 300px;
	}

	.feature-card {
		background: var(--color-light-xl);
		border-radius: 12px;
		box-shadow: 0 4px 12px rgba(0, 0, 0, 0.08);
		padding: var(--pad-l);
		text-align: center;
		flex: 1 1 250px;
		max-width: 350px;
	}

	.feature-card img {
		width: 64px;
		height: 64px;
		margin-bottom: var(--pad-m);
	}

	.btn-primary {
		background: var(--color-buttons);
		color: white;
		border: none;
		border-radius: 8px;
		padding: 10px 20px;
		cursor: pointer;
		transition: background 0.3s ease;
	}

	.btn-primary:hover {
		background: var(--color-primary-dark);
	}

	.btn-outline {
		background: transparent;
		color: var(--color-primary-dark);
		border: 2px solid var(--color-primary);
		border-radius: 8px;
		padding: 10px 20px;
		cursor: pointer;
		transition: background 0.3s ease, color 0.3s ease;
	}

	.btn-outline:hover {
		background: var(--color-primary-light);
		color: white;
	}

	.contacts {
		margin-top: var(--pad-xl);
		background: var(--color-light-m);
		border-radius: 16px;
		padding: var(--pad-xl);
		margin-bottom: var(--pad-xl);
	}

	.contact-info {
		text-align: center;
		font-size: 1.1rem;
		color: var(--color-dark-m);
		gap: var(--pad-s);
	}

	.modal-overlay {
		position: fixed;
		top: 0;
		left: 0;
		width: 100%;
		height: 100%;
		background: rgba(0, 0, 0, 0.5);
		display: flex;
		align-items: center;
		justify-content: center;
		z-index: 1000;
	}

	.modal-window {
		background: var(--color-light-xl);
		border-radius: 12px;
		padding: var(--pad-l);
		box-shadow: 0 4px 12px rgba(0, 0, 0, 0.2);
		max-width: 400px;
		text-align: center;
	}

	@media (max-width: 768px) {
		h1 {
			font-size: 2rem;
		}
		.intro {
			font-size: 1rem;
		}
		.hero {
			flex-direction: column;
			align-items: center;
			text-align: center;
		}
		.cta-buttons {
			flex-direction: column;
		}
		.image-block {
			margin-top: var(--pad-m);
		}
	}
</style>

// https://nuxt.com/docs/api/configuration/nuxt-config
export default defineNuxtConfig({
	compatibilityDate: "2024-11-01",
	devtools: { enabled: true },
	vite: {
		assetsInclude: ["**/*.glb"],
	},
	app: {
		baseURL: import.meta.env.VITE_DEPLOY_ENV === "GH_PAGES" ? "/cool-three-js-educational-app/" : "/",
	},
})

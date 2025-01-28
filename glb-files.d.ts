// declare module "*.glb" {
// 	const value: any
// 	export = value
// }

declare module "*.glb" {
	const src: string
	export default src
}
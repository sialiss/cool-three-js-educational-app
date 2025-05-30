import * as THREE from "three"
import { GLTFLoader } from "three/examples/jsm/loaders/GLTFLoader.js"
import { clone } from "three/examples/jsm/utils/SkeletonUtils.js"

const loader = new GLTFLoader()
const modelCache: Record<string, THREE.Object3D> = {}

function loadModelOnce(url: string): Promise<THREE.Object3D> {
	if (modelCache[url]) {
		return Promise.resolve(clone(modelCache[url]))
	}

	return new Promise((resolve, reject) => {
		loader.load(
			url,
			gltf => {
				modelCache[url] = gltf.scene
				resolve(clone(gltf.scene))
			},
			undefined,
			error => {
				reject(error)
			}
		)
	})
}

export async function loadObject(type: string) {
	let modelUrl = ""

	switch (type) {
		case "fence":
			modelUrl = "../models/fence.glb?url"
			break
		case "sign":
			modelUrl = "../models/sign.glb?url"
			break
		case "trafficlight":
			modelUrl = "../models/trafficlight.glb?url"
			break
		default:
			throw new Error(`Unknown object type: ${type}`)
	}

	const model = await loadModelOnce(modelUrl)

	model.traverse(child => {
		if ((child as THREE.Mesh).isMesh) {
			child.castShadow = true
			child.receiveShadow = true
		}
	})

	return model
}

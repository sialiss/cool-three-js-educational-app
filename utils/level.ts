import type { Level } from "./types"

export function createDefaultLevel(): Level {
	return {
		id: 0,
		size: { x: 22, y: 22 },
		field: [[{ type: "grass", angle: 0 }]],
		extras: [],
		goal: { score: 0 },
		title: "",
		author: "",
		description: "",
		lessonId: -1,
	}
}

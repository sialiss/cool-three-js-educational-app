import type { Level } from "./types"

export function createDefaultLevel(): Level {
	return {
        id: 0,
		field: [[{ type: "grass", angle: 0 }]],
		extras: [],
		goal: { score: 0 },
		title: "",
		author: "",
		description: "",
	}
}
import type { Level } from "./types"

export function createDefaultLevel(): Level {
	return {
        id: 0,
		field: [[{ type: "grass", angle: 0 }]],
		extras: [],
		goal: { score: 0 },
		name: "",
		author: "",
		description: "",
	}
}

// export function parseServerLevelMain(level: Level): Level {
// 	const { colors, field, extras, goal } = level.level_data

// 	return {
// 		id: level.id,
// 		colors,
// 		field,
// 		extras,
// 		goal,
// 		author: "meow",
// 		description: "One of the main levels",
// 		statedDifficulty: 1,
// 		list: 3,
// 		name: displayLevelNumber,
// 	}
// }

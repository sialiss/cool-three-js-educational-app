export interface Vector2Like {
	readonly x: number
	readonly y: number
}

export type Level = {
	id: number
	title: string
	description: string
	author: ""
	size: { x: number; y: number }
	field: Tile[][]
	extras: Extra[]
	goal: Goal
	lessonId: number
}

export type CurrentLevel = {
	size: { x: number; y: number }
	field: Tile[][]
	extras: Extra[]
	goal: Goal
}

export type Tile = {
	type: string
	angle: number
	special?: string
}

export type Extra =
	| {
			type: "trafficlight"
			position: Vector2Like
			angle: number
	  }
	| {
			type: "sign"
			name: string
			radius: number
			function: string
			position: Vector2Like
			angle: number
	  }
	| {
			type: "crosswalk"
			position: Vector2Like
			angle: number
	  }
	| {
			type: "fence"
			position: Vector2Like
			angle: number
	  }

export type Goal = {
	score: number
	// wood: number
}

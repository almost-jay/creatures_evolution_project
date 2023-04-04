import { vector2 } from "./globals";
import { ctx, activeArea } from "./initMain";

export class creatureJoint {
	pos: vector2;
	id: number;
	colour: string;
	width: number;
	childJoint: creatureJoint;

	constructor (pos: vector2, id: number, colour: string, width: number) {
		this.pos = pos;
		this.id = id;
		this.colour = colour;
		this.width = width;
	}

	updateJoint(maxDist: number, state: string, isHurt: boolean): boolean {
		let result = false;
		if (this.pos.x > activeArea[0].x && this.pos.x < activeArea[1].x) {
			if (this.pos.y > activeArea[0].y && this.pos.y < activeArea[1].y) {
				result = true;
			}
		}
		return result;
	}
	moveByDrag(maxDist: number) {
		this.pos.y += maxDist * 0.75;
	}
}
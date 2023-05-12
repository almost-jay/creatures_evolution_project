import { vector2 } from "./globals";

export class creatureJoint {
	pos: vector2;
	id: number;
	colour: string;
	width: number;
	childJoint: creatureJoint;
	backChildJoint: Array<creatureJoint> = [];

	constructor (pos: vector2, id: number, colour: string, width: number) {
		this.pos = pos;
		this.id = id;
		this.colour = colour;
		this.width = width;
	}

	updateJoint(state: string, isHurt: boolean, isBackwards: boolean): void {}
	move(maxDist: number, isBackwards: boolean) {};
	moveByDrag(maxDist: number) {
		this.pos.y += maxDist * 0.75;
	}
}
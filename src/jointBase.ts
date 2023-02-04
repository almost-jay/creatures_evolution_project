import { vector2 } from "./globals";
import { ctx } from "./initMain";

export class creatureJoint {
	pos : vector2;
	id : number;
	colour : string;
	width : number;
	childJoint : any;

	constructor (pos : vector2, id : number, colour : string, width : number) {
		this.pos = pos;
		this.id = id;
		this.colour = colour;
		this.width = width;
	}

	updateJoint(maxDist : number) {}
}
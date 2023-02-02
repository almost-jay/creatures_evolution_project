import { idCharas, preColours, vector2, hexToRgb } from "./globals"
import { activeArea, canvas, ctx } from "./initMain";
import { creatureJoint } from "./jointBase";
import { creatureBody } from "./jointBody";
import { creatureHead } from "./jointHead";

export class creature {
	pos : vector2;
	length : number;
	maxDist : number;
	weights : number;
	id : string;
	segments : Array<creatureJoint>;
	head : creatureJoint;

	constructor(pos : vector2, length : number, maxDist : number, weights : number) {
		this.pos = pos;
		this.length = length;
		this.maxDist = maxDist;
		this.weights = weights;
		
		this.segments = [];

		this.initJoints();
	}

	initJoints() {
		this.segments.push(new creatureJoint(this.pos.subtract(new vector2(this.maxDist * this.length,this.maxDist * this.length)),0,"#FF0000",8));
		for (let i = 1; i < this.length - 1; i += 1) {
			let hasLegs = false
			if (i == 4 || i == 10) {
				hasLegs = true
			}
			this.segments.push(new creatureBody(this.pos.subtract(new vector2(this.maxDist * i,this.maxDist * i)),i,"#FF0000",8,this.segments[i - 1],hasLegs));
		}
		this.segments.push(new creatureHead(this.pos,this.length - 1,"#FFFF00",10,this.segments[this.length - 2],4,"#FFFFFF",false));

		this.segments = this.segments.reverse();
	}

	update() {
		for (let i = 0; i < this.length; i += 1) {
			this.segments[i].updateJoint(this.maxDist);
		}
	}


}
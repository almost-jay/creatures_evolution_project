import { vector2 } from "./globals";
import { ctx } from "./initMain";

export class creatureJoint {
	pos : vector2;
	id : number;
	colour : string;
	width : number;
	childJoint : creatureJoint;

	constructor (pos : vector2, id : number, colour : string, width : number) {
		this.pos = pos;
		this.id = id;
		this.colour = colour;
		this.width = width;
	}

	renderSegment() {
		ctx.strokeStyle = this.colour;
		ctx.lineWidth = this.width;
		ctx.beginPath();
		ctx.moveTo(this.pos.x,this.pos.y);
		ctx.lineTo(this.childJoint.pos.x,this.childJoint.pos.y);
		ctx.stroke();
	}

	move(maxDist : number, target : vector2) {
		let delta = new vector2(this.pos.x - this.childJoint.pos.x,this.pos.y - this.childJoint.pos.y);
		let childDist = this.pos.distance(this.childJoint.pos);
		if (childDist > maxDist) {
			delta = delta.divide(childDist);
			delta = delta.multiply(maxDist);

			this.childJoint.pos = this.pos.subtract(delta);
		}
	}
}
import { vector2 } from "./globals";
import { ctx } from "./initMain";
import { creatureJoint } from "./jointBase";
import { creatureLeg } from "./limbLeg";

export class creatureBody extends creatureJoint {
	pos : vector2;
	id : number;
	colour : string;
	width : number;
	childJoint : creatureJoint;
	legs : [creatureLeg,creatureLeg]

	constructor (pos : vector2, id : number, colour : string, width : number, childJoint : creatureJoint, hasLegs : boolean) {
		super(pos, id, colour, width)
		this.childJoint = childJoint;
		if (hasLegs) {
			this.initLegs()
		}
	}

	renderSegment() {
		ctx.strokeStyle = this.colour;
		ctx.lineWidth = this.width;
		ctx.beginPath();
		ctx.moveTo(this.pos.x,this.pos.y);
		ctx.lineTo(this.childJoint.pos.x,this.childJoint.pos.y);
		ctx.stroke();
		ctx.closePath();

		if (this.legs !== undefined) {
			for (let i = 0; i < this.legs.length; i++) {

				this.legs[i].updateLimbPos(this.pos,this.childJoint.pos);

				ctx.strokeStyle = this.legs[i].colour;
				ctx.lineWidth = this.legs[i].width;
				ctx.beginPath();
				ctx.moveTo(this.pos.x,this.pos.y);
				ctx.lineTo(this.legs[i].elbowPos.x,this.legs[i].elbowPos.y);
				ctx.stroke();
				ctx.closePath();
				
				ctx.beginPath();
				ctx.moveTo(this.legs[i].elbowPos.x,this.legs[i].elbowPos.y);
				ctx.lineTo(this.legs[i].footPos.x,this.legs[i].footPos.y);
				ctx.stroke();
				ctx.closePath();
			}
		}
	}

	initLegs() {
		this.legs = [new creatureLeg(this.pos,"#0000FF",-1,6,3,6),new creatureLeg(this.pos,"#00FF00",1,6,3,6)];
	}

	move(maxDist : number) {
		let childDist = this.pos.distance(this.childJoint.pos);
		if (childDist > maxDist) {
			let delta = new vector2(this.pos.x - this.childJoint.pos.x,this.pos.y - this.childJoint.pos.y);
			delta = delta.divide(childDist);
			delta = delta.multiply(maxDist);
			
			this.childJoint.pos = this.pos.subtract(delta);
		}
	}

	updateJoint(maxDist : number): void {
		super.updateJoint(maxDist);
		this.move(maxDist);
		this.renderSegment();
	}
}
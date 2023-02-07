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
	legParentJoint : creatureJoint;

	constructor (pos : vector2, id : number, colour : string, width : number, hasLegs : boolean) {
		super(pos, id, colour, width)
		if (hasLegs) {
			this.initLegs()
		}
	}

	renderSegment() {
		if (this.legs !== undefined) {
			for (let i = 0; i < this.legs.length; i++) {
				this.legs[i].updateLimb(this.pos,this.childJoint.pos);
				if (this.legs[i].isFootUp) {
					this.skewBodyByFoot(this.legs[i].elbowPos);
				}
			}
		}

		ctx.strokeStyle = this.colour;
		ctx.lineWidth = this.width;
		ctx.beginPath();
		ctx.moveTo(this.pos.x,this.pos.y);
		ctx.lineTo(this.childJoint.pos.x,this.childJoint.pos.y);
		ctx.stroke();
		ctx.closePath();
	}

	initLegs() {
		let legAngle = 0.8;
		let legWidth = 7.2;
		let legLength = 14;
		this.legs = [new creatureLeg(this.pos,this.colour,-1,legLength,legWidth,legAngle),new creatureLeg(this.pos,this.colour,1,legLength,legWidth,legAngle)];
		this.legs[0].pair = this.legs[1]; //this.legs[0] is right
		this.legs[1].pair = this.legs[0];
	}

	move(maxDist : number) {
		let childDist = this.pos.distance(this.childJoint.pos);
		if (childDist > maxDist) {
			let delta = this.pos.subtract(this.childJoint.pos);
			delta = delta.divide(childDist);
			delta = delta.multiply(maxDist);
			
			this.childJoint.pos = this.pos.subtract(delta);
		}
	}

	updateJoint(maxDist : number): void {
		this.move(maxDist);
		this.renderSegment();
		super.updateJoint(maxDist);
	}

	skewBodyByFoot(elbowPos : vector2) : void {
		let elbowDist = this.pos.distance(elbowPos);
		
		if (elbowDist > this.width) {
			let delta = this.pos.subtract(elbowPos);
			delta = delta.multiply(0.1);

			this.pos = this.pos.add(delta);


			let childDelta = this.pos.subtract(this.childJoint.pos);
			childDelta = childDelta.multiply(0.1);

			this.childJoint.pos = this.childJoint.pos.add(childDelta);
		}
	}
}
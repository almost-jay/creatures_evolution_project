import { vector2 } from "./globals";
import { activeArea, ctx, isPaused } from "./initMain";
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
		super(pos, id, colour, width);
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
	}

	updateLegs(state: string) {
		if (this.legs !== undefined) {
			for (let i = 0; i < this.legs.length; i++) {
				this.legs[i].updateLimb(this.pos,this.childJoint.pos,state);
				this.legs[i].renderLimb();
				if (this.legs[i].isFootUp) {
					this.skewBodyByFoot(this.legs[i].elbowPos);
				}
			}
		}
	}

	initLegs() {
		let legAngle = 0.8;
		let legWidth = 7.2;
		let legLength = 14;
		this.legs = [new creatureLeg(this.pos,this.colour,-1,legLength,legWidth,legAngle),new creatureLeg(this.pos,this.colour,1,legLength,legWidth,legAngle)];
		this.legs[0].pair = this.legs[1]; //this.legs[0] is the right leg
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

	updateJoint(maxDist : number, state: string): void {
		if (!isPaused) {
			this.move(maxDist);
		}
		if (this.pos.x > activeArea[0].x && this.pos.x < activeArea[1].x) {
			if (this.pos.y > activeArea[0].y && this.pos.y < activeArea[1].y) {
				this.updateLegs(state);
				this.renderSegment();
			}
		}
		super.updateJoint(maxDist, state);
	}

	skewBodyByFoot(elbowPos : vector2) : void {
		let elbowDist = this.pos.distance(elbowPos);
		
		if (elbowDist > this.width) {
			let delta = this.pos.subtract(elbowPos);
			delta = delta.divide(this.width);
			delta = delta.multiply(0.4);
			this.pos = this.pos.subtract(delta);
		}
	}

	moveByDrag(maxDist: number): void {
		super.moveByDrag(maxDist);
		if (this.legs !== undefined) {
			for (let i = 0; i < this.legs.length; i++) {
				this.legs[i].isFootUp = true;
			}
		}
	}
}
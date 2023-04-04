import { vector2 } from "./globals";
import { activeArea, ctx, isPaused } from "./initMain";
import { creatureJoint } from "./jointBase";
import { creatureLeg } from "./limbLeg";

export class creatureBody extends creatureJoint {
	pos: vector2;
	id: number;
	colour: string;
	width: number;
	childJoint: creatureJoint;
	legs: Array<creatureLeg> = [];
	legParentJoint: creatureJoint;

	constructor (pos: vector2, id: number, colour: string, width: number, hasLegs: boolean) {
		super(pos, id, colour, width);
		if (hasLegs) {
			this.initLegs()
		}
	}

	renderSegment(isHurt: boolean) {
		if (!isHurt) {
			ctx.strokeStyle = this.colour;
		} else {
			ctx.strokeStyle = "#FF4545";
		}
		ctx.lineWidth = this.width;
		ctx.beginPath();
		ctx.moveTo(this.pos.x,this.pos.y);
		ctx.lineTo(this.childJoint.pos.x,this.childJoint.pos.y);
		ctx.stroke();
		ctx.closePath();
	}

	updateLegs(state: string, isHurt: boolean) {
		if (this.legs !== undefined) {
			for (let i = 0; i < this.legs.length; i++) {
				this.legs[i].updateLimb(this.pos,this.childJoint.pos, state);
				this.legs[i].renderLimb(isHurt);
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

	move(maxDist: number) {
		let childDist = this.pos.distance(this.childJoint.pos);
		if (childDist > maxDist) {
			if (childDist > maxDist * 4) {
				let angle = this.pos.getAvgAngleRad(this.childJoint.pos);
				let delta = new vector2(maxDist * 0.5 * Math.cos(angle), maxDist * 0.5 * Math.sin(angle));
				this.childJoint.pos = this.pos.subtract(delta);
			} else {
				let delta = this.pos.subtract(this.childJoint.pos);
				delta = delta.divide(childDist);
				delta = delta.multiply(maxDist);
				
				this.childJoint.pos = this.pos.subtract(delta);
			}
		
		}
	}

	updateJoint(maxDist: number, state: string, isHurt: boolean): boolean {
		let isVisible = false;
		if (!isPaused) {
			this.move(maxDist);
		}
		
		if (super.updateJoint(maxDist, state, isHurt)) {
			this.updateLegs(state,isHurt);
			this.renderSegment(isHurt);
			isVisible = true;
		}
		return isVisible;
	}

	skewBodyByFoot(elbowPos: vector2): void {
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
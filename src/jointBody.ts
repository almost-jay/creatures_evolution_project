import { vector2 } from "./globals";
import { ctx } from "./initMain";
import { creatureJoint } from "./jointBase";
import { creatureLeg } from "./limbLeg";

export class creatureBody extends creatureJoint {
	pos: vector2;
	id: number;
	colour: string;
	width: number;
	childJoint: creatureJoint;
	backChildJoint: Array<creatureJoint> = [];
	legs: Array<creatureLeg> = [];
	legParentJoint: creatureJoint;

	constructor (pos: vector2, id: number, colour: string, width: number, hasLegs: boolean, legLength: number, legWidth: number) {
		super(pos, id, colour, width);
		if (hasLegs) {
			this.initLegs(legLength,legWidth);
		}
	}

	renderSegment(isHurt: boolean) {
		if (!isHurt) {
			ctx.strokeStyle = this.colour;
		} else {
			ctx.strokeStyle = "#FF4545";
		}
		ctx.lineWidth = this.displayedWidth;
		ctx.beginPath();
		ctx.moveTo(this.pos.x,this.pos.y);
		ctx.lineTo(this.childJoint.pos.x,this.childJoint.pos.y);
		ctx.stroke();
		ctx.closePath();
	}

	updateLegs(state: string, isHurt: boolean,isBackwards: boolean) {
		if (this.legs !== undefined) {
			for (let i = 0; i < this.legs.length; i++) {
				this.legs[i].size = (this.displayedWidth / this.width);
				this.legs[i].updateLimb(this.pos,this.childJoint.pos, state,isBackwards);
				this.legs[i].renderLimb(isHurt);
				if (this.legs[i].isFootUp) {
					this.skewBodyByFoot(this.legs[i].elbowPos);
				}
			}
		}
	}

	initLegs(legLength: number, legWidth: number) {
		let legAngle = 0.8;
		this.legs = [new creatureLeg(0,this.pos,this.colour,-1,legLength,legWidth,legAngle),new creatureLeg(1,this.pos,this.colour,1,legLength,legWidth,legAngle)];
		this.legs[0].pair = this.legs[1]; //this.legs[0] is the right leg
		this.legs[1].pair = this.legs[0];
	}

	move(maxDist: number, isBackwards: boolean) {
		let childDist = this.pos.distance(this.childJoint.pos);
		if (isBackwards) {
			for (let i = 0; i < this.backChildJoint.length; i++) {
				let movedJoint = this.backChildJoint[i];
				let childDist = this.pos.distance(movedJoint.pos);
				if (childDist > maxDist) {
					if (childDist > maxDist * 4) {
						let angle = this.pos.getAvgAngleRad(movedJoint.pos);
						let delta = new vector2(maxDist * 0.5 * Math.cos(angle), maxDist * 0.5 * Math.sin(angle));
						movedJoint.pos = this.pos.subtract(delta);
					} else if (childDist < maxDist) {
						let angle = this.pos.getAvgAngleRad(movedJoint.pos) + Math.PI;
						let delta = new vector2(maxDist * 0.5 * Math.cos(angle), maxDist * 0.5 * Math.sin(angle));
						movedJoint.pos = this.pos.subtract(delta);
					} else {
						let delta = this.pos.subtract(movedJoint.pos);
						delta = delta.divide(childDist);
						delta = delta.multiply(maxDist);


						if (childDist == 0) {
							console.log("Childdist too close!!");
						}
						
						movedJoint.pos = this.pos.subtract(delta);
					}
				}
			}
		} else if (childDist > maxDist * 4) {
			let angle = this.pos.getAvgAngleRad(this.childJoint.pos);
			let delta = new vector2(maxDist * 0.5 * Math.cos(angle), maxDist * 0.5 * Math.sin(angle));
			this.childJoint.pos = this.pos.subtract(delta);
		} else {
			let delta = this.pos.subtract(this.childJoint.pos);
			delta = delta.divide(childDist);
			delta = delta.multiply(maxDist);

			if (childDist == 0) {
				console.log("Too close !!");
			}
			
			this.childJoint.pos = this.pos.subtract(delta);
		}
	}


	updateJoint(state: string, isHurt: boolean, isBackwards: boolean): void {
		this.renderSegment(isHurt);
		this.updateLegs(state,isHurt,isBackwards);
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
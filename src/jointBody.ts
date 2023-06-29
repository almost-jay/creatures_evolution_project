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
			this.initLegs(legLength,legWidth); //creates legs
		}
	}

	renderSegment(isHurt: boolean): void { //draws a line from this segment to the child segment; when chained together it creates the liz
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

	updateLegs(state: string, isHurt: boolean,isBackwards: boolean): void { //calculates limb pos, renders limb
		if (this.legs !== undefined) {
			for (let i = 0; i < this.legs.length; i++) {
				this.legs[i].size = (this.displayedWidth / this.width);
				this.legs[i].updateLimb(this.pos,this.childJoint.pos, state,isBackwards);
				this.legs[i].renderLimb(isHurt);
				if (this.legs[i].isFootUp && !isBackwards) {
					this.skewBodyByFoot(this.legs[i].elbowPos);
				}
			}
		}
	}

	initLegs(legLength: number, legWidth: number): void { //creates legs
		let legAngle = 0.8;
		this.legs = [new creatureLeg(0,this.pos,this.colour,-1,legLength,legWidth,legAngle),new creatureLeg(1,this.pos,this.colour,1,legLength,legWidth,legAngle)];
		this.legs[0].pair = this.legs[1]; //this.legs[0] is the right leg
		this.legs[1].pair = this.legs[0];
	}

	move(maxDist: number, isBackwards: boolean): void {
		let childDist = this.pos.distance(this.childJoint.pos);
		if (isBackwards) {
			for (let i = 0; i < this.backChildJoint.length; i++) {
				let movedJoint = this.backChildJoint[i];
				let childDist = this.pos.distance(movedJoint.pos);
				if (childDist > maxDist) { //moves the child joint if it's too far away
					if (childDist > maxDist * 4) {
						let angle = this.pos.getAvgAngleRad(movedJoint.pos);
						let delta = new vector2(maxDist * 0.5 * Math.cos(angle), maxDist * 0.5 * Math.sin(angle));
						movedJoint.pos = this.pos.subtract(delta);
					} else {
						let delta = this.pos.subtract(movedJoint.pos);
						delta = delta.divide(childDist);
						delta = delta.multiply(maxDist);
						
						movedJoint.pos = this.pos.subtract(delta);
					}
				}
			}
		} else if (childDist > maxDist * 4) { //snaps the child joint to the parent if it's too far away
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


	updateJoint(state: string, isHurt: boolean, isBackwards: boolean): void { //a parent function to trigger the rest of the rendering
		this.renderSegment(isHurt);
		this.updateLegs(state,isHurt,isBackwards);
	}

	skewBodyByFoot(elbowPos: vector2): void { //pulls the body towards the currently moving foot to create a more realistic movement
		let elbowDist = this.pos.distance(elbowPos);
		
		if (elbowDist > this.width) {
			let delta = this.pos.subtract(elbowPos);
			delta = delta.divide(this.width);
			this.pos = this.pos.subtract(delta);
			this.childJoint.pos = this.childJoint.pos.subtract(delta.divide(2));
		}
	}

	moveByDrag(maxDist: number): void { //called every time the creature is dragged
		super.moveByDrag(maxDist);
		if (this.legs !== undefined) {
			for (let i = 0; i < this.legs.length; i++) {
				this.legs[i].isFootUp = true;
			}
		}
	}
}
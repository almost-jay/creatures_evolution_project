import { vector2 } from "./globals";
import { ctx, isPaused } from "./initMain";

export class creatureLeg {
	legLength: number; //how long each part of the leg is
	width: number; //width of the leg
	id: number;
	size: number;
	legAngle: number; //how far forward and back the leg goes
	joinPos: vector2;
	elbowPos: vector2;
	footPos: vector2;
	lightColour: string;
	darkColour: string;
	side: number;
	jointAngle: number;
	isFootUp: boolean;
	pair: creatureLeg;

	constructor(id: number, joinPos: vector2, colour: string, side: number, legLength: number, width: number, legAngle: number) {
		this.id = id;
		this.legLength = legLength;
		this.width = width;
		this.legAngle = legAngle;
		this.joinPos = joinPos;
		this.lightColour = colour;
		this.darkColour = this.calcDarkColour();
		this.side = side;

		this.elbowPos = new vector2(0,0);
		this.footPos = new vector2(0,0);

		this.isFootUp = false;
	}

	calcDarkColour() {
		let colourArray = this.lightColour.substring(4,this.lightColour.length - 1).replace(/ /g, "").split(",");
		let result = "rgb("+parseInt(colourArray[0]) * 0.8+","+parseInt(colourArray[1]) * 0.8+","+parseInt(colourArray[2]) * 0.8+")";
		return result;
	}

	updateLimb(joinPos: vector2, childJointPos: vector2, state: string,isBackwards: boolean) {
		if (state != "dead" && !isPaused) {
			this.updateLimbPos(joinPos,childJointPos,state,isBackwards);
		}
	}

	renderLimb(isHurt: boolean) {
		if (isHurt) {
			ctx.fillStyle = "#FF4545";
		}

		ctx.lineWidth = this.width * this.size;

		if (!isHurt) {
			ctx.fillStyle = this.darkColour;
		}
		ctx.beginPath();
		ctx.arc(this.footPos.x,this.footPos.y,this.width * 0.64 * this.size,0, 2 * Math.PI);
		ctx.fill();

		if (!isHurt) {
			ctx.strokeStyle = this.darkColour;
		}
		ctx.beginPath();
		ctx.moveTo(this.elbowPos.x,this.elbowPos.y);
		ctx.lineTo(this.footPos.x,this.footPos.y);
		ctx.stroke();
		ctx.closePath();

		if (!isHurt) {
			ctx.fillStyle = this.lightColour;
		}
		ctx.beginPath();
		ctx.arc(this.elbowPos.x,this.elbowPos.y,this.width * 0.64 * this.size,0, 2 * Math.PI);
		ctx.fill();

		if (!isHurt) {
			ctx.strokeStyle = this.lightColour;
		}
		ctx.beginPath();
		ctx.moveTo(this.joinPos.x,this.joinPos.y);
		ctx.lineTo(this.elbowPos.x,this.elbowPos.y);
		ctx.stroke();
		ctx.closePath();
	}

	updateLimbPos(joinPos: vector2, childJointPos: vector2, state: string, isBackwards: boolean) {
		this.joinPos = joinPos;
		this.jointAngle = this.joinPos.getAvgAngleRad(childJointPos);
		
		if (state == "mouseDragging") {
			this.footPos = this.calcFootDragPos();
		} else {
			this.updateFootPos();
		}
		this.elbowPos = this.calcElbowPos(isBackwards);
	}

	updateFootPos(): void { //calls all other functions
		let footCheckPos = this.calcFootCheckPos()

		let footDist = this.footPos.distance(footCheckPos);
		if (footDist > this.legLength * 2.4 * this.size || this.elbowPos.distance(this.joinPos) < 0.6) {
			if (this.pair.isFootUp == false || footDist > this.legLength * 4 * this.size) {
				if (footDist > this.legLength * 4 * this.size) {
					this.footPos = new vector2(footCheckPos.x,footCheckPos.y);
				} else {
					this.isFootUp = true;
				}
			}
		}

		if (this.isFootUp) {
			this.moveFootForward(footCheckPos,footDist);
			if (footDist < this.legLength * 0.6 * this.size) {
				this.isFootUp = false;	
				this.footPos = footCheckPos;
			}
		}
	}

	calcFootCheckPos(): vector2 {
		let limbSpacing = this.legLength * 2 * this.size;
		let footStepPos = new vector2(limbSpacing * -1 * Math.cos(this.jointAngle - (Math.PI * this.side)) + this.joinPos.x,limbSpacing * -1 * Math.sin(this.jointAngle - (Math.PI * this.side)) + this.joinPos.y);
		return new vector2(limbSpacing * Math.cos(this.jointAngle - (Math.PI * this.legAngle * this.side)) + footStepPos.x,limbSpacing * Math.sin(this.jointAngle - (Math.PI * this.legAngle * this.side)) + footStepPos.y);
	}
	
	calcElbowPos(isBackwards: boolean): vector2 { //INVERSE KINEMATICS SOLVER
		let side = this.side;
		if (isBackwards) {
			side = this.side * -1;
		}
		let chi = this.footPos.x - this.joinPos.x;
		let psi = this.footPos.y - this.joinPos.y;
		let d = (chi ** 2) + (psi ** 2);
		let a = Math.max(-1,Math.min(1,d / (2 * this.legLength * this.size * Math.sqrt(d))));
		let theta = Math.atan2(psi,chi) - (Math.acos(a) * side);
		
		let result = new vector2(this.joinPos.x + (this.legLength * this.size * Math.cos(theta)),this.joinPos.y + (this.legLength * this.size * Math.sin(theta)));
		return result;
	}

	moveFootForward(footCheckPos: vector2, footDist: number) {
		let delta = this.footPos.subtract(footCheckPos);
		delta = delta.divide(footDist);
		delta = delta.multiply(this.legLength * 0.6 * this.size);
		
		this.footPos = this.footPos.subtract(delta);
	}

	
	calcFootDragPos(): vector2 { //finds the foot pos while the creature is being dragged around, making them feel kinda weighted, as the legs are always pulled down
		let limbSpacing = this.legLength * 1.4 * this.size;
		let dragAngle = 1.1;
		let footStepPos = new vector2(limbSpacing * Math.cos(this.jointAngle - (Math.PI * this.side)) + this.joinPos.x,limbSpacing * Math.sin(this.jointAngle - (Math.PI * this.side)) + this.joinPos.y);
		return new vector2(limbSpacing * Math.cos(this.jointAngle - (Math.PI * dragAngle * this.side)) + footStepPos.x,limbSpacing * Math.sin(this.jointAngle - (Math.PI * dragAngle * this.side)) + footStepPos.y);
	}

	
	calcFootDeathPos(): vector2 { //makes the legs go --->->->--- when they die
		let limbSpacing = this.legLength * 1.4 * this.size;
		let dragAngle = 0.8;
		let footStepPos = new vector2(limbSpacing * Math.cos(this.jointAngle - (Math.PI * this.side)) + this.joinPos.x,limbSpacing * Math.sin(this.jointAngle - (Math.PI * this.side)) + this.joinPos.y);
		return new vector2(limbSpacing * Math.cos(this.jointAngle - (Math.PI * dragAngle * this.side)) + footStepPos.x,limbSpacing * Math.sin(this.jointAngle - (Math.PI * dragAngle * this.side)) + footStepPos.y);
	}
}
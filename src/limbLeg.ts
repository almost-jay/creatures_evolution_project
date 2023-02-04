import { vector2 } from "./globals";
import { ctx } from "./initMain";

export class creatureLeg {
	length : number; //how long each part of the leg is
	width : number; //width of the leg
	legAngle : number; //how far forward and back the leg goes
	joinPos : vector2;
	elbowPos : vector2;
	footPos : vector2;
	lightColour : string;
	darkColour : string;
	side : number;
	jointAngle : number;
	isFootUp : boolean;
	pair : creatureLeg;

	constructor(joinPos : vector2, colour : string, side : number, length : number, width : number, legAngle : number) {
		this.length = length;
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
		console.log(result);
		return result;
	}

	updateLimb(joinPos : vector2, childJointPos: vector2) {
		this.updateLimbPos(joinPos,childJointPos);
		
		ctx.lineWidth = this.width;

		ctx.fillStyle = this.darkColour;
		ctx.beginPath();
		ctx.arc(this.footPos.x,this.footPos.y,this.width * 0.64,0, 2 * Math.PI);
		ctx.fill();

		ctx.strokeStyle = this.darkColour;
		ctx.beginPath();
		ctx.moveTo(this.elbowPos.x,this.elbowPos.y);
		ctx.lineTo(this.footPos.x,this.footPos.y);
		ctx.stroke();
		ctx.closePath();

		ctx.fillStyle = this.lightColour;
		ctx.beginPath();
		ctx.arc(this.elbowPos.x,this.elbowPos.y,this.width * 0.64,0, 2 * Math.PI);
		ctx.fill();

		ctx.strokeStyle = this.lightColour;
		ctx.beginPath();
		ctx.moveTo(this.joinPos.x,this.joinPos.y);
		ctx.lineTo(this.elbowPos.x,this.elbowPos.y);
		ctx.stroke();
		ctx.closePath();

	}

	updateLimbPos(joinPos : vector2, childJointPos : vector2) {
		this.joinPos = joinPos;
		this.jointAngle = this.joinPos.getAvgAngleRad(childJointPos);
		
		this.calcFootPos()
		this.calcElbowPos()

	}

	calcFootPos() {
		let footCheckPos = this.calcFootCheckPos()

		if (this.footPos.distance(footCheckPos) > this.length ** 1.4 || this.elbowPos.distance(this.joinPos) < 0.6) {
			if (this.pair.isFootUp == false || this.footPos.distance(footCheckPos) > this.length ** 2.2) {
				this.isFootUp = true;
			}
		}

		if (this.isFootUp) {
			this.footPos = footCheckPos.add((footCheckPos.subtract(this.footPos)).divide(4));
			if (this.footPos.distance(footCheckPos) < this.length * 0.6) {
				this.isFootUp = false;	
				this.footPos = footCheckPos;
			}
		}

	}

	calcFootCheckPos() : vector2 {
		let limbSpacing = this.length * 2;
		let footStepPos = new vector2(limbSpacing * -1 * Math.cos(this.jointAngle - (Math.PI * this.side)) + this.joinPos.x,limbSpacing * -1 * Math.sin(this.jointAngle - (Math.PI * this.side)) + this.joinPos.y);
		return new vector2(limbSpacing * Math.cos(this.jointAngle - (Math.PI * this.legAngle * this.side)) + footStepPos.x,limbSpacing * Math.sin(this.jointAngle - (Math.PI * this.legAngle * this.side)) + footStepPos.y)
	}
	
	calcElbowPos() {
		let chi = this.footPos.x - this.joinPos.x;
		let psi = this.footPos.y - this.joinPos.y;
		let d = (chi ** 2) + (psi ** 2);
		let a = Math.max(-1,Math.min(1,d / (2 * this.length * Math.sqrt(d))));
		let theta = Math.atan2(psi,chi) - (Math.acos(a) * this.side);
		
		this.elbowPos.x = this.joinPos.x + (this.length * Math.cos(theta));
		this.elbowPos.y = this.joinPos.y + (this.length * Math.sin(theta));
	}
}
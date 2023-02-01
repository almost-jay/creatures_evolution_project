import { vector2 } from "./globals";
import { ctx } from "./initMain";

export class creatureLeg {
	length : number; //how long each part of the leg is
	width : number; //width of the leg
	depth : number; //how far forward and back the leg goes
	joinPos : vector2;
	elbowPos : vector2;
	footPos : vector2;
	colour : string;
	side : number;
	jointAngle : number;

	constructor(joinPos : vector2, colour : string, side : number, length : number, width : number, depth : number) {
		this.length = length;
		this.width = width;
		this.depth = depth;
		this.joinPos = joinPos;
		this.colour = colour;
		this.side = side;

		this.elbowPos = new vector2(0,0);
		this.footPos = new vector2(0,0);
	}

	updateLimbPos(joinPos : vector2, childJointPos : vector2) {
		this.joinPos = joinPos;
		this.jointAngle = this.joinPos.getAvgAngleRad(childJointPos);
		let limbSpacing = this.length * 1.8;
		
		this.footPos = new vector2(limbSpacing * Math.cos(this.jointAngle - (Math.PI * 0.5 * this.side)) + this.joinPos.x,limbSpacing * Math.sin(this.jointAngle - (Math.PI * 0.5 * this.side)) + this.joinPos.y)
		this.calcElbowPos()

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
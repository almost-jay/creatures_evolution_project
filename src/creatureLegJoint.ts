import { creatureJoint } from "./creatureBase";
import { vector2 } from "./globals";
import { ctx } from "./initMain";

export class creatureLegJoint extends creatureJoint {
	pos : vector2;
	id : number;
	colour : string;
	width : number;
	childJoint : creatureJoint;
	angle : number;
	angleParentId : number;
	legLength : number;
	leftElbowPos : vector2;
	rightElbowPos : vector2;
	leftLegPos : vector2;
	rightLegPos : vector2;
	leftLegUp : boolean;
	rightLegUp : boolean;

	constructor(pos : vector2, id : number, colour : string, width : number, legLength : number) {
		super(pos,id,colour,width);
		this.legLength = legLength;

		this.leftElbowPos = new vector2(this.pos.x,this.pos.y);
		this.rightElbowPos = new vector2(this.pos.x,this.pos.y);

		this.leftLegPos = new vector2(this.pos.x,this.pos.y);
		this.rightLegPos = new vector2(this.pos.x,this.pos.y);

		this.leftLegUp = false;
		this.rightLegUp = false;

	}

	importJsonProps(loaded: creatureLegJoint): void {
		super.importJsonProps(loaded);
		this.leftElbowPos = new vector2(loaded.leftElbowPos.x,loaded.leftElbowPos.y);
		this.rightElbowPos = new vector2(loaded.rightElbowPos.x,loaded.rightElbowPos.y);
		this.leftLegPos = new vector2(loaded.leftLegPos.x,loaded.leftLegPos.y);
		this.rightLegPos = new vector2(loaded.rightLegPos.x,loaded.rightLegPos.y);
	}

	calcLegPositions(angleParentPos : vector2) : void {
		this.angle = this.pos.getAvgAngleRad(angleParentPos);

		let leftLegFin = new vector2(0,0);
		let rightLegFin = new vector2(0,0);

		leftLegFin.x = (this.legLength * 2.2 * Math.cos(this.angle - (Math.PI * -0.74))) + this.pos.x;
		leftLegFin.y = (this.legLength * 2.2 * Math.sin(this.angle - (Math.PI * -0.74))) + this.pos.y;
		
		rightLegFin.x = (this.legLength * 2.2 * Math.cos(this.angle - (Math.PI * 0.74))) + this.pos.x;
		rightLegFin.y = (this.legLength * 2.2 * Math.sin(this.angle - (Math.PI * 0.74))) + this.pos.y;

		if (this.leftLegPos.distance(leftLegFin) > this.legLength ** 1.4 || this.leftElbowPos.distance(this.rightElbowPos) < this.legLength) {
			if (!this.rightLegUp || this.leftLegPos.distance(leftLegFin) > this.legLength ** 2.2) { this.leftLegUp = true; }
		}
		if (this.leftLegUp) {
			this.leftLegPos = this.leftLegPos.add((leftLegFin.subtract(this.leftLegPos)).divide(4));
			if (this.leftLegPos.distance(leftLegFin) < this.legLength * 0.6) {
				this.leftLegUp = false;
				this.leftLegPos = leftLegFin;
			}
		}
		this.leftElbowPos = this.solveInverseKinematics(this.leftLegPos, 1);

		if (this.rightLegPos.distance(rightLegFin) > this.legLength ** 1.4 || this.rightElbowPos.distance(this.leftElbowPos) < this.legLength) {
			if (!this.leftLegUp || this.rightLegPos.distance(rightLegFin) > this.legLength ** 2.2) { this.rightLegUp = true; }
		}
		if (this.rightLegUp) {
			this.rightLegPos = this.rightLegPos.add((rightLegFin.subtract(this.rightLegPos)).divide(4));
			if (this.rightLegPos.distance(rightLegFin) < this.legLength * 0.6) {
				this.rightLegUp = false;
				this.rightLegPos = rightLegFin;
			}
		}
		this.rightElbowPos = this.solveInverseKinematics(this.rightLegPos, -1);

	}

	calcDeathPositions(angleParentPos : vector2) {
		this.angle = this.pos.getAvgAngleRad(angleParentPos);

		let leftLegFin = new vector2(0,0);
		let rightLegFin = new vector2(0,0);

		leftLegFin.x = (this.legLength * -2.2 * Math.cos(this.angle - (Math.PI * -0.74))) + this.pos.x;
		leftLegFin.y = (this.legLength * -2.2 * Math.sin(this.angle - (Math.PI * -0.74))) + this.pos.y;
		
		rightLegFin.x = (this.legLength * -2.2 * Math.cos(this.angle - (Math.PI * 0.74))) + this.pos.x;
		rightLegFin.y = (this.legLength * -2.2 * Math.sin(this.angle - (Math.PI * 0.74))) + this.pos.y;

		this.leftLegPos = this.leftLegPos.add((leftLegFin.subtract(this.leftLegPos)).divide(4));
		this.leftElbowPos = this.solveInverseKinematics(this.leftLegPos, 1);
		
		this.rightLegPos = this.rightLegPos.add((rightLegFin.subtract(this.rightLegPos)).divide(4));
		this.rightElbowPos = this.solveInverseKinematics(this.rightLegPos,- 1);
	}

	move(maxDist : number, target : vector2, isDead : boolean, angleParentPos : vector2) : void {
		if (!isDead) {
			this.calcLegPositions(angleParentPos);
		} else {
			this.calcDeathPositions(angleParentPos);
		}
		super.move(maxDist,target,isDead,angleParentPos);
	}

	renderSegment(): void {
		ctx.lineCap = "round";
		ctx.strokeStyle = this.colour;
		ctx.lineWidth = this.width * 0.5;
		
		ctx.beginPath();
		ctx.moveTo(this.pos.x,this.pos.y);
		ctx.lineTo(this.leftElbowPos.x,this.leftElbowPos.y);
		ctx.stroke();

		ctx.beginPath();
		ctx.moveTo(this.leftElbowPos.x,this.leftElbowPos.y);
		ctx.lineTo(this.leftLegPos.x,this.leftLegPos.y);
		ctx.stroke();
		
		ctx.beginPath();
		ctx.moveTo(this.pos.x,this.pos.y);
		ctx.lineTo(this.rightElbowPos.x,this.rightElbowPos.y);
		ctx.stroke();

		ctx.beginPath();
		ctx.moveTo(this.rightElbowPos.x,this.rightElbowPos.y);
		ctx.lineTo(this.rightLegPos.x,this.rightLegPos.y);
		ctx.stroke();

		ctx.fillStyle = this.childJoint.colour;
		
		ctx.beginPath();
		ctx.arc(this.leftElbowPos.x,this.leftElbowPos.y,this.width * 0.2,0,2 * Math.PI);
		ctx.fill();

		ctx.beginPath();
		ctx.arc(this.rightElbowPos.x,this.rightElbowPos.y,this.width * 0.2,0,2 * Math.PI);
		ctx.fill();

		ctx.beginPath();
		ctx.arc(this.leftLegPos.x,this.leftLegPos.y,this.width * 0.3,0,2 * Math.PI);
		ctx.fill();

		ctx.beginPath();
		ctx.arc(this.rightLegPos.x,this.rightLegPos.y,this.width * 0.3,0,2 * Math.PI);
		ctx.fill();

		super.renderSegment();
	}

	solveInverseKinematics(targetPos : vector2, side : number) : vector2 {
		
		let comp = new vector2(targetPos.x - this.pos.x, targetPos.y - this.pos.y);
		let distance = comp.x * comp.x + comp.y * comp.y;
		let angle = Math.max(-1, Math.min(1, distance / (2 * this.legLength * Math.sqrt(distance))));
		let theta = Math.atan2(comp.y,comp.x) - (Math.acos(angle) * side);
		
		let result = new vector2(0,0);
		result.x = this.pos.x + this.legLength * Math.cos(theta);
		result.y = this.pos.y + this.legLength * Math.sin(theta);

		return result;
	}
}

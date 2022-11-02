import { creatureJoint } from "./creatureBase";
import { vector2 } from "./globals";
import { ctx } from "./initMain";

export class creatureHead extends creatureJoint {
	pos : vector2;
	id : number;
	colour : string;
	childJoint : creatureJoint;
	eyeSpacing : number;
	eyeColour : string;
	angle : number;

	constructor(pos : vector2, id : number, colour : string, width : number, eyeColour : string, eyeSpacing : number) {
		super(pos,id,colour,width);
		this.eyeColour = eyeColour;
		this.eyeSpacing = eyeSpacing;
	}

	renderSegment(): void {
		super.renderSegment();
		this.angle = this.pos.getAvgAngleRad(this.childJoint.pos);
		ctx.fillStyle = this.eyeColour;
		ctx.beginPath();
		ctx.arc((this.eyeSpacing * Math.cos(this.angle - (Math.PI * 0.5))) + this.pos.x,(this.eyeSpacing * Math.sin(this.angle - (Math.PI * 0.5))) + this.pos.y,3,0,2 * Math.PI);
		ctx.fill();
		ctx.beginPath();
		ctx.arc((this.eyeSpacing * Math.cos(this.angle - (Math.PI * -0.5))) + this.pos.x,(this.eyeSpacing * Math.sin(this.angle - (Math.PI * -0.5))) + this.pos.y,3,0,2 * Math.PI);
		ctx.fill();
	}

	moveHead(target : vector2) : void {
		this.pos.x -= ((this.pos.x - target.x) / 100) * 6;
		this.pos.y -= ((this.pos.y - target.y) / 100) * 6;
	}
}
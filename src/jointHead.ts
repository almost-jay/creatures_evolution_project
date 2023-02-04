import { vector2 } from "./globals";
import { creatureJoint } from "./jointBase";
import { creatureBody } from "./jointBody";
import { ctx } from "./initMain";

export class creatureHead extends creatureBody {
	pos : vector2;
	id : number;
	colour : string;
	width : number;
	childJoint : creatureJoint;
	eyeSpacing : number;
	eyeColour : string;
	angle : number;

	constructor (pos : vector2, id : number, colour : string, width : number, eyeSpacing : number, eyeColour : string, hasLegs : boolean) {
		super(pos, id, colour, width,hasLegs)
		this.eyeSpacing = eyeSpacing;
		this.eyeColour = eyeColour;
	}

	followMouse() {
		this.pos.x -= 0.2;
		this.pos.y -= 0.6;
	}

	drawEyes() {
		this.angle = this.pos.getAvgAngleRad(this.childJoint.pos);
		ctx.fillStyle = this.eyeColour;
		ctx.beginPath();
		ctx.arc((this.eyeSpacing * Math.cos(this.angle - (Math.PI * 0.5))) + this.pos.x,(this.eyeSpacing * Math.sin(this.angle - (Math.PI * 0.5))) + this.pos.y,this.width * 0.22,0,2 * Math.PI);
		ctx.fill();
		ctx.beginPath();
		ctx.arc((this.eyeSpacing * Math.cos(this.angle - (Math.PI * -0.5))) + this.pos.x,(this.eyeSpacing * Math.sin(this.angle - (Math.PI * -0.5))) + this.pos.y,this.width * 0.22,0,2 * Math.PI);
		ctx.fill();
	}

	updateJoint(maxDist : number): void {
		super.updateJoint(maxDist)
		this.followMouse()
		this.drawEyes()
	}
}
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
	speed : number;
	eyeType : string;

	constructor(pos : vector2, id : number, colour : string, width : number, eyeColour : string, eyeSpacing : number) {
		super(pos,id,colour,width);
		this.eyeColour = eyeColour;
		this.eyeSpacing = eyeSpacing;
		this.eyeType = "round";
		this.speed = 6;
	}

	renderSegment(): void {
		super.renderSegment();
		this.angle = this.pos.getAvgAngleRad(this.childJoint.pos);
		ctx.fillStyle = this.eyeColour;
		ctx.strokeStyle = this.eyeColour;
		ctx.lineWidth = 1.6;
		switch (this.eyeType) {
			case "round":
				ctx.beginPath();
				ctx.arc((this.eyeSpacing * Math.cos(this.angle - (Math.PI * 0.5))) + this.pos.x,(this.eyeSpacing * Math.sin(this.angle - (Math.PI * 0.5))) + this.pos.y,this.width * 0.2,0,2 * Math.PI);
				ctx.fill();
				ctx.beginPath();
				ctx.arc((this.eyeSpacing * Math.cos(this.angle - (Math.PI * -0.5))) + this.pos.x,(this.eyeSpacing * Math.sin(this.angle - (Math.PI * -0.5))) + this.pos.y,this.width * 0.2,0,2 * Math.PI);
				ctx.fill();
				break;
			case "cross":
				ctx.beginPath();
				ctx.moveTo((this.eyeSpacing * Math.cos(this.angle - (Math.PI * 0.5))) + this.pos.x + (this.eyeSpacing / 2),this.eyeSpacing * Math.sin(this.angle - (Math.PI * 0.5)) + this.pos.y + (this.eyeSpacing / 2));
				ctx.lineTo((this.eyeSpacing * Math.cos(this.angle - (Math.PI * 0.5))) + this.pos.x - (this.eyeSpacing / 2),this.eyeSpacing * Math.sin(this.angle - (Math.PI * 0.5)) + this.pos.y - (this.eyeSpacing / 2));
				ctx.stroke();
				ctx.beginPath();
				ctx.moveTo((this.eyeSpacing * Math.cos(this.angle - (Math.PI * 0.5))) + this.pos.x - (this.eyeSpacing / 2),this.eyeSpacing * Math.sin(this.angle - (Math.PI * 0.5)) + this.pos.y + (this.eyeSpacing / 2));
				ctx.lineTo((this.eyeSpacing * Math.cos(this.angle - (Math.PI * 0.5))) + this.pos.x + (this.eyeSpacing / 2),this.eyeSpacing * Math.sin(this.angle - (Math.PI * 0.5)) + this.pos.y - (this.eyeSpacing / 2));
				ctx.stroke();
				ctx.beginPath();
				ctx.moveTo((this.eyeSpacing * Math.cos(this.angle - (Math.PI * -0.5))) + this.pos.x + (this.eyeSpacing / 2),this.eyeSpacing * Math.sin(this.angle - (Math.PI * -0.5)) + this.pos.y + (this.eyeSpacing / 2));
				ctx.lineTo((this.eyeSpacing * Math.cos(this.angle - (Math.PI * -0.5))) + this.pos.x - (this.eyeSpacing / 2),this.eyeSpacing * Math.sin(this.angle - (Math.PI * -0.5)) + this.pos.y - (this.eyeSpacing / 2));
				ctx.stroke();
				ctx.beginPath();
				ctx.moveTo((this.eyeSpacing * Math.cos(this.angle - (Math.PI * -0.5))) + this.pos.x - (this.eyeSpacing / 2),this.eyeSpacing * Math.sin(this.angle - (Math.PI * -0.5)) + this.pos.y + (this.eyeSpacing / 2));
				ctx.lineTo((this.eyeSpacing * Math.cos(this.angle - (Math.PI * -0.5))) + this.pos.x + (this.eyeSpacing / 2),this.eyeSpacing * Math.sin(this.angle - (Math.PI * -0.5)) + this.pos.y - (this.eyeSpacing / 2));
				ctx.stroke();
				break;
		}
	}

	moveHead(target : vector2) : void {
		this.pos.x -= ((this.pos.x - target.x) / 100) * this.speed * 0.5;
		this.pos.y -= ((this.pos.y - target.y) / 100) * this.speed * 0.5;
	}

}
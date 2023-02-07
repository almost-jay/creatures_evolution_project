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
	path : Array<vector2>;
	target : vector2;
	targetIndex : number;

	constructor (pos : vector2, id : number, colour : string, width : number, eyeSpacing : number, eyeColour : string, hasLegs : boolean) {
		super(pos, id, colour, width,hasLegs)
		this.eyeSpacing = eyeSpacing;
		this.eyeColour = eyeColour;
		this.generatePath();
		this.targetIndex = 0;
		this.target = this.path[this.targetIndex];
	}

	followPath() {
		let targDist = this.pos.distance(this.target);
		let speed = 1;
		
		if (targDist > this.width * 2) {
			let delta = this.pos.subtract(this.target);
			delta = delta.divide(this.width * 2);
			delta = delta.multiply(speed);
			this.pos = this.pos.subtract(delta);
		} else {
			if (this.targetIndex + 1 < this.path.length) {
				this.targetIndex += 1;
				this.target = this.path[this.targetIndex];
			} else {
				this.targetIndex = 0;
				this.generatePath();
				this.target = this.path[0];
			}
		}

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
		this.followPath()
		this.drawEyes()
	}

	generatePath() {
		let alpha = 4;
		let pathLength = 64;
		this.path = [new vector2(this.pos.x,this.pos.y)];
		for (let i = 1; i < pathLength; i++) {
			this.path[i] = new vector2(this.pos.x,this.pos.y);
			let theta = Math.random() * 2 * Math.PI;
			let f = (Math.random() ** (-1 / alpha)) + 32;
			this.path[i].x = this.path[i - 1].x + (f * Math.cos(theta));
			this.path[i].y = this.path[i - 1].y + (f * Math.sin(theta));
		}
		this.linearSmoothPath();
		this.interpolatePath();
		this.linearSmoothPath();
	}

	linearSmoothPath() {
		for (let i = 1; i < this.path.length - 1; i++) {
			let roughAvg = (this.path[i - 1].add(this.path[i + 1])).divide(2);
			let distance = this.path[i].distance(this.path[i - 1]) + this.path[i].distance(this.path[i + 1]);
			if (distance > 128) {
				let jump = Math.floor(distance / 128);
				roughAvg = (this.path[Math.max(i - jump,0)].add(this.path[Math.min(i + jump,this.path.length - 1)])).divide(2);
				this.path[i] = roughAvg;
			} else {
				let fineAvg = roughAvg.add(this.path[i]);
				this.path[i] = fineAvg.divide(2);
			}
		}
	}

	interpolatePath() {
		let result = [];
		let n = this.path.length;
		let h = [], alpha = [], l = [1], u = [0], z = [0], c = [], b = [], d = [];
		
		for (let i = 0; i < n - 1; i++) {
			h[i] = this.path[i + 1].x - this.path[i].x;
		}

		for (let i = 1; i < n - 1; i++) {
			alpha[i] = 3 / h[i] * (this.path[i + 1].y - this.path[i].y) - 3 / h[i - 1] * (this.path[i].y - this.path[i - 1].y);

		}

		for (let i = 1; i < n - 1; i++) {
			l[i] = 2 * (this.path[i + 1].x - this.path[i - 1].x) - h[i - 1] * u[i - 1];
			u[i] = h[i] / l[i];
			z[i] = (alpha[i] - h[i - 1] * z[i - 1]) / l[i];
		}

		c[n - 1] = 0;

		for (let i = n - 2; i >= 0; i--) {
			c[i] = z[i] - u[i] * c[i + 1];
			b[i] = (this.path[i + 1].y - this.path[i].y) / h[i] - h[i] * (c[i + 1] + 2 * c[i]) / 3;
			d[i] = (c[i + 1] - c[i]) / (3 * h[i]);
		}

		for (let i = 0; i < n - 1; i++) {
			let numPoints = this.path[i + 1].x - this.path[i].x;
			for (let j = 1; j < numPoints; j+= 16) {
				let x = this.path[i].x + j;
				let y = this.path[i].y + b[i] * (x - this.path[i].x) + c[i] * Math.pow(x - this.path[i].x, 2) + d[i] * Math.pow(x - this.path[i].x, 3);

				result.push(new vector2(x,y));
			}
		}
		this.path = result;
	}
	  
}
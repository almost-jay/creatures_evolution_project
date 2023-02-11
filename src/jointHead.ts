import { vector2 } from "./globals";
import { creatureJoint } from "./jointBase";
import { creatureBody } from "./jointBody";
import { ctx, canvas, isMouseDown, activeArea, mousePos, isPaused } from "./initMain";

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
	isMouseDragging : boolean;

	constructor (pos : vector2, id : number, colour : string, width : number, eyeSpacing : number, eyeColour : string, hasLegs : boolean) {
		super(pos, id, colour, width,hasLegs)
		this.eyeSpacing = eyeSpacing;
		this.eyeColour = eyeColour;
		this.generatePath();
		this.targetIndex = 0;
		this.target = this.path[this.targetIndex];
		this.isMouseDragging = false;
	}

	followPath() {
		let targDist = this.pos.distance(this.target);
		let speed = 1;
		
		if (targDist > this.width * 1.5) {
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
		//this.drawPath();
		if (this.checkMouse() == false) {
			super.updateJoint(maxDist);
			if (!isPaused) {
				this.followPath();
			}
		} else {
			super.updateJoint(2);
		}
		this.drawEyes();
	}

	generatePath() {
		let alpha = 4;
		let pathLength = 32;
		this.path = [new vector2(this.pos.x,this.pos.y)];
		for (let i = 1; i < pathLength; i++) {
			this.path[i] = new vector2(this.pos.x,this.pos.y);
			let theta = Math.random() * 2 * Math.PI;
			let f = (Math.random() ** (-1 / alpha)) + 128;

			let xPos = this.path[i - 1].x + (f * Math.cos(theta));
			let yPos = this.path[i - 1].x + (f * Math.sin(theta));
			if (xPos >= 4032 ) {
				xPos -= (Math.random() * (xPos - 4096)) + 32;
			}
			if (yPos >= 4032) {
				yPos -= (Math.random() * (yPos - 4096)) + 32;
			}

			if (xPos <= 64) {
				xPos += (Math.random() * xPos) + 32;
			}
			if (yPos <= 64) {
				yPos += (Math.random() * yPos) + 32;
			}

			this.path[i].x = xPos;
			this.path[i].y = yPos;
		}
		this.linearSmoothPath();
		this.interpolatePath(4);
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

	drawPath() {
		ctx.strokeStyle = "#BFC8AD";
		ctx.fillStyle = "#DD0000";
		ctx.lineWidth = 2;
		ctx.beginPath();
		ctx.moveTo(this.path[0].x,this.path[0].y);
		for (let i = 1; i < this.path.length; i++) {
			ctx.lineTo(this.path[i].x,this.path[i].y);
		}
		ctx.stroke();
		ctx.closePath();

		for (let i = 1; i < this.path.length; i ++) {
			ctx.beginPath();
			ctx.arc(this.path[i].x,this.path[i].y,3,0,2 * Math.PI);
			ctx.fill();
		}
	}

	interpolatePath(degree : number) { //degree should be an integer between 2 and 5, inclusive
		let knotCount = this.path.length + degree + 1;
		let knots = this.calcKnots(knotCount,degree);
		let result = [];
		for (let t = 0; t < 1; t += 0.005) {
			result.push(this.interpolate(t,degree,knots));
			if (Math.floor(t * 100) % 2 == 0) {
				result[result.length - 1].y += (Math.random() + 1) * 6;
				result[result.length - 1].x += (Math.random() + 1) * 6;
			}
		}

		this.path = result;
	}

	calcKnots(knotCount : number, degree : number) : Array<number> {
		let knots = [];
		for (let i = 0; i < knotCount - (degree * 2); i++) {
			knots.push(i);
		}
		
		for (let i = 0; i < degree; i++) {
			knots.push(knots[knots.length - 1]);
			knots.unshift(knots[0]);
		}
		return knots;
	}

	interpolate(t : number, degree : number, knots : Array<number>) {
		let n = this.path.length;

		let low  = knots[degree];
		let high = knots[knots.length - 1];
		t = t * (high - low) + low;
	  
		let s = degree;
		for(let i = degree; i < knots.length - 1; i++) {
		  if(t >= knots[i] && t <= knots[i + 1]) {
			s = i;
		  }
		}
	  
		let d : Array<vector2> = [];

		for (let i = 0; i < n; i++) {
			d.push(new vector2(this.path[i].x,this.path[i].y));
		}

		for(let i = 1; i <= degree + 1; i++) {
		  for(let j = s; j > s - degree - 1 + i; j--) {
			let alpha = (t - knots[j]) / (knots[j + degree + 1 - i] - knots[j]);
			d[j] = (d[j - 1].multiply(1 - alpha)).add(d[j].multiply(alpha));

		  }
		}
	  
		return new vector2(d[s].x / 1,d[s].y / 1);
	  }
	  
	checkMouse() {
		let result = false
		let mouseCoordPos = new vector2(activeArea[0].x + 24 + mousePos.x,activeArea[0].y + 24 + mousePos.y);
		if (this.pos.distance(mouseCoordPos) < this.width || this.isMouseDragging) {
			if (isMouseDown) {
				this.isMouseDragging = true;
				canvas.style.cursor = "url('./assets/hand-back-fist-solid.svg') 5 8, pointer";
				this.pos = mouseCoordPos;
				result = true;
			} else {
				canvas.style.cursor = "url('./assets/hand-solid.svg') 5 8, pointer";
				this.isMouseDragging = false;
			}
		}
		return result;
	}
}
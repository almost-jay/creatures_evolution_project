import { randRange, vector2 } from "./globals";
import { creatureJoint } from "./jointBase";
import { creatureBody } from "./jointBody";
import { ctx, canvas, isLeftMouseDown, activeArea, mousePos, isPaused, creaturesList, creaturesDict, debugPrefs } from "./initMain";
import { creatureTraits, relationship, trait } from "./creatureTraits";
import { posGrid } from "./handleGrid";
import { creature } from "./creatureMain";

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
	isBlinking : boolean;
	blinkIndex : number;
	properties: creatureTraits;

	constructor (pos : vector2, id : number, colour : string, width : number, eyeSpacing : number, eyeColour : string, hasLegs : boolean, properties : creatureTraits) {
		super(pos, id, colour, width,hasLegs)
		this.eyeSpacing = eyeSpacing;
		this.eyeColour = eyeColour;
		this.generatePath();
		this.targetIndex = 0;
		this.target = this.path[this.targetIndex];
		this.isBlinking = false;
		this.blinkIndex = Math.floor(randRange(-120,12));
		this.properties = properties;
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
				this.generatePath();
			}
		}

	}

	drawEyes() {
		this.angle = this.pos.getAvgAngleRad(this.childJoint.pos);
		ctx.fillStyle = this.eyeColour;
		if (!isPaused) {
			if ((Math.random() < 0.01 && this.blinkIndex == 0) || this.blinkIndex < -120) {
				this.isBlinking = true;
				this.blinkIndex = 0;
				ctx.fillStyle = this.colour;
			}
			else if (this.isBlinking) {
				this.blinkIndex += 1;
				ctx.fillStyle = this.colour;
				if (this.blinkIndex > 12) {
					this.isBlinking = false;
				}
			} else {
				this.blinkIndex -= 1
				ctx.fillStyle = this.eyeColour;
			}
		} else {
			if (this.isBlinking) {
				ctx.fillStyle = this.colour;
			}
		}
		ctx.beginPath();
		ctx.arc((this.eyeSpacing * Math.cos(this.angle - (Math.PI * 0.5))) + this.pos.x,(this.eyeSpacing * Math.sin(this.angle - (Math.PI * 0.5))) + this.pos.y,this.width * 0.22,0,2 * Math.PI);
		ctx.fill();
		ctx.beginPath();
		ctx.arc((this.eyeSpacing * Math.cos(this.angle - (Math.PI * -0.5))) + this.pos.x,(this.eyeSpacing * Math.sin(this.angle - (Math.PI * -0.5))) + this.pos.y,this.width * 0.22,0,2 * Math.PI);
		ctx.fill();
	}

	updateJoint(maxDist : number, state: string): void {
		super.updateJoint(maxDist, state);
		//this.drawPath();
		this.drawEyes();
		if (!isPaused) {
			switch(state) {
				case "idle":
					this.followPath();
					break;
				case "mouseDragging":
					break;
			}
		}
	}

	generatePath() {
		let alpha = 4;
		let pathLength = 32;
		this.targetIndex = 0;
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
		this.target = this.path[0];
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

	  moveByDrag(maxDist : number): void {
		super.moveByDrag(maxDist);
		this.pos = new vector2(activeArea[0].x + 24 + mousePos.x,activeArea[0].y + 24 + mousePos.y);
	}

	checkSenses() {
		let senseCreatures : Array<string> = this.getSlicedGrid();
		let canSee = false;
		let canHear = false;
		for (let i = 0; i < senseCreatures.length; i++) {
			let checkedCreature : creature = creaturesDict[senseCreatures[i]];
			if (checkedCreature.head != this) {
				let checkDist = checkedCreature.head.pos.distance(this.pos);
				if (checkDist < this.properties.traits.visionDistance.value) {
					if (this.castVision(checkedCreature.head.pos)) {
						canSee = true;
						if (this.properties.relationships[checkedCreature.id] == undefined) {
							this.properties.relationships[checkedCreature.id] = new relationship(checkedCreature,true,false);
						} else {
							this.properties.relationships[checkedCreature.id].canSee = true;
						}
					}
				} if (checkDist < this.properties.traits.hearingDistance.value) {
					canHear = true;
					if (this.properties.relationships[checkedCreature.id] == undefined) {
						this.properties.relationships[checkedCreature.id] = new relationship(checkedCreature,false,true);
						this.calcAttitude(checkedCreature.properties.traits,checkedCreature.id);
					} else {
						this.properties.relationships[checkedCreature.id].canHear = true;
					}
				}
			}
		}

		if (debugPrefs["visionCone"] == true) {
			if (canSee) {
				ctx.fillStyle = "#11FFCC11";
			} else {
				ctx.fillStyle = "#FFEEEE11";
			}
			ctx.beginPath();
			ctx.moveTo(this.pos.x,this.pos.y);
			ctx.arc(this.pos.x,this.pos.y,this.properties.traits.visionDistance.value,this.angle - (this.properties.traits.visionAngle.value), this.angle + (this.properties.traits.visionAngle.value));
			ctx.lineTo(this.pos.x,this.pos.y);
			ctx.closePath();
			ctx.fill();
		}

		if (debugPrefs["hearingRange"] == true) {
			if (canHear) {
				ctx.fillStyle = "#FF660011";
			} else {
				ctx.fillStyle = "#FFAA2211";
			}
			ctx.beginPath();
			ctx.arc(this.pos.x,this.pos.y,this.properties.traits.hearingDistance.value,0,2 * Math.PI);
			ctx.fill();
		}
	}

	getSlicedGrid() : Array<string> {
		let maxSenseDist = Math.ceil(this.properties.traits.hearingDistance.value > this.properties.traits.visionDistance.value ? this.properties.traits.hearingDistance.value : this.properties.traits.visionDistance.value);
		let startX = Math.round((this.pos.x - maxSenseDist) / 16);
		let endX = Math.round((this.pos.x + maxSenseDist) / 16) + 1;
		let startY = Math.round((this.pos.y - maxSenseDist) / 16);
		let endY = Math.round((this.pos.y + maxSenseDist) / 16) + 1;
		let senseArea = posGrid.slice(startX,endX).map(i => i.slice(startY,endY));
		let senseCreatures : Array<string> = [];
		for (let i = 0; i < senseArea.length; i++) {
			for (let j = 0; j < senseArea[i].length; j++) {
				let creatureId = senseArea[i][j];
				if (creatureId != "") {
					if (!senseCreatures.includes(creatureId)) {
						senseCreatures.push(creatureId);
					}
				}
			}
		}
		return senseCreatures;
	}

	calcAttitude(creatureTraits: { [id: string] : trait }, id: string) {
		let aggression = 0;
		let respect = 0;
		for (let key in creatureTraits) {
			aggression += (creatureTraits[key].display * this.properties.traits[key].attitude[0]);
			respect += (creatureTraits[key].display * this.properties.traits[key].attitude[1]);

			let respectModifier = (creatureTraits[key].display - this.properties.traits[key].value) / (creatureTraits[key].display + 1);
			respect += respectModifier;
		}
		let personality = this.properties.personality;
		aggression += personality[0];
		respect += personality[1];

		this.properties.relationships[id].aggression += aggression; 
		this.properties.relationships[id].aggression += respect; 
	}

	calcInteractions() {
		
	}

	castVision(checkPos: vector2) {
		let result = false;
		let sight_angle = Math.abs(checkPos.getAvgAngleRad(this.pos) - this.angle);
		if (sight_angle < this.properties.traits.visionAngle.value) {
			result = true;
		}
		return result;
	}
}
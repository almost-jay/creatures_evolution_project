import { creatureTraits, trait } from "./creatureTraits";
import { food } from "./food";
import { preColours, vector2, hexToRgb, generateId, randRange } from "./globals"
import { isPaused, debugPrefs, ctx, entityDict } from "./initMain";
import { creatureJoint } from "./jointBase";
import { creatureBody } from "./jointBody";
import { creatureHead } from "./jointHead";

export class creature {
	pos : vector2 = new vector2(0,0);
	length : number = 0;
	maxDist : number = 0;
	weights : number = 0;
	id : string = "";
	segments : Array<creatureJoint> = [];
	head : creatureHead = new creatureHead(this.pos,0,"#000000",0,0,"#000000",false);
	properties : creatureTraits = new creatureTraits(null);
	state : string = "idle";
	action: string = "walk";
	health : number = 1;
	hunger : number = 0;
	age : number = 0;
	path : Array<vector2> = [];
	target : vector2 = new vector2(0,0);
	targetIndex : number = 0;
	tailStartIndex : number = 0;

	constructor(pos : vector2, length : number, maxDist : number, parentProps : Array<creatureTraits> | null) {
		this.properties = new creatureTraits(parentProps);
		this.pos = pos;
		this.length = length;
		this.maxDist = maxDist;
		this.weights = Math.floor(this.properties.traits.speed.display * 1.8);
		
		this.id = generateId();
		entityDict[this.id] = this;
		
		this.segments = [];
		this.initJoints();
		
		this.generatePath(4);
		
		this.health = this.properties.traits.health.value;
	}

	getTypeOf() {
		return "creature"; //now i could just use constructor.name, but this makes it much easier to understand
	}

	initJoints() {
		let bodyCount = Math.floor(0.6 * this.length);
		let bodyColour = this.generateColours();
		let baseWidth = 8;

		this.head = new creatureHead(this.pos,0,bodyColour[0],baseWidth * 1.3,baseWidth * 0.5,"#FFFFFF",false);
		this.segments.push(this.head);
		for (let i = 1; i < this.length - 1; i++ ) {
			let jointPos = this.pos.add(new vector2(i * this.maxDist,i * this.maxDist));
			if (i < bodyCount) {
				let hasLegs = this.calcLegs(bodyCount, i);
				if (hasLegs) {
					this.tailStartIndex = i;
				}
				this.segments.push(new creatureBody(jointPos,i,bodyColour[i],Math.max(0.6,this.calcBodyWidth(bodyCount,i)) * baseWidth,hasLegs));
			} else {
				this.segments.push(new creatureBody(jointPos,i,bodyColour[i],Math.max(0.4,this.calcTailWidth(bodyCount, this.length - i) + 0.1) * baseWidth,false));
			}
		}
		this.segments.push(new creatureJoint(this.pos.add(new vector2(this.length * this.maxDist,this.length * this.maxDist)),this.length - 1,bodyColour[this.length - 1],this.calcTailWidth(bodyCount,this.length) * baseWidth));
		for (let i = 0; i < this.length - 1; i++) {
			this.segments[i].childJoint = this.segments[i + 1];
		}

		this.segments[1].width *= 1.4;
	}

	calcBodyWidth(bodyCount : number, x : number) {
		let period = (this.weights / bodyCount) * ((2 * Math.PI)) / 1;
		let result = 0.6 * Math.sin((period * (x + 2)) - period) + 1;

		if (x < bodyCount / 3) {
			result = (0.4 * x) + 0.2;
		}
		return result;
	}
	calcTailWidth(bodyCount : number, x : number) {
		let result = Math.abs(x / (this.length - bodyCount));
		return result;
	}

	calcLegs(bodyCount : number, x : number) {
		let result = false;
		for (let i = 1; i <= this.weights; i++ ) {
			let period = Math.floor(i * ((Math.PI * 2) / (Math.PI / ((1.0 / ((2 * this.weights) + 0.8)) * bodyCount))));
			if (x == period) {
				result = true;
			}
		}
		return result;
	}

	generateColours() : any {
		let colourInd1 = Math.round(((Math.random() + preColours.length * 0.25) * (preColours.length - preColours.length * 0.25)));
		let colourInd2 = Math.round(colourInd1 + ((Math.random() + preColours.length * 0.25) * (preColours.length - preColours.length * 0.25)));
		//picks one random integer and then one a random "distance" from the first
		while (colourInd1 > preColours.length - 1) {
			colourInd1 -= preColours.length - 1; //keep it the right length
		}
		
		while (colourInd2 > preColours.length - 1) {
			colourInd2 -= preColours.length - 1;
		}

		let colour1 = hexToRgb(preColours[colourInd1]); //selects colour from list from those integers, converts them into RGB format
		let colour2 = hexToRgb(preColours[colourInd2]);

		let colourRes : Array<string> = [];
		let inc = 1 / this.length; //reciprocal of length
		for (let i = 0; i < this.length; i++) { //creates gradient between two given colours, pushing the results into an array
			let r = Math.round(Math.max(Math.min(colour1[0] * (1 - (inc * i)) + (colour2[0] * (inc * i)), 255), 0));
			let g = Math.round(Math.max(Math.min(colour1[1] * (1 - (inc * i)) + (colour2[1] * (inc * i)), 255), 0));
			let b = Math.round(Math.max(Math.min(colour1[2] * (1 - (inc * i)) + (colour2[2] * (inc * i)), 255), 0));
			colourRes.push("rgb("+r+","+g+","+b+")");
		}
		return colourRes;

	}

	
	generatePath(alpha : number) : void {
		let pathLength = 32;
		this.targetIndex = 0;
		this.path = [new vector2(this.pos.x,this.pos.y)];
		for (let i = 1; i < pathLength; i++) {
			this.path[i] = new vector2(this.pos.x,this.pos.y);

			let theta = Math.random() * 2 * Math.PI;
			let f = (Math.random() ** (-1 / alpha)) + 128;

			if (this.path[i - 1].x < 128) {
				if (theta > Math.PI / 2 && theta < Math.PI) {
					theta -= Math.random() * Math.PI / 2 * ((128 - this.path[i].x) / 1);
				}
				if (theta > Math.PI && theta < (3 * Math.PI) / 2) {
					theta += Math.random() * Math.PI / 2 * ((128 - this.path[i].x) / 1);
				}
			}

			if (this.path[i - 1].x > 3968) {
				if (theta > 0 && theta < Math.PI / 2) {
					theta -= Math.random() * Math.PI / 2 * ((this.path[i].x - 3968) / 1);
				}
				if (theta > (3 * Math.PI) / 2 && theta < 2 * Math.PI) {
					theta += Math.random() * Math.PI / 2 * ((this.path[i].x - 3968) / 1);
				}
			}

			if (this.path[i - 1].y < 128) {
				if (theta > Math.PI / 2 && theta < Math.PI) {
					theta -= Math.random() * Math.PI / 2 * ((128 - this.path[i].y) / 1);
				}
				if (theta > Math.PI && theta < (3 * Math.PI) / 2) {
					theta += Math.random() * Math.PI / 2 * ((128 - this.path[i].y) / 1);
				}
			}

			if (this.path[i - 1].y > 3968) {
				if (theta > 0 && theta < Math.PI / 2) {
					theta -= Math.random() * Math.PI / 2 * ((this.path[i].y - 3968) / 1);
				}
				if (theta > (3 * Math.PI) / 2 && theta < 2 * Math.PI) {
					theta += Math.random() * Math.PI / 2 * ((this.path[i].y - 3968) / 1);
				}
			}

			let xPos = this.path[i - 1].x + (f * Math.cos(theta));
			let yPos = this.path[i - 1].x + (f * Math.sin(theta));
			
			this.path[i].x = xPos;
			this.path[i].y = yPos;
		}
		
		this.linearSmoothPath();
		this.interpolatePath(2);

		for (let i = 0; i < this.path.length; i++) {
			if (this.path[i].x >= 3968 ) {
				this.path[i].x -= (Math.random() * (this.path[i].x - 4096)) + 32;
			}
			if (this.path[i].y >= 3968) {
				this.path[i].y -= (Math.random() * (this.path[i].y - 4096)) + 32;
			}

			if (this.path[i].x <= 128) {
				this.path[i].x += (Math.random() * this.path[i].x) + 32;
			}
			if (this.path[i].y <= 128) {
				this.path[i].y += (Math.random() * this.path[i].y) + 32;
			}

		}

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
		ctx.strokeStyle = this.head.colour;
		ctx.fillStyle = this.segments[this.length - 1].colour;
		ctx.lineWidth = 2;
		ctx.beginPath();
		ctx.moveTo(this.path[this.targetIndex].x,this.path[this.targetIndex].y);
		for (let i = this.targetIndex; i < this.path.length; i++) {
			ctx.lineTo(this.path[i].x,this.path[i].y);
		}
		ctx.stroke();
		ctx.closePath();

		for (let i = this.targetIndex; i < this.path.length; i ++) {
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

	
	updateInfoPanel() {
		let panel = document.getElementById("info-panel");
		let header = document.getElementById("info-panel-header");
		if (panel != undefined) {
			if (header != undefined) {
				header.innerHTML = this.id;
			}
			let panelText = this.convertPropsToString();
			panel.innerHTML = panelText;
		} else {
			console.error("Could not find callout text element!");
		}
	}

	convertPropsToString() : string {
		let result = "";
		result = result.concat("<a class='callout-label'> Health: </a>"+this.health+" / "+this.properties.traits.health.value+"<br>");
		result = result.concat("<a class='callout-label'> Hunger: </a>"+(Math.floor(this.hunger * 100) / 100)+"<br>");
		result = result.concat("<a class='callout-label'> Position: </a>("+Math.floor(this.pos.x * 10) / 10+","+Math.floor(this.pos.y * 10) / 10+") <br>");
		result = result.concat("<a class='callout-label'> State: </a>"+this.state+"<br>");
		result = result.concat("<a class='callout-label'> Action: </a>"+this.action+"<br>");
		result = result.concat("<a class='callout-label'> Age: </a>"+(Math.floor(this.age * 40) / 10)+"<br>");
		result = result.concat("<a class='callout-label'> Can sense food: </a>"+this.head.canSeeFood+"<br>");
		result = result.concat("<a class='callout-label'> Can sense foe: </a>"+this.head.canSenseFoe+"<br>");
		result = result.concat("<a class='callout-label'> Can sense friend: </a>"+this.head.canSenseFriend+"<br>");
		result = result.concat("<a class='callout-label'>Target food: </a>"+this.head.targetFood+"<br>");
		result = result.concat("<a class='callout-label'>Target enemy: </a>"+this.head.targetEnemy+"<br>");

		return result;
	}

	oldConvertPropsToString() : string {
		let result = "";
		for (let key in this) {
			if (typeof this[key] == "number" || typeof this[key] == "string" || typeof this[key] == "boolean") {
				let titleKey = key.replace(/([A-Z])/g, " $1");
				titleKey = titleKey.charAt(0).toUpperCase() + titleKey.slice(1);
				result = result.concat("<a class='callout-label'>"+titleKey+": </a>"+this[key]+"<br>");
			}
		}
		return result;
	}

	updateHunger() {
		let totalHungerCost = 0;

		let traitKeys = Object.keys(this.properties.traits);
		for (let i = 0; i < traitKeys.length; i++) {
			totalHungerCost += this.properties.traits[traitKeys[i]].cost;
		}
		totalHungerCost /= traitKeys.length;
		totalHungerCost *= 0.05;
		this.hunger += totalHungerCost;		
	}

	behaviourTick() {
		if (this.health <= 0) {
			this.health = 0;
			this.state = "dead";
		} else {
			this.head.checkSenses(this.id,this.properties.traits.hearingDistance.value,this.properties.traits.visionDistance.value,this.properties.traits.visionAngle.value);
			this.calcState();
			this.updateHunger();
			this.age += 1 / 7200;
		}
	}

	huntFood() {

	}

	followEnemy() {

	}

	calcState() {
		if (this.hunger > 80) {
			if (this.hunger > 100) {
				this.health -= (this.hunger / 100) * 0.2;
			}
			if (this.head.canSenseFoe) {
				this.state = "deferrent";
				this.followEnemy();
			} else {
				//this.state = "hunting";
				//this.huntFood();
				this.lookForFood();
				this.state = "foraging";
			}
		} else if (this.hunger > 40) {
			if (this.head.canSenseFoe) {
				this.state = "aggressive";
				this.attackEnemy();
			} else {
				this.lookForFood();
				this.state = "foraging";
			}
		} else {
			if (this.head.canSenseFoe) {
				this.state = "aggressive";
			} else if (this.head.canSenseFriend) {
				this.state = "friendly";
				this.followFriend();
			} else {
				this.state = "idle";
				this.followPath();
			}
			
		}
	}

	lookForFood() {
		if (this.action != "sniff" || this.targetIndex + 1 >= this.path.length) {
			if (this.head.canSeeFood) {
				if (this.head.targetFood != "") {
					let targetFood = entityDict[this.head.targetFood] as food;
					if (!targetFood.isHeld) {
						if (this.targetIndex + 1 < this.path.length) {
							this.targetIndex = 0;
							this.action = "sniff";
							this.investigate(targetFood.pos);
						} else {
							console.log("eats!!");
							let targetFood = entityDict[this.head.targetFood] as food;
							this.action = "walk";
							this.hunger -= targetFood.size * 4;
							targetFood.isHeld = true;
							targetFood.isHeldBy = this.id;
							this.head.targetFood = "";
							this.generatePath(4);
						}
					} else {
						if (targetFood.isHeldBy in this.head.relationships) {
							if (this.head.relationships[targetFood.isHeldBy].respect < -0.2) {
								this.head.relationships[targetFood.isHeldBy].aggression -= 0.05;
							}
						}
					}
				} else {
					this.followPath();
				}
			} else {
				this.followPath();
			}
		} else {
			this.followPath();
		}
	}

	investigate(sniffPos: vector2) {
		let sniffPath: Array<vector2> = [sniffPos];
		sniffPath.push(sniffPos);
		for (let i = 1; i < 3 * Math.PI; i += 0.2) {
			sniffPath.push(new vector2((this.posFunc(i) * Math.cos(i)) + sniffPos.x,(this.posFunc(i) * Math.sin(i)) + sniffPos.y));
		}
		sniffPath.reverse();
		this.path = sniffPath;
	}

	posFunc(i: number) : number {
		let result = (Math.random() * 0.25 + 8) * (this.pathFunc(3 * i) - (0.4 * i));
		return result;
	}

	pathFunc(i: number) : number {
		let result = -1 * Math.abs(Math.sin(i + ((Math.random() * 2) /2) * Math.abs(Math.sin(i))));
		return result;
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

		this.head.relationships[id].aggression += aggression; 
		this.head.relationships[id].aggression += respect; 
	}


	attackEnemy() {
		let targetEnemy = entityDict[this.head.targetEnemy];
		this.target = targetEnemy.pos;
		//every turn, tiny lil chance of going NOM
		//if its not going nom... walks aroudn enemy (stays distance away)

	}

	followFriend() {
		//every turn, walks towards friend slightly
		//will randomly (tiny chance) go n boop noses!!!
	}
	
	followPath() {
		let targDist = this.head.pos.distance(this.target);
		
		if (targDist > this.head.width * 1.5) {
			let delta = this.pos.subtract(this.target);
			delta = delta.divide(this.head.width * 2);
			delta = delta.multiply(this.properties.traits.speed.value);
			this.head.pos = this.head.pos.subtract(delta);
		} else {
			if (this.targetIndex + 1 < this.path.length) {
				this.targetIndex += 1;
				this.target = this.path[this.targetIndex];
			} else {
				this.generatePath(4);
			}
		}
	} 	

	update() {
		this.pos = this.head.pos;
		if (debugPrefs.drawPath) {
			this.drawPath();
		}
		if (debugPrefs.showId) {
			ctx.fillStyle = "#FAFAFA";
			ctx.font ="12px mono";
			ctx.fillText(this.id,this.segments[1].pos.x,this.segments[1].pos.y - this.head.width * 4);
		}

		this.head.angle = this.head.pos.getAvgAngleRad(this.head.childJoint.pos);
		for (let i = this.length - 1; i >= 0; i --) {
			this.segments[i].updateJoint(this.maxDist,this.state);
			if (this.state == "mouseDragging" && !isPaused) {
				this.segments[i].moveByDrag(this.maxDist);
			}
		}

		if (!isPaused && this.state != "mouseDragging") {
			if (this.state != "dead") {
				this.behaviourTick();
			}
		}
	}
}
import { creatureTraits, relationship, trait } from "./creatureTraits";
import { food } from "./food";
import { preColours, vector2, hexToRgb, generateId, randRange } from "./globals"
import { posGrid } from "./handleGrid";
import { isPaused, debugPrefs, ctx, entityDict, particleList } from "./initMain";
import { creatureJoint } from "./jointBase";
import { creatureBody } from "./jointBody";
import { creatureHead } from "./jointHead";
import { particle } from "./particle";

export class creature {
	length: number = 0;
	maxDist: number = 0;
	weights: number = 0;
	id: string = "";
	segments: Array<creatureJoint> = [];
	limbs: Array<creatureJoint> = [];
	head: creatureHead = new creatureHead(new vector2(0,0),0,"#000000",0,0,"#000000",false);
	properties: creatureTraits = new creatureTraits(null);
	state: string = "idle";
	action: string = "walk";
	health: number = 1;
	hunger: number = 0;
	age: number = 0;
	isMature: boolean = false;
	path: Array<vector2> = [];
	target: vector2 = new vector2(0,0);
	targetIndex: number = 0;
	tailStartIndex: number = 0;
	energyPerTick: number = 0;
	attacked: boolean = false;
	attacker: string = "";
	hasMate: boolean = false;
	mate: string = "";
	hurtIndex: number = -12;
	deferCooldown: number = 0;
	attackCooldown: number = 0;

	constructor(pos: vector2, length: number, maxDist: number, parentProps: Array<creatureTraits> | null) {
		this.properties = new creatureTraits(parentProps);
		this.energyPerTick = this.calcEnergyPerTick();

		this.length = length;
		this.maxDist = maxDist;
		this.weights = Math.floor(this.properties.traits.speed.display * 1.8);
		
		this.id = generateId();
		entityDict[this.id] = this;
		
		this.segments = [];
		this.initJoints(pos);
		
		this.generatePath(4);

		this.health = this.properties.traits.health.value;
	}

	calcEnergyPerTick(): number {
		let result = 0;

		for (let key in this.properties.traits) {
			result += this.properties.traits[key].cost;
		}

		return result;
	}

	getTypeOf() {
		return "creature"; //now i could just use ``constructor.name``, but this makes it much easier to understand
	}

	initJoints(pos: vector2) {
		let bodyCount = Math.floor(0.6 * this.length);
		let bodyColour = this.generateColours();
		let baseWidth = 8;

		let eyeLightness = Math.round((1 - ((this.properties.traits.visionDistance.display - 16) / 500)) * 16).toString(16);
		if (eyeLightness.length == 1) {
			eyeLightness = "#"+eyeLightness+eyeLightness+eyeLightness+eyeLightness+eyeLightness+eyeLightness;
		} else {
			eyeLightness = "#"+eyeLightness+eyeLightness+eyeLightness;
		}
		
		this.head = new creatureHead(pos,0,bodyColour[0],baseWidth * 1.3,baseWidth * 0.5 * ((this.properties.traits.visionAngle.display * 0.25) + 0.65),eyeLightness,false);
		this.segments.push(this.head);
		for (let i = 1; i < this.length - 1; i++ ) {
			let jointPos = pos.add(new vector2(i * this.maxDist,i * this.maxDist));
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
		this.segments.push(new creatureJoint(pos.add(new vector2(this.length * this.maxDist,this.length * this.maxDist)),this.length - 1,bodyColour[this.length - 1],this.calcTailWidth(bodyCount,this.length) * baseWidth));
		for (let i = 0; i < this.length - 1; i++) {
			this.segments[i].childJoint = this.segments[i + 1];
		}

		this.segments[1].width *= 1.4;
	}

	calcBodyWidth(bodyCount: number, x: number) {
		let period = (this.weights / bodyCount) * ((2 * Math.PI)) / 1;
		let result = 0.6 * Math.sin((period * (x + 2)) - period) + 1;

		if (x < bodyCount / 3) {
			result = (0.4 * x) + 0.2;
		}
		return result;
	}

	calcTailWidth(bodyCount: number, x: number) {
		let result = Math.abs(x / (this.length - bodyCount));
		return result;
	}

	calcLegs(bodyCount: number, x: number) {
		let result = false;
		for (let i = 1; i <= this.weights; i++ ) {
			let period = Math.floor(i * ((Math.PI * 2) / (Math.PI / ((1.0 / ((2 * this.weights) + 0.8)) * bodyCount))));
			if (x == period) {
				result = true;
			}
		}
		return result;
	}

	generateColours(): any {
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

		let colourRes: Array<string> = [];
		let inc = 1 / this.length; //reciprocal of length
		for (let i = 0; i < this.length; i++) { //creates gradient between two given colours, pushing the results into an array
			let r = Math.round(Math.max(Math.min(colour1[0] * (1 - (inc * i)) + (colour2[0] * (inc * i)), 255), 0));
			let g = Math.round(Math.max(Math.min(colour1[1] * (1 - (inc * i)) + (colour2[1] * (inc * i)), 255), 0));
			let b = Math.round(Math.max(Math.min(colour1[2] * (1 - (inc * i)) + (colour2[2] * (inc * i)), 255), 0));
			colourRes.push("rgb("+r+","+g+","+b+")");
		}
		return colourRes;

	}

	generatePath(alpha: number): void {
		let pathLength = 32; //can be adjusted later
		this.targetIndex = 0; //reset the target back to the path at 0
		this.path = [new vector2(this.head.pos.x,this.head.pos.y)];
		for (let i = 1; i < pathLength; i++) {
			this.path[i] = new vector2(this.head.pos.x,this.head.pos.y);

			let theta = randRange(0,2 * Math.PI);
			let f = (Math.random() ** (-1 / alpha)) + 64;

			let xPos = this.path[i - 1].x + (f * Math.cos(theta));
			let yPos = this.path[i - 1].y + (f * Math.sin(theta));

			if (xPos >= 3968) {
				xPos -= Math.pow(1.0385,xPos - 3968);
			}
			if (xPos <= 128) {
				xPos += Math.pow(1.0385,128 - xPos);
			}
			if (yPos >= 3968) {
				yPos -= Math.pow(1.0385,yPos - 3968);
			}
			if (yPos <= 128) {
				yPos += Math.pow(1.0385,128 - yPos);
			}
			
			this.path[i].x = xPos;
			this.path[i].y = yPos;
		}
		
		this.linearSmoothPath();
		this.interpolatePath(4);


		this.action = "walk";
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

		ctx.fillStyle = this.head.colour;
		ctx.beginPath();
		ctx.arc(this.target.x,this.target.y,5,0,2 * Math.PI);
		ctx.fill();
	}

	interpolatePath(degree: number) { //degree should be an integer between 2 and 5, inclusive
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

	calcKnots(knotCount: number, degree: number): Array<number> {
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

	interpolate(t: number, degree: number, knots: Array<number>) {
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
	  
		let d: Array<vector2> = [];

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

	convertPropsToString(): string {
		let result = "";
		result = result.concat("<a class='callout-label'> Health: </a>"+(Math.floor(this.health * 100) / 100)+" / "+this.properties.traits.health.value+"<br>");
		result = result.concat("<a class='callout-label'> Hunger: </a>"+(Math.floor(this.hunger * 100) / 100)+"<br>");
		result = result.concat("<a class='callout-label'> Position: </a>("+Math.floor(this.head.pos.x * 10) / 10+","+Math.floor(this.head.pos.y * 10) / 10+") <br>");
		result = result.concat("<a class='callout-label'> State: </a>"+this.state+"<br>");
		result = result.concat("<a class='callout-label'> Action: </a>"+this.action+"<br>");
		result = result.concat("<a class='callout-label'> Energy cost: </a>"+(Math.floor(this.energyPerTick * 100) / 100)+"<br>");
		result = result.concat("<a class='callout-label'> Age: </a>"+(Math.floor(this.age * 40) / 10)+"<br>");
		result = result.concat("<a class='callout-label'> Can sense food: </a>"+this.head.canSeeFood+"<br>");
		result = result.concat("<a class='callout-label'> Can sense foe: </a>"+this.head.canSenseFoe+"<br>");
		result = result.concat("<a class='callout-label'> Can sense friend: </a>"+this.head.canSenseFriend+"<br>");
		result = result.concat("<a class='callout-label'>Target food: </a>"+this.head.targetFood+"<br>");
		result = result.concat("<a class='callout-label'>Target enemy: </a>"+this.head.targetEnemy+"<br>");

		return result;
	}

	oldConvertPropsToString(): string {
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

		if (this.hunger > 100) {
			this.health -= (this.hunger / 100) * 0.05;
			if (this.hurtIndex <= -12) {
				this.hurtIndex = 6;
			}
		}
	}

	die() {
		this.state = "dead";
		this.health = 0;
		this.path = [this.head.pos];
		this.targetIndex = 0;

		for (let i = 1; i < this.tailStartIndex + 1; i++) {
			let segment = this.segments[i] as creatureBody;
			if (segment.legs.length > 0) {

				segment.legs[0].footPos = segment.legs[0].calcFootDeathPos();
				segment.legs[0].elbowPos = segment.legs[0].calcElbowPos(); 

				segment.legs[1].footPos = segment.legs[1].calcFootDeathPos();
				segment.legs[1].elbowPos = segment.legs[1].calcElbowPos();
			}
		}
	}

	behaviourTick() {
		if (this.health < 0) {
			this.die();
		} else {
			if (this.hurtIndex > -12) {
				this.hurtIndex -= 1;
			}
			
			let newRelationships = this.head.checkSenses(this.id,this.properties.traits.hearingDistance.value,this.properties.traits.visionDistance.value,this.properties.traits.visionAngle.value);
			if (newRelationships.length > 0) {
				for (let i = 0; i < newRelationships.length; i += 1) {
					this.calcAttitude(newRelationships[i]);
				}
			}
			this.updateHunger();
			this.age += 1 / 7200;
			if (!this.isMature) {
				if (this.age > 10) {
					this.isMature = true;
				} else if (this.age > 9) {
					if (Math.random() < 0.9) {
						this.isMature = true;
					}
				} else if (this.age > 8) {
					if (Math.random() < 0.6) {
						this.isMature = true;
					}
				} else if (this.age > 7) {
					if (Math.random() < 0.12) {
						this.isMature = true;
					}
				} else if (this.age > 6) {
					if (Math.random() < 0.02) {
						this.isMature = true;
					}
				}
			}
			this.behaviourTree();
		}
	}

	behaviourTree() {
		if (this.attacked) {
			if (this.attacker in this.head.relationships) {
				this.head.relationships[this.attacker].aggression -= 0.2;
				if (this.head.relationships[this.attacker].respect > 0.2 || this.hunger > 80) {
					//this.state = "deferrent";
					//this.followEnemy();
					this.state = "afraid";
					this.fleeEnemy();
				} else if (this.hunger > 40) {
					this.state = "afraid";
					this.fleeEnemy();
				} else {
					this.state = "defensive";
					this.defendEnemy();
				}
			} else {
				this.calcAttitude(this.attacker);
			}
		} else if (this.head.canSenseFoe) {
			if (this.head.targetEnemy in this.head.relationships) {
				if (this.head.relationships[this.head.targetEnemy].respect > 0.2) {
					this.state = "defensive";
					this.defendEnemy();
				} else {
					this.state = "aggressive";
					this.attackEnemy();
				}
			} else {
				this.state = "aggressive";
				this.attackEnemy();
			}
		} else if (this.hunger > 40) {
			this.state = "foraging";
			this.lookForFood();
		} else if (this.isMature) {
			if (this.hasMate) {
				if (Math.random() < 0.02) {
					this.state = "mating";
				}
			} else {
				this.state = "cloning";
			}
		} else if (this.head.canSenseFriend) {
			this.state = "friendly";
			this.followFriend();
		} else {
			this.state = "idle";
			this.followPath();
		}
	}

	lookForFood() {
		let targetFood: food | undefined = undefined;
		if (this.action != "sniff") {
			if (this.head.canSeeFood) {
				if (this.head.targetFood != "") {
					targetFood = entityDict[this.head.targetFood] as food;
					if (!targetFood.isHeld) {
						this.investigate(targetFood.pos);
						this.targetIndex = 0;
					} else {
						if (targetFood.isHeldBy in this.head.relationships) {
							if (this.head.relationships[targetFood.isHeldBy].respect < -0.2) {
								this.head.relationships[targetFood.isHeldBy].aggression -= 0.05;
							}
						} else {
							this.head.relationships[targetFood.isHeldBy] = new relationship(entityDict[targetFood.isHeldBy] as creature);
							this.head.relationships[targetFood.isHeldBy].aggression -= 0.1;
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

		if (targetFood != undefined) {
			if (this.head.pos.distance(targetFood.pos) < this.head.width) {
				this.action = "walk";	
				targetFood.isHeld = true;
				targetFood.isHeldBy = this.id;
				this.hunger -= targetFood.size * 4;
				this.generatePath(4);
			}
		}
	}

	investigate(sniffPos: vector2) {
		let sniffPath: Array<vector2> = [];
		
		sniffPath.push(sniffPos);

		for (let i = Math.PI / 4; i < 3 * Math.PI; i += 0.2) {
			sniffPath.push(new vector2((this.posFunc(i) * Math.cos(i)) + sniffPos.x,(this.posFunc(i) * Math.sin(i)) + sniffPos.y));
		}

		let interpGoal = sniffPath[sniffPath.length - 1];
		
		for (let i = 0; i < 1; i += 0.1) {
			sniffPath.push((this.head.pos.multiply(i)).add(interpGoal.multiply(1 - i)));
		}

		sniffPath.reverse();

		this.action = "sniff";
		this.path = sniffPath;
	}

	posFunc(i: number): number {
		let result = (Math.random() * 0.25 + 8) * (this.pathFunc(3 * i) - (0.4 * i));
		return result;
	}

	pathFunc(i: number): number {
		let result = -1 * Math.abs(Math.sin(i + ((Math.random() * 2) /2) * Math.abs(Math.sin(i))));
		return result;
	}

	
	takeDamage(damage: number, attacker: string) {
		if (this.health - damage <= 0) {
			this.die();
		} else {
			this.deferCooldown = 60 * Math.random() + 300;
			//this.health -= damage;
			this.attacker = attacker;
			this.attacked = true;
			if (!(attacker in this.head.relationships)) {
				this.calcAttitude(attacker);
			} else {
				this.head.relationships[attacker].respect += 0.2;
			}
			this.state = "hurt";
			if (this.hurtIndex <= -6) {
				this.hurtIndex = 6;
			}
		}
	}

	createBloodParticles(startPos: vector2) {
		for (let i = 0; i < Math.random() * 32 + 12; i++) {
			particleList.push(new particle(startPos,Math.random() * 0.5 + 0.05,Math.random() * 2 * Math.PI, Math.random() * 0.25 + 0.05,Math.random() * 20 + 40,"#FF1020"));
		}
	}


	calcAttitude(id: string) {
		this.head.relationships[id] = new relationship(entityDict[id] as creature);
		let creatureTraits = (entityDict[id] as creature).properties.traits;
		let aggression = 0;
		let respect = 0;

		for (let key in creatureTraits) {
			aggression += ((creatureTraits[key].display / (creatureTraits[key].max - creatureTraits[key].min)) * this.properties.traits[key].attitude[0]);
			respect += ((creatureTraits[key].display / (creatureTraits[key].max - creatureTraits[key].min)) * this.properties.traits[key].attitude[1]);
		}
		
		let personality = this.properties.personality;
		aggression += personality[0];
		respect += personality[1];

		let traitLength = (Object.keys(creatureTraits).length + 1);
		aggression /= traitLength;
		respect /= traitLength;

		this.head.relationships[id].aggression += aggression; 
		this.head.relationships[id].respect += respect;

		if (this.attacker == id) {
			this.head.relationships[id].respect += 0.2;
		}
		
		//for debug only, remove this whole section from here to the next comment
		if (Math.random() > 0.2) {
			this.head.relationships[id].aggression = -0.4;
		} else {
			this.head.relationships[id].aggression = 0.4;
		}
		//the next comment
	}

	fleeEnemy() {
		if (this.action != "fleeing") {
			this.targetIndex = 0;
			this.action = "fleeing";
		}
		
		let attacker = entityDict[this.attacker] as creature;
		let safeDistance = Math.max(attacker.properties.traits.visionDistance.display * 1.2,attacker.properties.traits.hearingDistance.display * 1.2) + (attacker.maxDist * attacker.length);
		let angleAway = -(attacker.head.pos.getAvgAngleRad(this.head.pos));
		let scale = this.properties.traits.speed.value * 50;
		
		if (attacker.head.targetEnemy == this.id || this.head.pos.distance(attacker.head.pos) < safeDistance) {
			this.target = this.head.pos.add(new vector2(Math.min(Math.max(scale * Math.cos(angleAway),128),3968),Math.min(Math.max(scale * Math.sin(angleAway),128),3968)));
		} else {
			this.backDown();
		}
		this.followPath();
	}

	defendEnemy() {
		if (this.head.targetEnemy != "") {
			let targetEnemy = entityDict[this.head.targetEnemy] as creature;
			if (targetEnemy.state != "dead") {
				let targetHeadPos = targetEnemy.head.pos;

				if (targetEnemy.head.canSenseFoe) {
					this.circleEnemy(targetEnemy.head.pos);
				} else {
					if (this.circleEnemy(targetHeadPos)) {
						this.attemptAttack(targetEnemy);
					}
				}
			} else {
				this.backDown();
			}
		} else {
			this.backDown();
		}
	}

	circleEnemy(enemyPos: vector2): boolean {
		let goalDistance = this.length * this.maxDist;
		let currentAngle = this.head.pos.getAvgAngleRad(enemyPos);
		let result = false;
		let angleStep = 0.2;
		if (currentAngle < Math.PI - angleStep) {
			this.target = new vector2(goalDistance * Math.cos(currentAngle - angleStep), goalDistance * Math.sin(currentAngle - angleStep)).add(this.head.pos);
		} else if (currentAngle > Math.PI + angleStep) {
			this.target = new vector2(goalDistance * Math.cos(currentAngle + angleStep), goalDistance * Math.sin(currentAngle + angleStep)).add(this.head.pos);
		} else {
			result = true;
		}
		this.followPath();
		return result;
	}

	attackEnemy() {
		if (this.head.targetEnemy != "") {
			let targetEnemy = entityDict[this.head.targetEnemy] as creature;
			if (targetEnemy.state != "dead") {
				if (targetEnemy.state == "deferrent") {
					this.head.relationships[this.head.targetEnemy].aggression += 0.2;
					this.head.targetEnemy = "";
					this.attacked = false;
				} else {
					if (this.checkGridHitbox(targetEnemy.id)) {
						this.action = "attack";
						this.target = targetEnemy.segments[2].pos;
					} else {
						let targetTailPos = targetEnemy.segments[targetEnemy.segments.length - 1].pos;
						this.target = targetTailPos;
						if (targetEnemy.state == "afraid") {
							if (targetEnemy.properties.traits.speed.display >= this.properties.traits.speed.value) {
								this.head.relationships[targetEnemy.id].aggression = -0.2;
								this.backDown();
							} else if (targetEnemy.head.pos.distance(this.head.pos) > this.properties.traits.visionDistance.value * 0.25) {
								this.head.relationships[targetEnemy.id].aggression = -0.2;
								this.head.relationships[targetEnemy.id].respect += 0.1;
								this.backDown();
							} else {
								this.target = this.getNearestSegment(targetEnemy.segments);
								this.action = "attack";
							}
						}
					}
					if (this.head.pos.distance(this.target) > this.head.width * 2) {
						let enemyAngle = this.target.getAvgAngleRad(this.head.pos);
						this.target = new vector2(this.head.width * 10 * Math.cos(enemyAngle),this.head.width * 10 * Math.sin(enemyAngle)).add(this.head.pos);
						this.action = "stalk";
						this.followPath();
						this.targetIndex = 0;
					} else {
						if (this.action == "backpedal") {
							this.followPath();
						} else if (this.action == "stalk") {
							this.target = this.getNearestSegment(targetEnemy.segments);
							this.action = "attack"
						} else if (this.action == "attack") {
							if (this.head.pos.distance(this.target) < this.head.width * 4) {
								this.attemptAttack(targetEnemy);
							} else {
								this.followPath();
							}
						}
					}
				}
			} else {
				this.backDown();
			}
		} else {
			this.backDown();
		}
	}

	checkGridHitbox(goalId: string): boolean {
		let result = false;
		for (let i = -2; i < 3; i += 1) {
			for (let j = -2; j < 3; j += 1) {
				let posGridId = posGrid[Math.min(Math.max(0,Math.floor(this.head.pos.x / 16))) + i][Math.min(Math.max(0,Math.floor(this.head.pos.y / 16))) + j];
				if (posGridId == goalId) {
					result = true;
				}
			}	
		}
		return result;
	}

	getNearestSegment(segments: Array<creatureJoint>): vector2 {
		let closest: [number,vector2] = [segments[0].pos.distance(this.head.pos),segments[0].pos];

		for (let i = 1; i < segments.length; i++) {
			let distance = segments[i].pos.distance(this.head.pos);
			if (distance < closest[0]) {
				closest = [distance,segments[i].pos];
			}
		}

		return closest[1];
	}

	backDown() {
		this.attacked = false;
		this.head.targetEnemy = "";
		this.state = "idle";
		this.action = "walk";
		this.generatePath(4);
		this.attackCooldown = 60;
	}

	attemptAttack(targetEnemy: creature) {
		if (targetEnemy.hurtIndex < 0) {
			this.createBloodParticles(this.target);
			targetEnemy.takeDamage(this.properties.traits.strength.value,this.id);
			this.head.relationships[targetEnemy.id].respect -= 0.05;
			this.attacked = false;
			this.action = "backpedal";
		}
		this.generateRecoverPath(targetEnemy.head.pos);
	}

	generateRecoverPath(targetTailPos: vector2): void {
		console.log(this.id);
		let angleBack = this.head.pos.getAvgAngleRad(targetTailPos);
		let backPath: Array<vector2> = [];
		let lastDistanceAway = 0;
		backPath.push(new vector2(this.properties.traits.speed.value * Math.cos(angleBack),this.properties.traits.speed.value * Math.sin(angleBack)).add(this.head.pos));
		
		while (lastDistanceAway < this.length * this.maxDist * 2) {
			let newPos = new vector2(this.properties.traits.speed.value * 30 * Math.cos(angleBack),this.properties.traits.speed.value * 30 * Math.sin(angleBack));
			newPos = newPos.add(backPath[backPath.length - 1]);
			backPath.push(newPos);
			lastDistanceAway = targetTailPos.distance(backPath[backPath.length - 1]);
		}
		this.targetIndex = 0;
		this.path = backPath;
	}

	followEnemy() {
		if (this.attacked) {
			let targetEnemy = entityDict[this.attacker] as creature;
			this.target = targetEnemy.segments[targetEnemy.segments.length - 1].pos;

			this.deferCooldown -= 1;

			if (this.deferCooldown <= 0) {
				this.attacked = false;
				this.state = "idle";
				this.head.targetEnemy = "";
				this.generatePath(4);
			}
		} 
		this.followPath();
	}

	followFriend() {
		this.followPath();
	}
	
	followPath() {
		let targDist = this.head.pos.distance(this.target);
		if (targDist > this.head.width * 1.5) {
			let delta = this.head.pos.subtract(this.target);
			delta = delta.divide(this.head.width * 2);
			delta = delta.multiply(this.properties.traits.speed.value);
			this.head.pos = this.head.pos.subtract(delta);
		} else {
			if (this.targetIndex + 1 < this.path.length) {
				this.targetIndex += 1;
				this.target = this.path[this.targetIndex];
			} else {
				this.action = "walk";
				this.generatePath(4);
			}
		}
	}

	quickSortSegments(unsorted: Array<creatureJoint>): Array<creatureJoint> {
		let result = unsorted;	
		if (unsorted.length > 1) {
			let pivot = Math.floor(unsorted.length / 2);
			let small = [];
			let equal = [];
			let large = [];

			for (let i = 0; i < unsorted.length; i++) {
				if (unsorted[i].pos.y > unsorted[pivot].pos.y) {
					large.push(unsorted[i]);
				} else if (unsorted[i].pos.y < unsorted[pivot].pos.y) {
					small.push(unsorted[i])
				} else {
					equal.push(unsorted[i]);
				}

				let small_sorted = this.quickSortSegments(small);
				let large_sorted = this.quickSortSegments(large);

				result = small_sorted.concat(equal).concat(large_sorted);
			}
		}
		return result;
	}


	update() {
		if (debugPrefs.drawPath) {
			this.drawPath();
		}
		if (debugPrefs.showId) {
			ctx.fillStyle = "#FAFAFA";
			ctx.font ="12px mono";
			ctx.fillText(this.id,this.segments[1].pos.x,this.segments[1].pos.y - this.head.width * 4);
		}

		if (debugPrefs.showState) {
			ctx.fillStyle = "#FAFAFA";
			ctx.font ="12px mono";
			ctx.fillText(this.state,this.segments[1].pos.x,this.segments[1].pos.y + this.head.width * 4);
		}
		this.head.angle = this.head.pos.getAvgAngleRad(this.head.childJoint.pos);
		let isVisible = false;
		for (let i = this.length - 1; i >= 0; i --) {
			if (this.segments[i].updateJoint(this.maxDist,this.state,this.hurtIndex >= 0)) {
				isVisible = true;
			}
			if (this.state == "mouseDragging" && !isPaused) {
				this.segments[i].moveByDrag(this.maxDist);
			}
		}

		if (isVisible) {
			this.segments = this.quickSortSegments(this.segments);
		}

		if (!isPaused && this.state != "mouseDragging") {
			if (this.state != "dead") {
				this.behaviourTick();
			}
		}
	}
}
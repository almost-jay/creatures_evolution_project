import { creatureTraits, relationship } from "./creatureTraits";
import { food } from "./food";
import { findClosestColour, preNames } from "./globals";
import { preColours, vector2, hexToRgb, generateId, randRange, camelCaseToTitle } from "./globals"
import { posGrid } from "./handleGrid";
import { isPaused, debugPrefs, ctx, entityDict, particleList, creaturesList, simPrefs } from "./initMain";
import { creatureJoint } from "./jointBase";
import { creatureBody } from "./jointBody";
import { creatureHead } from "./jointHead";
import { particle } from "./particle";

export class creature { //the parent class, which holds most of the info
	bodyLength: number = 0;
	maxDist: number = 0;
	weights: number = 0;
	size: number = 1;
	id: string = "";
	name: string = "";
	segments: Array<creatureJoint> = [];
	head: creatureHead = new creatureHead(new vector2(0,0),0,"#000000",0,0,"#000000",false,0,0);
	properties: creatureTraits = new creatureTraits(null);
	stateChangeCooldown: number = 90;
	state: string = "idle";
	action: string = "walk";
	health: number = 1;
	hunger: number = 0;
	age: number = 0;
	maturityAge: number = 3;
	isMature: boolean = false;
	path: Array<vector2> = [];
	target: vector2 = new vector2(0,0);
	targetIndex: number = 0;
	tailStartIndex: number = 0;
	energyPerTick: number = 0;
	attacker: null|creature = null;
	mate: null|creature = null;
	hurtIndex: number = -12;
	deferCooldown: number = 0;
	attackCooldown: number = 0;
	isBackwards: boolean = false;
	heldFood: null|food = null;
	entityType: string = "creature";

	constructor(pos: vector2, bodyLength: number, maxDist: number, parentProps: Array<creatureTraits> | null, id: string) {
		this.properties = new creatureTraits(parentProps); //needs to generate creature traits
		this.energyPerTick = this.calcEnergyPerTick();

		this.bodyLength = bodyLength; //bodyLength is the number of segments
		this.maxDist = Math.floor((maxDist - 4) * ((this.properties.traits.hearingDistance.display - this.properties.traits.hearingDistance.min) / (this.properties.traits.hearingDistance.max - this.properties.traits.hearingDistance.min)) + 8); 
		//^ the separation between body segments
		this.weights = Math.floor(this.properties.traits.speed.display * 1.8); //the number of legs it'll have

		this.maturityAge = (Math.cbrt(Math.random()) + 10) / 4;

		if (id != "") { //if an ID is given, that becomes the new ID, if not, it gotta generate an id
			this.id = id;
		} else {
			this.id = generateId();
		}
		entityDict[this.id] = this; //inserts itself into the entity dict

		this.name = preNames[Math.floor(Math.random() * preNames.length)]; //picks random name from list of names
		this.health = this.properties.traits.health.value; //sets its health to its maxHealth
		
		//sets the size to be relative to the displayed health trait, as well as the creature's age
		this.updateSize();

		this.segments = [];
		this.initJoints(pos); //creates a bunch of segments

		this.generatePath(3); //generates a starting path
		this.behaviourTree(); //and finally, calculates state

	}

	loadProperty(key: string, rawValue: any) { //takes a property, if it has that property, changes itself to match it
		if (this.hasOwnProperty(key)) {
			let alteredProp = this[key as keyof creature];
			let value = rawValue as typeof alteredProp;
			alteredProp = value;
		}
	}

	calcEnergyPerTick(): number { //just sums up the tick energy cost based on its traits
		let result = 0;

		for (let key in this.properties.traits) {
			result += this.properties.traits[key].cost;
		}

		return result;
	}

	updateSize(): void {
		//the size is based on the health of the creature as well as its age
		this.size = ((((this.properties.traits.health.display - this.properties.traits.health.min) / (this.properties.traits.health.max - this.properties.traits.health.min)) * (this.age + 0.5 / this.maturityAge + 0.5)) + 0.5);
	}

	initJoints(pos: vector2) { //creates a bunch of new joints, each one with a width and colour as dictated
		let bodyCount = Math.floor(0.6 * this.bodyLength);
		let bodyColour = this.generateColours();
		let baseWidth = 8; //the standard width of one joint, as the canvas sees it

		let eyeLightness = Math.round((1 - ((this.properties.traits.visionDistance.display - 16) / 500)) * 16).toString(16);
		if (eyeLightness.length == 1) {
			eyeLightness = "#"+eyeLightness+eyeLightness+eyeLightness+eyeLightness+eyeLightness+eyeLightness;
		} else {
			eyeLightness = "#"+eyeLightness+eyeLightness+eyeLightness;
		}

		this.head = new creatureHead(pos,0,bodyColour[0],baseWidth * 1.3 * this.size,baseWidth * 0.5 * this.size * ((this.properties.traits.visionAngle.display * 0.25) + 0.65),eyeLightness,false, 0, 0);
		this.segments.push(this.head);
		for (let i = 1; i < this.bodyLength - 1; i++ ) {
			let jointPos = pos.add(new vector2(i * this.maxDist * this.size,i * this.maxDist * this.size));
			if (i < bodyCount) {
				let hasLegs = this.calcLegs(bodyCount, i);
				if (hasLegs) {
					this.tailStartIndex = i;
				}
				this.segments.push(new creatureBody(jointPos,i,bodyColour[i],Math.max(0.6,this.calcBodyWidth(bodyCount,i)) * baseWidth * this.size,hasLegs,this.size * baseWidth * 2, this.size * baseWidth));
			} else {
				this.segments.push(new creatureBody(jointPos,i,bodyColour[i],Math.max(0.4,this.calcTailWidth(bodyCount, this.bodyLength - i) + 0.1) * baseWidth * this.size,false,0,0));
			}
		}
		this.segments.push(new creatureJoint(pos.add(new vector2(this.bodyLength * this.size * this.maxDist,this.bodyLength * this.size * this.maxDist)),this.bodyLength - 1,bodyColour[this.bodyLength - 1],this.calcTailWidth(bodyCount,this.bodyLength) * this.size * baseWidth));
		
		for (let i = 0; i < this.bodyLength - 1; i++) {
			this.segments[i].childJoint = this.segments[i + 1];
		}

		for (let i = 1; i < this.tailStartIndex + 1; i++) {
			this.segments[i].backChildJoint.push(this.segments[i - 1]);
		}

		for (let i = this.tailStartIndex; i < this.bodyLength - 1; i++) {
			this.segments[i].backChildJoint.push(this.segments[i + 1])
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

	calcTailWidth(bodyCount: number, x: number): number {
		let result = Math.abs(x / (this.bodyLength - bodyCount));
		return result;
	}

	calcLegs(bodyCount: number, x: number): boolean {
		let result = false;
		for (let i = 1; i <= this.weights; i++ ) {
			let period = Math.floor(i * ((Math.PI * 2) / (Math.PI / ((1.0 / ((2 * this.weights) + 0.8)) * bodyCount))));
			if (x == period) {
				result = true;
			}
		}
		return result;
	}

	generateColours(): Array<string> { //creates the colours for each creature
		let r = (this.properties.traits["strength"].display / this.properties.traits["strength"].max) * 255;
		let g = (this.properties.traits["toxicity"].display / this.properties.traits["toxicity"].max) * 255;
		let b = ((this.properties.traits["diet"].display + 1) / (this.properties.traits["diet"].max + 1)) * 255;

		let colour1 = hexToRgb(preColours[findClosestColour(r,g,b)]);

		let colour2Ind = Math.floor(Math.random() * 12);
		while (colour2Ind > preColours.length) {
			colour2Ind -= preColours.length;
		}

		let colour2 = hexToRgb(preColours[colour2Ind]);

		let colourRes: Array<string> = [];
		let inc = 1 / this.bodyLength; //reciprocal of length
		for (let i = 0; i < this.bodyLength; i++) { //creates gradient between two given colours, pushing the results into an array
			let r = colour1[0] * (1 - (inc * i)) + (colour2[0] * (inc * i));
			let g = colour1[1] * (1 - (inc * i)) + (colour2[1] * (inc * i));
			let b = colour1[2] * (1 - (inc * i)) + (colour2[2] * (inc * i));
			colourRes.push("rgb("+r+","+g+","+b+")");
		}

		return colourRes;

	}

	generatePath(alpha: number): void { //note that alpha of 3 is most stable
		this.isBackwards = false;
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
		
		this.interpolatePath(3); //note that a polynomial of degree 3 tends to give the most numerically stable result

		this.action = "walk";
		this.target = this.path[0];
	}

	drawPath(): void { //only enabled if the command is enabled, draws the section of path the creature hasn't reached yet
		ctx.strokeStyle = this.head.colour;
		ctx.fillStyle = this.segments[this.bodyLength - 1].colour;
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

	interpolatePath(degree: number): void { //degree should be an integer between 2 and 5, inclusive
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

	calcKnots(knotCount: number, degree: number): Array<number> { //evaluates knots based on goal knot count + degree of polynomial
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

	interpolate(t: number, degree: number, knots: Array<number>): vector2 { //de boor's algorithm
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

	
	updateInfoPanel(): void { //writes to callout info panel with own information
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

	convertPropsToString(): string { //creates an HTML readout of all properties/attributes
		let result = "";
		result = result.concat("<a class='callout-label'> Name: </a>"+this.name+"<br>");
		result = result.concat("<a class='callout-label'> Hunger: </a>"+(Math.floor(this.hunger * 100) / 100)+"<br>");
		result = result.concat("<a class='callout-label'> Position: </a>("+(Math.floor(this.head.pos.x * 10) / 10+","+Math.floor(this.head.pos.y * 10) / 10)+") <br>");
		result = result.concat("<a class='callout-label'> State: </a>"+this.state+"<br>");
		result = result.concat("<a class='callout-label'> Action: </a>"+this.action+"<br>");
		result = result.concat("<a class='callout-label'> Energy cost: </a>"+(Math.floor(this.energyPerTick * 100) / 100)+"<br>");
		result = result.concat("<a class='callout-label'> Age: </a>"+(Math.floor(this.age * 40) / 10)+"<br>");
		result = result.concat("<a class='callout-label'> Is mature: </a>"+this.isMature+"<br>");
		if (this.head.targetFood != null) {
			result = result.concat("<a class='callout-label'>Target food: </a>"+this.head.targetFood.id+"<br>");
		}
		if (this.head.targetEnemy != null) {
			result = result.concat("<a class='callout-label'>Target enemy: </a>"+this.head.targetEnemy.id+"<br>");
		}
		if (this.heldFood != null) {
			result = result.concat("<a class='callout-label'>Held food: </a>"+this.heldFood.id+"<br>");
		}
		if (this.mate != null) {
			result = result.concat("<a class='callout-label'>Mate: </a>"+this.mate.id+"<br>");
		}
		
		for (let traitKey in this.properties.traits) {
			let traitName = camelCaseToTitle(traitKey);
			if (traitKey == "health") {
				result = result.concat("<a class='callout-label'>Health: </a>"+(Math.floor(this.health * 100) / 100)+" / "+Math.floor((this.properties.traits.health.value * 100) / 100)+"<br>");
			} else {
				result = result.concat("<a class='callout-label'>"+traitName+": </a>"+(Math.floor(this.properties.traits[traitKey].value * 100) / 100)+"<br>");
			}
			if (this.properties.traits[traitKey].value != this.properties.traits[traitKey].display) {
				result = result.concat("<a class='callout-label'>&emsp;Displayed "+traitName+": </a>"+(Math.floor(this.properties.traits[traitKey].display * 100) / 100)+"<br>");
			}
			result = result.concat("<a class='callout-label'>&emsp;Energy cost: </a>"+(Math.floor(this.properties.traits[traitKey].cost * 100) / 100)+"<br>");
		}

		return result;
	}

	updateHunger(): void { //every turn, makes the creature's hunger go up + heals it if applicable
		let totalHungerCost = 0;

		let traitKeys = Object.keys(this.properties.traits);
		for (let i = 0; i < traitKeys.length; i++) {
			totalHungerCost += this.properties.traits[traitKeys[i]].cost;
		}
		totalHungerCost /= traitKeys.length;
		this.hunger += totalHungerCost * simPrefs.timeScale * 0.05;

		if (this.hunger > 100) {
			this.health -= (this.hunger / 100) * 0.05;
			if (this.hurtIndex <= -12) {
				this.hurtIndex = 6;
			}
		} else if (this.hunger < 10 && this.health < this.properties.traits.health.value) {
			this.health += 0.25; //if it's relatively full, health goes up
		}
	}

	die(cause: string) { //used to set up the whole death state
		console.log(this.name+" died "+cause); //fun little easter egg
		this.state = "dead";
		this.health = 0;
		this.path = [this.head.pos];
		this.targetIndex = 0;

		for (let i = 1; i < this.tailStartIndex + 1; i++) {
			let segment = this.segments[i] as creatureBody;
			if (segment.legs.length > 0) {

				segment.legs[0].footPos = segment.legs[0].calcFootDeathPos();
				segment.legs[0].elbowPos = segment.legs[0].calcElbowPos(this.isBackwards); 

				segment.legs[1].footPos = segment.legs[1].calcFootDeathPos();
				segment.legs[1].elbowPos = segment.legs[1].calcElbowPos(this.isBackwards);
			}
		}
	}

	behaviourTick(): void { //checks for potential death state, decrements cooldowns, controls head vision, triggers other calls; basically the CNS of the creature
		if (this.health < 0) {
			this.die("under mysterious circumstances.");
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

			if (this.attackCooldown > 0) {
				this.attackCooldown--;
			}
			this.updateHunger();
			this.age += simPrefs.timeScale / 720;
			if (this.heldFood != null) {
				this.heldFood.pos = this.head.pos;
			}

			if (!this.isMature) {
				this.updateSize();
				for (let i = 0; i < this.segments.length; i++) {
					this.segments[i].displayedWidth = this.segments[i].width * this.size;
				}
				if (this.age > this.maturityAge) {
					this.isMature = true;
				}
				
			} else if (this.age > 12) {
				if (Math.random() < Math.pow(1.5,this.age - 24)) {
					this.die("from old age!");
				}
			}
			if (this.stateChangeCooldown < 0) {
				this.stateChangeCooldown = 90;
				this.behaviourTree();
			} else {
				this.stateChangeCooldown --;
			}
			this.stateMachineAction(); //causes the creature to act based on whatever its current state is, must be called every tick
		}
	}

	behaviourTree(): void { //uses try/catch behaviour rather than immediately setting new state, sort of like the frontal lobe
		this.isBackwards = false;
		let newState = this.state;
		if (this.attacker != null) {
			if (this.attacker.id in this.head.relationships) {
				if (this.head.relationships[this.attacker.id].respect * simPrefs.universalRespect * this.attacker.size > 0.4 || this.hunger > 60) {
					newState = "deferrent";
				} else if (this.hunger > 60) {
					newState = "afraid";
				} else {
					newState = "defensive";
				}
			} else {
				this.calcAttitude(this.attacker);
			}
		} else if (this.head.targetEnemy != null) {
			if (this.head.targetEnemy.id in this.head.relationships) {
				if (this.properties.traits["diet"].value < randRange(-0.5,0.5) && this.hunger > 40) {
					newState = "aggressive";
				} else if ((this.head.relationships[this.head.targetEnemy.id].respect * simPrefs.universalRespect * this.head.targetEnemy.size > 0.1 && this.head.targetEnemy.state == "aggressive") && this.attackCooldown >= 0) {
					newState = "defensive";
				} else {
					if (this.id in this.head.targetEnemy.head.relationships) {
						if (this.head.targetEnemy.head.relationships[this.id].aggression < -0.2) {
							newState = "afraid"; //runs away if enemy thinks badly of it
						} else {
							newState = "aggressive";
						}
					} else {
						newState = "defensive";
					}
				}
			} else {
				this.calcAttitude(this.head.targetEnemy);
				newState = "aggressive";
			}
		} else if (this.hunger > 40) {
			if (this.properties.traits["diet"].value > randRange(-0.5,0.5)) {
				newState = "foraging";
			} else {
				if (this.head.canSenseCreatures) {
					newState = "aggressive";
				}
			}
		} else if (this.isMature && Math.random() < 0.75) {
			if (this.mate != null) {
				newState = "mating";
			} else if (Math.random() < 0.02){
				newState = "cloning";
			}
		} else if (this.head.targetFriend != null) {
			newState = "friendly";
		} else {
			newState = "idle";
		}

		if (newState != this.state) {
			this.state = newState; //if it calculates a new state, regenerates path and updates self
			this.generatePath(3);
		}
	}

	stateMachineAction(): void { //think of this as the functional area of the brain, executing decisions
		switch (this.state) {
			case "idle":
				this.followPath(); //follows the path, no special behaviour
				break;
			case "friendly":
				this.followFriend(); //follows the path while remaining close to a friend
				break;
			case "foraging":
				this.lookForFood(); //similar behaviour to followPath, but will break to investigate if it detects food
				break;
			case "aggressive":
				this.attackEnemy(); //attack behaviour, see inside for details
				break;
			case "defensive":
				this.defendEnemy(); //defensive behaviour, see inside for details - should probably be "defend AGAINST enemy" but naming conventions
				break;
			case "deferrent":
				this.followEnemy(); //cowardly/follower behaviour
				break;
			case "afraid":
				this.fleeEnemy(); //cowardly/fleeing behaviour
				break;
			case "mating":
				this.attemptMate(); //if its partner is also mating, triggers children
				break;
			case "cloning":
				this.cloneSelf(); //if it has no partner (far more likely) this is triggered instead
				break;
		}
	}

	lookForFood(): void {
		if (this.heldFood != null) { //first, if it is holding food and it hasn't already eaten it, it eats it
			this.heldFood.isEaten = true;
			this.hunger -= this.heldFood.size * 4;
			this.heldFood = null;
			this.head.targetFood = null;
			this.behaviourTree();
		} else {
			if (this.action != "sniff") { //if it isn't already investigating...
				if (this.head.targetFood != null) {
					if (this.head.targetFood.isHeldBy == null) {
						this.investigate(this.head.targetFood.pos); //investigate target food (closest food detected)
						this.targetIndex = 0;
					} else {
						if (this.head.targetFood.isHeldBy.id in this.head.relationships) {
							if (this.head.relationships[this.head.targetFood.isHeldBy.id].respect * simPrefs.universalRespect < -0.2) {
								this.head.relationships[this.head.targetFood.isHeldBy.id].aggression -= 0.1;
							}
						} else {
							this.head.relationships[this.head.targetFood.isHeldBy.id] = new relationship(this.head.targetFood.isHeldBy);
							this.head.relationships[this.head.targetFood.isHeldBy.id].aggression -= 0.4;
						}
						this.head.targetFood = null;
					}
				} else {
					this.followPath();
				}
			} else {
				this.followPath();
			}
			if (this.head.targetFood != null) {
				if (!this.head.targetFood.isEaten && this.head.targetFood.isHeldBy != null) {
					if (this.head.pos.distance(this.head.targetFood.pos) < this.head.width) {
						this.action = "walk";	
						this.head.targetFood.isHeldBy = this;
						this.head.targetFood.isEaten = true;
						this.hunger -= this.head.targetFood.size * 4;
						this.behaviourTree();
					}
				}
				this.followPath();
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

	posFunc(i: number): number { //spiralling function
		let result = (Math.random() * 0.25 + 8) * (this.pathFunc(3 * i) - (0.4 * i));
		return result;
	}

	pathFunc(i: number): number { //sinusoidal asymmetric wave wrapped around spiral, see above
		let result = -1 * Math.abs(Math.sin(i + ((Math.random() * 2) /2) * Math.abs(Math.sin(i))));
		return result;
	}

	
	takeDamage(damage: number, attacker: creature) {
		if (this.health - damage <= 0) {
			this.die("in combat with "+attacker.name);
		} else {
			this.deferCooldown = 60 * Math.random() + 300;
			this.health -= damage;
			this.attacker = attacker;
			if (!(attacker.id in this.head.relationships)) {
				this.calcAttitude(attacker);
			} else {
				this.head.relationships[attacker.id].respect += 0.2;
			}
			this.state = "hurt";
			if (this.hurtIndex <= -6) {
				this.behaviourTree();
				this.hurtIndex = 6;
			}
		}
	}

	createBloodParticles(startPos: vector2) { //this is the only use of the particle system rn :(
		for (let i = 0; i < Math.random() * 32 + 12; i++) {
			particleList.push(new particle(startPos,Math.random() * 0.5 + 0.05,Math.random() * 2 * Math.PI, Math.random() * 0.25 + 0.05,Math.random() * 20 + 40,"#FF1020"));
		}
	}


	calcAttitude(reference: creature) { //calculates how a creature feels about another creature based on its personality and attitude values
		this.head.relationships[reference.id] = new relationship(reference);
		let creatureTraits = reference.properties.traits;
		let aggression = -1;
		let respect = 1;

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

		this.head.relationships[reference.id].aggression += aggression; 
		this.head.relationships[reference.id].respect += respect;

		if (this.attacker == reference) {
			this.head.relationships[reference.id].respect += 0.2;
			this.head.relationships[reference.id].aggression -= 0.1;
		}
	}

	fleeEnemy(): void { //runs away!
		this.state = "afraid";
		if (this.action != "fleeing") {
			this.targetIndex = 0;
			this.action = "fleeing";
		}
		
		if (this.attacker != null) {
			let safeDistance = Math.max(this.attacker.properties.traits.visionDistance.display * 1.2,this.attacker.properties.traits.hearingDistance.display * 1.2) + (this.attacker.maxDist * this.attacker.bodyLength);
			let angleAway = -(this.attacker.head.pos.getAvgAngleRad(this.head.pos)) + ((Math.random() - 0.5) * 0.5);
			let scale = this.properties.traits.speed.value * 50 * this.size;
			
			if (this.attacker.head.targetEnemy == this && this.head.pos.distance(this.attacker.head.pos) < safeDistance) {
				this.target = this.head.pos.add(new vector2(Math.min(Math.max(scale * Math.cos(angleAway),128),3968),Math.min(Math.max(scale * Math.sin(angleAway),128),3968)));
			} else {
				this.backDown();
			}
			this.followPath();
		} else {
			this.backDown();
		}
	}

	defendEnemy(): void { //if the enemy is too close, it retreats, and once it's out of sight it tries to attack
		if (this.head.targetEnemy != null) {
			if (this.head.targetEnemy.state != "dead") {
				this.path = [this.head.pos,this.head.pos];
				this.targetIndex = 0;
				let targetHeadPos = this.head.targetEnemy.head.pos;
				ctx.strokeStyle = "#FF0000FF";
				ctx.lineWidth = 4;

				let angleAway = this.head.pos.getAvgAngleRad(targetHeadPos);
				let goalDistance = this.bodyLength * this.maxDist * 0.75;
				if (targetHeadPos.distance(this.head.pos) < goalDistance) {
					if (this.head.targetEnemy.properties.traits.speed.display < this.properties.traits.speed.value * this.size) {
						this.attacker = this.head.targetEnemy;
						this.fleeEnemy();
					} else {
						this.isBackwards = true;
						this.target = new vector2(goalDistance * Math.cos(angleAway),goalDistance * Math.sin(angleAway)).add(targetHeadPos);
						this.followPath();
					}
					
				} else {
					if (this.attackCooldown < 0 && (!(this.head.targetEnemy.head.targetEnemy != null || this.head.targetEnemy.state == "defensive") && this.head.relationships[this.head.targetEnemy.id].respect > this.head.targetEnemy.head.relationships[this.id].respect)) {
						if (this.head.pos.distance(this.target) < this.maxDist * 6) {
							this.attemptAttack(this.head.targetEnemy);
						}
					} else {
						let direction = 0.05;
						if (angleAway - this.head.targetEnemy.head.angle - Math.PI > 0) {
							direction *= -1;
						}
						this.isBackwards = true;
						this.target = new vector2((this.head.pos.distance(targetHeadPos) + this.maxDist * this.size * 3) * Math.cos(angleAway + direction),(this.head.pos.distance(targetHeadPos) + this.maxDist * this.size * 3) * Math.sin(angleAway + direction)).add(targetHeadPos);
						this.followPath();
					}
				}
			} else {
				this.backDown();
			}
		} else {
			this.backDown();
		}
	}


	attackEnemy(): void { //attempts a lunge at the enemy
		this.state = "aggressive"
		if (this.head.targetEnemy == null) {
			if (this.properties.traits["diet"].value < randRange(-0.5,0.5) && this.hunger > 40 && this.head.canSenseCreatures) {
				if (this.head.sensedCreatures.length > 0) {
					let shortestDist = this.head.pos.distance(this.head.sensedCreatures[0].head.pos);
					this.head.targetEnemy = this.head.sensedCreatures[0];
					for (let i = 0; i < this.head.sensedCreatures.length; i++) {
						let checkedDistance = this.head.pos.distance(this.head.sensedCreatures[i].head.pos);
						if (checkedDistance < shortestDist) {
							shortestDist = checkedDistance;
							this.head.targetEnemy = this.head.sensedCreatures[i];
						}
					}
				} else {
					this.backDown();
				}
			} else {
				this.backDown();
			}
		} else {
			if (this.head.targetEnemy.state != "dead") {
				if (this.head.targetEnemy.state == "deferrent" && this.hunger < 40) {
					this.head.relationships[this.head.targetEnemy.id].aggression += 0.2;
					this.head.targetEnemy = null;
					this.attacker = null;
				} else {
					if (this.checkGridHitbox(this.head.targetEnemy.id)) {
						this.action = "attack";
						this.target = this.head.targetEnemy.segments[2].pos;
					} else {
						let targetTailPos = this.head.targetEnemy.segments[this.head.targetEnemy.segments.length - 1].pos;
						this.target = targetTailPos;
						if (this.head.targetEnemy.state == "afraid") {
							if (this.head.targetEnemy.properties.traits.speed.display >= this.properties.traits.speed.value * this.size) {
								this.head.relationships[this.head.targetEnemy.id].aggression += 0.02;
								this.backDown();
							} else if (this.head.targetEnemy.head.pos.distance(this.head.pos) > this.properties.traits.visionDistance.value * 0.25) {
								this.head.relationships[this.head.targetEnemy.id].aggression += 0.02;
								this.head.relationships[this.head.targetEnemy.id].respect += 0.1;
								this.backDown();
							} else {
								this.target = this.getNearestSegment(this.head.targetEnemy.segments);
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
						if (this.action == "stalk") {
							this.target = this.getNearestSegment(this.head.targetEnemy.segments);
							this.action = "attack"
						} else if (this.action == "attack") {
							if (this.head.pos.distance(this.target) < this.head.width * 4) {
								this.attemptAttack(this.head.targetEnemy);
								this.isBackwards = false;
							} else {
								this.followPath();
							}
						} else {
							this.followPath();
						}
					}
				}
			} else {
				this.backDown();
			}
		}
	}

	checkGridHitbox(goalId: string): boolean { //looks to see if there is a creature around itself
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

	getNearestSegment(segments: Array<creatureJoint>): vector2 { //finds the closest enemy segment (so it can BITE it >:3)
		let closest: [number,vector2] = [segments[0].pos.distance(this.head.pos),segments[0].pos];

		for (let i = 1; i < segments.length; i++) {
			let distance = segments[i].pos.distance(this.head.pos);
			if (distance < closest[0]) {
				closest = [distance,segments[i].pos];
			}
		}

		return closest[1];
	}

	backDown(): void { //reset state, retreat
		this.isBackwards = false;
		this.attacker = null;
		this.head.targetEnemy = null;
		this.state = "idle";
		this.action = "walk";
		this.generatePath(3);
		this.attackCooldown = 60;
	}

	attemptAttack(targetEnemy: creature): void { //immediately deals damage to the target if it's not on cooldown/in i-frames
		if (targetEnemy.hurtIndex < 0) {
			this.createBloodParticles(this.target);
			targetEnemy.takeDamage(this.properties.traits.strength.value * 0.2,this);
			if (!(targetEnemy.id in Object.keys(this.head.relationships))) {
				this.calcAttitude(targetEnemy);
			}
			this.head.relationships[targetEnemy.id].respect -= 0.05;
			
			this.attacker = null;
			this.attackCooldown = 60;
			this.hunger += this.properties.traits["strength"].cost * 5;
			this.hunger += Math.max(0,this.properties.traits["diet"].value * targetEnemy.health);
			this.takeDamage((targetEnemy.properties.traits["toxicity"].value * targetEnemy.properties.traits["health"].value) / 4,targetEnemy);
		}
		this.generateRecoverPath(targetEnemy.head.pos);
		if (this.stateChangeCooldown < 0) {
			this.behaviourTree();
		}
	}

	generateRecoverPath(targetTailPos: vector2): void { //makes creature retreat
		let angleBack = this.head.pos.getAvgAngleRad(targetTailPos);
		let backPath: Array<vector2> = [];
		backPath.push(new vector2(this.properties.traits.speed.value * Math.cos(angleBack),this.properties.traits.speed.value * Math.sin(angleBack)).add(this.head.pos));
		let lastDistanceAway = targetTailPos.distance(backPath[0]);
		
		while (lastDistanceAway < this.bodyLength * this.maxDist * 2 && lastDistanceAway != 0) { //the != 0 is in here to prevent infinite while loop
			let newPos = new vector2(this.properties.traits.speed.value * 30 * Math.cos(angleBack),this.properties.traits.speed.value * 30 * Math.sin(angleBack));
			newPos = newPos.add(backPath[backPath.length - 1]);
			backPath.push(newPos);
			lastDistanceAway = targetTailPos.distance(backPath[backPath.length - 1]);
		}
		this.targetIndex = 0;
		this.path = backPath;
	}

	followEnemy(): void {
		if (this.attacker != null) {
			this.target = this.attacker.segments[this.attacker.segments.length - 1].pos;
			this.deferCooldown -= 1;

			if (this.deferCooldown <= 0) {
				this.attacker = null;
				this.state = "idle";
				this.head.targetEnemy = null;
				this.generatePath(3);
			}
		} 
		this.followPath();
	}

	followFriend(): void { //If it's too far away, gets closer to its friend :)
		if (this.head.targetFriend != null) {
			if (this.head.targetFriend.state == "idle" || this.head.targetFriend.state == "foraging" || this.head.targetFriend.state == "friendly") {
				if (this.head.targetFriend.hunger > 40) {
					if (this.heldFood != null) {
						if (this.head.pos.distance(this.head.targetFriend.head.pos) < this.maxDist) {
							this.head.targetFriend.hunger -= this.heldFood.size * 4;
							this.heldFood.isEaten = true;
							this.heldFood = null;
							this.head.targetFood = null;
						} else {
							this.target = this.head.targetFriend.head.pos;
						}
					}
				} else if (this.head.pos.distance(this.head.targetFriend.head.pos) < this.maxDist * 2) {
					this.target = (this.path[this.targetIndex].add(this.head.targetFriend.head.pos)).divide(2);
				}
				
				if (this.isMature) {
					if (this.id in this.head.targetFriend.head.relationships) {
						if (this.head.relationships[this.head.targetFriend.id].respect * simPrefs.universalRespect + this.head.relationships[this.head.targetFriend.id].aggression * simPrefs.universalHostility >= 0.7) {
							if (this.head.targetFriend.head.relationships[this.id].respect * simPrefs.universalRespect + this.head.targetFriend.head.relationships[this.id].aggression * simPrefs.universalHostility >= 0.7) {
								if (this.head.targetFriend.mate == null) {
									//If it thinks positively of another mature creature, and that is reciprocated, and neither have mates, they become mates
									this.mate = this.head.targetFriend;

									this.head.targetFriend.mate = this;
								}
							}
						}
					}
				}
			}
		}
		this.followPath();
	}
	
	followPath(): void {
		let isSeekingFood = false;
		if (this.state == "idle") {
			isSeekingFood = this.nearbyFoodCheck();
		}
		
		let leader: creatureJoint = this.head;
		if (this.isBackwards) {
			leader = this.segments[this.tailStartIndex];
		}

		let targDist = leader.pos.distance(this.target);
		if (targDist > this.maxDist) {
			let delta = leader.pos.subtract(this.target);
			delta = delta.divide(this.head.width * 2);
			delta = delta.multiply(this.properties.traits.speed.value * 1.75 + this.size * 0.25);
			leader.pos = leader.pos.subtract(delta);
		} else if (!isSeekingFood) {
			if (this.targetIndex + 1 < this.path.length) {
				this.targetIndex += 1;
				this.target = this.path[this.targetIndex];
			} else {
				this.action = "walk";
				this.generatePath(3);
			}
		}
	}

	nearbyFoodCheck(): boolean {
		let result = false;
		if (this.heldFood == null && this.properties.traits["diet"].value > randRange(-0.5,0.5)) {
			if (this.head.targetFood != null && !this.head.targetFood.isEaten) {
				if (this.head.pos.distance(this.head.targetFood.pos) < 64) {
					result = true;
					if (this.head.pos.distance(this.head.targetFood.pos) > this.maxDist * 2) {
						this.target = this.head.targetFood.pos;
					} else {
						this.heldFood = this.head.targetFood;
						this.head.targetFood.isHeldBy = this;
						this.head.targetFood = null;
						this.generatePath(3);
					}
				}
			}
		}
		return result;
	}

	attemptMate(): void { //tiny chance that they'll produce kids and die
		if (this.mate != null) {
			if (this.mate.state == "mating") {
				this.path = [];
				let r = ((this.bodyLength * this.maxDist * 0.5) / Math.PI / 2) + ((this.mate.bodyLength * this.mate.maxDist * 0.5) / Math.PI / 2);
				let avgPos = new vector2(0,0);
				for (let i = 0; i < Math.PI * 2; i += 0.1) {
					this.path.push(new vector2(r * Math.cos(i), r * Math.sin(i)));
					avgPos = avgPos.add(this.path[this.path.length - 1]);
				}
				avgPos = avgPos.divide(this.path.length);
				if (this.targetIndex >= this.path.length - 1) {
					for (let i = 0; i < randRange(0,3); i++) {
						creaturesList.push(new creature(avgPos,this.bodyLength,this.maxDist,[this.properties,this.mate.properties],""));
					}
				}
				
				this.die(" after reproducing with "+this.mate.name);

				this.followPath();
			} else {
				this.backDown();
			}
		} else {
			this.backDown();
		}

	}

	cloneSelf(): void {
		this.path = [];
		let r = (this.bodyLength * this.maxDist * 0.5) / Math.PI / 2;
		let avgPos = new vector2(0,0);
		for (let i = 0; i < Math.PI * 2; i++) {
			this.path.push((new vector2(r * Math.cos(this.head.angle + i), r * Math.sin(this.head.angle + i))).add(this.head.pos));
			avgPos = avgPos.add(this.path[this.path.length - 1]);
		}
		avgPos = avgPos.divide(this.path.length);

		if (this.targetIndex >= this.path.length - 1) {
			for (let i = 0; i < randRange(1,3); i++) {
				creaturesList.push(new creature(avgPos,this.bodyLength,this.maxDist,[this.properties,this.properties],""));
			}
			this.die("after cloning itself.");
		}

		this.followPath();
	}

	update(): void {
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
			ctx.fillText(this.state,this.segments[1].pos.x,this.segments[1].pos.y + this.head.displayedWidth * 4);
			ctx.fillText(this.action,this.segments[1].pos.x,this.segments[1].pos.y + this.head.displayedWidth * 6);
		}
		if (this.state != "dead") {
			this.head.angle = this.head.pos.getAvgAngleRad(this.head.childJoint.pos);
		}
		for (let i = this.bodyLength - 1; i >= 0; i --) {
			this.segments[i].updateJoint(this.state,this.hurtIndex >= 0,this.isBackwards);
			if (!isPaused && this.state != "dead") {
				this.segments[i].move(this.maxDist * this.size,this.isBackwards);
			}
			if (this.state == "mouseDragging" && !isPaused) {
				this.segments[i].moveByDrag(this.maxDist * this.size);
			}
		}

		if (this.state != "dead") {
			ctx.fillStyle = "#FAFAFA";
			ctx.font = "20px Ubuntu Mono, monospace";
			ctx.textAlign = "center";
			ctx.fillText(this.name,this.head.pos.x,this.head.pos.y - this.head.displayedWidth * 2.8);
			if (!isPaused && this.state != "mouseDragging") {
				this.behaviourTick();
			}
		}
		
		if (this.hurtIndex <= 0 && this.state == "hurt") {
			this.behaviourTree();
		}
		
	}
}
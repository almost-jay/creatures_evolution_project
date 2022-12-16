import { idCharas, preColours, vector2, hexToRgb } from "./globals"
import { activeArea, canvas, ctx, creatures, creaturesReference, deadCreatures, effects } from "./initMain";
import { creatureHead } from "./creatureHead";
import { creatureJoint } from "./creatureBase";
import { creatureLegJoint } from "./creatureLegJoint";
import { creatureTail } from "./creatureTail";
import { splat } from "./splats";

export class creature {
	pos : vector2;
	target : vector2;
	path : Array<vector2>;
	length : number;
	maxDist : number;
	weights : number;
	id : string;
	mainArrayId : number;
	segments : Array<creatureJoint>;
	head : creatureHead;
	interactingId : string;
	state : string;
	traits : { [key: string] : number };
	health : number;
	energy : number;

	constructor(pos : vector2, length : number, maxDist : number, weights : number, id : string) {
		this.pos = pos;
		this.length = length;
		this.maxDist = maxDist;
		this.weights = weights;
		
		if (id.length != 4) {
			this.id = this.generateId();
		} else {
			this.id = id; //if an ID is given, it sets it to that ID
		}
		creaturesReference[this.id] = this;
		this.interactingId = "";
		this.mainArrayId = creatures.length;
		
		this.state = "idle";
		
		this.segments = this.initSegments(length,maxDist,weights);
		this.initSegmentChildren();
		
		this.head = this.segments[0] as creatureHead;
		
		this.path = this.generatePath(this.pos);
		this.target = this.path[0];

		creatures.push(this);
		this.traits = { //sets up long-term creature traits
			"maxHealth" : 20,
			"sightDistance" : 512,
			"lungeDistance" : 80,
			"fieldOfView" : 36,
		};
		this.health = this.traits.maxHealth;
	}

	importJsonProps(loaded : creature) {
		this.pos = new vector2(loaded.pos.x,loaded.pos.y);
		this.target = new vector2(loaded.pos.x,loaded.pos.y); //sets loaded generic JSON values as vector2
		this.path = [];
		for (let i = 0; i < loaded.path.length; i++) {
			this.path.push(new vector2(loaded.path[i].x,loaded.path[i].y)); //adds loaded path as array of vector2
		}
		this.segments = this.initSegments(loaded.length,loaded.maxDist,loaded.weights); //adds "empty segments"
		for (let i = 0; i < loaded.length; i++) { //iterates through segments and runs a function on each to assign it the correct properties
			this.segments[i] = Object.assign(this.segments[i],loaded.segments[i]);
			this.segments[i].importJsonProps(loaded.segments[i]);
		}
		this.initSegmentChildren();
		this.head = this.segments[0] as creatureHead;
	}

	generateId() : string { //gets a random id - if it already exists, it tries again, recursively
		let idResult : Array<string> = [];
		for (let i = 0; i < 4; i ++) {
			idResult.push(idCharas[Math.floor(Math.random() * idCharas.length)]);
		}
		if (idResult.join("") in creaturesReference) {
			return this.generateId();
		} else {
			return idResult.join("");
		}
	}

	initSegments(length : number, maxDist : number, weights : number) : Array<creatureJoint> {
		let baseWidth = 4; //the "base" width of a joint
		let bodyGuide = [[4,baseWidth]]; //creates an array and puts a placeholder representing the head in it
		
		let tailLength = Math.floor(length / 2);
		let weightDist = Math.ceil((length - tailLength) / weights); //the distance between each set of legs/distribution of legs (idk what "dist" is short for)

		let weightPoints = [-1]; //makes an array with points of greatest thickness in it
		for (let i = 1; i < length; i++) { //populates bodyGuide array with arrays containing a type (the number) and 0 (will later become the weight)
			if (i > length - tailLength && weightPoints.length - 1 == weights) { //if the segment it's checking is not part of the tail and it's still got legs to add...
				bodyGuide.push([1,0]); //tail
			} else if ((i + 1) % weightDist === 0) {
				bodyGuide.push([3,0]); //weightpoints
				weightPoints.push(i);
			} else {
				bodyGuide.push([2,0]); //main body
			}
		}
		for (let i = 0; i < length; i++) {
			let distance = length;
			for (let j = 0; j < weightPoints.length; j++) {
				if (Math.abs(i - weightPoints[j]) < distance) {
					distance = Math.abs(i - weightPoints[j]); //checks for the closest leg joint
				}
			}
			bodyGuide[i][1] = ((baseWidth * 2) - ((distance / length) * length)) + (baseWidth * 0.25); //sets the weight of the joint it's checking to 
		}

		let colour = this.generateColours(); //generates an array of colours
		let segmentResult : Array<creatureJoint> = []; //initialises final list of segments to return
		let eyeColour = "#fafafa"; //sets eye colour
		for (let i = 0; i < length; i++) { //repeating for the desired length, it checks the corresponding bodyGuide joint
			switch(bodyGuide[i][0]) {
				case 1: //if it's 1, it adds a new tail joint
					segmentResult.push(new creatureTail(this.pos.add(new vector2(i * maxDist,i * maxDist)),i,colour[i],bodyGuide[i][1] * 0.8));
					break;
				case 2: //if it's 2, it adds a new "generic" joint
					segmentResult.push(new creatureJoint(this.pos.add(new vector2(i * maxDist,i * maxDist)),i,colour[i],bodyGuide[i][1]));
					break;
				case 3: //if it's 3, it adds a new leg joint
					let newJoint = new creatureLegJoint(this.pos.add(new vector2(i * maxDist,i * maxDist)),i,colour[i],bodyGuide[i][1] * 1.3,bodyGuide[i][1] * 0.8);
					segmentResult.push(newJoint);
					break;
				case 4: //if it's 4, it adds a head!
					segmentResult.push(new creatureHead(this.pos.add(new vector2(i * maxDist,i * maxDist)),0,colour[i],bodyGuide[i][1] * 1.4,eyeColour,bodyGuide[i][1] / 2));
					break;
			}
		}
		return segmentResult;
	}

	initSegmentChildren() : void { //sets all segment joint children to their corresponding joint
		for (let i = 0; i < this.segments.length - 1; i++) {
			this.segments[i].childJoint = this.segments[i + 1];
		}
	}

	generatePath(startPos : vector2) : Array<vector2> { //generates a path randomly around the given position
		let pathResult : Array<vector2> = [];
		
		//if it's out of bounds, it moves the start position back
		if (startPos.x < 128) {
			startPos.x = 256;
		}
		if (startPos.y < 128) {
			startPos.y = 256;
		}
		if (startPos.x > canvas.width - 128) {
			startPos.x = canvas.width - 256;
		}
		if (startPos.y > canvas.height - 128) {
			startPos.y = canvas.height - 256;
		}

		let width = Math.round(Math.random() * 64) + 32;
		let height = Math.round(Math.random() * 64) + 32;
		for (let i = 0; i < 360; i += 10) {
			pathResult.push(new vector2(startPos.x + width * Math.cos(i * Math.PI/180) + ((Math.random() - 0.5) * 32),startPos.y + height * Math.sin(i * Math.PI/180) + ((Math.random() - 0.5) * 32)));
		}
		if (Math.random() < 0.5) { //randomly flips path direction half the time
			pathResult.reverse();
		}

		let closest : Array<number> = [0,canvas.width]; //finds point closest to creature
		for (let i = 0; i < pathResult.length; i++) {
			let distance = startPos.distance(pathResult[i]);
			if (distance < closest[1]) {
				closest = [i,distance];
			}
		}
		pathResult = pathResult.concat(pathResult.splice(0,closest[0])); //moves entire path so closest point to start pos is at front

		return pathResult;
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

	stateMachine() : void { //controls creature behaviour based on current state
		switch (this.state) {
			case "idle": //when idle, it simply moves towards the nearest target, then switches targets when it gets close enough
				if (this.head.pos.distance(this.target) < this.maxDist) {
					this.path.push(this.target);
					this.path.shift();
					this.target = this.path[0];
				}
				if (this.interactingId != "") { //if it's holding something, and the thing it's holding is not dead, it stops holding something
					if (creaturesReference[this.interactingId].state != "dead") {
						this.interactingId = "";
					}
				}
				break;
			case "bitePrepare": //it tries to get a certain distance away from its target before biting
				if (this.interactingId != "") {
					if (this.pos.distance(creaturesReference[this.interactingId].pos) < this.traits.lungeDistance) { //if it's far away enough...
						if (Math.round(Math.random())) { //50% chance of biting
							this.target = this.segments[1].pos; //it moves towards its neck
							for (let i = 0; i < this.segments.length; i++) { //moves everything back slightly
								this.segments[i].pos.x += ((this.segments[i].pos.x - creaturesReference[this.interactingId].segments[1].pos.x) / 200) * (this.head.speed * 0.2);
								this.segments[i].pos.y += ((this.segments[i].pos.y - creaturesReference[this.interactingId].segments[1].pos.y) / 200) * (this.head.speed * 0.2);
							}
						} else if (this.pos.distance(this.target) < this.maxDist) { //randomly picks a target near its head to give it the impression of doing "false strikes"
							this.target = new vector2(this.head.pos.x + ((Math.random() * this.maxDist * 2) + this.maxDist * -2),this.head.pos.y + ((Math.random() * this.maxDist * 2) + this.maxDist * -2));
						}
					} else {
						if (Math.random() < 0.01) { //small chance of lunge
							this.head.speed *= 1.6; //sets the speed up (temporarily) so it goes fast
							
							this.target = creaturesReference[this.interactingId].segments[2].pos; //attempts to bite target's neck
							this.target.x += (Math.random() - 0.5) * this.maxDist;
							this.target.y += (Math.random() - 0.5) * this.maxDist;
							
							this.state = "biteLunge"; //creature is officially attacking!
						} else { //generates random paths around target's position to follow them
							if (this.head.pos.distance(this.target) < this.maxDist) {
								if (!this.path.length) {
									this.path = this.generatePath(creaturesReference[this.interactingId].pos);
									this.target = this.path[0];
								} else if (this.head.pos.distance(this.target) < this.maxDist) {
									this.path.push(this.target);
									this.path.shift();
									this.target = this.path[0];
								}
							}
						}
					}
				}
				break;
			case "biteLunge": //if it's close enough to its target, the target takes damage
				if (this.head.pos.distance(this.target) < this.maxDist && creaturesReference[this.interactingId]) {
					creaturesReference[this.interactingId].takeDamage(this);
					this.head.speed /= 2;
					this.path = this.generatePath(this.pos);
					this.target = this.path[0];
					this.state = "idle"; //state gets reset
				}
				break;
			case "threatened": //tries to curl up if threatened
				if (this.interactingId != "") { //if it's interacting with something, it tries to curl up in a ball
					if (this.head.pos.distance(creaturesReference[this.interactingId].pos) < this.traits.lungeDistance / 2) {
						this.target = this.segments[this.segments.length - 1].pos;
					} else {		
						if (Math.random() < 0.01) {
							this.state = "idle"; //if the threat is far away enough, it will eventually "calm down"
						}
					}
				}
				if (this.head.pos.distance(this.target) < this.maxDist) {
					this.target = new vector2(this.head.pos.x + ((Math.random() * this.maxDist * 2) + this.maxDist * -2),this.head.pos.y + ((Math.random() * this.maxDist * 2) + this.maxDist * -2));
				} //random new target
				break;
		}
	}

	castSight() : void {
		let canSee = [];
		if (this.interactingId == "" && this.state != "dead") { //if it's alive and not interacting with anything
			for (let i = 0; i < creatures.length; i++) { //get array of creatures within a sight distance
				let distanceTo = creatures[i].pos.distance(this.pos);
				if (distanceTo < this.traits.sightDistance && creatures[i].id != this.id) {
					let tupleC : [creature,number];
					tupleC = [creatures[i],distanceTo];
					canSee.push(tupleC);
				}
			}
		}
		//sort array so that the closest creatures are the first
		canSee = canSee.sort(function (a,b) : number {
			return b[1] - a[1];
		});

		for (let i = 0; i < canSee.length; i++) {
			this.seeCreature(canSee[i][0]); //then it does a check on all creatures it can see
		}
	}
	
	seeCreature(creature : creature) {
		let sightAngle = Math.abs(this.head.angle - creature.pos.getAvgAngleDeg(this.head.pos));
		if (sightAngle < this.traits.fieldOfView) { //if it's got it in its field of view...
			this.interactingId = creature.id; //prepare for attack
			this.state = "bitePrepare";
			this.path = [];
			creature.state = "threatened"; //the other guy feels threatened
			creature.interactingId = this.id; //other guy begins interacting with this creature
		}
	}

	takeDamage(attacker : creature) : void {
		attacker.interactingId = ""; //reset the attacker's state
		let damage = Math.floor((Math.random() * 18) + 8); //damage is somewhat varied
		if (this.health - damage < 1) { //if removing all that health would kill it, it simply dies
			this.initCorpse(attacker);
		} else {
			this.health -= damage;
		}
		for (let i = 0; i < (Math.random() * 24) + 16; i++) {
			effects.push(new splat(this.segments[2].pos,effects.length)); //new blood effect
		}
		let attackAngle = this.pos.getAvgAngleRad(attacker.pos); //begins running away
		this.target = new vector2(this.pos.x + (((Math.random() * 256) + 64) * Math.cos(attackAngle)),this.pos.y + (((Math.random() * 256) + 64) * Math.sin(attackAngle)));
		this.path = this.generatePath(this.target);
		if (Math.random() < 0.01) {
			this.state = "idle";
		}
	}

	initCorpse(killer : creature) : void { //sets up the creature for death
		this.state = "dead";
		this.health = 0;
		this.interactingId = killer.id;
		killer.interactingId = this.id;
		this.head.eyeType = "cross";
		this.path = [];
		creatures.splice(this.mainArrayId,1); //removes itself from the living creature array
		for (let i = this.mainArrayId; i < creatures.length; i++) { //changes 
			creatures[i].mainArrayId -= 1;
		}
		deadCreatures.push(this);
		let centreIndex = Math.floor(this.segments.length / 2) - 2;
		for (let i = 1; i < centreIndex; i++) {
			this.segments[i].childJoint = this.segments[i - 1];
			this.target = killer.head.pos;
			this.head.speed = killer.head.speed;
		}
	}

	renderCreature() : void {
		ctx.lineCap = "round";
		for (let i = this.segments.length - 2; i >= 0; i -= 1) {
			if (this.segments[i].pos.x > activeArea[0].x && this.segments[i].pos.y > activeArea[0].y && this.segments[i].pos.x < activeArea[1].x && this.segments[i].pos.y < activeArea[1].y) {
				this.segments[i].renderSegment();
			}
		}
	}
	
	updateCreature() : void {
		this.castSight();
		this.stateMachine();
		this.renderCreature();
		for (let i = 0; i < this.segments.length - 1; i++) {
			let angleParentPos = this.segments[Math.max(i - Math.ceil(this.length / this.weights),0)].pos;
			this.segments[i].move(this.maxDist,this.target,false,angleParentPos);
		}
		this.pos = this.head.pos.getAvgPos(this.segments[this.segments.length - 1].pos);
		this.head.moveHead(this.target);
	}

	renderCorpse() : void {
		this.target = creaturesReference[this.interactingId].head.pos;

		let centreIndex = Math.floor(this.segments.length / 2) - 2;
		this.segments[centreIndex].pos = this.target;

		let offsetFront = new vector2(this.maxDist * Math.cos(this.target.getAngleRad() - (Math.PI * -0.5)),this.maxDist * Math.sin(this.target.getAngleRad() - (Math.PI * -0.5)));
		let offsetBack = new vector2(this.maxDist * Math.cos(this.target.getAngleRad() - (Math.PI * 0.5)),this.maxDist * Math.sin(this.target.getAngleRad() - (Math.PI * 0.5)));
		
		this.segments[centreIndex - 1].pos = this.segments[centreIndex].pos.add(offsetBack);
		let flexibility = 6;
		for (let i = 1; i < centreIndex; i++) {
			this.segments[i].pos = this.segments[i].pos.add(offsetFront.multiply(1 / (i * flexibility)));
		}
		for (let i = this.segments.length - 1; i > centreIndex - 1; i--) {
			this.segments[i].pos = this.segments[i].pos.add(offsetBack.multiply(1 / (i * flexibility)));
		}
		for (let i = 1; i < this.segments.length - 1; i++) {
			let angleParentPos = this.segments[Math.max(i - Math.ceil(this.length / this.weights),0)].pos;
			this.segments[i].move(this.maxDist,this.target,true,angleParentPos);
		}
		
		this.pos = this.head.pos.getAvgPos(this.segments[this.segments.length - 1].pos);
		this.renderCreature();
	}
}
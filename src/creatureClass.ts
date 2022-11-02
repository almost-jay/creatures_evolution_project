import { rgbToHex, idCharas, preColours, vector2, hexToRgb } from "./globals"
import { canvas, creatures, creaturesLiving, ctx } from "./initMain";
import { creatureHead } from "./creatureHead";
import { creatureJoint } from "./creatureBase";
import { creatureLegJoint } from "./creatureLegJoint";
import { creatureTail } from "./creatureTail";

export class creature {
	pos : vector2;
	target : vector2;
	path : Array<vector2>;
	length : number;
	maxDist : number;
	weights : number;
	id : string;
	segments : Array<creatureJoint>;
	head : creatureHead;
	legs : Array<creatureJoint>;

	constructor(pos : vector2, length : number, maxDist : number, weights : number) {
		this.pos = pos;
		this.length = length;
		this.maxDist = maxDist;
		this.weights = weights;
		this.id = this.generateId();
		
		creaturesLiving[this.id] = this;
		this.legs = [];
		this.segments = this.initSegments(length,maxDist,weights);
		this.initSegmentChildren();
		this.head = this.segments[0] as creatureHead;
		this.path = this.generatePath(this.pos.add(this.pos));
		this.target = this.path[0];

		creatures.push(this);
	}

	generateId() : string {
		let idResult : Array<string> = [];
		for (let i = 0; i < 4; i ++) {
			idResult.push(idCharas[Math.floor(Math.random() * idCharas.length)]);
		}
		return idResult.join("");
	}

	initSegments(length : number, maxDist : number, weights : number) : Array<creatureJoint> {
		let bodyGuide : Array<number> = [0];
		let tailLength = Math.floor(length / 2);
		let weightDist = Math.ceil((length - tailLength) / weights);
		let weightPoints = 0;
		for (let i = 1; i < length; i ++) {
			if (i > length - tailLength && weightPoints == weights) {
				bodyGuide.push(3);
			} else if ((i + 1) % weightDist === 0) {
				bodyGuide.push(2);
				weightPoints ++;
			} else {
				bodyGuide.push(1);
			}
		}
		let colour = this.generateColours(3);
		let segmentResult : Array<creatureJoint> = [];
		for (let i = 0; i < length; i ++) {
			switch(bodyGuide[i]) {
				case 0:
					segmentResult.push(new creatureHead(this.pos.add(new vector2(i * this.maxDist,i * this.maxDist)),0,colour[i],14,"#FAFAFA",6));
					break;
				case 1: 
					segmentResult.push(new creatureJoint(this.pos.add(new vector2(i * this.maxDist,i * this.maxDist)),i,colour[i],8));
					break;
				case 2:
					let newJoint = new creatureLegJoint(this.pos.add(new vector2(i * this.maxDist,i * this.maxDist)),i,colour[i],12,12,segmentResult[Math.max(i - Math.floor(weightDist / 3),0)]);
					segmentResult.push(newJoint);
					this.legs.push(newJoint);
					break;
				case 3:
					segmentResult.push(new creatureTail(this.pos.add(new vector2(i * this.maxDist,i * this.maxDist)),i,colour[i],4));
					break;
			}
		}
		return segmentResult;
	}

	initSegmentChildren() : void {
		for (let i = 0; i < this.segments.length - 1; i++) {
			this.segments[i].childJoint = this.segments[i + 1];
		}
	}

	generatePath(startPos : vector2) : Array<vector2> {
		let pathResult : Array<vector2> = [];
		
		for (let i = 0; i < 24; i++) {
			let offset = new vector2((Math.random() - 0.5) * 32,(Math.random() - 0.5) * 32);
			pathResult.push(new vector2(startPos.x + 64 * Math.cos(2 * Math.PI * i / 24),startPos.y + 64 * Math.sin(2 * Math.PI * i / 24)).add(offset));
		}

		for (let i = 0; i < pathResult.length; i+= 2) {
			pathResult[i].y += (((Math.random() - 0.5) * 16) + 8);
		}

		let closest : Array<number> = [0,canvas.width];
		for (let i = 0; i < pathResult.length; i++) {
			let distance = startPos.distance(pathResult[i]);
			if (distance < closest[1]) {
				closest = [i,distance];
			}
		}
		pathResult = pathResult.concat(pathResult.splice(0,closest[0]));
		return pathResult.reverse();
	}

	generateColours(n : number) : any {
		n = 2;
		let colourIndexes = [0];
		for (let i = 0; i < n; i++) {
			let index = Math.round(colourIndexes[i] + ((Math.random() + preColours.length * 0.25) * (preColours.length - preColours.length * 0.25)));
			while (index > preColours.length) {
				index -= preColours.length;
			}
			colourIndexes.push(index);
		}
		colourIndexes.shift();
		let mainColours = [];
		for (let i = 0; i < colourIndexes.length; i++) {
			mainColours.push(hexToRgb(preColours[colourIndexes[i]]));
		}

		let colourRes : Array<string> = [];
		let inc = 1 / this.length;

		for (let i = 0; i < this.length; i++) {
			let r = Math.max(Math.min(Math.round((mainColours[0][0] * (inc * i)) + (mainColours[1][0] * (1 - (inc * i))) / 2), 255), 0);
			let g = Math.max(Math.min(Math.round((mainColours[0][1] * (inc * i)) + (mainColours[1][1] * (1 - (inc * i))) / 2), 255), 0);
			let b = Math.max(Math.min(Math.round((mainColours[0][2] * (inc * i)) + (mainColours[1][2] * (1 - (inc * i))) / 2), 255), 0);
			colourRes.push(rgbToHex(r,g,b));
		}
		return colourRes;

	}

	renderCreature() : void {
		ctx.lineCap = "round";
		this.head.moveHead(this.target);
		for (let i = this.segments.length - 2; i >= 0; i -= 1) {
			this.segments[i].move(this.maxDist,this.target);
			if (this.segments[i].pos.distance(this.target) < this.maxDist) {
				this.path.push(this.target);
				this.path.shift();
				this.target = this.path[0];
			}
			this.segments[i].renderSegment();
		}
	}
}
import { idCharas, preColours, vector2, hexToRgb } from "./globals"
import { activeArea, canvas, creaturesDict, ctx } from "./initMain";
import { creatureJoint } from "./jointBase";
import { creatureBody } from "./jointBody";
import { creatureHead } from "./jointHead";

export class creature {
	pos : vector2;
	length : number;
	maxDist : number;
	weights : number;
	id : string;
	segments : Array<creatureJoint>;
	head : creatureJoint;

	constructor(pos : vector2, length : number, maxDist : number, weights : number) {
		this.pos = pos;
		this.length = length;
		this.maxDist = maxDist;
		this.weights = weights;
		
		this.segments = [];
		this.initJoints();

		this.generateId();
		creaturesDict[this.id] = this;
	}

	initJoints() {
		let bodyCount = Math.floor(0.6 * this.length);
		let bodyColour = this.generateColours();
		let baseWidth = 8;

		this.segments.push(new creatureHead(this.pos,0,bodyColour[0],baseWidth * 1.3,baseWidth * 0.5,"#FFFFFF",false));
		for (let i = 1; i < this.length - 1; i++ ) {
			let jointPos = this.pos.add(new vector2(i * this.maxDist,i * this.maxDist));
			if (i < bodyCount) {
				this.segments.push(new creatureBody(jointPos,i,bodyColour[i],this.calcBodyWidth(bodyCount,i) * baseWidth,this.calcLegs(bodyCount, i)));
			} else {
				this.segments.push(new creatureBody(jointPos,i,bodyColour[i],(this.calcTailWidth(bodyCount, i - (this.length - bodyCount)) + 0.2) * baseWidth,false));
			}
		}
		this.segments.push(new creatureJoint(this.pos.add(new vector2(this.length * this.maxDist,this.length * this.maxDist)),this.length - 1,bodyColour[this.length - 1],this.calcTailWidth(bodyCount,this.length) * baseWidth));
		for (let i = 0; i < this.length - 1; i++) {
			this.segments[i].childJoint = this.segments[i + 1];
		}
		
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
		let result = Math.abs(-((1 / (this.length - bodyCount)) * x) + 1);
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

	generateId() : void {
		let idResult : Array<string> = [];
		for (let i = 0; i < 4; i ++) {
			idResult.push(idCharas[Math.floor(Math.random() * idCharas.length)]);
		}
		if (idResult.join("") in creaturesDict) {
			this.generateId();
		} else {
			this.id = idResult.join("");
		}
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

	update() {
		for (let i = 0; i < this.length; i += 1) {
			this.segments[i].updateJoint(this.maxDist);
		}
	}
}
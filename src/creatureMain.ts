import { creatureTraits } from "./creatureTraits";
import { preColours, vector2, hexToRgb, idList, randRange } from "./globals"
import { posGrid } from "./handleGrid";
import { activeArea, canvas, creaturesDict, tool, isWheelShowing, isPaused, mousePos, isLeftMouseDown, debugPrefs, ctx } from "./initMain";
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
	head : creatureHead;
	properties : creatureTraits;
	state : string;

	constructor(pos : vector2, length : number, maxDist : number, parentProps : Array<creatureTraits> | null) {
		this.properties = new creatureTraits(parentProps);
		this.pos = pos;
		this.length = length;
		this.maxDist = maxDist;
		this.weights = Math.floor(this.properties.traits.speed.display * 1.8);
		
		this.segments = [];
		this.initJoints();

		this.generateId();
		creaturesDict[this.id] = this;

		this.state = "idle";
	}

	initJoints() {
		let bodyCount = Math.floor(0.6 * this.length);
		let bodyColour = this.generateColours();
		let baseWidth = 8;

		this.head = new creatureHead(this.pos,0,bodyColour[0],baseWidth * 1.3,baseWidth * 0.5,"#FFFFFF",false,this.properties);
		this.segments.push(this.head);
		for (let i = 1; i < this.length - 1; i++ ) {
			let jointPos = this.pos.add(new vector2(i * this.maxDist,i * this.maxDist));
			if (i < bodyCount) {
				this.segments.push(new creatureBody(jointPos,i,bodyColour[i],Math.max(0.6,this.calcBodyWidth(bodyCount,i)) * baseWidth,this.calcLegs(bodyCount, i)));
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

	generateId() : void {
		let idIndex = Math.floor(randRange(0,idList.length));
		this.id = idList[idIndex];
		idList.splice(idIndex,1);
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

	checkMouse() {
		if (tool == 0) {
			let mouseCoordPos = new vector2(activeArea[0].x + 24 + mousePos.x,activeArea[0].y + 24 + mousePos.y);
			if (this.pos.distance(mouseCoordPos) < this.head.width * 4 || this.state == "mouseDragging") {
				if (isLeftMouseDown) {
					canvas.style.cursor = "url('./assets/hand-back-fist-solid.svg') 5 8, pointer";
					this.state = "mouseDragging";
				} else if (this.state == "mouseDragging") {
					this.head.generatePath()
					canvas.style.cursor = "url('./assets/hand-solid.svg') 5 8, pointer";
					this.state = "idle";
				}
			} else if (this.state == "mouseDragging") {
				this.head.generatePath();
				canvas.style.cursor = "url('./assets/arrow-pointer-solid.svg') 5 8, pointer";
				this.state = "idle";
			}
		}
	}

	update() {
		if (debugPrefs.showId) {
			ctx.fillStyle = "#FAFAFA";
			ctx.font ="12px mono";
			ctx.fillText(this.id,this.segments[1].pos.x,this.segments[1].pos.y - this.head.width * 4);
		}
		if (!isWheelShowing && !isPaused) {
			this.checkMouse();
		}
		for (let i = this.length - 1; i >= 0; i --) {
			this.segments[i].updateJoint(this.maxDist,this.state);
			if (this.state == "mouseDragging" && !isPaused) {
				this.segments[i].moveByDrag(this.maxDist);
			}
			posGrid[Math.floor(this.segments[i].pos.x / 16)][Math.floor(this.segments[i].pos.y / 16)] = this.id;
			posGrid[Math.floor((this.segments[i].pos.x + (this.segments[i].width / 2)) / 16)][Math.floor((this.segments[i].pos.y + (this.segments[i].width / 2)) / 16)] = this.id;
			posGrid[Math.floor((this.segments[i].pos.x - (this.segments[i].width / 2)) / 16)][Math.floor((this.segments[i].pos.y + (this.segments[i].width / 2)) / 16)] = this.id;
			posGrid[Math.floor((this.segments[i].pos.x + (this.segments[i].width / 2)) / 16)][Math.floor((this.segments[i].pos.y - (this.segments[i].width / 2)) / 16)] = this.id;
			posGrid[Math.floor((this.segments[i].pos.x - (this.segments[i].width / 2)) / 16)][Math.floor((this.segments[i].pos.y - (this.segments[i].width / 2)) / 16)] = this.id;
		}
		this.pos = this.head.pos;
	}
}
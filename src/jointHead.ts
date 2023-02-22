import { randRange, vector2 } from "./globals";
import { creatureJoint } from "./jointBase";
import { creatureBody } from "./jointBody";
import { ctx, activeArea, mousePos, isPaused, entityDict, debugPrefs } from "./initMain";
import { creatureTraits, relationship, trait } from "./creatureTraits";
import { posGrid } from "./handleGrid";
import { creature } from "./creatureMain";
import { food } from "./food";

export class creatureHead extends creatureBody {
	pos : vector2;
	id : number;
	colour : string;
	width : number;
	childJoint : creatureJoint;
	eyeSpacing : number;
	eyeColour : string;
	angle : number;
	isBlinking : boolean;
	blinkIndex : number;
	canSenseFriend: boolean;
	canSenseFoe: boolean;
	canSeeFood: boolean;
	targetEnemy: string;
	targetFood: string;
	relationships: { [id : string] : relationship };

	constructor (pos : vector2, id : number, colour : string, width : number, eyeSpacing : number, eyeColour : string, hasLegs : boolean) {
		super(pos, id, colour, width,hasLegs);
		this.eyeSpacing = eyeSpacing;
		this.eyeColour = eyeColour;
		this.isBlinking = false;
		this.blinkIndex = Math.floor(randRange(-120,12));

		this.canSenseFriend = false;
		this.canSenseFoe = false;

		this.relationships = {};

		this.targetFood = "";
	}

	drawEyes() {
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

	drawCrossEyes() {
		let leftEyeX = (this.eyeSpacing * Math.cos(this.angle - (Math.PI * 0.5)) + this.pos.x);
		let leftEyeY = (this.eyeSpacing * Math.sin(this.angle - (Math.PI * 0.5)) + this.pos.y);
		let leftEyePos = new vector2(leftEyeX,leftEyeY);
		
		let rightEyeX = (this.eyeSpacing * Math.cos(this.angle - (Math.PI * -0.5)) + this.pos.x);
		let rightEyeY = (this.eyeSpacing * Math.sin(this.angle - (Math.PI * -0.5)) + this.pos.y);
		let rightEyePos = new vector2(rightEyeX,rightEyeY);

		ctx.strokeStyle = this.eyeColour;
		ctx.lineWidth = 1.8;
		
		let rightEyePosA = rightEyePos.rotateAroundPoint(new vector2(rightEyePos.x + this.width * 0.12,rightEyePos.y + this.width * 0.12),this.angle);
		let rightEyePosB = rightEyePos.rotateAroundPoint(new vector2(rightEyePos.x - this.width * 0.12,rightEyePos.y - this.width * 0.12),this.angle);
		let rightEyePosC = rightEyePos.rotateAroundPoint(new vector2(rightEyePos.x + this.width * 0.12,rightEyePos.y - this.width * 0.12),this.angle);
		let rightEyePosD = rightEyePos.rotateAroundPoint(new vector2(rightEyePos.x - this.width * 0.12,rightEyePos.y + this.width * 0.12),this.angle);
		ctx.beginPath();
		ctx.moveTo(rightEyePosB.x,rightEyePosB.y);
		ctx.lineTo(rightEyePosA.x,rightEyePosA.y);
		ctx.closePath();
		ctx.stroke();
		
		ctx.beginPath();
		ctx.moveTo(rightEyePosC.x,rightEyePosC.y);
		ctx.lineTo(rightEyePosD.x,rightEyePosD.y);
		ctx.closePath();
		ctx.stroke();

		let leftEyePosA = leftEyePos.rotateAroundPoint(new vector2(leftEyePos.x + this.width * 0.12,leftEyePos.y + this.width * 0.12),this.angle);
		let leftEyePosB = leftEyePos.rotateAroundPoint(new vector2(leftEyePos.x - this.width * 0.12,leftEyePos.y - this.width * 0.12),this.angle);
		let leftEyePosC = leftEyePos.rotateAroundPoint(new vector2(leftEyePos.x + this.width * 0.12,leftEyePos.y - this.width * 0.12),this.angle);
		let leftEyePosD = leftEyePos.rotateAroundPoint(new vector2(leftEyePos.x - this.width * 0.12,leftEyePos.y + this.width * 0.12),this.angle);
		ctx.beginPath();
		ctx.moveTo(leftEyePosB.x,leftEyePosB.y);
		ctx.lineTo(leftEyePosA.x,leftEyePosA.y);
		ctx.closePath();
		ctx.stroke();
		
		ctx.beginPath();
		ctx.moveTo(leftEyePosC.x,leftEyePosC.y);
		ctx.lineTo(leftEyePosD.x,leftEyePosD.y);
		ctx.closePath();
		ctx.stroke();
	}

	updateJoint(maxDist : number, state: string): void {
		super.updateJoint(maxDist, state);
		if (state == "dead") {
			this.drawCrossEyes();
		} else {
			this.drawEyes();
		}
	}

	moveByDrag(maxDist : number): void {
		super.moveByDrag(maxDist);
		this.pos = new vector2(activeArea[0].x + 18 + mousePos.x,activeArea[0].y + 18 + mousePos.y);
	}

	checkSenses(dictId: string, hearingDistance: number, visionDistance: number, visionAngle: number) {
		this.canSenseFoe = false;
		this.canSeeFood = false;

		let sensedEntities = this.getSlicedGrid(dictId, hearingDistance,visionDistance);

		let canSeeAnything = false;
		let canHearAnything = false;

		for (let i = 0; i < sensedEntities.length; i++) {
			let checkedEntity = entityDict[sensedEntities[i]];
			if (this.castVision(checkedEntity.pos,visionAngle)) {
				this.canSeeFood = true;
				canSeeAnything = true;
				if (checkedEntity.getTypeOf() == "food") {
					checkedEntity = checkedEntity as food;
					if (!checkedEntity.isHeld) {
						if (this.targetFood != "") {
							if (entityDict[this.targetFood].pos.distance(this.pos) > checkedEntity.pos.distance(this.pos)) {
								this.targetFood = checkedEntity.id;
							}
						} else {
							this.targetFood = checkedEntity.id;
						}
					}
				} else if (checkedEntity.getTypeOf() == "creature") {
					checkedEntity = checkedEntity as creature;
					if (checkedEntity.id in this.relationships) {
						if (Math.random() < -1 * this.relationships[checkedEntity.id].aggression) {
							this.canSenseFoe = true;
							if (entityDict[this.targetEnemy].pos.distance(this.pos) > checkedEntity.pos.distance(this.pos)) {
								this.targetEnemy = checkedEntity.id;
							}
						}
					} else {
						this.relationships[checkedEntity.id] = new relationship(checkedEntity as creature);
					}
				}
			} else if (checkedEntity.getTypeOf() == "creature") {
				if (checkedEntity.pos.distance(this.pos) < hearingDistance) {
					canHearAnything = true;
				}
				
			}
		}

		if (debugPrefs.visionCone) {
			if (canSeeAnything) {
				ctx.fillStyle = "#11FFCC11";
			} else {
				ctx.fillStyle = "#FFEEEE11";
			}
			ctx.beginPath();
			ctx.moveTo(this.pos.x,this.pos.y);
			ctx.arc(this.pos.x,this.pos.y,visionDistance,this.angle - (visionAngle), this.angle + (visionAngle));
			ctx.lineTo(this.pos.x,this.pos.y);
			ctx.closePath();
			ctx.fill();
		}

		if (debugPrefs.hearingRange) {
			if (canHearAnything) {
				ctx.fillStyle = "#FF660011";
			} else {
				ctx.fillStyle = "#FFAA2211";
			}
			ctx.beginPath();
			ctx.arc(this.pos.x,this.pos.y,hearingDistance,0,2 * Math.PI);
			ctx.fill();
		}
	}

	getSlicedGrid(dictId: string, hearingDistance: number, visionDistance: number) : Array<string> {
		let maxSenseDist = Math.ceil(hearingDistance > visionDistance ? hearingDistance : visionDistance);
		let startX = Math.round((this.pos.x - maxSenseDist) / 16);
		let endX = Math.round((this.pos.x + maxSenseDist) / 16) + 1;
		let startY = Math.round((this.pos.y - maxSenseDist) / 16);
		let endY = Math.round((this.pos.y + maxSenseDist) / 16) + 1;
		let senseArea = posGrid.slice(startX,endX).map(i => i.slice(startY,endY));
		let senseCreatures : Array<string> = [];
		for (let i = 0; i < senseArea.length; i++) {
			for (let j = 0; j < senseArea[i].length; j++) {
				let entityId = senseArea[i][j];
				if (entityId != "" && entityId != dictId) {
					if (!senseCreatures.includes(entityId)) {
						senseCreatures.push(entityId);
					}
				}
			}
		}

		if (debugPrefs.senseArea) {
			this.drawSenseArea(maxSenseDist,senseCreatures.length,senseCreatures);
		}
		return senseCreatures;
	}

	drawSenseArea(maxSenseDist: number,arrL : number,senseCreatures: Array<string>) {
		let startX = Math.round((this.pos.x - maxSenseDist) / 16) * 16;
		let startY = Math.round((this.pos.y - maxSenseDist) / 16) * 16;
		let endX = Math.round((this.pos.x + maxSenseDist) / 16) * 16;
		let endY = Math.round((this.pos.y + maxSenseDist) / 16) * 16;
		
		if (arrL > 1) {
			ctx.fillStyle = "#11AAAA22";
		} else {
			ctx.fillStyle = "#22111166";
		}
		ctx.fillRect(startX,startY,endX - startX,endY - startY);
	}

	calcInteractions() {
		
	}

	castVision(checkPos: vector2,visionAngle: number) {
		let result = false;
		let sight_angle = Math.abs(checkPos.getAvgAngleRad(this.pos) - this.angle);
		if (sight_angle < visionAngle) {
			result = true;
		}
		return result;
	}
}
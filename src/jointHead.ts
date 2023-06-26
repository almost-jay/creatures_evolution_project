import { randRange, vector2 } from "./globals";
import { creatureJoint } from "./jointBase";
import { creatureBody } from "./jointBody";
import { ctx, activeArea, mousePos, isPaused, entityDict, debugPrefs, simPrefs } from "./initMain";
import { relationship } from "./creatureTraits";
import { posGrid } from "./handleGrid";
import { creature } from "./creatureMain";
import { food } from "./food";

export class creatureHead extends creatureBody {
	pos: vector2;
	id: number;
	colour: string;
	width: number;
	displayedWidth: number;
	childJoint: creatureJoint;
	eyeSpacing: number;
	eyeColour: string;
	angle: number;
	isBlinking: boolean = false;
	blinkIndex: number;
	canSenseCreatures: boolean = false;
	sensedCreatures: Array<creature> = [];
	targetEnemy: null|creature = null;
	targetFriend: null|creature = null;
	targetFood: null|food = null;
	relationships: { [id: string]: relationship } = {};
	
	constructor (pos: vector2, id: number, colour: string, width: number, eyeSpacing: number, eyeColour: string, hasLegs: boolean, legLength: number, legWidth: number) {
		super(pos, id, colour, width,hasLegs, legLength, legWidth);
		this.eyeSpacing = eyeSpacing;
		this.eyeColour = eyeColour;
		this.blinkIndex = Math.floor(randRange(-120,12));
	}

	drawEyes() {
		let size = this.displayedWidth / this.width;
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
		ctx.arc((this.eyeSpacing * size * Math.cos(this.angle - (Math.PI * 0.5))) + this.pos.x,(this.eyeSpacing * size * Math.sin(this.angle - (Math.PI * 0.5))) + this.pos.y,this.displayedWidth * 0.22,0,2 * Math.PI);
		ctx.fill();
		ctx.beginPath();
		ctx.arc((this.eyeSpacing * size * Math.cos(this.angle - (Math.PI * -0.5))) + this.pos.x,(this.eyeSpacing * size * Math.sin(this.angle - (Math.PI * -0.5))) + this.pos.y,this.displayedWidth * 0.22,0,2 * Math.PI);
		ctx.fill();
	}

	drawCrossEyes() {
		let size = this.displayedWidth / this.width;

		let leftEyeX = (this.eyeSpacing * size * Math.cos(this.angle - (Math.PI * 0.5)) + this.pos.x);
		let leftEyeY = (this.eyeSpacing * size * Math.sin(this.angle - (Math.PI * 0.5)) + this.pos.y);
		let leftEyePos = new vector2(leftEyeX,leftEyeY);
		
		let rightEyeX = (this.eyeSpacing * size * Math.cos(this.angle - (Math.PI * -0.5)) + this.pos.x);
		let rightEyeY = (this.eyeSpacing * size * Math.sin(this.angle - (Math.PI * -0.5)) + this.pos.y);
		let rightEyePos = new vector2(rightEyeX,rightEyeY);

		ctx.strokeStyle = this.eyeColour;
		ctx.lineWidth = 1.8;
		
		let rightEyePosA = rightEyePos.rotateAroundPoint(new vector2(rightEyePos.x + this.displayedWidth * 0.18,rightEyePos.y + this.displayedWidth * 0.18),this.angle);
		let rightEyePosB = rightEyePos.rotateAroundPoint(new vector2(rightEyePos.x - this.displayedWidth * 0.18,rightEyePos.y - this.displayedWidth * 0.18),this.angle);
		let rightEyePosC = rightEyePos.rotateAroundPoint(new vector2(rightEyePos.x + this.displayedWidth * 0.18,rightEyePos.y - this.displayedWidth * 0.18),this.angle);
		let rightEyePosD = rightEyePos.rotateAroundPoint(new vector2(rightEyePos.x - this.displayedWidth * 0.18,rightEyePos.y + this.displayedWidth * 0.18),this.angle);
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

		let leftEyePosA = leftEyePos.rotateAroundPoint(new vector2(leftEyePos.x + this.displayedWidth * 0.18,leftEyePos.y + this.displayedWidth * 0.18),this.angle);
		let leftEyePosB = leftEyePos.rotateAroundPoint(new vector2(leftEyePos.x - this.displayedWidth * 0.18,leftEyePos.y - this.displayedWidth * 0.18),this.angle);
		let leftEyePosC = leftEyePos.rotateAroundPoint(new vector2(leftEyePos.x + this.displayedWidth * 0.18,leftEyePos.y - this.displayedWidth * 0.18),this.angle);
		let leftEyePosD = leftEyePos.rotateAroundPoint(new vector2(leftEyePos.x - this.displayedWidth * 0.18,leftEyePos.y + this.displayedWidth * 0.18),this.angle);
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

	updateJoint(state: string, isHurt: boolean, isBackwards: boolean): void {
		super.updateJoint(state, isHurt, isBackwards);
		if (state == "dead") {
			this.drawCrossEyes();
		} else {
			this.drawEyes();
		}
	}

	moveByDrag(maxDist: number): void {
		super.moveByDrag(maxDist);
		this.pos = new vector2(activeArea[0].x + 18 + mousePos.x,activeArea[0].y + 18 + mousePos.y);
	}
	
	//this function checks if the creature can hear or see anything (friend, foe, or food)
	checkSenses(dictId: string, hearingDistance: number, visionDistance: number, visionAngle: number) : Array<creature> {
		this.canSenseCreatures = false;
		this.sensedCreatures = [];
		
		let canSeeAnything = false; //these two variables control the debug vision cone/hearing radius circle
		let canHearAnything = false;

		let newRelationships: Array<creature> = []; //array with all new relationships
		let sensedEntities = this.getEntitiesInRange(dictId, hearingDistance,visionDistance); //get a list of all entities within range
		for (let i = 0; i < sensedEntities.length; i++) { //iterate through all entities it might be able to detect
			let checkedEntity = entityDict[sensedEntities[i]]; //fetches the entity from the main dictionary
			let checkedPosition = new vector2(0,0);
			if (checkedEntity.entityType == "creature") {
				checkedEntity = checkedEntity as creature;
				this.sensedCreatures.push(checkedEntity);
				this.canSenseCreatures = true;
				checkedPosition = checkedEntity.head.pos;
			} else if (checkedEntity.entityType == "food") {
				checkedEntity = checkedEntity as food;
				checkedPosition = checkedEntity.pos;
			}
			if (this.castVision(checkedPosition,visionAngle)) { //checks if the entity is within the creature's field of view
				canSeeAnything = true;
				if (checkedEntity.entityType == "food") { //if the entity is food, it can see food
					checkedEntity = checkedEntity as food;
					if (checkedEntity.isHeldBy == null && !checkedEntity.isEaten) {
						if (this.targetFood != null) { //if it doesn't have a target food already, it sets the checked food to be the new target
							if (this.targetFood.pos.distance(this.pos) > checkedEntity.pos.distance(this.pos)) {
								this.targetFood = checkedEntity; //if the checked food is closer than the current food target, it becomes the new food target
							}	
						} else {
							this.targetFood = checkedEntity;
						}
					}
				} else if (checkedEntity.entityType == "creature") {
					checkedEntity = checkedEntity as creature;
					if (checkedEntity.state != "dead") {
						this.sensedCreatures.push(checkedEntity);
						this.canSenseCreatures = true;
						if (!(checkedEntity.id in this.relationships)) {
							newRelationships.push(checkedEntity);
						} else {
							if (this.relationships[checkedEntity.id].aggression * simPrefs.universalHostility < -0.1) {
								if (this.targetEnemy == null) {
									this.targetEnemy = checkedEntity;
								} else if (checkedPosition.distance(this.pos) > this.targetEnemy.head.pos.distance(this.pos)) {
									this.targetEnemy = checkedEntity;
								}
							} else if (this.relationships[checkedEntity.id].aggression * simPrefs.universalHostility > 0.1) {
								if (this.targetFriend == null) {
									this.targetFriend = checkedEntity;
								} else if (checkedPosition.distance(this.pos) > this.targetFriend.head.pos.distance(this.pos)) {
									this.targetFriend = checkedEntity;
								}
							}
						}
					}
				}

			} else if (checkedEntity.entityType == "creature") {
				checkedEntity = checkedEntity as creature;
				if (checkedPosition.distance(this.pos) < hearingDistance) {
					canHearAnything = true;
					if (!(checkedEntity.id in this.relationships)) {
						newRelationships.push(checkedEntity);
					} else {
						if (this.relationships[checkedEntity.id].aggression * simPrefs.universalHostility  < -0.1) { //creatures get aggressive if their aggression count is less than -0.2
							if (this.targetEnemy == null) {
								this.targetEnemy = checkedEntity;
							} else if (this.pos.distance(this.targetEnemy.head.pos) > checkedPosition.distance(this.pos)) {
								this.targetEnemy = checkedEntity;
							}
						} else if (this.relationships[checkedEntity.id].aggression * simPrefs.universalHostility > 0.1){ //creatures are friendly if aggression is > 0.2
							if (this.targetFriend == null) {
								this.targetFriend = checkedEntity;
							} else if (this.pos.distance(this.targetFriend.head.pos) > checkedPosition.distance(this.pos)) {
								this.targetFriend = checkedEntity;
							}
						}
						
						if (debugPrefs.drawRelations) {
							let red = (Math.floor(16 - ((this.relationships[checkedEntity.id].aggression * simPrefs.universalHostility + 1) * 8))).toString(16);
							let blue = (Math.floor((this.relationships[checkedEntity.id].respect * simPrefs.universalRespect + 1) * 8)).toString(16);
							
							if (red.length < 2) {
								red = red+red;
							}
							
							if (blue.length < 2) {
								blue = blue+blue;
							}
		
							ctx.strokeStyle = "#"+red+blue+"FFAA";
							ctx.lineWidth = 2;
		
							ctx.beginPath();
							ctx.moveTo(this.pos.x,this.pos.y);
							ctx.lineTo(checkedEntity.head.pos.x,checkedEntity.head.pos.y);
							ctx.stroke();
							ctx.closePath();
						}
					}
				}
				
			} else if (checkedEntity.entityType == "food") {
				checkedEntity = checkedEntity as food;
				if (checkedEntity.isHeldBy == null && !checkedEntity.isEaten) {
					if (this.targetFood == null) {
						this.targetFood = checkedEntity;
					} else if (checkedEntity.pos.distance(this.pos) < this.targetFood.pos.distance(this.pos)) {
						this.targetFood = checkedEntity;
					}
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

		return newRelationships; //send all new relationships back to the main body
	}

	getEntitiesInRange(dictId: string, hearingDistance: number, visionDistance: number): Array<string> {
		let maxSenseDist = Math.ceil(hearingDistance > visionDistance ? hearingDistance: visionDistance);
		let startX = Math.round((this.pos.x - maxSenseDist) / 16);
		let endX = Math.round((this.pos.x + maxSenseDist) / 16) + 1;
		let startY = Math.round((this.pos.y - maxSenseDist) / 16);
		let endY = Math.round((this.pos.y + maxSenseDist) / 16) + 1;
		let senseArea = posGrid.slice(startX,endX).map(i => i.slice(startY,endY));

		let senseCreatures: Array<string> = [];
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

	drawSenseArea(maxSenseDist: number,arrL: number,senseCreatures: Array<string>) {
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

	castVision(checkPos: vector2,visionAngle: number) {
		let result = false;
		let sight_angle = Math.abs(checkPos.getAvgAngleRad(this.pos) - this.angle);
		if (sight_angle < visionAngle) {
			result = true;
		}
		return result;
	}
}
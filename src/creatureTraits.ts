import { creature } from "./creatureMain";
import { randRange } from "./globals";
export class creatureTraits {
	personality: Array<number>;
	traits: { [id: string]: trait };
	constructor(parentProps: Array<creatureTraits> | null) {
		if (parentProps !== null) {
			if (parentProps.length != 1) {
			this.personality = [
					((parentProps[0].personality[0] + parentProps[1].personality[0]) / 2) + ((Math.random() - 0.5) * 0.4), //aggression
					((parentProps[0].personality[1] + parentProps[1].personality[1]) / 2) + ((Math.random() - 0.5) * 0.4) //respect
				];

				for (let key in parentProps[0].traits) {
					let mutation = (Math.random() - 0.5) * 0.2;
					let dist = Math.random() / parentProps.length;
					for (let i = 0; i < parentProps.length; i++) {
						let parentTrait = parentProps[i].traits[key as string];
						this.traits[key] = new trait(0,0,[0,0],1);
						this.traits[key].min = parentTrait.min;
						this.traits[key].max = parentTrait.max;
						this.traits[key].display += parentTrait.display * Math.abs(i - dist);
						this.traits[key].cost += parentTrait.cost * Math.abs(i - dist);
						this.traits[key].value += parentTrait.value * Math.abs(i - dist) + mutation;
						this.traits[key].attitude[0] += parentTrait.attitude[0] * Math.abs(i - dist);
						this.traits[key].attitude[1] += parentTrait.attitude[1] * Math.abs(i - dist);
					}
				}
			} else {
				this.personality = [(Math.random() - 0.5) * 2,(Math.random() - 0.5) * 2];
				this.traits = parentProps[0].traits;
			}
		} else {
			this.personality = [(Math.random() - 0.5) * 2,(Math.random() - 0.5) * 2];
			this.traits = {
				"health": new trait(10,50,[randRange(-1,1),randRange(-1,1)],1),
				"strength": new trait(1,20,[randRange(-1,1),randRange(-1,1)],1),
				"diet": new trait(-1.0,1.0,[randRange(-1,1),randRange(-1,1)],0),
				"speed": new trait(0.2,3.0,[randRange(-1,1),randRange(-1,1)],1),
				"visionDistance": new trait(12,512,[randRange(-1,1),randRange(-1,1)],0.5),
				"visionAngle": new trait(0.2,1.5,[randRange(-1,1),randRange(-1,1)],0.8),
				"hearingDistance": new trait(12,256,[randRange(-1,1),randRange(-1,1)],0.5),
				"toxicity": new trait(0.0,5.0,[randRange(-1,1),randRange(-1,1)],0.2),
			};
		}
	}

	editTrait(traitName: string, value: number) {
		if (traitName in this.traits) {
			if (value >= this.traits[traitName].min) {
				if (value <= this.traits[traitName].max) {
					this.traits[traitName].value = value;
					this.traits[traitName].display = value;
				} else {
					console.error("Value too big");
				}
			} else {
				console.error("Value too small");
			}
		} else {
			console.error("That's not a valid trait");
		}
	}
}

export class trait {
	value: number;
	display: number;
	cost: number;
	attitude: Array<number>;
	min: number;
	max: number;
	constructor(min: number, max: number, attitude: Array<number>, costMult: number) {
		this.value = randRange(min,max);
		
		if (min.toString().includes(".")) {
			this.value = Math.floor(this.value);
		}
		if (Math.random() < 0.05) {
			this.display = randRange(min,max);
		} else {
			this.display = this.value;
		}

		this.cost = ((this.value - min + 0.2) / (max - min + 0.2)) * costMult;
		
		this.attitude = attitude;
		this.min = min;
		this.max = max;
	}
}

export class relationship {
	reference: creature;
	respect: number;
	aggression: number;
	constructor(reference: creature) {
		this.reference = reference;
		this.respect = 0;
		this.aggression = 0;
	}
}
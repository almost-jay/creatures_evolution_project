import { creature } from "./creatureMain";
import { randRange } from "./globals";
export class creatureTraits {
	personality: Array<number>;
	traits: { [id: string]: trait };
	constructor(parentProps: Array<creatureTraits> | null) {
		this.traits = { //a basis function that creates a bunch of random traits, used to populate empty instances
			"health": new trait(10,50,[0,0],1),
			"strength": new trait(1,20,[0,0],1),
			"diet": new trait(-1.0,1.0,[0,0],0),
			"speed": new trait(0.2,3.0,[0,0],1),
			"visionDistance": new trait(64,512,[0,0],0.5),
			"visionAngle": new trait(0.2,1.5,[0,0],0.8),
			"hearingDistance": new trait(12,256,[0,0],0.5),
			"toxicity": new trait(0.0,5.0,[0,0],0.2),
		};
		if (parentProps !== null) {
			if (parentProps.length != 1) {
			this.personality = [
					((parentProps[0].personality[0] + parentProps[1].personality[0]) / 2) + ((Math.random() - 0.5) * 0.4), //aggression
					((parentProps[0].personality[1] + parentProps[1].personality[1]) / 2) + ((Math.random() - 0.5) * 0.4) //respect
				];
				
				for (let key in parentProps[0].traits) {
					this.traits[key] = new trait(0,1,[0,0],1);
					this.traits[key].value = 0;
					this.traits[key].display = 0;
					this.traits[key].cost = 0;
					for (let i = 0; i < parentProps.length; i++) { //iterates through parent traits, setting the child's traits as a mix of them
						let parentTrait = parentProps[i].traits[key as string];
						this.traits[key].min = parentTrait.min;
						this.traits[key].max = parentTrait.max;
						this.traits[key].value += parentTrait.value * (1 / parentProps.length) + (Math.random() - 0.5) * 0.1; //adding a slight "mutation" randomness modifier
						this.traits[key].display += parentTrait.display * (1 / parentProps.length) + (Math.random() - 0.5) * 0.1;
						this.traits[key].cost += parentTrait.cost * (1 / parentProps.length) + (Math.random() - 0.5) * 0.1;
						this.traits[key].attitude[0] += parentTrait.attitude[0] * (1 / parentProps.length) + (Math.random() - 0.5) * 0.05;
						this.traits[key].attitude[1] += parentTrait.attitude[1] * (1 / parentProps.length) + (Math.random() - 0.5) * 0.05;
					}
				}
			} else {
				this.personality = [(Math.random() - 0.5) * 2,(Math.random() - 0.5) * 2];
				this.traits = parentProps[0].traits;
			}
		} else {
			this.personality = [(Math.random() - 0.5) * 2,(Math.random() - 0.5) * 2];
		}
	}

	editTrait(traitName: string, property: string, value: number): void { //alters a trait if it finds it in self
		if (traitName in this.traits) {
			if (property == "value") {
				if (value >= this.traits[traitName].min) {
					if (value <= this.traits[traitName].max) {
						this.traits[traitName].value = value;
					} else {
						console.error("Value too big");
					}
				} else {
					console.error("Value too small");
				}
			} else if (property == "display") {
				if (value >= this.traits[traitName].min) {
					if (value <= this.traits[traitName].max) {
						this.traits[traitName].display = value;
					} else {
						console.error("Display too big");
					}
				} else {
					console.error("Display too small");
				}
			} else if (property == "aggression") {
				this.traits[traitName].attitude[0] = value;
			} else if (property == "respect") {
				this.traits[traitName].attitude[1] = value;
			} else {
				console.error("Property invalid");
			}
		} else {
			console.error(traitName+" is not a valid trait!");
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
		if (attitude[0] == 0 && attitude[1] == 0) { //no neutral attitudes allowed!
			this.attitude[0] = (Math.random() - 0.5) * 2; //randRange doesn't return the right sort of thing here
			this.attitude[1] = (Math.random() - 0.5) * 2;
		}
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
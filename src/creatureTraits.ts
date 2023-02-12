import { randRange } from "./globals";
export class creatureTraits {
	relationships: { [id : string] : number | string };
	personality: Array<number>;
	traits: { [id: string] : trait };
	constructor(parentProps: Array<creatureTraits> | null) {
		this.relationships = {};

		if (parentProps !== null) {
		this.personality = [
				((parentProps[0].personality[0] + parentProps[1].personality[0]) / 2) + ((Math.random() - 0.5) * 0.4),
				((parentProps[0].personality[1] + parentProps[1].personality[1]) / 2) + ((Math.random() - 0.5) * 0.4)
			];

			for (let key in parentProps[0].traits) {
				let mutation = (Math.random() - 0.5) * 0.2;
				let dist = Math.random() / parentProps.length;
				for (let i = 0; i < parentProps.length; i++) {
					let parentTrait = parentProps[i].traits[key as string];
					this.traits[key] = new trait((parentTrait.value * Math.abs(i - dist)) + mutation,(parentTrait.display * Math.abs(i - dist)) + mutation,(parentTrait.cost * Math.abs(i - dist)) + mutation,[(parentTrait.attitude[0] * Math.abs(i - dist)) + mutation,(parentTrait.attitude[1] * Math.abs(i - dist)) + mutation]);
				}
			}
		} else {
			this.personality = [(Math.random() - 0.5) * 2,(Math.random() - 0.5) * 2];
			this.traits = {
				"health": new trait(randRange(10,50),randRange(10,50),randRange(0,1),[randRange(-1,1),randRange(-1,1)]),
				"strength": new trait(randRange(1,20),randRange(1,20),randRange(0,1),[randRange(-1,1),randRange(-1,1)]),
				"diet": new trait(Math.floor(randRange(-1,1)),Math.floor(randRange(-1,1)),randRange(0,1),[randRange(-1,1),randRange(-1,1)]),
				"speed": new trait(randRange(0.5,8),randRange(0.5,8),randRange(0,1),[randRange(-1,1),randRange(-1,1)]),
				"visionDistance": new trait(randRange(8,256),randRange(8,256),randRange(0,1),[randRange(-1,1),randRange(-1,1)]),
				"visionAngle": new trait(randRange(12,160),randRange(12,180),randRange(0,1),[randRange(-1,1),randRange(-1,1)]),
				"toxicity": new trait(randRange(0,5),randRange(0,5),randRange(0,1),[randRange(-1,1),randRange(-1,1)]),
			};
		}
	}
}

//health is leg count
//strength is R, 
//health is G, low health animals look sickly
//diet is like... darkness
//speed is leg length
//vision distance is eye lightness
//vision angle is how far apart le eyes are
//toxic ones have black stripes

export class trait {
	value: number;
	display: number;
	cost: number;
	attitude: Array<number>;
	constructor(value: number, display: number, cost : number, attitude : Array<number>) {
		this.value = value;
		if (Math.random() < 0.05) {
			this.display = display;
		} else {
			this.display = value;
		}
		this.cost = cost;
		this.attitude = attitude;
	}
}
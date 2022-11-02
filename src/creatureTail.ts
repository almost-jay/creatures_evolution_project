import { creatureJoint } from "./creatureBase";
import { vector2 } from "./globals";

export class creatureTail extends creatureJoint {
	pos : vector2;
	id : number;
	colour : string;
	width : number;
	childJoint : creatureJoint;
	
	constructor(pos : vector2, id : number, colour : string, width : number) {
		super(pos,id,colour,width);
	}
}
import { creature } from "./creatureMain";
import { generateId, vector2 } from "./globals";
import { posGrid } from "./handleGrid";
import { ctx, entityDict } from "./initMain";

export class food {
	pos: vector2;
	size: number;
	color: string;
	id: string;
	isHeldBy: null|creature = null;
	isEaten: boolean = false;
	entityType: string = "food";
	
	constructor(pos: vector2, size: number, color: string, id: string) {
		this.pos = pos;
		this.size = size;
		this.color = color;
		if (id != "") {
			this.id = id;
		} else {
			this.id = generateId();
		}
		
		entityDict[this.id] = this;
		this.update(); //initial update call
	}
	
	update(): void {
		if (!this.isEaten) {
			this.render();
		}
		posGrid[Math.floor(this.pos.x / 16)][Math.floor(this.pos.y / 16)] = this.id; //places the food into the position grid so that it can be detected
	}

	render(): void { //draws a lil dot on the floor to represent the food
		ctx.fillStyle = this.color;
		ctx.beginPath();
			ctx.arc(this.pos.x,this.pos.y,this.size * 0.75,0,2 * Math.PI);
		ctx.closePath();
		ctx.fill();
	}
}
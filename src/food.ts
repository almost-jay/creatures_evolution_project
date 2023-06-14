import { creature } from "./creatureMain";
import { generateId, vector2 } from "./globals";
import { posGrid } from "./handleGrid";
import { ctx, entityDict } from "./initMain";

export class food {
	pos: vector2;
	size: number;
	color: string;
	id: string;
	isHeldBy: null|creature;
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
		posGrid[Math.floor(this.pos.x / 16)][Math.floor(this.pos.y / 16)] = this.id;
	}
	
	update() {
		if (!this.isEaten) {
			this.render();
		}
		posGrid[Math.floor(this.pos.x / 16)][Math.floor(this.pos.y / 16)] = this.id;
	}

	render() {
		ctx.fillStyle = this.color;
		ctx.beginPath();
			ctx.arc(this.pos.x,this.pos.y,this.size * 0.75,0,2 * Math.PI);
		ctx.closePath();
		ctx.fill();
	}
}
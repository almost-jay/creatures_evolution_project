import { generateId, vector2 } from "./globals";
import { posGrid } from "./handleGrid";
import { ctx, entityDict } from "./initMain";

export class food {
	pos: vector2;
	size: number;
	color: string;
	id: string;
	isHeld: boolean;
	isHeldBy: string;
	
	constructor(pos: vector2, size: number, color: string) {
		this.pos = pos;
		this.size = size;
		this.color = color;
		this.id = generateId();

		this.isHeld = false;
		this.isHeldBy = "";

		entityDict[this.id] = this;
		posGrid[Math.floor(this.pos.x / 16)][Math.floor(this.pos.y / 16)] = this.id;
	}
	
	getTypeOf() {
		return "food";
	}

	update() {
		if (this.isHeld) {
			this.pos = entityDict[this.isHeldBy].pos;
		}
		posGrid[Math.floor(this.pos.x / 16)][Math.floor(this.pos.y / 16)] = this.id;
		this.render();
	}
	render() {
		ctx.fillStyle = this.color;
		ctx.beginPath();
			ctx.arc(this.pos.x,this.pos.y,(this.size * 0.5) + 2,0,2 * Math.PI);
		ctx.closePath();
		ctx.fill();
	}
}
import { vector2 } from "./globals";
import { ctx } from "./initMain";

export class food {
	pos: vector2;
	size: number;
	color: string;
	isHeld: boolean;
	
	constructor(pos: vector2, size: number, color: string) {
		this.pos = pos;
		this.size = size;
		this.color = color;
	}
	render() {
		ctx.fillStyle = this.color;
		ctx.beginPath();
			ctx.arc(this.pos.x,this.pos.y,this.size / 2,0,2 * Math.PI);
		ctx.closePath();
		ctx.fill();
	}
}
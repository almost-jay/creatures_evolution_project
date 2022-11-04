import { preColours, preColoursBlood, vector2 } from "./globals";
import { ctx, effects } from "./initMain";
export class splat {
	pos : vector2;
	delta : vector2;
	dir : vector2;
	size : number;
	idx : number;
	colour : string;
	opacity : number;

	constructor(pos: vector2, idx: number) {
		this.pos = pos;
		this.delta = pos;
		this.idx = idx;
		this.size = (Math.random() * 3) + 1;
		this.dir = new vector2((((Math.random() < .5) ? 3 : -3) * (Math.random() * 3)) * 0.4,(((Math.random() < .5) ? 3 : -3) * (Math.random() * 3)) * 0.4);
		this.colour = preColoursBlood[Math.round(Math.random() * (preColoursBlood.length - 1))];
		this.opacity = 16;
	}

	renderSplat() {
		this.opacity -= 0.3;
		let converted = Math.round(Math.max(this.opacity,0)).toString(16);
		ctx.fillStyle = this.colour+converted+converted;
		ctx.beginPath();
		ctx.arc(this.delta.x,this.delta.y,this.size,0,2 * Math.PI);
		ctx.fill();

		this.delta = this.delta.subtract(this.dir);
		if (Math.abs(this.delta.x - this.pos.x) > 256 || Math.abs(this.delta.y - this.pos.y) > 256) {
			effects.splice(0,effects.length);
		}
	}
}
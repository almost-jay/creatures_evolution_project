import { vector2 } from "./globals";
import { ctx } from "./initMain";

export class particle {
	pos: vector2;
	speed: number;
	direction: number;
	size: number;
	life: number;
	age: number;
	colour: string;

	constructor(pos: vector2, speed: number, direction: number, size: number,life: number, colour: string) {
		this.pos = pos;
		this.speed = speed;
		this.direction = direction;
		this.size = size;
		this.life = life;
		this.age = 1;
		this.colour = colour;
	}

	render(): void {
		let size = this.life / this.age * this.size;
		let opacity = Math.floor((1.0 - (this.age / this.life)) * 255).toString(16);
		while (opacity.length < 2) {
			opacity = "0"+opacity;
		}
		ctx.fillStyle = this.colour+opacity;
		ctx.beginPath();
		ctx.arc(this.pos.x,this.pos.y,size,0,2 * Math.PI);
		ctx.fill();
	}

	advanceParticle(): void {
		this.age++;
		let speed = this.life / this.age * this.speed;
		this.pos = this.pos.add(new vector2(speed * Math.cos(this.direction),speed * Math.sin(this.direction)));
	}
}
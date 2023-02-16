import { activeArea, debugPrefs, ctx } from "./initMain";

export var posGrid: Array<Array<string>>;

export function initGrid() {
	posGrid = Array(1024).fill("").map(()=>Array(1024).fill(""));
}


export function clearGrid() {
	let s = 16;
	for (let i = 0; i < 256; i++) {
		for (let j = 0; j < 256; j++) {
			if (!debugPrefs["hitboxGrid"]) {
				posGrid[i][j] = "";
			} else {
				if (posGrid[i][j] != "") {
					ctx.fillStyle = "green";
					ctx.fillRect(i * s, j * s,s,s);
					posGrid[i][j] = "";
				}
				let x = s * 2 * j + (i % 2 ? 0 : s);
				let y = i * s;
				if (x > activeArea[0].x && x < activeArea[1].x) {
					if (y > activeArea[0].y && y < activeArea[1].y) {
						ctx.fillStyle = "#424242";
						ctx.fillRect(x,y,s,s);
					}
				}
			}
		}
	}
}

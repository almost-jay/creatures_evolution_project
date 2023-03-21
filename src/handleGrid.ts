import { activeArea, debugPrefs, ctx } from "./initMain";

export var posGrid: Array<Array<string>>;

export function initGrid() {
	posGrid = Array(1024).fill("").map(()=>Array(1024).fill(""));
}


export function clearGrid() {
	let s = 16;
	for (let i = 0; i < 256; i++) {
		for (let j = 0; j < 256; j++) {
			if (debugPrefs.hitboxGrid) {
				if (i * 16 > activeArea[0].x && i * 16 < activeArea[1].x) {
					if (j * 16 > activeArea[0].y && j * 16 < activeArea[1].y) {
						if (posGrid[i][j] != "") {
							ctx.fillStyle = "green";
							ctx.fillRect(i * s, j * s,s,s);
						} else {
							if ((i + j) % 2 == 0) {
								ctx.fillStyle = "#424242";
								ctx.fillRect(i * s, j * s,s,s);
							}
						}
					}
				}
			}
			posGrid[i][j] = "";
		}
	}
}

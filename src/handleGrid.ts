import { activeArea, debugPrefs, ctx, creaturesList } from "./initMain";

export var posGrid: Array<Array<string>>;

export function initGrid(): void {
	posGrid = Array(1024).fill("").map(()=>Array(1024).fill(""));
}

export function clearGrid(): void { //completely makes the grid into "", as well as drawing the hitboxGrid if that pref is enabled
	let s = 16;
	for (let i = 0; i < 256; i++) {
		for (let j = 0; j < 256; j++) {
			if (debugPrefs.hitboxGrid) {
				if (i * 16 > activeArea[0].x && i * 16 < activeArea[1].x) {
					if (j * 16 > activeArea[0].y && j * 16 < activeArea[1].y) {
						if (posGrid[i][j] != "" && posGrid[i][j]) {
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


export function fillGrid(): void { //populates grid with creachers
	for (let i = 0; i < creaturesList.length; i++) {
		let id = creaturesList[i].id;
		for (let j = 0; j < creaturesList[i].segments.length; j++) {
			let segment = creaturesList[i].segments[j];
			let posX = Math.min(Math.max(Math.floor(segment.pos.x / 16),1),254)
			let posY = Math.min(Math.max(Math.floor(segment.pos.y / 16),1),254);

			posGrid[posX][posY] = id;
			if (segment.width > 8) {
				posGrid[posX + 1][posY + 1] = id;
				posGrid[posX + 1][posY - 1] = id;
				posGrid[posX - 1][posY + 1] = id;
				posGrid[posX - 1][posY - 1] = id;
			}
		}
	}
}
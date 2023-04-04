import { creature } from "./creatureMain";
import { vector2 } from "./globals";
import { clearGrid, posGrid } from "./handleGrid";
import { activeArea, canvas, checkedCreature, creaturesList, ctx, entityDict, foodList, isPaused, manageCursor, newFood, particleList, simPrefs, sortList, updateViewportInfo } from "./initMain";

export var time: number = 0;

export function tick(): void {
	updateViewportInfo();
	clearCanvas();
	drawGrid();
	clearGrid();
	//spawnFoodCheck();
	fillGrid();
	//renderFood();
	sortList();
	renderCreatures();
	renderParticles();

	manageCursor();
	time += 0;
	requestAnimationFrame(() => tick());
}

function clearCanvas(): void {
	ctx.fillStyle = "#181818";
	ctx.fillRect(activeArea[0].x,activeArea[0].y,activeArea[1].x - activeArea[0].x,activeArea[1].y - activeArea[0].y);
}

function fillGrid() {
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

function drawGrid() {
	ctx.strokeStyle = "#D6D6D6";
	ctx.lineWidth = 2;
    ctx.beginPath();
    for (let i = 0; i <= canvas.width; i += 256) {
            ctx.moveTo(i, 0);
            ctx.lineTo(i, canvas.height);
    }
    
    for (let i = 0; i <= canvas.height; i += 256) {
            ctx.moveTo(0, i);
            ctx.lineTo(canvas.width, i);
    }
    ctx.stroke(); 
};

function spawnFoodCheck() {
	if (Math.random() < simPrefs.foodSpawnRate / 1000) {
		newFood();
	}
}

function renderFood() {
	for (let i = 0; i < foodList.length; i++) {
		foodList[i].update();
	}
}

function renderCreatures() {
	for (let i = 0; i < creaturesList.length; i += 1) {
		creaturesList[i].update();
	}
	
	if (checkedCreature != undefined) {		
		checkedCreature.updateInfoPanel()
	}
}

function renderParticles() {
	for (let i = 0; i < particleList.length; i++) {
		if (particleList[i].age < particleList[i].life) {
			if (particleList[i].pos.x > activeArea[0].x && particleList[i].pos.x < activeArea[1].x && particleList[i].pos.y > activeArea[0].y && particleList[i].pos.y < activeArea[1].y) {
				if (!isPaused) {
					particleList[i].advanceParticle();
				}
				particleList[i].render();
			}
		} else {
			particleList.splice(i,1);
			i--;
		}
	}
}
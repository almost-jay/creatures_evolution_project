import { creature } from "./creatureMain";
import { vector2 } from "./globals";
import { clearGrid, fillGrid, posGrid } from "./handleGrid";
import { activeArea, canvas, checkedCreature, creaturesList, ctx, entityDict, foodList, isPaused, manageCursor, newFood, particleList, simPrefs, sortList, updateViewportInfo } from "./initMain";

export var time: number = 0;

export function tick(): void {
	updateViewportInfo();
	clearCanvas();
	drawBoard();
	clearGrid();
	spawnFoodCheck();
	fillGrid();
	updateFood();
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

function drawBoard() {
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

function spawnFoodCheck() { //spawns food in randomly occasionally based on the food spawn rate
	if (Math.random() < simPrefs.foodSpawnRate / 1000) {
		newFood();
	}
}

function updateFood() { //renders/updates food
	for (let i = 0; i < foodList.length; i++) {
		foodList[i].update();
	}
}

function renderCreatures() {
	for (let i = 0; i < creaturesList.length; i += 1) {
		creaturesList[i].update();
	}
	
	if (checkedCreature != undefined) {		
		checkedCreature.updateInfoPanel(); //if there is currently a creacher being viewed its info must be updated!
	}
}

function renderParticles() {
	for (let i = 0; i < particleList.length; i++) {
		if (particleList[i].age < particleList[i].life) {
			if (particleList[i].pos.x > activeArea[0].x && particleList[i].pos.x < activeArea[1].x && particleList[i].pos.y > activeArea[0].y && particleList[i].pos.y < activeArea[1].y) {
				if (!isPaused) {
					particleList[i].advanceParticle(); //steps the particle a tad
				}
				particleList[i].render();
			}
		} else {
			particleList.splice(i,1);
			i--;
		}
	}
}
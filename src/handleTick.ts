import { clearGrid } from "./handleGrid";
import { activeArea, canvas, creaturesList, ctx, foodList, newFood, simPrefs, updateViewportInfo } from "./initMain";

export var time: number = 0;

export function tick() : void {
	updateViewportInfo();
	clearCanvas();
	drawGrid();
	clearGrid();
	spawnFoodCheck();
	renderFood();
	renderCreatures();
	time += 0;
	requestAnimationFrame(() => tick());
}

function clearCanvas() : void {
	ctx.fillStyle = "#181818";
	ctx.fillRect(activeArea[0].x,activeArea[0].y,activeArea[1].x - activeArea[0].x,activeArea[1].y - activeArea[0].y);
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
		foodList[i].render();
	}
}

function renderCreatures() {
	for (let i = 0; i < creaturesList.length; i += 1) {
		creaturesList[i].update();
	}
}
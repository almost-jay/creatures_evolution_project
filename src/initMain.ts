import { webFrame } from "electron";
import { creature } from "./creatureMain";
import { vector2 } from "./globals";

export var appId : number;

export const canvas = document.getElementById("canvas") as HTMLCanvasElement;
export const ctx = canvas.getContext("2d") as CanvasRenderingContext2D;
export var activeArea : Array<vector2> = [];
export var isMouseDown : boolean;
export var windowInfo : Array<number> = [0,0];

export var creatureList : Array<creature> = [];

function setupApp() {
	ctx.lineCap = "round";
	windowInfo = [window.innerWidth,window.innerHeight];
	let holdX : number;
	let holdY : number;
	isMouseDown = false;
	document.addEventListener("mousedown", () => {
		updateViewportInfo();
		if (!isMouseDown) {
			isMouseDown = true;
		}
	});
	document.addEventListener("mouseup", () => {
		updateViewportInfo();
		if (isMouseDown) {
			isMouseDown = false;
			canvas.style.cursor = "default";
		}
	});
	
	document.addEventListener("mousemove", (event : MouseEvent) => {
		updateViewportInfo();
		navigateCanvas(event);
	});

	function navigateCanvas(event : MouseEvent) {
		if (isMouseDown) {
			canvas.style.cursor = "pointer";
			window.scrollBy(holdX - event.clientX, holdY - event.clientY);
			updateViewportInfo();
		}
		holdX = event.clientX;
		holdY = event.clientY;
	}

	initNavigation();

}

function initNavigation() {
	webFrame.setZoomFactor(1.6);
	window.scrollTo(1000,1000);
	updateViewportInfo();
}

function updateViewportInfo() {
	windowInfo = [window.innerWidth,window.innerHeight];
	activeArea[0] = new vector2(window.scrollX - 24, window.scrollY - 24);
	activeArea[1] = new vector2(activeArea[0].x + windowInfo[0] + 48,activeArea[0].y + windowInfo[1] + 48);
}

function tick() : void {
	updateViewportInfo();
	clearCanvas();
	drawGrid();
	renderCreatures();
	requestAnimationFrame(() => tick());
}

function clearCanvas() : void {
	ctx.fillStyle = "#181818";
	ctx.fillRect(activeArea[0].x,activeArea[0].y,activeArea[1].x - activeArea[0].x,activeArea[1].y - activeArea[0].y);
}

function drawGrid() {
	ctx.strokeStyle = "#FAFAFA";
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

function renderCreatures() {
	for (let i = 0; i < creatureList.length; i += 1) {
		creatureList[i].update();
	}
}

setupApp();
tick();
updateViewportInfo();

creatureList.push(new creature(new vector2(1240,1240),12,12,2))

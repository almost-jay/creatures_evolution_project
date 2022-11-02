import { webFrame } from "electron";
import { creature } from "./creatureClass";
import { vector2 } from "./globals";

export const canvas = document.getElementById("canvas") as HTMLCanvasElement;
export const ctx = canvas.getContext("2d") as CanvasRenderingContext2D;
export var creaturesLiving : { [key: string]: creature } = {};
export var creatures : Array<creature> = [];

function initNavigation() {
	let holdX : number;
	let holdY : number;
	let isMouseDown = false;
	//window.scrollTo(1024,1024);
	webFrame.setZoomLevel(4.0);
	document.addEventListener("mousedown", () => {
		if (!isMouseDown) {
			isMouseDown = true;
		}
	});
	document.addEventListener("mouseup", () => {
		if (isMouseDown) {
			isMouseDown = false;
			canvas.style.cursor = "default";
		}
	});
	
	document.addEventListener("mousemove", (event : MouseEvent) => {
		navigateCanvas(event);
	});
	function navigateCanvas(event : MouseEvent) {
		if (isMouseDown) {
			canvas.style.cursor = "pointer";
			event.preventDefault();
			window.scrollBy(holdX - event.clientX, holdY - event.clientY);
		}
		holdX = event.clientX;
		holdY = event.clientY;
	}
}

function tick() : void {
	clearCanvas();
	drawGrid();
	renderCreatures();
	requestAnimationFrame(() => tick());
}

function clearCanvas() : void {
	ctx.fillStyle = "#181818";
	ctx.fillRect(0,0,canvas.width, canvas.height);
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

function newHead() : void {
	new creature(new vector2(128,128),16,8,2);
}

function renderCreatures() : void {
	for (let i = 0; i < creatures.length; i ++) {
		creatures[i].renderCreature();
	}
}

initNavigation();
newHead();
tick();

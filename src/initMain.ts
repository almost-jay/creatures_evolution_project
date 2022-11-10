import { webFrame } from "electron";
import { creature } from "./creatureClass";
import { vector2 } from "./globals";
import { initState } from "./saveFile";
import { splat } from "./splats";

export var appId : number;

export const canvas = document.getElementById("canvas") as HTMLCanvasElement;
export const ctx = canvas.getContext("2d") as CanvasRenderingContext2D;
export var creaturesReference : { [key: string]: creature } = {};
export var creatures : Array<creature> = [];
export var deadCreatures : Array<creature> = [];
export var activeArea : Array<vector2> = [];
export var isMouseDown : boolean;
export var effects : Array<splat> = [];

function setupApp() {
	webFrame.setZoomFactor(1.6);
	window.scrollTo(1000,1000);
}

function initNavigation() {
	updateViewportInfo();
	webFrame.setZoomFactor(1.6);
	window.scrollTo(1000,1000);
	let holdX : number;
	let holdY : number;
	isMouseDown = false;
	
	document.addEventListener("mousedown", () => {
		if (!isMouseDown) {
			isMouseDown = true;
		}
	});
	document.addEventListener("mouseup", () => {
		if (isMouseDown) {
			isMouseDown = false;
			canvas.style.cursor = "default";
			updateViewportInfo();
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
			updateViewportInfo();
		}
		holdX = event.clientX;
		holdY = event.clientY;
	}

	window.onkeydown = function(event) {
		if ((event.code == "Minus" || event.code == "Equal") && (event.ctrlKey || event.metaKey)) {event.preventDefault()};
		if ((event.key == "n") && creatures.length <= 200) {
			newHead(new vector2(1300,1300));
		}
	}
}

function updateViewportInfo() {
	activeArea[0] = new vector2(window.scrollX - 24, window.scrollY - 24);
	activeArea[1] = new vector2((1280 / webFrame.getZoomFactor()) + 24 + activeArea[0].x,(720 / webFrame.getZoomFactor()) + 24 + activeArea[0].y);
}

function tick() : void {
	clearCanvas();
	drawGrid();
	renderSplats();
	renderCreatures();
	requestAnimationFrame(() => tick());
}

function clearCanvas() : void {
	ctx.fillStyle = "#181818";
	ctx.fillRect(activeArea[0].x,activeArea[0].y,activeArea[1].x,activeArea[1].y);
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

function renderSplats() {
	for (let i = 0; i < effects.length; i++) {
		effects[i].renderSplat();
	}
}

function fillBoard() : void {
	for (let i = 0; i < 32; i++) {
		for (let j = 0; j < 32; j++) {
			let offsetX = (Math.random() * 129) - 64;
			let offsetY = (Math.random() * 129) - 64;
			newHead(new vector2(((i + 1) * 128) - offsetX,((j + 1) * 128) - offsetY));
		}
	}
}

function newHead(pos : vector2) : void {
	new creature(pos,16,8,2);
}

function renderCreatures() : void {
	for (let i = 0; i < deadCreatures.length; i++) {
		deadCreatures[i].renderCorpse();
	}
	for (let i = 0; i < creatures.length; i++) {
		creatures[i].updateCreature();
	}
}

setupApp();
initNavigation();
//fillBoard();
newHead(new vector2(1200,1200));
tick();
updateViewportInfo();
initState();
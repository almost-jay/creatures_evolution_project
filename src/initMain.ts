import { webFrame } from "electron";
import { creature } from "./creatureMain";
import { cursors, initIdList, vector2 } from "./globals";

export var appId : number;

export const canvas = document.getElementById("canvas") as HTMLCanvasElement;
export const ctx = canvas.getContext("2d") as CanvasRenderingContext2D;
export var activeArea : Array<vector2> = [];
export var isMouseDown : boolean;
export var isPanning : boolean;
export var windowInfo : Array<number> = [0,0];
export var mousePos = new vector2(0,0);

export var isPaused : boolean = false;

export var creaturesList : Array<creature> = [];
export var creaturesDict : { [key: string]: creature } = {};

function setupApp() {
	ctx.lineCap = "round";
	windowInfo = [window.innerWidth,window.innerHeight];
	let holdX : number;
	let holdY : number;
	isMouseDown = false;
	document.addEventListener("mousedown", (event) => {
		updateViewportInfo();
		if (!isMouseDown) {
			isMouseDown = true;
			if (event.button == 2) {
				isPanning = true;
			}
			
		}
	});
	document.addEventListener("mouseup", () => {
		updateViewportInfo();
		if (isMouseDown) {
			isMouseDown = false;
			isPanning = false;
			canvas.style.cursor = "url('./assets/arrow-pointer-solid.svg') 5 8, pointer";
		}
	});
	
	document.addEventListener("mousemove", (event : MouseEvent) => {
		updateViewportInfo();
		navigateCanvas(event);
		mousePos.x = event.clientX;
		mousePos.y = event.clientY;
	});

	document.addEventListener("keydown", (event: KeyboardEvent) => {
		if (event.key == "Escape") {
			isPaused = !isPaused;
			console.log(isPaused);
		}
	});

	function navigateCanvas(event : MouseEvent) {
		if (isPanning) {			
			window.scrollBy(holdX - event.clientX, holdY - event.clientY);
			updateViewportInfo();
			canvas.style.cursor = "url('./assets/arrows-up-down-left-right-solid.svg') 8 8, move";
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
	for (let i = 0; i < creaturesList.length; i += 1) {
		creaturesList[i].update();
	}
}


function addDemoCreatures() {
	let crNo = (Math.random() * 2) + 4
	crNo = 1;
	for (let i = 0; i < crNo; i ++) {
		let xOffset = (Math.random() * 1024) + 1024;
		let yOffset = (Math.random() * 1024) + 1024;
		creaturesList.push(new creature(new vector2(1280,1280),16,8,null));

		document.getElementById("testpopout")!.innerHTML = (creaturesList.length).toString();
	}
}

setupApp();
tick();
updateViewportInfo();
addDemoCreatures();
initIdList();
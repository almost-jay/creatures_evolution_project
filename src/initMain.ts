import { webFrame } from "electron";
import { creature } from "./creatureMain";
import { initIdList, vector2 } from "./globals";
import { clearGrid, initGrid } from "./handleGrid";

export var appId : number;

export const canvas = document.getElementById("canvas") as HTMLCanvasElement;
export const ctx = canvas.getContext("2d") as CanvasRenderingContext2D;

export const wheel = document.querySelector('.wheel') as HTMLDivElement;
export var tool: number = 0;

export var activeArea : Array<vector2> = [];
export var isLeftMouseDown : boolean = false;
export var isRightMouseDown : boolean = false;
export var windowInfo : Array<number> = [0,0];
export var mousePos = new vector2(0,0);
export var heldMousePos = new vector2(0,0);

export var isPaused : boolean = false;

export var creaturesList : Array<creature> = [];
export var creaturesDict : { [key: string]: creature } = {};


export var debugPrefs : { [key: string]: boolean } = {
	"visionCone": false,
	"hearingRange": false,
	"senseArea": false,
	"hitboxGrid": false,
	"showId": false,
};

export var isWheelShowing : boolean = false;
var wheelSelection : number = 0;
var wheelPos : vector2 = new vector2(mousePos.x,mousePos.y);
var isConsoleOpen : boolean = false;

function setupApp() {
	ctx.lineCap = "round";
	windowInfo = [window.innerWidth,window.innerHeight];
	document.addEventListener("mousedown", (event) => {
		updateViewportInfo();
		if (!isLeftMouseDown) {
			if (event.button == 0) {
				isLeftMouseDown = true;
			}			
		}

		if (event.button == 1) {
			event.preventDefault();
			showWheel();
		}

		if (!isRightMouseDown) {
			if (event.button == 2) {
				isRightMouseDown = true;
			}
			
		}
	});
	document.addEventListener("mouseup", () => {
		updateViewportInfo();
		if (isRightMouseDown) {
			isRightMouseDown = false;
		}
		if (isLeftMouseDown) {
			isLeftMouseDown = false;
		}

		if (!isLeftMouseDown && !isRightMouseDown) {
			canvas.style.cursor = "url('./assets/arrow-pointer-solid.svg') 5 8, pointer";
		}
		
		hideWheel()
	});
	
	document.addEventListener("mousemove", (event : MouseEvent) => {
		updateViewportInfo();
		navigateCanvas(event);
		mousePos.x = event.clientX;
		mousePos.y = event.clientY;
		if (isWheelShowing) {
			updateWheel();
		}
	});

	document.addEventListener("keydown", (event: KeyboardEvent) => {
		if (event.code == "Escape") {
			isPaused = !isPaused;
		} else if (event.code == "Backquote" && !isWheelShowing) {
			wheelPos = new vector2(mousePos.x,mousePos.y);
			showWheel();
		} else if (event.code == "Slash") {
			toggleCommandBox();
		} else if (event.code == "Enter") {
			acceptCommand();
		}
	});

	document.addEventListener("keyup", (event: KeyboardEvent) => {
		if (event.code =="Backquote" && isWheelShowing) {
			hideWheel();
		}
	});
	initNavigation();
}

function toggleCommandBox() {
	let commandbar = document.getElementById("commandbar") as HTMLInputElement;
	if (commandbar != undefined) {
		if (isConsoleOpen) {
			isConsoleOpen = false;
			isPaused = false;
		} else {
			commandbar.focus();
			isConsoleOpen = true;
			isPaused = true;

			commandbar.value = "";
		}
	} else {
		console.error("Could not find console/commandbar element!");
	}
}

function acceptCommand() {
	let commandbar = document.getElementById("commandbar") as HTMLInputElement;
	if (commandbar != undefined) {
		let command = (commandbar.value).replace("/","");
		if (debugPrefs.hasOwnProperty(command)) {
			debugPrefs[command] = !debugPrefs[command];
			toggleCommandBox();
			commandbar.value = "";
		} else {
			console.log("Command not recognised!");
		}
	} else {
		console.error("Could not find console/commandbar element!");
	}
}

function showWheel() {
	if (wheel !== null) {
		isWheelShowing = true;
		
		wheel.style.left = mousePos.x.toString();
		wheel.style.top = mousePos.y.toString();
		wheel.classList.add('on');
		wheelPos = new vector2(mousePos.x,mousePos.y);
	} else {
		console.error("Could not find wheel element!");
	}
}

function hideWheel() {
	if (wheel !== null) {
		isWheelShowing = false;
		wheel.setAttribute("data-chosen", "0");
		wheel.classList.remove("on");
		
		var tool = wheelSelection;
			// let panel = document.getElementById("callout");
			// if (panel != null && panel != undefined) {
			// 	panel.style.display = "inline";
			// }
	} else {
		console.error("Could not find wheel element!");
	}
}

function updateWheel() {
	let delta = mousePos.subtract(wheelPos);
	let magnitude = delta.getMagnitude();
	wheelSelection = 0;
	
	if (magnitude >= 5 && magnitude <= 250) {
		let deg = Math.atan2(delta.y,delta.x) + 0.625 * Math.PI;
		while (deg < 0) {
			deg += Math.PI * 2;
		}
		wheelSelection = Math.floor(deg / Math.PI * 2) + 1;
	}

wheel.setAttribute('data-chosen', wheelSelection.toString());
}

function navigateCanvas(event : MouseEvent) {
	if (isRightMouseDown) {			
		window.scrollBy(heldMousePos.x - event.clientX, heldMousePos.y - event.clientY);
		updateViewportInfo();
		canvas.style.cursor = "url('./assets/arrows-up-down-left-right-solid.svg') 8 8, move";
	}
	heldMousePos.x = event.clientX;
	heldMousePos.y = event.clientY;
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
	clearGrid();
	renderCreatures();
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

function renderCreatures() {
	for (let i = 0; i < creaturesList.length; i += 1) {
		creaturesList[i].update();
	}
}


function addDemoCreatures() {
	let crNo = (Math.random() * 2) + 1;
	for (let i = 0; i < crNo; i ++) {
		let xOffset = (Math.random() * 1024) + 1024;
		let yOffset = (Math.random() * 1024) + 1024;
		creaturesList.push(new creature(new vector2(xOffset,yOffset),16,8,null));

		document.getElementById("testpopout")!.innerHTML = (creaturesList.length).toString();
	}
}

setupApp();
initIdList();
initGrid();
tick();
updateViewportInfo();
addDemoCreatures();
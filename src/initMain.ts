import { webFrame } from "electron";
import { creature } from "./creatureMain";
import { initIdList, preColours, randRange, vector2 } from "./globals";
import { initGrid, posGrid } from "./handleGrid";
import { tick } from "./handleTick";
import { food } from "./food";
import { creatureTraits } from "./creatureTraits";
import { particle } from "./particle";

export var appId: number;

export const canvas = document.getElementById("canvas") as HTMLCanvasElement; //setting up the usual HTML canvas context
export const ctx = canvas.getContext("2d") as CanvasRenderingContext2D;

export const wheel = document.querySelector('.wheel') as HTMLDivElement; //setting up the popup wheel
export var tool: number = 0; //tools are 0 for nothing, 1 for grab hand, 2 for magnifying glass, 3 for food, 4 for editor

export var activeArea: [vector2,vector2] = [new vector2(0,0),new vector2(0,0)]; //the currently visible area of the canvas, plus some buffer
export var isLeftMouseDown: boolean = false;
export var isRightMouseDown: boolean = false;
export var windowInfo: Array<number> = [0,0]; //the size of the window
export var mousePos = new vector2(0,0); //the position of the mouse on the viewport 
export var heldMousePos = new vector2(0,0); //the LAST position of the mouse on the viewport, used as a buffer

export var isPaused: boolean = false;

export var creaturesList: Array<creature> = []; //list of all creatures
export var foodList: Array<food> = []; //list of all food
export var particleList: Array<particle> = []; //list of all particles
export var entityDict: { [key: string]: creature | food } = {}; //record of all entities

export var cursorChoice: Array<boolean> = [false,false,false,false,false]; //stores the sort of cursor that should be used this frame, by priority, to avoid flickering

export var highScores: { [key: string]: Array<string|number> } = {
	"longestLiving": ["",0],
}

export var simPrefs: { [key: string]: number } = {
	"foodSpawnRate": 5,
}

export var debugPrefs: { [key: string]: boolean } = { //these strings can be entered into the console to toggle each one on and off
	"visionCone": false,
	"hearingRange": false,
	"senseArea": false,
	"hitboxGrid": false,
	"showId": false,
	"showState": false,
	"drawPath": false,
	"drawRelations": false,
};


export var checkedCreature: creature; //the creature currently being checked with the information/magnifying glass tool
var isGrabbing: boolean = false; //whether a creature is currently being grabbed

export var isWheelShowing: boolean = false; //whether or not the popup wheel is showing
var wheelSelection: number = 0; //what the mouse is hovering over on the wheel
var wheelPos: vector2 = new vector2(mousePos.x,mousePos.y); //the position of the wheel, as it may be different from the mouse position
var isConsoleOpen: boolean = false;  //whether the debug console is showing

function setupApp() { //creates all the event listeners, triggers the rendering and setup
	ctx.lineCap = "round";
	windowInfo = [window.innerWidth,window.innerHeight];
	document.addEventListener("mousedown", (event) => {
		updateViewportInfo(); //every frame where the mouse is pressed down, update where the borders of the screen are recorded to be

		if (event.button == 0) {
			if (!isLeftMouseDown) {
				handleTool();
				isLeftMouseDown = true;
			}
		}

		if (event.button == 1) {
			event.preventDefault();
			showWheel();
		}

		if (event.button == 2) {
			if (!isRightMouseDown) {
				isRightMouseDown = true;
			}
		}
	});
	document.addEventListener("mouseup", () => {
		updateViewportInfo();
		if (isGrabbing) { //if the mouse is released and it was previously grabbing a guy, it updates that guy
			let entityId = posGrid[Math.floor(mousePos.x / 16)][Math.floor(mousePos.y / 16)];
			if (entityId != "") {
				let entity = entityDict[posGrid[Math.floor(mousePos.x / 16)][Math.floor(mousePos.y / 16)]]
				if (entity.getTypeOf() == "creature") { //checks it's ACTUALLY a creature currently being hovered over, in case there's something weird with the grid
					entity = entity as creature;
					entity.generatePath(4);
					entity.behaviourTree();
				} else { //if the mouse is currently not hovering over the right creature, it does a basic linear search through the creature list
					for (let i = 0; i < creaturesList.length; i++) {
						if (creaturesList[i].state == "mouseDragging") {
							creaturesList[i].generatePath(4);
							creaturesList[i].behaviourTree();
						}
					}
				}
			} else {
				for (let i = 0; i < creaturesList.length; i++) { //again, if it's not hovering over the correct one, it does a basic linear search to update the correct one properly
					if (creaturesList[i].state == "mouseDragging") {
						creaturesList[i].state = "idle";
						creaturesList[i].generatePath(4);
						creaturesList[i].behaviourTree();
					}
				}
			}
		}

		if (isRightMouseDown) {
			isRightMouseDown = false;
		}

		if (isLeftMouseDown) {
			isLeftMouseDown = false;
			isGrabbing = false;
		}

		if (!isLeftMouseDown && !isRightMouseDown) {
			cursorChoice[0] = true; //if neither mouse button is down, cursor is set to default choice
		}
		
		hideWheel()
	});
	
	document.addEventListener("mousemove", (event: MouseEvent) => {
		updateViewportInfo();
		navigateCanvas(event);
		checkHover();
		mousePos.x = event.clientX;
		mousePos.y = event.clientY;
		if (isWheelShowing) {
			updateWheel();
		}
	});

	document.addEventListener("keydown", (event: KeyboardEvent) => {
		if (event.code == "Escape") {
			isPaused = !isPaused;
			let overlay = document.getElementById("pauseOverlay") as HTMLDivElement;
			if (isPaused) {
				overlay.style.display = "block";
			} else {
				overlay.style.display = "none";
			}
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
	initEditor();
}

export function manageCursor() {
	if (isRightMouseDown) {
		cursorChoice[1] = true;
	}

	let selected = 0;
	for (let i = 0; i < 5; i++) {
		if (cursorChoice[i]) {
			selected = i;
		}
	}
	if (isGrabbing) {
		selected = 4
	}

	let size = "32 32";
	switch (selected) {
		case (0):
			canvas.style.cursor = "url('./assets/arrow-pointer-solid.svg') "+size+", default";
			break;
		case (1):
			canvas.style.cursor = "url('./assets/arrows-up-down-left-right-solid.svg') "+size+", move";
			break;
		case (2):
			canvas.style.cursor = "url('./assets/hand-pointer-solid.svg') "+size+", pointer";
			break;
		case (3):
			canvas.style.cursor = "url('./assets/hand-solid.svg') "+size+", grab";
			break;
		case (4):
			canvas.style.cursor = "url('./assets/hand-back-fist-solid.svg') "+size+", grabbing";
			break;
	}
	cursorChoice = [false,false,false,false,false];
}

function toggleCommandBox() {
	let commandbar = document.getElementById("commandbar") as HTMLInputElement;
	if (commandbar != undefined) {
		if (isConsoleOpen) {
			isConsoleOpen = false;
		} else {
			commandbar.focus();
			isConsoleOpen = true;

			commandbar.value = "";
		}
	} else {
		console.error("Could not find console/commandbar element!");
	}
}

function checkHover() {
	if (!isPaused && !isWheelShowing && tool == 1) {
		let mouseCoordPos = new vector2(activeArea[0].x + 24 + mousePos.x,activeArea[0].y + 24 + mousePos.y);
		mouseCoordPos.x = Math.max(Math.min(mouseCoordPos.x,4096),0);
		mouseCoordPos.y = Math.max(Math.min(mouseCoordPos.y,4096),0);
		let mouseGridPos = new vector2(Math.floor(mouseCoordPos.x / 16),Math.floor(mouseCoordPos.y / 16));

		for (let i = -1; i < 2; i++) {
			for (let j = -1; j < 2; j++) {
				if (posGrid[mouseGridPos.x + i][mouseGridPos.y + j] != "") {
					if (entityDict[posGrid[mouseGridPos.x + i][mouseGridPos.y + j]].getTypeOf() == "creature") {
						if (tool == 1) { 
							cursorChoice[3] = true;
						} else {
							cursorChoice[2] = true;
						}
					}
				}
			}
		}
	}
}

function handleTool() {
	if (!isPaused && !isWheelShowing) {
		let mouseCoordPos = new vector2(activeArea[0].x + 24 + mousePos.x,activeArea[0].y + 24 + mousePos.y);
		mouseCoordPos.x = Math.max(Math.min(mouseCoordPos.x,4096),0);
		mouseCoordPos.y = Math.max(Math.min(mouseCoordPos.y,4096),0);
		let mouseGridPos = new vector2(Math.floor(mouseCoordPos.x / 16),Math.floor(mouseCoordPos.y / 16));
		if (tool ==  2) {
			let clickedEntityId = posGrid[mouseGridPos.x][mouseGridPos.y];
			if (clickedEntityId != "") {
				if (entityDict[clickedEntityId] != undefined) {
					if (entityDict[clickedEntityId].getTypeOf() == "creature") {
						checkedCreature = entityDict[clickedEntityId] as creature;
				
						let panelDiv = document.getElementById("callout");
						if (panelDiv != undefined) {
							panelDiv.style.display = "inline";
						} else {
							console.error("Could not find callout element!");
						}
					}
				}
			}
		} else {
			let panelDiv = document.getElementById("callout");
			if (panelDiv != undefined) {
				panelDiv.style.display = "none";
			} else {
				console.error("Could not find callout element!");
			}

			if (tool == 1) {
				let clickedEntityId = posGrid[mouseGridPos.x][mouseGridPos.y];
				if (clickedEntityId != "") {
					if (entityDict[clickedEntityId].getTypeOf() == "creature") {
						let draggedCreature = entityDict[clickedEntityId] as creature;

						if (draggedCreature.state != "dead") {
							draggedCreature.state = "mouseDragging";
							isGrabbing = true;
						}
					}
				}
			} else if (tool == 3) {
				let colorIndex = Math.floor(randRange(0,preColours.length - 1));
				let foodColor = preColours[colorIndex];
				foodList.push(new food(new vector2(mouseCoordPos.x,mouseCoordPos.y),randRange(4,6),foodColor));

			} else if (tool == 4) {
				let editDiv = document.getElementById("creatureEditor");
				if (editDiv != undefined) {
					editDiv.style.display = "block";
				} else {
					console.error("Could not find editor element!");
				}
			}
		}
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
			let splitCommand = command.split(" ");
			if (splitCommand[0] == "teleport" || splitCommand[0] == "tp") {
				let affectedCreature = entityDict[splitCommand[1]]
				if (affectedCreature.getTypeOf() == "creature" ) {
					affectedCreature = affectedCreature as creature;
					let xGoal = parseInt(splitCommand[2]);
					let yGoal = parseInt(splitCommand[3]);

					affectedCreature.head.pos = new vector2(xGoal,yGoal);
					affectedCreature.generatePath(4);
				} else {
					alert("Creature not found.");
				}
			} else if (splitCommand[0] == "edit") {
				let affectedCreature = entityDict[splitCommand[1]]
				if (affectedCreature.getTypeOf() == "creature" ) {
					affectedCreature = affectedCreature as creature;
					
					if (splitCommand[2] in affectedCreature) {
						let key = splitCommand[2] as keyof creature;
						let propType = typeof affectedCreature[key];
						if (typeof affectedCreature[key] == "string") {
							let edit = affectedCreature[key];
							edit = splitCommand[3];
						}
						if (typeof affectedCreature[key] == "number") {
							let edit = affectedCreature[key];
							edit = Number.parseInt(splitCommand[3]);
						} else {
							alert("Property is of type "+propType+"! Can only edit numbers or strings!");
						}
					} else {
						alert("Property "+splitCommand[2]+" not valid.");
					}
				} else {
					alert("Creature not found.");
				}
			} else {
				alert("Command not recognised: "+splitCommand[0]);
			}
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
		
		tool = wheelSelection;
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

function navigateCanvas(event: MouseEvent) {
	if (isRightMouseDown) {			
		window.scrollBy(heldMousePos.x - event.clientX, heldMousePos.y - event.clientY);
		updateViewportInfo();
	}
	heldMousePos.x = event.clientX;
	heldMousePos.y = event.clientY;
}

function initNavigation() {
	webFrame.setZoomFactor(1.6);
	window.scrollTo(1000,1000);
	updateViewportInfo();
}

export function updateViewportInfo() {
	windowInfo = [window.innerWidth,window.innerHeight];
	activeArea[0] = new vector2(window.scrollX - 24, window.scrollY - 24);
	activeArea[1] = new vector2(activeArea[0].x + windowInfo[0] + 48,activeArea[0].y + windowInfo[1] + 48);
}

export function newFood() {
	for (let i = 0; i < randRange(1,4); i++) {
		let colorIndex = Math.floor(randRange(0,preColours.length - 1));
		let foodColor = preColours[colorIndex];
		foodList.push(new food(new vector2(randRange(96,4000),randRange(96,4000)),randRange(4,8),foodColor));
	}
}

function addDemoCreatures() {
	let crNo = (Math.random() * 2) + 1;
	for (let i = 0; i < crNo; i ++) {
		let xOffset = (Math.random() * 1024) + 1024;
		let yOffset = (Math.random() * 1024) + 1024;
		creaturesList.push(new creature(new vector2(xOffset,yOffset),16,8,null));

		document.getElementById("load")!.innerHTML = (creaturesList.length).toString();
	}
}

function editorSubmit() {	
	let newTraits = new creatureTraits(null);
	let range = document.querySelectorAll(".slider");

	range.forEach(protoSlider => {
		let slider = protoSlider as HTMLInputElement;
		let name = slider.name;
		let value = Number(slider.value);

		if (name != null && value != null) {
			newTraits.editTrait(name,value);
		}

	});
	let mouseCoordPos = new vector2(activeArea[0].x + 24 + mousePos.x,activeArea[0].y + 24 + mousePos.y);
	mouseCoordPos.x = Math.max(Math.min(mouseCoordPos.x,4096),0);
	mouseCoordPos.y = Math.max(Math.min(mouseCoordPos.y,4096),0);

	creaturesList.push(new creature(mouseCoordPos,16,8,[newTraits]));
}

function initEditor() {
	let addButton = document.getElementById("addButton") as HTMLInputElement;

	if (addButton != null) {
		addButton.onclick = function() { editorSubmit() };
	}

}

export function sortList() {
	creaturesList = quickSort(creaturesList);
}

export function quickSort(unsorted: Array<creature>): Array<creature> {
	let result = unsorted;	
	if (unsorted.length > 1) {
		let pivot = Math.floor(unsorted.length / 2);
		let small = [];
		let equal = [];
		let large = [];

		for (let i = 0; i < unsorted.length; i++) {
			if (unsorted[i].head.pos.y > unsorted[pivot].head.pos.y) {
				large.push(unsorted[i]);
			} else if (unsorted[i].head.pos.y < unsorted[pivot].head.pos.y) {
				small.push(unsorted[i])
			} else {
				equal.push(unsorted[i]);
			}

			let small_sorted = quickSort(small);
			let large_sorted = quickSort(large);

			result = small_sorted.concat(equal).concat(large_sorted);
		}
	}
	return result;
}

setupApp();
initIdList();
initGrid();

tick();
addDemoCreatures();
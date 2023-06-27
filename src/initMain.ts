import { webFrame } from "electron";
import { creature } from "./creatureMain";
import { creatureHead } from "./jointHead";
import { initIdList, preColours, randRange, vector2 } from "./globals";
import { initGrid, posGrid } from "./handleGrid";
import { tick } from "./handleTick";
import { food } from "./food";
import { creatureTraits } from "./creatureTraits";
import { particle } from "./particle";
import { initSidenav, loadState, toast } from "./saveLoadHandler";
import { creatureBody } from "./jointBody";
import { creatureLeg } from "./limbLeg";

export var appId: number;

export const canvas = document.getElementById("canvas") as HTMLCanvasElement; //setting up the usual HTML canvas context
export const ctx = canvas.getContext("2d") as CanvasRenderingContext2D;

export const wheel = document.querySelector('.wheel') as HTMLDivElement; //setting up the popup wheel
export var tool: number = 1; //tools are 1 for grab hand, 2 for magnifying glass, 3 for food, 4 for editor

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

export var simPrefs: { [key: string]: number } = {
	"foodSpawnRate": 20,
	"universalHostility": 0,
	"universalRespect": 0,
}

export var userPrefs: { [key: string]: number } = {
	"graphics": 0,
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
var wheelSelection: number = 1; //what the mouse is hovering over on the wheel
var wheelPos: vector2 = new vector2(mousePos.x,mousePos.y); //the position of the wheel, as it may be different from the mouse position
var isConsoleOpen: boolean = true;  //whether the debug console is showing

function setupApp() { //creates all the event listeners, triggers the rendering and setup
	toggleCommandBox();
	initSidenav();
	
	let lookupbox = document.getElementById("lookup") as HTMLInputElement;
	lookupbox.onclick = function() { showIdPrompt() };

	let settingsbox = document.getElementById("settings") as HTMLInputElement;
	settingsbox.onclick = function() { showSimSettings() };

	let universalHostilitySlider = document.getElementById("universal_hostility") as HTMLInputElement;
	universalHostilitySlider.addEventListener("change", function() {
		simPrefs.universalHostility = universalHostilitySlider.valueAsNumber;
	});

	let universalRespectSlider = document.getElementById("universal_respect") as HTMLInputElement;
	universalRespectSlider.addEventListener("change", function() {
		simPrefs.universalRespect = universalRespectSlider.valueAsNumber;
	});

	let foodSpawnRateSlider = document.getElementById("food_spawn_rate") as HTMLInputElement;
	foodSpawnRateSlider.addEventListener("change", function() {
		simPrefs.foodSpawnRate = foodSpawnRateSlider.valueAsNumber;
	});

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
				if (entity.entityType == "creature") { //checks it's ACTUALLY a creature currently being hovered over, in case there's something weird with the grid
					entity = entity as creature;
					entity.generatePath(4);
					entity.behaviourTree();
				} else { //if the mouse is currently not hovering over the right creature, it does a basic linear search through the creature list for the right one
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
		if (tool == 4 && isLeftMouseDown) {
			handleTool();
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
			
		} else if (event.code.slice(0,5) == "Digit") {
			let numPressed = parseInt(event.key);
			if (numPressed < 5) {
				tool = numPressed;
			}
		} else if (isWheelShowing) {
			if (event.code == "ArrowUp") {
				wheelSelection = 1;
			} else if (event.code == "ArrowRight") {
				wheelSelection = 2;
			} else if (event.code == "ArrowDown") {
				wheelSelection = 3;
			} else if (event.code == "ArrowLeft") {
				wheelSelection = 4;
			}
			wheel.setAttribute('data-chosen', wheelSelection.toString());
		}
	});

	document.addEventListener("keyup", (event: KeyboardEvent) => {
		if (event.code == "Backquote" && isWheelShowing) {
			hideWheel();
		}
	});
	initNavigation();
	initEditor();
}

function showIdPrompt() {
	let idbar = document.getElementById("idbar") as HTMLInputElement;
	idbar.classList.toggle("on");
	idbar.focus();
}

function showSimSettings() {
	let settingsBox = document.getElementById("settingsCallout") as HTMLInputElement;
	
	if (settingsBox.style.display != "block") {
		settingsBox.style.display = "block";
	} else {
		settingsBox.style.display = "none";
	}
	

}

function checkForLoad() {
	let currentUrl = new URL(window.location.toLocaleString());
	let isLoading = currentUrl.searchParams.get("load");
	if (isLoading != "false" && isLoading != null) {
		loadState(parseInt(isLoading));
	} else {
		addRandomCreature();
	}
}

function addRandomCreature() {
	creaturesList.push(new creature(new vector2(randRange(1000,1800),randRange(1000,1800)),Math.round(randRange(8,24)),Math.round(randRange(4,16)),null,""));
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

	switch (selected) {
		case (0):
			canvas.style.cursor = "default";
			break;
		case (1):
			canvas.style.cursor = "move";
			break;
		case (2):
			canvas.style.cursor = "pointer";
			break;
		case (3):
			canvas.style.cursor = "grab";
			break;
		case (4):
			canvas.style.cursor = "grabbing";
			break;
	}
	cursorChoice = [false,false,false,false,false];
}

function toggleCommandBox() {
	let commandbar = document.getElementById("commandbar") as HTMLInputElement;
	if (commandbar != undefined) {
		if (isConsoleOpen) {
			commandbar.classList.remove("on");
			isConsoleOpen = false;
		} else {
			commandbar.classList.toggle("on");
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
		mouseCoordPos.x = Math.max(Math.min(mouseCoordPos.x,4095),1);
		mouseCoordPos.y = Math.max(Math.min(mouseCoordPos.y,4095),1);
		let mouseGridPos = new vector2(Math.floor(mouseCoordPos.x / 16),Math.floor(mouseCoordPos.y / 16));

		for (let i = -1; i < 2; i++) {
			for (let j = -1; j < 2; j++) {
				if (posGrid[mouseGridPos.x + i][mouseGridPos.y + j] != "" && posGrid[mouseGridPos.x + i][mouseGridPos.y + j]) {
					if (entityDict[posGrid[mouseGridPos.x + i][mouseGridPos.y + j]].entityType == "creature") {
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
	if (!isPaused && !isWheelShowing && mousePos.x > 20 && !(mousePos.y < 90 && mousePos.x < 54)) {
		let mouseCoordPos = new vector2(activeArea[0].x + 24 + mousePos.x,activeArea[0].y + 24 + mousePos.y);
		mouseCoordPos.x = Math.max(Math.min(mouseCoordPos.x,4095),1);
		mouseCoordPos.y = Math.max(Math.min(mouseCoordPos.y,4095),1);
		let mouseGridPos = new vector2(Math.floor(mouseCoordPos.x / 16),Math.floor(mouseCoordPos.y / 16));
		if (tool ==  2) {
			let clickedEntityId = posGrid[mouseGridPos.x][mouseGridPos.y];
			if (clickedEntityId != "") {
				if (entityDict[clickedEntityId] != undefined) {
					if (entityDict[clickedEntityId].entityType == "creature") {
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
				if (clickedEntityId != "" && clickedEntityId) {
					if (entityDict[clickedEntityId].entityType == "creature") {
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
				foodList.push(new food(new vector2(mouseCoordPos.x,mouseCoordPos.y),randRange(4,6),foodColor,""));

			} else if (tool == 4) {
				let editDiv = document.getElementById("creatureEditorCallout");
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
		if (document.activeElement == commandbar) {
			let command = (commandbar.value).replace("/","");
			if (debugPrefs.hasOwnProperty(command)) {
				debugPrefs[command] = !debugPrefs[command];
				commandbar.value = "";
			} else {
				let splitCommand = command.split(" ");
				if (splitCommand[0] == "teleport" || splitCommand[0] == "tp") {
					let affectedCreature = entityDict[splitCommand[1]]
					if (affectedCreature.entityType == "creature" ) {
						affectedCreature = affectedCreature as creature;
						let xGoal = parseInt(splitCommand[2]);
						let yGoal = parseInt(splitCommand[3]);

						affectedCreature.head.pos = new vector2(xGoal,yGoal);
						affectedCreature.generatePath(4);
					} else {
						alert("Creature not found.");
					}
				} else {
					alert("Command not recognised: "+splitCommand[0]);
				}
			}
		} else {
			let idbar = document.getElementById("idbar") as HTMLInputElement;
			if (document.activeElement == idbar) {
				let givenId = idbar.value.toUpperCase();
				idbar.classList.remove("on");
				idbar.value = "";

				if (entityDict[givenId] != null) {
					if (entityDict[givenId].entityType == "creature") {
						checkedCreature = entityDict[givenId] as creature;
						let panelDiv = document.getElementById("callout");
						if (panelDiv != undefined) {
							panelDiv.style.display = "inline";
						} else {
							console.error("Could not find callout element!");
						}
					} else {
						toast("id_invalid","#e83b3b","0");
					}
				} else {
					toast("id_unrecognised","#e83b3b","0");
				}
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
	webFrame.setZoomFactor(1.0);
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
		foodList.push(new food(new vector2(randRange(96,4000),randRange(96,4000)),randRange(4,8),foodColor,""));
	}
}

function editorSubmit() {	
	let newTraits = new creatureTraits(null);
	let range = document.querySelectorAll(".slider");

	let sliders = document.querySelectorAll(".editorSliderDiv");
	sliders.forEach(protoSliderDiv => {
		let sliderDiv = protoSliderDiv as HTMLDivElement;
		let traitName = sliderDiv.id;

		range = sliderDiv.querySelectorAll(".slider");
		range.forEach(protoTraitSlider => {
			let traitSlider = protoTraitSlider as HTMLInputElement;
			let traitProp = traitSlider.name;
			let traitVal = Number(traitSlider.value);

			newTraits.editTrait(traitName,traitProp,traitVal);
		})
	});

	let mouseCoordPos = new vector2(activeArea[0].x + 24 + mousePos.x,activeArea[0].y + 24 + mousePos.y);
	mouseCoordPos.x = Math.max(Math.min(mouseCoordPos.x,4095),1);
	mouseCoordPos.y = Math.max(Math.min(mouseCoordPos.y,4095),1);

	creaturesList.push(new creature(mouseCoordPos,16,8,[newTraits],""));
}

function initEditor() {
	let addButton = document.getElementById("addButton") as HTMLInputElement;

	if (addButton != null) {
		addButton.onclick = function() { editorSubmit() };
	}

	let randButton = document.getElementById("randButton") as HTMLInputElement;
	if (randButton != null) {
		randButton.onclick = function() { addRandomCreature() };
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

export function prepForLoad() {
	entityDict = {};
	creaturesList = [];
	foodList = [];
	particleList = [];
}

export function loadNewCreature(loadedCreature: { [key:string]:any }, id: string) {
	let newPos = new vector2(loadedCreature["segments"][0].pos.x,loadedCreature["segments"][0].pos.y);
	creaturesList.push(new creature(newPos,loadedCreature.bodyLength,loadedCreature.maxDist,null,loadedCreature.id));
	let tempCreature = entityDict[id] as creature;
	let newTraits = new creatureTraits(null);
	newTraits = Object.assign(newTraits,loadedCreature["properties"]);
	tempCreature.properties = Object.assign(tempCreature.properties,newTraits);

	tempCreature.target = new vector2(tempCreature.target.x,tempCreature.target.y);

	for (let i = 0; i < tempCreature.path.length; i++) {
		tempCreature.path[i] = new vector2(tempCreature.path[i].x,tempCreature.path[i].y);
	}

	for (let i = 0; i < tempCreature.bodyLength; i++) {
		tempCreature.segments[i] = Object.assign(tempCreature.segments[i],loadedCreature["segments"][i]);
		tempCreature.segments[i].pos = new vector2(tempCreature.segments[i].pos.x,tempCreature.segments[i].pos.y);
	}
	
	for (let i = 0; i < tempCreature.bodyLength; i++) {
		let frontChildIndex = loadedCreature.segments[i].childJoint;
		tempCreature.segments[i].childJoint = tempCreature.segments[frontChildIndex];
		if (tempCreature.segments[i].backChildJoint.length > 0) {
			for (let j = 0; j < tempCreature.segments[i].backChildJoint.length; j++) {
				let backChildIndex = loadedCreature.segments[i].backChildJoint[j];
				tempCreature.segments[i].backChildJoint[j] = tempCreature.segments[backChildIndex];
			}
		}

		if (i < tempCreature.bodyLength - 1) {
			let tempBody = tempCreature.segments[i] as creatureBody;
			if (tempBody.legs.length > 0) {
				let legLength = loadedCreature.segments[i].legs[0].legLength;
				let width = loadedCreature.segments[i].legs[0].width;
				let legAngle = loadedCreature.segments[i].legs[0].legAngle;
				tempBody.legs = [new creatureLeg(0,tempBody.pos,tempBody.colour,-1,legLength,width,legAngle),new creatureLeg(1,tempBody.pos,tempBody.colour,1,legLength,width,legAngle)];
				tempBody.legs[0].pair = tempBody.legs[1];
				tempBody.legs[1].pair = tempBody.legs[0];
				
				for (let j = 0; j < tempBody.legs.length; j++) {
					let tempElbowPos = loadedCreature.segments[i].legs[j].elbowPos;
					tempBody.legs[j].elbowPos = new vector2(tempElbowPos.x,tempElbowPos.y);
					
					let tempFootPos = loadedCreature.segments[i].legs[j].footPos;
					tempBody.legs[j].footPos = new vector2(tempFootPos.x,tempFootPos.y);

					tempBody.legs[j].isFootUp = loadedCreature.segments[i].legs[j].isFootUp;
					
					
				}
			}
			tempCreature.segments[i] = tempBody;
		}
	}

	tempCreature.head = tempCreature.segments[0] as creatureHead;
	
	for (let key in loadedCreature) {
		let propType = typeof loadedCreature[key];
		if (propType == "string" || propType == "number" || propType == "boolean") {
			tempCreature.loadProperty(key,loadedCreature[key]);
		}
	}
	entityDict[id] = tempCreature;
}

export function loadNewFood(loadedFood: food) {
	foodList.push(loadedFood);
}

setupApp();
initIdList();
initGrid();
checkForLoad();


tick();
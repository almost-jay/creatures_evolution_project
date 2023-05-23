
const canvas = document.getElementById("canvas");
const ctx = canvas.getContext("2d");

const heldWindow = document.getElementById("heldPiece");
const heldctx = heldWindow.getContext("2d");

const piecePreview = document.getElementById("preview");
const prevctx = piecePreview.getContext("2d");


const cellSize = 30;
const gap = 5;
const corner = 6;

const kickReference = {
	"i": {
		0: [[0,0],[-2,0],[1,0],[-2,-1],[1,2]],
		1: [[0,0],[-1,0],[2,0],[-1,2],[2,-1]],
		2: [[0,0],[2,0],[-1,0],[2,1],[-1,-2]],
		3: [[0,0],[1,0],[-2,0],[1,-2],[-2,1]],
	},
	"other": {
		0: [[0,0],[-1,0],[-1,1],[0,-2],[-1,-2]],
		1: [[0,0],[1,0],[1,-1],[0,2],[1,2]],
		2: [[0,0],[1,0],[1,1],[0,-2],[1,-2]],
		3: [[0,0],[-1,0],[-1,-1],[0,2],[-1,2]],
	}
}

const tBackReference = {
	0: [[-1,1],[0,1],[1,1]],
	1: [[-1,-1],[-1,0],[-1,1]],
	2: [[-1,-1],[0,-1],[1,-1]],
	3: [[1,-1],[1,0],[1,1]],
}

const tCornerReference = {
	0: [[-1,1],[1,-1]],
	1: [[1,-1],[1,-1]],
	2: [[-1,1],[1,1]],
	3: [[-1,1],[-1,1]],
}

const blockReference = {
	"i": {
		"colour": "#74C99E",
		"xOffset": 0.5,
		"yOffset": 1,
		0: [[0,0,0,0],
			[1,1,1,1],
			[0,0,0,0],
			[0,0,0,0]],

		1: [[0,0,1,0],
			[0,0,1,0],
			[0,0,1,0],
			[0,0,1,0]],

		2: [[0,0,0,0],
			[0,0,0,0],
			[1,1,1,1],
			[0,0,0,0]],
		
		3: [[0,1,0,0],
			[0,1,0,0],
			[0,1,0,0],
			[0,1,0,0]],
	},

	"o": {
		"colour": "#DB604C",
		"xOffset": 0.5,
		"yOffset": 0.5,
		0: [[0,0,0,0],
			[0,1,1,0],
			[0,1,1,0],
			[0,0,0,0]],

		1: [[0,0,0,0],
			[0,1,1,0],
			[0,1,1,0],
			[0,0,0,0]],

		2: [[0,0,0,0],
			[0,1,1,0],
			[0,1,1,0],
			[0,0,0,0]],
		
		3: [[0,0,0,0],
			[0,1,1,0],
			[0,1,1,0],
			[0,0,0,0]],
	},

	"t": {
		"colour": "#B13353",
		"xOffset": 1,
		"yOffset": 1.5,
		0: [[0,1,0],
			[1,1,1],
			[0,0,0]],

		1: [[0,1,0],
			[0,1,1],
			[0,1,0]],
		
		2: [[0,0,0],
			[1,1,1],
			[0,1,0]],
		
		3: [[0,1,0],
			[1,1,0],
			[0,1,0]],
	},

	"l": {
		"colour": "#6A3771",
		"xOffset": 1,
		"yOffset": 1.5,
		0: [[0,0,1],
			[1,1,1],
			[0,0,0]],

		1: [[0,1,0],
			[0,1,0],
			[0,1,1]],
		
		2: [[0,0,0],
			[1,1,1],
			[1,0,0]],
		
		3: [[1,1,0],
			[0,1,0],
			[0,1,0]],
	},

	"j": {
		"colour": "#317C87",
		"xOffset": 1,
		"yOffset": 1.5,
		0: [[1,0,0],
			[1,1,1],
			[0,0,0]],

		1: [[0,1,1],
			[0,1,0],
			[0,1,0]],
		
		2: [[0,0,0],
			[1,1,1],
			[0,0,1]],
		
		3: [[0,1,0],
			[0,1,0],
			[1,1,0]],
	},

	"s": {
		"colour": "#5E2052",
		"xOffset": 1,
		"yOffset": 1.5,
		0: [[0,1,1],
			[1,1,0],
			[0,0,0]],

		1: [[0,1,0],
			[0,1,1],
			[0,0,1]],
		
		2: [[0,0,0],
			[0,1,1],
			[1,1,0]],
		
		3: [[1,0,0],
			[1,1,0],
			[0,1,0]],
	},

	"z": {
		"colour": "#F48CB6",
		"xOffset": 1,
		"yOffset": 1.5,
		0: [[1,1,0],
			[0,1,1],
			[0,0,0]],

		1: [[0,0,1],
			[0,1,1],
			[0,1,0]],
		
		2: [[0,0,0],
			[1,1,0],
			[0,1,1]],
		
		3: [[0,1,0],
			[1,1,0],
			[1,0,0]],
	},
}

var lastKey = "";
var timestamp = 0;
var direction = 0;
var dropSpeed = gravity;
var screenShake = {
	"duration": 0,
	"strength": 0,
	"on": false, 
};
var isPaused = false;
var tweens = [];
var gradients = [];
var tSpin = 0;
var level = 0;
var lines = 0;
var totalLines = 0;
var oldTotalLines = 0;
var difficultCombo = 0;
var gravity = 48;
var softDropCount = 0;

var showPreview = false;
var score = 0;
var activePiece;
var heldPiece;
var canSwap = true;
var board = [[0,0,0,0,0,0,0,0,0,0],
			[0,0,0,0,0,0,0,0,0,0],
			[0,0,0,0,0,0,0,0,0,0],
			[0,0,0,0,0,0,0,0,0,0],
			[0,0,0,0,0,0,0,0,0,0],
			[0,0,0,0,0,0,0,0,0,0],
			[0,0,0,0,0,0,0,0,0,0],
			[0,0,0,0,0,0,0,0,0,0],
			[0,0,0,0,0,0,0,0,0,0],
			[0,0,0,0,0,0,0,0,0,0],
			[0,0,0,0,0,0,0,0,0,0],
			[0,0,0,0,0,0,0,0,0,0],
			[0,0,0,0,0,0,0,0,0,0],
			[0,0,0,0,0,0,0,0,0,0],
			[0,0,0,0,0,0,0,0,0,0],
			[0,0,0,0,0,0,0,0,0,0],
			[0,0,0,0,0,0,0,0,0,0],
			[0,0,0,0,0,0,0,0,0,0],
			[0,0,0,0,0,0,0,0,0,0],
			[0,0,0,0,0,0,0,0,0,0],
			[0,0,0,0,0,0,0,0,0,0],
			[0,0,0,0,0,0,0,0,0,0]];
var pieceBag = ["i","o","t","j","l","z","s","i","o","t","j","l","z","s"];
var bagIndex = 0;
var softScore = 0;

//types of tetrominos:
//i
//o
//t
//l
//j
//s
//z

//i and o spawn centrally, all others spawn rounded to the left
//for all standard pieces, their centre is 1,1

class tetromino {
	constructor(type) {
		this.type = type;
		this.rotation = 0;
		this.blocks = initBlocks(type);
		this.state = 0;
		if (this.type != "i") {
			this.x = 4;
		} else {
			this.x = 5;
		}
		this.y = 1;
		this.flashCounter = 0;
	}

	render() {
		for (let i = 0; i < this.blocks.length; i++) {
			if (this.flashCounter > 0) {
				this.flashCounter --;
				ctx.fillStyle = "rgba(255,255,255,"+Math.min(1.0,this.flashCounter / 4)+")";
			} else {
				ctx.fillStyle = blockReference[this.type]["colour"];
			}
			ctx.beginPath();
			ctx.roundRect(this.blocks[i].x * cellSize + (gap / 2),(this.blocks[i].y - 2) * cellSize + (gap / 2),cellSize - gap, cellSize - gap,corner);
			ctx.fill();
		}
	}

	checkHitbox() {
		if (this.state == 0) {
			for (let i = 0; i < this.blocks.length; i++) {
				if (this.blocks[i].y > 20 || board[this.blocks[i].y + 1][this.blocks[i].x] != 0) {
					this.state = 1;
				}
			}
		} else if (this.state == 1 && this.flashCounter == 0) {		
			if (this.blocks[this.blocks.length - 1].y < 2) {
				reset();
			} else {
				this.flashCounter = 12;
				this.state = 2;
			}
		}
		
		if (this.state == 2) {
			this.placePiece();
		}
	}

	dropBlock() {
		this.checkHitbox();
		if (this.state == 0) {
			for (let i = 0; i < this.blocks.length; i++) {
				this.blocks[i].y += 1;
			}
			this.y += 1;
			if (dropSpeed != gravity) {
				softDropCount++;
			}
		}
	}

	hardDrop() {
		if (this.flashCounter == 0) {
			let maxDistAll = 22;
			this.checkHitbox();
			for (let i = 0; i < this.blocks.length; i++) {
				let j = 0;	
				while (j + this.blocks[i].y < 22 && board[j + this.blocks[i].y][this.blocks[i].x] == 0) {
					j++;
				}
				if (j < maxDistAll) {
					maxDistAll = j;
				}
			}

			maxDistAll -= 1;
			this.y += maxDistAll;
			score += 2 * maxDistAll;

			let startX = 10;
			let endX = 0;
			let startY = 0;
			let endY = 22;
			
			for (let i = 0; i < this.blocks.length; i++) {
				this.blocks[i].y += maxDistAll;

				if (this.blocks[i].y > startY) {
					startY = this.blocks[i].y;
				}
				if (this.blocks[i].y < endY) {
					endY = this.blocks[i].y;
				}
				if (this.blocks[i].x < startX) {
					startX = this.blocks[i].x;
				}
				if (this.blocks[i].x > endX) {
					endX = this.blocks[i].x;
				}
			}

			gradients.push({
				"stops": [blockReference[this.type]["colour"],"#FFFFFF00"],
				"pos": [startX * cellSize,(startY - 1) * cellSize,(endX + 1) * cellSize,(endY - 4) * cellSize],
				"counter": 0,
				"endCount": 15
			});


			screenShake.duration += 3;
			screenShake.strength += 5;
			screenShake.on = true;

			this.flashCounter = 12;
			this.state = 2;
		}
	}

	move(direction) {
		if (this.state != 2 && this.flashCounter == 0) {
			let canMove = true;
			for (let i = 0; i < this.blocks.length; i++) {
				if (this.blocks[i].x + direction > 9 || this.blocks[i].x + direction < 0) {
					canMove = false;
				} else if (board[this.blocks[i].y][this.blocks[i].x + direction] != 0) {
					canMove = false;
				}
			}

			if (canMove) {
				for (let i = 0; i < this.blocks.length; i++) {
					this.blocks[i].x += direction;
				}
				this.x += direction;
				this.checkHitbox();
			}
		}
	}

	rotate() {
		if (this.flashCounter == 0) {
			let futureRotationVal = this.rotation + 1;
			if (futureRotationVal > 3) {
				futureRotationVal = 0;
			}
			let canRotate = false;
			let rotateScaffold = blockReference[this.type][futureRotationVal];
			let positions = kickReference["i"][this.rotation];
			let blockIndex = 0;
			let offset = [0,0];
			
			for (let i = 0; i < positions.length; i++) {
				let pass = true;
				for (let j = 0; j < rotateScaffold.length; j++) {
					for (let k = 0; k < rotateScaffold[j].length; k++) {
						if (rotateScaffold[j][k],[0,0]) {
							let x = k + this.x - 1 + positions[i][0];
							if (this.type == "i") {
								let x = j + this.x - 2 + positions[i][0];
							}
							let y = j + this.y - 1 + positions[i][0];
							
							if (x < 0 || x > 9 || y < 0 || y > 21) {
								pass = false;
							} else {
								if (board[y][x] != 0) {
									pass = false;

								}
							}

							blockIndex += 1;
						}
					}
				}
				if (pass) {
					canRotate = true;
					offset = positions[i];
					i = positions.length;
				}
			}

			if (canRotate) {
				this.rotation = futureRotationVal;
				let blockIndex = 0;
				for (let i = 0; i < rotateScaffold.length; i++) {
					for (let j = 0; j < rotateScaffold[i].length; j++) {
						if (rotateScaffold[i][j]) {
							if (this.type == "i") {
								this.blocks[blockIndex].x = j + this.x - 2 + offset[0];
							} else {
								this.blocks[blockIndex].x = j + this.x - 1 + offset[0];
							}
							this.blocks[blockIndex].y = i + this.y - 1 + offset[1];

							blockIndex += 1;
						}
					}
				}
			}
		}
	}

	placePiece() {
		if (this.flashCounter == 0) {
			if (lastKey == "ArrowUp") {
				if (this.type == "t") {
					let corners = tCornerReference[this.rotation];
					let cornerPass = 0;
					for (let i = 0; i < 2; i++) {
						let xPos = corners[i][0] + this.x;
						let yPos = corners[i][1] + this.y;
						if (xPos < 10 && xPos > -1 && yPos < 22 && yPos > -1) {
							if (board[yPos][xPos] != 0) {
								cornerPass++;
							}
						} else {
							cornerPass++;
						}
					}

					if (cornerPass > 0) {
						let back = tBackReference[this.rotation];
						let backPass = 0;
						for (let i = 0; i < back.length; i++) {
							let xPos = back[i][0] + this.x;
							let yPos = back[i][1] + this.y;
							if (xPos < 10 && xPos > -1 && yPos < 22 && yPos > -1) {
								if (board[yPos][xPos] != 0) {
									backPass++;
								}
							} else {
								backPass++;
							}
						}

						if (cornerPass + backPass > 2) {
							tSpin = cornerPass;
							score += (300 * tSpin) - 200;
							screenShake.duration += 6;
							screenShake.strength += tSpin * 2;
							screenShake.on = true;
						}
					}
				}
			}
			this.state = 2;
			for (let i = 0; i < this.blocks.length; i++) {
				board[this.blocks[i].y][this.blocks[i].x] = this.type;
			}

			if (dropSpeed < gravity) {
				screenShake.duration += 7;
				screenShake.strength += 2;
				screenShake.on = true;
				score += softDropCount;
			}

			addNewBlock();
			checkForFill();
		}
	}
}

class block {
	constructor(x,y) {
		this.x = x;
		this.y = y;
	}
}

function initBlocks(type) {
	let scaffold = blockReference[type][0];
	let blocks = [];
	for (let i = 0; i < scaffold.length; i++) {
		for (let j = 0; j < scaffold[i].length; j++) {
			if (scaffold[i][j]) {
				blocks.push(new block(j + 3,i));
			}
		}
	}

	return blocks;
}

function reset() {
	ctx.fillStyle = "#1A1016";
	ctx.font = "8px sans-serif";
	
	level = 0;
	lines = 0;
	totalLines = 0;
	lastKey = "";
	score = 0;
	document.getElementById("score").innerHTML = 0;
	timestamp = 0;
	direction = 0;
	softDropCount = 0;
	difficultCombo = 0;
	gravity = 48;
	dropSpeed = gravity;
	screenShake = {
		"duration": 0,
		"strength": 0,
		"on": false, 
	};
	tweens = [];
	gradients = [];
	activePiece;
	heldPiece;
	canSwap = true;
	tSpin = 0;
	difficultCombo = 0;
	checkLevel();
	clearBoard();
	pieceBag = ["i","o","t","j","l","z","s","i","o","t","j","l","z","s"];
	bagIndex = 0;

	canvas.style.transform = "translate(0px, 0px)"
	testInit();
}

function testInit() {
	clearBoard();
	document.addEventListener("keydown", function(event) {
		lastKey = event.key;
		if (event.key == "ArrowDown") {
			dropSpeed = 0.1 * gravity;
			event.preventDefault();
		} else if (event.key == "ArrowUp") {
			activePiece.rotate();
			event.preventDefault();
		} else if (event.key == "ArrowLeft") {
			direction -= 1;
			event.preventDefault();
		} else if (event.key == "ArrowRight") {
			direction += 1;
			event.preventDefault();
		} else if (event.key == "Escape") {
			event.preventDefault();
			isPaused = !isPaused;
			if (isPaused) {
				document.getElementById("pausePopup").style.display = "block";
			} else {
				document.getElementById("pausePopup").style.display = "none";
			}
		} else if (event.key == " ") {
			event.preventDefault();
			activePiece.hardDrop();
		} else if (event.key == "Shift") {
			event.preventDefault();
			swapHeldPiece();
		}
	});

	document.addEventListener("keyup", function(event) {
		if (event.key == "ArrowDown") {
			dropSpeed = gravity;
			softDropCount = 0;
		}
	});
	resetRender();
	addNewBlock();
}

function swapHeldPiece() {
	if (canSwap) {
		canSwap = false;
		if (!heldPiece) {
			heldPiece = activePiece.type;
			addNewBlock();
		} else {
			let newPiece = heldPiece;
			heldPiece = activePiece.type;
			activePiece = new tetromino(newPiece);
		}

		renderHeldPiece();

	} else {
		screenShake.duration += 4;
		screenShake.strength += 6;
		screenShake.on = true;
	}
}

function renderHeldPiece() {
	if (heldPiece) {
		heldctx.fillStyle = "#1A1016FF";
		heldctx.beginPath();
		heldctx.roundRect(0,0,150,150,20);
		heldctx.fill();

		if (canSwap) {
			heldctx.fillStyle = blockReference[heldPiece]["colour"];
		} else {
			heldctx.fillStyle = blockReference[heldPiece]["colour"]+"60";
		}
		let scaffold = blockReference[heldPiece][0];
		for (let i = 0; i < scaffold.length; i++) {
			for (let j = 0; j < scaffold[i].length; j++) {
				if (scaffold[i][j] > 0) {
					heldctx.beginPath();
					heldctx.roundRect((j + blockReference[heldPiece].xOffset) * cellSize + (gap / 2),(i + blockReference[heldPiece].yOffset) * cellSize + (gap / 2),cellSize - gap, cellSize - gap,corner);
					heldctx.fill();
				}
			}
		}
	}
}

function renderPiecePreview() {
	prevctx.fillStyle = "#1A1016FF";
	prevctx.beginPath();
	prevctx.roundRect(0,0,150,450,20);
	prevctx.fill();
	for (let i = 0; i < 4; i++) {
		let previewIndex = bagIndex + i;
		if (previewIndex >= pieceBag.length) {
			previewIndex -= pieceBag.length;
		}
		let scaffold = blockReference[pieceBag[previewIndex]][0];
		prevctx.fillStyle = blockReference[pieceBag[previewIndex]]["colour"];
		for (let j = 0; j < scaffold.length; j++) {
			for (let k = 0; k < scaffold[j].length; k++) {
				if (scaffold[j][k] > 0) {
					prevctx.beginPath();
					prevctx.roundRect((k + blockReference[pieceBag[previewIndex]].xOffset) * cellSize + (gap / 2),(j + blockReference[pieceBag[previewIndex]].yOffset) * cellSize + (gap / 2) + ((i - 1) * 150),cellSize - gap, cellSize - gap, corner);
					prevctx.fill();
				}
			}
		}
	}

}

function checkForFill() {
	let fillCount = 0;
	let filledRows = []
	
	for (let i = 2; i < 22; i++) {
		let isFilled = true;
		for (let j = 0; j < 10; j++) {
			if (board[i][j] == 0) {
				isFilled = false;
			}
		}

		if (isFilled) {
			filledRows.push(i);
			fillCount += 1;
			screenShake.on = true;
			screenShake.duration += 5;
			screenShake.strength += 6;
			
			tSpin = 0;
			if (tSpin == 1) {
				difficultCombo++;
				if (fillCount == 1) {
					score += 200;
				} else if (fillCount == 2) {
					score += 400;
				} else {
					console.error("How did you even get to this point?");
				}
			} else if (tSpin == 2) {
				difficultCombo++;
				if (fillCount == 1) {
					score += 800;
				} else if (fillCount == 2) {
					score += 1200;
				} else if (fillCount == 3) {
					score += 1600;
				} else {
					console.error("How did you even get to this point?");
				}
			} else {
				if (fillCount == 4) {
					score += 800;
					difficultCombo++;
				} else {
					difficultCombo = 0;
					if (fillCount == 1) {
						score += 100;
					} else if (fillCount == 2) {
						score += 300;
					} else if (fillCount == 3) {
						score += 500;
					}
				}
			}
			if (difficultCombo > 1) {
				difficultCombo = 0;
				score *= 1.5;
				screenShake.duration += 8;
				screenShake.strength += 2;
			}

			lines += fillCount;
			totalLines += fillCount;
			checkLevel();
		}
	}
	for (let i = 0; i < fillCount; i++) {
		screenShake.duration += 0.25;
		screenShake.strength += 2;
		animateClear(board.splice(filledRows[i],1),filledRows[i]);
		board.unshift([0,0,0,0,0,0,0,0,0,0]);
	}
}

function checkLevel() {
	let requiredLines = 100;
	if (level < 10) {
		requiredLines = (level + 1) * 10;
	}

	if (level > 14) {
		requiredLines = (level - 5) * 10;
	}

	if (level > 25) {
		requiredLines = 200;
	}

	if (lines >= requiredLines) {
		level++;
		lines = 0;
		document.getElementById("level").innerHTML = level;
		increaseGravity();
	}

	let linePercent = (lines / requiredLines) * 100;
	document.getElementById("circle").style.setProperty("--percent",linePercent+"%");
}

function increaseGravity() {
	if (level < 9) {
		gravity = (-5 * level) + 48;
	} else if (level < 13) {
		gravity = 5;
	} else if (level < 16) {
		gravity = 4;
	} else if (level < 19) {
		gravity = 3;
	} else if (level < 29) {
		gravity = 2;
	} else {
		gravity = 1;
	}
}

function animateClear(clearedRow,yLevel) {
	clearedRow = clearedRow[0];
	for (let i = 0; i < clearedRow.length; i++) {
		tweens.push({ 
			"colour": blockReference[clearedRow[i]]["colour"],
			"x": i,
			"endY": 25,
			"startY": yLevel + 1,
			"counter": 0,
			"endCount": (23 - yLevel) * 8,
		});
	}
}

function addNewBlock() {
	tSpin = 0;
	softDropCount = 0;
	dropSpeed = gravity;
	let selection = drawFromBag();
	activePiece = new tetromino(selection);
	canSwap = true;
	renderHeldPiece();
	renderPiecePreview();
}

function drawFromBag() {
	bagIndex++;
	if (bagIndex >= pieceBag.length) {
		bagIndex = 0;
	}
	if (bagIndex == 7) {
		let firstHalf = pieceBag.slice(0,7);
		let secondHalf = pieceBag.slice(7,14);
		pieceBag = shuffle(firstHalf).concat(secondHalf);
	}

	if (bagIndex == 0) {
		let firstHalf = pieceBag.slice(0,7);
		let secondHalf = pieceBag.slice(7,14);
		pieceBag = firstHalf.concat(shuffle(secondHalf));
	}
	let result = pieceBag[bagIndex];
	return result;
}
	
function shuffle(arr) {
	for (let i = arr.length - 1; i > 0; i--) {
		let j = Math.floor(Math.random() * (i + 1));
		let temp = arr[i];
		arr[i] = arr[j];
		arr[j] = temp;
	}

	return arr;
}

function resetRender() {
	ctx.beginPath();
	ctx.clearRect(0,0,300,800);
	ctx.fillStyle = "#1A1016";
	ctx.beginPath();
	ctx.fillRect(0,0,300,600);

	for (let i = 2; i < 22; i++) {
		for (let j = 0; j < 10; j++) {
			if ((i % 2 == 0 && j % 2 == 0) || (i % 2 != 0 && j % 2 != 0)) {
				ctx.fillStyle = "#2A202680";
				ctx.fillRect(j * cellSize,(i - 2) * cellSize,cellSize,cellSize,[0,0,20,0]);
			}
		}
	}
}

function clearBoard() {
	board = [[0,0,0,0,0,0,0,0,0,0],
			[0,0,0,0,0,0,0,0,0,0],
			[0,0,0,0,0,0,0,0,0,0],
			[0,0,0,0,0,0,0,0,0,0],
			[0,0,0,0,0,0,0,0,0,0],
			[0,0,0,0,0,0,0,0,0,0],
			[0,0,0,0,0,0,0,0,0,0],
			[0,0,0,0,0,0,0,0,0,0],
			[0,0,0,0,0,0,0,0,0,0],
			[0,0,0,0,0,0,0,0,0,0],
			[0,0,0,0,0,0,0,0,0,0],
			[0,0,0,0,0,0,0,0,0,0],
			[0,0,0,0,0,0,0,0,0,0],
			[0,0,0,0,0,0,0,0,0,0],
			[0,0,0,0,0,0,0,0,0,0],
			[0,0,0,0,0,0,0,0,0,0],
			[0,0,0,0,0,0,0,0,0,0],
			[0,0,0,0,0,0,0,0,0,0],
			[0,0,0,0,0,0,0,0,0,0],
			[0,0,0,0,0,0,0,0,0,0],
			[0,0,0,0,0,0,0,0,0,0],
			[0,0,0,0,0,0,0,0,0,0]];
}

function redrawPieces() {
	for (let i = 2; i < 22; i++) {
		for (let j = 0; j < 10; j++) {
			if (board[i][j] != 0) {
				ctx.fillStyle = blockReference[board[i][j]]["colour"];
				ctx.beginPath();
				ctx.roundRect(j * cellSize + (gap / 2),(i - 2) * cellSize + (gap / 2),cellSize - gap, cellSize - gap,corner);
				ctx.fill();
			}
		}
	}

	activePiece.render();
}

function renderDropPreview() {
	let maxDistAll = 22;

	for (let i = 0; i < activePiece.blocks.length; i++) {
		let j = 0;
		while (j + activePiece.blocks[i].y < 22 && board[j + activePiece.blocks[i].y][activePiece.blocks[i].x] == 0) {
			j++;
		}
		if (j < maxDistAll) {
			maxDistAll = j;
		}
	}

	maxDistAll -= 1;
	
	ctx.fillStyle = blockReference[activePiece.type]["colour"]+"40";
	ctx.strokeStyle = blockReference[activePiece.type]["colour"]+"60";
	ctx.lineWidth = gap * 0.75;
	for (let i = 0; i < activePiece.blocks.length; i++) {
		ctx.beginPath();
		ctx.roundRect(activePiece.blocks[i].x * cellSize + (gap / 2),(activePiece.blocks[i].y - 2 + maxDistAll) * cellSize + (gap / 2),cellSize - gap, cellSize - gap,corner);
		ctx.fill();
		ctx.stroke();
	}
}

function renderEffects() {
	if (screenShake.on) {
		let xShift = Math.cos(screenShake.duration) * screenShake.strength + (Math.random() - 0.5);
		let yShift = Math.sin(screenShake.duration) * screenShake.strength + (Math.random());

		document.getElementById("holder").style.transform = "translate("+xShift+"px,"+yShift+"px)";
		screenShake.duration -= 1;
		if (screenShake.duration < 1) {
			canvas.style.transform = "translate(0px, 0px)"
			screenShake.on = false;
			screenShake.strength = 0;
			screenShake.duration = 0;
		} else if (screenShake.duration < 10) {
			screenShake.strength *= 0.75;
		}
	}

	let unfinished = [];
	for (let i = 0; i < tweens.length; i++) {
		if (tweens[i].counter < tweens[i].endCount) {
			tweens[i].counter++;
			let gradient = ctx.createLinearGradient(tweens[i].x * cellSize + (gap / 2),(tweens[i].x + 1) * cellSize + (gap / 2),(tweens[i].startY + ((tweens[i].endY - tweens[i].startY) * (15 / 30)) - 2) * cellSize + (gap / 2),(tweens[i].startY + ((tweens[i].endY - tweens[i].startY + 1) * (15 / 30)) - 2) * cellSize + (gap / 2));
			let opacity = Math.floor((1.0 - (tweens[i].counter/tweens[i].endCount)) * 255).toString(16);
			while (opacity.length < 2) {
				opacity = "0"+opacity;
			}
			gradient.addColorStop(0,tweens[i].colour+opacity);
			gradient.addColorStop(1,"#FFFFFF00");
			ctx.fillStyle = gradient;
			ctx.beginPath();
			ctx.roundRect(tweens[i].x * cellSize + (gap / 2),(tweens[i].startY + ((tweens[i].endY - tweens[i].startY) * (tweens[i].counter / tweens[i].endCount)) - 2) * cellSize + (gap / 2),cellSize - gap, cellSize - gap,corner);
			ctx.fill();

			unfinished.push(tweens[i]);
		}
	}
	tweens = unfinished;
	
	unfinished = [];
	for (let i = 0; i < gradients.length; i++) {
		if (gradients[i].counter < gradients[i].endCount) {
			gradients[i].counter++;
			let avgX = (gradients[i]["pos"][0] + gradients[i]["pos"][2]) / 2 
			let gradient = ctx.createLinearGradient(avgX,gradients[i]["pos"][1],avgX,gradients[i]["pos"][3]);
			for (let j = 0; j < gradients[i].stops.length; j++) {
				let stop = gradients[i].stops[j];
				if (stop.length < 8) {
					let opacity = Math.floor((1.0 - (gradients[i].counter/gradients[i].endCount)) * 255).toString(16);
					while (opacity.length < 2) {
						opacity = "0"+opacity;
					}
					stop = stop+opacity;
				}
				gradient.addColorStop(j,stop);
			}
			ctx.fillStyle = gradient;
			ctx.beginPath();
			ctx.roundRect(gradients[i]["pos"][0],gradients[i]["pos"][1],gradients[i]["pos"][2] - gradients[i]["pos"][0],gradients[i]["pos"][3] - gradients[i]["pos"][1],corner);
			ctx.fill();

			unfinished.push(gradients[i]);
		}
	}

	gradients = unfinished;

	if (softScore < score) {
		document.getElementById("score").innerHTML = softScore;
		let incrementVal = Math.max(1,Math.floor((score - softScore) / 300)) * 5;
		softScore += incrementVal;
	} else {
		softScore = score;
		document.getElementById("score").innerHTML = softScore;
	}

	if (oldTotalLines < totalLines) {
		document.getElementById("lines").innerHTML = Math.floor(oldTotalLines);
		oldTotalLines += 0.25;
	} else {
		oldTotalLines = totalLines;
		document.getElementById("lines").innerHTML = oldTotalLines;
	}
}

function drawDebugText() {
	ctx.fillStyle = "white";

	for (let i = 2; i < 22; i++) {
		for (let j = 0; j < 10; j++) {
			ctx.fillText("("+i+","+j+")"+board[i][j],j * cellSize + cellSize * 0.2,(i - 2) * cellSize + cellSize * 0.5,cellSize);
		}
	}
}

function drawDebugSquare() {
	ctx.fillStyle = "rgba(0,255,0,0.8)";
	ctx.fillRect(activePiece.x * cellSize + (gap / 2),(activePiece.y - 2) * cellSize + (gap / 2),cellSize - gap, cellSize - gap);
}


function tick() {
	if (!isPaused) {
		timestamp++;
		resetRender();
		if (timestamp >= dropSpeed) {
			timestamp = 0;
			activePiece.checkHitbox();
			activePiece.dropBlock();
			checkForFill();
		}
		renderEffects();
		redrawPieces();
		if (showPreview) {
			renderDropPreview();
		}

		//drawDebugText();
		//drawDebugSquare();

		if (direction) {
			activePiece.move(direction);
			direction = 0;
		}
	}

	requestAnimationFrame(tick);
}

reset();
tick();
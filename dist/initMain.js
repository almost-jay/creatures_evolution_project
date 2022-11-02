"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const electron_1 = require("electron");
const creatureClass_1 = require("./creatureClass");
const globals_1 = require("./globals");
exports.canvas = document.getElementById("canvas");
exports.ctx = exports.canvas.getContext("2d");
exports.creaturesLiving = {};
exports.creatures = [];
function initNavigation() {
    let holdX;
    let holdY;
    let isMouseDown = false;
    //window.scrollTo(1024,1024);
    electron_1.webFrame.setZoomLevel(4.0);
    document.addEventListener("mousedown", () => {
        if (!isMouseDown) {
            isMouseDown = true;
        }
    });
    document.addEventListener("mouseup", () => {
        if (isMouseDown) {
            isMouseDown = false;
            exports.canvas.style.cursor = "default";
        }
    });
    document.addEventListener("mousemove", (event) => {
        navigateCanvas(event);
    });
    function navigateCanvas(event) {
        if (isMouseDown) {
            exports.canvas.style.cursor = "pointer";
            event.preventDefault();
            window.scrollBy(holdX - event.clientX, holdY - event.clientY);
        }
        holdX = event.clientX;
        holdY = event.clientY;
    }
}
function tick() {
    clearCanvas();
    drawGrid();
    renderCreatures();
    requestAnimationFrame(() => tick());
}
function clearCanvas() {
    exports.ctx.fillStyle = "#181818";
    exports.ctx.fillRect(0, 0, exports.canvas.width, exports.canvas.height);
}
function drawGrid() {
    exports.ctx.strokeStyle = "#FAFAFA";
    exports.ctx.lineWidth = 2;
    exports.ctx.beginPath();
    for (let i = 0; i <= exports.canvas.width; i += 256) {
        exports.ctx.moveTo(i, 0);
        exports.ctx.lineTo(i, exports.canvas.height);
    }
    for (let i = 0; i <= exports.canvas.height; i += 256) {
        exports.ctx.moveTo(0, i);
        exports.ctx.lineTo(exports.canvas.width, i);
    }
    exports.ctx.stroke();
}
;
function newHead() {
    new creatureClass_1.creature(new globals_1.vector2(128, 128), 16, 8, 2);
}
function renderCreatures() {
    for (let i = 0; i < exports.creatures.length; i++) {
        exports.creatures[i].renderCreature();
    }
}
initNavigation();
newHead();
tick();
//# sourceMappingURL=initMain.js.map
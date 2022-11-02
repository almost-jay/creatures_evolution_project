"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const globals_1 = require("./globals");
const initMain_1 = require("./initMain");
const creatureHead_1 = require("./creatureHead");
const creatureBase_1 = require("./creatureBase");
const creatureLegJoint_1 = require("./creatureLegJoint");
const creatureTail_1 = require("./creatureTail");
class creature {
    constructor(pos, length, maxDist, weights) {
        this.pos = pos;
        this.length = length;
        this.maxDist = maxDist;
        this.weights = weights;
        this.id = this.generateId();
        initMain_1.creaturesLiving[this.id] = this;
        this.legs = [];
        this.segments = this.initSegments(length, maxDist, weights);
        this.initSegmentChildren();
        this.head = this.segments[0];
        this.path = this.generatePath(this.pos.add(this.pos));
        this.target = this.path[0];
        initMain_1.creatures.push(this);
    }
    generateId() {
        let idResult = [];
        for (let i = 0; i < 4; i++) {
            idResult.push(globals_1.idCharas[Math.floor(Math.random() * globals_1.idCharas.length)]);
        }
        return idResult.join("");
    }
    initSegments(length, maxDist, weights) {
        let bodyGuide = [0];
        let tailLength = Math.floor(length / 2);
        let weightDist = Math.ceil((length - tailLength) / weights);
        let weightPoints = 0;
        for (let i = 1; i < length; i++) {
            if (i > length - tailLength && weightPoints == weights) {
                bodyGuide.push(3);
            }
            else if ((i + 1) % weightDist === 0) {
                bodyGuide.push(2);
                weightPoints++;
            }
            else {
                bodyGuide.push(1);
            }
        }
        let colour = this.generateColours(3);
        let segmentResult = [];
        for (let i = 0; i < length; i++) {
            switch (bodyGuide[i]) {
                case 0:
                    segmentResult.push(new creatureHead_1.creatureHead(this.pos.add(new globals_1.vector2(i * this.maxDist, i * this.maxDist)), 0, colour[i], 14, "#FAFAFA", 6));
                    break;
                case 1:
                    segmentResult.push(new creatureBase_1.creatureJoint(this.pos.add(new globals_1.vector2(i * this.maxDist, i * this.maxDist)), i, colour[i], 8));
                    break;
                case 2:
                    let newJoint = new creatureLegJoint_1.creatureLegJoint(this.pos.add(new globals_1.vector2(i * this.maxDist, i * this.maxDist)), i, colour[i], 12, 12, segmentResult[Math.max(i - Math.floor(weightDist / 3), 0)]);
                    segmentResult.push(newJoint);
                    this.legs.push(newJoint);
                    break;
                case 3:
                    segmentResult.push(new creatureTail_1.creatureTail(this.pos.add(new globals_1.vector2(i * this.maxDist, i * this.maxDist)), i, colour[i], 4));
                    break;
            }
        }
        return segmentResult;
    }
    initSegmentChildren() {
        for (let i = 0; i < this.segments.length - 1; i++) {
            this.segments[i].childJoint = this.segments[i + 1];
        }
    }
    generatePath(startPos) {
        let pathResult = [];
        for (let i = 0; i < 24; i++) {
            let offset = new globals_1.vector2((Math.random() - 0.5) * 32, (Math.random() - 0.5) * 32);
            pathResult.push(new globals_1.vector2(startPos.x + 64 * Math.cos(2 * Math.PI * i / 24), startPos.y + 64 * Math.sin(2 * Math.PI * i / 24)).add(offset));
        }
        for (let i = 0; i < pathResult.length; i += 2) {
            pathResult[i].y += (((Math.random() - 0.5) * 16) + 8);
        }
        let closest = [0, initMain_1.canvas.width];
        for (let i = 0; i < pathResult.length; i++) {
            let distance = startPos.distance(pathResult[i]);
            if (distance < closest[1]) {
                closest = [i, distance];
            }
        }
        pathResult = pathResult.concat(pathResult.splice(0, closest[0]));
        return pathResult.reverse();
    }
    generateColours(n) {
        n = 2;
        let colourIndexes = [0];
        for (let i = 0; i < n; i++) {
            let index = Math.round(colourIndexes[i] + ((Math.random() + globals_1.preColours.length * 0.25) * (globals_1.preColours.length - globals_1.preColours.length * 0.25)));
            while (index > globals_1.preColours.length) {
                index -= globals_1.preColours.length;
            }
            colourIndexes.push(index);
        }
        colourIndexes.shift();
        let mainColours = [];
        for (let i = 0; i < colourIndexes.length; i++) {
            mainColours.push(globals_1.hexToRgb(globals_1.preColours[colourIndexes[i]]));
        }
        let colourRes = [];
        let inc = 1 / this.length;
        for (let i = 0; i < this.length; i++) {
            let r = Math.max(Math.min(Math.round((mainColours[0][0] * (inc * i)) + (mainColours[1][0] * (1 - (inc * i))) / 2), 255), 0);
            let g = Math.max(Math.min(Math.round((mainColours[0][1] * (inc * i)) + (mainColours[1][1] * (1 - (inc * i))) / 2), 255), 0);
            let b = Math.max(Math.min(Math.round((mainColours[0][2] * (inc * i)) + (mainColours[1][2] * (1 - (inc * i))) / 2), 255), 0);
            colourRes.push(globals_1.rgbToHex(r, g, b));
        }
        return colourRes;
    }
    renderCreature() {
        initMain_1.ctx.lineCap = "round";
        this.head.moveHead(this.target);
        for (let i = this.segments.length - 2; i >= 0; i -= 1) {
            this.segments[i].move(this.maxDist, this.target);
            if (this.segments[i].pos.distance(this.target) < this.maxDist) {
                this.path.push(this.target);
                this.path.shift();
                this.target = this.path[0];
            }
            this.segments[i].renderSegment();
        }
    }
}
exports.creature = creature;
//# sourceMappingURL=creatureClass.js.map
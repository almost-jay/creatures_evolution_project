"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const globals_1 = require("./globals");
const initMain_1 = require("./initMain");
class creatureJoint {
    constructor(pos, id, colour, width) {
        this.pos = pos;
        this.id = id;
        this.colour = colour;
        this.width = width;
    }
    renderSegment() {
        initMain_1.ctx.strokeStyle = this.colour;
        initMain_1.ctx.lineWidth = this.width;
        initMain_1.ctx.beginPath();
        initMain_1.ctx.moveTo(this.pos.x, this.pos.y);
        initMain_1.ctx.lineTo(this.childJoint.pos.x, this.childJoint.pos.y);
        initMain_1.ctx.stroke();
    }
    move(maxDist, target) {
        let delta = new globals_1.vector2(this.pos.x - this.childJoint.pos.x, this.pos.y - this.childJoint.pos.y);
        let childDist = this.pos.distance(this.childJoint.pos);
        if (childDist > maxDist) {
            delta = delta.divide(childDist);
            delta = delta.multiply(maxDist);
            this.childJoint.pos = this.pos.subtract(delta);
        }
    }
}
exports.creatureJoint = creatureJoint;
//# sourceMappingURL=creatureBase.js.map
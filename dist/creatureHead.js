"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const creatureBase_1 = require("./creatureBase");
const initMain_1 = require("./initMain");
class creatureHead extends creatureBase_1.creatureJoint {
    constructor(pos, id, colour, width, eyeColour, eyeSpacing) {
        super(pos, id, colour, width);
        this.eyeColour = eyeColour;
        this.eyeSpacing = eyeSpacing;
    }
    renderSegment() {
        super.renderSegment();
        this.angle = this.pos.getAvgAngleRad(this.childJoint.pos);
        initMain_1.ctx.fillStyle = this.eyeColour;
        initMain_1.ctx.beginPath();
        initMain_1.ctx.arc((this.eyeSpacing * Math.cos(this.angle - (Math.PI * 0.5))) + this.pos.x, (this.eyeSpacing * Math.sin(this.angle - (Math.PI * 0.5))) + this.pos.y, 3, 0, 2 * Math.PI);
        initMain_1.ctx.fill();
        initMain_1.ctx.beginPath();
        initMain_1.ctx.arc((this.eyeSpacing * Math.cos(this.angle - (Math.PI * -0.5))) + this.pos.x, (this.eyeSpacing * Math.sin(this.angle - (Math.PI * -0.5))) + this.pos.y, 3, 0, 2 * Math.PI);
        initMain_1.ctx.fill();
    }
    moveHead(target) {
        this.pos.x -= ((this.pos.x - target.x) / 100) * 6;
        this.pos.y -= ((this.pos.y - target.y) / 100) * 6;
    }
}
exports.creatureHead = creatureHead;
//# sourceMappingURL=creatureHead.js.map
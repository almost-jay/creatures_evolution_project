"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const creatureBase_1 = require("./creatureBase");
const globals_1 = require("./globals");
const initMain_1 = require("./initMain");
class creatureLegJoint extends creatureBase_1.creatureJoint {
    constructor(pos, id, colour, width, legLength, angleParent) {
        super(pos, id, colour, width);
        this.legLength = legLength;
        this.angleParent = angleParent;
        this.leftElbowPos = new globals_1.vector2(this.pos.x, this.pos.y);
        this.rightElbowPos = new globals_1.vector2(this.pos.x, this.pos.y);
        this.leftLegPos = new globals_1.vector2(this.pos.x, this.pos.y);
        this.rightLegPos = new globals_1.vector2(this.pos.x, this.pos.y);
        this.leftLegUp = false;
        this.rightLegUp = false;
    }
    calcLegPositions() {
        this.angle = this.pos.getAvgAngleRad(this.angleParent.pos);
        let leftLegFin = new globals_1.vector2(0, 0);
        let rightLegFin = new globals_1.vector2(0, 0);
        leftLegFin.x = (this.legLength * 2.2 * Math.cos(this.angle - (Math.PI * -0.74))) + this.pos.x;
        leftLegFin.y = (this.legLength * 2.2 * Math.sin(this.angle - (Math.PI * -0.74))) + this.pos.y;
        rightLegFin.x = (this.legLength * 2.2 * Math.cos(this.angle - (Math.PI * 0.74))) + this.pos.x;
        rightLegFin.y = (this.legLength * 2.2 * Math.sin(this.angle - (Math.PI * 0.74))) + this.pos.y;
        if (this.leftLegPos.distance(leftLegFin) > this.legLength ** 1.4 || this.leftElbowPos.distance(this.rightElbowPos) < this.legLength) {
            if (!this.rightLegUp || this.leftLegPos.distance(leftLegFin) > this.legLength ** 2) {
                this.leftLegUp = true;
            }
        }
        if (this.leftLegUp) {
            this.leftLegPos = this.leftLegPos.add((leftLegFin.subtract(this.leftLegPos)).divide(4));
            if (this.leftLegPos.distance(leftLegFin) < this.legLength * 0.6) {
                this.leftLegUp = false;
                this.leftLegPos = leftLegFin;
            }
        }
        this.leftElbowPos = this.solveInverseKinematics(this.leftLegPos, 1);
        if (this.rightLegPos.distance(rightLegFin) > this.legLength ** 1.4 || this.rightElbowPos.distance(this.leftElbowPos) < this.legLength) {
            if (!this.leftLegUp || this.leftLegPos.distance(leftLegFin) > this.legLength ** 2) {
                this.rightLegUp = true;
            }
        }
        if (this.rightLegUp) {
            this.rightLegPos = this.rightLegPos.add((rightLegFin.subtract(this.rightLegPos)).divide(4));
            if (this.rightLegPos.distance(rightLegFin) < this.legLength * 0.6) {
                this.rightLegUp = false;
                this.rightLegPos = rightLegFin;
            }
        }
        this.rightElbowPos = this.solveInverseKinematics(this.rightLegPos, -1);
    }
    renderSegment() {
        this.calcLegPositions();
        initMain_1.ctx.lineCap = "round";
        initMain_1.ctx.strokeStyle = this.colour;
        initMain_1.ctx.lineWidth = this.width * 0.5;
        initMain_1.ctx.beginPath();
        initMain_1.ctx.moveTo(this.pos.x, this.pos.y);
        initMain_1.ctx.lineTo(this.leftElbowPos.x, this.leftElbowPos.y);
        initMain_1.ctx.stroke();
        initMain_1.ctx.beginPath();
        initMain_1.ctx.moveTo(this.leftElbowPos.x, this.leftElbowPos.y);
        initMain_1.ctx.lineTo(this.leftLegPos.x, this.leftLegPos.y);
        initMain_1.ctx.stroke();
        initMain_1.ctx.beginPath();
        initMain_1.ctx.moveTo(this.pos.x, this.pos.y);
        initMain_1.ctx.lineTo(this.rightElbowPos.x, this.rightElbowPos.y);
        initMain_1.ctx.stroke();
        initMain_1.ctx.beginPath();
        initMain_1.ctx.moveTo(this.rightElbowPos.x, this.rightElbowPos.y);
        initMain_1.ctx.lineTo(this.rightLegPos.x, this.rightLegPos.y);
        initMain_1.ctx.stroke();
        initMain_1.ctx.fillStyle = this.angleParent.colour;
        initMain_1.ctx.beginPath();
        initMain_1.ctx.arc(this.leftElbowPos.x, this.leftElbowPos.y, this.width * 0.4, 0, 2 * Math.PI);
        initMain_1.ctx.fill();
        initMain_1.ctx.beginPath();
        initMain_1.ctx.arc(this.rightElbowPos.x, this.rightElbowPos.y, this.width * 0.4, 0, 2 * Math.PI);
        initMain_1.ctx.fill();
        initMain_1.ctx.beginPath();
        initMain_1.ctx.arc(this.leftLegPos.x, this.leftLegPos.y, this.width * 0.4, 0, 2 * Math.PI);
        initMain_1.ctx.fill();
        initMain_1.ctx.beginPath();
        initMain_1.ctx.arc(this.rightLegPos.x, this.rightLegPos.y, this.width * 0.4, 0, 2 * Math.PI);
        initMain_1.ctx.fill();
        super.renderSegment();
    }
    solveInverseKinematics(targetPos, side) {
        let comp = new globals_1.vector2(targetPos.x - this.pos.x, targetPos.y - this.pos.y);
        let distance = comp.x * comp.x + comp.y * comp.y;
        let angle = Math.max(-1, Math.min(1, distance / (2 * this.legLength * Math.sqrt(distance))));
        let theta = Math.atan2(comp.y, comp.x) - (Math.acos(angle) * side);
        let result = new globals_1.vector2(0, 0);
        result.x = this.pos.x + this.legLength * Math.cos(theta);
        result.y = this.pos.y + this.legLength * Math.sin(theta);
        return result;
    }
}
exports.creatureLegJoint = creatureLegJoint;
//# sourceMappingURL=creatureLegJoint.js.map
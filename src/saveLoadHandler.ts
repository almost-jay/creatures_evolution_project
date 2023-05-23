import { creature } from "./creatureMain";
import { food } from "./food";
import { vector2 } from "./globals";
import { entityDict } from "./initMain";
import { creatureJoint } from "./jointBase";
import { creatureBody } from "./jointBody";
import { creatureHead } from "./jointHead";
import { creatureLeg } from "./limbLeg";

const fs = require("fs");

export function saveState(): void {
	let eDKeys = Object.keys(entityDict);
	for (let i = 0; i < eDKeys.length; i++) {
		if (entityDict[eDKeys[i]].getTypeOf() == "food") {
			let entity = entityDict[eDKeys[i]] as food;
			let out = (JSON.stringify(entity));
		} else if (entityDict[eDKeys[i]].getTypeOf() == "creature") {
			let tempEntity: { [key: string]: string } = {};
			let entity = entityDict[eDKeys[i]] as creature;
			let props = Object.getOwnPropertyNames(entity);
			for (let j = 0; j < props.length; j++) {
				let prop = entity[props[j] as keyof creature];
				let propType = typeof prop;
				if (prop != null) {
					if (propType != "object") {
						tempEntity[props[j]] = String(prop);
					} else {
						let propType = prop.constructor.name;
						if (propType == "vector2") {
							let tempVector = prop as vector2;
							tempEntity[props[j]] = "vector2("+String(tempVector.x)+","+String(tempVector.y)+")";
						} else if (propType == "Array") {
							let tempArr: Array<any> = [];
							let arrProp = prop as Array<any>;
							for (let k = 0; k < arrProp.length; k++) {
								let arrPropType = arrProp[k].constructor.name;
								if (arrPropType == "vector2") {
									let tempVector = arrProp[k] as vector2;
									tempArr.push("vector2("+String(tempVector.x)+","+String(tempVector.y)+")");
								} else {
									tempArr.push(parseCreatureJoint(arrProp[k]));
								}
							}
							tempEntity[props[j]] = "["+String(tempArr)+"]";
						}
					}
				}
			}
			console.log(tempEntity);
		}
	}
}

function parseCreatureJoint(joint: creatureBody|creatureHead): String {
	let tempJoint: { [key: string]: string } = {};
	let jointProps = Object.getOwnPropertyNames(joint);
	for (let i = 0; i < jointProps.length; i++) {
		let prop = joint[jointProps[i] as keyof typeof joint];
		let propType = typeof prop;
		if (propType != "object") {
			tempJoint[jointProps[i]] = String(prop);
		} else {
			let propType = prop.constructor.name;
			if (propType == "vector2") {
				let tempVector = prop as vector2;
				tempJoint[jointProps[i]] = "vector2("+String(tempVector.x)+","+String(tempVector.y)+")";
			} else if (propType == "Array") {
				let tempArr: Array<any> = [];
				let arrProp = prop as Array<any>;
				for (let j = 0; j < arrProp.length; j++) {
					let arrPropType = arrProp[j].constructor.name;
					console.log(arrPropType);
					if (arrPropType == "vector2") {
						let tempVector = arrProp[j] as vector2;
						tempArr.push("vector2("+String(tempVector.x)+","+String(tempVector.y)+")");
					} else if (arrPropType == "creatureLeg") {
						let legProps = Object.getOwnPropertyNames(creatureLeg);
						console.log("leg props:");
						console.log(legProps);
						let tempLeg: { [key: string]: string } = {};
						//console.log(typeof prop[legProps[i] as keyof typeof prop]);
					} else {
						tempArr.push(arrProp[j].id);
					}
				}
				tempJoint[jointProps[i]] = JSON.stringify(tempArr);
			} else {
				if (prop.hasOwnProperty("id")) {
					prop = prop as creatureJoint;
					tempJoint[tempJoint[i]] = String(prop.id);
				}
			}
		}
	}
	console.log(tempJoint);
	return JSON.stringify(tempJoint)
}

export function initSidenav() : void {
	if (document.getElementById("sidenav")) {
		document.getElementById("sidenav")!.addEventListener("click", function(event : Event) {
			let targetId = (event.target as HTMLBaseElement).id;
			console.log(targetId);
			switch (targetId) {
				case "save":
					saveState();
					break;
			}
		});
	}
}
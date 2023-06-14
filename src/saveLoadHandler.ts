import { creature } from "./creatureMain";
import { relationship } from "./creatureTraits";
import { food } from "./food";
import { vector2 } from "./globals";
import { entityDict, loadNewCreature, loadNewFood, prepForLoad } from "./initMain";
import { creatureJoint } from "./jointBase";
import { creatureBody } from "./jointBody";
import { creatureHead } from "./jointHead";
import { creatureLeg } from "./limbLeg";

const fs = require("fs");

function saveState(saveIndex: string): void {
	let eDKeys = Object.keys(entityDict);
	let outDict: { [key: string]: any } = {};
	for (let i = 0; i < eDKeys.length; i++) {
		if (entityDict[eDKeys[i]].entityType == "food") {
			let entity = entityDict[eDKeys[i]] as food;
			outDict[eDKeys[i]] = entity;
		} else if (entityDict[eDKeys[i]].entityType == "creature") {
			let tempEntity: { [key: string]: any } = {};
			let entity = entityDict[eDKeys[i]] as creature;
			let props = Object.getOwnPropertyNames(entity);
			for (let j = 0; j < props.length; j++) {
				let prop = entity[props[j] as keyof creature];
				let propType = typeof prop;
				if (prop != null) {
					if (propType != "object") {
						tempEntity[props[j]] = prop;
					} else {
						let propType = prop.constructor.name;
						if (propType == "vector2") {
							let tempVector = prop as vector2;
							tempEntity[props[j]] = tempVector;
						} else if (propType == "Array") {
							let tempArr: Array<any> = [];
							let arrProp = prop as Array<any>;
							for (let k = 0; k < arrProp.length; k++) {
								let arrPropType = arrProp[k].constructor.name;
								if (arrPropType == "vector2") {
									let tempVector = arrProp[k] as vector2;
									tempArr.push(tempVector);
								} else {
									tempArr.push(parseCreatureJoint(arrProp[k]));
								}
							}
							tempEntity[props[j]] = tempArr;
						} else if (propType == "creatureTraits") {
							tempEntity[props[j]] = prop;
						} else {
							tempEntity[props[j]] = (prop as creatureHead).id;
						}
					}
				}
			}
			outDict[eDKeys[i]] = tempEntity;
		}
	}
	if (!Number.isSafeInteger(Number(saveIndex))) {
		saveIndex = String(findSave());
	}
	fs.writeFileSync("./data/save"+saveIndex+".crs",JSON.stringify(outDict), function(err: Error) {
		if (err) {
			console.error(err);
		}
	});

	if (fs.existsSync("./data/save"+saveIndex+".crs")) {
		toast("Saved to save"+saveIndex+".crs!","#1ebc73");
	} else {
		toast("Did not save!","#e83b3b");
	}
}

function parseCreatureJoint(joint: creatureBody | creatureHead): any {
	let tempJoint: { [key: string]: any } = {};
	let jointProps = Object.getOwnPropertyNames(joint);
	for (let i = 0; i < jointProps.length; i++) {
		let prop = joint[jointProps[i] as keyof typeof joint];
		let propType = typeof prop;
		if (prop != null) {
			if (propType != "object") {
				tempJoint[jointProps[i]] = prop;
			} else {
				let propType = prop.constructor.name;
				if (propType == "vector2") {
					let tempVector = prop as vector2;
					tempJoint[jointProps[i]] = tempVector;
				} else if (propType == "Array") {
					let tempArr: Array<any> = [];
					let arrProp = prop as Array<any>;
					for (let j = 0; j < arrProp.length; j++) {
						let arrPropType = arrProp[j].constructor.name;
						if (arrPropType == "vector2") {
							let tempVector = arrProp[j] as vector2;
							tempArr.push(tempVector);
						} else if (arrPropType == "creatureLeg") {
							let legProp = arrProp[j] as creatureLeg;
							let legProps = Object.getOwnPropertyNames(legProp);
							let tempLeg: { [key: string]: any } = {};
							for (let k = 0; k < legProps.length; k++) {
								let subLegProp = legProp[legProps[k] as keyof creatureLeg];
								if (typeof subLegProp != "object" || (subLegProp.constructor.name == "vector2")) {
									tempLeg[legProps[k]] = subLegProp;
								} else if (subLegProp.hasOwnProperty("id")) {
									subLegProp = subLegProp as creatureLeg;
									tempLeg[legProps[i]] = subLegProp.id;
								}
							}
							tempArr.push(tempLeg);
						} else {
							tempArr.push(arrProp[j].id);
						}
					}
					tempJoint[jointProps[i]] = tempArr;
				} else {
					if (prop.hasOwnProperty("id")) {
						prop = prop as creatureJoint;
						tempJoint[jointProps[i]] = prop.id;
					} else {
						let tempRelationships: { [id: string]: Object } = {};
						let propRelationships = prop as { [key: string]: any };
						for (let key in propRelationships) {
							let relation = propRelationships[key] as relationship;
							tempRelationships[key] = {
								"aggression": relation.aggression,
								"respect": relation.respect,
								"reference": relation.reference.id
							}

						}
					}
				}
			}
		} else {
			tempJoint[jointProps[i]] = null;
		}
	}
	return tempJoint;
}

export function loadState(givenSave: string) {
	let saveIndex = findSave() - 1
	if (fs.existsSync("./data/save"+saveIndex+".crs","utf8")) {
		let loaded = JSON.parse(fs.readFileSync("./data/save"+saveIndex+".crs","utf8"));
		prepForLoad();
		
		for (let key in loaded) {
			if (loaded[key]["entityType"] == "food") {
				loadNewFood(new food(new vector2(loaded[key].pos.x,loaded[key].pos.y),loaded[key].size,loaded[key].color,key));
			} else if (loaded[key]["entityType"] == "creature") {
				loadNewCreature(loaded[key],key);
			}
		}

		for (let key in entityDict) {
			if (loaded[key]["entityType"] == "food") {
				let alteredFood = entityDict[key] as food;
				alteredFood.isEaten = loaded[key]["isEaten"];
				if (loaded[key]["isHeldBy"] != null) {
					alteredFood.isHeldBy = entityDict[loaded[key]["isHeldBy"]] as creature;
				}
			} else if (loaded[key]["entityType"] == "creature") {
				let alteredCreature = entityDict[key] as creature;

				if (alteredCreature.attacker != null) {
					alteredCreature.attacker = entityDict[loaded[key]["attacker"]] as creature;
				}
				if (alteredCreature.mate != null) {
					alteredCreature.mate = entityDict[loaded[key]["mate"]] as creature;
				}
				if (alteredCreature.heldFood != null) {
					alteredCreature.heldFood = entityDict[loaded[key]["heldFood"]] as food;
				}
				
				if (alteredCreature.head.targetEnemy != null) {
					alteredCreature.head.targetEnemy = entityDict[loaded[key]["head"]["targetEnemy"]] as creature;
				}
				if (alteredCreature.head.targetFriend != null) {
					alteredCreature.head.targetFriend = entityDict[loaded[key]["head"]["targetFriend"]] as creature;
				}
				if (alteredCreature.head.targetFood != null) {
					alteredCreature.head.targetFood = entityDict[loaded[key]["head"]["targetFood"]] as food;;
				}
			}
		}

		toast("Loaded!","#0eaf9b");
	} else {
		toast("Load failed!","#e83b3b");
	}
}

export function initSidenav() : void {
	if (document.getElementById("sidenav")) {
		document.getElementById("sidenav")!.addEventListener("click", function(event : Event) {
			let targetId = (event.target as HTMLBaseElement).id;
			switch (targetId) {
				case "save":
					saveState(String(findSave()));
					break;
			}
		});
	}
}

function findSave() : number {
	let i : number = 1;
	while (fs.existsSync("./data/save"+i.toString()+".crs")) {
		i++;
	}
	return i;
}


function toast(text : string, colour : string) {
	let toast = document.getElementById("popup") as HTMLBaseElement;
	toast.innerHTML = text;
	toast.style.backgroundColor = colour;
	toast.className = "show";
	setTimeout(function() {
		toast.className = toast.className.replace("show","");
	},1200);
}
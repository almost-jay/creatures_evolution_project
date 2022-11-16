import { idCharas } from "./globals";
import { creaturesReference, replaceCurrentState } from "./initMain";
const fs = require("fs");

function generateRandomId() : string {
	let idResult = "";
	for (let i = 0; i < 256; i++) {
		idResult += idCharas[Math.floor(Math.random() * idCharas.length)];
	}
	return idResult;
}

function generateKey(keyword : string, length : number) {
	let key = keyword;
	if (key.length < length) {
		for (let i = 0; i < length; i++) {
			key = (key + key[i]);
		}
	}
	return key.substring(0,length);
}

function encrypt(inputString: string, keyword : string) : string {
	let key = generateKey(keyword,inputString.length);
	let encryptedResult : Array<string> = [];
	for (let i = 0; i < inputString.length; i++) {
		let char = (((inputString.charCodeAt(i) + key.charCodeAt(i)) % 95) + 95) % 95;
		char += 32;
		encryptedResult.push(String.fromCharCode(char));
	}
	return encryptedResult.join("");
}

function decrypt(inputString: string, keyword : string) : string {
	let key = generateKey(keyword,inputString.length);
	let decryptedResult : Array<string> = [];
	for (let i = 0; i < inputString.length; i++) {
		let char = (((inputString.charCodeAt(i) - (key.charCodeAt(i) - 31)) % 95) + 95) % 95;
		char += 32;
		decryptedResult.push(String.fromCharCode(char));
	}
	return decryptedResult.join("");
}

function loadState(i : number) : void {
	if (fs.existsSync("./data/save"+i+".crsav")) {
		let data = fs.readFileSync("./data/save"+i+".crsav","utf8");
		let keyword = data.substring(0,256);
		let loadedFile = decrypt(data.substring(256,data.length),keyword);
		if (loadedFile[0].startsWith("{")) {
			replaceCurrentState(JSON.parse(loadedFile));
			toast("Loaded!","#0eaf9b");
		} else {
			toast("Read failed!","#e83b3b");
		}
	} else {
		toast("File save"+i+".crsasv missing!","#e83b3b");
	}
}

function saveState() : void {
	let keyword : string;
	let result = JSON.stringify(creaturesReference);
	keyword = encrypt(generateRandomId(),generateRandomId());
	result = encrypt(result,keyword);
	let i = showSaves() + 1;
	fs.writeFileSync("./data/save"+i+".crsav",keyword+result);
	(document.getElementById("savePicker") as HTMLInputElement).max = i.toString();
	if (fs.existsSync("./data/save"+i+".crsav")) {
		toast("Saved to save"+i+".crsav!","#1ebc73");
	} else {
		toast("Did not save!","#e83b3b");
	}
}

export function initState() : void {
	let i = showSaves();
	(document.getElementById("savePicker") as HTMLInputElement).max = showSaves().toString();
	if (document.getElementById("sidenav")) {
		document.getElementById("sidenav")!.addEventListener("click", function(event : Event) {
			let targetId = (event.target as HTMLBaseElement).id;
			switch (targetId) {
				case "writeSave":
					saveState();
					break;
				case "loadSave":
					let saveIdx = document.getElementById("savePicker") as HTMLInputElement;
					loadState(parseInt(saveIdx.value));
					break;
			}
		});
	}
}

function showSaves() : number {
	let i : number = 1;
	while (fs.existsSync("./data/save"+i.toString()+".crsav")) {
		i++;
	}
	return i - 1;
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
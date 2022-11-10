import { idCharas } from "./globals";
import { creaturesReference } from "./initMain";
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

function encrypt(inputString: string, key : string) : string {
	let encryptedResult : Array<string> = [];
	for (let i = 0; i <  inputString.length; i++) {
		let char = (inputString.charCodeAt(i) + key.charCodeAt(i)) % 95;
		char += 32;
		encryptedResult.push(String.fromCharCode(char));
	}
	return encryptedResult.join("");
}

function decrypt(inputString: string, key : string) : string {
	let decryptedResult : Array<string> = [];
	for (let i = 0; i <  inputString.length; i++) {
		let char = (inputString.charCodeAt(i) - (key.charCodeAt(i) - 31)) % 95;
		char += 32;
		decryptedResult.push(String.fromCharCode(char));
	}
	return decryptedResult.join("");
}

function writeKey() {
	let key = encrypt(generateRandomId(),generateRandomId());
	fs.writeFile("./data/key.crkey", key, (err : Error) => {
		if (err) {
			return console.error(err);
		}
		console.log("Success!");
	  });
}

function loadState(saveIdx : number) : void {
	
}

function saveState() : void {
	let key : string;
	let result = JSON.stringify(creaturesReference);
	fs.readFile("./data/key.crkey","utf8", (err : Error, data : string) => {
		if (err) {
			return console.error(err);
		}
		key = generateKey(data,result.length);
		result = encrypt(result,key);
		let i = 0;
		while (fs.existsSync("./data/save"+i+".crsav")) {
			i++;
		}
		fs.writeFile("./data/save"+i+".crsav",result, (err : Error) => {
			if (err) {
				return console.error(err);
			}
			console.log("Successful write to save"+i+".crsav");
		});
	});
}

export function initState() : void {
	if (!fs.existsSync("./data/key.crkey")) {
		writeKey();
	} else {
		fs.readFile("./data/key.crkey", "utf8", (err : Error, data : string) => {
			if (err) {
				return console.error(err);
			}
			if (data == "") {
				writeKey();
			}
		});
	}
	saveState();
}
export const idCharas: string = "ABCDEFGHIHKLMNOPQRSTUVWXYZ0123456789";
export var idList: Array<string> = [];
export class vector2 {
	x: number; 
	y: number;
	constructor(x: number, y: number) {
		this.x = x;
		this.y = y;
	}

	public add(input: vector2): vector2 {
		return new vector2(this.x + input.x, this.y + input.y);
	}
	
	public subtract(input: vector2): vector2 {
		return new vector2(this.x - input.x, this.y - input.y);
	}

	public multiply(input: number): vector2 {
		return new vector2(this.x * input,this.y * input);
	}
	
	public divide(input: number): vector2 {
		if (input === 0) {
			console.error("Cannot divide by zero!")
			return new vector2(0,0);
		} else { 
			return new vector2(this.x / input,this.y / input) 
		}
	}

	public getAngleRad(): number {
		return Math.atan2(this.y,this.x);
	}

	public getAngleDeg(): number {
		return Math.atan2(this.y,this.x) * (180 / Math.PI);
	}

	public getAvgAngleRad(input: vector2): number {
		return Math.atan2(this.y - input.y,this.x - input.x);
	}

	public getAvgAngleDeg(input: vector2): number {
		return Math.atan2(input.y - this.y,input.x - this.x) * (180 / Math.PI);
	}

	public distance(input: vector2): number {
		return Math.abs(Math.sqrt(Math.pow(this.x - input.x,2) + Math.pow(this.y - input.y,2)));
	}

	public getAvgPos(input: vector2): vector2 {
		return new vector2((input.x + this.x) / 2, (input.y + this.y) / 2);
	}

	public getMagnitude(): number {
		return Math.sqrt((this.x * this.x) + (this.y * this.y));
	}

	
	public rotateAroundPoint(pivot: vector2, angle: number): vector2 {
		let aX = Math.cos(angle);
		let aY = Math.sin(angle);

		let origin = this.subtract(pivot);

		let result = new vector2(0,0);
		result.x = origin.x * aX - origin.y * aY;
		result.y = origin.x * aY + origin.y * aX;

		result = result.add(pivot);

		return result;
	}
};

export function randRange(min: number, max: number): number { //returns number between max and min, inclusive
	let result = (Math.random() * ((max + 1) - min)) + min;
	return result;
}

export function hexToRgb(h: string): Array<number> {
	if (h == undefined) {
		console.error("Hex undefined!",h);
	}
	let r = parseInt((h[1] + h[2]), 16);
	let g = parseInt((h[3] + h[4]), 16);
	let b = parseInt((h[5] + h[6]), 16);
	return [r,g,b];
}

export function initIdList(): void {
	for (let i = 0; i < 36; i++) {
		for (let j = 0; j < 36; j++) {
			for (let k = 0; k < 36; k++) {
				for (let l = 0; l < 36; l++) {
					let newId = idCharas[i].concat(idCharas[j],idCharas[k],idCharas[l]);
					idList.push(newId);
				}
			
			}
		
		}
		
	}
}

export function camelCaseToTitle(input: string): string {
	let split = input.match(/[A-Za-z][^_\-A-Z]*/g) || [];
	return split.map(capitalise).join(" ");
}

function capitalise(input: string): string {
	return input.charAt(0).toUpperCase() + input.substring(1);
}

export function generateId(): string {
	let idIndex = Math.floor(randRange(0,idList.length));
	let id = idList[idIndex];
	idList.splice(idIndex,1);

	return id;
}

export function findClosestColour(r: number, g: number, b: number): number {
	let goalColour = [r,g,b];

	let comparedColour = hexToRgb(preColours[0]);

	let currentClosest = 0;
	let currentDistance = Math.pow(comparedColour[0] - goalColour[0] * 0.3,2) + Math.pow(comparedColour[1] - goalColour[1] * 0.59,2) + Math.pow(comparedColour[2] - goalColour[2] * 0.11,2);
	
	for (let i = 1; i < preColours.length; i++) {
		comparedColour = hexToRgb(preColours[i]);
		let distance = Math.pow(comparedColour[0] - goalColour[0] * 0.3,2) + Math.pow(comparedColour[1] - goalColour[1] * 0.59,2) + Math.pow(comparedColour[2] - goalColour[2] * 0.11,2);
		if (distance < currentDistance) {
			currentClosest = i;
			currentDistance = distance;
		}
	}

	return currentClosest;
}

export const preColoursBlood = ["#f8401b", "#bd2709", "#7c122b", "#b12935", "#f74a53", "#f22f46", "#6e2727", "#b33831", "#ae2334", "#e83b3b"];

export const preNames = ["Airiam", "Jonathan Archer", "Soji Asha", "Ayala", "Azan", "Reginald Barclay", "Bareil Antos", "Julian Bashir", "B'Etor", "Brad Boimler", "Boothby", "Borg Queen", "Phillip Boyce", "Brunt", "R. A. Bryce", "Gabrielle Burnham", "Michael Burnham", "Joseph Carey", "Chakotay", "Christine Chapel", "Pavel Chekov", "J. M. Colt", "Katrina Cornwell", "Kimara Cretak", "Beverly Crusher", "Wesley Crusher", "Hugh Culber", "Jal Culluh", "Elizabeth Cutler", "Leonardo da Vinci", "Damar", "Daniels", "Data", "Ezri Dax", "Jadzia Dax", "Degra", "Keyla Detmer", "The Doctor", "Dolim", "Dukat", "Michael Eddington", "Elnor", "Evek", "Vic Fontaine", "Maxwell Forrest", "Elim Garak", "Garrison", "Philippa Georgiou", "Sonya Gomez", "Gowron", "Amanda Grayson", "Guinan", "J. Hayes", "Erika Hernandez", "Hogan", "Mr. Homn", "Hugh", "Icheb", "Ishka", "Kathryn Janeway", "Jannar", "Michael Jonas", "Agnes Jurati", "K'Ehleyr", "Kes", "Khan Noonien Singh", "Harry Kim", "Kira Nerys", "George Kirk", "James T. Kirk", "Kol", "Kor", "Kurn", "Geordi La Forge", "La'an Noonien-Singh", "Laris", "Leeta", "Leland", "Li Nalas", "Linus", "Gabriel Lorca", "Lore", "L'Rell", "Lursa", "Maihar'du", "Mallora", "Carol Marcus", "Beckett Mariner", "Martok", "Travis Mayweather", "Leonard McCoy", "Mezoti", "Mila", "Mora Pol", "Morn", "Mot", "Harry Mudd", "Raffi Musiker", "Narek", "Alynna Nechayev", "Neelix", "Nhan", "Susan Nicoletti", "Nilsson", "Nog", "Kashimuro Nozawa", "Keiko O'Brien", "Miles O'Brien", "Molly O'Brien", "Odo", "Alyssa Ogawa", "Oh", "Opaka Sulan", "Joann Owosekun", "Owen Paris", "Tom Paris", "Phlox", "Jean-Luc Picard", "Renée Picard", "Christopher Pike", "Tracy Pollard", "Katherine Pulaski", "Q", "Quark", "Janice Rand", "Rebi", "Malcolm Reed", "Jet Reno", "Gen Rhys", "William Riker", "Cristóbal \"Chris\" Rios", "Narissa Rizzo", "Ro Laren", "Rom", "William Ross", "Michael Rostov", "Alexander Rozhenko", "Saavik", "Sarek", "Saru", "Hoshi Sato", "Sela", "Seska", "Seven of Nine", "Montgomery Scott", "Shakaar Edon", "Thy'lek Shran", "Silik", "Benjamin Sisko", "Jake Sisko", "Jennifer Sisko", "Joseph Sisko", "Sarah Sisko", "Luther Sloan", "Soval", "Spock", "Paul Stamets", "Lon Suder", "Hikaru Sulu", "Enabran Tain", "Sylvia Tilly", "Tomalak", "Tora Ziyal", "B'Elanna Torres", "T'Pol", "The Traveler", "Deanna Troi", "Lwaxana Troi", "Trip Tucker", "Tuvok", "Ash Tyler", "José Tyler", "Nyota Uhura", "Una", "Vash", "Vorik", "Weyoun", "Naomi Wildman", "Samantha Wildman", "Winn Adami", "Worf", "Tasha Yar", "Kasidy Yates", "Zek", "Zhaban", "Number One", "Kyle", "John Farrell", "Kelowitz", "Vincent DeSalle", "Hadley", "Leslie", "Galloway", "Roger Lemli", "Brent", "Harrison", "Hugh of Borg", "Robin Lefler", "Thomas Riker", "Rusot", "Joe Carey", "Chell", "Kaplan", "Doctor Chaotica", "Tal Celes", "Charles \"Trip\" Tucker III", "Marcus Williams", "Humanoid figure", "Duras", "N. Kemper", "Talas", "D. Chang", "Taylor", "F. Hawkins", "Xindi Primate Councillor", "T'Les", "Kelby", "T'Pau", "Harris", "Koss", "Voq", "Cleveland \"Book\" Booker", "Jett Reno", "Adira Tal", "R.A. Bryce", "Aurellio", "Ellen Landry", "Charles Vance", "Gray Tal", "Kovich", "Zora", "Grudge", "Audrey Willa", "Ryn", "Osyraa", "T'Rina", "Laira Rillak", "Ruon Tarka", "Noah Averbach-Katz", "Janet Kidder", "Tara Rosling", "Chelah Horsdal", "Shawn Doyle", "Dahj Asha", "Sutra", "Kore Soong", "Chris Rios", "Tallinn", "Altan Inigo Soong", "Adam Soong", "Jack Crusher", "Commodore Oh", "Narissa", "Ramdha", "Dr. Teresa Ramirez", "Captain Liam Shaw", "Sidney La Forge", "Vadic", "Alandra La Forge", "Titus Rikka", "Professor James Moriarty", "Commander Ro Laren", "Fleet Admiral Elizabeth Shelby", "William Boimler", "D'Vana Tendi", "Sam Rutherford", "Red Rutherford", "Carol Freeman", "Jack Ransom", "Shaxs", "T'Ana", "Andy Billups", "Barnes", "Steve Stevens", "Jet Manhaver", "Badgey", "Jennifer Sh'reyan", "Alonzo Freeman", "Migleemo", "Kayshon", "Les Buenamigo", "Petra Aberdeen", "Peanut Hamper", "AGIMUS", "T'Lyn", "Zefram Cochrane", "Leah Brahms", "Dal", "Gwyndala", "Jankom Pog", "Zero", "Rok-Tahk", "Murf", "Drednok", "The Diviner", "Asencia", "Tysess", "Noum", "Thadiun Okona", "Edward Jellico", "Christopher \"Chris\" Pike", "Erica Ortegas", "Joseph M'Benga", "Hemmer", "Una Chin-Riley", "Robert April", "Sam Kirk", "T'Pring", "Batel", "Pelia", "Leader on Kiley 279", "Alora", "The First Servant", "Gamal", "Angel", "Neera Ketoul", "Scotty", "Uhura", "Una \"Number One\" Chin-Riley", "Arik Soong", "Ann Mulhall", "Miranda Jones", "Dara", "Bhurlee", "Branmer", "Ashan", "Coplann", "Callenn", "Callier", "Deeron", "Delenn", "Devlin", "Dhaliri", "Draal", "Drakhen", "Dukhat", "Dulann", "Durhan", "Durlan", "Findell", "Firell", "Forell", "Hedronn", "Inesval", "Jenimer", "Kalain", "Katz", "Kodroni", "Lavell", "Lennan", "Lennier", "Lennok", "Lenonn", "Mayan", "Mazetch", "Morann", "Nelier", "Neroon", "Nukenn", "Nur", "Rashok", "Rastenn", "Rathenn", "Ruell", "Shakat", "Shakiri", "Sindell", "Sineval", "Sonovar", "Tafeek", "Tannier", "Teronn", "Tranall", "Trulann", "Tulan", "Turval", "Valen", "Varenn", "Vastor", "Venak", "Zakat"]

export const preColours = ["#000000", "#141415", "#252525", "#444443", "#6e6e6e", "#9b9c9b", "#c4c4c5", "#ffffff", "#c9c2a3", "#75776c", "#404945", "#27272c", "#18181a", "#121214", "#1e2028", "#3d3f4b", "#67656d", "#8f8685", "#b3a49a", "#dacdc1", "#dad4bc", "#b5a793", "#897a71", "#625353", "#3e373d", "#28252a", "#2a2236", "#373448", "#424961", "#5a748d", "#6e95a9", "#abd5da", "#d8ceeb", "#a5a4d0", "#888cbc", "#7270ab", "#575191", "#3d2d58", "#4c3535", "#5e5154", "#7b6681", "#7c7fae", "#e09191", "#e3c09d", "#e4dcc7", "#cab1a8", "#7ea095", "#667c84", "#515457", "#3d2929", "#23003c", "#65005c", "#c7005f", "#f82542", "#fe483c", "#f86444", "#f8a753", "#f2d17c", "#dd8944", "#c44c26", "#ac2027", "#6d1f2f", "#3f1525", "#4d0a1a", "#7e0e13", "#ba3900", "#fc6a08", "#fea464", "#ffd1ac", "#ffdfbf", "#f6c4a6", "#f6a371", "#cb804a", "#a15735", "#682a19", "#371115", "#4f291c", "#694026", "#925c33", "#be8f47", "#e5c989", "#c5c57f", "#9c8850", "#6f4d2b", "#432b23", "#261919", "#141011", "#2e1b00", "#512c00", "#ae5800", "#cd7900", "#ffc200", "#ffff04", "#fcf1d7", "#ffdc04", "#ffc02a", "#c7935d", "#636e7c", "#363f35", "#22130c", "#2e2a19", "#393f2a", "#44563e", "#6d7d59", "#afb995", "#222e14", "#39471c", "#5d6527", "#8e8e37", "#beb050", "#ebe185", "#b0bb5b", "#659257", "#64754a", "#345d41", "#37403c", "#1b2b3e", "#1b4b4f", "#327962", "#53a96f", "#72e27f", "#a4ffa6", "#c1f567", "#6ac81f", "#049050", "#00666a", "#003b62", "#001049", "#271f4b", "#263267", "#2a5480", "#30787c", "#53bf83", "#8cd590", "#86f1d6", "#4ddbc2", "#30b3a7", "#238585", "#1e5459", "#162c31", "#001717", "#003333", "#005050", "#006f6f", "#048e8e", "#04aeae", "#a5e5da", "#6fbdd5", "#398dd5", "#3056ac", "#353287", "#251644", "#28183c", "#392269", "#5042ac", "#586dd0", "#789eec", "#a9d4fb", "#cbabda", "#a27cb7", "#745888", "#504261", "#3a3346", "#292236", "#26122e", "#4e1740", "#7c2c52", "#ca4464", "#f17878", "#ecb2a4", "#fbb3e6", "#cc75af", "#a6557b", "#834a59", "#5a4143", "#312e2e", "#461623", "#681a2f", "#891a37", "#aa1e42", "#c74453", "#ea7e82"]

//old/alternative colours:
//export const preColours = ["#2e222f", "#3e3546", "#625565", "#966c6c", "#ab947a", "#694f62", "#7f708a", "#9babb2", "#c7dcd0", "#ffffff", "#6e2727", "#b33831", "#ea4f36", "#f57d4a", "#ae2334", "#e83b3b", "#fb6b1d", "#f79617", "#f9c22b", "#7a3045", "#9e4539", "#cd683d", "#e6904e", "#fbb954", "#4c3e24", "#676633", "#a2a947", "#d5e04b", "#fbff86", "#165a4c", "#239063", "#1ebc73", "#91db69", "#cddf6c", "#313638", "#374e4a", "#547e64", "#92a984", "#b2ba90", "#0b5e65", "#0b8a8f", "#0eaf9b", "#30e1b9", "#8ff8e2", "#323353", "#484a77", "#4d65b4", "#4d9be6", "#8fd3ff", "#45293f", "#6b3e75", "#905ea9", "#a884f3", "#eaaded", "#753c54", "#a24b6f", "#cf657f", "#ed8099", "#831c5d", "#c32454", "#f04f78", "#f68181", "#fca790", "#fdcbb0"];

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

export function randRange(min: number, max: number) { //returns number between max and min, inclusive
	let result = (Math.random() * ((max + 1) - min)) + min;
	return result;
}

export function hexToRgb(h: string) {
	if (h == undefined) {
		console.error("Hex undefined!",h);
	}
	let r = parseInt((h[1] + h[2]), 16);
	let g = parseInt((h[3] + h[4]), 16);
	let b = parseInt((h[5] + h[6]), 16);
	return [r,g,b];
}

export function initIdList() {
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

export function camelCaseToTitle(input: string) {
	let split = input.match(/[A-Za-z][^_\-A-Z]*/g) || [];
	return split.map(capitalise).join(" ");
}

function capitalise(input: string) {
	return input.charAt(0).toUpperCase() + input.substring(1);
}

export function generateId(): string {
	let idIndex = Math.floor(randRange(0,idList.length));
	let id = idList[idIndex];
	idList.splice(idIndex,1);

	return id;
}

export const preColoursBlood = ["#f8401b", "#bd2709", "#7c122b", "#b12935", "#f74a53", "#f22f46", "#6e2727", "#b33831", "#ae2334", "#e83b3b"];

export const preNames = ["Airiam", "Jonathan Archer", "Soji Asha", "Ayala", "Azan", "Reginald Barclay", "Bareil Antos", "Julian Bashir", "B'Etor", "Brad Boimler", "Boothby", "Borg Queen", "Phillip Boyce", "Brunt", "R. A. Bryce", "Gabrielle Burnham", "Michael Burnham", "Joseph Carey", "Chakotay", "Christine Chapel", "Pavel Chekov", "J. M. Colt", "Katrina Cornwell", "Kimara Cretak", "Beverly Crusher", "Wesley Crusher", "Hugh Culber", "Jal Culluh", "Elizabeth Cutler", "Leonardo da Vinci", "Damar", "Daniels", "Data", "Ezri Dax", "Jadzia Dax", "Degra", "Keyla Detmer", "The Doctor", "Dolim", "Dukat", "Michael Eddington", "Elnor", "Evek", "Vic Fontaine", "Maxwell Forrest", "Elim Garak", "Garrison", "Philippa Georgiou", "Sonya Gomez", "Gowron", "Amanda Grayson", "Guinan", "J. Hayes", "Erika Hernandez", "Hogan", "Mr. Homn", "Hugh", "Icheb", "Ishka", "Kathryn Janeway", "Jannar", "Michael Jonas", "Agnes Jurati", "K'Ehleyr", "Kes", "Khan Noonien Singh", "Harry Kim", "Kira Nerys", "George Kirk", "James T. Kirk", "Kol", "Kor", "Kurn", "Geordi La Forge", "La'an Noonien-Singh", "Laris", "Leeta", "Leland", "Li Nalas", "Linus", "Gabriel Lorca", "Lore", "L'Rell", "Lursa", "Maihar'du", "Mallora", "Carol Marcus", "Beckett Mariner", "Martok", "Travis Mayweather", "Leonard McCoy", "Mezoti", "Mila", "Mora Pol", "Morn", "Mot", "Harry Mudd", "Raffi Musiker", "Narek", "Alynna Nechayev", "Neelix", "Nhan", "Susan Nicoletti", "Nilsson", "Nog", "Kashimuro Nozawa", "Keiko O'Brien", "Miles O'Brien", "Molly O'Brien", "Odo", "Alyssa Ogawa", "Oh", "Opaka Sulan", "Joann Owosekun", "Owen Paris", "Tom Paris", "Phlox", "Jean-Luc Picard", "Renée Picard", "Christopher Pike", "Tracy Pollard", "Katherine Pulaski", "Q", "Quark", "Janice Rand", "Rebi", "Malcolm Reed", "Jet Reno", "Gen Rhys", "William Riker", "Cristóbal \"Chris\" Rios", "Narissa Rizzo", "Ro Laren", "Rom", "William Ross", "Michael Rostov", "Alexander Rozhenko", "Saavik", "Sarek", "Saru", "Hoshi Sato", "Sela", "Seska", "Seven of Nine", "Montgomery Scott", "Shakaar Edon", "Thy'lek Shran", "Silik", "Benjamin Sisko", "Jake Sisko", "Jennifer Sisko", "Joseph Sisko", "Sarah Sisko", "Luther Sloan", "Soval", "Spock", "Paul Stamets", "Lon Suder", "Hikaru Sulu", "Enabran Tain", "Sylvia Tilly", "Tomalak", "Tora Ziyal", "B'Elanna Torres", "T'Pol", "The Traveler", "Deanna Troi", "Lwaxana Troi", "Trip Tucker", "Tuvok", "Ash Tyler", "José Tyler", "Nyota Uhura", "Una", "Vash", "Vorik", "Weyoun", "Naomi Wildman", "Samantha Wildman", "Winn Adami", "Worf", "Tasha Yar", "Kasidy Yates", "Zek", "Zhaban", "Number One", "Kyle", "John Farrell", "Kelowitz", "Vincent DeSalle", "Hadley", "Leslie", "Galloway", "Roger Lemli", "Brent", "Harrison", "Hugh of Borg", "Robin Lefler", "Thomas Riker", "Rusot", "Joe Carey", "Chell", "Kaplan", "Doctor Chaotica", "Tal Celes", "Charles \"Trip\" Tucker III", "Marcus Williams", "Humanoid figure", "Duras", "N. Kemper", "Talas", "D. Chang", "Taylor", "F. Hawkins", "Xindi Primate Councillor", "T'Les", "Kelby", "T'Pau", "Harris", "Koss", "Voq", "Cleveland \"Book\" Booker", "Jett Reno", "Adira Tal", "R.A. Bryce", "Aurellio", "Ellen Landry", "Charles Vance", "Gray Tal", "Kovich", "Zora", "Grudge", "Audrey Willa", "Ryn", "Osyraa", "T'Rina", "Laira Rillak", "Ruon Tarka", "Noah Averbach-Katz", "Janet Kidder", "Tara Rosling", "Chelah Horsdal", "Shawn Doyle", "Dahj Asha", "Sutra", "Kore Soong", "Chris Rios", "Tallinn", "Altan Inigo Soong", "Adam Soong", "Jack Crusher", "Commodore Oh", "Narissa", "Ramdha", "Dr. Teresa Ramirez", "Captain Liam Shaw", "Sidney La Forge", "Vadic", "Alandra La Forge", "Titus Rikka", "Professor James Moriarty", "Commander Ro Laren", "Fleet Admiral Elizabeth Shelby", "William Boimler", "D'Vana Tendi", "Sam Rutherford", "Red Rutherford", "Carol Freeman", "Jack Ransom", "Shaxs", "T'Ana", "Andy Billups", "Barnes", "Steve Stevens", "Jet Manhaver", "Badgey", "Jennifer Sh'reyan", "Alonzo Freeman", "Migleemo", "Kayshon", "Les Buenamigo", "Petra Aberdeen", "Peanut Hamper", "AGIMUS", "T'Lyn", "Zefram Cochrane", "Leah Brahms", "Dal", "Gwyndala", "Jankom Pog", "Zero", "Rok-Tahk", "Murf", "Drednok", "The Diviner", "Asencia", "Tysess", "Noum", "Thadiun Okona", "Edward Jellico", "Christopher \"Chris\" Pike", "Erica Ortegas", "Joseph M'Benga", "Hemmer", "Una Chin-Riley", "Robert April", "Sam Kirk", "T'Pring", "Batel", "Pelia", "Leader on Kiley 279", "Alora", "The First Servant", "Gamal", "Angel", "Neera Ketoul", "Scotty", "Uhura", "Una \"Number One\" Chin-Riley", "Arik Soong", "Ann Mulhall", "Miranda Jones", "Dara", "Bhurlee", "Branmer", "Ashan", "Coplann", "Callenn", "Callier", "Deeron", "Delenn", "Devlin", "Dhaliri", "Draal", "Drakhen", "Dukhat", "Dulann", "Durhan", "Durlan", "Findell", "Firell", "Forell", "Hedronn", "Inesval", "Jenimer", "Kalain", "Katz", "Kodroni", "Lavell", "Lennan", "Lennier", "Lennok", "Lenonn", "Mayan", "Mazetch", "Morann", "Nelier", "Neroon", "Nukenn", "Nur", "Rashok", "Rastenn", "Rathenn", "Ruell", "Shakat", "Shakiri", "Sindell", "Sineval", "Sonovar", "Tafeek", "Tannier", "Teronn", "Tranall", "Trulann", "Tulan", "Turval", "Valen", "Varenn", "Vastor", "Venak", "Zakat"]

export const preColours = ["#2e222f", "#3e3546", "#625565", "#966c6c", "#ab947a", "#694f62", "#7f708a", "#9babb2", "#c7dcd0", "#ffffff", "#6e2727", "#b33831", "#ea4f36", "#f57d4a", "#ae2334", "#e83b3b", "#fb6b1d", "#f79617", "#f9c22b", "#7a3045", "#9e4539", "#cd683d", "#e6904e", "#fbb954", "#4c3e24", "#676633", "#a2a947", "#d5e04b", "#fbff86", "#165a4c", "#239063", "#1ebc73", "#91db69", "#cddf6c", "#313638", "#374e4a", "#547e64", "#92a984", "#b2ba90", "#0b5e65", "#0b8a8f", "#0eaf9b", "#30e1b9", "#8ff8e2", "#323353", "#484a77", "#4d65b4", "#4d9be6", "#8fd3ff", "#45293f", "#6b3e75", "#905ea9", "#a884f3", "#eaaded", "#753c54", "#a24b6f", "#cf657f", "#ed8099", "#831c5d", "#c32454", "#f04f78", "#f68181", "#fca790", "#fdcbb0"];

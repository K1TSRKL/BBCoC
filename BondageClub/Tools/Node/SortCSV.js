import fs from "fs";
import minimist from "minimist";
import path from "path";
import { createArrayCsvWriter } from 'csv-writer';

import { parseCSV, zip, validateArgv, BASE_PATH } from "./Common.js";

const HELP = `\
Sort the entries of the passed csv file.

Usage:
	npm --prefix BondageClub/ run files:sortcsv -- [options]

Options:
	-h, --help          Show help
	-f, --file <path>   The path to the to-be sorted .csv file
	--all               Run the script over all .csv files in the passed --file
`;

/**
 * Sort the entries of the passed csv file.
 * @param {string} filename
 */
function sortCSV(filename) {
	filename = fs.existsSync(filename) ? filename : path.join(BASE_PATH, filename);
	let csv = parseCSV(fs.readFileSync(filename, { encoding: "utf8" }));
	csv.sort((iList, jList) => {
		return zip(iList, jList).map(([i, j]) => {
			const iInt = Number.parseInt(i);
			const jInt = Number.parseInt(j);
			if (Number.isNaN(iInt) || Number.isNaN(jInt)) {
				return i.localeCompare(j);
			} else {
				return iInt - jInt;
			}
		}).find(i => i !== 0) ?? 0;
	});
	csv = csv.filter((value, index, array) => {
		return array.findIndex((other) => zip(value, other).every(([a, b]) => a === b)) === index;
	});

	const writer = createArrayCsvWriter({ path: filename });
	writer.writeRecords(csv).then(_ => {
		console.log(`Sorted "${filename}" entries`);
	});
}

/**
 * Find all .csv files in the passed `root` directory and sort them
 * @param {string} root
 * @param {boolean} recursive
 */
function sortAllCSV(root, recursive=true) {
	root = fs.existsSync(root) ? root : path.join(BASE_PATH, root);
	for (const file of fs.readdirSync(root, { encoding: "utf8", recursive })) {
		const ext = file.split(".").at(-1);
		if (ext === "csv") {
			sortCSV(path.join(root, file));
		}
	}
}

(function () {
	const kwargsTemplate = { file: "", f: "", help: false, h: false, all: false };
	const args = minimist(
		process.argv.slice(2),
		{ string: ["file"], alias: { "h": "help", "f": "file" } },
	);
	/** @type {typeof kwargsTemplate} */
	let kwargs;
	try {
		kwargs = validateArgv(args, kwargsTemplate);
	} catch (e) {
		console.error(/** @type {Error} */(e).message);
		console.log(HELP);
		process.exit(-1);
	}

	if (kwargs.help) {
		console.log(HELP);
	} else if (kwargs.all) {
		sortAllCSV(kwargs.file);
	} else {
		sortCSV(kwargs.file);
	}
})();

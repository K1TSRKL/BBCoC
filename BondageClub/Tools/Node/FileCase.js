import path from "path";
import fs from "fs";
import { BASE_PATH, error } from "./Common.js";

/**
 * @param {string} root
 */
function checkFileCasing(root) {
	/** @type {Set<string>} */
	const files = new Set();
	/** @type {Set<string>} */
	const nonLowerCaseExtLayers = new Set();
	/** @type {string[]} */
	const invalid = [];
	for (const _file of fs.readdirSync(root, { encoding: "utf8", recursive: true })) {
		const filePath = path.parse(_file);
		if (filePath.dir.startsWith("Assets/") && filePath.ext !== filePath.ext.toLowerCase()) {
			nonLowerCaseExtLayers.add(_file);
		}
		const file = _file.toLowerCase();
		if (files.has(file)) {
			invalid.push(_file);
		}
		files.add(file);
	}

	if (invalid.length) {
		invalid.sort();
		error(
			`found ${invalid.length} duplicate files with different upper- and/or lower-casing: `
			+ `${JSON.stringify(invalid, undefined, 4)}`,
		);
	}

	if (nonLowerCaseExtLayers.size) {
		error(`found ${nonLowerCaseExtLayers.size} layers with non-lowercase extensions: ${JSON.stringify([...nonLowerCaseExtLayers].sort(), undefined, 4)}`);
	}
}

(function () {
	checkFileCasing(BASE_PATH);
}());

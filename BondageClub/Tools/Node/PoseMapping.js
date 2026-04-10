import vm from "vm";
import fs from "fs";
import process from "process";
import minimist from "minimist";
import util from 'util';

import {
	NEEDED_FILES,
	BASE_PATH,
	loadCSV,
	entries,
	fromEntries,
	keys,
	isObject,
	validateArgv,
} from "./Common.js";

/** @type {<T>(obj: T) => T} */
function noop(obj) {
	return obj;
}

/**
 * Optional functions for pre-processing and sorting layer properties before dumping them to JSON
 * @type {{ readonly [k in keyof AssetLayer]?: (value: AssetLayer[k]) => AssetLayer[k] }}
 */
const SORTER = {
	PoseMapping: rec => fromEntries(entries(rec).sort((i, j) => i[0].localeCompare(j[0])).filter(i => i[1])),
};

/**
 * Functions for generating the diff for each layer property.
 * @satisfies {{ readonly [k in keyof AssetLayer]?: (a: AssetLayer[k], b: AssetLayer[k]) => null | DiffEntry.Layer[k] }}
 */
const DIFF = /** @type {const} */({
	PoseMapping: (a, b) => {
		if (!isObject(b)) return null;
		const poseNames = Array.from(new Set([...keys(a), ...keys(b)])).sort();
		const diff = poseNames.map(k => {
			const poseNew = a[k] ?? "";
			const poseOld = b[k] ?? "";
			if (poseNew === poseOld) {
				return /** @type {never} */(null);
			} else {
				return /** @type {const} */([k, { "+": poseNew, "-": poseOld }]);
			}
		}).filter(Boolean);
		return diff.length === 0 ? null : fromEntries(diff);
	},
});

const HELP = `\
Script for dumping and comparing pose mappings.

Usage:
	npm --prefix BondageClub/ run assets:posemapping -- [options]

Options:
	-h, --help          Show help
	--dump <path>       Write the current pose mappings to the specified JSON file
	--compare <path>    Compare the current pose mappings with those in the passed JSON file
`;


/**
 * Dump the pose mappings, extracted from the passed assets, to the output json file specified in `outputPath`
 * @param {readonly Asset[]} assets
 * @returns {JSONMapping.Layer<"PoseMapping">}
 */
function gatherPoseMappings(assets) {
	const sortProperty = SORTER.PoseMapping ?? noop;

	const layers = [...assets].sort((a, b) => {
		const groupPrio = a.Group.Name.localeCompare(b.Group.Name);
		const assetPrio = a.Name.localeCompare(b.Name);
		return groupPrio || assetPrio;
	}).flatMap(a => a.Layer);

	const ret = /** @type {JSONMapping.Layer<"PoseMapping">} */({});
	for (const layer of layers) {
		const layerName = layer.Name ?? "";
		const assetName = layer.Asset.Name;
		const groupName = layer.Asset.Group.Name;

		if (!ret[groupName]) {
			ret[groupName] = {};
		}
		if (!ret[groupName][assetName]) {
			ret[groupName][assetName] = {};
		}

		ret[groupName][assetName][layerName] = sortProperty(layer.PoseMapping);
	}
	return ret;
}

/**
 * Construct the difference between the layer pose mappings in `newData` and `oldData`.
 * Assets, groups and layers absent from `oldData` are ignored.
 * @param {JSONMapping.Layer<"PoseMapping">} newData
 * @param {Partial<JSONMapping.Layer<"PoseMapping">>} oldData
 * @returns {DiffMapping.Layer<"PoseMapping"> | null}
 */
function getPoseMappingsDiff(newData, oldData) {
	const getDiff = DIFF.PoseMapping;
	if (!getDiff) {
		console.warn(`Unsupported layer property`);
		return null;
	}

	/** @type {DiffMapping.Layer<"PoseMapping">} */
	const diffMapping = {};
	for (const [groupName, assetNew] of entries(newData)) {
		const assetOld = oldData[groupName];
		if (!isObject(assetOld)) {
			continue;
		}

		for (const [assetName, layerNew] of entries(assetNew)) {
			const layerOld = assetOld[assetName];
			if (!isObject(layerOld)) {
				continue;
			}

			for (const [layerName, posesNew] of entries(layerNew)) {
				const posesOld = layerOld[layerName];
				const diff = getDiff(posesNew, posesOld);
				if (diff === null) {
					continue;
				}

				let groupDiff = diffMapping[groupName];
				if (!groupDiff) groupDiff = diffMapping[groupName] = {};
				let assetDiff = groupDiff[assetName];
				if (!assetDiff) assetDiff = groupDiff[assetName] = {};
				assetDiff[layerName] = diff;
			}
		}
	}
	return keys(diffMapping).length === 0 ? null : diffMapping;
}

/**
 * @returns {{ poseMapping: JSONMapping.Layer<"PoseMapping"> }}
 */
function runVM() {
	const [commonFile, ...neededFiles] = NEEDED_FILES;
	/** @type {vm.Context & { Asset?: Asset[] }} */
	const context = vm.createContext({
		OuterArray: Array,
		Object: Object,
		TestingColorLayers: new Set(loadCSV("Assets/Female3DCG/LayerNames.csv", 2).map(i => i[0])),
		TestingColorGroups: new Set(loadCSV("Assets/Female3DCG/ColorGroups.csv", 2).map(i => i[0])),
	});
	vm.runInContext(fs.readFileSync(BASE_PATH + commonFile, { encoding: "utf-8" }), context, {
		filename: commonFile,
	});

	// Only patch `CommonGet` after loading `Common`, lest our monkey patch will be overriden again
	context.CommonGet = (file, callback) => {
		const data = fs.readFileSync(`../../${file}`, "utf8");
		const obj = {
			status: 200,
			responseText: data,
		};
		callback.bind(obj)(obj);
	};
	for (const file of neededFiles) {
		vm.runInContext(fs.readFileSync(BASE_PATH + file, { encoding: "utf-8" }), context, {
			filename: file,
		});
	}

	const { Asset } = context;
	if (!Asset) {
		throw new Error("Failed to generate the `Asset` and/or `Pose` arrays");
	}

	return { poseMapping: gatherPoseMappings(Asset) };
}

(function () {
	const kwargsTemplate = { help: false, h: false, compare: "", dump: "" };
	const kwargs = validateArgv(minimist(
		process.argv.slice(2),
		{ string: ["compare", "dump"], alias: { "h": "help" } },
	), kwargsTemplate);
	if (kwargs.help) {
		console.log(HELP);
		return;
	}

	const { poseMapping } = runVM();

	if (kwargs.dump) {
		fs.writeFileSync(kwargs.dump, JSON.stringify(poseMapping, undefined, 4));
		console.log(`Succesfully written pose mapping to "${kwargs.dump}"`);
	}

	if (kwargs.compare) {
		/** @type {null | Record<string, any> | any[]} */
		const poseMappingOld = JSON.parse(fs.readFileSync(kwargs.compare, { encoding: "utf8" }));
		if (!isObject(poseMappingOld)) {
			throw new Error(`Invalid "${kwargs.compare}" JSON data expected a nested record`);
		}

		const diff = getPoseMappingsDiff(poseMapping, poseMappingOld);
		if (diff !== null) {
			console.error(util.inspect(diff, { depth: null, colors: true }));
			process.exit(1);
		} else {
			console.log(`Succesfully compared "${kwargs.compare}" pose mappings without conflict`);
		}
	}
})();

// @ts-strict-ignore
"use strict";

/**
 * A module with helper utilities for testing.
 * Note that this file and its content therein should only be executed when running
 * the `AssetCheck` test suit, and should therefore *not* be added to `index.html`.
 *
 * NOTE: Make sure to declare module-level objects as `var` if they should appear in
 * the VM context output.
 */

/** @type {Set<string>} */
var TestingColorLayers;
/** @type {Set<string>} */
var TestingColorGroups;

/**
 * Gather all color-layers and -groups absent from their respective .csv files
 * @returns {[colorLayers: TestingStruct<string>[], colorGroups: TestingStruct<string>[]]}
 */
function TestingGetMissingColorLayersGroups() {
	if (typeof TestingColorLayers === "undefined" || typeof TestingColorGroups === "undefined") {
		throw new Error("Cannot run function outside of the test suite");
	}

	/** @type {TestingStruct<string>[]} */
	const missingLayers = [];
	/** @type {TestingStruct<string>[]} */
	const missingGroups = [];

	if (Asset.length === 0) {
		AssetLoadAll();
	}
	for (const a of Asset) {
		const item = { Asset: a };
		const Group = a.DynamicGroupName;
		const Name = a.Name;
		const colorableLayers = ItemColorGetColorableLayers(item);
		const simpleMode = colorableLayers.length === 1;
		const colorGroups = ItemColorGetGroups(item, colorableLayers);

		for (const colorGroup of colorGroups) {
			if (colorGroup.name === null || simpleMode) {
				continue;
			}

			// Gather all missing groups
			const groupStruct = { Group, Name, Invalid: `${Group}${Name}${colorGroup.name}` };
			if (colorGroup.layers.length !== 1 && !TestingColorGroups.has(groupStruct.Invalid)) {
				missingGroups.push(groupStruct);
			}

			// Gather all missing layers
			for (const colorLayer of colorGroup.layers) {
				const layerStruct = { Group, Name, Invalid: `${Group}${Name}${colorLayer.Name || ""}` };
				const struct = (colorGroup.layers.length === 1) ? groupStruct : layerStruct;
				if (!TestingColorLayers.has(struct.Invalid)) {
					missingLayers.push(struct);
				}
			}
		}
	}
	return [missingLayers, missingGroups];
}

/**
 * Test whether all asset default colors are valid.
 * @returns {TestingStruct<string[]>[]}
 */
function TestingValidateDefaultColor() {
	const validColorNonhex = new Set(["Default", "White", "Black", "Asian"]);

	/** @type {TestingStruct<string[]>[]} */
	const ret = [];
	for (const asset of Asset) {
		const invalid = asset.DefaultColor.filter(i => !(validColorNonhex.has(i) || CommonIsColor(i)));
		if (invalid.length) {
			ret.push({ Group: asset.Group.Name, Name: asset.Name, Invalid: invalid });
		}
	}
	return ret;
}

var [TestingMisingColorLayers, TestingMisingColorGroups] = TestingGetMissingColorLayersGroups();
var TestingInvalidDefaultColor = TestingValidateDefaultColor();

// Alias as a var-declared variable so its discoverable by `vm.Context`
var TestingModularItemDataLookup = ModularItemDataLookup;
var TestingTypedItemDataLookup = TypedItemDataLookup;
var TestingVibratingItemDataLookup = VibratorModeDataLookup;
var TestingVariableHeightItemDataLookup = VariableHeightDataLookup;
var TestingTextItemDataLookup = TextItemDataLookup;
var TestingNoArchItemDataLookup = NoArchItemDataLookup;

/** A record mapping pose categories to pose names */
var TestingPoseMap = /** @type {Record<AssetPoseCategory, Set<AssetPoseName>>} */({});
for (const { Category, Name } of Pose) {
	if (TestingPoseMap[Category]) {
		TestingPoseMap[Category].add(Name);
	} else {
		TestingPoseMap[Category] = new Set([Name]);
	}
}

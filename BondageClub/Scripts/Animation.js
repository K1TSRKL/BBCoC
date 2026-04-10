"use strict";

/**
 * Types of dynamic data that can be stored.
 * @constant
 * @satisfies {Record<string, AnimationDataTypes>}
 */
var AnimationDataTypes = /** @type {const} */({
	AssetGroup: "AssetGroup",
	Base: "",
	Canvas: "DynamicPlayerCanvas",
	PersistentData: "PersistentData",
	Rebuild: "Rebuild",
	RefreshTime: "RefreshTime",
	RefreshRate: "RefreshRate",
});

/**
 * Where animation data is stored. Animation data is only managed client side, nothing should be synced.
 * @constant
 * @type {AnimationPersistentStorage} - The animation data object.
 */
var AnimationPersistentStorage = {
	[AnimationDataTypes.AssetGroup]: {},
	[AnimationDataTypes.Base]: {},
	[AnimationDataTypes.Canvas]: {},
	[AnimationDataTypes.PersistentData]: {},
	[AnimationDataTypes.Rebuild]: {},
	[AnimationDataTypes.RefreshTime]: {},
	[AnimationDataTypes.RefreshRate]: {},
};

/**
 * Gets the dynamic data storage name for a given item on a given character.
 * @param {Character} C - Character wearing the animated object
 * @param {Asset} [Asset] - The animated object
 * @returns {AnimationDataKey} - Contains the name of the persistent data key.
 */
function AnimationGetDynamicDataName(C, Asset) {
	const assetKey = Asset ? `__${Asset.Group.Name}__${Asset.Name}` : "";
	return `${C.CharacterID}${assetKey}`;
}

/**
 * Gets the persistent data  for a given item on a given character. This method should not be called explicitly, use the Data builder passed to the dynamic drawing functions.
 * @param {Character} C - Character wearing the animated object
 * @param {Asset} Asset - The animated object
 * @returns {AnimationPersistentData} - Contains the persistent data of the animated object, returns a new empty object if it was never initialized previously.
 */
function AnimationPersistentDataGet(C, Asset) {
	const PersistentDataName = AnimationGetDynamicDataName(C, Asset);
	return AnimationPersistentStorage[AnimationDataTypes.PersistentData][PersistentDataName] ??= {};
}

/**
 * Sets the maximum animation refresh rate for a given character.
 * @param {Character} C - Character wearing the dynamic object
 * @param {number} RequestedRate - The maximum refresh rate to request in ms
 * @returns {void} - Nothing
 */
function AnimationRequestRefreshRate(C, RequestedRate) {
	const key = AnimationGetDynamicDataName(C);
	let RefreshRate = AnimationPersistentStorage[AnimationDataTypes.RefreshRate][key] ?? Infinity;
	if (RequestedRate < RefreshRate) {
		AnimationPersistentStorage[AnimationDataTypes.RefreshRate][key] = RequestedRate;
	}
}

/**
 * Marks a given character to be redrawn on the next animation refresh.
 * @param {Character} C - Character wearing the dynamic object
 * @returns {void} - Nothing
 */
function AnimationRequestDraw(C) {
	AnimationPersistentStorage[AnimationDataTypes.Rebuild][AnimationGetDynamicDataName(C)] = true;
}

/**
 * Gets the group object for a given character. This method should not be called explicitly, use the Data builder passed to the dynamic drawing functions.
 * @param {Character} C - Character wearing the animated object
 * @param {AnimationDataKey} Name - Name of the animated object
 * @returns {{ Subscriptions: AnimationDataKey[] }} - Contains the persistent group data, returns a new empty object if it was never initialized previously.
 */
function AnimationGroupGet(C, Name) {
	let GroupKey = AnimationGetDynamicDataName(C);
	AnimationPersistentStorage[AnimationDataTypes.AssetGroup][GroupKey] ??= {};
	return AnimationPersistentStorage[AnimationDataTypes.AssetGroup][GroupKey][Name] ??= { Subscriptions: [] };
}

/**
 * Marks a given asset as part of a shared data group.
 * @param {Character} C - Character wearing the dynamic object
 * @param {Asset} Asset - The animated object
 * @param {string} Name - Name of the group to subscribe to.
 * @returns {void} - Nothing
 */
function AnimationGroupSubscribe(C, Asset, Name) {
	const DataKey = AnimationGetDynamicDataName(C, Asset);
	const Group = AnimationGroupGet(C, Name);
	AnimationPersistentDataGet(C, Asset)[`GroupData${Name}`] = Group;
	if (Array.isArray(Group.Subscriptions) && !Group.Subscriptions.includes(DataKey)) {
		Group.Subscriptions.push(DataKey);
	}
}

/**
 * Generates a temporary canvas used draw on for dynamic assets.
 * Careful! The width of the canvas should never be higher than 500px.
 * @param {Character} C - Character for which the temporary canvas is
 * @param {Asset} A - Asset for which the canvas is
 * @param {number} W - Width of the canvas (can be changed later)
 * @param {number} H - Height of the canvas (can be changed later)
 * @returns {HTMLCanvasElement} - The temporary canvas to use
 */
function AnimationGenerateTempCanvas(C, A, W, H) {
	let TempCanvas = document.createElement("canvas");
	TempCanvas.setAttribute('name', AnimationGetDynamicDataName(C, A));
	TempCanvas.width = W ? W : 500;
	TempCanvas.height = H ? H : 500;
	return TempCanvas;
}

/**
 * Purges all dynamic asset data corresponding to a given character.
 * @param {Character} C - The character to delete the animation data of
 * @param {boolean} IncludeAll - TRUE if we should delete every animation data for the given character.
 * @returns {void} - Nothing
 */
function AnimationPurge(C, IncludeAll) {
	/** @type {string[]} */
	const PossibleData = [];
	/** @type {string[]} */
	const PossibleCanvas = [];

	// Highlights the data to keep
	if (!IncludeAll) {
		C.Appearance.forEach((CA) => {
			const assetKey = AnimationGetDynamicDataName(C, CA.Asset);
			PossibleData.push(assetKey);
			PossibleCanvas.push(assetKey);
		});
	}

	// Checks if any character specific info is worth being kept
	const charKey = AnimationGetDynamicDataName(C);
	if (IncludeAll || !C.Appearance.find(CA => CA.Asset.DynamicScriptDraw || CA.Asset.DynamicAfterDraw || CA.Asset.DynamicBeforeDraw)) {
		delete AnimationPersistentStorage[AnimationDataTypes.RefreshTime][charKey];
		delete AnimationPersistentStorage[AnimationDataTypes.Rebuild][charKey];
		delete AnimationPersistentStorage[AnimationDataTypes.AssetGroup][charKey];
	}

	// Always delete the refresh rate for accurate requested rate.
	delete AnimationPersistentStorage[AnimationDataTypes.RefreshRate][charKey];

	// Clear no longer needed data (Clear the subscription, then clear the asset data)
	for (const [key, { Group }] of CommonEntries(AnimationPersistentStorage[AnimationDataTypes.PersistentData] ?? {})) {
		const isCharDataKey = key.startsWith(C.CharacterID + "__");
		if (isCharDataKey && !PossibleData.includes(key)) {
			if (Group && Array.isArray(Group.Subscriptions)) {
				Group.Subscriptions = Group.Subscriptions.filter(k => k != key);
			}
			delete AnimationPersistentStorage[AnimationDataTypes.PersistentData][key];
		}
	}

	// Clear no longer needed cached canvases
	GLDrawImageCache.forEach((img, key) => {
		if (key.startsWith(C.CharacterID + "__") && !PossibleCanvas.includes(key)) {
			GLDrawImageCache.delete(key);
		}
	});

	// Clear empty groups when all is done
	for (const [key, obj] of CommonEntries(AnimationPersistentStorage[AnimationDataTypes.AssetGroup][charKey] ?? {})) {
		if (!Array.isArray(obj.Subscriptions) || obj.Subscriptions.length == 0) {
			delete AnimationPersistentStorage[AnimationDataTypes.AssetGroup][charKey][key];
		}
	}
}

// @ts-strict-ignore
"use strict";

/**
 * Property.js
 * -----------
 * A module with common helper functions for the handling of specific {@link ItemProperties} properties.
 * Note that more generic extended item functions should be confined to `ExtendedItem.js`.
 */

/**
 * A Map that maps input element IDs to their original value is defined in, _.e.g_, {@link PropertyOpacityLoad}.
 * Used as fallback in case an invalid opacity value is encountered when exiting.
 * @type {Map<string, any>}
 */
const PropertyOriginalValue = new Map([]);

/**
 * Construct an item-specific ID for a properties input element (_e.g._ an opacity slider).
 * @param {string} Name - The name of the input element
 * @param {Item} Item - The item for whom the ID should be constructed; defaults to {@link DialogFocusItem}
 * @returns {string} - The ID of the property
 */
function PropertyGetID(Name, Item=DialogFocusItem) {
	return `${Item.Asset.Group.Name}${Item.Asset.Name}${Name}`;
}

/**
 * Throttled callback for opacity slider changes
 * @param {Character} C - The character being modified
 * @param {Item} item - The item being modified
 * @param {number} Opacity - The new opacity to set on the item
 * @returns {void} - Nothing
 */
const PropertyOpacityChange = CommonLimitFunction((C, Item, Opacity) => {
	Item.Property.Opacity = Opacity;
	CharacterLoadCanvas(C);
});

/** @type {ExtendedItemScriptHookCallbacks.Init<ExtendedItemData<any>>} */
function PropertyOpacityInit({ asset }, originalFunction, C, item, push=true, refresh=true) {
	if (!CommonIsObject(item.Property)) {
		item.Property = {};
	}

	// Abort prematurely if all opacity values are within bounds; no need for any refreshes or pushes as nothing was changed
	const opacity = item.Property.Opacity;
	if (CommonIsFinite(opacity, asset.MinOpacity, asset.MaxOpacity)) {
		return originalFunction?.(C, item, push, refresh) ?? false;
	} else if (
		CommonIsArray(opacity)
		&& opacity.length === asset.Layer.length
		&& opacity.every((o, i) => CommonIsFinite(o, asset.Layer[i].MinOpacity, asset.Layer[i].MaxOpacity))
	) {
		return originalFunction?.(C, item, push, refresh) ?? false;
	}

	// Illegal or uninitialized opacity value; restore a valid default and perform the whole push + refresh dance
	item.Property.Opacity = asset.Opacity;

	if (originalFunction) originalFunction(C, item, false, false);
	if (refresh) CharacterRefresh(C, push, false);
	if (push) ChatRoomCharacterItemUpdate(C, asset.Group.Name);
	return true;
}

/**
 * Load function for items with opacity sliders. Constructs the opacity slider.
 * @param {ExtendedItemData<any>} Data - The items extended item data
 * @param {() => void} OriginalFunction - The function that is normally called when an archetypical item reaches this point (if any).
 * @param {ThumbIcon} thumbIcon The icon to use for the range input's "thumb" (handle).
 * @returns {HTMLInputElement} - The new or pre-existing range input element of the opacity slider
 * @satisfies {ExtendedItemScriptHookCallbacks.Load<any>}
 */
function PropertyOpacityLoad({ asset, dialogPrefix }, OriginalFunction, thumbIcon="blindfold") {
	OriginalFunction();
	const ID = PropertyGetID("Opacity");

	if (!PropertyOriginalValue.has(ID)) {
		PropertyOriginalValue.set(ID, DialogFocusItem.Property.Opacity);
	}

	const opacity = CommonIsNumeric(DialogFocusItem.Property.Opacity) ? DialogFocusItem.Property.Opacity : 1;
	const opacitySlider = ElementCreateRangeInput(
		ID,
		opacity,
		asset.MinOpacity,
		asset.MaxOpacity,
		0.01,
		thumbIcon,
	);

	if (opacitySlider) {
		const C = CharacterGetCurrent();
		opacitySlider.addEventListener("input", (e) => PropertyOpacityChange(C, DialogFocusItem, Number(/** @type {HTMLInputElement} */ (e.target).value)));
		return opacitySlider;
	} else {
		return /** @type {HTMLInputElement} */(document.getElementById(ID));
	}
}

/**
 * Draw function for items with opacity sliders. Draws the opacity slider and further opacity-related information.
 * @param {ExtendedItemData<any>} Data - The items extended item data
 * @param {() => void} OriginalFunction - The function that is normally called when an archetypical item reaches this point (if any).
 * @param {number} XOffset - An offset for all text and slider X coordinates
 * @param {number} YOffset - An offset for all text and slider Y coordinates
 * @param {string} LabelKeyword - The keyword of the opacity label
 * @returns {void} Nothing
 * @satisfies {ExtendedItemScriptHookCallbacks.Draw<any>}
 */
function PropertyOpacityDraw(Data, OriginalFunction, XOffset=0, YOffset=0, LabelKeyword="OpacityLabel") {
	OriginalFunction();
	const ID = PropertyGetID("Opacity");

	MainCanvas.textAlign = "right";
	DrawTextFit(
		InterfaceTextGet(LabelKeyword), 1375 + XOffset, 450 + YOffset,
		400, "#FFFFFF", "#000",
	);
	ElementPosition(ID, 1625 + XOffset, 450 + YOffset, 400);
	const opacity = CommonIsNumeric(DialogFocusItem.Property.Opacity) ? DialogFocusItem.Property.Opacity : 1;
	DrawTextFit(
		`${Math.round(opacity * 100)}%`, 1925 + XOffset, 450 + YOffset,
		400, "#FFFFFF", "#000",
	);
	MainCanvas.textAlign = "center";
}

/**
 * Exit function for items with opacity sliders. Updates the items opacity, deletes the slider and (optionally) refreshes the character and item.
 * @param {ExtendedItemData<any>} Data - The items extended item data
 * @param {null | (() => void)} OriginalFunction - The function that is normally called when an archetypical item reaches this point (if any).
 * @param {boolean} Refresh - Whether character parameters and the respective item should be refreshed or not
 * @returns {boolean} Whether the opacity was updated or not
 * @satisfies {ExtendedItemScriptHookCallbacks.Exit<any>}
 */
function PropertyOpacityExit({ asset }, OriginalFunction, Refresh=true) {
	if (OriginalFunction != null) {
		OriginalFunction();
	}

	const ID = PropertyGetID("Opacity");
	const C = CharacterGetCurrent();
	const Opacity = Number(ElementValue(ID));

	// Restore the original opacity if the new opacity is invalid
	if (!(Opacity <= asset.MaxOpacity && Opacity >= asset.MinOpacity)) {
		DialogFocusItem.Property.Opacity = PropertyOriginalValue.get(ID);
		ElementRemove(ID);
		PropertyOriginalValue.delete(ID);
		return false;
	}

	// Remove the element after calling `CharacterRefresh`
	// The latter will call `Load`, which would otherwise restore the slider again
	if (Refresh) {
		CharacterRefresh(C, true, false);
		ChatRoomCharacterItemUpdate(C, asset.Group.Name);
	}
	ElementRemove(ID);
	PropertyOriginalValue.delete(ID);
	return true;
}

/**
 * Helper fuction for publishing shock-related actions.
 * @param {Character} C - The shocked character; defaults to the {@link CharacterGetCurrent} output
 * @param {Item} Item - The shocking item; defaults to {@link DialogFocusItem}
 * @param {boolean} Automatic - Whether the shock was triggered automatically or otherwise manually
 */
function PropertyShockPublishAction(C=null, Item=DialogFocusItem, Automatic=false) {
	if (C == null) {
		C = CharacterGetCurrent();
	}
	if (Item == null) {
		return;
	}

	// Get item-specific properties and choose a suitable default if absent
	const ShockLevel = (Item.Property.ShockLevel != null) ? Item.Property.ShockLevel : 1;
	const ShowText = (Item.Property.ShowText != null) ? Item.Property.ShowText : true;
	if (Item.Property.TriggerCount != null) {
		Item.Property.TriggerCount++;
	}

	if (C.ID === Player.ID) {
		// The Player shocks herself
		ActivityArousalItem(C, C, Item.Asset);
	}
	InventoryShockExpression(C);

	const Dictionary = new DictionaryBuilder()
		.destinationCharacterName(C)
		.asset(Item.Asset, "AssetName", Item.Craft && Item.Craft.Name)
		.shockIntensity(ShockLevel * 1.5)
		.focusGroup(Item.Asset.Group.Name)
		.if(Automatic)
		.markAutomatic()
		.endif()
		.build();

	const ActionTag = `TriggerShock${ShockLevel}`;

	// Manually play audio and flash the screen when not in a chatroom
	if (CurrentScreen !== "ChatRoom") {
		AudioPlaySoundEffect("Shocks", 3 + (3 * ShockLevel));
		if (C.ID === Player.ID) {
			const duration = (Math.random() + ShockLevel * 1.5) * 500;
			DrawFlashScreen("#FFFFFF", duration, 500);
		}
	}

	// Publish the action, be it either quietly or not
	if (ShowText && CurrentScreen === "ChatRoom") {
		ChatRoomPublishCustomAction(ActionTag, false, Dictionary);
	} else if (CurrentScreen === "ChatRoom") {
		ChatRoomMessage({ Content: ActionTag, Type: "Action", Sender: Player.MemberNumber, Dictionary: Dictionary });
	}

	// Exit the dialog menu when triggering a manual shock
	if (!Automatic) {
		ExtendedItemCustomExit(ActionTag);
	}
}

/**
 * A set of group names whose auto-punishment has successfully been handled by {@link PropertyAutoPunishDetectSpeech}.
 * If a group name is absent from the set then it's eligible for action-based punishment triggers.
 * The initial set is populated by {@link AssetLoadAll} after all asset groups are defined.
 * @type {Set<AssetGroupName>}
 */
let PropertyAutoPunishHandled = new Set();

/**
 * A set with the names of all activities as performed by the player.
 * Functions as a cache for {@link PropertyPunishActivityCheck} and can be automatically emptied out by the latter.
 * @type {Set<ActivityName>}
 */
let PropertyPunishActivityCache = new Set();

/**
 * A list of keywords that can trigger automatic punishment when included in `/me`- or `*`-based messages
 * @type {readonly string[]}
 */
const PropertyAutoPunishKeywords = [
	"moan",
	"whimper",
	"shout",
	"scream",
	"whine",
	"growl",
	"laugh",
	"giggle",
	"mutter",
	"stutter",
	"stammer",
	"grunt",
	"hiss",
	"screech",
	"bark",
	"mumble",
];

/**
 * Check if a given message warants automatic punishment given the provided sensitivety level
 * @param {0 | 1 | 2 | 3} Sensitivity - The auto-punishment sensitivety
 * @param {string} msg - The to-be checked message
 * @returns {boolean} Whether the passed message should trigger automatic speech-based punishment
 */
function PropertyAutoPunishParseMessage(Sensitivity, msg) {
	// Remove the OOC component(s) from the message, as those are never punishable
	const oocRanges = SpeechGetOOCRanges(msg).reverse();
	const arrayMsg = Array.from(msg);
	oocRanges.forEach(({ start, length }) => arrayMsg.splice(start, length));
	msg = arrayMsg.join("");

	// Conditions that are always punishable
	const PunishableSpeech = (
		msg.includes('!')
		|| msg.includes('！')
		|| (msg === msg.toUpperCase() && msg !== msg.toLowerCase())
	);

	// Check for sensitivity-specific conditions
	let PunishableKeywords = false;
	switch (Sensitivity) {
		case 1:
			return (
				!msg.startsWith("*")
				&& !msg.startsWith("/")
				&& (msg.replace(/[^\p{P} ~+=^$|\\<>`]+/ug, '') !== msg && PunishableSpeech)
			);
		case 2:
			return (
				!msg.startsWith("*")
				&& !msg.startsWith("/")
				&& (
					msg.length > 25
					|| (msg.replace(/[^\p{P} ~+=^$|\\<>`]+/ug, '') !== msg && PunishableSpeech)
				)
			);
		case 3:
			PunishableKeywords = PropertyAutoPunishKeywords.some((k) => msg.includes(k));
			if (PunishableKeywords && (msg.startsWith("/me") || msg.startsWith("*"))) {
				return true;
			}

			return (
				!msg.startsWith("*")
				&& !msg.startsWith("/")
				&& (msg.replace(/[^\p{P} ~+=^$|\\<>`]+/ug, '') !== msg || PunishableSpeech)
			);
		default:
			return false;
	}
}

/**
 * Check whether the last uttered message should trigger automatic punishment from the provided item
 * @param {Item} Item - The item in question
 * @param {number | null} LastMessageLen - The length of {@link ChatRoomLastMessage} prior to the last message (if applicable)
 * @returns {boolean} Whether the last message should trigger automatic speech-based punishment
 */
function PropertyAutoPunishDetectSpeech(Item, LastMessageLen=null) {
	const GroupName = Item.Asset.Group.Name;
	const GagAction = !PropertyAutoPunishHandled.has(GroupName);
	PropertyAutoPunishHandled.add(GroupName);

	// Abort the item does not have `AutoPunish` set
	if (!Item.Property || !Item.Property.AutoPunish) {
		return false;
	}

	// Gag actions at maximum `AutoPunish` values always inflate
	if (Item.Property.AutoPunish === 3 && GagAction) {
		return true;
	}

	// Abort on whispers or if no new messages have been submitted
	if (ChatRoomTargetMemberNumber >= 0 || !ChatRoomLastMessage || ChatRoomLastMessage.length === LastMessageLen) {
		return false;
	}

	const msg = ChatRoomLastMessage[ChatRoomLastMessage.length - 1];
	return PropertyAutoPunishParseMessage(Item.Property.AutoPunish, msg);
}

/**
 * Check if the player character has performed one or more of the passed activities ever since the last {@link PropertyPunishActivityNames} refresh.
 * @param {null | ActivityName | readonly ActivityName[]} name - The name(s) of the activity to check. If `null`, check if any activity at all is present
 * @param {boolean} clearCache - Whether to automatically remove `name` from the {@link PropertyPunishActivityNames} cache.
 * `name == null` implies that all entries should be removed.
 * @returns {boolean}
 */
function PropertyPunishActivityCheck(name=null, clearCache=true) {
	/** @type {boolean} */
	let punish;
	if (typeof name === "string") {
		punish = PropertyPunishActivityCache.has(name);
		if (clearCache) { PropertyPunishActivityCache.delete(name); }
	} else if (CommonIsArray(name)) {
		punish = name.some(PropertyPunishActivityCache.has);
		if (clearCache) { name.forEach(PropertyPunishActivityCache.delete); }
	} else {
		punish = PropertyPunishActivityCache.size > 0;
		if (clearCache) { PropertyPunishActivityCache.clear(); }
	}
	return punish;
}

/**
 * Merge all passed item properties into the passed output, merging (and shallow copying) arrays if necessary.
 * @param {ItemProperties} output - The to be updated properties
 * @param {readonly ItemProperties[]} args - The additional item properties to be merged into the output
 * @returns {ItemProperties} - The passed output modified inplace
 */
function PropertyUnion(output, ...args) {
	for (const property of args) {
		for (const [key, value] of Object.entries(property)) {
			switch (key) {
				case "Tint": {
					if (!Array.isArray(value)) {
						break;
					}
					const previousValue = Array.isArray(output[key]) ? [...output[key]] : [];
					output[key] = [
						...previousValue,
						.../** @type {TintDefinition[]} */ (value.filter(i => !previousValue.some(j => CommonObjectEqual(i, j)))),
					];
					break;
				}
				case "HeightModifier":
				case "Difficulty": {
					output[key] = (output[key] || 0) + (value || 0);
					break;
				}
				case "TypeRecord":
					output[key] = {
						...(output[key] || {}),
						...value,
					};
					break;
				default: {
					if (Array.isArray(value)) {
						const previousValue = Array.isArray(output[key]) ? [...output[key]] : [];
						output[key] = [
							...previousValue,
							...value.filter(i => !previousValue.includes(i)),
						];
					} else {
						output[key] = value;
					}
				}
			}
		}
	}
	return output;
}

/**
 * Remove all passed item properties from the passed output, removing (and shallow copying) array entries if necessary.
 * @param {ItemProperties} output - The to-be updated properties
 * @param {readonly ItemProperties[]} args - The additional item properties to be removed from the output
 * @returns {ItemProperties} - The passed output modified inplace
 */
function PropertyDifference(output, ...args) {
	for (const property of args) {
		for (const [key, value] of Object.entries(property)) {
			switch (key) {
				case "Tint": {
					if (!Array.isArray(value)) {
						break;
					}
					const previousValue = Array.isArray(output[key]) ? output[key] : [];
					output[key] = previousValue.filter(i => !value.some(j => CommonObjectEqual(i, j)));
					break;
				}
				case "HeightModifier":
				case "Difficulty": {
					output[key] = (output[key] || 0) - (value || 0);
					break;
				}
				case "TypeRecord":
					output[key] = CommonOmit(output[key] || {}, Object.keys(value));
					break;
				default: {
					if (Array.isArray(value)) {
						const previousValue = Array.isArray(output[key]) ? output[key] : [];
						output[key] = previousValue.filter(i => !value.includes(i));
						if (output[key].length > 0) {
							break;
						}
					}
					delete output[key];
				}
			}
		}
	}
	return output;
}

/**
 * Convert the passed type record into a list of stringified key/value pairs.
 * @param {TypeRecord} typeRecord
 * @returns {string[]}
 */
function PropertyTypeRecordToStrings(typeRecord) {
	return Object.entries(typeRecord).map(([i, j]) => `${i}${j}`);
}

/**
 * @namespace
 * Namespace with helper functions for managing {@link ItemProperties["DrawingLeft"]}/{@link ItemProperties["DrawignTop"]} data.
 */
var PropertyLayerOrigin = {
	/**
	 * Resolve the `Left/Top` data for the specified item, including any {@link ItemProperties}-based corrections.
	 * @param {Item} item
	 * @param {"DrawingTop" | "DrawingLeft"} fieldName
	 * @returns {Partial<Record<LayerName, Mutable<TopLeft.Data>>>}
	 */
	resolveItem: function resolveItem(item, fieldName) {
		return Object.fromEntries(item.Asset.Layer.map(l => [l.Name ?? "", PropertyLayerOrigin.resolveLayer(l, fieldName, item.Property)]));
	},

	/**
	 * Resolve the `Left/Top` data for the specified layer, including any {@link ItemProperties}-based corrections.
	 * @param {AssetLayer} layer
	 * @param {"DrawingTop" | "DrawingLeft"} fieldName
	 * @param {null | ItemProperties} properties
	 * @returns {Mutable<TopLeft.Data>}
	 */
	resolveLayer: function resolveLayer(layer, fieldName, properties=null) {
		const layerName = layer.Name ?? "";
		/** @type {Mutable<TopLeft.Data>} */
		const ret = { ...layer[fieldName] };

		const extendedData = properties?.[fieldName];
		const extendedOverride = extendedData?.[AssetOverride];
		if (extendedData) {
			if (extendedData[layerName]) {
				Object.assign(ret, extendedData[layerName]);
			} else if (extendedOverride) {
				CommonKeys(ret).forEach((poseName) => ret[poseName] += (extendedOverride[poseName] ?? 0));
			}
		}
		return ret;
	},

	/**
	 * Get the item's original `Left/Top` data as determined by its layer- and extended item data; any user-made alterations are removed.
	 * @param {Item} item
	 * @param {"DrawingTop" | "DrawingLeft"} fieldName
	 * @returns {Partial<Record<LayerName, Mutable<TopLeft.Data>>>}
	 */
	getOriginal: function getOriginal(item, fieldName) {
		if (item.Asset.Extended && item.Property.TypeRecord) {
			/** @type {Item} */
			const itemOriginal = { Asset: item.Asset, Property: {} };
			ExtendedItemSetOptionByRecord(Player, itemOriginal, { ...item.Property.TypeRecord }, { refresh: false });
			return PropertyLayerOrigin.resolveItem(itemOriginal, fieldName);
		} else {
			return PropertyLayerOrigin.resolveItem(item, fieldName);
		}
	},
};

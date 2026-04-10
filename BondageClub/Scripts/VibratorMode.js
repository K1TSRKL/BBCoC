// @ts-strict-ignore
"use strict";

/**
 * An enum for the possible vibrator modes
 * @readonly
 * @type {{OFF: "Off", LOW: "Low", MEDIUM: "Medium", HIGH: "High", MAXIMUM: "Maximum", RANDOM: "Random", ESCALATE: "Escalate", TEASE: "Tease", DENY: "Deny", EDGE: "Edge"}}
 */
var VibratorMode = {
	OFF: "Off",
	LOW: "Low",
	MEDIUM: "Medium",
	HIGH: "High",
	MAXIMUM: "Maximum",
	RANDOM: "Random",
	ESCALATE: "Escalate",
	TEASE: "Tease",
	DENY: "Deny",
	EDGE: "Edge",
};

/**
 * An enum for the possible vibrator states when a vibrator is in a state machine mode
 * @type {{DEFAULT: "Default", DENY: "Deny", ORGASM: "Orgasm", REST: "Rest"}}
 */
var VibratorModeState = {
	DEFAULT: "Default",
	DENY: "Deny",
	ORGASM: "Orgasm",
	REST: "Rest",
};

/**
 * An enum for the vibrator configuration sets that a vibrator can have
 * @type {{STANDARD: "Standard", ADVANCED: "Advanced"}}
 */
var VibratorModeSet = {
	STANDARD: "Standard",
	ADVANCED: "Advanced",
};

/**
 * A record of the various available vibrator sets of vibrator modes
 * @type {{
 *     Standard: VibratingItemOptionConfig[],
 *     Advanced: VibratingItemOptionConfig[],
 * }}
 * @constant
 */
var VibratorModeOptions = {
	[VibratorModeSet.STANDARD]: [
		{
			Name: "Off",
			Property: {
				Mode: VibratorMode.OFF,
				Intensity: -1,
				Effect: ["Egged"]
			},
		},
		{
			Name: "Low",
			Property: {
				Mode: VibratorMode.LOW,
				Intensity: 0,
				Effect: ["Egged", "Vibrating"],
			},
		},
		{
			Name: "Medium",
			Property: {
				Mode: VibratorMode.MEDIUM,
				Intensity: 1,
				Effect: ["Egged", "Vibrating"],
			},
		},
		{
			Name: "High",
			Property: {
				Mode: VibratorMode.HIGH,
				Intensity: 2,
				Effect: ["Egged", "Vibrating"],
			},
		},
		{
			Name: "Maximum",
			Property: {
				Mode: VibratorMode.MAXIMUM,
				Intensity: 3,
				Effect: ["Egged", "Vibrating"],
			},
		},
	],
	[VibratorModeSet.ADVANCED]: [
		{
			Name: "Random",
			Property: {
				Mode: VibratorMode.RANDOM,
				Intensity: 0,
				Effect: ["Egged"],
			},
		},
		{
			Name: "Escalate",
			Property: {
				Mode: VibratorMode.ESCALATE,
				Intensity: 0,
				Effect: ["Egged", "Vibrating"],
			},
		},
		{
			Name: "Tease",
			Property: {
				Mode: VibratorMode.TEASE,
				Intensity: 0,
				Effect: ["Egged"],
			},
		},
		{
			Name: "Deny",
			Property: {
				Mode: VibratorMode.DENY,
				Intensity: 0,
				Effect: ["Egged", "Edged"],
			},
		},
		{
			Name: "Edge",
			Property: {
				Mode: VibratorMode.EDGE,
				Intensity: 0,
				Effect: ["Egged", "Vibrating", "Edged"],
			},
		},
	],
};

/**
 * An alias for the vibrators OFF mode. See {@link VibratorModeOptions}.
 */
const VibratorModeOff = VibratorModeOptions[VibratorModeSet.STANDARD][0];

/** A list with all advanced vibrator mode-names. */
const VibratorModesAdvanced = VibratorModeOptions[VibratorModeSet.ADVANCED].map(o => o.Property.Mode);

/**
 * A lookup for the vibrator configurations for each registered vibrator item
 * @const
 * @type {Record<string, VibratingItemData>}
 */
const VibratorModeDataLookup = {};

/**
 * Registers a vibrator item. This automatically creates the item's load, draw, click and scriptDraw functions.
 * @param {Asset} asset - The asset being registered
 * @param {VibratingItemConfig} config - The item's vibrator item configuration
 * @param {null | ExtendedItemOption} parentOption - The extended item option of the super screen that this archetype was initialized from (if any)
 * @returns {VibratingItemData} - The generated extended item data for the asset
 */
function VibratorModeRegister(asset, config, parentOption=null) {
	const data = VibratorModeCreateData(asset, config, parentOption);

	/** @type {ExtendedItemCallbackStruct<VibratingItemOption>} */
	const defaultCallbacks = {
		load: () => ExtendedItemLoad(data),
		click: () => TypedItemClick(data),
		draw: () => TypedItemDraw(data),
		validate: (...args) => VibratorModeValidate(data, ...args),
		publishAction: (...args) => VibratorModePublishAction(data, ...args),
		init: (...args) => VibratorModeInit(data, ...args),
		scriptDraw: (...args) => VibratorModeScriptDraw(data, ...args),
		setOption: (...args) => ExtendedItemSetOption(data, ...args),
	};
	ExtendedItemCreateCallbacks(data, defaultCallbacks);
	VibratorModeSetAssetProperties(data);
	return data;
}

/**
 * Sets an extended item's type and properties to the option provided.
 * @param {VibratingItemData} data - The extended item data
 * @param {Character} C - The character on whom the item is equipped
 * @param {Item} item - The item whose type to set
 * @param {VibratingItemOption} newOption - The to-be applied extended item option
 * @param {VibratingItemOption} previousOption - The previously applied extended item option
 * @param {boolean} [push] - Whether or not appearance updates should be persisted (only applies if the character is the
 * player) - defaults to false.
 */
function VibratorModeSetOption(data, C, item, newOption, previousOption, push=false) {
	ExtendedItemSetOption(data, C, item, newOption, previousOption, false);
	switch (newOption.Name) {
		case "Random":
			item.Property.Intensity = CommonRandomItemFromList(null, [-1, 0, 1, 2, 3]);
			item.Property.Effect = CommonArrayConcatDedupe(
				item.Property.Effect,
				item.Property.Intensity >= 0 ? ["Egged", "Vibrating"] : ["Egged"],
			);
			break;
		case "Tease":
		case "Deny":
			item.Property.Intensity = CommonRandomItemFromList(null, [0, 1, 2, 3]);
			item.Property.Effect = CommonArrayConcatDedupe(item.Property.Effect, ["Vibrating"]);
			break;
		case "Edge":
			item.Property.Intensity = CommonRandomItemFromList(null, [0, 1]);
			break;
	}
	CharacterRefresh(C, push, false);
}

/**
 * Parse the passed typed item draw data as passed via the extended item config
 * @param {readonly VibratorModeSet[]} modeSet - The vibrator mode sets for the item
 * @param {ExtendedItemConfigDrawData<{ drawImage?: false }> | undefined} drawData - The to-be parsed draw data
 * @param {number} y - The y-coordinate at which to start drawing the controls
 * @return {ExtendedItemDrawData<ElementMetaData.Vibrating>} - The parsed draw data
 */
function VibratorModeGetDrawData(modeSet, drawData, y=450) {
	/** @type {ElementData<ElementMetaData.Vibrating>[]} */
	const elementData = [];
	modeSet.forEach((modeName) => {
		const options = VibratorModeOptions[modeName];
		options.forEach((_, i) => {
			const x = 1135 + (i % 3) * 250;
			if (i % 3 === 0) {
				y += 80;
			}
			elementData.push({
				position: [x, y, 225, 50],
				drawImage: false,
				hidden: false,
				imagePath: null,
			});
		});
		y += 40;
	});
	return ExtendedItemGetDrawData(drawData, { elementData, itemsPerPage: elementData.length });
}

/**
 * Generates an asset's vibrating item data
 * @param {Asset} asset - The asset to generate vibrating item data for
 * @param {VibratingItemConfig} config - The item's extended item configuration
 * @param {null | ExtendedItemOption} parentOption - The parent extended item option of the super screens (if any)
 * @returns {VibratingItemData} - The generated vibrating item data for the asset
 */
function VibratorModeCreateData(
	asset,
	{
		Options,
		ScriptHooks,
		BaselineProperty,
		Dictionary,
		DialogPrefix,
		DrawData,
		ChatTags,
		AllowEffect,
		Name,
	},
	parentOption=null,
) {
	const modeSet = Array.isArray(Options) ? Options : Object.values(VibratorModeSet);
	const name = Name != null ? Name : (parentOption == null ? ExtendedArchetype.VIBRATING : parentOption.Name);
	const key = `${asset.Group.Name}${asset.Name}${parentOption == null ? "" : name}`;
	DialogPrefix = DialogPrefix || {};

	const data = VibratorModeDataLookup[key] = {
		archetype: ExtendedArchetype.VIBRATING,
		key,
		asset,
		parentOption,
		name,
		options: null, // Initialized further down below
		modeSet: modeSet,
		functionPrefix: `Inventory${key}`,
		dynamicAssetsFunctionPrefix: `Assets${asset.Group.Name}${asset.Name}`,
		scriptHooks: ExtendedItemParseScriptHooks(ScriptHooks || {}),
		dialogPrefix: {
			header: DialogPrefix.Header || VibratorModeDialogPrefix,
			chat: DialogPrefix.Chat || "VibeModeAction",
			option: DialogPrefix.Option || "VibeMode",
		},
		chatSetting: "default",
		baselineProperty: CommonIsObject(BaselineProperty) ? BaselineProperty : null,
		dictionary: Array.isArray(Dictionary) ? Dictionary : [],
		chatTags: Array.isArray(ChatTags) ? ChatTags : [
			CommonChatTags.SOURCE_CHAR,
			CommonChatTags.DEST_CHAR,
			CommonChatTags.ASSET_NAME,
		],
		drawData: VibratorModeGetDrawData(modeSet, DrawData),
		allowEffect: Array.isArray(AllowEffect) ? AllowEffect : [],
	};
	data.options = VibratorModeGetOptions(data, modeSet);
	return data;
}

/** @type {ExtendedItemHeaderCallback<VibratingItemData>} */
function VibratorModeDialogPrefix(data, C, item) {
	return InterfaceTextGet(`Intensity${item.Property.Intensity}`);
}

/**
 * Construct all extended item options for a given list of modes.
 * @param {VibratingItemData} data - The extended item data
 * @param {readonly VibratorModeSet[]} modeSet - The vibrator mods
 * @returns {VibratingItemOption[]} - The generated vibrating item options
 */
function VibratorModeGetOptions(data, modeSet) {
	/** @type {VibratingItemOption[]} */
	const options = [];
	let i = -1;
	for (const mode of modeSet) {
		for (const _protoOption of VibratorModeOptions[mode]) {
			i += 1;
			const protoOption = ExtendedItemParseOptions(_protoOption, data.asset);
			options.push({
				...CommonOmit(protoOption, ["ArchetypeConfig"]),
				OptionType: "VibratingItemOption",
				ParentData: data,
				Property: {
					...CommonCloneDeep(protoOption.Property),
					TypeRecord: { [data.name]: i },
				},
			});
		}
	}
	return options;
}

/**
 * @param {VibratingItemData} data
 * @param {Character} C - The character on whom the item is equipped
 * @param {Item} item - The item whose options are being validated
 * @param {VibratingItemOption} newOption - The new option
 * @param {VibratingItemOption} previousOption - The previously applied option
 * @param {boolean} permitExisting - Determines whether the validation should allow the new option and previous option
 * to be identical. Defaults to `false`.
 * @returns {string|undefined} - undefined or an empty string if the validation passes. Otherwise, returns a string
 * message informing the player of the requirements that are not met.
 */
function VibratorModeValidate(data, C, item, newOption, previousOption, permitExisting=false) {
	if (
		newOption.Property
		&& VibratorModesAdvanced.includes(newOption.Property.Mode)
		&& C.ArousalSettings
		&& C.ArousalSettings.DisableAdvancedVibes
	) {
		return InterfaceTextGet("ExtendedItemNoItemPermission");
	} else {
		return ExtendedItemValidate(data, C, item, newOption, previousOption, permitExisting);
	}
}

/**
 * Publish a vibrator action and exit the dialog of applicable
 * @param {VibratingItemData} data
 * @param {Character} C - The character wearing the item
 * @param {Item} item - The item in question
 * @param {VibratingItemOption} newOption - The newly selected option
 * @param {VibratingItemOption} previousOption - The currently selected option
 */
function VibratorModePublishAction(data, C, item, newOption, previousOption) {
	const [newProperty, prevProperty, chatPrefix] = [newOption.Property, previousOption.Property, data.dialogPrefix.chat];
	const chatData = {
		C,
		previousOption,
		newOption,
		previousIndex: data.options.indexOf(previousOption),
		newIndex: data.options.indexOf(newOption),
	};
	const dictionary = ExtendedItemBuildChatMessageDictionary(chatData, data, item);

	const newIsAdvanced = VibratorModesAdvanced.includes(newOption.Name);
	const prevIsAdvanced = VibratorModesAdvanced.includes(previousOption.Name);
	let message = (typeof chatPrefix === "function") ? chatPrefix(chatData) : chatPrefix;
	if (!newIsAdvanced && !prevIsAdvanced) { // standard -> standard
		const direction = newProperty.Intensity > prevProperty.Intensity ? "Increase" : "Decrease";
		message += `${direction}To${newProperty.Intensity}`;
	} else if (newIsAdvanced) { // standard/advanced -> advanced
		message += newOption.Name;
	} else { // advanced -> standard
		message += `IncreaseTo${newProperty.Intensity}`;
	}
	ChatRoomPublishCustomAction(message, false, dictionary.build());
}

/**
 * Sets asset properties common to all vibrating items
 * @param {VibratingItemData} data - The vibrating item data for the asset
 * @returns {void} - Nothing
 */
function VibratorModeSetAssetProperties(data) {
	const asset = /** @type {Mutable<Asset>} */(data.asset);
	asset.Extended = true;
	TypedItemGenerateAllowEffect(data);
}

/**
 * @typedef {{ Mode?: VibratorMode, ChangeTime?: number, LastChange?: number }} VibratorModePersistentData
 */

/**
 * Common dynamic script draw function for vibrators. This function is called every frame. TO make use of dynamic script draw on vibrators,
 * ensure your item has a `Assets<AssetGroup><AssetName>ScriptDraw` function defined that calls this function, and that your asset
 * definition in Female3DCG.js has `DynamicScriptDraw: true` set. See the Heart Piercings for examples.
 * @param {VibratingItemData} data
 * @param {DynamicScriptCallbackData<VibratorModePersistentData>} drawData
 */
function VibratorModeScriptDraw(data, drawData) {
	var C = drawData.C;
	// Only run vibrator updates on the player and NPCs
	if (!C.IsPlayer() && C.MemberNumber !== null) return;

	var Item = drawData.Item;
	// No need to update the vibrator if it has no mode
	if (!Item.Property || !Item.Property.Mode) return;

	var PersistentData = drawData.PersistentData();
	var ModeChanged = Item.Property.Mode !== PersistentData.Mode;
	if (ModeChanged || typeof PersistentData.ChangeTime !== "number") PersistentData.ChangeTime = CommonTime() + 60000;
	if (ModeChanged || typeof PersistentData.LastChange !== "number") PersistentData.LastChange = CommonTime();
	if (ModeChanged) PersistentData.Mode = Item.Property.Mode;

	if (CommonTime() > PersistentData.ChangeTime) {
		const updateMode = VibratorModeUpdate[Item.Property.Mode];
		if (updateMode) {
			updateMode(data, C, Item, PersistentData);
		}
		PersistentData.Mode = Item.Property.Mode;
	}
}

/**
 * Vibrator update function for vibrator state machine modes
 * @param {VibratingItemData} data - The vibrating item data
 * @param {Character} C - The character that the item is equipped on
 * @param {Item} item - The item that is being updated
 * @param {VibratorModePersistentData} persistentData - Persistent animation data for the item
 * @param {readonly VibratorModeState[]} transitionsFromDefault - The possible vibrator states that may be transitioned to from
 * the default state
 * @returns {void} - Nothing
 */
function VibratorModeUpdateStateBased(data, C, item, persistentData, transitionsFromDefault) {
	var Arousal = C.ArousalSettings.Progress;
	var TimeSinceLastChange = CommonTime() - persistentData.LastChange;
	var OldState = item.Property.State || VibratorModeState.DEFAULT;
	var OldIntensity = item.Property.Intensity;

	const NewStateAndIntensity = VibratorModeStateUpdate[OldState](
		C,
		Arousal,
		TimeSinceLastChange,
		OldIntensity,
		transitionsFromDefault,
	);

	var State = NewStateAndIntensity.State;
	var Intensity = NewStateAndIntensity.Intensity;

	if (!State) State = VibratorModeState.DEFAULT;
	if (typeof Intensity !== "number" || Intensity < -1 || Intensity > 3) Intensity = OldIntensity;

	/** @type {EffectName[]} */
	var Effect = ["Egged"];
	if (State === VibratorModeState.DENY || item.Property.Mode === VibratorMode.DENY) Effect.push("Edged");
	if (Intensity !== -1) Effect.push("Vibrating");

	const option = data.options.find(o => o.Name === persistentData.Mode) || VibratorModeOff;
	ExtendedItemSetProperty(C, item, option.Property, { Mode: persistentData.Mode, TypeRecord: { ...option.Property.TypeRecord }, State, Intensity, Effect }, false);

	Object.assign(persistentData, {
		ChangeTime: CommonTime() + 5000,
		LastChange: Intensity !== OldIntensity ? CommonTime() : persistentData.LastChange,
	});

	VibratorModePublish(data, C, item, OldIntensity, Intensity);
}

/**
 * Namespace with helper functions for {@link VibratorModeScriptDraw}
 * @type {Partial<Record<VibratorMode, (data: VibratingItemData, C: Character, item: Item, persistentData: VibratorModePersistentData) => void>>}
 * @namespace
 */
const VibratorModeUpdate = {
	/**
	 * Vibrator update function for the Random mode
	 * @param {VibratingItemData} data - The vibrating item data
	 * @param {Character} C - The character that the item is equipped on
	 * @param {Item} item - The item that is being updated
	 * @param {VibratorModePersistentData} persistentData - Persistent animation data for the item
	 * @returns {void} - Nothing
	 */
	Random: function (data, C, item, persistentData) {
		const oldIntensity = item.Property.Intensity;
		/** @type {VibratorIntensity} */
		const newIntensity = CommonRandomItemFromList(oldIntensity, [-1, 0, 1, 2, 3]);
		/** @type {EffectName[]} */
		const effect = newIntensity === -1 ? ["Egged"] : ["Egged", "Vibrating"];
		const option = data.options.find(o => o.Name === persistentData.Mode) || VibratorModeOff;
		ExtendedItemSetProperty(
			C, item, option.Property,
			{
				Mode: persistentData.Mode,
				TypeRecord: { ...option.Property.TypeRecord },
				Intensity: newIntensity,
				Effect: effect,
			},
		);

		// Next update in 1-3 minutes
		const oneMinute = 60000;
		persistentData.ChangeTime = Math.floor(CommonTime() + oneMinute + Math.random() * 2 * oneMinute);
		VibratorModePublish(data, C, item, oldIntensity, newIntensity);
	},

	/**
	 * Vibrator update function for the Escalate mode
	 * @param {VibratingItemData} data - The vibrating item data
	 * @param {Character} C - The character that the item is equipped on
	 * @param {Item} item - The item that is being updated
	 * @param {VibratorModePersistentData} persistentData - Persistent animation data for the item
	 * @returns {void} - Nothing
	 */
	Escalate: function (data, C, item, persistentData) {
		const oldIntensity = item.Property.Intensity;
		const newIntensity = /** @type {VibratorIntensity} */((oldIntensity + 1) % 4);
		const option = data.options.find(o => o.Name === persistentData.Mode) || VibratorModeOff;
		ExtendedItemSetProperty(
			C, item, option.Property,
			{
				Mode: persistentData.Mode,
				TypeRecord: { ...option.Property.TypeRecord },
				Intensity: newIntensity,
				Effect: ["Egged", "Vibrating"]
			},
		);

		// As intensity increases, time between updates decreases
		const timeFactor = Math.pow((5 - newIntensity), 1.8);
		const timeToNextUpdate = (8000 + Math.random() * 4000) * timeFactor;
		persistentData.ChangeTime = Math.floor(CommonTime() + timeToNextUpdate);
		VibratorModePublish(data, C, item, oldIntensity, newIntensity);
	},

	/**
	 * Vibrator update function for the Tease mode
	 * @param {VibratingItemData} data - The vibrating item data
	 * @param {Character} C - The character that the item is equipped on
	 * @param {Item} item - The item that is being updated
	 * @param {VibratorModePersistentData} persistentData - Persistent animation data for the item
	 * @returns {void} - Nothing
	 */
	Tease: function (data, C, item, persistentData) {
		// Tease mode allows orgasm and denial states once arousal gets high enough
		VibratorModeUpdateStateBased(data, C, item, persistentData, [VibratorModeState.DENY, VibratorModeState.ORGASM]);
	},

	/**
	 * Vibrator update function for the Deny mode
	 * @param {VibratingItemData} data - The vibrating item data
	 * @param {Character} C - The character that the item is equipped on
	 * @param {Item} item - The item that is being updated
	 * @param {VibratorModePersistentData} persistentData - Persistent animation data for the item
	 * @returns {void} - Nothing
	 */
	Deny: function (data, C, item, persistentData) {
		VibratorModeUpdateStateBased(data, C, item, persistentData, [VibratorModeState.DENY]);
	},

	/**
	 * Vibrator update function for the Edge mode
	 * @param {VibratingItemData} data - The vibrating item data
	 * @param {Character} C - The character that the item is equipped on
	 * @param {Item} item - The item that is being updated
	 * @param {VibratorModePersistentData} persistentData - Persistent animation data for the item
	 * @returns {void} - Nothing
	 */
	Edge: function (data, C, item, persistentData) {
		const oldIntensity = item.Property.Intensity;
		const newIntensity = /** @type {VibratorIntensity} */(Math.min(item.Property.Intensity + 1, 3));
		const option = data.options.find(o => o.Name === persistentData.Mode) || VibratorModeOff;
		ExtendedItemSetProperty(
			C, item, option.Property,
			{
				Mode: persistentData.Mode,
				TypeRecord: { ...option.Property.TypeRecord },
				Intensity: newIntensity,
				Effect: ["Egged", "Vibrating", "Edged"],
			},
		);

		if (newIntensity === 3) {
			// If we've hit max intensity, no more changes needed
			persistentData.ChangeTime = Infinity;
		} else {
			const oneMinute = 60000;
			// Next update 1-2 minutes from now
			persistentData.ChangeTime = Math.floor(CommonTime() + oneMinute + Math.random() * oneMinute);
		}
		VibratorModePublish(data, C, item, oldIntensity, newIntensity);
	},
};

/**
 * Namespace with helper functions for {@link VibratorModeUpdateStateBased}
 * @namespace
 */
const VibratorModeStateUpdate = {
	/**
	 * Vibrator update function for vibrator state machine modes in the Default state
	 * @param {Character} C - The character that the item is equipped on
	 * @param {number} arousal - The current arousal of the character
	 * @param {number} timeSinceLastChange - The time in milliseconds since the vibrator intensity was last changed
	 * @param {VibratorIntensity} oldIntensity - The current intensity of the vibrating item
	 * @param {readonly VibratorModeState[]} transitionsFromDefault - The possible vibrator states that may be transitioned to from
	 * the default state
	 * @returns {StateAndIntensity} - The updated state and intensity of the vibrator
	 */
	Default: function (C, arousal, timeSinceLastChange, oldIntensity, transitionsFromDefault) {
		const oneMinute = 60000;
		/** @type {VibratorModeState} */
		let state = VibratorModeState.DEFAULT;
		let newIntensity = oldIntensity;

		// If arousal is high, decide whether to deny or orgasm, based on provided transitions
		if (arousal > 90) state = CommonRandomItemFromList(VibratorModeState.DEFAULT, transitionsFromDefault);
		// If it's been at least a minute since the last intensity change, there's a small chance to change intensity
		if (timeSinceLastChange > oneMinute && Math.random() < 0.1) newIntensity = CommonRandomItemFromList(oldIntensity, [0, 1, 2, 3]);
		return { State: state, Intensity: newIntensity };
	},

	/**
	 * Vibrator update function for vibrator state machine modes in the Deny state
	 * @param {Character} C - The character that the item is equipped on
	 * @param {number} arousal - The current arousal of the character
	 * @param {number} timeSinceLastChange - The time in milliseconds since the vibrator intensity was last changed
	 * @param {VibratorIntensity} oldIntensity - The current intensity of the vibrating item
	 * the default state
	 * @returns {StateAndIntensity} - The updated state and intensity of the vibrator
	 */
	Deny: function (C, arousal, timeSinceLastChange, oldIntensity) {
		const oneMinute = 60000;
		/** @type {VibratorModeState} */
		let state = VibratorModeState.DENY;
		let newIntensity = oldIntensity;
		if (arousal >= 95 && timeSinceLastChange > oneMinute && Math.random() < 0.2) {
			if (C.IsEdged()) {
				// In deny mode, there's a small chance to change to give a fake orgasm and then go to rest mode after a minute
				// Here we give the fake orgasm, passing a special parameter that indicates we bypass the usual restriction on Edge
				ActivityOrgasmPrepare(C, true);
			}

			// Set the vibrator to rest
			state = VibratorModeState.REST;
			newIntensity = -1;
		} else if (arousal >= 95) {
			// If arousal is too high, change intensity back down to tease
			newIntensity = 0;
		} else if (timeSinceLastChange > oneMinute && Math.random() < 0.1) {
			// Otherwise, there's a small chance to change intensity if it's been more than a minute since the last change
			newIntensity = CommonRandomItemFromList(oldIntensity, [0, 1, 2, 3]);
		}
		return { State: state, Intensity: newIntensity };
	},

	/**
	 * Vibrator update function for vibrator state machine modes in the Orgasm state
	 * @param {Character} C - The character that the item is equipped on
	 * @param {number} arousal - The current arousal of the character
	 * @param {number} timeSinceLastChange - The time in milliseconds since the vibrator intensity was last changed
	 * @param {VibratorIntensity} oldIntensity - The current intensity of the vibrating item
	 * the default state
	 * @returns {StateAndIntensity} - The updated state and intensity of the vibrator
	 */
	Orgasm: function (C, arousal, timeSinceLastChange, oldIntensity) {
		const OneMinute = 60000;
		/** @type {VibratorModeState} */
		let state = VibratorModeState.ORGASM;
		let newIntensity = oldIntensity;
		if (C.ArousalSettings.OrgasmStage > 0) {
			// If we're in orgasm mode and the player is either resisting or mid-orgasm, change back to either rest or default mode
			state = Math.random() < 0.75 ? VibratorModeState.REST : VibratorModeState.DEFAULT;
		} else if (timeSinceLastChange > OneMinute && Math.random() < 0.1) {
			// Otherwise, if it's been over a minute since the last intensity change, there's a small chance to change intensity
			newIntensity = CommonRandomItemFromList(oldIntensity, [0, 1, 2, 3]);
		}
		return { State: state, Intensity: newIntensity };
	},

	/**
	 * Vibrator update function for vibrator state machine modes in the Rest state
	 * @param {Character} C - The character that the item is equipped on
	 * @param {number} arousal - The current arousal of the character
	 * @param {number} timeSinceLastChange - The time in milliseconds since the vibrator intensity was last changed
	 * @param {VibratorIntensity} oldIntensity - The current intensity of the vibrating item
	 * the default state
	 * @returns {StateAndIntensity} - The updated state and intensity of the vibrator
	 */
	Rest: function(C, arousal, timeSinceLastChange, oldIntensity) {
		const fiveMinutes = 5 * 60000;
		const tenMinutes = 10 * 60000;
		/** @type {VibratorModeState} */
		let state = VibratorModeState.REST;
		/** @type {VibratorIntensity} */
		let newIntensity = -1;
		if (timeSinceLastChange > fiveMinutes && Math.random() < Math.pow((timeSinceLastChange - fiveMinutes) / tenMinutes, 2)) {
			// Rest between 5 and 15 minutes (probably of change gets increasingly more likely as time approaches 15 minutes)
			state = VibratorModeState.DEFAULT;
			newIntensity = CommonRandomItemFromList(oldIntensity, [0, 1, 2, 3]);
		}
		return { State: state, Intensity: newIntensity };
	},
};

/**
 * Publishes a chatroom message for an automatic change in vibrator intensity. Does nothing if the vibrator's intensity
 * did not change.
 * @param {VibratingItemData} data
 * @param {Character} C - The character that the vibrator is equipped on
 * @param {Item} item - The vibrator item
 * @param {number} oldIntensity - The previous intensity of the vibrator
 * @param {number} newIntensity - The new intensity of the vibrator
 * @returns {void} - Nothing
 */
function VibratorModePublish(data, C, item, oldIntensity, newIntensity) {
	// If the intensity hasn't changed, don't publish a chat message
	if (oldIntensity === newIntensity) return;

	const option = data.options.find(o => o.Name === item.Property.Mode) || data.options[0];
	const optionIndex = data.options.indexOf(option);
	const chatData = {
		C,
		previousOption: option,
		newOption: option,
		previousIndex: optionIndex,
		newIndex: optionIndex,
	};

	const dictionary = ExtendedItemBuildChatMessageDictionary(chatData, data, item).markAutomatic().build();
	const chatPrefix = data.dialogPrefix.chat;
	const prefix = (typeof chatPrefix === "function") ? chatPrefix(chatData) : chatPrefix;
	const direction = newIntensity > oldIntensity ? "Increase" : "Decrease";

	if (ServerPlayerIsInChatRoom()) {
		ServerSend(
			"ChatRoomChat",
			{ Content: `${prefix}${direction}To${newIntensity}`, Type: "Action", Dictionary: dictionary },
		);
		CharacterLoadEffect(C);
		ChatRoomCharacterItemUpdate(C, item.Asset.Group.Name);
		ActivityChatRoomArousalSync(C);
	}
}

/**
 * Initialize the vibrating item properties
 * @param {VibratingItemData} data
 * @param {Item} item - The item in question
 * @param {Character} C - The character that has the item equiped
 * @param {boolean} push - Whether to push to changes to the server
 * @param {boolean} refresh - Whether to refresh the character. This should generally be `true`, with custom script hooks being a potential exception.
 * @returns {boolean} Whether properties were initialized or not
 */
function VibratorModeInit(data, C, item, push=true, refresh=true) {
	return TypedItemInit(data, C, item, push, refresh, "Mode");
}

/**
 * An alias for {@link TypedItemSetOptionByName}.
 * @type {typeof TypedItemSetOptionByName}
 */
function VibratorModeSetOptionByName(...args) {
	return TypedItemSetOptionByName(...args);
}

/**
 * Return the (standard) vibrator mode one would get by incrementing/decrementing the passed mode.
 * @param {VibratorMode} mode - The current vibrator mode
 * @param {boolean} decrement - Whether the mode should be decremented rather than incremented
 * @returns {VibratorMode} The new vibrator mode
 */
function VibratorModeIntensityIncrement(mode, decrement=false) {
	const options = VibratorModeOptions[VibratorModeSet.STANDARD];
	let index = options.findIndex(o => o.Name === mode);
	index += decrement ? -1 : 1;
	const optionNew = options[index];
	if (optionNew === undefined) {
		return decrement ? VibratorMode.OFF : VibratorMode.MAXIMUM;
	} else {
		return optionNew.Name;
	}
}

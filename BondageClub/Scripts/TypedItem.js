// @ts-strict-ignore
"use strict";

/**
 * TypedItem.js
 * ------------
 * This file contains utilities related to typed extended items (items that allow switching between a selection of
 * different states). It is generally not necessary to call functions in this file directly - these are called from
 * Asset.js when an item is first registered.
 *
 * All dialogue for typed items should be added to `Dialog_Player.csv`. To implement a typed item, you need the
 * following dialogue entries (these dialogue keys can also be configured through the item's configuration if custom
 * dialogue keys are needed):
 *  * "<GroupName><AssetName>Select" - This is the text that will be displayed at the top of the extended item screen
 *    (usually a prompt for the player to select a type)
 *  * For each type:
 *    * "<GroupName><AssetName><TypeName>" - This is the display name for the given type
 *  * If the item's chat setting is configured to `TO_ONLY`, you will need a chatroom message for each type, which will
 *    be sent when that type is selected. It should have the format "<GroupName><AssetName>Set<TypeName>" (e.g.
 *    "ItemArmsLatexBoxtieLeotardSetPolished" - "SourceCharacter polishes the latex of DestinationCharacter leotard
 *    until it's shiny")
 *  * If the item's chat setting is configured to `FROM_TO`, you will need a chatroom message for each possible type
 *    pairing, which will be sent when the item's type changes from the first type to the second type. It should have
 *    the format "<GroupName><AssetName>Set<Type1>To<Type2>".
 */

/**
 * A lookup for the typed item configurations for each registered typed item
 * @const
 * @type {Record<string, TypedItemData>}
 * @see {@link TypedItemData}
 */
const TypedItemDataLookup = {};

/**
 * An enum encapsulating the possible chatroom message settings for typed items
 * - TO_ONLY - The item has one chatroom message per type (indicating that the type has been selected)
 * - FROM_TO - The item has a chatroom message for from/to type pairing
 * - SILENT - The item doesn't publish an action when a type is selected.
 * @type {Record<"TO_ONLY"|"FROM_TO"|"SILENT", TypedItemChatSetting>}
 */
const TypedItemChatSetting = {
	TO_ONLY: "default",
	FROM_TO: "fromTo",
	SILENT: "silent",
};

/**
 * Registers a typed extended item.
 * This automatically creates the item's archetype-specific functions (load, draw, etc.) and asset properties.
 * @param {Asset} asset - The asset being registered
 * @param {TypedItemConfig} config - The item's typed item configuration
 * @returns {TypedItemData} - The generated extended item data for the asset
 */
function TypedItemRegister(asset, config) {
	const data = TypedItemCreateTypedItemData(asset, config);

	/** @type {ExtendedItemCallbackStruct<TypedItemOption>} */
	const defaultCallbacks = {
		load: () => ExtendedItemLoad(data),
		click: () => TypedItemClick(data),
		draw: () => TypedItemDraw(data),
		validate: (...args) => ExtendedItemValidate(data, ...args),
		publishAction: (...args) => TypedItemPublishAction(data, ...args),
		init: (...args) => TypedItemInit(data, ...args),
		setOption: (...args) => ExtendedItemSetOption(data, ...args),
	};
	ExtendedItemCreateCallbacks(data, defaultCallbacks);
	ExtendedItemCreateNpcDialogFunction(data.asset, data.functionPrefix, data.dialogPrefix.npc);

	TypedItemGenerateAllowEffect(data);
	TypedItemGenerateAllowBlock(data);
	TypedItemGenerateAllowHide(data);
	TypedItemGenerateAllowTint(data);
	TypedItemGenerateAllowLockType(data);

	const mutableAsset = /** @type {Mutable<Asset>} */(asset);
	mutableAsset.Extended = true;
	return data;
}

/**
 * Parse and pre-process the passed item options.
 * @param {Asset} asset - The item options asset
 * @param {readonly TypedItemOptionConfig[]} protoOptions - The unparsed extended item options
 * @param {undefined | boolean} changeWhenLocked - See {@link TypedItemConfig.ChangeWhenLocked}
 * @param {string} screenName
 * @returns {TypedItemOption[]} The newly generated extended item options
 */
function TypedItemBuildOptions(protoOptions, asset, changeWhenLocked, screenName) {
	return protoOptions.map((_protoOption, i) => {
		const protoOption = ExtendedItemParseOptions(_protoOption, asset);

		/** @type {TypedItemOption} */
		const option = {
			...CommonOmit(protoOption, ["ArchetypeConfig"]),
			OptionType: "TypedItemOption",
			Property: {
				...ExtendedItemParseProperties(asset, protoOption.Property ?? {}),
				TypeRecord: { [screenName]: i },
			},
			ParentData: null, // Initialized later on in `TypedItemCreateTypedItemData`
		};

		if (typeof changeWhenLocked === "boolean" && typeof option.ChangeWhenLocked !== "boolean") {
			option.ChangeWhenLocked = changeWhenLocked;
		}

		if (protoOption.ArchetypeConfig) {
			option.ArchetypeData = AssetBuildExtended(asset, protoOption.ArchetypeConfig, AssetFemale3DCGExtended, option);
		}
		return option;
	});
}

/**
 * Parse the passed typed item draw data as passed via the extended item config
 * @param {Asset} asset - The asset in question
 * @param {ExtendedItemConfigDrawData<Partial<ElementMetaData.Typed>> | undefined} drawData - The to-be parsed draw data
 * @param {readonly { Name: string }[]} options - The list of extended item options
 * @param {Partial<ElementMetaData.Typed>} overrideMetaData
 * @return {ExtendedItemDrawData<ElementMetaData.Typed>} - The parsed draw data
 */
function TypedItemGetDrawData(asset, drawData, options, overrideMetaData={}) {
	let drawImage = true;
	if (typeof overrideMetaData.drawImage !== "boolean") {
		overrideMetaData = { ...overrideMetaData, drawImage: true };
	} else {
		drawImage = overrideMetaData.drawImage;
	}
	const IsCloth = asset.Group.Clothing;
	let standardPositions;
	if (IsCloth) {
		standardPositions = (drawImage ? ExtendedXYClothes : ExtendedXYClothesWithoutImages);
	} else {
		standardPositions = (drawImage ? ExtendedXY : ExtendedXYWithoutImages);
	}
	const height = overrideMetaData.drawImage ? 275 : 55;
	const itemsPerPage = Math.min(standardPositions.length - 1, options.length);
	const assetPath = AssetGetInventoryPath(asset);

	/** @type {ElementData<ElementMetaData.Typed>[]} */
	const elementData = [];
	let i = -1;
	for (let length = options.length; length > 0; length -= itemsPerPage) {
		const index = Math.min(length, itemsPerPage);
		elementData.push(...standardPositions[index].map(xy => {
			i += 1;
			/** @type {RectTuple} */
			const position = [...xy, 225, height];
			return {
				position,
				drawImage,
				hidden: false,
				imagePath: `${assetPath}/${options[i].Name}.png`,
				...overrideMetaData,
			};
		}));
	}
	return ExtendedItemGetDrawData(drawData, { elementData, itemsPerPage });
}

/**
 * Generates an asset's typed item data
 * @param {Asset} asset - The asset to generate modular item data for
 * @param {TypedItemConfig} config - The item's extended item configuration
 * @param {null | ExtendedItemOption} parentOption - The parent extended item option of the super screens (if any)
 * @returns {TypedItemData} - The generated typed item data for the asset
 */
function TypedItemCreateTypedItemData(asset, {
	Options,
	DialogPrefix,
	ChatTags,
	Dictionary,
	ChatSetting,
	DrawImages,
	ChangeWhenLocked,
	ScriptHooks,
	DrawData,
	AllowEffect,
	BaselineProperty,
	Name,
}, parentOption=null) {
	const name = Name != null ? Name : (parentOption == null ? ExtendedArchetype.TYPED : parentOption.Name);
	const key = `${asset.Group.Name}${asset.Name}`;
	const optionsParsed = TypedItemBuildOptions(Options, asset, ChangeWhenLocked, name);
	DialogPrefix = DialogPrefix || {};

	const data = TypedItemDataLookup[key] = {
		archetype: ExtendedArchetype.TYPED,
		asset,
		options: optionsParsed,
		key,
		name,
		functionPrefix: `Inventory${key}`,
		dynamicAssetsFunctionPrefix: `Assets${key}`,
		dialogPrefix: {
			header: DialogPrefix.Header || `${key}Select`,
			option: DialogPrefix.Option || key,
			chat: DialogPrefix.Chat || `${key}Set`,
			npc: DialogPrefix.Npc || key,
		},
		chatTags: Array.isArray(ChatTags) ? ChatTags : [
			CommonChatTags.SOURCE_CHAR,
			CommonChatTags.DEST_CHAR,
		],
		scriptHooks: ExtendedItemParseScriptHooks(ScriptHooks || {}),
		dictionary: Dictionary || [],
		chatSetting: ChatSetting || TypedItemChatSetting.TO_ONLY,
		baselineProperty: typeof BaselineProperty === "object" ? BaselineProperty : null,
		parentOption: null,
		drawData: TypedItemGetDrawData(asset, DrawData, optionsParsed, { drawImage: DrawImages }),
		allowEffect: Array.isArray(AllowEffect) ? AllowEffect : [],
	};
	for (const option of optionsParsed) {
		option.ParentData = data;
	}
	return data;
}

/**
 *
 * @param {TypedItemData} data
 * @param {Character} C
 * @param {Item} item
 * @param {TypedItemOption} newOption
 * @param {TypedItemOption} previousOption
 */
function TypedItemPublishAction(data, C, item, newOption, previousOption) {
	if (data.chatSetting === TypedItemChatSetting.SILENT || newOption.Name === previousOption.Name) {
		return;
	}

	/** @type {ExtendedItemChatData<TypedItemOption>} */
	const chatData = {
		C,
		previousOption,
		newOption,
		previousIndex: data.options.indexOf(previousOption),
		newIndex: data.options.indexOf(newOption),
	};

	let msg = data.dialogPrefix.chat;
	if (typeof msg === "function") {
		msg = msg(chatData);
	}

	if (data.chatSetting === TypedItemChatSetting.FROM_TO) msg += `${previousOption.Name}To`;
	msg += newOption.Name;

	const dictionary = ExtendedItemBuildChatMessageDictionary(chatData, data, item);
	ChatRoomPublishCustomAction(msg, false, dictionary.build());
}

/**
 * Generates an asset's AllowEffect property based on its typed item data.
 * @param {TypedItemData | VibratingItemData} data - The typed item's data
 * @returns {void} - Nothing
 */
function TypedItemGenerateAllowEffect({ asset, options, allowEffect }) {
	const mutableAsset = /** @type {Mutable<Asset>} */(asset);
	const effects = [
		...mutableAsset.Effect,
		...(CommonIsArray(mutableAsset.AllowEffect) ? mutableAsset.AllowEffect : []),
		...allowEffect,
	];
	options.forEach(o => effects.push(...(o.Property.Effect || [])));
	mutableAsset.AllowEffect = Array.from(new Set(effects));
}

/**
 * Generates an asset's AllowBlock property based on its typed item data.
 * @param {TypedItemData} data - The typed item's data
 * @returns {void} - Nothing
 */
function TypedItemGenerateAllowBlock({ asset, options }) {
	const mutableAsset = /** @type {Mutable<Asset>} */(asset);
	mutableAsset.AllowBlock = Array.isArray(mutableAsset.Block) ? mutableAsset.Block.slice() : [];
	for (const option of options) {
		// @ts-ignore: ignore `readonly` while still building the asset
		CommonArrayConcatDedupe(mutableAsset.AllowBlock, option.Property.Block);
	}
}

/**
 * Generates an asset's AllowHide & AllowHideItem properties based on its typed item data.
 * @param {TypedItemData} data - The typed item's data
 * @returns {void} - Nothing
 */
function TypedItemGenerateAllowHide({asset, options}) {
	const mutableAsset = /** @type {Mutable<Asset>} */(asset);
	mutableAsset.AllowHide = Array.isArray(mutableAsset.Hide) ? mutableAsset.Hide.slice() : [];
	mutableAsset.AllowHideItem = Array.isArray(mutableAsset.HideItem) ? mutableAsset.HideItem.slice() : [];
	for (const option of options) {
		// @ts-ignore: ignore `readonly` while still building the asset
		CommonArrayConcatDedupe(mutableAsset.AllowHide, option.Property.Hide);
		// @ts-ignore: ignore `readonly` while still building the asset
		CommonArrayConcatDedupe(mutableAsset.AllowHideItem, option.Property.HideItem);
	}
}

/**
 * Generates an asset's AllowTint property based on its typed item data.
 * @param {TypedItemData} data - The typed item's data
 * @returns {void} - Nothing
 */
function TypedItemGenerateAllowTint({ asset, options }) {
	const mutableAsset = /** @type {Mutable<Asset>} */(asset);
	if (mutableAsset.AllowTint) {
		return;
	}
	for (const option of options) {
		if (option.Property && Array.isArray(option.Property.Tint) && option.Property.Tint.length > 0) {
			mutableAsset.AllowTint = true;
			return;
		}
	}
}

/**
 * Generates an asset's AllowLockType property based on its typed item data.
 * @param {TypedItemData} data - The typed item's data
 * @returns {void} - Nothing
 */
function TypedItemGenerateAllowLockType({ name, asset, options }) {
	const allowLockType = asset.AllowLockType || {};
	let allowAll = true;
	allowLockType[name] = new Set();
	for (const [i, option] of CommonEnumerate(options)) {
		const allowLock = typeof option.AllowLock === "boolean" ? option.AllowLock : asset.AllowLock;
		if (allowLock) {
			allowLockType[name].add(i);
		} else {
			allowAll = false;
		}
	}
	TypedItemSetAllowLockType(asset, allowLockType, allowAll);
}

/**
 * Sets the AllowLock and AllowLockType properties on an asset based on an AllowLockType array and the total number of
 * possible types.
 * @param {Mutable<Asset>} asset - The asset to set properties on
 * @param {Record<string, Set<number>>} allowLockType - The AllowLockType record indicating which of the asset's types permit locks
 * @param {boolean} allowAll
 * @returns {void} - Nothing
 */
function TypedItemSetAllowLockType(asset, allowLockType, allowAll=false) {
	if (allowAll) {
		// If all types are allowed to lock, set AllowLock to true for quick checking
		asset.AllowLock = true;
		asset.AllowLockType = null;
	} else if (Object.values(allowLockType).every(set => set.size === 0)) {
		// If no types are allowed to lock, set AllowLock to false for quick checking
		asset.AllowLock = false;
		asset.AllowLockType = null;
	} else {
		// If it's somewhere in between, set an explicit AllowLockType array
		asset.AllowLockType = allowLockType;
	}
}

/**
 * Returns the options configuration array for a typed item
 * @param {AssetGroupName} groupName - The name of the asset group
 * @param {string} assetName - The name of the asset
 * @returns {TypedItemOption[]|null} - The options array for the item, or null if no typed item data was found
 */
function TypedItemGetOptions(groupName, assetName) {
	const data = TypedItemDataLookup[`${groupName}${assetName}`];
	return data ? data.options : null;
}

/**
 * Returns a list of typed item option names available for the given asset, or an empty array if the asset is not typed
 * @param {AssetGroupName} groupName - The name of the asset group
 * @param {string} assetName - The name of the asset
 * @returns {string[]} - The option names available for the asset, or an empty array if the asset is not typed or no
 * typed item data was found
 */
function TypedItemGetOptionNames(groupName, assetName) {
	const options = TypedItemGetOptions(groupName, assetName);
	return options ? options.map(option => option.Name) : [];
}

/**
 * Returns the named option configuration object for a typed item
 * @param {AssetGroupName} groupName - The name of the asset group
 * @param {string} assetName - The name of the asset
 * @param {string} optionName - The name of the option
 * @returns {TypedItemOption|null} - The named option configuration object, or null if none was found
 */
function TypedItemGetOption(groupName, assetName, optionName) {
	const options = TypedItemGetOptions(groupName, assetName);
	return options ? options.find(option => option.Name === optionName) : null;
}

/**
 * Validates a selected option. A typed item may provide a custom validation function. Returning a non-empty string from
 * the validation function indicates that the new option is not compatible with the character's current state (generally
 * due to prerequisites or other requirements).
 * @template {ExtendedItemOption} T
 * @param {null | ExtendedItemData<T>} data
 * @param {Character} C - The character on whom the item is equipped
 * @param {Item} item - The item whose options are being validated
 * @param {T} option - The new option
 * @param {T} previousOption - The previously applied option
 * @param {boolean} [permitExisting] - Determines whether the validation should allow the new option and previous option
 * to be identical. Defaults to false.
 * @returns {string|undefined} - undefined or an empty string if the validation passes. Otherwise, returns a string
 * message informing the player of the requirements that are not met.
 */
function TypedItemValidateOption(data, C, item, option, previousOption, permitExisting = false) {
	let PermissionFailure = false;
	switch (option.OptionType) {
		case "ModularItemOption":
		case "TypedItemOption":
		case "VibratingItemOption": {
			const optionIndex = option.Property.TypeRecord[data.name];
			PermissionFailure = optionIndex !== 0 && InventoryBlockedOrLimited(C, item, `${data.name}${optionIndex}`);
			break;
		}
		case "ExtendedItemOption":
			PermissionFailure = InventoryBlockedOrLimited(C, item, option.Name);
			break;
		case "VariableHeightOption":
		case "TextItemOption":
			break;
		default:
			console.error(`Unsupported extended item option type: ${option.OptionType}`);
			return "";
	}
	if (PermissionFailure) {
		return InterfaceTextGet("ExtendedItemNoItemPermission");
	}

	// TODO: Remove this `if` check when all extended items have been made archetypical
	if (option.OptionType !== "ExtendedItemOption") {
		const validationFunctionName = `${data ? data.functionPrefix : ''}${ExtendedItemSubscreen || ""}Validate`;
		/** @type {Parameters<ExtendedItemCallbacks.Validate<T>>} */
		const args = [C, item, option, previousOption, permitExisting];
		const validationMessage = CommonCallFunctionByName(validationFunctionName, ...args);
		if (typeof validationMessage === "string") {
			return validationMessage;
		}
	}
	return ExtendedItemValidate(data, C, item, option, previousOption, permitExisting);
}

/**
 * Sets a typed item's type and properties to the option whose name matches the provided option name parameter.
 * @param {Character} C - The character on whom the item is equipped
 * @param {Item | AssetGroupName} itemOrGroupName - The item whose type to set, or the group name for the item
 * @param {string} optionName - The name of the option to set
 * @param {boolean} [push] - Whether or not appearance updates should be persisted (only applies if the character is the
 * player) - defaults to false.
 * @param {null | Character} [C_Source] - The character setting the new item option. If `null`, assume that it is _not_ the player character.
 * @param refresh Whether to refresh the character. This should generally be `true`, with custom script hooks being a potential exception.
 * @returns {string|undefined} - undefined or an empty string if the type was set correctly. Otherwise, returns a string
 * informing the player of the requirements that are not met.
 */
function TypedItemSetOptionByName(C, itemOrGroupName, optionName, push=false, C_Source=null, refresh=true) {
	const item = typeof itemOrGroupName === "string" ? InventoryGet(C, itemOrGroupName) : itemOrGroupName;

	if (!item) return;

	const assetName = item.Asset.Name;
	const groupName = item.Asset.Group.Name;
	const warningMessage = `Cannot set option for ${groupName}:${assetName} to ${optionName}`;

	/** @type {TypedItemData | VibratingItemData} */
	let data;
	switch (item.Asset.Archetype) {
		case ExtendedArchetype.TYPED:
			data = TypedItemDataLookup[`${item.Asset.Group.Name}${item.Asset.Name}`];
			break;
		case ExtendedArchetype.VIBRATING:
			data = VibratorModeDataLookup[`${item.Asset.Group.Name}${item.Asset.Name}`];
			break;
		default: {
			const msg = `${warningMessage}: item does not use the typed or vibrating archetype`;
			console.warn(msg);
			return msg;
		}
	}

	/** @type {(TypedItemOption | VibratingItemOption)[]} */
	const options = data.options;
	const newOption = options.find(o => o.Name === optionName);
	if (!newOption) {
		const msg = `${warningMessage}: option "${optionName}" does not exist`;
		console.warn(msg);
		return msg;
	}

	ExtendedItemSetOptionByRecord(
		C, item, newOption.Property.TypeRecord, { push, refresh, C_Source },
	);
}

/**
 * Finds the currently set option on the given typed item
 * @template {TypedItemOption | VibratingItemOption} T
 * @param {ExtendedItemData<T> & { options: T[] }} data
 * @param {Item} item - The equipped item
 * @returns {T} - The option which is currently applied to the item, or the first item in the options
 * array if no type is set.
 */
function TypedItemFindPreviousOption({ name, options }, item) {
	return options[item.Property.TypeRecord[name]] || options[0];
}

/**
 * Sets a typed item's type to a random option, respecting prerequisites and option validation.
 * @param {Character} C - The character on whom the item is equipped
 * @param {Item | AssetGroupName} itemOrGroupName - The item whose type to set, or the group name for the item
 * @param {boolean} [push] - Whether or not appearance updates should be persisted (only applies if the character is the
 * player) - defaults to false.
 * @param {null | Character} [C_Source] - The character setting the new item option. If `null`, assume that it is _not_ the player character.
 * @returns {string|undefined} - undefined or an empty string if the type was set correctly. Otherwise, returns a string
 * informing the player of the requirements that are not met.
 */
function TypedItemSetRandomOption(C, itemOrGroupName, push = false, C_Source=null) {
	const item = typeof itemOrGroupName === "string" ? InventoryGet(C, itemOrGroupName) : itemOrGroupName;

	if (!item || item.Asset.Archetype !== ExtendedArchetype.TYPED) {
		console.warn("Cannot set random option: item does not exist or does not use the typed archetype");
		return;
	}

	const data = TypedItemDataLookup[`${item.Asset.Group.Name}${item.Asset.Name}`];

	// Avoid blocked & non-random options
	const availableOptions = data.options.filter(o => {
		return (
			o.Random !== false
			&& !InventoryBlockedOrLimited(C, item, `${data.name}${o.Property.TypeRecord[data.name]}`)
		);
	});
	if (availableOptions.length === 0) {
		return;
	}

	const newOption = CommonRandomItemFromList(null, availableOptions);
	const previousOption = TypedItemFindPreviousOption(data, item);
	const validationCallback = C_Source && C_Source.IsPlayer() ? ExtendedItemRequirementCheckMessage : TypedItemValidateOption;
	const requirementMessage = validationCallback(data, C, item, newOption, previousOption);
	if (requirementMessage) {
		return requirementMessage;
	} else {
		ExtendedItemSetOption(data, C, item, newOption, previousOption, push);
	}
}

/**
 * Initialize the typed item properties
 * @param {TypedItemData | VibratingItemData} Data - The item's extended item data
 * @param {Item} Item - The item in question
 * @param {Character} C - The character that has the item equiped
 * @param {boolean} Push - Whether to push to changes to the server
 * @param {boolean} Refresh - Whether to refresh the character. This should generally be `true`, with custom script hooks being a potential exception.
 * @param {"Type" | "Mode"} field
 * @returns {boolean} Whether properties were initialized or not
 */
function TypedItemInit({ options, name, baselineProperty, asset }, C, Item, Push=true, Refresh=true, field="Type") {
	if (!CommonIsObject(Item.Property)) {
		Item.Property = { TypeRecord: {} };
	} else if (!CommonIsObject(Item.Property.TypeRecord)) {
		const type = Item.Property[field];
		if (typeof type === "string") {
			Item.Property.TypeRecord = ExtendedItemTypeToRecord(asset, type);
		} else {
			Item.Property.TypeRecord = {};
		}
	}

	const optionIndex = Item.Property.TypeRecord[name];
	validateType: if (
		options[optionIndex] !== undefined
		&& !InventoryIsPermissionBlocked(C, asset.Name, asset.Group.Name, `${name}${optionIndex}`)
		&& !(C.ArousalSettings?.DisableAdvancedVibes && VibratorModesAdvanced.includes(options[optionIndex].Property.Mode))
	) {
		if (!C.IsNpc && (!C.OnlineSharedSettings || C.OnlineSharedSettings.GameVersion !== GameVersion)) {
			// We cannot reliably validate properties of people in different versions
			break validateType;
		}

		// Check if all the expected properties are present; extra properties are ignored
		const option = options[optionIndex];
		const newProps = CommonCloneDeep(option.Property);
		delete newProps.OverridePriority;
		delete newProps.DrawingTop;
		delete newProps.DrawingLeft;
		delete newProps.Opacity;
		if (CommonIncludes(VibratorModesAdvanced, option.Name)) {
			// The intensity is dynamically managed by the `SetOption` hook for advanced vibrator modes
			delete newProps.Intensity;
		}
		const baseLineProps = Object.entries(CommonCloneDeep(baselineProperty || {})).filter(([k, v]) => {
			const existingValue = Item.Property[k];
			return existingValue == null && typeof existingValue !== typeof v;
		});

		// Make sure that the `Lock` effect persists if the `Effect` array is reset
		const hasLock = Item.Property.Effect?.includes("Lock") && Item.Asset.AllowLock;
		let update = false;
		if (!CommonDeepIsSubset(newProps, Item.Property)) {
			Item.Property = Object.assign(Item.Property, newProps);
			update = true;
		}

		if (baseLineProps.length > 0) {
			baseLineProps.forEach(([k, v]) => Item.Property[k] = v);
			update = true;
		}

		if (!update) {
			return false;
		} else if (hasLock) {
			Item.Property.Effect = CommonArrayConcatDedupe(Item.Property.Effect ?? [], ["Lock"]);
		}
	} else {
		// Always pick the first option unless NPCs are involved (in which case `NPCDefault` must be respected)
		const option = C.IsNpc() ? (options.find(o => o.NPCDefault) || options[0]) : options[0];
		Item.Property = Object.assign(
			Item.Property || {},
			CommonCloneDeep(baselineProperty || {}),
			CommonCloneDeep(option.Property),
		);
	}

	if (Refresh) {
		CharacterRefresh(C, Push, false);
	}
	if (Push) {
		ChatRoomCharacterItemUpdate(C, asset.Group.Name);
	}
	return true;
}

/**
 * Draws the extended item type selection screen
 * @param {TypedItemData | VibratingItemData} data - An Array of type definitions for each allowed extended type. The first item
 *     in the array should be the default option.
 * @returns {void} Nothing
 */
function TypedItemDraw(data) {
	const { options, name, drawData, dialogPrefix } = data;
	NoArch.Draw(data);
	if (ExtendedItemSubscreen && data.parentOption == null) {
		return;
	}

	const ItemOptionsOffset = ExtendedItemGetOffset();
	const CurrentOption = options[DialogFocusItem.Property.TypeRecord[name]] || options[0];

	// Draw the possible variants and their requirements, arranged based on the number per page
	const elementData = drawData.elementData.slice(ItemOptionsOffset, ItemOptionsOffset + drawData.itemsPerPage);
	elementData.forEach((buttonData, i) => {
		i += ItemOptionsOffset;
		ExtendedItemDrawButton(options[i], CurrentOption, dialogPrefix.option, buttonData);
	});

	// Permission mode toggle
	DrawButton(
		1775, 25, 90, 90, "", "White",
		ExtendedItemPermissionMode ? "Icons/DialogNormalMode.png" : "Icons/DialogPermissionMode.png",
		InterfaceTextGet(ExtendedItemPermissionMode ? "DialogMenuNormalMode" : "DialogMenuPermissionMode"),
	);
}

/**
 * Handles clicks on the extended item type selection screen
 * @param {TypedItemData | VibratingItemData} data
 * @returns {void} Nothing
 */
function TypedItemClick(data) {
	if (
		NoArch.Click(data)
		|| (ExtendedItemSubscreen && data.parentOption == null)
	) {
		return;
	}

	// Permission toggle button
	if (MouseIn(1775, 25, 90, 90)) {
		if (ExtendedItemPermissionMode) {
			ChatRoomCharacterUpdate(Player);
			ExtendedItemRequirementCheckMessageMemo.clearCache();
		}
		ExtendedItemPermissionMode = !ExtendedItemPermissionMode;
	}

	// If the assets allows tightening / loosening
	if (ExtendedItemTighten.Click(data, DialogFocusItem, [1050, 220, 300, 65])) {
		return;
	}

	// Options
	const C = CharacterGetCurrent();
	const ItemOptionsOffset = ExtendedItemGetOffset();
	const positions = data.drawData.elementData.slice(ItemOptionsOffset, ItemOptionsOffset + data.drawData.itemsPerPage);
	positions.forEach(({ position, hidden }, i) => {
		i += ItemOptionsOffset;
		const Option = data.options[i];
		if (!hidden && MouseIn(...position)) {
			TypedItemHandleOptionClick(data, C, Option);
		}
	});
}

/**
 * Handler function called when an option on the type selection screen is clicked
 * @template {TypedItemOption | VibratingItemOption} T
 * @param {ExtendedItemData<T> & { options: T[] }} data
 * @param {Character} C - The character wearing the item
 * @param {T} Option - The selected type definition
 * @returns {void} Nothing
 */
function TypedItemHandleOptionClick(data, C, Option) {
	if (ExtendedItemPermissionMode) {
		const IsFirst = Option.Property.TypeRecord[data.name] === 0;
		const Worn = C.IsPlayer() && DialogFocusItem.Property.TypeRecord[data.name] == Option.Property.TypeRecord[data.name];
		InventoryTogglePermission(DialogFocusItem, `${data.name}${Option.Property.TypeRecord[data.name]}`, Worn || IsFirst);
	} else {
		if (DialogFocusItem.Property.TypeRecord[data.name] === Option.Property.TypeRecord[data.name] && !Option.HasSubscreen) {
			return;
		}

		const CurrentOption = data.options[DialogFocusItem.Property.TypeRecord[data.name]] || data.options[0];
		// use the unmemoized function to ensure we make a final check to the requirements
		const RequirementMessage = ExtendedItemRequirementCheckMessage(data, C, DialogFocusItem, Option, CurrentOption);
		if (RequirementMessage) {
			DialogExtendedMessage = RequirementMessage;
		} else {
			TypedItemSetType(data, C, Option);
		}
	}
}

/**
 * Handler function for setting the type of an typed item
 * @template {TypedItemOption | VibratingItemOption} T
 * @param {ExtendedItemData<T> & { options: T[] }} data
 * @param {Character} C - The character wearing the item
 * @param {T} newOption - The selected type definition
 * @returns {void} Nothing
 */
function TypedItemSetType(data, C, newOption) {
	const FunctionPrefix = `${data.functionPrefix}${ExtendedItemSubscreen || ""}`;
	const IsCloth = DialogFocusItem.Asset.Group.Clothing;
	const previousOption = TypedItemFindPreviousOption(data, DialogFocusItem);

	const requirementMessage = ExtendedItemRequirementCheckMessage(data, C, DialogFocusItem, newOption, previousOption);
	if (requirementMessage) {
		DialogExtendedMessage = requirementMessage;
		return;
	}

	// Do not sync appearance while in the wardrobe
	/** @type {Parameters<ExtendedItemCallbacks.SetOption<TypedItemOption | VibratingItemOption>>} */
	const optionArgs = [C, DialogFocusItem, newOption, previousOption, !IsCloth, true];
	CommonCallFunctionByNameWarn(`${data.functionPrefix}SetOption`, ...optionArgs);
	if (data.archetype === ExtendedArchetype.VIBRATING) {
		if (typeof data.dialogPrefix.header === "string") {
			DialogExtendedMessage = AssetTextGet(data.dialogPrefix.header);
		} else if (typeof data.dialogPrefix.header === "function") {
			DialogExtendedMessage = data.dialogPrefix.header(data, CharacterGetCurrent(), DialogFocusItem);
		} else {
			DialogExtendedMessage = "";
		}
	}

	// For a restraint, we might publish an action, change the expression or change the dialog of a NPC
	if (!IsCloth) {
		ChatRoomCharacterUpdate(C);
		if (CurrentScreen === "ChatRoom") {
			// If we're in a chatroom, call the item's publish function to publish a message to the chatroom
			/** @type {Parameters<ExtendedItemCallbacks.PublishAction<T>>} */
			const args = [C, DialogFocusItem, newOption, previousOption];
			CommonCallFunctionByName(`${FunctionPrefix}PublishAction`, ...args);
		} else if (!C.IsPlayer()) {
			CommonCallFunctionByName(`${FunctionPrefix}NpcDialog`, C, newOption, previousOption);
		}
	}

	// If the module's option has a subscreen, transition to that screen instead of the main page of the item.
	if (newOption.HasSubscreen) {
		ExtendedItemSubscreen = newOption.Name;
		CommonCallFunctionByNameWarn(`${data.functionPrefix}${ExtendedItemSubscreen}Load`);
	}
}

// @ts-strict-ignore
"use strict";

/**
 * The name of vertical slider element
 * @const {string}
 */
const VariableHeightSliderId = "VariableHeightSlider";

/**
 * The name of the numerical percentage input element
 * @const {string}
 */
const VariableHeightNumerId = "VariableHeightNumber";

/**
 * A lookup for the variable height configurations for each registered variable height item
 * @const
 * @type {Record<string, VariableHeightData>}
 */
const VariableHeightDataLookup = {};

/**
 * Registers a variable height extended item. This automatically creates the item's load, draw and click functions.
 * @param {Asset} asset - The asset being registered
 * @param {VariableHeightConfig} config - The variable height configuration
 * @param {null | ExtendedItemOption} parentOption - The extended item option of the super screen that this archetype was initialized from (if any)
 * @returns {VariableHeightData} - The generated extended item data for the asset
 */
function VariableHeightRegister(asset, config, parentOption=null) {
	const data = VariableHeightCreateData(asset, config, parentOption);

	/** @type {ExtendedItemCallbackStruct<VariableHeightOption>} */
	const defaultCallbacks = {
		load: () => VariableHeightLoad(data),
		click: () => VariableHeightClick(data),
		draw: () => VariableHeightDraw(data),
		exit: VariableHeightExit,
		publishAction: (...args) => VariableHeightPublishAction(data, ...args),
		init: (...args) => VariableHeightInit(data, ...args),
		validate: (...args) => ExtendedItemValidate(data, ...args),
	};
	ExtendedItemCreateCallbacks(data, defaultCallbacks);

	const mutableAsset = /** @type {Mutable<Asset>} */(asset);
	mutableAsset.Extended = true;
	if (data.allowEffect.length) {
		mutableAsset.AllowEffect = Array.from(new Set([
			...mutableAsset.Effect,
			...(CommonIsArray(mutableAsset.AllowEffect) ? mutableAsset.AllowEffect : []),
			...data.allowEffect,
		]));
	}
	return data;
}

/**
 * Parse the passed variable height draw data as passed via the extended item config
 * @param {VariableHeightConfigDrawData} drawData - The to-be parsed draw data
 * @return {ExtendedItemDrawData<ElementMetaData.VariableHeight>} - The parsed draw data
 */
function VariableHeightGetDrawData(drawData) {
	const itemsPerPage = 1;
	if (!drawData) {
		throw new Error("Missing vibrating item drawData");
	} else if (drawData.elementData.length !== 1) {
		throw new Error("Vibrating item drawData.elementData length must be equal to 1");
	}
	return ExtendedItemGetDrawData(drawData, { elementData: drawData.elementData, itemsPerPage });
}

/**
 * Generates an asset's variable height data
 * @param {Asset} asset - The asset to generate modular item data for
 * @param {VariableHeightConfig} config - The variable height configuration
 * @param {null | ExtendedItemOption} parentOption - The parent extended item option of the super screens (if any)
 * @returns {VariableHeightData} - The generated variable height data for the asset
 */
function VariableHeightCreateData(asset,
	{
		MaxHeight,
		MinHeight,
		DialogPrefix,
		ChatTags,
		Dictionary,
		GetHeightFunction,
		SetHeightFunction,
		ScriptHooks,
		BaselineProperty,
		DrawData,
		AllowEffect,
		Name,
	},
	parentOption=null)
{
	const name = Name != null ? Name : (parentOption == null ? ExtendedArchetype.VARIABLEHEIGHT : parentOption.Name);
	const key = `${asset.Group.Name}${asset.Name}${parentOption == null ? "" : name}`;
	DialogPrefix = DialogPrefix || {};

	return VariableHeightDataLookup[key] = {
		archetype: ExtendedArchetype.VARIABLEHEIGHT,
		key,
		asset,
		name,
		functionPrefix: `Inventory${key}`,
		dynamicAssetsFunctionPrefix: `Assets${asset.Group.Name}${asset.Name}`,
		maxHeight: MaxHeight,
		minHeight: MinHeight,
		baselineProperty: BaselineProperty,
		dialogPrefix: {
			header: DialogPrefix.Header || "VariableHeightSelect",
			chat: DialogPrefix.Chat || `${key}Set`,
			option: DialogPrefix.Option || "VariableHeight",
		},
		chatTags: Array.isArray(ChatTags) ? ChatTags : [
			CommonChatTags.SOURCE_CHAR,
			CommonChatTags.DEST_CHAR,
			CommonChatTags.TARGET_CHAR,
			CommonChatTags.ASSET_NAME
		],
		getHeight: GetHeightFunction || VariableHeightGetOverrideHeight,
		setHeight: SetHeightFunction || VariableHeightSetOverrideHeight,
		parentOption,
		scriptHooks: ExtendedItemParseScriptHooks(ScriptHooks || {}),
		chatSetting: "default",
		dictionary: Array.isArray(Dictionary) ? Dictionary : [],
		drawData: VariableHeightGetDrawData(DrawData),
		allowEffect: Array.isArray(AllowEffect) ? AllowEffect : [],
	};
}

/**
 * @param {VariableHeightData} data - The variable height data for the asset
 */
function VariableHeightLoad(data) {
	const { maxHeight, minHeight, getHeight, setHeight, drawData } = data;
	ExtendedItemLoad(data);
	DialogFocusItem.Property.Revert = true;

	// Record the previously set properties, reverting back to them on exiting unless otherwise instructed
	const ID = PropertyGetID("OverrideHeight", DialogFocusItem);
	if (!PropertyOriginalValue.has(ID)) {
		PropertyOriginalValue.set(ID, DialogFocusItem.Property.OverrideHeight);
	}

	// Create the function to apply the user's setting changes
	/** @type {(heightValue: number, elementId: string) => void} */
	const changeHeight = function (heightValue, elementId) {
		VariableHeightChange(heightValue, maxHeight, minHeight, setHeight, elementId);
	};

	// Lock the UI if the validation fails (_e.g._ when the item is locked)
	const C = CharacterGetCurrent();
	const { newOption, previousOption } = VariableHeightConstructOptions(data, DialogFocusItem);
	const requirementMessage = ExtendedItemRequirementCheckMessage(data, C, DialogFocusItem, newOption, previousOption);
	let disabled = false;
	if (requirementMessage) {
		DialogExtendedMessage = requirementMessage;
		disabled = true;
	}

	// Create the controls and listeners
	const currentHeight = getHeight(DialogFocusItem.Property);
	const heightSlider = ElementCreateRangeInput(VariableHeightSliderId, currentHeight, 0, 1, 0.01, drawData.elementData[0].icon, true);
	if (heightSlider) {
		heightSlider.addEventListener("input", (e) => changeHeight(Number(/** @type {HTMLInputElement} */ (e.target).value), VariableHeightSliderId));
		if (disabled) {
			heightSlider.setAttribute("disabled", true);
		}
	}
	const heightNumber = ElementCreateInput(VariableHeightNumerId, "number", String(Math.round(currentHeight * 100)), "");
	if (heightNumber) {
		heightNumber.setAttribute("min", "0");
		heightNumber.setAttribute("max", "100");
		heightNumber.addEventListener("change", (e) => changeHeight(Number(/** @type {HTMLInputElement} */ (e.target).value) / 100, VariableHeightNumerId));
		if (disabled) {
			heightNumber.setAttribute("disabled", true);
		}
	}
}

/**
 * @param {VariableHeightData} data - The variable height data for the asset
 * @returns {void} - Nothing
 */
function VariableHeightDraw(data) {
	NoArch.Draw(data);

	ElementPosition(VariableHeightSliderId, ...data.drawData.elementData[0].position);

	DrawTextFit(AssetTextGet("VariableHeightPercent"), 1405, 555, 250, "white", "gray");
	ElementPosition(VariableHeightNumerId, 1640, 550, 175);

	const { newOption, previousOption } = VariableHeightConstructOptions(data, DialogFocusItem);
	ExtendedItemDrawButton(
		newOption, previousOption, data.dialogPrefix.option,
		{ position: [1387, 700, 225, 55] }, DialogFocusItem, false,
	);

	ExtendedItemTighten.Draw(data, DialogFocusItem, [1050, 220, 300, 65]);
}

/**
 * @param {VariableHeightData} data - The variable height data for the asset
 * @returns {void} - Nothing
 */
function VariableHeightClick(data) {
	NoArch.Click(data);

	// If the assets allows tightening / loosening
	if (ExtendedItemTighten.Click(data, DialogFocusItem, [1050, 220, 300, 65])) {
		return;
	}

	// Confirm button
	if (MouseIn(1387, 700, 225, 55)) {
		const C = CharacterGetCurrent();
		const { newOption, previousOption } = VariableHeightConstructOptions(data, DialogFocusItem);
		const requirementMessage = ExtendedItemRequirementCheckMessage(data, C, DialogFocusItem, newOption, previousOption);
		if (requirementMessage) {
			DialogExtendedMessage = requirementMessage;
			return;
		}

		/** @type {Parameters<ExtendedItemCallbacks.PublishAction<VariableHeightOption>>} */
		const args = [C, DialogFocusItem, newOption, previousOption];
		DialogFocusItem.Property.Revert = false;
		CommonCallFunctionByNameWarn(`${data.functionPrefix}PublishAction`, ...args);
		DialogLeaveFocusItem();
	}
}

/**
 * Apply the setting change, throttling to limit the refreshes
 * @param {number} height - The new height value for the character
 * @param {number} maxHeight - The maximum height value for the character
 * @param {number} minHeight - The minimum height value for the character
 * @param {VariableHeightSetHeightCallback} setHeight - The control that triggered the change
 * @param {string} fromElementId - The element ID
 * @returns {void} - Nothing
 */
const VariableHeightChange = CommonLimitFunction(
	/** @type {(height: number, maxHeight: number, minHeight: number, setHeight: VariableHeightSetHeightCallback, fromElementId: string) => void} */
	(height, maxHeight, minHeight, setHeight, fromElementId) => {
	// Validate the value
		if (isNaN(height) || height < 0 || height > 1 || !DialogFocusItem) return;

		// Round to the nearest 0.01
		height = Math.round(height * 100) / 100;

		// Update values on controls, except the one just changed
		if (fromElementId !== VariableHeightSliderId) {
			ElementValue(VariableHeightSliderId, height.toString());
		}
		if (fromElementId !== VariableHeightNumerId) {
			ElementValue(VariableHeightNumerId, String(Math.round(height * 100)));
		}

		// Apply the new setting
		setHeight(DialogFocusItem.Property, height, maxHeight, minHeight);

		// Reload to see the change
		const C = CharacterGetCurrent();
		CharacterRefresh(C, false, false);
	});

/**
 * Exit handler for the item's extended item screen. Updates the character and removes UI components.
 * @returns {void} - Nothing
 */
function VariableHeightExit() {
	const C = CharacterGetCurrent();
	if (DialogFocusItem.Property.Revert) {
		VariableHeightPropertyRevert(C, DialogFocusItem);
	} else {
		CharacterRefresh(C, true, false);
		ChatRoomCharacterItemUpdate(C, DialogFocusItem.Asset.Group.Name);
	}

	// Cleanup
	ElementRemove(VariableHeightSliderId);
	ElementRemove(VariableHeightNumerId);
}

/**
 * Publishes a custom action to the chat for the height change
 * @param {VariableHeightData} data
 * @param {Character} C
 * @param {Item} item
 * @param {VariableHeightOption} newOption
 * @param {VariableHeightOption} previousOption
 */
function VariableHeightPublishAction(data, C, item, newOption, previousOption) {
	const chatData = {
		C,
		previousOption,
		newOption,
		previousIndex: -1,
		newIndex: -1,
	};
	const dictionary = ExtendedItemBuildChatMessageDictionary(chatData, data, item);

	const newHeight = data.getHeight(newOption.Property) || 0;
	const prevHeight = data.getHeight(previousOption.Property) || 0;
	const suffix = prevHeight !== newHeight ? (prevHeight < newHeight ? "Raise" : "Lower") : "";
	const prefix = (typeof data.dialogPrefix.chat === "function") ? data.dialogPrefix.chat(chatData) : data.dialogPrefix.chat;
	ChatRoomPublishCustomAction(`${prefix}${suffix}`, false, dictionary.build());
}

/**
 * Retrieve the current height position override if set, accounting for inversion
 * @param {ItemProperties} property - Property of the item determining the variable height
 * @returns {number | null} - The height value between 0 and 1, null if missing or invalid
 */
function VariableHeightGetOverrideHeight(property) {
	if (property
		&& property.OverrideHeight
		&& typeof property.OverrideHeight.Height == "number"
		&& typeof property.OverrideHeight.HeightRatioProportion == "number")
	{
		const isInverted = property.SetPose && property.SetPose.includes("Suspension");
		const heightSetting = property.OverrideHeight.HeightRatioProportion;

		return isInverted ? heightSetting : 1 - heightSetting;
	}

	return null;
}

/**
 * Reposition the character vertically when upside-down, accounting for height ratio and inversion
 * @param {ItemProperties} property - Property of the item determining the variable height
 * @param {number} height - The 0 to 1 height setting to use
 * @param {number} maxHeight - The maximum number of the item's height range
 * @param {number} minHeight - The minimum number of the item's height range
 * @returns {void} - Nothing
 */
function VariableHeightSetOverrideHeight(property, height, maxHeight, minHeight) {
	if (property && property.OverrideHeight) {
		const isInverted = property.SetPose && property.SetPose.includes("Suspension");
		const heightSetting = isInverted ? height : 1 - height;

		property.OverrideHeight.HeightRatioProportion = heightSetting;
		property.OverrideHeight.Height = Math.round(maxHeight - heightSetting * (maxHeight - minHeight));
	}
}

/**
 * Initialize the variable height item properties
 * @param {VariableHeightData} Data
 * @param {Item} Item - The item in question
 * @param {Character} C - The character that has the item equiped
 * @param {boolean} Push - Whether to push to changes to the server
 * @param {boolean} Refresh - Whether to refresh the character. This should generally be `true`, with custom script hooks being a potential exception.
 * @returns {boolean} Whether properties were initialized or not
 */
function VariableHeightInit(Data, C, Item, Push, Refresh) {
	if (!CommonIsObject(Item.Property)) {
		Item.Property = {};
	}
	if (!CommonIsObject(Item.Property.OverrideHeight)) {
		// TODO: Review which assumptions `getHeight` & `setHeight` are allowed
		// to make regarding the presence/absence of properties

		// @ts-expect-error: OverrideHeight properties are initialized by `Data.setHeight`
		Item.Property.OverrideHeight = {};
	}

	let currentHeight = Data.getHeight(Item.Property);
	if (typeof currentHeight === "number") {
		return false;
	}
	if (Data.baselineProperty != null) {
		ExtendedItemInitNoArch(C, Item, Data.baselineProperty, false);
	}

	currentHeight = Data.getHeight(Item.Property);
	Data.setHeight(Item.Property, currentHeight, Data.maxHeight, Data.minHeight);

	if (Refresh) {
		CharacterRefresh(C, Push, false);
	}
	if (Push) {
		ChatRoomCharacterItemUpdate(C, Data.asset.Group.Name);
	}
	return true;
}

/**
 * Dynamically construct the next and previous extended item option for the passed item
 * @param {VariableHeightData} data - The extended item data
 * @param {Item} item - The item in question
 * @returns {{ newOption: VariableHeightOption, previousOption: VariableHeightOption }}
 */
function VariableHeightConstructOptions(data, item) {
	const ID = PropertyGetID("OverrideHeight", item);
	return {
		newOption: {
			Name: "newOption",
			OptionType: "VariableHeightOption",
			Property: { OverrideHeight: item.Property.OverrideHeight },
			ParentData: data,
		},
		previousOption: {
			Name: "previousOption",
			OptionType: "VariableHeightOption",
			Property: { OverrideHeight: PropertyOriginalValue.get(ID) },
			ParentData: data,
		},
	};
}

/**
 * Revert all item properties back to their previous state prior to opening the extended item menu
 * @param {Character} C - The character in question
 * @param {Item} item - The item in question
 */
function VariableHeightPropertyRevert(C, item) {
	const ID = PropertyGetID("OverrideHeight", item);
	item.Property.OverrideHeight = PropertyOriginalValue.get(ID);
	CharacterRefresh(C, false, false);
}

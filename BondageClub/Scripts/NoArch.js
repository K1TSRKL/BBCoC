// @ts-strict-ignore
"use strict";

/**
 * A lookup for the text item configurations for each registered text item
 * @const
 * @type {Record<string, NoArchItemData>}
 * @see {@link NoArchItemData}
 */
const NoArchItemDataLookup = {};

/**
 * Registers an extended item.
 * @param {Asset} asset - The asset being registered
 * @param {NoArchItemConfig} config - The item's extended item configuration
 * @param {null | ExtendedItemOption} parentOption - The superscreen's option (if applicable)
 * @returns {NoArchItemData} - The generated extended item data for the asset
 */
function NoArchItemRegister(asset, config, parentOption=null) {
	const data = NoArchCreateNoArchItemData(asset, config, parentOption);
	/** @type {ExtendedItemCallbackStruct<NoArchItemOption>} */
	const defaultCallbacks = {
		init: (...args) => NoArch.Init(data, ...args),
		load: (...args) => ExtendedItemLoad(data, ...args),
		draw: (...args) => NoArch.Draw(data, ...args),
		click: (...args) => NoArch.Click(data, ...args),
	};
	ExtendedItemCreateCallbacks(data, defaultCallbacks);

	const mutableAsset = /** @type {Mutable<Asset>} */(data.asset);
	if (data.allowEffect.length) {
		mutableAsset.AllowEffect = Array.from(new Set([
			...mutableAsset.Effect,
			...(CommonIsArray(mutableAsset.AllowEffect) ? mutableAsset.AllowEffect : []),
			...data.allowEffect,
		]));
	}
	mutableAsset.Extended = true;
	return data;
}

/**
 * Parse the passed text item draw data as passed via the extended item config
 * @param {NoArchConfigDrawData | undefined} drawData - The to-be parsed draw data
 * @return {ExtendedItemDrawData<ElementMetaData.NoArch>} - The parsed draw data
 */
function NoArchGetDrawData(drawData) {
	if (drawData == null) {
		drawData = {};
	}
	const elementData = drawData.elementData || [];
	const itemsPerPage = drawData.itemsPerPage == null ? elementData.length : drawData.itemsPerPage;
	return ExtendedItemGetDrawData(drawData, { elementData, itemsPerPage });
}

/**
 * Generates an asset's typed item data
 * @param {Asset} asset - The asset to generate modular item data for
 * @param {NoArchItemConfig} config - The item's extended item configuration
 * @param {null | ExtendedItemOption} parentOption - The parent extended item option of the super screens (if any)
 * @returns {NoArchItemData} - The generated typed item data for the asset
 */
function NoArchCreateNoArchItemData(asset, {
	DialogPrefix,
	ChatTags,
	Dictionary,
	ScriptHooks,
	BaselineProperty,
	DrawData,
	AllowEffect,
	Name,
}, parentOption=null) {
	DialogPrefix = DialogPrefix || {};
	const key = `${asset.Group.Name}${asset.Name}${parentOption == null ? "" : parentOption.Name}`;
	return NoArchItemDataLookup[key] = {
		archetype: ExtendedArchetype.NOARCH,
		asset,
		key,
		name: Name != null ? Name : (parentOption == null ? ExtendedArchetype.NOARCH : parentOption.Name),
		functionPrefix: `Inventory${key}`,
		dynamicAssetsFunctionPrefix: `Assets${asset.Group.Name}${asset.Name}`,
		dialogPrefix: {
			header: DialogPrefix.Header,
			option: DialogPrefix.Option,
			chat: DialogPrefix.Chat,
		},
		chatTags: Array.isArray(ChatTags) ? ChatTags : [
			CommonChatTags.SOURCE_CHAR,
			CommonChatTags.DEST_CHAR,
			CommonChatTags.ASSET_NAME,
		],
		scriptHooks: ExtendedItemParseScriptHooks(ScriptHooks || {}),
		dictionary: Dictionary || [],
		chatSetting: "default",
		baselineProperty: BaselineProperty || null,
		parentOption,
		drawData: NoArchGetDrawData(DrawData),
		allowEffect: Array.isArray(AllowEffect) ? AllowEffect : [],
	};
}

const NoArch = {
	/**
	 * @param {ExtendedItemData<any>} data
	 * @param {Character} C — The character that has the item equiped
	 * @param {Item} item — The item in question
	 * @param {boolean} push - Whether to push to changes to the server
	 * @param {boolean} refresh - Whether to refresh the character. This should generally be `true`, with custom script hooks being a potential exception.
	 * @returns {boolean} Whether properties were updated or not
	 */
	Init: function (data, C, item, push=true, refresh=true) {
		if (!CommonIsObject(item.Property)) {
			item.Property = {};
		}

		let update = false;
		const propertiesCopy = CommonCloneDeep(data.baselineProperty || {});
		for (const [name, value] of Object.entries(propertiesCopy)) {
			if (item.Property[name] === undefined) {
				update = true;
				item.Property[name] = value;
			}
		}

		if (update) {
			if (refresh) {
				CharacterRefresh(C, push, false);
			}
			if (push) {
				ChatRoomCharacterItemUpdate(C, item.Asset.Group.Name);
			}
		}
		return update;
	},
	/**
	 * @param {ExtendedItemData<any>} data
	 */
	Draw: function (data) {
		// If an option's subscreen is open, it overrides the standard screen
		if (ExtendedItemSubscreen && data.parentOption == null) {
			CommonCallFunctionByNameWarn(`${data.functionPrefix}${ExtendedItemSubscreen}Draw`);
			return;
		}

		ExtendedItemDrawHeader();
		DrawText(DialogExtendedMessage, 1500, 375, "#fff", "808080");

		if (data.drawData.paginate) {
			DrawButton(1665, 240, 90, 90, "", "White", "Icons/Prev.png");
			DrawButton(1775, 240, 90, 90, "", "White", "Icons/Next.png");
		}

		DrawButton(
			1775, 25, 90, 90, "", "Gray",
			ExtendedItemPermissionMode ? "Icons/DialogNormalMode.png" : "Icons/DialogPermissionMode.png",
			InterfaceTextGet(ExtendedItemPermissionMode ? "DialogMenuNormalMode" : "DialogMenuPermissionMode"),
			true,
		);

		const item = (data.asset.IsLock) ? DialogFocusSourceItem : DialogFocusItem;
		ExtendedItemTighten.Draw(data, item, [1050, 220, 300, 65]);
	},
	/**
	 * @param {ExtendedItemData<any>} data
	 * @returns {boolean} Whether a button was clicked or not
	 */
	Click: function (data) {
		if (ExtendedItemSubscreen && data.parentOption == null) {
			// TODO: Returning `true` here is nonsense as there's zero guarantee that a button is actually clicked,
			// but we do want other archetypes to abort at this point. Ideally all click handlers should return a boolean
			CommonCallFunctionByNameWarn(`${data.functionPrefix}${ExtendedItemSubscreen}Click`);
			return true;
		}

		const item = data.asset.IsLock ? DialogFocusSourceItem : DialogFocusItem;
		if (ExtendedItemTighten.Click(data, item, [1050, 220, 300, 65])) {
			return true;
		}

		if (MouseIn(1885, 25, 90, 90)) {
			if (ExtendedItemSubscreen) {
				CommonCallFunctionByName(`${data.functionPrefix}Exit`);
				ExtendedItemSubscreen = null;
			} else {
				DialogLeaveFocusItem();
			}
			return true;
		} else if (data.drawData.paginate) {
			const currentPage = Math.floor(ExtendedItemGetOffset() / data.drawData.itemsPerPage);
			if (MouseIn(1665, 240, 90, 90)) {
				const newPage = (currentPage + data.drawData.pageCount - 1) % data.drawData.pageCount;
				ExtendedItemSetOffset(data.drawData.itemsPerPage * newPage);
				return true;
			} else if (MouseIn(1775, 240, 90, 90)) {
				const newPage = (currentPage + data.drawData.pageCount + 1) % data.drawData.pageCount;
				ExtendedItemSetOffset(data.drawData.itemsPerPage * newPage);
				return true;
			}
		}
		return false;
	},
};

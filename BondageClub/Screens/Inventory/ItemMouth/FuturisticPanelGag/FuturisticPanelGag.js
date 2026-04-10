// @ts-strict-ignore
"use strict";

/** @type {ExtendedItemScriptHookCallbacks.Draw<ModularItemData>} */
function InventoryItemMouthFuturisticPanelGagDrawHook(Data, OriginalFunction) {
	if (!FuturisticAccessDraw(Data, OriginalFunction)) {
		return;
	}

	if (Data.currentModule === ModularItemBase) {
		const typeRecord = DialogFocusItem.Property.TypeRecord || {};
		const [Gag, AutoPunish, AutoPunishUndoTimeSetting] = Data.modules.map(m => `${m.Key}${typeRecord[m.Key] || 0}`);
		const AutoPunishUndoTime = DialogFocusItem.Property.AutoPunishUndoTime;
		const UndoTimer =  AssetTextGet(`${Data.dialogPrefix.option}${AutoPunishUndoTimeSetting}`);

		MainCanvas.textAlign = "right";
		DrawText(AssetTextGet("GagConfig"), 1500, 550, "White", "Gray");
		DrawText(AssetTextGet("AutoPunish"), 1500, 625, "White", "Gray");
		DrawText(AssetTextGet("DeflationTime"), 1500, 700, "White", "Gray");
		MainCanvas.textAlign = "left";
		DrawText(AssetTextGet(`${Data.dialogPrefix.option}${Gag}`), 1510, 550, "White", "Gray");
		DrawText(AssetTextGet(`${Data.dialogPrefix.option}${AutoPunish}`) + ` (${UndoTimer})`, 1510, 625, "White", "Gray");
		DrawText(AutoPunishUndoTime ? TimerToString(AutoPunishUndoTime - CurrentTime) : "00:00", 1510, 700, "White", "Gray");
		MainCanvas.textAlign = "center";

		ExtendedItemDrawCheckbox("ShowText", 1175, 743, DialogFocusItem.Property.ShowText);
		DrawText(AssetTextGet("ShowMessageInChat"), 1420, 773, "White", "Gray");
		ExtendedItemCustomDraw(`${Data.dialogPrefix.option}Pump`, 1637, 750);
	}
}

/** @type {ExtendedItemScriptHookCallbacks.Click<ModularItemData>} */
function InventoryItemMouthFuturisticPanelGagClickHook(Data, OriginalFunction) {
	const GagBefore = ModularItemParseCurrent(Data, DialogFocusItem.Property.TypeRecord)[0];
	if (!FuturisticAccessClick(Data, OriginalFunction) || !DialogFocusItem) {
		return;
	}
	const GagAfter = ModularItemParseCurrent(Data, DialogFocusItem.Property.TypeRecord)[0];

	// Reset the remaining deflation time if someone manually changes the gag mode
	if (GagBefore !== GagAfter) {
		DialogFocusItem.Property.AutoPunishUndoTime = 0;
	}

	if (Data.currentModule === ModularItemBase) {
		const C = CharacterGetCurrent();
		if (MouseIn(1637, 750, 225, 50)) {
			ExtendedItemCustomClick(
				`${Data.dialogPrefix.option}Pump`,
				() => InventoryItemMouthFuturisticPanelGagTrigger(Data, C, DialogFocusItem, false),
			);
		} else if (MouseIn(1175, 743, 64, 64) && !ExtendedItemPermissionMode) {
			const property = DialogFocusItem.Property;
			ExtendedItemCustomClickAndPush(C, DialogFocusItem, "ShowText", () => property.ShowText = !property.ShowText, false, false);
		}
	}
}

/** @type {ExtendedItemScriptHookCallbacks.SetOption<ModularItemData, ModularItemOption>} */
function InventoryItemMouthFuturisticPanelGagSetOptionHook(data, originalFunction, C, item, newOption, previousOption, push, refresh) {
	// NOTE: Use a `SetOption` + baseline properties rather in order to avoid triggering an `Init` validation.
	if (newOption.ModuleName !== "Gag") {
		originalFunction(C, item, newOption, previousOption, push, refresh);
		return;
	} else {
		originalFunction(C, item, newOption, previousOption, false, false);
	}

	const module = data.modules.find(m => m.Name === "Gag");
	const index = /** @type {-1 | 0 | 1 | 2 | 3} */(module.Options.findIndex(o => o.Name === newOption.Name));
	item.Property.OriginalSetting = index === -1 ? 0 : index;

	if (refresh || push) {
		CharacterRefresh(C, push, false);
	}
}

/**
 * Send message for an automatic gag inflation.
 * @param {Character} C - The selected character
 * @param {Item} Item - The item in question
 * @param {string} OptionName - The name of the newly choosen option within the `Gag` module
 * @param {boolean} Deflate - Whether the gag is deflated or not
 * @return {void} Nothing
 */
function InventoryItemMouthFuturisticPanelGagPublishActionTrigger(C, Item, OptionName, Deflate) {
	const Data = ExtendedItemGetData(Item.Asset, ExtendedArchetype.MODULAR);
	const Prefix = (Data == null) ? "" : ExtendedItemCustomChatPrefix("Pump", Data);
	const ActionTag = `${Prefix}Pump${Deflate ? "Deflate" : "Inflate"}${OptionName}`;

	const Dictionary = new DictionaryBuilder()
		.targetCharacterName(C)
		.asset(Item.Asset, "AssetName", Item.Craft && Item.Craft.Name)
		.markAutomatic()
		.build();

	if (Item.Property.ShowText) {
		ChatRoomPublishCustomAction(ActionTag, false, Dictionary);
	} else {
		ChatRoomMessage({ Content: ActionTag, Type: "Action", Sender: Player.MemberNumber, Dictionary: Dictionary });
	}
}

/**
 * Helper function for handling automatic gag inflation and deflation.
 * @param {ModularItemData} data
 * @param {Character} C - The selected character
 * @param {Item} Item - The item in question
 * @param {ModularItemOption} previousOption
 * @param {ModularItemModule} module
 * @param {boolean} Deflate - Whether this function is triggered by an automatic deflation or not
 * @returns {ModularItemOption}
 */
function InventoryItemMouthFuturisticPanelGagTriggerGetOptions(data, C, Item, previousOption, module, Deflate) {
	let GagIndex = previousOption.Index;
	const GagIndexMax = module.Options.length - 1;
	let OriginalSetting = Item.Property.OriginalSetting;
	if (module.Options[OriginalSetting] === undefined) {
		console.warn(`[${Item.Asset.Group.Name}:${Item.Asset.Name}] Sanitizing illegal "OriginalSetting" property value: ${OriginalSetting}`);
		OriginalSetting = Item.Property.OriginalSetting = 0;
	}

	/**
	 * Increment or decrement the gag level, clipping it to an appropriate interval.
	 * Also ensure that the desired gag level is not blocked and, if so,
	 * keep incrementing/decrementing until a non-blocked gag-level is reached
	 */
	if (Deflate) {
		GagIndex = Math.max(OriginalSetting, GagIndex - 1);
		while (GagIndex > OriginalSetting) {
			if (
				InventoryBlockedOrLimited(C, Item, `${module.Key}${GagIndex}`)
				|| !InventoryAllow(C, Item.Asset, module.Options[GagIndex].Prerequisite ?? [], false)
			) {
				GagIndex -= 1;
			} else {
				break;
			}
		}
	} else {
		GagIndex = Math.min(GagIndexMax, GagIndex + 1);
		while (GagIndex <= GagIndexMax) {
			if (
				InventoryBlockedOrLimited(C, Item, `${module.Key}${GagIndex}`)
				|| !InventoryAllow(C, Item.Asset, module.Options[GagIndex].Prerequisite ?? [], false)
			) {
				if (GagIndex === GagIndexMax) {
					// All higher inflation modes are blocked; just stuck with the original and abort
					GagIndex = previousOption.Index;
					break;
				} else {
					GagIndex += 1;
				}
			} else {
				break;
			}
		}
	}
	return module.Options[GagIndex];
}

/**
 * Helper function for handling automatic gag inflation and deflation.
 * @param {ModularItemData} data
 * @param {Character} C - The selected character
 * @param {Item} Item - The item in question
 * @param {boolean} Deflate - Whether this function is triggered by an automatic deflation or not
 * @return {void}
 */
function InventoryItemMouthFuturisticPanelGagTrigger(data, C, Item, Deflate) {
	const module = data.modules[0];
	const previousModuleValues = ModularItemParseCurrent(data, Item.Property.TypeRecord);
	const previousOption = module.Options[previousModuleValues[0]];
	const newOption = InventoryItemMouthFuturisticPanelGagTriggerGetOptions(data, C, Item, previousOption, module, Deflate);

	if (newOption.Name === previousOption.Name) {
		return;
	}

	// After automatically changing it, we store the original setting again
	const OriginalSetting = Item.Property.OriginalSetting;
	ExtendedItemSetOption(data, C, Item, newOption, { ...previousOption, ChangeWhenLocked: true });
	Item.Property.OriginalSetting = OriginalSetting;
	InventoryItemMouthFuturisticPanelGagPublishActionTrigger(C, Item, newOption.Name, Deflate);

	/** @type {ExpressionTrigger[]} */
	const expressions = [
		{ Group: "Eyebrows", Name: "Soft", Timer: 10 },
		{ Group: "Blush", Name: "Extreme", Timer: 15 },
		{ Group: "Eyes", Name: "Lewd", Timer: 5 },
	];
	InventoryExpressionTriggerApply(C, expressions);

	Item.Property.AutoPunishUndoTime = CurrentTime + Item.Property.AutoPunishUndoTimeSetting; // Reset the deflation time
	CharacterRefresh(C, true); // Does not sync appearance while in the wardrobe
	ChatRoomCharacterUpdate(C);
}

/**
 * @typedef {{ LastMessageLen?: number, UpdateTime?: number, ChangeTime?: number }} FuturisticPanelGagPersistentData
 */

/**
 * @param {ModularItemData} data
 * @param {DynamicScriptCallbackData<FuturisticPanelGagPersistentData>} drawData
 */
function AssetsItemMouthFuturisticPanelGagScriptUpdatePlayer(data, drawData) {
	const Item = drawData.Item;
	const LastMessages = drawData.PersistentData().LastMessageLen;

	if (PropertyAutoPunishDetectSpeech(Item, LastMessages)) {
		InventoryItemMouthFuturisticPanelGagTrigger(data, drawData.C, Item, false);
	} else if (Item.Property.AutoPunishUndoTime - CurrentTime <= 0) {
		// Deflate the gag back to the original setting after a while
		InventoryItemMouthFuturisticPanelGagTrigger(data, drawData.C, Item, true);
	}
}

/** @type {ExtendedItemScriptHookCallbacks.ScriptDraw<ModularItemData, FuturisticPanelGagPersistentData>} */
function AssetsItemMouthFuturisticPanelGagScriptDrawHook(data, originalFunction, drawData) {
	const persistentData = drawData.PersistentData();
	/** @type {ItemProperties} */
	const property = (drawData.Item.Property = drawData.Item.Property || {});
	if (typeof persistentData.UpdateTime !== "number") persistentData.UpdateTime = CommonTime() + 4000;
	if (typeof persistentData.LastMessageLen !== "number") persistentData.LastMessageLen = (ChatRoomLastMessage) ? ChatRoomLastMessage.length : 0;
	if (typeof property.BlinkState !== "boolean") property.BlinkState = false;

	if (ChatRoomLastMessage && ChatRoomLastMessage.length != persistentData.LastMessageLen && drawData.Item && drawData.Item.Property && drawData.Item.Property.AutoPunish > 0)
		persistentData.ChangeTime = Math.min(persistentData.ChangeTime, CommonTime() + 400); // Trigger shortly after if the user speaks

	if (persistentData.UpdateTime < CommonTime() && drawData.C == Player) {
		if (ServerPlayerIsInChatRoom()) {
			AssetsItemMouthFuturisticPanelGagScriptUpdatePlayer(data, drawData);
			persistentData.LastMessageLen = (ChatRoomLastMessage) ? ChatRoomLastMessage.length : 0;
		}

		property.BlinkState = !property.BlinkState;

		const timeToNextRefresh = 3025;
		persistentData.UpdateTime = CommonTime() + timeToNextRefresh;
		AnimationRequestRefreshRate(drawData.C, 5000 - timeToNextRefresh);
		AnimationRequestDraw(drawData.C);
	}
}

/** @type {ExtendedItemScriptHookCallbacks.BeforeDraw<ModularItemData, FuturisticPanelGagPersistentData>} */
function AssetsItemMouthFuturisticPanelGagBeforeDrawHook(data, originalFunction, drawData) {
	if (drawData.L === "Light" && drawData.Property && drawData.Property.AutoPunish > 0) {
		const Opacity = (drawData.Property.BlinkState) ? 1 : 0;
		if (drawData.Color && drawData.Color != "Default") {return { Opacity: Opacity };}
		else if (drawData.Property.AutoPunish == 1) {return { Color : "#28ff28", Opacity: Opacity };}
		else if (drawData.Property.AutoPunish == 2) {return { Color : "#ffff28", Opacity: Opacity };}
		else if (drawData.Property.AutoPunish == 3) {return { Color : "#ff3838", Opacity: Opacity };}
	}
	return drawData;
}

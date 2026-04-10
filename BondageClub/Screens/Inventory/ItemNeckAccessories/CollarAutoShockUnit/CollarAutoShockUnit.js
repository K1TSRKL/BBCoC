// @ts-strict-ignore
"use strict";

/** @type {ExtendedItemScriptHookCallbacks.Draw<ModularItemData>} */
function InventoryItemNeckAccessoriesCollarAutoShockUnitDrawHook(Data, OriginalFunction) {
	OriginalFunction();
	if (Data.currentModule === ModularItemBase) {
		const typeRecord = DialogFocusItem.Property.TypeRecord || {};
		const [ShockLevel, AutoPunish] = Data.modules.map(m => `${m.Key}${typeRecord[m.Key] || 0}`);

		// Display option information
		MainCanvas.textAlign = "right";
		DrawText(AssetTextGet("ShockLevel"), 1500, 550, "White", "Gray");
		DrawText(AssetTextGet("AutoPunish"), 1500, 625, "White", "Gray");
		DrawText(AssetTextGet("ShockCount"), 1500, 700, "White", "Gray");
		MainCanvas.textAlign = "left";
		DrawText(AssetTextGet(`${Data.dialogPrefix.option}${ShockLevel}`), 1510, 550, "White", "Gray");
		DrawText(AssetTextGet(`${Data.dialogPrefix.option}${AutoPunish}`), 1510, 625, "White", "Gray");
		DrawText(`${DialogFocusItem.Property.TriggerCount}`, 1510, 700, "White", "Gray");
		MainCanvas.textAlign = "center";

		// Display the ShowText checkbox and reset/trigger buttons
		ExtendedItemDrawCheckbox("ShowText", 1175, 743, DialogFocusItem.Property.ShowText);
		DrawText(AssetTextGet("ShowMessageInChat"), 1420, 773, "White", "Gray");
		ExtendedItemCustomDraw("ResetShockCount", 1635, 675);
		ExtendedItemCustomDraw("TriggerShock", 1635, 750);
	}
}

/** @type {ExtendedItemScriptHookCallbacks.Click<ModularItemData>} */
function InventoryItemNeckAccessoriesCollarAutoShockUnitClickHook(Data, OriginalFunction) {
	OriginalFunction();
	if (DialogFocusItem && Data.currentModule === ModularItemBase) {
		if (MouseIn(1175, 768, 64, 64) && !ExtendedItemPermissionMode) {
			const C = CharacterGetCurrent();
			const property = DialogFocusItem.Property;
			ExtendedItemCustomClickAndPush(C, DialogFocusItem, "ShowText", () => property.ShowText = !property.ShowText);
		} else if (MouseIn(1635, 700, 225, 55)) {
			ExtendedItemCustomClick("ResetShockCount", InventoryItemNeckAccessoriesCollarShockUnitResetCount);
		} else if (MouseIn(1635, 775, 225, 55)) {
			ExtendedItemCustomClick("TriggerShock", PropertyShockPublishAction);
		}
	}
}

/**
 * @typedef {{ ChangeTime?: number, LastMessageLen?: number }} AutoShockUnitPersistentData
 */

/** @type {ExtendedItemScriptHookCallbacks.BeforeDraw<ExtendedItemData, AutoShockUnitPersistentData>} */
function AssetsItemNeckAccessoriesCollarAutoShockUnitBeforeDrawHook(data, originalFunction, drawData) {
	if (drawData.L === "Light") {
		const property = drawData.Property || {};
		return { Color: "#2f0", Opacity: property.BlinkState ? 0 : 1 };
	}
}

/** @type {ExtendedItemScriptHookCallbacks.ScriptDraw<ExtendedItemData, AutoShockUnitPersistentData>} */
function AssetsItemNeckAccessoriesCollarAutoShockUnitScriptDrawHook(data, originalFunction, drawData) {
	const persistentData = drawData.PersistentData();
	/** @type {ItemProperties} */
	const property = (drawData.Item.Property = drawData.Item.Property || {});
	if (typeof persistentData.ChangeTime !== "number") persistentData.ChangeTime = CommonTime() + 4000;
	if (typeof persistentData.LastMessageLen !== "number") persistentData.LastMessageLen = (ChatRoomLastMessage) ? ChatRoomLastMessage.length : 0;

	if (ChatRoomLastMessage && ChatRoomLastMessage.length != persistentData.LastMessageLen && drawData.Item && drawData.Item.Property && drawData.Item.Property.AutoPunish > 0)
		persistentData.ChangeTime = Math.min(persistentData.ChangeTime, CommonTime()); // Trigger immediately if the user speaks

	if (persistentData.ChangeTime < CommonTime()) {
		const wasBlinking = property.BlinkState;
		property.BlinkState = !wasBlinking;
		const timeToNextRefresh = wasBlinking ? 4000 : 1000;

		if (ServerPlayerIsInChatRoom() && drawData.C == Player) {
			if (PropertyAutoPunishDetectSpeech(drawData.Item, persistentData.LastMessageLen)) {
				PropertyShockPublishAction(drawData.C, drawData.Item, true);
			}
			persistentData.LastMessageLen = (ChatRoomLastMessage) ? ChatRoomLastMessage.length : 0;
		}

		persistentData.ChangeTime = CommonTime() + timeToNextRefresh;
		AnimationRequestRefreshRate(drawData.C, 5000 - timeToNextRefresh);
		AnimationRequestDraw(drawData.C);
	}
}

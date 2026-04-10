// @ts-strict-ignore
"use strict";

/** @type {ExtendedItemScriptHookCallbacks.Draw<ExtendedItemData>} */
function InventoryItemNeckAccessoriesCollarShockUnitDrawHook(Data, OriginalFunction) {
	OriginalFunction();

	MainCanvas.textAlign = "right";
	DrawText(AssetTextGet("ShockCount"), 1500, 575, "White", "Gray");
	MainCanvas.textAlign = "left";
	DrawText(`${DialogFocusItem.Property.TriggerCount}`, 1510, 575, "White", "Gray");
	MainCanvas.textAlign = "center";

	ExtendedItemDrawCheckbox("ShowText", 1175, 618, DialogFocusItem.Property.ShowText);
	DrawText(AssetTextGet("ShowMessageInChat"), 1420, 648, "White", "Gray");
	ExtendedItemCustomDraw("ResetShockCount", 1635, 550);
	ExtendedItemCustomDraw("TriggerShock", 1635, 625);
}

/** @type {ExtendedItemScriptHookCallbacks.Click<ExtendedItemData>} */
function InventoryItemNeckAccessoriesCollarShockUnitClickHook(Data, OriginalFunction) {
	OriginalFunction();

	if (!DialogFocusItem) {
		return;
	} else if (MouseIn(1175, 618, 64, 64) && !ExtendedItemPermissionMode) {
		DialogFocusItem.Property.ShowText = !DialogFocusItem.Property.ShowText;
	} else if (MouseIn(1635, 550, 225, 55)) {
		ExtendedItemCustomClick("ResetShockCount", InventoryItemNeckAccessoriesCollarShockUnitResetCount);
	} else if (MouseIn(1635, 625, 225, 55)) {
		ExtendedItemCustomClick("TriggerShock", PropertyShockPublishAction);
	}
}

// Resets the trigger count
function InventoryItemNeckAccessoriesCollarShockUnitResetCount() {
	// Gets the current item and character
	DialogFocusItem.Property.TriggerCount = 0;
	const C = CharacterGetCurrent();
	const Dictionary = new DictionaryBuilder()
		.sourceCharacter(Player)
		.destinationCharacterName(C)
		.asset(DialogFocusItem.Asset, "AssetName", DialogFocusItem.Craft && DialogFocusItem.Craft.Name)
		.build();

	if (DialogFocusItem.Property.ShowText) {
		ChatRoomPublishCustomAction("ShockCountReset", false, Dictionary);
	} else {
		ChatRoomCharacterItemUpdate(C, DialogFocusItem.Asset.Group.Name);
	}
	if (C.IsPlayer()) {
		ServerPlayerAppearanceSync();
	}
}

/**
 * @typedef {{ ChangeTime?: number, DisplayCount?: number, LastTriggerCount?: number }} ShockUnitPersistentData
 */

/** @type {ExtendedItemScriptHookCallbacks.BeforeDraw<ExtendedItemData, ShockUnitPersistentData>} */
function AssetsItemNeckAccessoriesCollarShockUnitBeforeDrawHook(data, originalFunction, drawData) {
	if (drawData.L === "Light") {
		const persistentData = drawData.PersistentData();
		const property = drawData.Property || {};
		const Triggered = persistentData.LastTriggerCount < property.TriggerCount;
		const intensity = property.ShockLevel || 0;
		const wasBlinking = property.BlinkState;
		if (wasBlinking && Triggered) persistentData.DisplayCount++;
		if (persistentData.DisplayCount >= intensity * 1.5 + 3) {
			persistentData.DisplayCount = 0;
			persistentData.LastTriggerCount = property.TriggerCount;
		}
		return { Color: Triggered ? "#f00" : "#2f0", Opacity: wasBlinking ? 0 : 1 };
	}
}

/** @type {ExtendedItemScriptHookCallbacks.ScriptDraw<ExtendedItemData, ShockUnitPersistentData>} */
function AssetsItemNeckAccessoriesCollarShockUnitScriptDrawHook(data, originalFunction, drawData) {
	const persistentData = drawData.PersistentData();
	/** @type {ItemProperties} */
	const property = (drawData.Item.Property = drawData.Item.Property || {});
	if (typeof persistentData.ChangeTime !== "number") persistentData.ChangeTime = CommonTime() + 4000;
	if (typeof persistentData.DisplayCount !== "number") persistentData.DisplayCount = 0;
	if (typeof persistentData.LastTriggerCount !== "number") persistentData.LastTriggerCount = property.TriggerCount;

	const isTriggered = persistentData.LastTriggerCount < property.TriggerCount;
	const newlyTriggered = isTriggered && persistentData.DisplayCount == 0;
	if (newlyTriggered)
		persistentData.ChangeTime = Math.min(persistentData.ChangeTime, CommonTime());

	if (persistentData.ChangeTime < CommonTime()) {
		if (persistentData.LastTriggerCount > property.TriggerCount) persistentData.LastTriggerCount = 0;
		const wasBlinking = property.BlinkState;
		property.BlinkState = wasBlinking && !newlyTriggered ? false : true;
		const timeFactor = isTriggered ? 12 : 1;
		const timeToNextRefresh = (wasBlinking ? 4000 : 1000) / timeFactor;
		persistentData.ChangeTime = CommonTime() + timeToNextRefresh;
		AnimationRequestRefreshRate(drawData.C, (5000 / timeFactor) - timeToNextRefresh);
		AnimationRequestDraw(drawData.C);
	}
}

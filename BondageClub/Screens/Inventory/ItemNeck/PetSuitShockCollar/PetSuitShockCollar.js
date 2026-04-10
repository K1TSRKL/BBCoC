// @ts-strict-ignore
"use strict";

/** @type {ExtendedItemScriptHookCallbacks.Draw<NoArchItemData>} */
function InventoryItemNeckPetSuitShockCollars1DrawHook(data, originalFunction) {
	originalFunction();

	ExtendedItemCustomDraw("Low", 1165, 470, null, DialogFocusItem.Property.ShockLevel === 0);
	ExtendedItemCustomDraw("Medium", 1400, 470, null, DialogFocusItem.Property.ShockLevel === 1);
	ExtendedItemCustomDraw("High", 1635, 470, null, DialogFocusItem.Property.ShockLevel === 2);

	MainCanvas.textAlign = "right";
	DrawText(AssetTextGet("ShockCount"), 1500, 575, "White", "Gray");
	MainCanvas.textAlign = "left";
	DrawText(`${DialogFocusItem.Property.TriggerCount}`, 1510, 575, "White", "Gray");

	DrawCheckbox(1100, 618, 64, 64, AssetTextGet("ShowMessageInChat"), DialogFocusItem.Property.ShowText, ExtendedItemPermissionMode, "White");

	MainCanvas.textAlign = "center";
	ExtendedItemCustomDraw("ResetShockCount", 1635, 550);
	ExtendedItemCustomDraw("TriggerShock", 1635, 625);
	MainCanvas.textAlign = "left";
	DrawCheckbox(1100, 700, 64, 64, AssetTextGet("PetSuitShockCollarPunishActivity"), DialogFocusItem.Property.PunishActivity, false, "White");
	DrawCheckbox(1100, 770, 64, 64, AssetTextGet("PetSuitShockCollarPunishStandup"), DialogFocusItem.Property.PunishStandup, false, "White");
	DrawCheckbox(1100, 840, 64, 64, AssetTextGet("PetSuitShockCollarPunishStruggle"), DialogFocusItem.Property.PunishStruggle, false, "White");
	MainCanvas.textAlign = "center";
}

/** @type {ExtendedItemScriptHookCallbacks.Click<NoArchItemData>} */
function InventoryItemNeckPetSuitShockCollars1ClickHook(data, originalFunction) {
	if (originalFunction) originalFunction();
	const C = CurrentCharacter;

	if (!DialogFocusItem) {
		return;
	} else if (MouseIn(1165, 470, 225, 55)) {
		DialogFocusItem.Property.ShockLevel = 0;
	} else if (MouseIn(1400, 470, 225, 55)) {
		DialogFocusItem.Property.ShockLevel = 1;
	} else if (MouseIn(1635, 470, 225, 55)) {
		DialogFocusItem.Property.ShockLevel = 2;
	} else if (MouseIn(1100, 618, 64, 64) && !ExtendedItemPermissionMode) {
		DialogFocusItem.Property.ShowText = !DialogFocusItem.Property.ShowText;
	} else if (MouseIn(1635, 550, 225, 55)) {
		ExtendedItemCustomClick("ResetShockCount", InventoryItemNeckPetSuitShockCollarResetCount);
	} else if (MouseIn(1635, 625, 225, 55)) {
		ExtendedItemCustomClick("TriggerShock", PropertyShockPublishAction);
	} else if (MouseIn(1100, 700, 64, 64)) {
		DialogFocusItem.Property.PunishActivity = !DialogFocusItem.Property.PunishActivity;
		if (DialogFocusItem.Property.PunishActivity) {
			// Clear the activity cache of `Bite` and `Kick` activities to prevent retro-active punishments
			PropertyPunishActivityCache.delete("Bite");
			PropertyPunishActivityCache.delete("Kick");
		}

		ChatRoomCharacterItemUpdate(C, DialogFocusItem.Asset.Group.Name);
		return;
	} else if (MouseIn(1100, 770, 64, 64)) {
		DialogFocusItem.Property.PunishStandup = !DialogFocusItem.Property.PunishStandup;
		ChatRoomCharacterItemUpdate(C, DialogFocusItem.Asset.Group.Name);
		return;
	} else if (MouseIn(1100, 840, 64, 64)) {
		DialogFocusItem.Property.PunishStruggle = !DialogFocusItem.Property.PunishStruggle;
		ChatRoomCharacterItemUpdate(C, DialogFocusItem.Asset.Group.Name);
		return;
	}
}

// Resets the trigger count
function InventoryItemNeckPetSuitShockCollarResetCount() {
	// Gets the current item and character
	DialogFocusItem.Property.TriggerCount = 0;
	const C = CharacterGetCurrent();
	const Dictionary = new DictionaryBuilder()
		.sourceCharacter(Player)
		.destinationCharacterName(C)
		.asset(DialogFocusItem.Asset)
		.build();

	if (DialogFocusItem.Property.ShowText) {
		ChatRoomPublishCustomAction("ShockCountReset", false, Dictionary);
	}
}

/**
 * @typedef {{ UpdateTime?: number, CheckTime?: number, LastMessageLen?: number, LastTriggerCount?: number, DisplayCount?: number }} PetSuitShockCollarPersistentData
 */

/** @type {ExtendedItemCallbacks.BeforeDraw<PetSuitShockCollarPersistentData>} */
function AssetsItemNeckPetSuitShockCollarBeforeDraw(data) {
	if (data.L === "Light") {
		const persistentData = data.PersistentData();
		const property = data.Property || {};
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

/**
 * @param {Item} Item
 * @param {Character} C
 */
function InventoryPetSuitShockCollarCheckPunish(Item, C) {
	const { PunishActivity, PunishStandup, PunishStruggle} = Item.Property;

	if (PunishActivity && PropertyPunishActivityCheck("Bite")) {
		// Punish the player if they Activity
		return "Activity";
	} else if (PunishActivity && PropertyPunishActivityCheck("Kick")) {
		// Punish the player if they Activity
		return "Activity";
	} else if (PunishStandup && C.CanKneel(PoseChangeStatus.NEVER_WITHOUT_AID) && C.IsStanding() && ServerPlayerIsInChatRoom()) {
		// Punish the player if they stand up
		return "StandUp";
	} else if (PunishStruggle && Player.FocusGroup && StruggleProgressPrevItem != null && StruggleProgressStruggleCount > 0 && (StruggleProgress > 4 || StruggleLockPickProgressCurrentTries > 0)) {
		// Punish the player if they Struggle
		return "Struggle";
	}
	return "";
}

/**
 * @param {DynamicScriptCallbackData<FuturisticChastityBeltPersistentData>} data
 * @param {number} LastTime
 */
function AssetsItemNeckPetSuitShockCollarUpdate(data, LastTime) {
	let Item = data.Item;
	let C = data.C;

	if (!Item.Property) return;

	let punishment = InventoryPetSuitShockCollarCheckPunish(Item, C);
	switch (punishment) {
		case "Activity":
			PropertyShockPublishAction(C, Item, true);
			break;
		case "StandUp":
			PropertyShockPublishAction(C, Item, true);
			PoseSetActive(C, "Kneel");
			ServerSend("ChatRoomCharacterPoseUpdate", { Pose: C.ActivePose });
			break;
		case "Struggle":
			PropertyShockPublishAction(C, Item, true);
			StruggleProgressStruggleCount = 0;
			StruggleProgress = 0;
			DialogLeaveDueToItem = true;
			break;
	}
}

/** @type {ExtendedItemCallbacks.ScriptDraw<PetSuitShockCollarPersistentData>} */
function AssetsItemNeckPetSuitShockCollarScriptDraw(data) {
	const persistentData = data.PersistentData();
	/** @type {ItemProperties} */
	const property = (data.Item.Property = data.Item.Property || {});
	if (typeof persistentData.UpdateTime !== "number") persistentData.UpdateTime = CommonTime() + 4000;
	if (typeof persistentData.LastMessageLen !== "number") persistentData.LastMessageLen = (ChatRoomLastMessage) ? ChatRoomLastMessage.length : 0;
	if (typeof persistentData.CheckTime !== "number") persistentData.CheckTime = CommonTime();
	if (typeof persistentData.DisplayCount !== "number") persistentData.DisplayCount = 0;
	if (typeof persistentData.LastTriggerCount !== "number") persistentData.LastTriggerCount = property.TriggerCount;

	if (typeof property.NextShockTime !== "number") {
		property.NextShockTime = 0;

		// Extra cache clearing precaution (see `InventoryItemNeckPetSuitShockCollars1Click`) in case
		// `PunishStandup` was not enabled via the UI (e.g. via equipping a preconfigured crafted extended item)
		PropertyPunishActivityCache.delete("Bite");
		PropertyPunishActivityCache.delete("Kick");
	}

	// Trigger a check if a new message is detected
	let lastMsgIndex = ChatRoomChatLog.length - 1;
	if (lastMsgIndex >= 0 && ChatRoomChatLog[lastMsgIndex].Time > persistentData.CheckTime)
		persistentData.UpdateTime = Math.min(persistentData.UpdateTime, CommonTime() + 200); // Trigger if the user speaks

	const isTriggered = persistentData.LastTriggerCount < property.TriggerCount;
	const newlyTriggered = isTriggered && persistentData.DisplayCount == 0;
	if (newlyTriggered)
		persistentData.UpdateTime = Math.min(persistentData.UpdateTime, CommonTime());

	if (persistentData.UpdateTime < CommonTime()) {

		if (data.C.IsPlayer() && CommonTime() > data.Item.Property.NextShockTime) {
			AssetsItemNeckPetSuitShockCollarUpdate(data, persistentData.CheckTime);
			persistentData.LastMessageLen = (ChatRoomLastMessage) ? ChatRoomLastMessage.length : 0;
		}

		// Set CheckTime to last processed chat message time
		persistentData.CheckTime = (lastMsgIndex >= 0 ? ChatRoomChatLog[lastMsgIndex].Time : 0);

		if (persistentData.LastTriggerCount > property.TriggerCount) persistentData.LastTriggerCount = 0;
		const wasBlinking = property.BlinkState;
		property.BlinkState = wasBlinking && !newlyTriggered ? false : true;
		const timeFactor = isTriggered ? 12 : 1;
		const timeToNextRefresh = (wasBlinking ? 4000 : 1000) / timeFactor;
		persistentData.UpdateTime = CommonTime() + timeToNextRefresh;
		AnimationRequestRefreshRate(data.C, (5000 / timeFactor) - timeToNextRefresh);
		AnimationRequestDraw(data.C);
	}
}


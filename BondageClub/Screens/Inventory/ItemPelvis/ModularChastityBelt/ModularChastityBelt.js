// @ts-strict-ignore
"use strict";

var InventoryItemPelvisModularChastityBeltVoiceTriggers = ["Increase", "Decrease", "Disable", "Inflate", "Deflate", "Empty", "Shock"];
/** @type {string[]} */
var InventoryItemPelvisModularChastityBeltVoiceTriggerValues = [];

/** @type {ExtendedItemScriptHookCallbacks.Draw<ModularItemData>} */
function InventoryItemPelvisModularChastityBeltDrawHook(data, OriginalFunction) {
	OriginalFunction();
	//Base screen
	if (data.currentModule === ModularItemBase)
	{
		InventoryItemPelvisModularChastityBeltDrawBase(75);
	}

	if (data.currentModule === "Intensity") {
		InventoryItemPelvisModularChastityBeltDrawIntensity(75);
	}

	if (data.currentModule === "ShockModule") {
		InventoryItemPelvisModularChastityBeltDrawShockModule(0);
	}

	if (data.currentModule === "VoiceControl") {
		InventoryItemPelvisModularChastityBeltDrawVoiceControl(0);
	} else {
		InventoryItemPelvisModularChastityBeltDrawVoiceControlCleanup();
	}
}

/**
 * @param {number} _offset //How many pixels down will the UI be shifted
 */
function InventoryItemPelvisModularChastityBeltDrawBase(_offset)
{
	MainCanvas.textAlign = "left";

	DrawText(AssetTextGet("ModularChastityBeltTimeWorn") + ":", 1320, 550 + 0*75 + _offset, "White", "Gray");
	DrawText(AssetTextGet("ModularChastityBeltTimeSinceLastOrgasm") + ":", 1320, 550 + 1*75 + _offset, "White", "Gray");

	const opts = { includeYears: true, includeMonths: true, includeDays: true };
	const timeWorn = CommonFormatDurationRange(CommonTime(), DialogFocusItem.Property.TimeWorn, opts);
	const timeSinceLastOrgasm = CommonFormatDurationRange(CommonTime(), DialogFocusItem.Property.TimeSinceLastOrgasm, opts);

	DrawText(timeWorn, 1655, 550 + 0*75 + _offset, "White", "Gray");
	DrawText(timeSinceLastOrgasm, 1655, 550 + 1*75 + _offset, "White", "Gray");

	MainCanvas.textAlign = "center";
}

/**
 * @param {number} _offset //How many pixels down will the UI be shifted
 */
function InventoryItemPelvisModularChastityBeltDrawIntensity(_offset)
{
	// Display option information
	MainCanvas.textAlign = "left";

	DrawText(AssetTextGet("ModularChastityBeltOrgasmCount") + ":", 1515, 550 + 0*75 + _offset, "White", "Gray");
	DrawText(AssetTextGet("ModularChastityBeltDenyCount") + ":", 1515, 550 + 1*75 + _offset, "White", "Gray");

	DrawText(`${DialogFocusItem.Property.OrgasmCount}`, 1690, 550 + 0*75 + _offset, "White", "Gray");
	DrawText(`${DialogFocusItem.Property.RuinedOrgasmCount}`, 1690, 550 + 1*75 + _offset, "White", "Gray");

	MainCanvas.textAlign = "center";

	// Display the ShowText checkbox

	// Display the manual button
	ExtendedItemCustomDraw("ModularChastityBeltResetOrgasm", 1260, 550-27 + 0*75 + _offset, null, false, false);
	ExtendedItemCustomDraw("ModularChastityBeltResetDeny", 1260, 550-27 + 1*75 + _offset, null, false, false);
}

/**
 * @param {number} _offset //How many pixels down will the UI be shifted
 */
function InventoryItemPelvisModularChastityBeltDrawShockModule(_offset)
{

	// Display option information
	MainCanvas.textAlign = "right";
	DrawText(AssetTextGet("ModularChastityBeltShockCount") + ":", 1650, 550 + 0*75 + _offset, "White", "Gray");
	DrawText(AssetTextGet("ShowMessageInChat") + ":", 1500, 550 + 1*75 + _offset, "White", "Gray");
	DrawText(AssetTextGet("ModularChastityBeltPunishOrgasm") + ":", 1500, 550 + 2*75 + _offset, "White", "Gray");
	DrawText(AssetTextGet("ModularChastityBeltPunishTamperSelf") + ":", 1500, 550 + 3*75 + _offset, "White", "Gray");
	DrawText(AssetTextGet("ModularChastityBeltPunishTamperOther") + ":", 1500, 550 + 4*75 + _offset, "White", "Gray");
	DrawText(AssetTextGet("ModularChastityBeltPunishStanding") + ":", 1500, 550 + 5*75 + _offset, "White", "Gray");

	MainCanvas.textAlign = "left";
	DrawText(`${DialogFocusItem.Property.TriggerCount}`, 1660, 550 + 0*75 + _offset, "White", "Gray");
	MainCanvas.textAlign = "center";

	// Display checkbox
	ExtendedItemDrawCheckbox("ShowText", 1510, 520 + 1*75 + _offset, DialogFocusItem.Property.ShowText, { changeWhenLocked: false });
	ExtendedItemDrawCheckbox("PunishOrgasm", 1510, 520 + 2*75 + _offset, DialogFocusItem.Property.PunishOrgasm, { changeWhenLocked: false });
	ExtendedItemDrawCheckbox("PunishStruggle", 1510, 520 + 3*75 + _offset, DialogFocusItem.Property.PunishStruggle, { changeWhenLocked: false });
	ExtendedItemDrawCheckbox("PunishStruggleOther", 1510, 520 + 4*75 + _offset, DialogFocusItem.Property.PunishStruggleOther, { changeWhenLocked: false });
	ExtendedItemDrawCheckbox("PunishStandup", 1510, 520 + 5*75 + _offset, DialogFocusItem.Property.PunishStandup, { changeWhenLocked: false });

	//Draw button
	ExtendedItemCustomDraw("ModularChastityBeltTriggerShock", 1010, 550-27 + 0*75 + _offset, null, false, false);
	ExtendedItemCustomDraw("ModularChastityBeltResetShock", 1260, 550-27 + 0*75 + _offset, null, false, false);
}

/**
 * @param {number} _offset //How many pixels down will the UI be shifted
 */
function InventoryItemPelvisModularChastityBeltDrawVoiceControl(_offset)
{

	const Item = DialogFocusItem;

	// PAGE 1
	//Create inputs
	if (!DialogFocusItem.Property.TriggerValues) DialogFocusItem.Property.TriggerValues = CommonConvertArrayToString(InventoryItemPelvisModularChastityBeltVoiceTriggers);
	InventoryItemPelvisModularChastityBeltVoiceTriggerValues = DialogFocusItem.Property.TriggerValues.split(',');
	// Only create the inputs if the zone isn't blocked
	InventoryItemPelvisModularChastityBeltVoiceTriggers.forEach((trigger, i) => {
		const input = ElementCreateInput("ModularChastityBelt" + trigger, "text", "", "10");
		if (input) input.setAttribute("placeholder", InventoryItemPelvisModularChastityBeltVoiceTriggerValues[i]);
	});

	InventoryItemPelvisModularChastityBeltVoiceTriggers.forEach((trigger, i) => {
		MainCanvas.textAlign = "right";
		DrawText(AssetTextGet("ModularChastityBelt" + trigger), 1480, 550 + i*60 + _offset, "white", "gray");
		MainCanvas.textAlign = "center";
		ElementPosition("ModularChastityBelt" + trigger, 1625, 550 + i*60 + _offset, 225, 50);
	});

	// Draw the save button
	ExtendedItemCustomDraw("FuturisticVibratorSaveVoiceCommands", 1510, 550-27 + InventoryItemPelvisModularChastityBeltVoiceTriggers.length*60 + _offset, null, false, false);

	// Draw the BackNext button
	DrawBackNextButton(1260, 550-27 + InventoryItemPelvisModularChastityBeltVoiceTriggers.length*60 + _offset, 225, 50, AssetTextGet("FuturisticVibratorPermissions" + (Item.Property.AccessMode || "")), "White", "",
		() => AssetTextGet("FuturisticVibratorPermissions" + InventoryItemVulvaFuturisticVibratorPreviousAccessMode(Item.Property.AccessMode || "")),
		() => AssetTextGet("FuturisticVibratorPermissions" + InventoryItemVulvaFuturisticVibratorNextAccessMode(Item.Property.AccessMode || ""))
	);


}

function InventoryItemPelvisModularChastityBeltDrawVoiceControlCleanup() {
	InventoryItemPelvisModularChastityBeltVoiceTriggers.forEach(i => ElementRemove(`ModularChastityBelt${i}`));
}

/** @type {ExtendedItemScriptHookCallbacks.Exit<ModularItemData>} */
function InventoryItemPelvisModularChastityBeltExitHook(data, originalFunction) {
	InventoryItemPelvisModularChastityBeltDrawVoiceControlCleanup();
}

/**
 * @type {ExtendedItemScriptHookCallbacks.Click<ModularItemData>}
*/
function InventoryItemPelvisModularChastityBeltClickHook(data, OriginalFunction) {

	if (DialogFocusItem && data.currentModule === "Intensity") {
		InventoryItemPelvisModularChastityBeltClickIntensity(75);
	}

	if (DialogFocusItem && data.currentModule === "ShockModule") {
		InventoryItemPelvisModularChastityBeltClickShockModule(0);
	}

	if (data.currentModule === "VoiceControl") {
		InventoryItemPelvisModularChastityBeltClickVoiceControl(0);
	}

	OriginalFunction();
}

/**
 * @param {number} _offset //How many pixels down will the UI be shifted
 */
function InventoryItemPelvisModularChastityBeltClickIntensity(_offset){
	//Click Orgasm Reset
	if (MouseIn(1260, 550-27 + 0*75 + _offset, 225, 55)) {
		ExtendedItemCustomClick("ModularChastityBeltResetOrgasm", InventoryItemPelvisModularChastityBeltResetOrgasm, false, false);
		return;
	}

	//Click Deny Reset
	if (MouseIn(1260, 550-27 + 1*75 + _offset, 225, 55)) {
		ExtendedItemCustomClick("ModularChastityBeltResetDeny", InventoryItemPelvisModularChastityBeltResetDeny, false, false);
		return;
	}
}

/**
 * @param {number} _offset //How many pixels down will the UI be shifted
 */
function InventoryItemPelvisModularChastityBeltClickVoiceControl(_offset){
	//Click Save
	if (MouseIn(1510, 550-27 + InventoryItemPelvisModularChastityBeltVoiceTriggers.length*60 + _offset, 225, 55)) {
		ExtendedItemCustomClick("FuturisticVibratorSaveVoiceCommands", InventoryItemPelvisModularChastityBeltVoiceControlClickSet, false, false);
		return;
	}

	//Click BackNext
	if (MouseIn(1260, 550-27 + InventoryItemPelvisModularChastityBeltVoiceTriggers.length*60 + _offset, 225, 55)) {
		if (MouseX < 1260 + (225 / 2)) {
			ExtendedItemCustomClick("", InventoryItemPelvisModularChastityBeltVoicePrevious, false, false);
		} else {
			ExtendedItemCustomClick("", InventoryItemPelvisModularChastityBeltVoiceNext, false, false);
		}
	}
}

function InventoryItemPelvisModularChastityBeltVoicePrevious() {
	InventoryItemVulvaFuturisticVibratorSetAccessMode(CharacterGetCurrent(), DialogFocusItem, InventoryItemVulvaFuturisticVibratorPreviousAccessMode(DialogFocusItem.Property.AccessMode || ""));
}

function InventoryItemPelvisModularChastityBeltVoiceNext() {
	InventoryItemVulvaFuturisticVibratorSetAccessMode(CharacterGetCurrent(), DialogFocusItem, InventoryItemVulvaFuturisticVibratorNextAccessMode(DialogFocusItem.Property.AccessMode || ""));
}

function InventoryItemPelvisModularChastityBeltVoiceControlClickSet(){
	if ((DialogFocusItem != null) && (DialogFocusItem.Property != null)) {
		var InventoryItemPelvisModularChastityBeltVoiceTriggerValuesTemp = [];
		for (let I = 0; I < InventoryItemPelvisModularChastityBeltVoiceTriggers.length; I++) {
			InventoryItemPelvisModularChastityBeltVoiceTriggerValuesTemp.push((ElementValue("ModularChastityBelt" + InventoryItemPelvisModularChastityBeltVoiceTriggers[I]) != "") ? ElementValue("ModularChastityBelt" + InventoryItemPelvisModularChastityBeltVoiceTriggers[I])
				: InventoryItemPelvisModularChastityBeltVoiceTriggerValues[I]);
		}

		InventoryItemPelvisModularChastityBeltVoiceTriggerValues = InventoryItemPelvisModularChastityBeltVoiceTriggerValuesTemp;

		var temp = CommonConvertArrayToString(InventoryItemPelvisModularChastityBeltVoiceTriggerValues);

		if (temp != "" && typeof temp === "string") {
			DialogFocusItem.Property.TriggerValues = temp;
			if (ServerPlayerIsInChatRoom()) {
				const Dictionary = new DictionaryBuilder()
					.sourceCharacter(Player)
					.destinationCharacter(CurrentCharacter)
					.asset(DialogFocusItem.Asset, "AssetName", DialogFocusItem.Craft && DialogFocusItem.Craft.Name)
					.build();
				ChatRoomPublishCustomAction("FuturisticVibratorSaveVoiceCommandsAction", true, Dictionary);
			}
			DialogLeave();
		}
	}
}

function InventoryItemPelvisModularChastityBeltResetOrgasm(){
	// Gets the current item and character
	DialogFocusItem.Property.OrgasmCount = 0;
	const C = CharacterGetCurrent();
	const Dictionary = new DictionaryBuilder()
		.sourceCharacter(Player)
		.destinationCharacterName(C)
		.asset(DialogFocusItem.Asset, "AssetName", DialogFocusItem.Craft && DialogFocusItem.Craft.Name)
		.build();

	if (DialogFocusItem.Property.ShowText) {
		ChatRoomPublishCustomAction("OrgasmCountReset", false, Dictionary);
	} else {
		ChatRoomCharacterItemUpdate(C, DialogFocusItem.Asset.Group.Name);
	}
	if (C.IsPlayer()) {
		ServerPlayerAppearanceSync();
	}
}

function InventoryItemPelvisModularChastityBeltResetDeny(){
	// Gets the current item and character
	DialogFocusItem.Property.RuinedOrgasmCount = 0;
	const C = CharacterGetCurrent();
	const Dictionary = new DictionaryBuilder()
		.sourceCharacter(Player)
		.destinationCharacterName(C)
		.asset(DialogFocusItem.Asset, "AssetName", DialogFocusItem.Craft && DialogFocusItem.Craft.Name)
		.build();

	if (DialogFocusItem.Property.ShowText) {
		ChatRoomPublishCustomAction("RuinCountReset", false, Dictionary);
	} else {
		ChatRoomCharacterItemUpdate(C, DialogFocusItem.Asset.Group.Name);
	}
	if (C.IsPlayer()) {
		ServerPlayerAppearanceSync();
	}
}

/**
 * @param {number} _offset //How many pixels down will the UI be shifted
 */
function InventoryItemPelvisModularChastityBeltClickShockModule(_offset){
	//Click Manual Shock
	if (MouseIn(1010, 550-27 + 0*75 + _offset, 225, 55)) {
		ExtendedItemCustomClick("ModularChastityBeltTriggerShock", PropertyShockPublishAction, false, false);
		return;
	}
	//Click Shock Reset
	if (MouseIn(1260, 550-27 + 0*75 + _offset, 225, 55)) {
		ExtendedItemCustomClick("ModularChastityBeltResetShock", InventoryItemNeckAccessoriesCollarShockUnitResetCount, false, false);
		return;
	}

	if (MouseIn(1510, 520 + 1*75 + _offset, 64, 64) && !ExtendedItemPermissionMode) {
		ExtendedItemCustomClickAndPush(CharacterGetCurrent(), DialogFocusItem, "ShowText", () => DialogFocusItem.Property.ShowText = !DialogFocusItem.Property.ShowText, false, false);
		return;
	}
	if (MouseIn(1510, 520 + 2*75 + _offset, 64, 64) && !ExtendedItemPermissionMode) {
		ExtendedItemCustomClickAndPush(CharacterGetCurrent(), DialogFocusItem, "PunishOrgasm", () => DialogFocusItem.Property.PunishOrgasm = !DialogFocusItem.Property.PunishOrgasm, false, false);
		return;
	}
	if (MouseIn(1510, 520 + 3*75 + _offset, 64, 64) && !ExtendedItemPermissionMode) {
		ExtendedItemCustomClickAndPush(CharacterGetCurrent(), DialogFocusItem, "PunishStruggle", () => DialogFocusItem.Property.PunishStruggle = !DialogFocusItem.Property.PunishStruggle, false, false);
		return;
	}
	if (MouseIn(1510, 520 + 4*75 + _offset, 64, 64) && !ExtendedItemPermissionMode) {
		ExtendedItemCustomClickAndPush(CharacterGetCurrent(), DialogFocusItem, "PunishStruggleOther", () => DialogFocusItem.Property.PunishStruggleOther = !DialogFocusItem.Property.PunishStruggleOther, false, false);
		return;
	}
	if (MouseIn(1510, 520 + 5*75 + _offset, 64, 64) && !ExtendedItemPermissionMode) {
		ExtendedItemCustomClickAndPush(CharacterGetCurrent(), DialogFocusItem, "PunishStandup", () => DialogFocusItem.Property.PunishStandup = !DialogFocusItem.Property.PunishStandup, false, false);
		return;
	}
}

/**
 * @typedef {{Cooldown?: number, ShockCooldown?: number, LastMessage?: number, DenyDetected?: boolean, OrgasmDetected?: boolean, ChatroomCheck?: boolean, SyncNeeded?: boolean, SyncCooldown?: number}} ModularChastityBeltPersistentData
 */

/** @type {ExtendedItemScriptHookCallbacks.ScriptDraw<ModularItemData, ModularChastityBeltPersistentData>} */
function InventoryItemPelvisModularChastityBeltScriptDrawHook(data, originalFunction, drawData) {
	// Only run updates on the player and NPCs
	if (!drawData.C.IsPlayer() && drawData.C.MemberNumber !== null) return;

	const persistentData = drawData.PersistentData();
	if (typeof persistentData.Cooldown !== "number") persistentData.Cooldown = 0;
	if (typeof persistentData.ShockCooldown !== "number") persistentData.ShockCooldown = 0;
	if (typeof persistentData.LastMessage !== "number") persistentData.LastMessage = CommonTime();
	if (typeof persistentData.DenyDetected !== "boolean") persistentData.DenyDetected = false;
	if (typeof persistentData.OrgasmDetected !== "boolean") persistentData.OrgasmDetected = false;
	if (typeof persistentData.ChatroomCheck !== "boolean") persistentData.ChatroomCheck = false;
	if (typeof persistentData.SyncNeeded !== "boolean") persistentData.SyncNeeded = false;
	if (typeof persistentData.SyncCooldown !== "number") persistentData.SyncCooldown = CommonTime() + 60000;

	//Cooldown check
	if (persistentData.Cooldown > CommonTime()) {
		return; //If cooldown hasn't passed yet, do nothing
	}

	var isPlayerInChatRoom = ServerPlayerIsInChatRoom();

	if (!persistentData.ChatroomCheck)
	{
		//Player freshly entered a room
		persistentData.ShockCooldown = CommonTime() + 5000;
	}
	persistentData.Cooldown = CommonTime() + 500;
	persistentData.ChatroomCheck = isPlayerInChatRoom;

	const itemType = drawData.Item.Property.TypeRecord;
	const Item = drawData.Item;
	const C = drawData.C;

	/** @type {ItemProperties} */
	const property = (drawData.Item.Property = drawData.Item.Property || {});

	//Orgasm is comming check
	if (C.ArousalSettings && C.ArousalSettings.OrgasmTimer && C.ArousalSettings.OrgasmTimer > 0)
	{
		//Player has orgasm imminent
		if (!persistentData.DenyDetected){
			property.RuinedOrgasmCount += 1;
			persistentData.DenyDetected = true;

			//Delay Sync for at least 15 seconds so potential orgasm synces in this very cycle.
			persistentData.SyncCooldown = Math.max(persistentData.SyncCooldown, CommonTime() + 15000);
			persistentData.SyncNeeded = true;
		}
	} else {
		persistentData.DenyDetected = false;
	}

	//Orgasm check
	if (C.ArousalSettings && C.ArousalSettings.OrgasmStage && C.ArousalSettings.OrgasmStage > 1)
	{
		//Player is having an orgasm
		if (!persistentData.OrgasmDetected){
			property.OrgasmCount += 1;
			property.RuinedOrgasmCount = 0;
			property.TimeSinceLastOrgasm = CommonTime();
			persistentData.OrgasmDetected = true;

			persistentData.SyncNeeded = true;
		}
	} else {
		persistentData.OrgasmDetected = false;
	}

	//Voice control check
	let lastMsgIndex = ChatRoomChatLog.length - 1;
	if (lastMsgIndex >= 0 && ChatRoomChatLog[lastMsgIndex].Time > persistentData.LastMessage) {
		if (itemType.v !== 0) {
			InventoryItemPelvisModularChastityBeltHandleChat(data, C, Item, persistentData.LastMessage, itemType);
		}
		persistentData.LastMessage = ChatRoomChatLog[lastMsgIndex].Time;
	}

	//Shock check
	if (itemType.s !== 0) {
		//Automatic shock can happen once every 0.5 seconds and only if Shock Module is not off

		if (!Item.Property)
			return;

		const punishment = InventoryItemPelvisModularChastityBeltCheckPunish(Item, C, persistentData.OrgasmDetected, isPlayerInChatRoom, persistentData.ShockCooldown);
		if (punishment) {
			switch (punishment) {
				case "Orgasm":
					PropertyShockPublishAction(C, Item, true);
					break;
				case "StruggleOther":
				case "Struggle":
					PropertyShockPublishAction(C, Item, true);
					StruggleProgressStruggleCount = 0;
					StruggleProgress = 0;
					DialogLeaveDueToItem = true;
					break;
				case "StandUp":
					PropertyShockPublishAction(C, Item, true);
					InventoryItemPelvisModularChastityBeltForceKneel(C);
					break;
			}
		}
	}

	//Sync check
	if (persistentData.SyncNeeded && CommonTime() > persistentData.SyncCooldown)
	{
		//Reset flags
		persistentData.SyncNeeded = false;
		persistentData.SyncCooldown = CommonTime() + 60000;

		//Sync
		ServerPlayerAppearanceSync();
		ChatRoomCharacterItemUpdate(C, Item.Asset.Group.Name);
	}
}

/**
 * @param {ModularItemData} data
 * @param {Character} C
 * @param {Item} Item
 * @param {number} LastTime
 * @param {TypeRecord} ItemType
 */
function InventoryItemPelvisModularChastityBeltHandleChat(data, C, Item, LastTime, ItemType) {
	if (!Item) return;
	if (!Item.Property) {
		/** @type {Parameters<ExtendedItemCallbacks.Init>} */
		const args = [C, Item, true, true];
		CommonCallFunctionByNameWarn(`${data.functionPrefix}Init`, ...args);
	}

	var TriggerValues = Item.Property.TriggerValues && Item.Property.TriggerValues.split(',');
	if (!TriggerValues) TriggerValues = InventoryItemPelvisModularChastityBeltVoiceTriggers;

	// Search from latest message backwards, allowing early exit
	for (let CH = ChatRoomChatLog.length - 1; CH >= 0; CH--) {
		const logEntry = ChatRoomChatLog[CH];

		// Messages are in order, no need to keep looping
		if (logEntry.Time <= LastTime) break;

		// Skip messages from unauthorized users
		const sender = ChatRoomCharacter.find(c => c.MemberNumber === logEntry.SenderMemberNumber);
		if (!sender || !ServerChatRoomGetAllowItem(sender, C)) continue;
		if (Item.Property.AccessMode === ItemVulvaFuturisticVibratorAccessMode.PROHIBIT_SELF && logEntry.SenderMemberNumber === C.MemberNumber) continue;
		if (Item.Property.AccessMode === ItemVulvaFuturisticVibratorAccessMode.LOCK_MEMBER_ONLY && logEntry.SenderMemberNumber !== Item.Property.LockMemberNumber) continue;

		var msg = InventoryItemPelvisModularChastityBeltDetectMsg(logEntry.Chat.toUpperCase(), TriggerValues);

		if (msg.length > 0) {
			const triggers = [];
			for (let i = 0; i < msg.length; i++) {
				triggers.push(InventoryItemPelvisModularChastityBeltVoiceTriggers[msg[i]]);
			}


			//vibrator modes, can only pick one
			let chatMessageV;
			if (triggers.includes("Increase") && ItemType.i < 4) {
				ItemType.i = ItemType.i + 1;
				chatMessageV = `ItemPelvisModularChastityBeltSeti${ItemType.i}`;
			} else if (triggers.includes("Decrease") && ItemType.i > 0) {
				ItemType.i = ItemType.i - 1;
				chatMessageV = `ItemPelvisModularChastityBeltSeti${ItemType.i}`;
			} else if (triggers.includes("Disable") && ItemType.i !== 0) {
				ItemType.i = 0;
				chatMessageV = `ItemPelvisModularChastityBeltSeti${ItemType.i}`;
			}

			//plug modes, can only pick one
			let chatMessageP;
			if (triggers.includes("Inflate") && ItemType.p < 4) {
				ItemType.p = ItemType.p + 1;
				chatMessageP = `ItemPelvisModularChastityBeltSetp${ItemType.p}`;
			} else if (triggers.includes("Deflate") && ItemType.p > 0) {
				ItemType.p = ItemType.p - 1;
				chatMessageP = `ItemPelvisModularChastityBeltSetp${ItemType.p}`;
			} else if (triggers.includes("Empty") && ItemType.p !== 0) {
				ItemType.p = 0;
				chatMessageP = `ItemPelvisModularChastityBeltSetp${ItemType.p}`;
			}

			if (chatMessageV || chatMessageP) {
				// WORKAROUND: This will remove "Vibrating" effect from the item if vibrator is supposed to be off
				// Should be harmless even after the FIXME is resolved.
				if (ItemType.i === 0)
				{
					let index = Item.Property.Effect.indexOf("Vibrating");
					if (index !== -1) {
						Item.Property.Effect.splice(index, 1);
					}
				}

				// WORKAROUND: This will remove "Slow", "FillVulva" and "IsPlugged" effect from the item and blocking bodyparts "ItemVulva" and "ItemButt" if plugs are not bloated enough or deflated
				// Should be harmless even after the FIXME is resolved.
				if (ItemType.p < 3)
				{
					let index = Item.Property.Effect.indexOf("Slow");
					if (index !== -1) {
						Item.Property.Effect.splice(index, 1);
					}
				}
				if (ItemType.p === 0)
				{
					let index = Item.Property.Block.indexOf("ItemVulva");
					if (index !== -1) {
						Item.Property.Block.splice(index, 1);
					}
					index = Item.Property.Block.indexOf("ItemButt");
					if (index !== -1) {
						Item.Property.Block.splice(index, 1);
					}

					index = Item.Property.Effect.indexOf("FillVulva");
					if (index !== -1) {
						Item.Property.Effect.splice(index, 1);
					}
					index = Item.Property.Effect.indexOf("IsPlugged");
					if (index !== -1) {
						Item.Property.Effect.splice(index, 1);
					}
				}

				// FIXME: this needs to cause an actual update of the item's effects
				ExtendedItemSetOptionByRecord(C, Item, ItemType, {push: true});

				if (chatMessageV) {
					const Dictionary = new DictionaryBuilder()
						.sourceCharacter(Player)
						.destinationCharacter(C)
						.asset(Item.Asset, "AssetName", Item.Craft && Item.Craft.Name)
						.build();
					ChatRoomPublishCustomAction(chatMessageV, true, Dictionary);
				}
				if (chatMessageP) {
					const Dictionary = new DictionaryBuilder()
						.sourceCharacter(Player)
						.destinationCharacter(C)
						.asset(Item.Asset, "AssetName", Item.Craft && Item.Craft.Name)
						.build();
					ChatRoomPublishCustomAction(chatMessageP, true, Dictionary);
				}
			}

			//triggered actions
			if (triggers.includes("Shock")) {
				PropertyShockPublishAction(C, Item, true);
			}
		}
	}
}

/**
 * @param {string} msg
 * @param {readonly string[]} TriggerValues
 * @returns {number[]}
 */
function InventoryItemPelvisModularChastityBeltDetectMsg(msg, TriggerValues) {
	var commandsReceived = [];

	// If the message is OOC, just return immediately
	if (msg.indexOf('(') == 0) return commandsReceived;

	for (let I = 0; I < TriggerValues.length; I++) {
		// Don't execute arbitrary regex
		let regexString = TriggerValues[I].replace(/[.*+?^${}()|[\]\\]/g, '\\$&');

		// Allow `*` wildcard, and normalize case
		regexString = regexString.replace(/\*/g, ".*");//regexString.replaceAll("\\*", ".*")
		regexString = regexString.toUpperCase();

		const nonLatinCharRegex = new RegExp('^([^\\x20-\\x7F]|\\\\.\\*)+$');
		let triggerRegex;

		// In general, in most of the Asian language, the full sentence will be considered as one whole word
		// Because how regex consider word boundaries to be position between \w -> [A-Za-z0-9_] and \W.

		// So if commands are set to those languages, the command will never be triggered.
		// Or if the command is not a word
		// This enhancement should allow Asian language commands, and also emoji/special characters
		// (e.g. A symbol such as ↑ or ↓, Languages in CJK group such as Chinese, Japanese, and Korean.)
		// This should be a fun addition to boost the user's experience.
		if (nonLatinCharRegex.test(regexString)) {
			triggerRegex = new RegExp(regexString);
		} else {
			triggerRegex = new RegExp(`\\b${regexString}\\b`);
		}
		const success = triggerRegex.test(msg);

		if (success) commandsReceived.push(I);
	}
	return commandsReceived;
}

/**
 * @param {Item} Item
 * @param {Character} C
 * @param {boolean} OrgasmDetected
 * @param {boolean} isPlayerInChatRoom
 * @param {number} ShockCooldown
 */
function InventoryItemPelvisModularChastityBeltCheckPunish(Item, C, OrgasmDetected, isPlayerInChatRoom, ShockCooldown) {
	const { PunishOrgasm, PunishStruggle, PunishStruggleOther, PunishStandup } = Item.Property;
	if (PunishOrgasm && C.ArousalSettings && C.ArousalSettings.OrgasmStage > 1 && !OrgasmDetected) {
		// Punish the player if they orgasm
		return "Orgasm";
	} else if (PunishStruggleOther && C.FocusGroup && StruggleProgressPrevItem != null && StruggleProgressStruggleCount > 0 && (StruggleProgress > 3 || StruggleLockPickProgressCurrentTries > 0)) {
		// Punish the player if they Struggle with any item
		return "StruggleOther";
	} else if (PunishStruggle && C.FocusGroup && StruggleProgressPrevItem != null && StruggleProgressStruggleCount > 0 && (StruggleProgress > 3 || StruggleLockPickProgressCurrentTries > 0)) {
		for (var Z = 0; Z < InventoryItemPelvisFuturisticChastityBeltTamperZones.length; Z++)
			if (C.FocusGroup.Name == InventoryItemPelvisFuturisticChastityBeltTamperZones[Z])
				return "Struggle";
	} else if (InventoryItemPelvisModularChastityBeltCheckStanding(PunishStandup, C, isPlayerInChatRoom, ShockCooldown)) {
		// Punish the player if they stand up
		return "StandUp";
	}
	return null;
}

/**
 * @param {boolean} PunishStandup
 * @param {Character} C
 * @param {boolean} isPlayerInChatRoom
 * @param {number} ShockCooldown
 * @returns {boolean}
 */
function InventoryItemPelvisModularChastityBeltCheckStanding(PunishStandup, C, isPlayerInChatRoom, ShockCooldown) {
	return PunishStandup && C.CanKneel(PoseChangeStatus.NEVER_WITHOUT_AID) && C.IsStanding() && isPlayerInChatRoom && ShockCooldown < CommonTime();
}

/**
 * @param {Character} C
 */
function InventoryItemPelvisModularChastityBeltForceKneel(C) {
	PoseSetActive(C, "Kneel");
	ServerSend("ChatRoomCharacterPoseUpdate", { Pose: C.ActivePose });
}

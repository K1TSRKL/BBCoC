// @ts-strict-ignore
"use strict";

var InventoryItemMiscHighSecurityPadlockPlayerCanUnlock = true;
var HighSecurityPadlockConfigOwner = true;
var HighSecurityPadlockConfigLover = true;
var HighSecurityPadlockConfigWhitelist = false;

/** @type {ExtendedItemScriptHookCallbacks.Init<NoArchItemData>} */
function InventoryItemMiscHighSecurityPadlockInitHook({ asset }, originalFunction, C, item, push, refresh) {
	if (!CommonIsObject(item.Property)) {
		item.Property = {};
	}

	if (item.Property.LockMemberNumber && !item.Property.MemberNumberListKeys) {
		item.Property.MemberNumberListKeys = item.Property.LockMemberNumber.toString();
	} else {
		return (originalFunction == null) ? false : originalFunction(C, item, push, refresh);
	}

	originalFunction(C, item, false, false);
	if (refresh) CharacterRefresh(C, push, false);
	if (push) ChatRoomCharacterItemUpdate(C, asset.Group.Name);
	return true;
}

/** @type {ExtendedItemScriptHookCallbacks.Load<NoArchItemData>} */
function InventoryItemMiscHighSecurityPadlockLoadHook(data, originalFunction) {
	originalFunction();
	var C = CharacterGetCurrent();
	InventoryItemMiscHighSecurityPadlockPlayerCanUnlock = true;

	// Only create the inputs if the zone isn't blocked
	if (!InventoryGroupIsBlocked(C, C.FocusGroup.Name)) {
		if (DialogFocusSourceItem != null && ((DialogFocusSourceItem.Property.MemberNumberListKeys && CommonConvertStringToArray("" + DialogFocusSourceItem.Property.MemberNumberListKeys).indexOf(Player.MemberNumber) >= 0))) {
			if (!((document.getElementById("MemberNumberList") != null) && ElementValue("MemberNumberList") && ElementValue("MemberNumberList").length > 1)) { // Only update if there isnt text already..
				ElementCreateTextArea("MemberNumberList");
				document.getElementById("MemberNumberList").setAttribute("maxLength", 250);
				document.getElementById("MemberNumberList").setAttribute("autocomplete", "off");
				ElementValue("MemberNumberList", DialogFocusSourceItem.Property.MemberNumberListKeys);
			}

			if (!InventoryItemMiscHighSecurityPadlockPlayerHasKeys(C, DialogFocusItem)) {
				InventoryItemMiscHighSecurityPadlockPlayerCanUnlock = false;
			}
		}
	}
}

// FIXME: should be merged into either DialogHasKey or DialogCanUnlock
/**
 * @param {Character} C
 * @param {Item} Item
 * @returns {boolean}
 */
function InventoryItemMiscHighSecurityPadlockPlayerHasKeys(C, Item) {
	if (LogQuery("KeyDeposit", "Cell")) return false;
	let UnlockName = "Unlock" + Item.Asset.Name;
	if ((Item != null) && (Item.Property != null) && (Item.Property.LockedBy != null)) UnlockName = "Unlock" + Item.Property.LockedBy;

	const key = Asset.find(a => InventoryItemHasEffect({ Asset: a }, /** @type {EffectName} */ (UnlockName)));
	if (key && InventoryAvailable(Player, key.Name, key.Group.Name)) {
		var Lock = InventoryGetLock(Item);
		if (Lock != null) {
			if (Lock.Asset.LoverOnly && !C.IsLoverOfPlayer()) return false;
			if (Lock.Asset.OwnerOnly && !C.IsOwnedByPlayer()) return false;
			if (Lock.Asset.FamilyOnly && !C.IsFamilyOfPlayer()) return false;
			return true;
		} else {
			return true;
		}
	}
	return true;
}

/** @type {ExtendedItemScriptHookCallbacks.Draw<NoArchItemData>} */
function InventoryItemMiscHighSecurityPadlockDrawHook(data, originalFunction) {
	originalFunction();
	if (DialogFocusSourceItem == null) {
		// TODO: Let the click handlers return a boolean flag indicating whether a button has been clicked or not.
		// As a stop-gap measure simply check whether `DialogFocusSourceItem` has been de-initialized
		return;
	}

	var C = CharacterGetCurrent();
	if ((DialogFocusSourceItem != null) && (DialogFocusSourceItem.Property != null) && (DialogFocusSourceItem.Property.LockMemberNumber != null))
		DrawText(InterfaceTextGet("LockMemberNumber") + " " + DialogFocusSourceItem.Property.LockMemberNumber.toString(), 1500, 650, "white", "gray");

	if (!InventoryGroupIsBlocked(C, C.FocusGroup.Name)&& (DialogFocusSourceItem != null && ((DialogFocusSourceItem.Property.MemberNumberListKeys && CommonConvertStringToArray("" + DialogFocusSourceItem.Property.MemberNumberListKeys).indexOf(Player.MemberNumber) >= 0)))) {
		DrawText(AssetTextGet("HighSecuritySaveIntro"), 1500, 600, "white", "gray");
		ElementPosition("MemberNumberList", 1260, 780, 300, 170);
		DrawButton(1135, 920, 230, 64, AssetTextGet("HighSecuritySave"), "White", "");

		MainCanvas.textAlign = "left";
		DrawCheckbox(1450, 700, 64, 64, AssetTextGet("HighSecurityAppendOwner"), HighSecurityPadlockConfigOwner, false, "White");
		DrawCheckbox(1450, 780, 64, 64, AssetTextGet("HighSecurityAppendLover"), HighSecurityPadlockConfigLover, false, "White");
		DrawCheckbox(1450, 860, 64, 64, AssetTextGet("HighSecurityAppendWhitelist"), HighSecurityPadlockConfigWhitelist, false, "White");
		MainCanvas.textAlign = "center";


		if (!InventoryItemMiscHighSecurityPadlockPlayerCanUnlock) {
			DrawText(AssetTextGet("HighSecurityWarning"), 1500, 550, "red", "gray");
		}
	} else {
		DrawText(AssetTextGet(DialogFocusItem.Asset.Group.Name + DialogFocusItem.Asset.Name + "Intro"), 1500, 600, "white", "gray");
	}
}

/** @type {ExtendedItemScriptHookCallbacks.Click<NoArchItemData>} */
function InventoryItemMiscHighSecurityPadlockClickHook(data, originalFunction) {
	originalFunction();
	var C = CharacterGetCurrent();
	if (!InventoryGroupIsBlocked(C, C.FocusGroup.Name)&& (DialogFocusSourceItem != null && ((DialogFocusSourceItem.Property.MemberNumberListKeys && CommonConvertStringToArray("" + DialogFocusSourceItem.Property.MemberNumberListKeys).indexOf(Player.MemberNumber) >= 0)))) {
		if (MouseIn(1135, 920, 230, 64)) {
			if (DialogFocusSourceItem != null && DialogFocusSourceItem.Property != null) {
				var list = CommonConvertStringToArray("" + ElementValue("MemberNumberList").trim());
				if (!InventoryItemMiscHighSecurityPadlockPlayerCanUnlock && list.length > 1 && list.indexOf(Player.MemberNumber) >= 0 ) {
					list = list.filter(x => x !== Player.MemberNumber);
				}

				for (let A = 0; A < C.Appearance.length; A++) {
					if (C.Appearance[A].Asset.Group.Name == C.FocusGroup.Name)
						C.Appearance[A] = DialogFocusSourceItem;
				}

				if (HighSecurityPadlockConfigOwner && Player.IsOwned() == "online" && list.indexOf(Player.OwnerNumber()) < 0) {
					list.push(Player.OwnerNumber());
				}
				if (HighSecurityPadlockConfigLover && Player.Lovership) {
					for (let L = 0; L < Player.Lovership.length; L++) {
						const lover = Player.Lovership[L];
						if (lover.MemberNumber != null && list.indexOf(lover.MemberNumber) < 0)
							list.push(Player.Lovership[L].MemberNumber);
					}
				}
				if (HighSecurityPadlockConfigWhitelist && Player.WhiteList) {
					for (let L = 0; L < Player.WhiteList.length; L++) {
						if (list.indexOf(Player.WhiteList[L]) < 0)
							list.push(Player.WhiteList[L]);
					}
				}

				DialogFocusSourceItem.Property.MemberNumberListKeys = "" +
					CommonConvertArrayToString(list); // Convert to array and back; can only save strings on server
				ElementValue("MemberNumberList", DialogFocusSourceItem.Property.MemberNumberListKeys);

				if (ServerPlayerIsInChatRoom()) {
					const Dictionary = new DictionaryBuilder()
						.sourceCharacter(Player)
						.destinationCharacter(C)
						.focusGroup(C.FocusGroup.Name)
						.build();
					ChatRoomPublishCustomAction("HighSecurityUpdate", true, Dictionary);
				}
				else {
					CharacterRefresh(C);
					DialogLeaveFocusItem();
				}
			}


			return;
		}
		if (MouseIn(1450, 700, 64, 64)) {HighSecurityPadlockConfigOwner = !HighSecurityPadlockConfigOwner; return;}
		if (MouseIn(1450, 780, 64, 64)) {HighSecurityPadlockConfigLover = !HighSecurityPadlockConfigLover; return;}
		if (MouseIn(1450, 860, 64, 64)) {HighSecurityPadlockConfigWhitelist = !HighSecurityPadlockConfigWhitelist; return;}
	}
}

/** @type {ExtendedItemScriptHookCallbacks.Exit<NoArchItemData>} */
function InventoryItemMiscHighSecurityPadlockExitHook(data, originalFunction) {
	if (originalFunction) originalFunction();
	ElementRemove("MemberNumberList");
}

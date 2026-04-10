// @ts-strict-ignore
"use strict";

/** @type {ExtendedItemScriptHookCallbacks.Draw<NoArchItemData>} */
function InventoryItemMiscTimerPadlockDrawHook(data, originalFunction) {
	if ((DialogFocusItem == null) || (DialogFocusSourceItem.Property.RemoveTimer < CurrentTime)) { DialogLeaveFocusItem(); return; }
	originalFunction();
	DrawText(AssetTextGet(DialogFocusItem.Asset.Group.Name + DialogFocusItem.Asset.Name + "Intro"), 1500, 600, "white", "gray");
	DrawText(InterfaceTextGet("TimerLeft") + " " + TimerToString(DialogFocusSourceItem.Property.RemoveTimer - CurrentTime), 1500, 500, "white", "gray");
	if ((DialogFocusSourceItem != null) && (DialogFocusSourceItem.Property != null) && (DialogFocusSourceItem.Property.LockMemberNumber != null))
		DrawText(InterfaceTextGet("LockMemberNumber") + " " + DialogFocusSourceItem.Property.LockMemberNumber.toString(), 1500, 700, "white", "gray");
	if ((Player.MemberNumber == DialogFocusSourceItem.Property.LockMemberNumber) && Player.CanInteract()) {
		MainCanvas.textAlign = "left";
		DrawButton(1100, 836, 64, 64, "", "White", (DialogFocusSourceItem.Property.RemoveItem) ? "Icons/Checked.png" : "");
		DrawText(InterfaceTextGet("RemoveItemWithTimer"), 1200, 868, "white", "gray");
		MainCanvas.textAlign = "center";
	} else DrawText(InterfaceTextGet((DialogFocusSourceItem.Property.RemoveItem) ? "WillRemoveItemWithTimer" : "WontRemoveItemWithTimer"), 1500, 868, "white", "gray");
	if (Player.CanInteract()) DrawButton(1350, 910, 300, 65, AssetTextGet("RestartTimer"), "White");
}

/** @type {ExtendedItemScriptHookCallbacks.Click<NoArchItemData>} */
function InventoryItemMiscTimerPadlockClickHook(data, originalFunction) {
	originalFunction();
	if (DialogFocusSourceItem == null) {
		// TODO: Let the click handlers return a boolean flag indicating whether a button has been clicked or not.
		// As a stop-gap measure simply check whether `DialogFocusSourceItem` has been de-initialized
		return;
	}

	if ((MouseX >= 1100) && (MouseX <= 1164) && (MouseY >= 836) && (MouseY <= 900) && (Player.MemberNumber == DialogFocusSourceItem.Property.LockMemberNumber) && Player.CanInteract()) {
		DialogFocusSourceItem.Property.RemoveItem = !(DialogFocusSourceItem.Property.RemoveItem);
		ChatRoomCharacterItemUpdate(CharacterGetCurrent());
	}
	if ((MouseX >= 1350) && (MouseX <= 1650) && (MouseY >= 910) && (MouseY <= 975) && Player.CanInteract()) {
		InventoryItemMiscTimerPadlockReset();
		DialogLeaveFocusItem();
	}
}

// When the timer resets
function InventoryItemMiscTimerPadlockReset() {
	const C = CharacterGetCurrent();
	if (DialogFocusItem.Asset.RemoveTimer > 0) DialogFocusSourceItem.Property.RemoveTimer = Math.round(CurrentTime + (DialogFocusItem.Asset.RemoveTimer * 1000));

	const Dictionary = new DictionaryBuilder()
		.sourceCharacter(Player)
		.destinationCharacter(C)
		.focusGroup(C.FocusGroup.Name)
		.build();
	ChatRoomPublishCustomAction("TimerRestart", true, Dictionary);
}

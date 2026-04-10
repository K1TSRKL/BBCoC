// @ts-strict-ignore
"use strict";

/** @type {ExtendedItemScriptHookCallbacks.Draw<NoArchItemData>} */
function InventoryItemMiscMistressPadlockDrawHook(data, originalFunction) {
	originalFunction();

	DrawText(AssetTextGet(DialogFocusItem.Asset.Group.Name + DialogFocusItem.Asset.Name + "Intro"), 1500, 600, "white", "gray");
	let LockMemberNumber = (DialogFocusSourceItem != null && DialogFocusSourceItem.Property != null && DialogFocusSourceItem.Property.LockMemberNumber != null) ? DialogFocusSourceItem.Property.LockMemberNumber : -1;
	if (typeof LockMemberNumber === "string") {
		LockMemberNumber = Number.parseInt(LockMemberNumber);
	}
	if (LockMemberNumber >= 0) {
		DrawText(`${InterfaceTextGet("LockMemberNumber")} ${LockMemberNumber}`, 1500, 700, "white", "gray");
	}
}

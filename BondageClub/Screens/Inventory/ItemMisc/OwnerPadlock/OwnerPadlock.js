// @ts-strict-ignore
"use strict";


/** @type {ExtendedItemScriptHookCallbacks.Draw<NoArchItemData>} */
function InventoryItemMiscOwnerPadlockDrawHook(data, originalFunction) {
	originalFunction();

	DrawText(AssetTextGet(DialogFocusItem.Asset.Group.Name + DialogFocusItem.Asset.Name + "Intro"), 1500, 600, "white", "gray");
	if ((DialogFocusSourceItem != null) && (DialogFocusSourceItem.Property != null) && (DialogFocusSourceItem.Property.LockMemberNumber != null))
		DrawText(InterfaceTextGet("LockMemberNumber") + " " + DialogFocusSourceItem.Property.LockMemberNumber.toString(), 1500, 700, "white", "gray");

	let msg = AssetTextGet(DialogFocusItem.Asset.Group.Name + DialogFocusItem.Asset.Name + "Detail");
	const subst = ChatRoomPronounSubstitutions(CurrentCharacter, "TargetPronoun", false);
	msg = CommonStringSubstitute(msg, subst);
	DrawText(msg, 1500, 800, "white", "gray");
}

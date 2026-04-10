// @ts-strict-ignore
"use strict";

/** @type {ExtendedItemScriptHookCallbacks.Load<NoArchItemData>} */
function InventoryItemMiscSafewordPadlockLoadHook(data, originalFunction) {
	if (!DialogFocusItem || !DialogFocusSourceItem) return DialogLeaveFocusItem();
	originalFunction();
	const Property = DialogFocusSourceItem.Property;
	const C = CharacterGetCurrent();

	if (InventoryItemMiscPasswordPadlockIsSet()) {
		// Normal lock interface
		ElementCreateInput("Password", "text", "", "8");
		// the current code is shown for owners, lovers and the member whose number is on the padlock
		// It is also shown for the person who is bound by it
		if (
			C.IsPlayer() ||
			Player.MemberNumber === Property.LockMemberNumber ||
			C.IsOwnedByPlayer() ||
			C.IsLoverOfPlayer()
		) {
			document.getElementById("Password").setAttribute("placeholder", Property.Password);
		}
	} else {
		// Set a password and hint
		ElementCreateInput("SetHint", "text", "", "140");
		ElementCreateInput("SetPassword", "text", "", "8");
		// the current code is shown for owners, lovers and the member whose number is on the padlock
		document.getElementById("SetPassword").setAttribute("placeholder", Property.Password);
		document.getElementById("SetHint").setAttribute("placeholder", Property.Hint);
	}
}

/** @type {ExtendedItemScriptHookCallbacks.Draw<NoArchItemData>} */
function InventoryItemMiscSafewordPadlockDrawHook(data, originalFunction) {
	if (!DialogFocusSourceItem) return;
	const Property = DialogFocusSourceItem.Property;
	if (Property?.LockMemberNumber != null) {
		DrawText(
			InterfaceTextGet("LockMemberNumber") + " " + Property.LockMemberNumber.toString(),
			1500, 600, "white", "gray",
		);
	}

	originalFunction();
	InventoryItemMiscPasswordPadlockDrawControls();
}

/** @type {ExtendedItemScriptHookCallbacks.Click<NoArchItemData>} */
function InventoryItemMiscSafewordPadlockClickHook(data, originalFunction) {
	originalFunction();
	InventoryItemMiscPasswordPadlockControlsClick();
}

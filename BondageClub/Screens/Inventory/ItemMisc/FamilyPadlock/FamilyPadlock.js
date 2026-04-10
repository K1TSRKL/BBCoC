"use strict";

/** @type {ExtendedItemScriptHookCallbacks.Draw<NoArchItemData>} */
function InventoryItemMiscFamilyPadlockDrawHook(data, originalFunction) {
	InventoryItemMiscOwnerPadlockDrawHook(data, originalFunction);
	if (LogQuery("BlockFamilyKey", "OwnerRule"))
		DrawText(AssetTextGet("ItemMiscFamilyPadlockDetailNoKey"), 1500, 900, "pink", "gray");
}

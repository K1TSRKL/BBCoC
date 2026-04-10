"use strict";

/**
 * @param {Character} C
 * @returns {boolean} - Whether the passed character is elligble for full control over the lock
 */
function InventoryItemMiscLoversTimerPadlockValidator(C) {
	return C.IsLoverOfPlayer() || C.IsOwnedByPlayer();
}

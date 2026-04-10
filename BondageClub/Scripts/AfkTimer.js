// @ts-strict-ignore
"use strict";

var AfkTimerTimout = 5 * 60 * 1000; // 5 minutes
var AfkTimerIsSet = false;
var AfkTimerLastEvent = 0;
/** @type {null | boolean} */
var AfkTimerIsEnabled = null;
var AfkTimerEventsList = ['mousedown', 'mousemove', 'keypress', 'touchstart'];
/** @type {null | ExpressionNameMap["Emoticon"]} */
var AfkTimerOldEmoticon = null;

/**
 * Resets the timer for AFK count
 * @returns {void} - Nothing
 */
function AfkTimerReset() {
	AfkTimerLastEvent = CommonTime();
	if (AfkTimerIsSet) {
		AfkTimerIsSet = false;
		CharacterSetFacialExpression(Player, "Emoticon", AfkTimerOldEmoticon);
		AfkTimerOldEmoticon = null;
	}
}

/**
 * Registers the AfkTimerReset method for every event that is listed in AfkTimerEventsList and starts the timer count.
 * @returns {void} - Nothing
 */
function AfkTimerStart() {
	AfkTimerLastEvent = CommonTime();
	AfkTimerEventsList.forEach(e => document.addEventListener(e, AfkTimerReset, true));
}

/**
 * Unregisters the AfkTimerReset method from all events listed in AfkTimerEventsList and stops the timer count
 * @returns {void} - Nothing
 */
function AfkTimerStop() {
	AfkTimerEventsList.forEach(e => document.removeEventListener(e, AfkTimerReset, true));
}

/**
 * Enables or disables the afk timer. Is called, when the player changes her settings in the preferences dialog
 * @param {boolean} Enabled - Determines, whether the afk timer will be enabled (true) or disabled (false).
 * @returns {void} - Nothing
 */
function AfkTimerSetEnabled(Enabled) {
	if (typeof Enabled !== 'boolean') return;
	if (AfkTimerIsEnabled == Enabled) return;
	AfkTimerIsEnabled = Enabled;

	if (AfkTimerIsEnabled)
		AfkTimerStart();
	else
		AfkTimerStop();
}

/**
 * Sets the players's emote to the Afk symbol, when the timer runs out and saves the current Emoticon, if there is any
 * @returns {void} - Nothing
 */
function AfkTimerSetIsAfk() {
	if (CurrentScreen != "ChatRoom") return;
	if (AfkTimerIsSet) return;
	if (AfkTimerLastEvent === 0 || AfkTimerLastEvent + AfkTimerTimout > CommonTime()) return;
	// save the current Emoticon, if there is any
	if (InventoryGet(Player, "Emoticon") && InventoryGet(Player, "Emoticon").Property && AfkTimerOldEmoticon == null) {
		AfkTimerOldEmoticon = /** @type {ExpressionNameMap["Emoticon"]} */(InventoryGet(Player, "Emoticon").Property.Expression);
	}
	CharacterSetFacialExpression(Player, "Emoticon", "Afk");
	AfkTimerIsSet = true;
}

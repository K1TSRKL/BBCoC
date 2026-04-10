// @ts-strict-ignore
"use strict";

/**
 * Loads the preference screen. This function is called dynamically, when the character enters the preference screen
 * for the first time
 * @returns {void} - Nothing
 */
function PreferenceSubscreenNotificationsLoad() {
	const NS = Player.NotificationSettings;
	PreferenceNotificationsCheckSetting(NS.Beeps);
	PreferenceNotificationsCheckSetting(NS.ChatMessage);
	PreferenceNotificationsCheckSetting(NS.ChatJoin);
	PreferenceNotificationsCheckSetting(NS.Disconnect);
	PreferenceNotificationsCheckSetting(NS.Test);
}

/**
 * If the setting's alert type is not allowed for this session, e.g. from using a new device/browser, reset it to 'None'
 * @param {NotificationSetting} setting - The notifications setting to check
 * @returns {void} - Nothing
 */
function PreferenceNotificationsCheckSetting(setting) {
	const type = NotificationAlertTypeList.find(N => N === setting.AlertType);
	if (type == null) setting.AlertType = NotificationAlertTypeList[0];
}

/**
 * Sets the notifications preferences for a player. Redirected to from the main Run function if the player is in the
 * notifications settings subscreen
 * @returns {void} - Nothing
 */
function PreferenceSubscreenNotificationsRun() {
	DrawCharacter(Player, 50, 50, 0.9);
	//PreferencePageChangeDraw(1705, 185, 2); // Uncomment when adding a 2nd page

	// Left-aligned text controls
	MainCanvas.textAlign = "left";
	const NS = Player.NotificationSettings;

	DrawText(TextGet("NotificationsExplanation"), 500, 190, "Black", "Gray");
	DrawEmptyRect(1140, 92, 510, 125, "Black", 2);
	DrawImage("Icons/Audio1.png", 1152, 97);
	DrawText(TextGet("NotificationsAudioExplanation1"), 1205, 125, "Black", "Gray");
	DrawText(TextGet("NotificationsAudioExplanation2"), 1150, 190, "Black", "Gray");


	if (PreferencePageCurrent === 1) {
		PreferenceNotificationsDrawSetting(500, 235, TextGet("NotificationsBeeps"), NS.Beeps);

		PreferenceNotificationsDrawSetting(500, 315, TextGet("NotificationsChatMessage"), NS.ChatMessage);
		DrawText(TextGet("NotificationsOnly"), 550, 427, "Black", "Gray");
		const chatMessageDisabled = NS.ChatMessage.AlertType === NotificationAlertType.NONE;
		DrawCheckbox(1500, 315, 64, 64, TextGet("NotificationsChatMessageMention"), NS.ChatMessage.Mention && !chatMessageDisabled, chatMessageDisabled);
		DrawCheckbox(700, 395, 64, 64, TextGet("NotificationsChatMessageNormal"), NS.ChatMessage.Normal && !chatMessageDisabled, chatMessageDisabled);
		DrawCheckbox(1150, 395, 64, 64, TextGet("NotificationsChatMessageWhisper"), NS.ChatMessage.Whisper && !chatMessageDisabled, chatMessageDisabled);
		DrawCheckbox(1500, 395, 64, 64, TextGet("NotificationsChatMessageActivity"), NS.ChatMessage.Activity && !chatMessageDisabled, chatMessageDisabled);

		PreferenceNotificationsDrawSetting(500, 475, TextGet("NotificationsChatJoin"), NS.ChatJoin);
		DrawText(TextGet("NotificationsOnly"), 550, 587, "Black", "Gray");
		const chatJoinDisabled = NS.ChatJoin.AlertType === NotificationAlertType.NONE;
		DrawCheckbox(700, 555, 64, 64, TextGet("NotificationsChatJoinOwner"), NS.ChatJoin.Owner && !chatJoinDisabled, chatJoinDisabled);
		DrawCheckbox(980, 555, 64, 64, TextGet("NotificationsChatJoinLovers"), NS.ChatJoin.Lovers && !chatJoinDisabled, chatJoinDisabled);
		DrawCheckbox(1260, 555, 64, 64, TextGet("NotificationsChatJoinFriendlist"), NS.ChatJoin.Friendlist && !chatJoinDisabled, chatJoinDisabled);
		DrawCheckbox(1540, 555, 64, 64, TextGet("NotificationsChatJoinSubs"), NS.ChatJoin.Subs && !chatJoinDisabled, chatJoinDisabled);

		PreferenceNotificationsDrawSetting(500, 635, TextGet("NotificationsDisconnect"), NS.Disconnect);
		PreferenceNotificationsDrawSetting(500, 715, TextGet("NotificationsLarp"), NS.Larp);
	}
	else if (PreferencePageCurrent === 2) {
		// New settings here
	}

	// Test buttons
	PreferenceNotificationsDrawSetting(500, 820, "", NS.Test);
	MainCanvas.textAlign = "center";
	DrawEmptyRect(500, 800, 1400, 0, "Black", 1);
	DrawButton(800, 820, 450, 64, TextGet("NotificationsTestRaise"), "White");
	DrawButton(1286, 820, 450, 64, TextGet("NotificationsTestReset"), "White");
}

/**
 * Draws the two checkbox row for a notifications setting
 * @param {number} Left - The X co-ordinate the row starts on
 * @param {number} Top - The Y co-ordinate the row starts on
 * @param {string} Text - The text for the setting's description
 * @param {NotificationSetting} Setting - The player setting the row corresponds to
 * @returns {void} - Nothing
 */
function PreferenceNotificationsDrawSetting(Left, Top, Text, Setting) {
	DrawBackNextButton(Left, Top, 164, 64, TextGet("NotificationsAlertType" + Setting.AlertType.toString()), "White", null, () => "", () => "");
	const Enabled = Setting.AlertType > 0;
	if (Enabled) {
		DrawButton(Left + 200, Top, 64, 64, "", "White", "Icons/Audio" + Setting.Audio.toString() + ".png");
	} else {
		DrawCheckbox(Left + 200, Top, 64, 64, "", false, true);
	}
	DrawText(Text, Left + 300, Top + 33, "Black", "Gray");
}

/**
 * Handles the click events for the notifications settings of a player.  Redirected from the main Click function.
 * @returns {void} - Nothing
 */
function PreferenceSubscreenNotificationsClick() {
	// Change pages
	//PreferencePageChangeClick(1705, 185, 2); // Uncomment when adding a 2nd page

	// Checkboxes
	const NS = Player.NotificationSettings;
	if (PreferencePageCurrent === 1) {
		PreferenceNotificationsClickSetting(500, 235, NS.Beeps, NotificationEventType.BEEP);

		PreferenceNotificationsClickSetting(500, 315, NS.ChatMessage, NotificationEventType.CHATMESSAGE);
		if (NS.ChatMessage.AlertType > 0) {
			if (MouseIn(1500, 315, 64, 64)) NS.ChatMessage.Mention = !NS.ChatMessage.Mention;
			if (MouseIn(700, 395, 64, 64)) NS.ChatMessage.Normal = !NS.ChatMessage.Normal;
			if (MouseIn(1150, 395, 64, 64)) NS.ChatMessage.Whisper = !NS.ChatMessage.Whisper;
			if (MouseIn(1500, 395, 64, 64)) NS.ChatMessage.Activity = !NS.ChatMessage.Activity;
		}

		PreferenceNotificationsClickSetting(500, 475, NS.ChatJoin, NotificationEventType.CHATJOIN);
		if (NS.ChatJoin.AlertType > 0) {
			if (MouseIn(700, 555, 64, 64)) NS.ChatJoin.Owner = !NS.ChatJoin.Owner;
			if (MouseIn(980, 555, 64, 64)) NS.ChatJoin.Lovers = !NS.ChatJoin.Lovers;
			if (MouseIn(1260, 555, 64, 64)) NS.ChatJoin.Friendlist = !NS.ChatJoin.Friendlist;
			if (MouseIn(1540, 555, 64, 64)) NS.ChatJoin.Subs = !NS.ChatJoin.Subs;
		}

		PreferenceNotificationsClickSetting(500, 635, NS.Disconnect, NotificationEventType.DISCONNECT);
		PreferenceNotificationsClickSetting(500, 715, NS.Larp, NotificationEventType.LARP);
	}
	else if (PreferencePageCurrent === 2) {
		// New settings here
	}

	// Test buttons
	PreferenceNotificationsClickSetting(500, 820, NS.Test, NotificationEventType.TEST);
	if (MouseIn(800, 820, 450, 64)) {
		NotificationRaise(NotificationEventType.TEST, { body: TextGet("NotificationsTestMessage"), character: Player, useCharAsIcon: true });
	}
	if (MouseIn(1286, 820, 450, 64)) NotificationResetAll();
}

/**
 * Handles the click events within a multi-checkbox settings row.
 * @param {number} Left - The X co-ordinate the row starts on
 * @param {number} Top - The Y co-ordinate the row starts on
 * @param {NotificationSetting} Setting - The player setting the row corresponds to
 * @param {NotificationEventType} EventType - The event type the setting corresponds to
 * @returns {void} - Nothing
 */
function PreferenceNotificationsClickSetting(Left, Top, Setting, EventType) {

	// Toggle the alert type
	if (MouseIn(Left, Top, 164, 64)) {
		if (EventType) NotificationReset(EventType);
		if (MouseXIn(Left, 83)) {
			let prevType = NotificationAlertTypeList.findIndex(N => N === Setting.AlertType) - 1;
			if (prevType < 0) prevType = NotificationAlertTypeList.length - 1;
			Setting.AlertType = NotificationAlertTypeList[prevType];
		}
		else if (MouseXIn(Left + 83, 83)) {
			let nextType = NotificationAlertTypeList.findIndex(N => N === Setting.AlertType) + 1;
			if (nextType > NotificationAlertTypeList.length - 1) nextType = 0;
			Setting.AlertType = NotificationAlertTypeList[nextType];
		}
	}

	// Toggle the audio type
	if (MouseIn(Left + 200, Top, 64, 64) && Setting.AlertType > 0) {
		let nextType = NotificationAudioTypeList.findIndex(N => N === Setting.Audio) + 1;
		if (nextType > NotificationAudioTypeList.length - 1) nextType = 0;
		Setting.Audio = NotificationAudioTypeList[nextType];
	}
}

/**
 * Exits the preference screen. Resets the test notifications.
 */
function PreferenceSubscreenNotificationsExit() {
	return true;
}

/**
 * Finalize notification setting when the screen is unloaded
 */
function PreferenceSubscreenNotificationsUnload() {
	// If any of the settings now have audio enabled, enable the AudioSettings setting as well
	let enableAudio = false;
	for (const setting in Player.NotificationSettings) {
		let audio = Player.NotificationSettings[setting]?.Audio;
		if (typeof audio === 'number' && audio > 0) enableAudio = true;
	}
	if (enableAudio) Player.AudioSettings.Notifications = true;

	NotificationReset(NotificationEventType.TEST);
}

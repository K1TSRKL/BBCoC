// @ts-strict-ignore
"use strict";

const PreferenceSubscreenRestrictionIDs = Object.freeze({
	grid: 'restriction-checkbox-grid',
	hint: 'restriction-label-hint',
});

/**
 * Runs and draw the preference screen, restriction subscreen
 * @returns {void} - Nothing
 */
function PreferenceSubscreenRestrictionLoad() {
	const disableButtons = Player.GetDifficulty() > 0;
	const settings = Player.RestrictionSettings;
	/** @type {(keyof RestrictionSettingsType)[]} */
	const settingsList = ["BypassStruggle", "SlowImmunity", "BypassNPCPunishments", "NoSpeechGarble"];
	const hintText = TextGet(disableButtons ? "RestrictionNoAccess" : "RestrictionAccess");

	const hintLabel = ElementCreate({
		tag: "span",
		attributes: { id: PreferenceSubscreenRestrictionIDs.hint },
		children: [hintText]
	});
	ElementWrap(PreferenceIDs.subscreen).append(hintLabel);

	const pairs = settingsList.map(s => {
		return ElementCheckbox.CreateLabelled(s, TextGet(`Restriction${s}`),
			(ev) => {
				settings[s] = /** @type {HTMLInputElement} */ (ev.target).checked;
			},
			{
				checked: settings[s],
				disabled: disableButtons,
				orientation: "horizontal"
			}
		);
	});

	const grid = ElementCreate({
		tag: "div",
		classList: ["preference-settings-grid", "scroll-box"],
		attributes: { id: PreferenceSubscreenRestrictionIDs.grid },
		children: [
			...pairs
		]
	});

	ElementWrap(PreferenceIDs.subscreen).append(grid);
}

/**
 * Runs and draw the preference screen, restriction subscreen
 * @returns {void} - Nothing
 */
function PreferenceSubscreenRestrictionRun() {
	DrawCharacter(Player, 50, 50, 0.9);
	MainCanvas.textAlign = "center";
}

/**
 * Handles the click events in the preference screen, restriction sub-screen, propagated from CommonClick()
 * @returns {void} - Nothing
 */
function PreferenceSubscreenRestrictionClick() {
	const settings = Player.RestrictionSettings;

	if (Player.GetDifficulty() === 0) {
		if (MouseIn(500, 325, 64, 64)) settings.BypassStruggle = !settings.BypassStruggle;
		if (MouseIn(500, 425, 64, 64)) settings.SlowImmunity = !settings.SlowImmunity;
		if (MouseIn(500, 525, 64, 64)) settings.BypassNPCPunishments = !settings.BypassNPCPunishments;
		if (MouseIn(500, 625, 64, 64)) settings.NoSpeechGarble = !settings.NoSpeechGarble;
	}
}

/**
 * Handles the click events in the preference screen, restriction sub-screen, propagated from CommonClick()
 * @returns {void} - Nothing
 */
function PreferenceSubscreenRestrictionResize() {
	ElementSetPosition(PreferenceSubscreenRestrictionIDs.grid, 500, 325);
	ElementSetPosition(PreferenceSubscreenRestrictionIDs.hint, 500, 200);
}

"use strict";

var PreferenceSettingsSensitivityList = [0.1, 0.2, 0.3, 0.4, 0.5, 0.6, 0.7, 0.8, 0.9, 1, 2, 3, 4, 5, 6, 7, 8, 9, 10];
var PreferenceSettingsSensitivityIndex = 13;
var PreferenceSettingsDeadZoneList = [0, 0.01, 0.02, 0.03, 0.04, 0.05, 0.06, 0.07, 0.08, 0.09, 0.1, 0.2, 0.3, 0.4, 0.5, 0.6, 0.7, 0.8, 0.9];
var PreferenceSettingsDeadZoneIndex = 1;
var PreferenceCalibrationStage = 0;

function PreferenceSubscreenControllerLoad() {
	ControllerSensitivity = Player.ControllerSettings.ControllerSensitivity;
	ControllerDeadZone = Player.ControllerSettings.ControllerDeadZone;
	PreferenceSettingsSensitivityIndex = PreferenceSettingsSensitivityList.indexOf(Player.ControllerSettings.ControllerSensitivity);
	PreferenceSettingsDeadZoneIndex = PreferenceSettingsDeadZoneList.indexOf(Player.ControllerSettings.ControllerDeadZone);
}

/**
 * Sets the controller preferences for the player. Redirected to from the main Run function.
 * @returns {void} - Nothing
 */
function PreferenceSubscreenControllerRun() {
	if (!ControllerIsCalibrating()) {
		DrawCharacter(Player, 50, 50, 0.9);
		MainCanvas.textAlign = "left";
		DrawText(TextGet("Sensitivity"), 800, 225, "Black", "Gray");
		DrawText(TextGet("DeadZone"), 800, 625, "Black", "Gray");
		DrawCheckbox(500, 272, 64, 64, TextGet("ControllerActive"), ControllerIsEnabled());

		DrawButton(500, 380, 400, 90, "", "White");
		DrawTextFit(TextGet("MapButtons"), 590, 425, 310, "Black");

		DrawButton(500, 480, 400, 90, "", "White");
		DrawTextFit(TextGet("MapSticks"), 590, 525, 310, "Black");

		DrawBackNextButton(500, 193, 250, 64, Player.ControllerSettings.ControllerSensitivity.toString(), "White", "",
			() => PreferenceSettingsSensitivityList[(PreferenceSettingsSensitivityIndex + PreferenceSettingsSensitivityList.length - 1) % PreferenceSettingsSensitivityList.length].toString(),
			() => PreferenceSettingsSensitivityList[(PreferenceSettingsSensitivityIndex + 1) % PreferenceSettingsSensitivityList.length].toString());
		DrawBackNextButton(500, 593, 250, 64, Player.ControllerSettings.ControllerDeadZone.toString(), "White", "",
			() => PreferenceSettingsDeadZoneList[(PreferenceSettingsDeadZoneIndex + PreferenceSettingsDeadZoneList.length - 1) % PreferenceSettingsDeadZoneList.length].toString(),
			() => PreferenceSettingsDeadZoneList[(PreferenceSettingsDeadZoneIndex + 1) % PreferenceSettingsDeadZoneList.length].toString() );
	} else {
		DrawButton(1815, 178, 90, 90, "", "White", "Icons/Cancel.png", TextGet("Skip"));
		const label = ControllerCalibrationStageLabel();
		DrawTextFit(label, 590, 425, 310, "Black");
	}
}

/**
 * Handles click events for the controller preference settings.  Redirected from the main Click function.
 * @returns {void} - Nothing
 */
function PreferenceSubscreenControllerClick() {
	if (MouseIn(1815, 178, 90, 90)) ControllerCalibrationNextStage(true);

	if (!ControllerIsCalibrating()) {

		if (MouseIn(500, 193, 250, 64)) {
			if (MouseX <= 625) PreferenceSettingsSensitivityIndex = (PreferenceSettingsSensitivityList.length + PreferenceSettingsSensitivityIndex - 1) % PreferenceSettingsSensitivityList.length;
			else PreferenceSettingsSensitivityIndex = (PreferenceSettingsSensitivityIndex + 1) % PreferenceSettingsSensitivityList.length;
			Player.ControllerSettings.ControllerSensitivity = PreferenceSettingsSensitivityList[PreferenceSettingsSensitivityIndex];
			ControllerSensitivity = Player.ControllerSettings.ControllerSensitivity;
		}
		if (MouseIn(500, 593, 250, 64)) {
			if (MouseX <= 625) PreferenceSettingsDeadZoneIndex = (PreferenceSettingsDeadZoneList.length + PreferenceSettingsDeadZoneIndex - 1) % PreferenceSettingsDeadZoneList.length;
			else PreferenceSettingsDeadZoneIndex = (PreferenceSettingsDeadZoneIndex + 1) % PreferenceSettingsDeadZoneList.length;
			Player.ControllerSettings.ControllerDeadZone = PreferenceSettingsDeadZoneList[PreferenceSettingsDeadZoneIndex];
			ControllerDeadZone = Player.ControllerSettings.ControllerDeadZone;
		}

		if (MouseIn(590, 400, 310, 90)) {
			ControllerStartCalibration("buttons");
		}

		if (MouseIn(590, 500, 310, 90)) {
			ControllerStartCalibration("axis");
		}

		if (MouseIn(500, 272, 64, 64)) {
			Player.ControllerSettings.ControllerActive = !Player.ControllerSettings.ControllerActive;
			ControllerClearAreas();
			ControllerStart();
		}
	}
}

/**
 * Exits the preference screen
 */
function PreferenceSubscreenControllerExit() {
	return true;
}

function PreferenceSubscreenControllerUnload() {
	ControllerStopCalibration(true);
}

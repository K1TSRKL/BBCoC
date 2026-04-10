// @ts-strict-ignore
"use strict";

/** @type {SettingsVFXName[]} */
var PreferenceSettingsVFXList = ["VFXInactive", "VFXSolid", "VFXAnimatedTemp", "VFXAnimated"];
var PreferenceSettingsVFXIndex = 0;
/** @type {SettingsVFXVibratorName[]} */
var PreferenceSettingsVFXVibratorList = ["VFXVibratorInactive", "VFXVibratorSolid", "VFXVibratorAnimated"];
var PreferenceSettingsVFXVibratorIndex = 0;
/** @type {SettingsVFXFilterName[]} */
var PreferenceSettingsVFXFilterList = ["VFXFilterLight", "VFXFilterMedium", "VFXFilterHeavy", "VFXFilterNone"];
var PreferenceSettingsVFXFilterIndex = 0;
/** @type {GraphicsFontName[]} */
var PreferenceGraphicsFontList = ["Arial", "TimesNewRoman", "Papyrus", "ComicSans", "Impact", "HelveticaNeue", "Verdana", "CenturyGothic", "Georgia", "CourierNew", "Copperplate"];
/** @type {WebGLPowerPreference[]} */
var PreferenceGraphicsPowerModes = ["low-power", "default", "high-performance"];
var PreferenceGraphicsFontIndex = 0;
/** @type {null | number} */
var PreferenceGraphicsAnimationQualityIndex = null;
/** @type {null | number} */
var PreferenceGraphicsPowerModeIndex = null;
/** @type {null | WebGLContextAttributes} */
var PreferenceGraphicsWebGLOptions = null;
var PreferenceGraphicsAnimationQualityList = [10000, 2000, 200, 100, 50, 0];
var PreferenceGraphicsFrameLimit = [0, 10, 15, 30, 60];


/**
 * Prepares the graphics settings subscreen
 */
function PreferenceSubscreenGraphicsLoad() {
	PreferenceSettingsVFXIndex = (PreferenceSettingsVFXList.indexOf(Player.ArousalSettings.VFX) < 0) ? 0 : PreferenceSettingsVFXList.indexOf(Player.ArousalSettings.VFX);
	PreferenceSettingsVFXVibratorIndex = (PreferenceSettingsVFXVibratorList.indexOf(Player.ArousalSettings.VFXVibrator) < 0) ? 0 : PreferenceSettingsVFXVibratorList.indexOf(Player.ArousalSettings.VFXVibrator);
	PreferenceSettingsVFXFilterIndex = (PreferenceSettingsVFXFilterList.indexOf(Player.ArousalSettings.VFXFilter) < 0) ? 0 : PreferenceSettingsVFXFilterList.indexOf(Player.ArousalSettings.VFXFilter);

	PreferenceGraphicsFontIndex = (PreferenceGraphicsFontList.indexOf(Player.GraphicsSettings.Font) < 0) ? 0 : PreferenceGraphicsFontList.indexOf(Player.GraphicsSettings.Font);
	PreferenceGraphicsAnimationQualityIndex = (PreferenceGraphicsAnimationQualityList.indexOf(Player.GraphicsSettings.AnimationQuality) < 0) ? 0 : PreferenceGraphicsAnimationQualityList.indexOf(Player.GraphicsSettings.AnimationQuality);
	PreferenceGraphicsWebGLOptions = GLDrawGetOptions();
	PreferenceGraphicsPowerModeIndex = (PreferenceGraphicsPowerModes.indexOf(PreferenceGraphicsWebGLOptions.powerPreference) < 0) ? 0 : PreferenceGraphicsPowerModes.indexOf(PreferenceGraphicsWebGLOptions.powerPreference);

}

/**
 * Sets the graphical preferences for a player. Redirected to from the main Run function if the player is in the
 * visibility settings subscreen
 * @returns {void} - Nothing
 */
function PreferenceSubscreenGraphicsRun() {
	DrawCharacter(Player, 50, 50, 0.9);

	MainCanvas.textAlign = "center";
	PreferencePageChangeDraw(1595, 75, 2); // Uncomment when adding a 2nd page

	MainCanvas.textAlign = "left";

	if (PreferencePageCurrent === 1) {
		DrawText(TextGet("VFX"), 800, 216, "Black", "Gray");
		DrawText(TextGet("GraphicsFont"), 800, 306, "Black", "Gray");
		DrawTextFit(TextGet("GraphicsFontDisclaimer"), 500, 376, 1400, "Black", "Gray");
		DrawCheckbox(500, 430, 64, 64, TextGet("GraphicsInvertRoom"), Player.GraphicsSettings.InvertRoom);
		DrawCheckbox(500, 510, 64, 64, TextGet("GraphicsStimulationFlash"), Player.GraphicsSettings.StimulationFlash);
		DrawCheckbox(500, 590, 64, 64, TextGet("DoBlindFlash"), Player.GraphicsSettings.DoBlindFlash);
		DrawText(TextGet("GeneralAnimationQualityText"), 750, 712, "Black", "Gray");
		if (GLVersion !== "No WebGL") {
			DrawCheckbox(500, 765, 64, 64, TextGet("GraphicsAntialiasing"), PreferenceGraphicsWebGLOptions.antialias);
			DrawText(TextGet("GraphicsPowerMode"), 880, 885, "Black", "Gray");
		} else {
			DrawText(TextGet("GraphicsNoWebGL"), 700, 810, "Red", "Gray");
		}

		DrawBackNextButton(500, 182, 250, 64, TextGet(Player.ArousalSettings.VFX), "White", "",
			() => TextGet(PreferenceSettingsVFXList[(PreferenceSettingsVFXIndex + PreferenceSettingsVFXList.length - 1) % PreferenceSettingsVFXList.length]),
			() => TextGet(PreferenceSettingsVFXList[(PreferenceSettingsVFXIndex + 1) % PreferenceSettingsVFXList.length]));

		DrawBackNextButton(500, 270, 250, 64, TextGet(Player.GraphicsSettings.Font), "White", "",
			() => TextGet(PreferenceGraphicsFontList[(PreferenceGraphicsFontIndex + PreferenceGraphicsFontList.length - 1) % PreferenceGraphicsFontList.length]),
			() => TextGet(PreferenceGraphicsFontList[(PreferenceGraphicsFontIndex + 1) % PreferenceGraphicsFontList.length]));

		DrawBackNextButton(500, 680, 200, 64, TextGet("GeneralAnimationQuality" + Player.GraphicsSettings.AnimationQuality), "White", "",
			() => PreferenceGraphicsAnimationQualityIndex == 0 ? "" : TextGet("GeneralAnimationQuality" + PreferenceGraphicsAnimationQualityList[PreferenceGraphicsAnimationQualityIndex - 1].toString()),
			() => PreferenceGraphicsAnimationQualityIndex == PreferenceGraphicsAnimationQualityList.length - 1 ? "" : TextGet("GeneralAnimationQuality" + PreferenceGraphicsAnimationQualityList[PreferenceGraphicsAnimationQualityIndex + 1].toString()));
		if (GLVersion !== "No WebGL") {
			DrawBackNextButton(500, 850, 360, 64, TextGet("PowerMode" + PreferenceGraphicsPowerModes[PreferenceGraphicsPowerModeIndex]), "White", "",
				() => PreferenceGraphicsPowerModeIndex == 0 ? "" : TextGet("PowerMode" + PreferenceGraphicsPowerModes[PreferenceGraphicsPowerModeIndex - 1].toString()),
				() => PreferenceGraphicsPowerModeIndex == PreferenceGraphicsPowerModes.length - 1 ? "" : TextGet("PowerMode" + PreferenceGraphicsPowerModes[PreferenceGraphicsPowerModeIndex + 1].toString()));
		}
	} else if (PreferencePageCurrent === 2) {
		DrawText(TextGet("VFXFilter"), 1000, 216, "Black", "Gray");
		DrawText(TextGet("VFXVibrator"), 1000, 456, "Black", "Gray");
		DrawText(TextGet("FPSFocusedLimit"), 1000, 616, "Black", "Gray");
		DrawText(TextGet("FPSUnfocusedLimit"), 1000, 696, "Black", "Gray");
		DrawCheckbox(500, 270, 64, 64, TextGet("SmoothZoom"), Player.GraphicsSettings.SmoothZoom);
		DrawCheckbox(500, 350, 64, 64, TextGet("CenterChatrooms"), Player.GraphicsSettings.CenterChatrooms);
		DrawCheckbox(500, 510, 64, 64, TextGet("AllowBlur"), Player.GraphicsSettings.AllowBlur);

		DrawBackNextButton(500, 190, 450, 64, TextGet(Player.ArousalSettings.VFXFilter || PreferenceSettingsVFXFilterList[PreferenceSettingsVFXFilterIndex]), "White", "",
			() => TextGet(PreferenceSettingsVFXFilterList[(PreferenceSettingsVFXFilterIndex + PreferenceSettingsVFXFilterList.length - 1) % PreferenceSettingsVFXFilterList.length]),
			() => TextGet(PreferenceSettingsVFXFilterList[(PreferenceSettingsVFXFilterIndex + 1) % PreferenceSettingsVFXFilterList.length]));

		DrawBackNextButton(500, 430, 450, 64, TextGet(Player.ArousalSettings.VFXVibrator), "White", "",
			() => TextGet(PreferenceSettingsVFXVibratorList[(PreferenceSettingsVFXVibratorIndex + PreferenceSettingsVFXVibratorList.length - 1) % PreferenceSettingsVFXVibratorList.length]),
			() => TextGet(PreferenceSettingsVFXVibratorList[(PreferenceSettingsVFXVibratorIndex + 1) % PreferenceSettingsVFXVibratorList.length]));

		DrawBackNextButton(500, 590, 450, 64, TextGet(`MaxFPS${Player.GraphicsSettings.MaxFPS}`), "White", "",
			() => {
				const index = CommonModulo(PreferenceGraphicsFrameLimit.indexOf(Player.GraphicsSettings.MaxFPS) - 1, PreferenceGraphicsFrameLimit.length);
				const key = `MaxFPS${PreferenceGraphicsFrameLimit[index]}`;
				return TextGet(key);
			},
			() => {
				const index = CommonModulo(PreferenceGraphicsFrameLimit.indexOf(Player.GraphicsSettings.MaxFPS) + 1, PreferenceGraphicsFrameLimit.length);
				const key = `MaxFPS${PreferenceGraphicsFrameLimit[index]}`;
				return TextGet(key);
			}
		);

		DrawBackNextButton(500, 670, 450, 64, TextGet(`MaxFPS${Player.GraphicsSettings.MaxUnfocusedFPS}`), "White", "",
			() => {
				const index = CommonModulo(PreferenceGraphicsFrameLimit.indexOf(Player.GraphicsSettings.MaxUnfocusedFPS) - 1, PreferenceGraphicsFrameLimit.length);
				const key = `MaxFPS${PreferenceGraphicsFrameLimit[index]}`;
				return TextGet(key);
			},
			() => {
				const index = CommonModulo(PreferenceGraphicsFrameLimit.indexOf(Player.GraphicsSettings.MaxUnfocusedFPS) + 1, PreferenceGraphicsFrameLimit.length);
				const key = `MaxFPS${PreferenceGraphicsFrameLimit[index]}`;
				return TextGet(key);
			}
		);

		MainCanvas.textAlign = "left";
		DrawCheckbox(500, 750, 64, 64, TextGet("ShowFPS"), Player.GraphicsSettings.ShowFPS);
	}
}

/**
 * Handles click events for the audio preference settings.  Redirected from the main Click function.
 * @returns {void} - Nothing
 */
function PreferenceSubscreenGraphicsClick() {

	// Change page
	PreferencePageChangeClick(1595, 75, 2); // Uncomment when adding a 2nd page

	if (PreferencePageCurrent === 1) {
		if (MouseIn(500, 182, 250, 64)) {
			if (MouseX <= 625) PreferenceSettingsVFXIndex = (PreferenceSettingsVFXList.length + PreferenceSettingsVFXIndex - 1) % PreferenceSettingsVFXList.length;
			else PreferenceSettingsVFXIndex = (PreferenceSettingsVFXIndex + 1) % PreferenceSettingsVFXList.length;
			Player.ArousalSettings.VFX = PreferenceSettingsVFXList[PreferenceSettingsVFXIndex];
		}
		if (MouseIn(500, 270, 250, 64)) {
			if (MouseX <= 625) PreferenceGraphicsFontIndex = (PreferenceGraphicsFontList.length + PreferenceGraphicsFontIndex - 1) % PreferenceGraphicsFontList.length;
			else PreferenceGraphicsFontIndex = (PreferenceGraphicsFontIndex + 1) % PreferenceGraphicsFontList.length;
			Player.GraphicsSettings.Font = PreferenceGraphicsFontList[PreferenceGraphicsFontIndex];
			CommonGetFont.clearCache();
			CommonGetFontName.clearCache();
			DrawingGetTextSize.clearCache();
		}
		if (MouseIn(500, 430, 64, 64)) Player.GraphicsSettings.InvertRoom = !Player.GraphicsSettings.InvertRoom;
		if (MouseIn(500, 510, 64, 64)) Player.GraphicsSettings.StimulationFlash = !Player.GraphicsSettings.StimulationFlash;
		if (MouseIn(500, 590, 64, 64)) Player.GraphicsSettings.DoBlindFlash = !Player.GraphicsSettings.DoBlindFlash;
		if (MouseIn(500, 680, 200, 64)) {
			if (MouseX <= 600) {
				if (PreferenceGraphicsAnimationQualityIndex > 0) PreferenceGraphicsAnimationQualityIndex--;
			} else {
				if (PreferenceGraphicsAnimationQualityIndex < PreferenceGraphicsAnimationQualityList.length - 1) PreferenceGraphicsAnimationQualityIndex++;
			}
			Player.GraphicsSettings.AnimationQuality = PreferenceGraphicsAnimationQualityList[PreferenceGraphicsAnimationQualityIndex];
		}
		if (GLVersion !== "No WebGL" && MouseIn(500, 850, 360, 64)) {
			if (MouseX <= 678) {
				PreferenceGraphicsPowerModeIndex = Math.max(0, PreferenceGraphicsPowerModeIndex - 1);
			} else {
				PreferenceGraphicsPowerModeIndex = Math.min(PreferenceGraphicsPowerModeIndex + 1, PreferenceGraphicsPowerModes.length - 1);
			}
			PreferenceGraphicsWebGLOptions.powerPreference = PreferenceGraphicsPowerModes[PreferenceGraphicsPowerModeIndex];
		}
		if (GLVersion !== "No WebGL" && MouseIn(500, 765, 64, 64)) {
			PreferenceGraphicsWebGLOptions.antialias = !PreferenceGraphicsWebGLOptions.antialias;
		}
	} if (PreferencePageCurrent === 2) {
		if (MouseIn(500, 190, 450, 64)) {
			if (MouseX <= 825) PreferenceSettingsVFXFilterIndex = (PreferenceSettingsVFXFilterList.length + PreferenceSettingsVFXFilterIndex - 1) % PreferenceSettingsVFXFilterList.length;
			else PreferenceSettingsVFXFilterIndex = (PreferenceSettingsVFXFilterIndex + 1) % PreferenceSettingsVFXFilterList.length;
			Player.ArousalSettings.VFXFilter = PreferenceSettingsVFXFilterList[PreferenceSettingsVFXFilterIndex];
		}
		if (MouseIn(500, 270, 64, 64)) Player.GraphicsSettings.SmoothZoom = !Player.GraphicsSettings.SmoothZoom;
		if (MouseIn(500, 350, 64, 64)) Player.GraphicsSettings.CenterChatrooms = !Player.GraphicsSettings.CenterChatrooms;
		if (MouseIn(500, 430, 450, 64)) {
			if (MouseX <= 825) PreferenceSettingsVFXVibratorIndex = (PreferenceSettingsVFXVibratorList.length + PreferenceSettingsVFXVibratorIndex - 1) % PreferenceSettingsVFXVibratorList.length;
			else PreferenceSettingsVFXVibratorIndex = (PreferenceSettingsVFXVibratorIndex + 1) % PreferenceSettingsVFXVibratorList.length;
			Player.ArousalSettings.VFXVibrator = PreferenceSettingsVFXVibratorList[PreferenceSettingsVFXVibratorIndex];
		}
		if (MouseIn(500, 510, 64, 64)) Player.GraphicsSettings.AllowBlur = !Player.GraphicsSettings.AllowBlur;
		if (MouseIn(500, 590, 450, 64)) {
			const dir = MouseX <= 825 ? -1 : 1;
			const idx = CommonModulo(PreferenceGraphicsFrameLimit.indexOf(Player.GraphicsSettings.MaxFPS) + dir, PreferenceGraphicsFrameLimit.length);
			Player.GraphicsSettings.MaxFPS = PreferenceGraphicsFrameLimit[idx];
		}
		if (MouseIn(500, 670, 450, 64)) {
			const dir = MouseX <= 825 ? -1 : 1;
			const idx = CommonModulo(PreferenceGraphicsFrameLimit.indexOf(Player.GraphicsSettings.MaxUnfocusedFPS) + dir, PreferenceGraphicsFrameLimit.length);
			Player.GraphicsSettings.MaxUnfocusedFPS = PreferenceGraphicsFrameLimit[idx];
		}
		if (MouseIn(500, 750, 64, 64)) Player.GraphicsSettings.ShowFPS = !Player.GraphicsSettings.ShowFPS;
	}
}

function PreferenceSubscreenGraphicsExit() {
	return true;
}

/**
 * Finalize graphics setting when the screen is unloaded
 */
function PreferenceSubscreenGraphicsUnload() {
	// Reload WebGL if graphic settings have changed.
	const currentOptions = GLDrawGetOptions();
	if (
		GLVersion !== "No WebGL" &&
		(currentOptions.powerPreference != PreferenceGraphicsWebGLOptions.powerPreference ||
			currentOptions.antialias != PreferenceGraphicsWebGLOptions.antialias)
	) {
		// This uses localStorage so the option is taken into account even at the login screen,
		// since we don't have any idea about the user's GL configuration at that point.
		GLDrawSetOptions(PreferenceGraphicsWebGLOptions);
		GLDrawResetCanvas();
	}
}

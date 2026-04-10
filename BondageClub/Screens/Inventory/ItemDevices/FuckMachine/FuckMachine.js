// @ts-strict-ignore
"use strict";

/**
 * @typedef {{ DildoState?: number, Modifier?: number, Speed?: number, FuckChangeTime?: number, Mode?: VibratorMode, ChangeTime?: number, LastChange?: number }} FuckMachinePersistentData
 */

/** @type {ExtendedItemScriptHookCallbacks.BeforeDraw<VibratingItemData, FuckMachinePersistentData>} */
function AssetsItemDevicesFuckMachineBeforeDrawHook(data, originalFunction, { PersistentData, L, Y, Property }) {
	const Data = PersistentData();
	if (typeof Data.DildoState !== "number") Data.DildoState = 0;
	if (typeof Data.Modifier !== "number") Data.Modifier = 1;

	if (L === "Dildo") return { Y: Y + Data.DildoState };
	if (L !== "Pole") return;

	const Properties = Property || {};
	const Intensity = typeof Properties.Intensity === "number" ? Properties.Intensity : -1;


	const FuckLength = 32;
	const AnimationQualityRatio = (Player.GraphicsSettings ? Math.max(Player.GraphicsSettings.AnimationQuality * 0.6, 30) : 30) / 30;
	Data.Speed = (Intensity + 1) * 2;
	if (Data.DildoState >= FuckLength && Intensity > -1) {
		Data.Modifier = -1;
	} else if (Data.DildoState <= -FuckLength) {
		Data.Modifier = 1;
	} else if (Data.DildoState <= FuckLength && Intensity === -1) {
		Data.Modifier = 1;
		Data.Speed = 1;
	}

	Data.DildoState += Data.Modifier * Data.Speed * AnimationQualityRatio;
	if (AnimationQualityRatio > FuckLength) Data.DildoState = Math.random() * FuckLength;

	return { Y: Y + Data.DildoState };
}

/** @type {ExtendedItemScriptHookCallbacks.ScriptDraw<VibratingItemData, FuckMachinePersistentData>} */
function AssetsItemDevicesFuckMachineScriptDrawHook(data, originalFunction, drawData) {
	VibratorModeScriptDraw(data, drawData);
	const Data = drawData.PersistentData();
	const Properties = drawData.Item.Property || {};
	const FrameTime = Player.GraphicsSettings ? Math.max(30, (Player.GraphicsSettings.AnimationQuality * 0.6)) : 30;
	const Intensity = typeof Properties.Intensity === "number" ? Properties.Intensity : -1;
	const FuckLength = 32;

	if (typeof Data.FuckChangeTime !== "number") Data.FuckChangeTime = CommonTime() + FrameTime;
	if (typeof Data.DildoState !== "number") Data.DildoState = 0;

	if (Data.FuckChangeTime < CommonTime() && !(Intensity === -1 && FuckLength <= Data.DildoState)) {
		Data.FuckChangeTime = CommonTime() + FrameTime;
		AnimationRequestRefreshRate(drawData.C, FrameTime);
		AnimationRequestDraw(drawData.C);
	}
}

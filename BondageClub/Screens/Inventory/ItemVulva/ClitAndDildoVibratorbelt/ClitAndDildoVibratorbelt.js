// @ts-strict-ignore
"use strict";

/** @type {ExtendedItemScriptHookCallbacks.Draw<ModularItemData>} */
function InventoryItemVulvaClitAndDildoVibratorbeltDrawHook(Data, OriginalFunction) {
	OriginalFunction();
	if (Data.currentModule === ModularItemBase) {
		const typeRecord = DialogFocusItem.Property.TypeRecord || {};
		const [DildoIntensity, EggIntensity] = Data.modules.map(m => `${m.Key}${typeRecord[m.Key] || 0}`);

		// Display option information
		MainCanvas.textAlign = "right";
		DrawText(AssetTextGet("DildoIntensity"), 1500, 565, "White", "Gray");
		DrawText(AssetTextGet("EggIntensity"), 1500, 640, "White", "Gray");
		MainCanvas.textAlign = "left";
		DrawText(AssetTextGet(`${Data.dialogPrefix.option}${DildoIntensity}`), 1510, 565, "White", "Gray");
		DrawText(AssetTextGet(`${Data.dialogPrefix.option}${EggIntensity}`), 1510, 640, "White", "Gray");
		MainCanvas.textAlign = "center";
	}
}

/** @type {ExtendedItemScriptHookCallbacks.SetOption<ModularItemData, ModularItemOption>} */
function InventoryItemVulvaClitAndDildoVibratorbeltSetOptionHook(data, originalFunction, C, item, newOption, previousOption, push, refresh) {
	// Ensure that the vibrator intensity is set to the maximum of the egg and dildo intensity
	originalFunction(C, item, newOption, previousOption, false, false);
	const CurrentModuleValues = ModularItemParseCurrent(data, item.Property.TypeRecord);
	const Intensities = data.modules.map((m, i) => m.Options[CurrentModuleValues[i]].Property.Intensity);
	item.Property.Intensity = /** @type {VibratorIntensity}*/(Math.max(...Intensities));
	CharacterRefresh(C, push, false);
}

// @ts-strict-ignore
"use strict";

/** Map the names of the love chastity belt front + black shield options to its scifi pleasure panties equivalent. */
const InventoryItemPelvisLoveChastityBeltCrotchShield = new Map([
	["f0b0", "c0"],
	["f1b0", "c1"],
	["f2b0", "c1"],
	["f3b0", "c1"],
	["f0b1", "c2"],
	["f1b1", "c3"],
	["f2b1", "c3"],
	["f3b1", "c3"],
]);

/** @type {ExtendedItemScriptHookCallbacks.Draw<ModularItemData>} */
function InventoryItemPelvisLoveChastityBeltDraw(Data, OriginalFunction) {
	OriginalFunction();
	if (Data.currentModule === ModularItemBase) {
		const typeRecord = DialogFocusItem.Property.TypeRecord || {};
		const [FrontShield, BackShield, Intensity, ShockLevel] = Data.modules.map(m => `${m.Key}${typeRecord[m.Key] || 0}`);
		const CrotchShield = InventoryItemPelvisLoveChastityBeltCrotchShield.get(`${FrontShield}${BackShield}`);
		const ShieldSuffix = (["f2", "f3"].includes(FrontShield)) ? "" : ` (${AssetTextGet(`${Data.dialogPrefix.option}${FrontShield}`)})`;

		// Display option information
		MainCanvas.save();
		MainCanvas.textAlign = "right";
		DrawText(AssetTextGet("ItemPelvisSciFiPleasurePantiesModuleCrotchShield") + ":", 1500, 625, "White", "Gray");
		DrawText(AssetTextGet(`${Data.dialogPrefix.module}Intensity`) + ":", 1500, 700, "White", "Gray");
		DrawText(AssetTextGet(`${Data.dialogPrefix.module}ShockLevel`) + ":", 1500, 775, "White", "Gray");
		MainCanvas.textAlign = "left";
		DrawText(AssetTextGet(`ItemPelvisSciFiPleasurePantiesOption${CrotchShield}`) + ShieldSuffix, 1510, 625, "White", "Gray");
		DrawText(AssetTextGet(`${Data.dialogPrefix.option}${Intensity}`), 1510, 700, "White", "Gray");
		DrawText(AssetTextGet(`${Data.dialogPrefix.option}${ShockLevel}`), 1510, 775, "White", "Gray");
		MainCanvas.restore();

		// Display the ShowText checkbox
		ExtendedItemDrawCheckbox("ShowText", 1175, 818, DialogFocusItem.Property.ShowText, { changeWhenLocked: false });
		DrawText(AssetTextGet("ShowMessageInChat"), 1420, 848, "White", "Gray");

		// Display the manual shock button
		ExtendedItemCustomDraw("TriggerShock", 1637, 825);
	}
}

/** @type {ExtendedItemScriptHookCallbacks.SetOption<ModularItemData, ModularItemOption>} */
function InventoryItemPelvisLoveChastityBeltSetOptionHook(data, originalFunction, C, item, newOption, previousOption, push, refresh) {
	originalFunction(C, item, newOption, previousOption, false, false);

	// Switch off the vibe module if the corresponding front shield is removed
	if (previousOption.Name === "f2") { // 2 - close front & vibrator
		ExtendedItemRequirementCheckMessageMemo.clearCache();
		const previousModuleValues = ModularItemParseCurrent(data, item.Property.TypeRecord);
		const vibePreviousOption = data.modules[2].Options[previousModuleValues[2]];
		const vibeNewOption = data.modules[2].Options[0];
		return originalFunction(C, item, vibeNewOption, vibePreviousOption, push, refresh);
	} else {
		CharacterRefresh(C, push, false);
	}
}

/** @type {ExtendedItemScriptHookCallbacks.Validate<ModularItemData, ModularItemOption>} */
function InventoryItemPelvisLoveChastityBeltValidate(Data, OriginalFunction, C, Item, Option, CurrentOption) {
	const Prefix = `${Item.Asset.Group.Name}${Item.Asset.Name}`;
	const Module = Data.modules.find((m) => m.Key === Option.Name[0]) || { Name: null };
	const FrontShield = ModularItemParseCurrent(Data, Item.Property.TypeRecord)[0];
	/** @type {string} */
	const optionName = Option.Name;

	if (!C.IsOwnedByPlayer()) {
		return AssetTextGet("PreviewIconOwnerOnly");
	} else if (Module.Name === "Intensity" && Option.Name !== "i0" && FrontShield !== 2) {
		return AssetTextGet(`${Prefix}ValidateIntensity`);
	} else if (optionName === "TriggerShock" && FrontShield !== 3) {
		return AssetTextGet(`${Prefix}ValidateTriggerShock`);
	} else {
		return OriginalFunction(C, Item, Option, CurrentOption);
	}
}

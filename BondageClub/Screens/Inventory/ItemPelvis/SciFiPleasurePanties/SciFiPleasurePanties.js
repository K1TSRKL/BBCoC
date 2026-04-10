// @ts-strict-ignore
"use strict";

/** @type {ExtendedItemScriptHookCallbacks.Draw<ModularItemData>} */
function InventoryItemPelvisSciFiPleasurePantiesDrawHook(Data, OriginalFunction) {
	if (!FuturisticAccessDraw(Data, OriginalFunction)) {
		return;
	}
	if (Data.currentModule === ModularItemBase) {
		const typeRecord = DialogFocusItem.Property.TypeRecord || {};
		const [CrotchShield, Intensity, OrgasmLock, ShockLevel] = Data.modules.map(m => `${m.Key}${typeRecord[m.Key] || 0}`);
		const IntensitySuffix = (OrgasmLock === "o0") ? "" : ` (${AssetTextGet(`${Data.dialogPrefix.option}${OrgasmLock}`)})`;

		// Display option information
		MainCanvas.save();
		MainCanvas.textAlign = "right";
		DrawText(AssetTextGet(`${Data.dialogPrefix.module}CrotchShield`) + ":", 1500, 625, "White", "Gray");
		DrawText(AssetTextGet(`${Data.dialogPrefix.module}Intensity`) + ":", 1500, 700, "White", "Gray");
		DrawText(AssetTextGet(`${Data.dialogPrefix.module}ShockLevel`) + ":", 1500, 775, "White", "Gray");
		MainCanvas.textAlign = "left";
		DrawText(AssetTextGet(`${Data.dialogPrefix.option}${CrotchShield}`), 1510, 625, "White", "Gray");
		DrawText(AssetTextGet(`${Data.dialogPrefix.option}${Intensity}`) + IntensitySuffix, 1510, 700, "White", "Gray");
		DrawText(AssetTextGet(`${Data.dialogPrefix.option}${ShockLevel}`), 1510, 775, "White", "Gray");
		MainCanvas.restore();

		// Display the ShowText checkbox
		ExtendedItemDrawCheckbox("ShowText", 1175, 743, DialogFocusItem.Property.ShowText, { changeWhenLocked: false });
		DrawText(AssetTextGet("ShowMessageInChat"), 1420, 848, "White", "Gray");

		// Display the manual shock button
		ExtendedItemCustomDraw("TriggerShock", 1637, 825, null, false, false);
	}
}

/** @type {ExtendedItemScriptHookCallback<ModularItemData, [Futuristic?: boolean]>} */
function InventoryItemPelvisSciFiPleasurePantiesClickHook(Data, OriginalFunction, Futuristic=true) {
	if (!Futuristic) {
		OriginalFunction();
	} else if (!FuturisticAccessClick(Data, OriginalFunction)) {
		return;
	}

	if (DialogFocusItem && Data.currentModule === ModularItemBase) {
		if (MouseIn(1175, 818, 64, 64) && !ExtendedItemPermissionMode) {
			const C = CharacterGetCurrent();
			const property = DialogFocusItem.Property;
			ExtendedItemCustomClickAndPush(C, DialogFocusItem, "ShowText", () => property.ShowText = !property.ShowText, false, false);
		} else if (MouseIn(1637, 825, 225, 55)) {
			ExtendedItemCustomClick("TriggerShock", PropertyShockPublishAction);
		}
	}
}

/** @type {ExtendedItemChatCallback<ModularItemOption>} */
function InventoryItemPelvisSciFiPleasurePantiesChatPrefix({previousOption, newOption}) {
	if (DialogFocusItem == null) {
		return "";
	}

	const Prefix = `${DialogFocusItem.Asset.Group.Name}${DialogFocusItem.Asset.Name}Set`;
	const IntensityPattern = /^(i)(\d+)$/g;
	if (!IntensityPattern.test(newOption.Name)) {
		return Prefix;
	}

	const Change = Number.parseInt(newOption.Name.slice(1)) - Number.parseInt(previousOption.Name.slice(1));
	const StateChange = (Change > 0) ? "Increase" : "Decrease";
	return `${Prefix}${StateChange}`;
}

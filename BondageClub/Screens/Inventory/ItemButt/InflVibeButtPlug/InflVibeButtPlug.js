// @ts-strict-ignore
"use strict";

/** @type {ExtendedItemScriptHookCallbacks.Draw<ModularItemData>} */
function InventoryItemButtInflVibeButtPlugDrawHook(Data, OriginalFunction) {
	OriginalFunction();

	if (Data.currentModule === ModularItemBase) {
		const [InflateLevel, Intensity] = ModularItemParseCurrent(Data, DialogFocusItem.Property.TypeRecord);

		// Display option information
		MainCanvas.save();
		MainCanvas.textAlign = "right";
		DrawText(AssetTextGet(`${Data.dialogPrefix.module}InflateLevel`) + ":", 1500, 565, "White", "Gray");
		DrawText(AssetTextGet(`${Data.dialogPrefix.module}Intensity`) + ":", 1500, 640, "White", "Gray");
		MainCanvas.textAlign = "left";
		DrawText(AssetTextGet(`${Data.dialogPrefix.option}f${InflateLevel}`), 1510, 565, "White", "Gray");
		DrawText(AssetTextGet(`${Data.dialogPrefix.option}i${Intensity}`), 1510, 640, "White", "Gray");
		MainCanvas.restore();
	}
}

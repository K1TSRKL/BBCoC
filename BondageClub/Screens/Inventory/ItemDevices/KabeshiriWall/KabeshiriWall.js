// @ts-strict-ignore
"use strict";

/** @type {ExtendedItemScriptHookCallbacks.Load<ModularItemData>} */
function InventoryItemDevicesKabeshiriWallLoadHook(data, originalFunction) {
	const textData = ExtendedItemGetData(DialogFocusItem.Asset, ExtendedArchetype.TEXT);
	if (textData === null) {
		return;
	}

	originalFunction();
	TextItem.Load(textData);
}

/** @type {ExtendedItemScriptHookCallbacks.Draw<ModularItemData>} */
function InventoryItemDevicesKabeshiriWallDrawHook(data, originalFunction) {
	const textData = ExtendedItemGetData(DialogFocusItem.Asset, ExtendedArchetype.TEXT);
	if (textData === null) {
		return;
	}

	const elements = textData.textNames.map(i => document.getElementById(PropertyGetID(i, DialogFocusItem)));
	if (data.currentModule !== ModularItemBase) {
		elements.forEach(el => el.toggleAttribute("hidden", true));
	} else {
		elements.forEach(el => el.toggleAttribute("hidden", false));
		TextItem.Draw(textData);
	}
	originalFunction();
}

/** @type {ExtendedItemScriptHookCallbacks.PublishAction<ModularItemData, any>} */
function InventoryItemDevicesKabeshiriWallPublishActionHook(data, originalFunction, C, item, newOption, previousOption) {
	switch (newOption.OptionType) {
		case "TextItemOption": {
			const textData = ExtendedItemGetData(item.Asset, ExtendedArchetype.TEXT);
			if (textData === null) {
				return;
			}
			TextItem.PublishAction(textData, C, item, newOption, previousOption);
			return;
		}
		case "ModularItemOption":
			originalFunction(C, item, newOption, previousOption);
			return;
	}
}

/** @type {ExtendedItemScriptHookCallbacks.Exit<ModularItemData>} */
function InventoryItemDevicesKabeshiriWallExitHook(data, originalFunction) {
	const textData = ExtendedItemGetData(DialogFocusItem.Asset, ExtendedArchetype.TEXT);
	if (textData !== null) {
		TextItem.Exit(textData);
	}
}
/**
 * Dynamic AfterDraw function. Draws text onto the box.
 * @type {ExtendedItemScriptHookCallbacks.AfterDraw<ModularItemData>}
 */
function AssetsItemDevicesKabeshiriWallAfterDrawHook(
	_,
	originalFunction,
	{ C, A, CA, X, Y, L, Property, drawCanvas, drawCanvasBlink, AlphaMasks, Color, Opacity }
) {
	const data = ExtendedItemGetData(A, ExtendedArchetype.TEXT);
	if (data != null && L === "Text") {
		const height = 750;
		const width = 1000;
		const tmpCanvas = AnimationGenerateTempCanvas(C, A, width, height);
		const ctx = tmpCanvas.getContext("2d");

		TextItem.Init(data, C, CA, false, false);
		const text1 = CA.Property.Text;
		const text2 = CA.Property.Text2;

		DynamicDrawTextArc(text1, ctx, 200, 490, {
			fontSize: 20,
			fontFamily: data.font,
			width: 125,
			color: Color,
			angle: 0.85,
			direction: DynamicDrawTextDirection.CLOCKWISE,
			textCurve: DynamicDrawTextCurve.FROWNY,
			radius: 70,
		});

		DynamicDrawTextArc(text2, ctx, 285, 515, {
			fontSize: 20,
			fontFamily: data.font,
			width: 85,
			color: Color,
			angle: Math.PI - 0.25,
			direction: DynamicDrawTextDirection.ANTICLOCKWISE,
			textCurve: DynamicDrawTextCurve.SMILEY,
			radius: 150,
		});

		// We print the canvas on the character based on the asset position
		drawCanvas(tmpCanvas, X, Y, AlphaMasks);
		drawCanvasBlink(tmpCanvas, X, Y, AlphaMasks);
	}
}

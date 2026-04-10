// @ts-strict-ignore
"use strict";

/** @type {ExtendedItemScriptHookCallbacks.Load<TypedItemData>} */
function InventoryItemDevicesWoodenBoxLoadHook(Data, OriginalFunction) {
	const textData = ExtendedItemGetData(DialogFocusItem.Asset, ExtendedArchetype.TEXT);
	if (textData === null) {
		return;
	}

	TextItem.Load(textData);
	PropertyOpacityLoad(Data, OriginalFunction);
}

/** @type {ExtendedItemScriptHookCallbacks.Draw<TypedItemData>} */
function InventoryItemDevicesWoodenBoxDrawHook(Data, OriginalFunction) {
	const textData = ExtendedItemGetData(DialogFocusItem.Asset, ExtendedArchetype.TEXT);
	if (textData === null) {
		return;
	}

	TextItem.Draw(textData);
	PropertyOpacityDraw(Data, OriginalFunction);
}

/** @type {ExtendedItemScriptHookCallbacks.Exit<TypedItemData>} */
function InventoryItemDevicesWoodenBoxExitHook(data, originalFunction) {
	const textData = ExtendedItemGetData(DialogFocusItem.Asset, ExtendedArchetype.TEXT);
	if (textData === null) {
		return;
	}

	TextItem.Exit(textData);
	PropertyOpacityExit(data, originalFunction, false);

	// Apply extra opacity-specific effects
	const Property = DialogFocusItem.Property;
	const Transparent = CommonIsNumeric(Property.Opacity) ? Property.Opacity < 0.15 : false;
	if (Transparent) {
		delete Property.Effect;
	} else {
		Property.Effect = ["BlindNormal", "GagLight"];
	}

	const C = CharacterGetCurrent();
	CharacterRefresh(C, true, false);
	ChatRoomCharacterItemUpdate(C, DialogFocusItem.Asset.Group.Name);
}

/** @type {ExtendedItemScriptHookCallbacks.PublishAction<TypedItemData, any>} */
function InventoryItemDevicesWoodenBoxPublishActionHook(data, originalFunction, C, item, newOption, previousOption) {
	switch (newOption.OptionType) {
		case "TypedItemOption":
			originalFunction(C, item, newOption, previousOption);
			return;
		case "TextItemOption": {
			const textData = ExtendedItemGetData(item.Asset, ExtendedArchetype.TEXT);
			if (textData === null) {
				return;
			}
			TextItem.PublishAction(textData, C, item, newOption, previousOption);
			return;
		}
	}
}

/**
 * Dynamic AfterDraw function. Draws text onto the box.
 * @type {ExtendedItemScriptHookCallbacks.AfterDraw<TypedItemData>}
 */
function AssetsItemDevicesWoodenBoxAfterDrawHook(
	_,
	originalFunction,
	{ C, A, CA, X, Y, L, Property, drawCanvas, drawCanvasBlink, AlphaMasks, Color, Opacity }
) {
	const data = ExtendedItemGetData(A, ExtendedArchetype.TEXT);
	if (data != null && L === "Text") {
		const height = 900;
		const width = 310;
		const tmpCanvas = AnimationGenerateTempCanvas(C, A, width, height);
		const ctx = tmpCanvas.getContext("2d");

		TextItem.Init(data, C, CA, false, false);
		const text = CA.Property.Text;

		let from;
		let to;
		const typeRecord = (Property && Property.TypeRecord) || {};
		const subType = typeRecord.typed || 0;
		if (subType === 1) {
			from = [0, 0];
			to = [width, height];
		} else {
			from = [0, height];
			to = [width, 0];
		}

		const { r, g, b } = DrawHexToRGB(Color);
		DynamicDrawTextFromTo(text, ctx, from, to, {
			fontSize: 96,
			fontFamily: data.font,
			color: `rgba(${r}, ${g}, ${b}, ${0.7 * Opacity})`,
		});

		// We print the canvas on the character based on the asset position
		drawCanvas(tmpCanvas, X + 90, Y + 300, AlphaMasks);
		drawCanvasBlink(tmpCanvas, X + 90, Y + 300, AlphaMasks);
	}
}

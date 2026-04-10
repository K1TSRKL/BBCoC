// @ts-strict-ignore
"use strict";


/** @type {ExtendedItemScriptHookCallbacks.Load<TypedItemData>} */
function InventorySuitLatexCatsuitLoadHook(Data, OriginalFunction) {
	const textData = ExtendedItemGetData(DialogFocusItem.Asset, ExtendedArchetype.TEXT);
	if (textData === null) {
		return;
	}


	OriginalFunction();
	// Load that font manually
	DynamicDrawLoadFont("'Libre Barcode 39'");
	TextItem.Load(textData);
}

/** @type {ExtendedItemScriptHookCallbacks.Draw<TypedItemData>} */
function InventorySuitLatexCatsuitDrawHook(Data, OriginalFunction) {
	const textData = ExtendedItemGetData(DialogFocusItem.Asset, ExtendedArchetype.TEXT);
	if (textData === null) {
		return;
	}

	OriginalFunction();
	TextItem.Draw(textData);

	MainCanvas.textAlign = "right";
	const Prefix = Data.dialogPrefix.option;
	DrawTextFit(AssetTextGet(`${Prefix}TitleLabel`), 1290, 760, 400, "#fff", "#000");
	DrawTextFit(AssetTextGet(`${Prefix}BarcodeLabel`), 1290, 810, 400, "#fff", "#000");
	DrawTextFit(AssetTextGet(`${Prefix}TextLabel`), 1290, 860, 400, "#fff", "#000");
	MainCanvas.textAlign = "center";
}

/** @type {ExtendedItemScriptHookCallbacks.PublishAction<TypedItemData, any>} */
function InventorySuitLatexCatsuitPublishActionHook(data, originalFunction, C, item, newOption, previousOption) {
	switch (newOption.OptionType) {
		case "TextItemOption": {
			const textData = ExtendedItemGetData(item.Asset, ExtendedArchetype.TEXT);
			if (textData === null) {
				return;
			}
			TextItem.PublishAction(textData, C, item, newOption, previousOption);
			return;
		}

		case "TypedItemOption":
			originalFunction(C, item, newOption, previousOption);
			return;
	}
}

/** @type {ExtendedItemScriptHookCallbacks.Exit<TypedItemData>} */
function InventorySuitLatexCatsuitExitHook(Data, OriginalFunction) {
	const textData = ExtendedItemGetData(DialogFocusItem.Asset, ExtendedArchetype.TEXT);
	if (textData !== null) {
		TextItem.Exit(textData);
	}
}

/** @type {ExtendedItemCallbacks.AfterDraw} */
function AssetsSuitLatexCatsuitAfterDraw(
	{ C, A, CA, X, Y, L, drawCanvas, drawCanvasBlink, AlphaMasks, Color },
) {
	const data = ExtendedItemGetData(A, ExtendedArchetype.TEXT);
	if (data != null && L === "Text") {
		const width = 140;
		const height = 60;
		const flatCanvas = AnimationGenerateTempCanvas(C, A, width, height);
		const flatCtx = flatCanvas.getContext("2d");

		TextItem.Init(data, C, CA, false, false);

		if (CA.Property.Text) {
			DynamicDrawText(CA.Property.Text, flatCtx, width / 2, height * 2 / 3.3 , {
				fontSize: 18,
				fontFamily: data.font,
				color: Color,
				width,
				radius: 170
			});
		}

		if (CA.Property.Text2) {
			// Strip out any weird characters that might peek through
			const barcodeText = CA.Property.Text2.split("").filter(char => char.match(/[a-zA-Z0-9]/)).join("");
			DynamicDrawText(barcodeText, flatCtx, width / 2, height * 15 / 14, {
				fontSize: 20,
				fontFamily: "'Libre Barcode 39'",
				color: Color,
				width,
			});
		}

		if (CA.Property.Text3) {
			DynamicDrawTextArc(CA.Property.Text3, flatCtx, width / 2, height * 5 / 6.2, {
				fontSize: 14,
				fontFamily: data.font,
				color: Color,
				width,
			});
		}

		const shearedCanvas = AnimationGenerateTempCanvas(C, A, width, height);
		DrawImageTrapezify(flatCanvas, shearedCanvas, 0.4);

		const drawX = X + (500 - width) / 2;
		const drawY = Y + 226;
		drawCanvas(shearedCanvas, drawX, drawY, AlphaMasks);
		drawCanvasBlink(shearedCanvas, drawX, drawY, AlphaMasks);
	}
}

// @ts-strict-ignore
"use strict";

/** @type {ExtendedItemScriptHookCallbacks.AfterDraw<TextItemData>} */
function AssetsBodyMarkingsBodyWritingsAfterDrawHook(data, originalFunction, {
	C, A, CA, X, Y, drawCanvas, drawCanvasBlink, AlphaMasks, L, Color
}) {
	if (L !== "Text")
		return;

	// We set up a canvas
	const Height = 65;
	const Width = 200;
	const TempCanvas = AnimationGenerateTempCanvas(C, A, Width, Height);

	/** @type {DynamicDrawOptions} */
	const drawOptions = {
		fontSize: 10,
		// disabled - fontFamily now gets set at 'style' switch
		//fontFamily: data.font,
		color: Color,
		width: Width,
	};

	switch (CA.Property.TypeRecord.s) {
		case 0: // Print
			drawOptions.fontFamily = "Ananda Black";
			break;
		case 1: // Cursive
			drawOptions.fontFamily = "Satisfy";
			break;
		case 2: // Boilerplate
			drawOptions.fontFamily = "Saira Stencil One";
			break;
		default:
			return;
	}

	switch (CA.Property.TypeRecord.p) {
		case 0: // Collar L
			X-=50;
			Y-=105;
			drawOptions.textAlign = "left";
			break;
		case 1: // Collar C
			Y-=105;
			drawOptions.textAlign = "center";
			break;
		case 2: // Collar R
			X+=50;
			Y-=105;
			drawOptions.textAlign = "right";
			break;
		case 3: // Ribs L
			X-=48;
			drawOptions.textAlign = "left";
			break;
		case 4: // Ribs C
			drawOptions.textAlign = "center";
			break;
		case 5: // Ribs R
			X+=48;
			drawOptions.textAlign = "right";
			break;
		case 6: // Hips L
			X-=70;
			Y+=105;
			drawOptions.textAlign = "left";
			break;
		case 7: // Hips C
			Y+=105;
			drawOptions.textAlign = "center";
			break;
		case 8: // Hips R
			X+=70;
			Y+=105;
			drawOptions.textAlign = "right";
			break;
		default:
			return;
	}

	if (CA.Property.TypeRecord.p >= 3 && CA.Property.TypeRecord.p <= 5 && C.HasAttribute("UpperLarge")) {
		Y += 17;
	}

	TextItem.Init(data, C, CA, false, false);
	const [text1, text2, text3] = [CA.Property.Text, CA.Property.Text2, CA.Property.Text3];

	// We draw the desired info on that canvas
	const ctx = TempCanvas.getContext('2d');
	DynamicDrawText(text1, ctx, Width / 2, Height / 2 - 10, drawOptions);
	DynamicDrawText(text2, ctx, Width / 2, Height / 2, drawOptions);
	DynamicDrawText(text3, ctx, Width / 2, Height / 2 + 10, drawOptions);

	// We print the canvas to the character based on the asset position
	drawCanvas(TempCanvas, X + Width/2, Y + Height/2 , AlphaMasks);
	drawCanvasBlink(TempCanvas, X + Width/2, Y + Height/2 , AlphaMasks);
}


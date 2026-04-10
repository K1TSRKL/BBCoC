// @ts-strict-ignore
"use strict";

/** @type {ExtendedItemScriptHookCallbacks.AfterDraw<TextItemData>} */
function AssetsItemNeckAccessoriesCustomCollarTagAfterDrawHook(data, originalFunction, {
	C, A, CA, X, Y, Property, drawCanvas, drawCanvasBlink, AlphaMasks, L, Color
}) {
	if (L === "Text") {
		// Determine the canvas position and size
		const propertyRecord = (Property && Property.TypeRecord) || {};
		const subType = propertyRecord.t || 0;

		// We set up a canvas
		let Height = 50;
		let Width = 45;
		let YOffset = 30;
		const TempCanvas = AnimationGenerateTempCanvas(C, A, Width, Height);

		switch (subType) {
			case 1:
				YOffset = 45;
				break;
			case 3:
				YOffset = 32;
				break;
			case 4:
			case 5:
				YOffset = 31;
				break;
		}

		TextItem.Init(data, C, CA, false, false);
		const text = CA.Property.Text;

		/** @type {DynamicDrawOptions} */
		const drawOptions = {
			fontSize: 13,
			fontFamily: data.font,
			color: Color,
			textAlign: "center",
			width: Width,
		};

		// We draw the desired info on that canvas
		const ctx = TempCanvas.getContext('2d');
		DynamicDrawText(text, ctx, Width / 2, Width / 2, drawOptions);

		// We print the canvas to the character based on the asset position
		drawCanvas(TempCanvas, X + 227.5, Y + YOffset, AlphaMasks);
		drawCanvasBlink(TempCanvas, X + 227.5, Y + YOffset, AlphaMasks);
	}
}

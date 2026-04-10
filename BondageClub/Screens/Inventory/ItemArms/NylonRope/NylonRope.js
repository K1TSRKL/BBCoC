// @ts-strict-ignore
"use strict";

/** @type {ExtendedItemCallbacks.BeforeDraw} */
function AssetsItemArmsNylonRopeBeforeDraw(data) {
	const subType = data.Property?.TypeRecord?.typed ?? 0;
	if (subType === 9) { // BedSpreadEagle
		return {
			X: data.X - 50,
			Y: data.Y - 150,
		};
	}

	return null;
}

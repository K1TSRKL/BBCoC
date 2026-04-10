// @ts-strict-ignore
"use strict";

/** @type {ExtendedItemCallbacks.BeforeDraw} */
function AssetsItemFeetHempRopeBeforeDraw(data) {
	const subType = data.Property?.TypeRecord?.typed ?? 0;
	if (subType === 6) { // BedSpreadEagle
		return {
			X: data.X -125,
			Y: data.Y -170,
		};
	}
	return null;
}

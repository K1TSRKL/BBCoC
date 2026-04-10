// @ts-strict-ignore
"use strict";

/** @type {ExtendedItemCallbacks.BeforeDraw} */
function AssetsItemArmsHempRopeBeforeDraw(data) {
	const subType = data.Property?.TypeRecord?.typed ?? 0;
	if (subType === 11) { // "BedSpreadEagle"
		return {
			X: data.X - 50,
			Y: data.Y - 150,
		};
	} else if (subType === 12 && data.L === "Suspension") {
		return {
			// Hide the rope split-into-four behind hair as otherwise it appears odd
			Y: data.Y + 30,
		};
	}

	return null;
}

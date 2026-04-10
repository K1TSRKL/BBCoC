// @ts-strict-ignore
"use strict";

/** @type {ExtendedItemCallbacks.BeforeDraw} */
function AssetsItemFeetNylonRopeBeforeDraw(data) {
	const propertyRecord = (data.Property && data.Property.TypeRecord) || {};
	const subType = propertyRecord.typed || 0;
	if (subType === 3) {
		return {
			X: data.X -125,
			Y: data.Y -170,
		};
	}
	return null;
}

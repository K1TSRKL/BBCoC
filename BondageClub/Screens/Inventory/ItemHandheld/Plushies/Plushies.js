// @ts-strict-ignore
"use strict";

/** @type {ExtendedItemScriptHookCallbacks.SetOption<ModularItemData, ModularItemOption>} */
function InventoryItemHandheldPlushiesSetOptionHook(
	data,
	originalFunction,
	C,
	item,
	newOption,
	previousOption,
	push,
	refresh,
) {
	// Toggle the new option within the active module as per usual
	originalFunction(C, item, newOption, previousOption, false, false);

	// Set the options within all other modules to 0
	const currentModuleName = newOption.ModuleName;
	const currentOptionIndices = ModularItemParseCurrent(
		data,
		item.Property.TypeRecord,
	);
	for (const [
		otherModuleIndex,
		otherOptionIndex,
	] of currentOptionIndices.entries()) {
		// Make sure to not reset the current module and check if there is actually anything to reset (i.e. non-zero option index)
		const otherModuleName = data.modules[otherModuleIndex].Name;
		if (otherModuleName !== currentModuleName && otherOptionIndex !== 0) {
			const otherOldOption =
				data.modules[otherModuleIndex].Options[otherOptionIndex];
			const otherNewOption = data.modules[otherModuleIndex].Options[0];
			originalFunction(C, item, otherNewOption, otherOldOption, false, false);
		}
	}
	CharacterRefresh(C, push, false);
}

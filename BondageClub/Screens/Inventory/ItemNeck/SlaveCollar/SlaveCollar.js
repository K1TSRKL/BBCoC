// @ts-strict-ignore
"use strict";
var InventoryItemNeckSlaveCollarColorMode = false;
var InventoryItemNeckSlaveCollarOffset = 0;

// Defines all the slave collar models
/** @type {{ Name: string, Property: ItemProperties & { TypeRecord: TypeRecord }, Image: string }[]} */
var InventoryItemNeckSlaveCollarTypes = [
	{
		Name: "",
		Image: "SlaveCollar",
		Property: { TypeRecord: { noarch: 0 } },
	}, {
		Name: "SteelPosture",
		Image: "SteelPostureCollar",
		Property: { TypeRecord: { noarch: 1 }, Effect: ["FixedHead"], Block: [] },
	}, {
		Name: "LeatherPosture",
		Image: "PostureCollar",
		Property: { TypeRecord: { noarch: 2 }, Effect: ["FixedHead"], Block: [] },
	},{
		Name: "PetCollar",
		Image: "PetCollar",
		Property: { TypeRecord: { noarch: 3 }, Effect: [], Block: [] },
	},{
		Name: "HighCollar",
		Image: "HighCollar",
		Property: { TypeRecord: { noarch: 4 }, Effect: [], Block: [] },
	},{
		Name: "LeatherCollarBell",
		Image: "LeatherCollarBell",
		Property: { TypeRecord: { noarch: 5 }, Effect: [], Block: [] },
	},{
		Name: "LeatherCollarBow",
		Image: "LeatherCollarBow",
		Property: { TypeRecord: { noarch: 6 }, Effect: [], Block: [] },
	},{
		Name: "MaidCollar",
		Image: "MaidCollar",
		Property: { TypeRecord: { noarch: 7 }, Effect: [], Block: [] },
	},{
		Name: "BatCollar",
		Image: "BatCollar",
		Property: { TypeRecord: { noarch: 8 }, Effect: [], Block: [] },
	},{
		Name: "HighSecurityCollar",
		Image: "HighSecurityCollar",
		Property: { TypeRecord: { noarch: 9 }, Effect: [], Block: [] },
	},{
		Name: "SpikeCollar",
		Image: "SpikeCollar",
		Property: { TypeRecord: { noarch: 10 }, Effect: [], Block: [] },
	},{
		Name: "BordelleCollar",
		Image: "BordelleCollar",
		Property: { TypeRecord: { noarch: 11 }, Effect: [], Block: [] },
	},{
		Name: "LeatherCorsetCollar",
		Image: "LeatherCorsetCollar",
		Property: { TypeRecord: { noarch: 12 }, Effect: ["GagNormal"], Block: ["ItemMouth", "ItemMouth2", "ItemMouth3"] },
	},{
		Name: "StrictPostureCollar",
		Image: "StrictPostureCollar",
		Property: { TypeRecord: { noarch: 13 }, Effect: ["FixedHead"], Block: [] },
	},{
		Name: "LatexPostureCollar",
		Image: "LatexPostureCollar",
		Property: { TypeRecord: { noarch: 14 }, Effect: ["GagNormal", "FixedHead"], Block: ["ItemMouth", "ItemMouth2", "ItemMouth3"] },
	},{
		Name: "HeartCollar",
		Image: "HeartCollar",
		Property: { TypeRecord: { noarch: 15 }, Effect: [], Block: [] },
	},{
		Name: "NobleCorsetCollar",
		Image: "NobleCorsetCollar",
		Property: { TypeRecord: { noarch: 16 }, Effect: [], Block: [] },
	},{
		Name: "OrnateCollar",
		Image: "OrnateCollar",
		Property: { TypeRecord: { noarch: 17 }, Effect: [], Block: [] },
	},{
		Name: "SlenderSteelCollar",
		Image: "SlenderSteelCollar",
		Property: { TypeRecord: { noarch: 18 }, Effect: [], Block: [] },
	},{
		Name: "ShinySteelCollar",
		Image: "ShinySteelCollar",
		Property: { TypeRecord: { noarch: 19 }, Effect: [], Block: [] },
	},{
		Name: "HeartLinkChoker",
		Image: "HeartLinkChoker",
		Property: { TypeRecord: { noarch: 20 }, Effect: [], Block: [] },
	}
];

/** @type {ExtendedItemScriptHookCallbacks.Load<NoArchItemData>} */
function InventoryItemNeckSlaveCollarLoadHook(data, originalFunction) {
	originalFunction();

	InventoryItemNeckSlaveCollarColorMode = false;
	var C = CharacterGetCurrent();
	var SC = InventoryItemNeckSlaveCollarTypes.find(element => (element.Name == "LoveLeatherCollar"));
	if (C && C.IsOwnedByPlayer() && C.IsLoverOfPlayer() && !SC) {
		InventoryItemNeckSlaveCollarTypes.push({
			Name: "LoveLeatherCollar",
			Image: "LoveLeatherCollar",
			Property: {TypeRecord: { noarch: 21 }, Effect: [], Block: []},
		});
	}
	else if (C && C.IsOwnedByPlayer && !C.IsLoverOfPlayer() && SC) { InventoryItemNeckSlaveCollarTypes.splice(InventoryItemNeckSlaveCollarTypes.indexOf(SC,1)); }
}

/** @type {ExtendedItemScriptHookCallbacks.Draw<NoArchItemData>} */
function InventoryItemNeckSlaveCollarDrawHook(data, originalFunction) {
	// Only the character owner can use the controls in that screen
	var C = CharacterGetCurrent();
	if (C && C.IsOwnedByPlayer()) {
		if (InventoryItemNeckSlaveCollarColorMode) {
			ItemColorDraw(C, DialogFocusItem.Asset.Group.Name, 1090, 15, 900, 965);
		} else {
			// In regular mode, the owner can select the collar model and change the offset to get the next 8 models
			originalFunction();
			ColorPickerHide();
			DrawButton(1665, 25, 90, 90, "", "White", "Icons/Next.png");
			DrawButton(1775, 25, 90, 90, "", (DialogFocusItem.Color != null && DialogFocusItem.Color != "Default") ? DialogFocusItem.Color.toString() : "White", "Icons/ColorChange.png");
			for (let I = InventoryItemNeckSlaveCollarOffset; I < InventoryItemNeckSlaveCollarTypes.length && I < InventoryItemNeckSlaveCollarOffset + 8; I++) {
				const A = DialogFocusItem.Asset;
				const Type = InventoryItemNeckSlaveCollarTypes[I];
				const CollarTypeAsset = AssetGet(A.Group.Family, A.Group.Name, Type.Image);
				const subType = DialogFocusItem.Property?.TypeRecord?.noarch ?? 0;
				const [buttonX, buttonY] = ExtendedXY[8][I - InventoryItemNeckSlaveCollarOffset];
				DrawPreviewBox(buttonX, buttonY, `${AssetGetPreviewPath(DialogFocusItem.Asset)}/${Type.Image}.png`, CollarTypeAsset.Description, {Hover: true, Disabled: subType === I});
			}
		}
	}
}

/** @type {ExtendedItemScriptHookCallbacks.Click<NoArchItemData>} */
function InventoryItemNeckSlaveCollarClickHook(data, originalFunction) {
	// When the user exits the screen
	if ((MouseX >= 1885) && (MouseX <= 1975) && (MouseY >= 25) && (MouseY <= 110)) {
		DialogLeaveFocusItem();
		return;
	}

	// Only the character owner can use the controls in that screen
	var C = CharacterGetCurrent();
	if (C != null && C.IsOwnedByPlayer()) {
		if (InventoryItemNeckSlaveCollarColorMode) {
			ItemColorClick(C, DialogFocusItem.Asset.Group.Name, 1090, 15, 900, 965);
		} else {
			originalFunction();

			// In regular mode, the owner can select the collar model and change the offset to get the next 8 models
			if ((MouseX >= 1665) && (MouseX <= 1755) && (MouseY >= 25) && (MouseY <= 110)) {
				InventoryItemNeckSlaveCollarOffset = InventoryItemNeckSlaveCollarOffset + 8;
				if (InventoryItemNeckSlaveCollarOffset >= InventoryItemNeckSlaveCollarTypes.length) InventoryItemNeckSlaveCollarOffset = 0;
			}
			if ((MouseX >= 1775) && (MouseX <= 1865) && (MouseY >= 25) && (MouseY <= 110)) {
				InventoryItemNeckSlaveCollarColorMode = true;
				ItemColorLoad(C, DialogFocusItem, 1090, 15, 900, 965, true);
				ItemColorOnExit(() => {
					InventoryItemNeckSlaveCollarColorMode = false;
				});
			}
			for (let I = InventoryItemNeckSlaveCollarOffset; I < InventoryItemNeckSlaveCollarTypes.length && I < InventoryItemNeckSlaveCollarOffset + 8; I++) {
				var subType = DialogFocusItem?.Property?.TypeRecord?.noarch ?? 0;
				const [buttonX, buttonY] = ExtendedXY[8][I - InventoryItemNeckSlaveCollarOffset];
				if (MouseIn(buttonX, buttonY, 225, 225) && subType != I)
					InventoryItemNeckSlaveCollarSetType(I);
			}

		}
	}

}

/**
 * Sets the slave collar model
 * @param {number} NewType
 */
function InventoryItemNeckSlaveCollarSetType(NewType) {
	var C = CharacterGetCurrent();
	var Type = InventoryItemNeckSlaveCollarTypes[NewType] ?? InventoryItemNeckSlaveCollarTypes[0];
	DialogFocusItem.Property = Type.Property;
	const Dictionary = new DictionaryBuilder()
		.sourceCharacter(Player)
		.destinationCharacter(C)
		.build();
	ChatRoomPublishCustomAction("SlaveCollarChangeType", true, Dictionary);
	CharacterRefresh(C);
}

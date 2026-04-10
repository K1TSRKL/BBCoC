// @ts-strict-ignore
"use strict";
var WardrobeBackground = "Private";
/** @type {Character[]} */
var WardrobeCharacter = [];
var WardrobeSelection = -1;
var WardrobeOffset = 0;
var WardrobeSize = 24;
/** @type {WardrobeReorderType} */
var WardrobeReorderMode = "None";
/** @type {number[]} */
var WardrobeReorderList = [];

/**
 * Loads the player's wardrobe safe spots. If a spot is not named yet, initializes it with the player's name
 * @returns {void} - Nothing
 */
function WardrobeLoadCharacterNames() {
	if (Player.WardrobeCharacterNames == null) Player.WardrobeCharacterNames = [];
	let Push = false;
	while (Player.WardrobeCharacterNames.length <= WardrobeSize) {
		Player.WardrobeCharacterNames.push(Player.Name);
		Push = true;
	}
	if (Push) ServerAccountUpdate.QueueData({ WardrobeCharacterNames: Player.WardrobeCharacterNames });
}

/**
 * Makes sure the wardrobe is of the correct length. If someone tampered with the wardrobe's size, all
 * extended slots are deleted
 * @returns {void} - Nothing
 */
function WardrobeFixLength() {
	if (Player.Wardrobe != null) {
		if (Player.Wardrobe.length > WardrobeSize) Player.Wardrobe = Player.Wardrobe.slice(0, WardrobeSize - 1);
		while (Player.Wardrobe.length < WardrobeSize) Player.Wardrobe.push(null);
	}
}

/**
 * Loads all wardrobe characters. If the slot of the wardrobe is currently unused, display a randomly dressed character.
 * Saves the current wardrobe on the server
 * @param {boolean} Fast
 * @returns {void} - Nothing
 */
function WardrobeLoadCharacters(Fast) {
	Fast = Fast == null ? false : Fast;
	let W = null;
	WardrobeLoadCharacterNames();
	if (Player.Wardrobe == null) Player.Wardrobe = [];
	for (let P = 0; P < WardrobeSize; P++) {
		if (WardrobeCharacter.length <= P && ((W == null) || !Fast)) {

			// Creates a character
			const C = CharacterLoadSimple(`Wardrobe-${P}`);
			C.Name = Player.WardrobeCharacterNames[P];
			CharacterAppearanceBuildAssets(C);

			// Loads from player data or generates at full random
			if (Player.Wardrobe[P] != null) {
				C.Appearance = [];
				WardrobeFastLoad(C, P);
			} else {
				CharacterAppearanceFullRandom(C);
				WardrobeFastSave(C, P, false);
				W = P;
			}

			// Keep the character
			WardrobeCharacter.push(C);

		} else if (W != null) {

			// randomize only one character
			CharacterAppearanceFullRandom(WardrobeCharacter[W]);
			WardrobeFastSave(WardrobeCharacter[W], P, false);

		}
	}
	if (W != null) {
		WardrobeFixLength();
		if (Fast) WardrobeFastLoad(WardrobeCharacter[W], W);
		ServerAccountUpdate.QueueData({ Wardrobe: CharacterCompressWardrobe(Player.Wardrobe) });
	}
}

/**
 * Loads the player's wardrobe. when the player opens the wardrobe screen for the first time.
 * This function is called dynamically.
 * @type {ScreenLoadHandler}
 *
 */
async function WardrobeLoad() {
	WardrobeSelection = -1;
	CurrentDarkFactor = 0.5;
	// Always open the wardrobe on the first page
	WardrobeOffset = 0;
	WardrobeLoadCharacters(false);
}

/**
 * Shows the wardrobe screen. This function is called dynamically on a repeated basis. So don't call complex functions
 * or use extended loops in this function.
 * @returns {void} - Nothing
 */
function WardrobeRun() {
	DrawCharacter(Player, 0, 0, 1);
	DrawButton(415, 25, 60, 60, "", "White", "Icons/Small/Prev.png");
	DrawButton(500, 25, 225, 60, TextGet("Load"), "White");
	DrawButton(750, 25, 225, 60, TextGet("Save"), "White");
	DrawButton(1000, 25, 60, 60, "", "White", "Icons/Small/Next.png");
	DrawButton (1790, 15, 90, 90, "", "White", "Icons/Swap.png", TextGet ("ReorderSlots"));
	DrawButton (1895, 15, 90, 90, "", "White", "Icons/Exit.png", TextGet ("Return"));

	var text;
	switch (WardrobeReorderMode) {
		case "None":
			text = TextGet ("SelectAppareance");
			break;

		case "Select":
			text = TextGet ("ReorderSelect");
			break;

		case "Place":
			text = TextGet ("ReorderPlace");
			break;
	}
	DrawText (text, 1405, 60, "White", "Gray");

	for (let C = 0; C < 12; C++) {
		const x = 500 + C % 6 * 250;
		const y = C < 6  ? 100  : 550;

		DrawCharacter (WardrobeCharacter[C + WardrobeOffset], x, y, 0.45);
		switch (WardrobeReorderMode) {
			case "None":
				if (WardrobeSelection == C + WardrobeOffset)
					DrawEmptyRect (x, y + 5, 225, 440, "Cyan");
				break;

			case "Select":
				if (WardrobeReorderList.includes (C + WardrobeOffset))
					DrawEmptyRect (x, y + 5, 225, 440, "Chartreuse", 8);
				break;

			case "Place":
				if (WardrobeReorderList.includes (C + WardrobeOffset))
					DrawEmptyRect (x, y + 5, 225, 440, "Green", 8);
				break;
		}
	}
}

/**
 * Handles the click events in the wardrobe screen. Clicks are propagated from CommonClick()
 * @returns {void} - Nothing
 */
function WardrobeClick() {
	// These top two buttons slightly overlap the wardrobe area, so we
	// return early to prevent that slot from being selected as well.

	// If we must go back to the room
	if (MouseIn (1895, 15, 90, 90)) {
		WardrobeExit();
		return;
	}

	// If we are asked to tidy our Wardrobe
	if (MouseIn (1790, 15, 90, 90)) {
		WardrobeReorderModeSet();
		return;
	}

	// If we must move to the previous page
	if (MouseIn(415, 25, 60, 60)) {
		WardrobeOffset -= 12;
		if (WardrobeOffset < 0) WardrobeOffset = Math.max(0, WardrobeSize - 12);
	}

	// If we must move to the next page
	if (MouseIn(1000, 25, 60, 60)) {
		WardrobeOffset += 12;
		if (WardrobeOffset >= WardrobeSize) WardrobeOffset = 0;
	}

	// If we must load a saved outfit
	if (MouseIn(500, 25, 225, 60) && (WardrobeSelection >= 0))
		WardrobeFastLoad(Player, WardrobeSelection);

	// If we must save an outfit
	if (MouseIn(750, 25, 225, 60) && (WardrobeSelection >= 0))
		WardrobeFastSave(Player, WardrobeSelection);

	// If we must select a different wardrobe
	if (MouseIn(500, 100, 1500, 900)) {
		for (let C = 0; C < 12; C++) {
			const x = 500 + C % 6 * 250;
			const y = C < 6  ? 100  : 550;
			if (MouseIn (x, y, 250, 450)) {
				switch (WardrobeReorderMode) {
					case "None":
						WardrobeSelection = C + WardrobeOffset;
						break;

					case "Select":
						{
							const idx = WardrobeReorderList.indexOf (C + WardrobeOffset);
							if (idx >= 0) {
								WardrobeReorderList.splice (idx, 1);
							} else {
								WardrobeReorderList.push (C + WardrobeOffset);
							}
						}
						break;

					case "Place":
						WardrobeSwapSlots (WardrobeReorderList.shift(), C + WardrobeOffset);

						if (WardrobeReorderList.length <= 0) {
							WardrobeReorderModeSet ("None");
						}
						break;
				}
			}
		}
	}
}

/**
 * Advance to the next reordering mode, or set the mode to the specified
 * value.  The reordering mode cycles through the values:
 * "None" -> "Select" -> "Place"
 *
 * @param {WardrobeReorderType} newmode - The mode to set.  If null, advance to next mode.
 */
function WardrobeReorderModeSet (newmode=null)
{
	let pushoutfits = true;

	if (newmode == null) {
		switch (WardrobeReorderMode) {
			case "None":
				newmode = "Select";
				break;

			case "Select":
				if (WardrobeReorderList.length <= 0) {
					// If selection list is empty, flip back to
					// "None"; skip unnecessary network traffic.
					pushoutfits = false;
					newmode = "None";
				} else {
					newmode = "Place";
				}
				break;

			case "Place":
				newmode = "None";
				break;
		}
	}

	if (newmode == "None"  &&  WardrobeReorderMode != "None") {
		/*
		 * We may have been in the middle of reordering things.
		 * Commit the current state, and empty the list.
		 */
		if (pushoutfits) {
			WardrobePushAll();
		}
		WardrobeReorderList = [];
	}
	WardrobeReorderMode = newmode;
}


/**
 * Exits the wardorbe screen and sends the player back to her private room
 * @type {ScreenExitHandler}
 */
function WardrobeExit() {
	WardrobeReorderModeSet ("None");
	CommonSetScreen("Room", "Private");
}

/**
 * Set a wardrobe character name, sync it with server
 * @param {number} W - The number of the wardrobe slot to save
 * @param {string} Name - The name of the wardrobe slot
 * @param {boolean} [Push=false] -If set to true, the changes are pushed to the server
 */
function WardrobeSetCharacterName(W, Name, Push) {
	Player.WardrobeCharacterNames[W] = Name;
	if (WardrobeCharacter != null && WardrobeCharacter[W] != null) {
		WardrobeCharacter[W].Name = Name;
	}
	if (Push == null || Push != false) {
		ServerAccountUpdate.QueueData({ WardrobeCharacterNames: Player.WardrobeCharacterNames });
	}
}

/**
 * Reduces a given asset to the attributes needed for the wardrobe
 * @param {Item} A - The asset that should be reduced
 * @returns {ItemBundle} - The bundled asset
 */
function WardrobeAssetBundle(A) {
	let Property;
	if (A.Property) {
		Property = Object.assign({}, A.Property);
		delete Property.Expression; // Don't add expressions to the wardrobe
		if (Object.keys(Property).length === 0) Property = undefined; // Don't save empty properties
	}
	return { Name: A.Asset.Name, Group: A.Asset.Group.Name, Color: A.Color, Property };
}

/**
 * Load character appearance from wardrobe, only load clothes on others
 * @param {Character} C - The character the appearance should be loaded for
 * @param {number} W - The spot in the wardrobe the appearance should be loaded to
 * @param {boolean} [Update=false] - If set to true, the appearance will be updated to the server
 * @returns {void} - Nothing
 */
function WardrobeFastLoad(C, W, Update) {
	var savedExpression = {};
	if (C == Player) savedExpression = WardrobeGetExpression(Player);
	if ((Player.Wardrobe != null) && (Player.Wardrobe[W] != null) && (Player.Wardrobe[W].length > 0)) {
		C.Appearance = C.Appearance
			.filter(a => a.Asset.Group.Category != "Appearance" || !WardrobeGroupAccessible(C, a.Asset.Group, { ExcludeNonCloth: true }));
		Player.Wardrobe[W]
			.filter(w => w.Name != null && w.Group != null)
			.filter(w => C.Appearance.find(a => a.Asset.Group.Name == w.Group) == null)
			.forEach(w => {
				const A = AssetGet(C.AssetFamily, w.Group, w.Name);
				if (
					A
					&& A.Group.Category == "Appearance"
					&& WardrobeGroupAccessible(C, A.Group, { ExcludeNonCloth: true })
					&& InventoryAvailable(Player, A.Name, A.Group.Name)
				) {
					CharacterAppearanceSetItem(C, w.Group, A, w.Color, 0);
					if (w.Property && InventoryGet(C, w.Group)) {
						var item = InventoryGet(C, w.Group);
						if (item.Property == null) item.Property = {};
						for (const key of Object.keys(w.Property)) {
							if (key !== "Expression") item.Property[key] = w.Property[key];
						}
					}
				}
			});
		// Adds any critical appearance asset that could be missing, adds the default one
		AssetGroup
			.filter(g => g.Category == "Appearance" && !g.AllowNone)
			.forEach(g => {
				if (C.Appearance.find(a => a.Asset.Group.Name == g.Name) == null) {
					// For a group with a mirrored group, we copy the opposite if it exists
					const mirrorItem = g.MirrorGroup ? InventoryGet(C, g.MirrorGroup) : null;
					if (mirrorItem) {
						CharacterAppearanceSetItem(
							C, g.Name,
							AssetGet(C.AssetFamily, g.Name, mirrorItem.Asset.Name),
							mirrorItem.Color
						);
					} else {
						CharacterAppearanceSetItem(
							C, g.Name,
							AssetGroupGet(C.AssetFamily, g.Name)?.Asset[0],
						);
					}
				}
			});
		// Restores the expressions the player had previously per item in the appearance
		if (C == Player) {
			Player.Appearance.forEach(item => {
				if (savedExpression[item.Asset.Group.Name] != null) {
					if (item.Property == null) item.Property = {};
					item.Property.Expression = savedExpression[item.Asset.Group.Name];

				}
			});
		}
		PoseRefresh(C);
		CharacterLoadCanvas(C);
		if (Update == null || Update) {
			if (C.IsPlayer()) ServerPlayerAppearanceSync();
			if (C.IsPlayer() || C.IsOnline()) ChatRoomCharacterUpdate(C);
		}
	}
}

/**
 * Saves character appearance in player's wardrobe, use player's body as base for others
 * @param {Character} C - The character, whose appearance should be saved
 * @param {number} W - The spot in the wardrobe the current outfit should be saved to
 * @param {boolean} [Push=false] - If set to true, the wardrobe is saved on the server
 * @returns {void} - Nothing
 */
function WardrobeFastSave(C, W, Push) {
	if (Player.Wardrobe != null) {
		var AddAll = C.IsPlayer() || C.CharacterID.indexOf("Wardrobe-") == 0;
		Player.Wardrobe[W] = C.Appearance
			.filter(a => a.Asset.Group.Category == "Appearance")
			.filter(a => WardrobeGroupAccessible(C, a.Asset.Group, { ExcludeNonCloth: AddAll }))
			.map(WardrobeAssetBundle);
		if (!AddAll) {
			// Using Player's body as base
			Player.Wardrobe[W] = Player.Wardrobe[W].concat(Player.Appearance
				.filter(a => a.Asset.Group.Category == "Appearance")
				.filter(a => !a.Asset.Group.Clothing)
				.map(WardrobeAssetBundle));
		}
		WardrobeFixLength();
		if (WardrobeCharacter != null && WardrobeCharacter[W] != null && C.CharacterID != WardrobeCharacter[W].CharacterID) WardrobeFastLoad(WardrobeCharacter[W], W);
		if ((Push == null) || Push) ServerAccountUpdate.QueueData({ Wardrobe: CharacterCompressWardrobe(Player.Wardrobe) });
	}
}

/**
 * Swap two slots in the wardrobe.  Will silently do nothing if either
 * index is out of range.
 *
 * @param {number} a - Slot index
 * @param {number} b - The other slot index
 * @returns {void} - Nothing
 */
function WardrobeSwapSlots (a, b)
{
	if (a < 0  ||  b < 0) {
		return;
	}
	if (a < Player.Wardrobe.length  &&  b < Player.Wardrobe.length)
	{
		// Swap item arrays
		const tmp = Player.Wardrobe[a];
		Player.Wardrobe[a] = Player.Wardrobe[b];
		Player.Wardrobe[b] = tmp;
	}
	if (    a < Player.WardrobeCharacterNames.length
	    &&  b < Player.WardrobeCharacterNames.length)
	{
		// Swap slot names
		const tmp = Player.WardrobeCharacterNames[a];
		Player.WardrobeCharacterNames[a] = Player.WardrobeCharacterNames[b];
		Player.WardrobeCharacterNames[b] = tmp;
	}
	if (a < WardrobeCharacter.length  &&  b < WardrobeCharacter.length)
	{
		// Swap "character" entries.
		const tmp = WardrobeCharacter[a];
		WardrobeCharacter[a] = WardrobeCharacter[b];
		WardrobeCharacter[b] = tmp;
	}
}

/**
 * Unconditionally pushes entire wardrobe to the server.  Used primarily after
 * reordering the wardrobe slots.
 *
 * @returns {void} - Nothing
 */
function WardrobePushAll() {
	if (Player.WardrobeCharacterNames != null) {
		ServerAccountUpdate.QueueData ({ WardrobeCharacterNames: Player.WardrobeCharacterNames });
	}
	if (Player.Wardrobe != null) {
		ServerAccountUpdate.QueueData ({ Wardrobe: CharacterCompressWardrobe(Player.Wardrobe) });
	}
}

/**
 * Returns the expressions of character C as a single big object
 * @param {Character} C - The character whose expressions should be returned
 * @returns {Partial<Record<ExpressionGroupName, ExpressionName>>} Expression - The expresssion of a character
 */
function WardrobeGetExpression(C) {
	/** @type {Partial<Record<ExpressionGroupName, ExpressionName>>} */
	var characterExpression = {};
	ServerAppearanceBundle(C.Appearance).filter(item => item.Property != null && item.Property.Expression != null).forEach(item => characterExpression[item.Group] = item.Property.Expression);
	return characterExpression;
}

/**
 * Checks if a given group of a character can be accessed.
 * @param {Character} C - The character in the wardrobe
 * @param {AssetGroup} Group - The group to check for accessibility
 * @param {object} [Options] - Options to use for the check
 * @param {boolean} Options.ExcludeNonCloth - Removes anything that's not clothing.
 * @returns {boolean} - Whether the zone can be altered or not.
 */
function WardrobeGroupAccessible(C, Group, Options) {

	// You can always edit yourself.
	if (C.IsPlayer() || C.CharacterID.indexOf("Wardrobe-") == 0) return true;

	// You cannot always change body cosplay
	if (Group.BodyCosplay && C.OnlineSharedSettings && C.OnlineSharedSettings.BlockBodyCosplay) return false;

	// Clothes can always be edited
	if (Group.Clothing) return true;

	// You can filter out non-clothing options
	if (!Options || !Options.ExcludeNonCloth) {
		// If the player allows all
		if (C.OnlineSharedSettings && C.OnlineSharedSettings.AllowFullWardrobeAccess) return true;
	}

	return false;
}

// @ts-strict-ignore
"use strict";
var TightenLoosenItemMaximumDifficulty = 0;
var TightenLoosenItemMinimumDifficulty = -10;

/** A set of screen names for which one should *not* be able to access the tighten/loosen interface via the extended item menu */
const TightenLoosenScreenBlacklist = new Set([
	"Crafting",
	"Shop2",
]);

/**
 * Loads the item properties
 * @returns {void} Nothing
 */
function TightenLoosenItemLoad() {
	DialogTightenLoosenItem.Difficulty ??= DialogTightenLoosenItem.Asset.Difficulty;
	TightenLoosenItemMaximumDifficulty = (
		SkillGetLevel(Player, "Bondage")
		+ 4
		+ DialogTightenLoosenItem.Asset.Difficulty
		+ (DialogTightenLoosenItem?.Craft?.Effects.Secure ?? 0) * 4
	);
}

/**
 * Draws the extended tighten / loosen menu
 * @returns {void} Nothing
 */
function TightenLoosenItemDraw() {

	// Draws the title, tightness and item image
	DrawText(InterfaceTextGet("TightenLoosenTitle"), 1500, 70, "White", "Silver");
	DrawItemPreview(DialogTightenLoosenItem, Player, 1200, 200);
	DrawText(InterfaceTextGet("Tightness") + " " + DialogTightenLoosenItem.Difficulty.toString(), 1660, 240, "White", "Silver");
	DrawText(InterfaceTextGet("MaximumTightness") + " " + TightenLoosenItemMaximumDifficulty.toString(), 1660, 340, "White", "Silver");
	DrawText(InterfaceTextGet("MinimumTightness") + " " + TightenLoosenItemMinimumDifficulty.toString(), 1660, 440, "White", "Silver");

	// Draws the buttons
	DrawText(InterfaceTextGet("Loosen"), 1250, 600, "White", "Silver");
	DrawText(InterfaceTextGet("Tighten"), 1750, 600, "White", "Silver");
	DrawButton(1040, 700, 180, 60, InterfaceTextGet("LoosenLot"), (DialogTightenLoosenItem.Difficulty <= TightenLoosenItemMinimumDifficulty + 2) ? "Gray": "White", null, null, (DialogTightenLoosenItem.Difficulty <= TightenLoosenItemMinimumDifficulty + 2));
	DrawButton(1220, 700, 60, 60, null, "White", "Icons/Small/Prev.png", null, true);
	DrawButton(1280, 700, 180, 60, InterfaceTextGet("LoosenLittle"), (DialogTightenLoosenItem.Difficulty <= TightenLoosenItemMinimumDifficulty) ? "Gray": "White", null, null, (DialogTightenLoosenItem.Difficulty <= TightenLoosenItemMinimumDifficulty));
	DrawButton(1540, 700, 180, 60, InterfaceTextGet("TightenLittle"), (DialogTightenLoosenItem.Difficulty >= TightenLoosenItemMaximumDifficulty) ? "Gray": "White", null, null, (DialogTightenLoosenItem.Difficulty >= TightenLoosenItemMaximumDifficulty));
	DrawButton(1720, 700, 60, 60, null, "White", "Icons/Small/Next.png", null, true);
	DrawButton(1780, 700, 180, 60, InterfaceTextGet("TightenLot"), (DialogTightenLoosenItem.Difficulty >= TightenLoosenItemMaximumDifficulty - 2) ? "Gray": "White", null, null, (DialogTightenLoosenItem.Difficulty >= TightenLoosenItemMaximumDifficulty - 2));
	DrawButton(1885, 25, 90, 90, "", "White", "Icons/Exit.png");
}

/**
 * Sets a facial expression for the character being tightneded/loosened
 * @param {Character} C - The character affected
 * @param {"" | ExpressionNameMap["Blush"]} Blush - The blush style
 * @param {"" | ExpressionNameMap["Eyes"]} Eyes - The eyes style
 * @param {"" | ExpressionNameMap["Eyebrows"]} Eyebrows - The eyebrows style
 * @returns {void} Nothing
 */
function TightenLoosenFacialExpression(C, Blush, Eyes, Eyebrows) {
	if (!(C.OnlineSharedSettings?.ItemsAffectExpressions ?? true)) {
		return;
	}

	if ((Blush != "") && ((InventoryGet(C, "Blush") == null) || (InventoryGet(C, "Blush").Property == null) || (InventoryGet(C, "Blush").Property.Expression == null))) CharacterSetFacialExpression(C, "Blush", Blush, 7);
	if ((Eyes != "") && ((InventoryGet(C, "Eyes") == null) || (InventoryGet(C, "Eyes").Property == null) || (InventoryGet(C, "Eyes").Property.Expression == null))) CharacterSetFacialExpression(C, "Eyes", Eyes, 3);
	if ((Eyebrows != "") && ((InventoryGet(C, "Eyebrows") == null) || (InventoryGet(C, "Eyebrows").Property == null) || (InventoryGet(C, "Eyebrows").Property.Expression == null))) CharacterSetFacialExpression(C, "Eyebrows", Eyebrows, 5);
}

/**
 * Handles clicks on the tighten / loosen menu
 * @returns {void} Nothing
 */
function TightenLoosenItemClick() {

	// Exit button
	if (MouseIn(1885, 25, 90, 90)) {
		if (ExtendedItemPermissionMode) ChatRoomCharacterUpdate(Player);
		ExtendedItemPermissionMode = false;
		TightenLoosenItemExit();
		return;
	}

	// Gets the current character and action to do
	const C = CharacterGetCurrent();
	let Action = "";
	let Item = DialogTightenLoosenItem;

	// Loosen a lot
	if (MouseIn(1040, 700, 200, 60) && (Item.Difficulty > TightenLoosenItemMinimumDifficulty + 2)) {
		Item.Difficulty = Item.Difficulty - 4;
		if (Item.Difficulty < TightenLoosenItemMinimumDifficulty) Item.Difficulty = TightenLoosenItemMinimumDifficulty;
		TightenLoosenFacialExpression(C, "ShortBreath", "Closed", "Soft");
		Action = "LoosenLot";
	}

	// Loosen a little
	if (MouseIn(1280, 700, 200, 60) && (Item.Difficulty > TightenLoosenItemMinimumDifficulty)) {
		Item.Difficulty = Item.Difficulty - 2;
		if (Item.Difficulty < TightenLoosenItemMinimumDifficulty) Item.Difficulty = TightenLoosenItemMinimumDifficulty;
		TightenLoosenFacialExpression(C, "", "Shy", "Lowered");
		Action = "LoosenLittle";
	}

	// Tighten a little
	if (MouseIn(1540, 700, 200, 60) && (Item.Difficulty < TightenLoosenItemMaximumDifficulty)) {
		Item.Difficulty = Item.Difficulty + 2;
		if (Item.Difficulty > TightenLoosenItemMaximumDifficulty) Item.Difficulty = TightenLoosenItemMaximumDifficulty;
		TightenLoosenFacialExpression(C, "Low", "Angry", "Angry");
		Action = "TightenLittle";
	}

	// Tighten a lot
	if (MouseIn(1780, 700, 200, 60) && (Item.Difficulty < TightenLoosenItemMaximumDifficulty - 2)) {
		Item.Difficulty = Item.Difficulty + 4;
		if (Item.Difficulty > TightenLoosenItemMaximumDifficulty) Item.Difficulty = TightenLoosenItemMaximumDifficulty;
		TightenLoosenFacialExpression(C, "Medium", "Surprised", "Harsh");
		Action = "TightenLot";
	}

	// If the difficulty changed and we must refresh, improves the skill a little if done in a multiplayer
	if (Action != "") {
		CharacterRefresh(C, true, false);
		if (ServerPlayerIsInChatRoom()) {
			if (((Action == "LoosenLot") || (Action == "LoosenLittle")) && C.IsPlayer()) SkillProgress(Player, "Evasion", 25);
			if (((Action == "LoosenLot") || (Action == "LoosenLittle")) && !C.IsPlayer()) SkillProgress(Player, "Bondage", 25);
			if (((Action == "TightenLot") || (Action == "TightenLittle")) && C.IsPlayer()) SkillProgress(Player, "SelfBondage", 25);
			if (((Action == "TightenLot") || (Action == "TightenLittle")) && !C.IsPlayer()) SkillProgress(Player, "Bondage", 25);
			ChatRoomCharacterUpdate(C);
			ChatRoomPublishAction(C, "Action" + Action, Item, null);
			DialogLeave();
		}
	}

}

/**
 * Exit function for sub menu
 * @returns {void} - Nothing
 */
function TightenLoosenItemExit() {
	DialogTightenLoosenItem = null;
}

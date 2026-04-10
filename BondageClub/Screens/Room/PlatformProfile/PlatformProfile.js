// @ts-strict-ignore
"use strict";

/**
 * Returns the number of available perks for the current player character
 * @returns {number} - The number of perks
 */
function PlatformProfileGetFreePerk() {
	return PlatformPlayer.Level - PlatformPlayer.Perk.split("1").length + 1;
}

/**
 * Draws a black arrow that goes down and right
 * @param {number} SX - The source X position on screen
 * @param {number} SY - The source Y position on screen
 * @param {number} TX - The target X position on screen
 * @param {number} TY - The target Y position on screen
 * @returns {void} - Nothing
 */
function PlatformProfileDrawArrow(SX, SY, TX, TY) {
	DrawRect(SX - 10, SY, 20, TY - SY, "Black");
	DrawRect(SX - 10, TY - 10, TX - SX + 10, 20, "Black");
	for (let X = 0; X < 40; X++)
		DrawRect(TX + X, TY - 20 + (X / 2), 1, 40 - X, "Black");

}

/**
 * Loads the screen
 * @type {ScreenLoadHandler}
 */
async function PlatformProfileLoad() {
}

/**
 * Draws the perk button on the screen, the color changes based on if the perk is available or paid
 * @param {number} X - The X position on screen
 * @param {number} Y - The Y position on screen
 * @param {number} PerkNum - The perk number for the current character
 * @param {Platform.PerkName} [Prerequisite1] - If there's a first prerequisite to validate
 * @param {Platform.PerkName} [Prerequisite2] - If there's a second prerequisite to validate
 * @returns {void} - Nothing
 */
function PlatformProfileDrawPerkButton(X, Y, PerkNum, Prerequisite1, Prerequisite2) {
	let Color = "White";
	if (PlatformHasPerk(PlatformPlayer, PlatformPlayer.PerkName[PerkNum])) Color = "#AAFFAA";
	if ((Prerequisite1 != null) && !PlatformHasPerk(PlatformPlayer, Prerequisite1)) Color = "#FFAAAA";
	if ((Prerequisite2 != null) && !PlatformHasPerk(PlatformPlayer, Prerequisite2)) Color = "#FFAAAA";
	DrawButton(X, Y, 400, 60, TextGet("Perk" + PlatformPlayer.Name + PerkNum.toString()), Color, "", TextGet("PerkDesc" + PlatformPlayer.Name + PerkNum.toString()), (Color != "White"));
}

/**
 * Returns the text associated to the bonus given by the owner of the current player
 * @param {Platform.Character} PlatformChar - The platform character to evaluate
 * @returns {string} - The text string linked to the bonus
 */
function PlatformGetOwnerBonus(PlatformChar) {
	let Char = PlatformDialogGetCharacter(PlatformChar.Name);
	if ((Char == null) || (Char.OwnerName == null) || (Char.OwnerName == "") || (Char.OwnerLevel == null) || (Char.OwnerLevel <= 0)) return TextGet("NoOwnerBonus");
	return TextGet(Char.OwnerName + "RelationshipBonus");
}

/**
 * Returns the text associated to the bonus given by the lover of the current player
 * @param {Platform.Character} PlatformChar - The platform character to evaluate
 * @returns {string} - The text string linked to the bonus
 */
function PlatformGetLoverBonus(PlatformChar) {
	let Char = PlatformDialogGetCharacter(PlatformChar.Name);
	if ((Char == null) || (Char.LoverName == null) || (Char.LoverName == "") || (Char.LoverLevel == null) || (Char.LoverLevel <= 0)) return TextGet("NoLoverBonus");
	return TextGet(Char.LoverName + "RelationshipBonus");
}

/**
 * Runs and draws the screen.
 * @returns {void} - Nothing
 */
function PlatformProfileRun() {
	DrawRect(0, 0, 2000, 1000, "#EEEEEE");
	DrawImageResize("Screens/Room/PlatformDialog/Character/" + PlatformPlayer.Name + "/" + PlatformPlayer.Status + "/Idle.png", -50, 0, 500, 1000);
	DrawText(TextGet("Name") + " " + PlatformPlayer.Name, 700, 50, "Black", "Silver");
	DrawText(TextGet("Class") + " " + PlatformPlayer.Status, 700, 100, "Black", "Silver");
	DrawText(TextGet("Age" + PlatformPlayer.Name), 700, 150, "Black", "Silver");
	DrawText(TextGet("Owner" + ((PlatformDialogGetCharacter(PlatformPlayer.Name).OwnerLevel == null) ? "0" : PlatformDialogGetCharacter(PlatformPlayer.Name).OwnerLevel.toString())) + " " + (((PlatformDialogGetCharacter(PlatformPlayer.Name).OwnerName == null) || (PlatformDialogGetCharacter(PlatformPlayer.Name).OwnerName == "")) ? TextGet("None") : PlatformDialogGetCharacter(PlatformPlayer.Name).OwnerName), 700, 200, "Black", "Silver");
	DrawText(TextGet("Lover" + ((PlatformDialogGetCharacter(PlatformPlayer.Name).LoverLevel == null) ? "0" : PlatformDialogGetCharacter(PlatformPlayer.Name).LoverLevel.toString())) + " " + (((PlatformDialogGetCharacter(PlatformPlayer.Name).LoverName == null) || (PlatformDialogGetCharacter(PlatformPlayer.Name).LoverName == "")) ? TextGet("None") : PlatformDialogGetCharacter(PlatformPlayer.Name).LoverName), 700, 300, "Black", "Silver");
	MainCanvas.font = "italic " + CommonGetFont(30);
	DrawText(PlatformGetOwnerBonus(PlatformPlayer), 700, 250, "Black", "Silver");
	DrawText(PlatformGetLoverBonus(PlatformPlayer), 700, 350, "Black", "Silver");
	MainCanvas.font = CommonGetFont(36);
	DrawText(TextGet("Health") + " " + PlatformPlayer.MaxHealth.toString(), 700, 400, "Black", "Silver");
	DrawText(TextGet("Level") + " " + PlatformPlayer.Level.toString() + " (" + (PlatformPlayer.Level >= 10 ? 0 : Math.floor(PlatformPlayer.Experience / PlatformExperienceForLevel[PlatformPlayer.Level] * 100)).toString() + "%)", 700, 450, "Black", "Silver");
	DrawText(TextGet("Perks") + " " + PlatformProfileGetFreePerk().toString(), 700, 500, "Black", "Silver");
	DrawTextWrap(TextGet("Intro" + PlatformPlayer.Name), 420, 520, 600, 480, "Black", null, 9);
	if (PlatformPlayer.Name == "Melody") {
		PlatformProfileDrawArrow(1150, 50, 1250, 150);
		PlatformProfileDrawArrow(1150, 50, 1250, 250);
		PlatformProfileDrawArrow(1150, 550, 1250, 650);
		PlatformProfileDrawArrow(1150, 750, 1450, 950);
		PlatformProfileDrawArrow(1350, 850, 1450, 950);
		PlatformProfileDrawPerkButton(1100, 20, 0);
		PlatformProfileDrawPerkButton(1300, 120, 1, "Healthy");
		PlatformProfileDrawPerkButton(1300, 220, 2, "Healthy");
		PlatformProfileDrawPerkButton(1100, 320, 3);
		PlatformProfileDrawPerkButton(1100, 420, 4);
		PlatformProfileDrawPerkButton(1100, 520, 5);
		PlatformProfileDrawPerkButton(1300, 620, 6, "Block");
		PlatformProfileDrawPerkButton(1100, 720, 7);
		PlatformProfileDrawPerkButton(1300, 820, 8);
		PlatformProfileDrawPerkButton(1500, 920, 9, "Seduction", "Persuasion");
	}
	if (PlatformPlayer.Name == "Olivia") {
		PlatformProfileDrawArrow(1150, 50, 1250, 150);
		PlatformProfileDrawArrow(1350, 150, 1450, 250);
		PlatformProfileDrawArrow(1150, 50, 1250, 350);
		PlatformProfileDrawArrow(1150, 50, 1250, 450);
		PlatformProfileDrawArrow(1350, 450, 1450, 550);
		PlatformProfileDrawArrow(1150, 50, 1250, 450);
		PlatformProfileDrawArrow(1350, 450, 1450, 550);
		PlatformProfileDrawArrow(1150, 50, 1250, 650);
		PlatformProfileDrawArrow(1350, 650, 1450, 750);
		PlatformProfileDrawArrow(1150, 50, 1250, 850);
		PlatformProfileDrawArrow(1350, 850, 1450, 950);
		PlatformProfileDrawPerkButton(1100, 20, 0);
		PlatformProfileDrawPerkButton(1300, 120, 1, "Apprentice");
		PlatformProfileDrawPerkButton(1500, 220, 2, "Witch");
		PlatformProfileDrawPerkButton(1300, 320, 3, "Apprentice");
		PlatformProfileDrawPerkButton(1300, 420, 4, "Apprentice");
		PlatformProfileDrawPerkButton(1500, 520, 5, "Heal");
		PlatformProfileDrawPerkButton(1300, 620, 6, "Apprentice");
		PlatformProfileDrawPerkButton(1500, 720, 7, "Howl");
		PlatformProfileDrawPerkButton(1300, 820, 8, "Apprentice");
		PlatformProfileDrawPerkButton(1500, 920, 9, "Teleport");
	}
	if (PlatformPlayer.Name == "Edlaran") {
		PlatformProfileDrawArrow(1150, 350, 1250, 450);
		PlatformProfileDrawArrow(1150, 550, 1250, 650);
		PlatformProfileDrawArrow(1150, 750, 1250, 850);
		PlatformProfileDrawArrow(1150, 750, 1250, 950);
		PlatformProfileDrawPerkButton(1100, 20, 0);
		PlatformProfileDrawPerkButton(1100, 120, 1);
		PlatformProfileDrawPerkButton(1100, 220, 2);
		PlatformProfileDrawPerkButton(1100, 320, 3);
		PlatformProfileDrawPerkButton(1300, 420, 4, "Athletic");
		PlatformProfileDrawPerkButton(1100, 520, 5);
		PlatformProfileDrawPerkButton(1300, 620, 6, "Backflip");
		PlatformProfileDrawPerkButton(1100, 720, 7);
		PlatformProfileDrawPerkButton(1300, 820, 8, "Archery");
		PlatformProfileDrawPerkButton(1300, 920, 9, "Archery");
	}
	if (PlatformPlayer.Name == "Lyn") {
		PlatformProfileDrawArrow(1150, 50, 1250, 150);
		PlatformProfileDrawArrow(1150, 50, 1250, 250);
		PlatformProfileDrawArrow(1150, 450, 1250, 550);
		PlatformProfileDrawArrow(1150, 650, 1250, 750);
		PlatformProfileDrawArrow(1150, 850, 1250, 950);
		PlatformProfileDrawPerkButton(1100, 20, 0);
		PlatformProfileDrawPerkButton(1300, 120, 1, "Sneak");
		PlatformProfileDrawPerkButton(1300, 220, 2, "Sneak");
		PlatformProfileDrawPerkButton(1100, 320, 3);
		PlatformProfileDrawPerkButton(1100, 420, 4);
		PlatformProfileDrawPerkButton(1300, 520, 5, "Burglar");
		PlatformProfileDrawPerkButton(1100, 620, 6);
		PlatformProfileDrawPerkButton(1300, 720, 7, "Spring");
		PlatformProfileDrawPerkButton(1100, 820, 8);
		PlatformProfileDrawPerkButton(1300, 920, 9, "Inventory");
	}
	if ((PlatformHeal != null) && (PlatformParty.length >= 2)) DrawButton(1700, 10, 90, 90, "", "White", "Icons/Next.png", TextGet("ChangeCharacter"));
	DrawButton(1800, 10, 90, 90, "", "White", "Icons/Reset.png", TextGet("ResetPerk"));
	DrawButton(1900, 10, 90, 90, "", "White", "Icons/Exit.png", TextGet("Exit"));
}

/**
 * Adds the perk as an active perk for the current character
 * @param {number} PerkNum - The perk number for the current character
 * @returns {void} - Nothing
 */
function PlatformProfileBuyPerk(PerkNum) {
	if (PlatformProfileGetFreePerk() <= 0) return;
	if (PlatformHasPerk(PlatformPlayer, PlatformPlayer.PerkName[PerkNum])) return;
	PlatformPlayer.Perk = PlatformPlayer.Perk.substring(0, PerkNum) + "1" + PlatformPlayer.Perk.substring(PerkNum + 1);
	PlatformSetHealth(PlatformPlayer);
	if ((PerkNum == 0) && (PlatformPlayer.Name == "Olivia")) {
		PlatformProfileExit();
		PlatformDialogStart("OliviaLearnMagic");
	}
}

/**
 * Resets all perks allocated for the current character, the "Apprentice" perk cannot reset
 * @returns {void} - Nothing
 */
function PlatformProfileResetPerk() {
	PlatformPlayer.Perk = PlatformHasPerk(PlatformPlayer, "Apprentice") ? "1000000000" : "0000000000";
	PlatformSetHealth(PlatformPlayer);
}

/**
 * Handles clicks in the screen
 * @returns {void} - Nothing
 */
function PlatformProfileClick() {
	if (MouseIn(1700, 10, 90, 90) && (PlatformHeal != null) && (PlatformParty.length >= 2)) return PlatformPartyNext();
	if (MouseIn(1800, 10, 90, 90)) return PlatformProfileResetPerk();
	if (MouseIn(1900, 10, 90, 90)) return PlatformProfileExit();
	if ((PlatformPlayer.Name == "Melody") && MouseIn(1100, 20, 400, 60)) PlatformProfileBuyPerk(0);
	if ((PlatformPlayer.Name == "Melody") && MouseIn(1300, 120, 400, 60) && PlatformHasPerk(PlatformPlayer, "Healthy")) PlatformProfileBuyPerk(1);
	if ((PlatformPlayer.Name == "Melody") && MouseIn(1300, 220, 400, 60) && PlatformHasPerk(PlatformPlayer, "Healthy")) PlatformProfileBuyPerk(2);
	if ((PlatformPlayer.Name == "Melody") && MouseIn(1100, 320, 400, 60)) PlatformProfileBuyPerk(3);
	if ((PlatformPlayer.Name == "Melody") && MouseIn(1100, 420, 400, 60)) PlatformProfileBuyPerk(4);
	if ((PlatformPlayer.Name == "Melody") && MouseIn(1100, 520, 400, 60)) PlatformProfileBuyPerk(5);
	if ((PlatformPlayer.Name == "Melody") && MouseIn(1300, 620, 400, 60) && PlatformHasPerk(PlatformPlayer, "Block")) PlatformProfileBuyPerk(6);
	if ((PlatformPlayer.Name == "Melody") && MouseIn(1100, 720, 400, 60)) PlatformProfileBuyPerk(7);
	if ((PlatformPlayer.Name == "Melody") && MouseIn(1300, 820, 400, 60)) PlatformProfileBuyPerk(8);
	if ((PlatformPlayer.Name == "Melody") && MouseIn(1500, 920, 400, 60) && PlatformHasPerk(PlatformPlayer, "Seduction") && PlatformHasPerk(PlatformPlayer, "Persuasion")) PlatformProfileBuyPerk(9);
	if ((PlatformPlayer.Name == "Olivia") && MouseIn(1100, 20, 400, 60)) PlatformProfileBuyPerk(0);
	if ((PlatformPlayer.Name == "Olivia") && MouseIn(1300, 120, 400, 60) && PlatformHasPerk(PlatformPlayer, "Apprentice")) PlatformProfileBuyPerk(1);
	if ((PlatformPlayer.Name == "Olivia") && MouseIn(1500, 220, 400, 60) && PlatformHasPerk(PlatformPlayer, "Witch")) PlatformProfileBuyPerk(2);
	if ((PlatformPlayer.Name == "Olivia") && MouseIn(1300, 320, 400, 60) && PlatformHasPerk(PlatformPlayer, "Apprentice")) PlatformProfileBuyPerk(3);
	if ((PlatformPlayer.Name == "Olivia") && MouseIn(1300, 420, 400, 60) && PlatformHasPerk(PlatformPlayer, "Apprentice")) PlatformProfileBuyPerk(4);
	if ((PlatformPlayer.Name == "Olivia") && MouseIn(1500, 520, 400, 60) && PlatformHasPerk(PlatformPlayer, "Heal")) PlatformProfileBuyPerk(5);
	if ((PlatformPlayer.Name == "Olivia") && MouseIn(1300, 620, 400, 60) && PlatformHasPerk(PlatformPlayer, "Apprentice")) PlatformProfileBuyPerk(6);
	if ((PlatformPlayer.Name == "Olivia") && MouseIn(1500, 720, 400, 60) && PlatformHasPerk(PlatformPlayer, "Howl")) PlatformProfileBuyPerk(7);
	if ((PlatformPlayer.Name == "Olivia") && MouseIn(1300, 820, 400, 60) && PlatformHasPerk(PlatformPlayer, "Apprentice")) PlatformProfileBuyPerk(8);
	if ((PlatformPlayer.Name == "Olivia") && MouseIn(1500, 920, 400, 60) && PlatformHasPerk(PlatformPlayer, "Teleport")) PlatformProfileBuyPerk(9);
	if ((PlatformPlayer.Name == "Edlaran") && MouseIn(1100, 20, 400, 60)) PlatformProfileBuyPerk(0);
	if ((PlatformPlayer.Name == "Edlaran") && MouseIn(1100, 120, 400, 60)) PlatformProfileBuyPerk(1);
	if ((PlatformPlayer.Name == "Edlaran") && MouseIn(1100, 220, 400, 60)) PlatformProfileBuyPerk(2);
	if ((PlatformPlayer.Name == "Edlaran") && MouseIn(1100, 320, 400, 60)) PlatformProfileBuyPerk(3);
	if ((PlatformPlayer.Name == "Edlaran") && MouseIn(1300, 420, 400, 60) && PlatformHasPerk(PlatformPlayer, "Athletic")) PlatformProfileBuyPerk(4);
	if ((PlatformPlayer.Name == "Edlaran") && MouseIn(1100, 520, 400, 60)) PlatformProfileBuyPerk(5);
	if ((PlatformPlayer.Name == "Edlaran") && MouseIn(1300, 620, 400, 60) && PlatformHasPerk(PlatformPlayer, "Backflip")) PlatformProfileBuyPerk(6);
	if ((PlatformPlayer.Name == "Edlaran") && MouseIn(1100, 720, 400, 60)) PlatformProfileBuyPerk(7);
	if ((PlatformPlayer.Name == "Edlaran") && MouseIn(1300, 820, 400, 60) && PlatformHasPerk(PlatformPlayer, "Archery")) PlatformProfileBuyPerk(8);
	if ((PlatformPlayer.Name == "Edlaran") && MouseIn(1300, 920, 400, 60) && PlatformHasPerk(PlatformPlayer, "Archery")) PlatformProfileBuyPerk(9);
	if ((PlatformPlayer.Name == "Lyn") && MouseIn(1100, 20, 400, 60)) PlatformProfileBuyPerk(0);
	if ((PlatformPlayer.Name == "Lyn") && MouseIn(1300, 120, 400, 60) && PlatformHasPerk(PlatformPlayer, "Sneak")) PlatformProfileBuyPerk(1);
	if ((PlatformPlayer.Name == "Lyn") && MouseIn(1300, 220, 400, 60) && PlatformHasPerk(PlatformPlayer, "Sneak")) PlatformProfileBuyPerk(2);
	if ((PlatformPlayer.Name == "Lyn") && MouseIn(1100, 320, 400, 60)) PlatformProfileBuyPerk(3);
	if ((PlatformPlayer.Name == "Lyn") && MouseIn(1100, 420, 400, 60)) PlatformProfileBuyPerk(4);
	if ((PlatformPlayer.Name == "Lyn") && MouseIn(1300, 520, 400, 60) && PlatformHasPerk(PlatformPlayer, "Burglar")) PlatformProfileBuyPerk(5);
	if ((PlatformPlayer.Name == "Lyn") && MouseIn(1100, 620, 400, 60)) PlatformProfileBuyPerk(6);
	if ((PlatformPlayer.Name == "Lyn") && MouseIn(1300, 720, 400, 60) && PlatformHasPerk(PlatformPlayer, "Spring")) PlatformProfileBuyPerk(7);
	if ((PlatformPlayer.Name == "Lyn") && MouseIn(1100, 820, 400, 60)) PlatformProfileBuyPerk(8);
	if ((PlatformPlayer.Name == "Lyn") && MouseIn(1300, 920, 400, 60) && PlatformHasPerk(PlatformPlayer, "Inventory")) PlatformProfileBuyPerk(9);
}

/**
 * When the screens exits, we unload the listeners
 * @type {ScreenExitHandler}
 */
function PlatformProfileExit() {
	PlatformPartySave();
	CommonSetScreen("Room", "Platform");
	PlatformDialogEvent();
}

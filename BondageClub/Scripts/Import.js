"use strict";
var ImportBondageCollegeData = false;

/**
 * Import the inventory from the Bondage College. Items to import were saved in localstorage previously.
 * @param {Character} C - Character for which to import items to
 * @returns - Nothing
 */
function ImportBondageCollege(C) {

	// If the user specified that he wanted to import
	if (ImportBondageCollegeData) {

		// If we come from the Bondage College, we translate the items from the college to the club
		if ((localStorage.getItem("BondageClubImportSource") != null) && (localStorage.getItem("BondageClubImportSource") == "BondageCollege")) {

			// Imports the player lover and owner
			LogAdd("BondageCollege", "Import");
			if ((localStorage.getItem("BondageCollegeExportOwner") != null) && (localStorage.getItem("BondageCollegeExportOwner") != "")) C.Owner = "NPC-" + localStorage.getItem("BondageCollegeExportOwner");
			if ((localStorage.getItem("BondageCollegeExportLover") != null) && (localStorage.getItem("BondageCollegeExportLover") != "")) C.Lover = "NPC-" + localStorage.getItem("BondageCollegeExportLover");

			// Imports the 4 main students and 3 main teachers status
			if ((localStorage.getItem("BondageClubImportSource") != null) && (localStorage.getItem("BondageClubImportSource") == "BondageCollege")) {
				const npcNames = /** @type {const} */(["Amanda", "Sarah", "Sidney", "Jennifer", "AmandaSarah", "SarahIntro", "Julia", "Yuki", "Mildred"]);
				for (const storyline of npcNames) {
					/** @type {any} */
					const value = localStorage.getItem("BondageCollegeExport" + storyline);
					if (value)
						LogAdd(value, `NPC-${storyline}`);
				}
			}

			// Imports every inventory items
			InventoryAdd(C, "CollegeOutfit1", "Cloth");
			InventoryAdd(C, "CollegeSkirt", "ClothLower");
			if ((localStorage.getItem("BondageCollegeExportBallGag") != null) && (localStorage.getItem("BondageCollegeExportBallGag") == "true")) InventoryAdd(C, "HarnessBallGag", "ItemMouth", false);
			if ((localStorage.getItem("BondageCollegeExportClothGag") != null) && (localStorage.getItem("BondageCollegeExportClothGag") == "true")) InventoryAdd(C, "ClothGag", "ItemMouth", false);
			if ((localStorage.getItem("BondageCollegeExportTapeGag") != null) && (localStorage.getItem("BondageCollegeExportTapeGag") == "true")) InventoryAdd(C, "DuctTape", "ItemFeet", false);
			if ((localStorage.getItem("BondageCollegeExportTapeGag") != null) && (localStorage.getItem("BondageCollegeExportTapeGag") == "true")) InventoryAdd(C, "DuctTape", "ItemLegs", false);
			if ((localStorage.getItem("BondageCollegeExportTapeGag") != null) && (localStorage.getItem("BondageCollegeExportTapeGag") == "true")) InventoryAdd(C, "DuctTape", "ItemArms", false);
			if ((localStorage.getItem("BondageCollegeExportTapeGag") != null) && (localStorage.getItem("BondageCollegeExportTapeGag") == "true")) InventoryAdd(C, "DuctTape", "ItemMouth", false);
			if ((localStorage.getItem("BondageCollegeExportTapeGag") != null) && (localStorage.getItem("BondageCollegeExportTapeGag") == "true")) InventoryAdd(C, "DuctTape", "ItemHead", false);
			if ((localStorage.getItem("BondageCollegeExportRope") != null) && (localStorage.getItem("BondageCollegeExportRope") == "true")) InventoryAdd(C, "HempRope", "ItemArms", false);
			if ((localStorage.getItem("BondageCollegeExportRope") != null) && (localStorage.getItem("BondageCollegeExportRope") == "true")) InventoryAdd(C, "HempRope", "ItemLegs", false);
			if ((localStorage.getItem("BondageCollegeExportRope") != null) && (localStorage.getItem("BondageCollegeExportRope") == "true")) InventoryAdd(C, "HempRope", "ItemFeet", false);
			if ((localStorage.getItem("BondageCollegeExportCuffs") != null) && (localStorage.getItem("BondageCollegeExportCuffs") == "true")) InventoryAdd(C, "MetalCuffs", "ItemArms", false);
			if ((localStorage.getItem("BondageCollegeExportArmbinder") != null) && (localStorage.getItem("BondageCollegeExportArmbinder") == "true")) InventoryAdd(C, "LeatherArmbinder", "ItemArms", false);
			if ((localStorage.getItem("BondageCollegeExportChastityBelt") != null) && (localStorage.getItem("BondageCollegeExportChastityBelt") == "true")) InventoryAdd(C, "MetalChastityBelt", "ItemPelvis", false);
			if ((localStorage.getItem("BondageCollegeExportCollar") != null) && (localStorage.getItem("BondageCollegeExportCollar") == "true")) InventoryAdd(C, "LeatherCollar", "ItemNeck", false);
			if ((localStorage.getItem("BondageCollegeExportCrop") != null) && (localStorage.getItem("BondageCollegeExportCrop") == "true")) InventoryAdd(C, "Crop", "ItemHandheld", false);
			if ((localStorage.getItem("BondageCollegeExportCuffsKey") != null) && (localStorage.getItem("BondageCollegeExportCuffsKey") == "true")) InventoryAdd(C, "MetalCuffsKey", "ItemArms", false);
			if ((localStorage.getItem("BondageCollegeExportSleepingPill") != null) && (localStorage.getItem("BondageCollegeExportSleepingPill") == "true")) InventoryAdd(C, "RegularSleepingPill", "ItemMouth", false);
			if ((localStorage.getItem("BondageCollegeExportVibratingEgg") != null) && (localStorage.getItem("BondageCollegeExportVibratingEgg") == "true")) InventoryAdd(C, "VibratingEgg", "ItemVulva", false);

			// Imports the locked items
			if ((localStorage.getItem("BondageCollegeExportLockedChastityBelt") != null) && (localStorage.getItem("BondageCollegeExportLockedChastityBelt") == "true")) {
				DialogWearItem("MetalChastityBelt", "ItemPelvis");
				InventoryLock(Player, "ItemPelvis", "MistressPadlock", "Love from Bondage College");
			}
			if ((localStorage.getItem("BondageCollegeExportLockedCollar") != null) && (localStorage.getItem("BondageCollegeExportLockedCollar") == "true")) DialogWearItem("SlaveCollar", "ItemNeck");
			if ((localStorage.getItem("BondageCollegeExportLockedVibratingEgg") != null) && (localStorage.getItem("BondageCollegeExportLockedVibratingEgg") == "true")) DialogWearItem("VibratingEgg", "ItemVulva");

			// Imports skills
			const arts = +(localStorage.getItem("BondageCollegeExportArts") ?? 0);
			const fight = +(localStorage.getItem("BondageCollegeExportFighting") ?? 0);
			const rope = +(localStorage.getItem("BondageCollegeExportRopeMastery") ?? 0);
			const seduction = +(localStorage.getItem("BondageCollegeExportSeduction") ?? 0);
			const sports = +(localStorage.getItem("BondageCollegeExportSports") ?? 0);
			if (arts) SkillChange(C, "LockPicking", arts, 0, true);
			if (fight) SkillChange(C, "Willpower", fight, 0, true);
			if (rope) {
				SkillChange(C, "Bondage", rope, 0, true);
				SkillChange(C, "SelfBondage", rope, 0, true);
			}
			if (seduction) SkillChange(C, "Infiltration", seduction, 0, true);
			if (sports) SkillChange(C, "Evasion", sports, 0, true);

			// Sync with the server
			ServerPlayerSync();
			ServerPlayerInventorySync();
			SarahSetStatus();

		}

	}

}

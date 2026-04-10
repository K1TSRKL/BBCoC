// @ts-strict-ignore
"use strict";

/** @type { "Description" | "OwnersNotes" } */
var OnlineProfileMode = "Description";
var OnlineProfileTextDesc = "";
var OnlineProfileTextOwnersNotes = "";
var OnlineProfileNotesAvailable = false;

const OnlineProfileTextDescMaxLen = 10000;
const OnlineProfileTextOwnersNotesMaxLen = 4000;

var OnlineProfileBackground = "Sheet";

/**
 * Leading character used to signal that description is compressed
 * @readonly
 */
const ONLINE_PROFILE_DESCRIPTION_COMPRESSION_MAGIC = String.fromCharCode(9580);

/**
 * Setup OnlineProfile UI in a specific mode.
 *
 * @param {"Description" | "OwnersNotes"} mode - Initial display mode.
 * @returns {void}
 */
function OnlineProfileStart(mode) {
	OnlineProfileMode = mode;
	CommonSetScreen("Character", "OnlineProfile");
}

/**
 * Loads the text element based on current viewing/editing mode.
 * @param {HTMLInputElement} element
 * @returns {void}
 */
function OnlineProfileLoadTextArea(element) {
	switch (OnlineProfileMode) {
		case "OwnersNotes":
			/*  Editable only by this player's owner.  */
			element.toggleAttribute("readonly", !(InformationSheetSelection.IsOnline() && InformationSheetSelection.IsFullyOwnedByPlayer()));
			element.setAttribute("maxlength", OnlineProfileTextOwnersNotesMaxLen);
			element.value = OnlineProfileTextOwnersNotes;
			break;

		case "Description":
		default:
			/*  Editable by player.  */
			element.toggleAttribute("readonly", !InformationSheetSelection.IsPlayer());
			element.setAttribute("maxlength", OnlineProfileTextDescMaxLen);
			element.value = OnlineProfileTextDesc;
			break;
	}
}

/**
 * Loads the online profile screen by creating its input
 * @type {ScreenLoadHandler}
 */
async function OnlineProfileLoad() {
	OnlineProfileTextDesc = typeof InformationSheetSelection.Description === "string"  ? InformationSheetSelection.Description : "";
	OnlineProfileTextOwnersNotes = typeof InformationSheetSelection.Ownership?.Notes === "string"  ? InformationSheetSelection.Ownership.Notes : "";
	OnlineProfileNotesAvailable = InformationSheetSelection.IsFullyOwnedByPlayer() || OnlineProfileTextOwnersNotes != "";

	ElementRemove("DescriptionInput");
	ElementCreateTextArea("DescriptionInput");
	const DescriptionInput = /** @type {HTMLInputElement} */ (document.getElementById("DescriptionInput"));

	OnlineProfileLoadTextArea(DescriptionInput);
}

/**
 * Handles unloading the online profile screen
 * @returns {void}
 */
function OnlineProfileUnload() {
	ElementRemove("DescriptionInput");
	OnlineProfileTextDesc = "";
	OnlineProfileTextOwnersNotes = "";
	OnlineProfileMode = "Description";
}

/**
 * Runs and draws the online profile screen
 * @returns {void} - Nothing
 */
function OnlineProfileRun() {
	// Sets the screen controls
	let legend = "";
	let maxlen = 0;
	if (OnlineProfileMode == "Description") {
		legend = TextGet(InformationSheetSelection.IsPlayer() ? "EnterDescription" : "ViewDescription");
		maxlen = OnlineProfileTextDescMaxLen;
	} else {
		legend = TextGet(InformationSheetSelection.IsFullyOwnedByPlayer() ? "EnterOwnersNotes" : "ViewOwnersNotes")
		       .replace("OwnerName", InformationSheetSelection.OwnerName());
		maxlen = OnlineProfileTextOwnersNotesMaxLen;
	}
	legend = legend.replace("CharacterName", CharacterNickname(InformationSheetSelection))
	               .replace("MAXLEN", maxlen.toString());
	DrawText(legend, 910, 105, "Black", "Gray");

	ElementPositionFix("DescriptionInput", 36, 100, 160, 1790, 750);

	if (OnlineProfileNotesAvailable) {
		const buttoncolor = OnlineProfileMode == "OwnersNotes" ? "Red" : "White";
		DrawButton(1620, 60, 90, 90, "", buttoncolor, "Icons/Management.png", TextGet("OwnersNotes"));
	}

	if ((OnlineProfileMode == "Description" && InformationSheetSelection.IsPlayer())
		|| (OnlineProfileMode == "OwnersNotes" && InformationSheetSelection.IsFullyOwnedByPlayer()))
	{
		DrawButton(1720, 60, 90, 90, "", "White", "Icons/Accept.png", TextGet("LeaveSave"));
		DrawButton(1820, 60, 90, 90, "", "White", "Icons/Cancel.png", TextGet("LeaveNoSave"));
	} else {
		DrawButton(1820, 60, 90, 90, "", "White", "Icons/Exit.png", TextGet("Leave"));
	}
}

/**
 * Handles clicks in the online profile screen
 * @returns {void} - Nothing
 */
function OnlineProfileClick() {
	if (OnlineProfileNotesAvailable && MouseIn(1620, 60, 90, 90)) {
		/*  Toggle between Description and Owner's Notes.  */
		const ev = ElementValue("DescriptionInput").trim();
		if (OnlineProfileMode == "Description") {
			OnlineProfileTextDesc = ev.slice(0, OnlineProfileTextDescMaxLen);
			OnlineProfileMode = "OwnersNotes";
		} else {
			OnlineProfileTextOwnersNotes = ev.slice(0, OnlineProfileTextOwnersNotesMaxLen);
			OnlineProfileMode = "Description";
		}
		OnlineProfileLoadTextArea(/** @type {HTMLInputElement} */ (document.getElementById("DescriptionInput")));
	}
	if (MouseIn(1720, 60, 90, 90)
		&& (   (OnlineProfileMode == "Description" && InformationSheetSelection.IsPlayer())
	            || (OnlineProfileMode == "OwnersNotes" && InformationSheetSelection.IsFullyOwnedByPlayer())))
	{
		OnlineProfileExit(true);
	}
	if (MouseIn(1820, 60, 90, 90)) OnlineProfileExit(false);
}

/**
 * Handles exiting while in the online profile screen. It removes the input and saves the description.
 * @param {boolean} [Save] - Whether or not we should save the changes
 * @returns {void} - Nothing
 */
function OnlineProfileExit(Save=false) {
	if (Save) {
		const ev = ElementValue("DescriptionInput").trim();
		if (OnlineProfileMode == "Description") {
			OnlineProfileTextDesc = ev.slice(0, OnlineProfileTextDescMaxLen);
		} else {
			OnlineProfileTextOwnersNotes = ev.slice(0, OnlineProfileTextOwnersNotesMaxLen);
		}

		// If the current character is the player, we update the description
		if (InformationSheetSelection.Description != OnlineProfileTextDesc && InformationSheetSelection.IsPlayer()) {
			InformationSheetSelection.Description = OnlineProfileTextDesc;
			let Description = OnlineProfileTextDesc;
			const comp_val = ONLINE_PROFILE_DESCRIPTION_COMPRESSION_MAGIC + LZString.compressToUTF16(Description);
			if (comp_val.length < Description.length || Description.startsWith(ONLINE_PROFILE_DESCRIPTION_COMPRESSION_MAGIC)) {
				Description = comp_val;
			}
			ServerAccountUpdate.QueueData({ Description });
		}

		CharacterSetOwnersNotes(InformationSheetSelection, OnlineProfileTextOwnersNotes);
	}
	CommonSetScreen("Character", "InformationSheet");
}

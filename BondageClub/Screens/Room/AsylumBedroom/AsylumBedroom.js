// @ts-strict-ignore
"use strict";
var AsylumBedroomBackground = "AsylumBedroom";

/**
 * Loads the room and initializes the UI elements. Called dynamically
 * @type {ScreenLoadHandler}
 */
async function AsylumBedroomLoad() {
	if (Player.LastChatRoom && (AsylumGGTSGetLevel(Player) <= 0)) {
		// We return to the chat room that the player was last in
		// FIXME: wut? why is this here? Why not just… relog us into that space the normal way?
		if (Player.ImmersionSettings.ReturnToChatRoom) {
			ChatSearchStart("Asylum", ["Room", "AsylumEntrance"], { Background: "Asylum", BackgroundTagList: [BackgroundsTagAsylum], });
		} else {
			ChatRoomSetLastChatRoom(null);
		}
	}
}

/**
 * Runs the bedroom. Is called dynamically at very short intervals so don't use espensive loops or other functions from within
 * @returns {void} - Nothing
 */
function AsylumBedroomRun() {
	DrawCharacter(Player, 750, 0, 1);
	if ((LogValue("Isolated", "Asylum") < CurrentTime) && Player.CanWalk()) DrawButton(1885, 25, 90, 90, "", "White", "Icons/Exit.png", TextGet("Entrance"));
	DrawButton(1885, 145, 90, 90, "", "White", "Icons/Character.png", TextGet("Profile"));
	if (LogValue("Isolated", "Asylum") >= CurrentTime) {
		DrawButton(1885, 265, 90, 90, "", "White", "Icons/Bedroom.png", TextGet("Sleep"));
		DrawText(TextGet("IsolationTime"), 1800, 915, "white", "gray");
		DrawText(TimerToString(LogValue("Isolated", "Asylum") - CurrentTime), 1800, 965, "white", "gray");
	} else {
		if (LogValue("Committed", "Asylum") >= CurrentTime) {
			DrawButton(1885, 265, 90, 90, "", "White", "Icons/Bedroom.png", TextGet("Sleep"));
			DrawText(TextGet("RemainingTime"), 1800, 915, "white", "gray");
			DrawText(TimerToString(LogValue("Committed", "Asylum") - CurrentTime), 1800, 965, "white", "gray");
		}
	}
}

// When the user clicks in the room
/**
 * Handles the click events. Is called from CommonClick()
 * @returns {void} - Nothing
 */
function AsylumBedroomClick() {
	if (MouseIn(750, 0, 500, 1000)) CharacterSetCurrent(Player);
	if (MouseIn(1885, 25, 90, 90) && (LogValue("Isolated", "Asylum") < CurrentTime) && Player.CanWalk()) CommonSetScreen("Room", "AsylumEntrance");
	if (MouseIn(1885, 145, 90, 90)) InformationSheetLoadCharacter(Player);
	if (MouseIn(1885, 265, 90, 90) && ((LogValue("Committed", "Asylum") >= CurrentTime) || (LogValue("Isolated", "Asylum") >= CurrentTime))) {
		window.location.reload();
	}
}

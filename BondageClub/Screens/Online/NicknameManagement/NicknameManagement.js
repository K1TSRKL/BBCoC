"use strict";
var NicknameManagementBackground = "Sheet";
/** @type {Character} */
var NicknameManagementTarget = /** @type {never} */ (null);
var NicknameManagementLock = false;

/**
 * Loads the Nickname Management screen
 * @type {ScreenLoadHandler}
 */
async function NicknameManagementLoad() {
	if (!NicknameManagementTarget) {
		throw new Error('Missing "NicknameManagementTarget" data');
	}
	if (NicknameManagementTarget.Nickname == null) NicknameManagementTarget.Nickname = "";
	const input = ElementCreateInput("InputNickname", "text", NicknameManagementTarget.Nickname, "20");
	input.pattern = ServerCharacterNicknameRegex.source;
	NicknameManagementLock = LogQueryRemote(NicknameManagementTarget, "BlockNickname", "OwnerRule");
}

/**
 * Draws the Nickname Management controls
 * @returns {void} - Nothing
 */
function NicknameManagementRun() {
	DrawCharacter(NicknameManagementTarget, 50, 50, 0.9);
	DrawText(TextGet("Title1"), 1200, 200, "Black", "Silver");
	DrawText(TextGet("Title2"), 1200, 300, "Black", "Silver");
	DrawText(TextGet("RealName") + " " + NicknameManagementTarget.Name, 1200, 450, "Black", "Silver");
	DrawText(TextGet("CurrentNickname") + " " + NicknameManagementTarget.Nickname, 1200, 550, "Black", "Silver");
	DrawText(TextGet("NewNickname"), 950, 650, "Black", "Silver");
	ElementPosition("InputNickname", 1330, 647, 450, 60);
	MainCanvas.textAlign = "left";
	DrawCheckbox(1000, 750, 64, 64, TextGet("Lock"), NicknameManagementLock);
	MainCanvas.textAlign = "center";
	DrawButton(1725, 60, 90, 90, "", "White", "Icons/Accept.png", TextGet("Accept"));
	DrawButton(1830, 60, 90, 90, "", "White", "Icons/Cancel.png", TextGet("Cancel"));
}

/**
 * Handles the click events. Is called from CommonClick()
 * @returns {void} - Nothing
 */
function NicknameManagementClick() {
	if (MouseIn(1725, 60, 90, 90)) NicknameManagementExit(true);
	if (MouseIn(1830, 60, 90, 90)) NicknameManagementExit();
	if (MouseIn(1000, 750, 64, 64)) NicknameManagementLock = !NicknameManagementLock;
}

/**
 * Handles exiting from the screen, updates the sub rules
 * @satisfies {ScreenExitHandler}
 * @param {boolean} Save - Received rule data object.
 */
function NicknameManagementExit(Save = false) {
	const inputElem = /** @type {HTMLInputElement | null} */(document.getElementById("InputNickname"));
	const NewNickname = inputElem?.validity.valid ? inputElem.value : NicknameManagementTarget.Nickname;
	ElementRemove("InputNickname");
	CommonSetScreen("Online", "ChatRoom");
	if (Save && NicknameManagementTarget) {
		if (NewNickname != NicknameManagementTarget.Nickname) {
			// This doesn't need to go through `CharacterSetNickname` because we're
			// on the "other side"; it'll be handled by the target on reception of
			// the `OwnerRuleNicknameNew` message.
			NicknameManagementTarget.Nickname = NewNickname;
			ServerSend("ChatRoomChat", { Content: "OwnerRuleNicknameNew" + NewNickname, Type: "Hidden", Target: NicknameManagementTarget.MemberNumber });
		}
		ServerSend("ChatRoomChat", { Content: "OwnerRuleNickname" + (NicknameManagementLock ? "Block" : "Allow"), Type: "Hidden", Target: NicknameManagementTarget.MemberNumber });
	}
	NicknameManagementTarget = /** @type {never} */ (null);
}

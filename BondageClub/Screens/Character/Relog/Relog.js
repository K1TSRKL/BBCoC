// @ts-strict-ignore
"use strict";
/** @type {null | RelogData} */
var RelogData = null;

const RelogIDs = Object.freeze({
	subscreen: "relog-subscreen",
	passwordLabel: "relog-password-label",
	password: "InputPassword",
	passwordPair: "relog-password-pair",
	status: "relog-status",
	accountName: "relog-account-name",
	enterPasswordHint: "relog-enter-password-hint",
	login: "relog-login",
	leave: "relog-leave",
	buttons: "relog-buttons",
	passwordAndButtons: "relog-password-and-buttons",
});

/**
 * Loads the relog screen
 * @type {ScreenLoadHandler}
 */
async function RelogLoad() {
	// Resets login variables and sets the login message
	LoginStatusReset();

	const header = ElementCreate({
		tag: "div",
		classList: ["flex", "vertical", "center-label"],
		children: [
			{
				tag: "span",
				classList: ["light-label"],
				attributes: { id: RelogIDs.status },
			},
			{
				tag: "span",
				classList: ["light-label"],
				attributes: { id: RelogIDs.enterPasswordHint },
				children: [TextGet("EnterPassword")],
			}
		],
	});

	const accountName = ElementCreate({
		tag: "span",
		classList: ["light-label"],
		attributes: { id: RelogIDs.accountName },
		children: [`${TextGet("Account")} ${Player.AccountName}`],
	});

	// Creates the password control without autocomplete and make sure it's cleared
	const passwordField = ElementCreateInput(RelogIDs.password, "password", "", "20");
	passwordField.setAttribute("autocomplete", "off");

	const passwordPair = ElementCreate({
		tag: "label",
		classList: ["flex", "vertical"],
		attributes: { type: "password", id: RelogIDs.passwordPair },
		children: [
			{
				tag: "span",
				classList: ["light-label"],
				attributes: { id: RelogIDs.passwordLabel },
				children: [TextGet("Password")],
			},
			passwordField
		],
	});

	const buttons = ElementCreate({
		tag: "div",
		attributes: { id: RelogIDs.buttons },
		children: [
			ElementButton.Create(RelogIDs.login, () => {
				const password = ElementValue(RelogIDs.password);
				LoginDoLogin(Player.AccountName, password);
			},
			{
				label: TextGet("LogBackIn")
			}),
			ElementButton.Create(RelogIDs.leave, RelogExit, {
				label: TextGet("Leave")
			})
		]
	});

	ElementCreate({
		tag: "div",
		attributes: { id: RelogIDs.subscreen },
		children: [
			header,
			accountName,
			{
				tag: "div",
				classList: ["flex", "vertical", "center-label"],
				attributes: { id: RelogIDs.passwordAndButtons },
				children: [
					passwordPair,
					buttons
				]
			}
		],
		parent: document.body
	});
	passwordField.focus();
	setTimeout(function() { ElementValue(RelogIDs.password, ""); }, 500);
}

/**
 * Unload the relog screen
 */
function RelogUnload() {
	ElementRemove(RelogIDs.subscreen);
}

/**
 * Runs the relog screen
 * @returns {void} Nothing
 */
function RelogRun() {

	const CanLogin = ServerIsConnected && !LoginSubmitted;

	// Draw the relog controls
	const status = LoginGetStatus();
	const statusElement = ElementWrap(RelogIDs.status);
	if (status && statusElement && status !== statusElement.textContent) {
		statusElement.textContent = status;
	} else if (!status && statusElement) {
		statusElement.textContent = "";
	}
	ElementWrap(RelogIDs.login)?.toggleAttribute("disabled", !CanLogin);

	// Reset any disconnect notifications
	if (document.hasFocus()) NotificationReset(NotificationEventType.DISCONNECT);
}

/**
 * Handles player click events on the relog screen
 * @returns {void} Nothing
 */
function RelogClick() {
}

/**
 * Handles player keyboard events on the relog screen
 * @type {KeyboardEventListener}
 */
function RelogKeyDown(event) {
	if (CommonKey.IsPressed(event, "Enter")) {
		// On an "enter" key press, try to relog the player
		const Name = Player.AccountName;
		const Password = ElementValue(RelogIDs.password);

		LoginDoLogin(Name, Password);

		return true;
	}

	return false;
}

/**
 * Sends the player back to the main login screen
 * @type {ScreenExitHandler}
 */
function RelogExit() {
	window.location.reload();
}

function RelogResize() {
	ElementSetFontSize(RelogIDs.subscreen, "auto");
}

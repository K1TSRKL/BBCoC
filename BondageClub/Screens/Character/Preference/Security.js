// @ts-strict-ignore
"use strict";

const PreferenceSubscreenSecurityIDs = Object.freeze({
	grid: "preference-security-grid",
	emailOld: "InputEmailOld",
	emailNew: "InputEmailNew",
	hint: "preference-security-hint",
	update: "preference-security-update-button",
});

/**
 * Loads the preference security screen.
 * @returns {void} - Nothing
 */
function PreferenceSubscreenSecurityLoad() {

	const hint = ElementCreate({
		tag: "span",
		classList: ["subscreen-title"],
		attributes: { id: PreferenceSubscreenSecurityIDs.hint },
		children: [TextGet("UpdateEmailDescription")],
	});

	const emailOldElm = ElementCreate({
		tag: "div",
		classList: ["preference-labelled-input"],
		children: [
			{
				tag: "label",
				children: [TextGet("UpdateEmailOld")],
				attributes: { for: PreferenceSubscreenSecurityIDs.emailOld },
			},
			ElementCreateInput(PreferenceSubscreenSecurityIDs.emailOld, "email", "", "100"),
		],
	});

	const emailNewElm = ElementCreate({
		tag: "div",
		classList: ["preference-labelled-input"],
		children: [
			{
				tag: "label",
				children: [TextGet("UpdateEmailNew")],
				attributes: { for: PreferenceSubscreenSecurityIDs.emailNew },
			},
			ElementCreateInput(PreferenceSubscreenSecurityIDs.emailNew, "email", "", "100"),
		],
	});

	const updateEmailButton = ElementButton.Create(PreferenceSubscreenSecurityIDs.update, () => {
		const emailOld = ElementValue("InputEmailOld");
		const emailNew = ElementValue("InputEmailNew");

		if ((emailOld == "" || CommonEmailIsValid(emailOld)) && (emailNew == "" || CommonEmailIsValid(emailNew)))
			ServerSend("AccountUpdateEmail", { EmailOld: emailOld, EmailNew: emailNew });
		else
			ToastManager.error(TextGet("UpdateEmailInvalid"));
	},
	{
		label: TextGet("UpdateEmail"),
	});

	ElementCreate({
		tag: "div",
		classList: ["preference-settings-grid", "scroll-box"],
		attributes: { id: PreferenceSubscreenSecurityIDs.grid },
		children: [
			hint,
			emailOldElm,
			emailNewElm,
			updateEmailButton
		],
		parent: ElementWrap(PreferenceIDs.subscreen),
	});

	ServerSend("AccountQuery", { Query: "EmailStatus" });
}

/**
 * Sets the security preferences for a player. Redirected to from the main Run function if the player is in the
 * security settings subscreen
 * @returns {void} - Nothing
 */
function PreferenceSubscreenSecurityRun() {
	DrawCharacter(Player, 50, 50, 0.9);
}

/**
 * Handles the click events in the security settings dialog for a player.  Redirected from the main Click function.
 * @returns {void} - Nothing
 */
function PreferenceSubscreenSecurityClick() {
}

/**
 * Exits the preference screen
 */
function PreferenceSubscreenSecurityExit() {
	return true;
}

function PreferenceSubscreenSecurityUnload() {
}

function PreferenceSubscreenSecurityResize() {
	const { x, y } = PreferenceSubscreenMainGrid;

	ElementSetPosition(PreferenceSubscreenSecurityIDs.grid, x, y);
}

/**
 * Updates the placeholder of the "New Email" input based on the result of an email update operation.
 * @param {ServerAccountQueryEmailStatus} data - Server response containing the result of the email update.
 * @returns {void}
 */
function SecurityEmailUpdate(data) {
	const result = data.Result ? "UpdateEmailSuccess" : "UpdateEmailFailure";
	const text = TextGet(result);

	if (result === "UpdateEmailSuccess") {
		ElementValue(PreferenceSubscreenSecurityIDs.emailNew, "");
		ElementValue(PreferenceSubscreenSecurityIDs.emailOld, "");
		ToastManager.success(text);
	} else {
		ToastManager.success(text);
	}
}

/**
 * Updates the email input placeholder based on whether an email is linked to the account.
 * @param {ServerAccountQueryEmailStatus} data - Server response containing the email status.
 * @returns {void}
 */
function SecurityEmailStatus(data) {
	const placeholder = TextGet(data.Result ? "UpdateEmailLinked" : "UpdateEmailEmpty");
	const inputId = PreferenceSubscreenSecurityIDs[data.Result ? "emailOld" : "emailNew"];

	ElementWrap(inputId)?.setAttribute("placeholder", placeholder);
}

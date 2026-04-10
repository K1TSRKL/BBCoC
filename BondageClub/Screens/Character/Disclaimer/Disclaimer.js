"use strict";
var DisclaimerBackground = "Sheet";
const DisclaimerIDs = Object.freeze({
	screen: "disclaimer-screen",
	text: "disclaimer-text",
	return: "disclaimer-return",
	accept: "disclaimer-accept",
	buttons: "disclaimer-buttons",
});

/**
 * Loads the disclaimer screen
 * @type {ScreenLoadHandler}
 */
async function DisclaimerLoad() {

	const disclaimerTextSection = ElementCreate({
		tag: "section",
		attributes: { id: DisclaimerIDs.text },
		classList: ["disclaimer-text", "NoSelect"],
	});
	const disclaimerButtonsSection = ElementCreate({
		tag: "section",
		attributes: { id: DisclaimerIDs.buttons, role: "group" },
		classList: ["disclaimer-buttons", "NoSelect"],
	});

	ElementDOMScreen.getTemplate(
		DisclaimerIDs.screen,
		{
			parent: document.body,
			header: TextGet("Disclaimer"),
			hgroupInHeader: true,
			mainContent: [
				disclaimerTextSection,
				disclaimerButtonsSection,
			]
		},
	);


	const introLine1 = ElementCreate({
		tag: "p",
		classList: ["disclaimer-line", "disclaimer-intro"],
		children: [
			TextGet("TosIntro1"),
			{ tag: "br" },
			TextGet("TosIntro2")
		],
	});

	const listItems = [
		"TosItem1",
		"TosItem2",
		"TosItem3",
		"TosItem4",
		"TosItem5",
		"TosItem6",
		"TosItem7",
		"TosItem8",
	].map((key) => ElementCreate({
		tag: "li",
		classList: ["disclaimer-list-item"],
		children: [TextGet(key)],
	}));

	const tosList = ElementCreate({
		tag: "ol",
		classList: ["disclaimer-line", "disclaimer-list"],
		children: listItems,
	});

	const outroLine = ElementCreate({
		tag: "p",
		classList: ["disclaimer-line", "disclaimer-outro"],
		children: [TextGet("TosAcceptPrompt")],
	});

	disclaimerTextSection.replaceChildren(introLine1, tosList, outroLine);

	const returnButton = ElementButton.Create(DisclaimerIDs.return, DisclaimerExit, {
		label: TextGet("TosReturn"),
	},
	{
		button: { classList: ["disclaimer-button"] },
	});
	const acceptButton = ElementButton.Create(DisclaimerIDs.accept, DisclaimerAccept, {
		label: TextGet("TosAccept"),
	},
	{
		button: { classList: ["disclaimer-button"] },
	});

	disclaimerButtonsSection.replaceChildren(returnButton, acceptButton);
}

/**
 * Runs & draws the disclaimer screen
 * @returns {void} - Nothing
 */
function DisclaimerRun() {}

/**
 * Handles click events in the disclaimer screen
 * @returns {void} - Nothing
 */
function DisclaimerClick() {}

/** @type {ScreenUnloadHandler} */
function DisclaimerUnload() {
	ElementRemove(DisclaimerIDs.screen);
}

/**
 * Does the cleanup, if the user exits the screen
 * @returns {void} - Nothing
 */
function DisclaimerExit() {
	CommonSetScreen("Character", "Login");
}

function DisclaimerAccept() {
	CharacterCreatePlayer();
	InventoryRemove(Player, "ItemFeet");
	InventoryRemove(Player, "ItemLegs");
	InventoryRemove(Player, "ItemArms");
	CharacterAppearanceSetDefault(Player);

	// Redirect the player to the login screen after they have their character created
	CharacterAppearanceLoadCharacter(Player, (result) => {
		if (result)
			CommonSetScreen("Character", "Creation");
		else
			CommonSetScreen("Character", "Login");
	});
}

function DisclaimerResize() {
	ElementSetPosition(DisclaimerIDs.screen, 100, 100);
	ElementSetSize(DisclaimerIDs.screen, 1800, 800);
	ElementSetFontSize(DisclaimerIDs.screen, "auto");
}

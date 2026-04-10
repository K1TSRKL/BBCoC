"use strict";
var CreationBackground = "Dressing";
var CreationMessage = "";

/**
 * Loads the character login screen. Imports data from the Bondage College if necessary
 * and creates the input fields. This function is called dynamically.
 * @type {ScreenLoadHandler}
 */
async function CreationLoad() {

	// Gets the info to import Bondage College data
	let DefaultName = "";
	if (localStorage.getItem("BondageClubImportSource") === "BondageCollege") {
		ImportBondageCollegeData = true;
		DefaultName = localStorage.getItem("BondageCollegeExportName") ?? "";
	} else {
		ImportBondageCollegeData = false;
	}

	// Creates the text fields element
	const form = ElementCreateForm("Creation");
	const name = ElementCreateInput("InputCharacter", "text", DefaultName, "20", form);
	name.setAttribute("autocomplete", "name");
	const username = ElementCreateInput("InputName", "text", "", "20", form);
	username.setAttribute("autocomplete", "username");
	const pass1 = ElementCreateInput("InputPassword1", "password", "", "20", form);
	pass1.setAttribute("autocomplete", "new-password");
	const pass2 = ElementCreateInput("InputPassword2", "password", "", "20", form);
	pass2.setAttribute("autocomplete", "new-password");
	const email = ElementCreateInput("InputEmail", "email", "", "100", form);
	email.setAttribute("autocomplete", "email");

}


/**
 * Runs the character creation screen. Draws all needed input fields and buttons.
 * If the import of Bondage College data is possible, an appropriate check box is drawn.
 * The function is called dynamically.
 * @returns {void} - Nothing
 */
function CreationRun() {

	// Places the controls on the screen
	ElementPosition("InputCharacter", 1250, 175, 500);
	ElementPosition("InputName", 1250, 305, 500);
	ElementPosition("InputPassword1", 1250, 435, 500);
	ElementPosition("InputPassword2", 1250, 565, 500);
	ElementPosition("InputEmail", 1250, 695, 500);

	// Draw the character, the labels and buttons
	if (CreationMessage == "") CreationMessage = TextGet("EnterAccountCharacterInfo");
	DrawCharacter(Player, 500, 0, 1);
	DrawText(CreationMessage, 1250, 50, "White", "Black");
	DrawText(TextGet("CharacterName"), 1250, 120, "White", "Black");
	DrawText(TextGet("AccountName"), 1250, 250, "White", "Black");
	DrawText(TextGet("Password"), 1250, 380, "White", "Black");
	DrawText(TextGet("ConfirmPassword"), 1250, 510, "White", "Black");
	DrawText(TextGet("Email"), 1250, 640, "White", "Black");
	DrawButton(1050, 825, 400, 60, TextGet("CreateAccount"), "White", "");
	DrawText(TextGet("AccountAlreadyExists"), 1180, 950, "White", "Black");
	DrawButton(1440, 920, 120, 60, TextGet("Login"), "White", "");

	// Draw the importation check box
	if (ImportBondageCollegeData) {
		DrawText(TextGet("ImportBondageCollege"), 1217, 783, "White", "Black");
		DrawButton(1480, 750, 64, 64, "", "White", ImportBondageCollegeData ? "Icons/Checked.png" : "");
	}

}

/**
 * Handles the server response to a creation request. Creates the character, if possible,
 * initializes the basic data and sends the newborn to the maid in the main hall.
 * @param {ServerAccountCreateResponse} data - The recieved data from the server
 * @returns {void} - Nothing
 */
function CreationResponse(data) {
	if (typeof data === "string") {
		CreationMessage = data;
	} else if (CommonIsObject(data)) {
		if (data.ServerAnswer == "AccountCreated") {

			CreationMessage = "";

			const appearance = ServerAppearanceBundle(Player.Appearance);

			// Initialise player from the received data
			const createData = /** @type {ServerAccountData} */ ({
				ID: data.OnlineID,
				MemberNumber: data.MemberNumber,
				AccountName: ElementValue("InputName"),
				Name: ElementValue("InputCharacter"),
				Creation: CurrentTime,
				Appearance: appearance,
				Money: 100,
			});

			LoginSetupPlayer(createData);

			// Force an appearance sync here since we've provided the new one manually
			ServerPlayerAppearanceSync();

			ImportBondageCollege(Player);

			// Lifted from LoginResponse
			AfkTimerSetEnabled(Player.OnlineSettings.EnableAfkTimer);
			ActivitySetArousal(Player, 0);
			ActivityTimerProgress(Player, 0);
			NotificationLoad();

			// New accounts aren't updating from old version
			CommonVersionUpdated = false;

			// Flush the controls and enters the main hall
			ElementRemove("InputCharacter");
			ElementRemove("InputName");
			ElementRemove("InputPassword1");
			ElementRemove("InputPassword2");
			ElementRemove("InputEmail");
			CommonSetScreen("Room", "MainHall");

		} else {
			CreationMessage = TextGet("Error") + " " + data.ServerAnswer;
		}
	} else {
		CreationMessage = TextGet("InvalidServerAnswer");
	}
}

/**
 * Handles click events in the creation dialog.
 * Imports data from Bondage College and creates a character.
 * @returns {void} - Nothing
 */
function CreationClick() {

	// If we must check or uncheck the importation checkbox
	if ((MouseX >= 1480) && (MouseX <= 1544) && (MouseY >= 750) && (MouseY <= 814) && ImportBondageCollegeData)
		ImportBondageCollegeData = !ImportBondageCollegeData;

	// If we must go back to the login screen
	if ((MouseX >= 1440) && (MouseX <= 1560) && (MouseY >= 920) && (MouseY <= 980)) {
		CreationExit();
	}

	// If we must try to create a new account (make sure we don't create it twice)
	if ((MouseX >= 1050) && (MouseX <= 1450) && (MouseY >= 825) && (MouseY <= 885) && (CreationMessage != TextGet("CreatingCharacter"))) {

		// First, we make sure both passwords are the same
		var CharacterName = ElementValue("InputCharacter");
		var Name = ElementValue("InputName");
		var Password1 = ElementValue("InputPassword1");
		var Password2 = ElementValue("InputPassword2");
		var Email = ElementValue("InputEmail");

		// If info is not too long
		if (CharacterName.length <= 20 && Name.length <= 20 && Password1.length <= 20) {
			// If both password matches
			if (Password1 == Password2) {

				// Makes sure the data is valid
				if (CharacterName.match(ServerCharacterNameRegex) && Name.match(ServerAccountNameRegex) && Password1.match(ServerAccountPasswordRegex) && (Email == "" || CommonEmailIsValid(Email))) {
					CreationMessage = TextGet("CreatingCharacter");
					ServerSend("AccountCreate", { Name: CharacterName, AccountName: Name, Password: Password1, Email: Email });
				}
				else
					CreationMessage = TextGet("InvalidData");

			} else CreationMessage = TextGet("BothPasswordDoNotMatch");
		} else CreationMessage = TextGet("PasswordTooLong");
	}

}

// when the user exit this screen
/**
 * Does the cleanup, if the user exits the screen
 * @type {ScreenExitHandler}
 */
function CreationExit() {
	ElementRemove("InputCharacter");
	ElementRemove("InputName");
	ElementRemove("InputPassword1");
	ElementRemove("InputPassword2");
	ElementRemove("InputEmail");
	CommonSetScreen("Character", "Login");
}

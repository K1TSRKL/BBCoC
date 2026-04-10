"use strict";
/** @type {null | string[][]} */
let OnlineGameDictionary = null;

/** @type {((gameDict: string[][]) => void) | undefined} */
let OnlineGameTranslateResolve = undefined;

/**
 * Loads the online game dictionary that will be used throughout the game to output messages
 * @returns {void} - Nothing
 */
function OnlneGameDictionaryLoad() {
	if (OnlineGameDictionary == null) {

		// Tries to read it from cache first
		var FullPath = "Screens/Online/Game/OnlineGameDictionary.csv";
		if (CommonCSVCache[FullPath]) {
			OnlineGameDictionary = CommonCSVCache[FullPath];
			return;
		}

		// Opens the file, parse it and returns the result in an object
		CommonGet(FullPath, function () {
			if (this.status == 200) {
				CommonCSVCache[FullPath] = CommonParseCSV(this.responseText);
				OnlineGameDictionary = CommonCSVCache[FullPath];
				OnlineGameTranslateResolve?.(OnlineGameDictionary);
			}
		});

		// If a translation file is available, we open the txt file and keep it in cache
		var TranslationPath = FullPath.replace(".csv", "_" + TranslationLanguage + ".txt");
		if (TranslationAvailable(TranslationPath))
			CommonGet(TranslationPath, function() {
				if (this.status == 200)
				{
					TranslationCache[TranslationPath] = TranslationParseTXT(this.responseText);
					OnlineGameTranslate(TranslationPath);
				}

			});
	}
}

/**
 * @param {string} CachePath
 */
function OnlineGameTranslate(CachePath) {
	if (!Array.isArray(TranslationCache[CachePath])) return;
	/** @type {typeof OnlineGameTranslateResolve} */
	const DoTranslate = (gameDict) => {
		for (let T = 0; T < gameDict.length; T++) {
			if (gameDict[T][1]) {
				let indexText = TranslationCache[CachePath].indexOf(gameDict[T][1].trim());
				if (indexText >= 0) {
					gameDict[T][1] = TranslationCache[CachePath][indexText + 1];
				}
			}
		}
	};
	if(OnlineGameDictionary) DoTranslate(OnlineGameDictionary);
	else OnlineGameTranslateResolve = DoTranslate;
}
/**
 * Searches in the dictionary for a specific keyword and returns the message linked to it
 * @param {string} KeyWord - Keyword of the text to look for
 * @returns {string} The text attached to the keyword, will return a missing text if it was not found
 */
function OnlineGameDictionaryText(KeyWord) {
	if (OnlineGameDictionary) {
		for (let D = 0; D < OnlineGameDictionary.length; D++)
			if (OnlineGameDictionary[D][0] === ChatRoomGetGame() + KeyWord)
				return OnlineGameDictionary[D][1].trim();
	}
	return "MISSING ONLINE GAME DESCRIPTION FOR KEYWORD " + KeyWord;
}

/**
 * Catches the character click from chat rooms and make sure the online game doesn't need to handle them
 * @param {Character} C - Character that has been clicked on
 * @return {boolean} Returns the return content of click function of the currently selected game, or false if there is no corresponding game
 */
function OnlineGameClickCharacter(C) {
	if ((ChatRoomGetGame() === "LARP") && (GameLARPGetStatus() != "")) return GameLARPCharacterClick(C);
	if ((ChatRoomGetGame() === "MagicBattle") && (GameMagicBattleGetStatus() != "")) return GameMagicBattleCharacterClick(C);
	return false;
}

/**
 * Catches the chat room clicks and make sure the online game doesn't need to handle them
 * @return {boolean} Returns the return content of click function of the currently selected game, or false if there is no corresponding game
 */
function OnlineGameClick() {
	if ((ChatRoomGetGame() === "LARP") && (GameLARPGetStatus() != "")) return GameLARPClickProcess();
	if ((ChatRoomGetGame() === "MagicBattle") && (GameMagicBattleGetStatus() != "")) return GameMagicBattleClickProcess();
	return false;
}

/**
 * Run the corresponding online game scripts
 * @returns {void} - Nothing
 */
function OnlineGameRun() {

	// In LARP, the player turn can be skipped by an administrator after 20 seconds
	if (ChatRoomGetGame() === "LARP") GameLARPRunProcess();
	if (ChatRoomGetGame() === "MagicBattle") GameMagicBattleRunProcess();

}

/**
 * Checks if clothes can be changed in an online game space
 * @returns {boolean} - Returns TRUE if there's no online game that currently blocks changing
 */
function OnlineGameAllowChange() {
	if ((ChatRoomGetGame() === "LARP") && (GameLARPGetStatus() != "")) return false;
	if ((ChatRoomGetGame() === "MagicBattle") && (GameMagicBattleGetStatus() != "")) return false;
	return true;
}

/**
 * Checks if blocking items is currently allowed
 * @returns {boolean} - Returns TRUE if the online game allows you to block items
 */
function OnlineGameAllowBlockItems() {
	if ((ChatRoomGetGame() === "LARP") && (GameLARPGetStatus() != "")) return false;
	if ((ChatRoomGetGame() === "MagicBattle") && (GameMagicBattleGetStatus() != "")) return false;
	return true;
}

/**
 * Retrieves the current status of online games and stores it
 * @returns {void} - Nothing
 */
function OnlineGameLoadStatus() {
	if (ChatRoomGetGame() === "ClubCard") GameClubCardLoadStatus();
	if (ChatRoomGetGame() === "LARP") GameLARPLoadStatus();
	if (ChatRoomGetGame() === "MagicBattle") GameMagicBattleLoadStatus();
}

/**
 * Resets the game status if needed when the chat room data is updated
 * @returns {void} - Nothing
 */
function OnlineGameReset() {
	switch (ChatRoomGetGame()) {
		case "ClubCard":
			GameClubCardReset();
			break;
		case "LARP":
			GameLARPReset();
			break;
		case "MagicBattle":
			GameMagicBattleReset();
			break;
		case "GGTS":
			AsylumGGTSReset();
			break;
	}
}

/**
 * Returns TRUE if the MemberPlayer supplied is still in the current chat room
 * @param {number} MemberNumber - The number to validate
 * @returns {boolean} - Returns TRUE if that number is still in the room
 */
function OnlineGameCharacterInChatRoom(MemberNumber) {
	for (let C = 0; C < ChatRoomCharacter.length; C++)
		if (ChatRoomCharacter[C].MemberNumber == MemberNumber)
			return true;
	return false;
}

/**
 * Draws the online game images/text needed on the characters
 * @param {Character} C - Character to draw the info for
 * @param {number} X - Position of the character the X axis
 * @param {number} Y - Position of the character the Y axis
 * @param {number} Zoom - Amount of zoom the character has (Height)
 * @returns {void} - Nothing
 */
function OnlineGameDrawCharacter(C, X, Y, Zoom) {
	if (ChatRoomGetGame() === "GGTS") AsylumGGTSDrawCharacter(C, X, Y, Zoom);
	if (ChatRoomGetGame() === "ClubCard") GameClubCardDrawCharacter(C, X, Y, Zoom);
	if (ChatRoomGetGame() === "LARP") GameLARPDrawCharacter(C, X, Y, Zoom);
	if (ChatRoomGetGame() === "MagicBattle") GameMagicBattleDrawCharacter(C, X, Y, Zoom);
}

/**
 * Returns whether the room's current game has a specific option screen
 */
function OnlineGameHasOptions() {
	switch (ChatRoomGetGame()) {
		case "ClubCard":
			return true;
		case "LARP":
			return true;
		case "MagicBattle":
			return true;
		case "GGTS":
			return false;
		case "Prison":
			return false;
		default:
			return false;
	}
}

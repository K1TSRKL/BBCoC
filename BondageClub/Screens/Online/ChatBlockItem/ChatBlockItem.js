"use strict";
var ChatBlockItemBackground = "Sheet";
/** @type {ServerChatRoomBlockCategory[]} */
var ChatBlockItemList = ["ABDL", "SciFi", "Fantasy", "Leashing", "Photos", "Arousal", "Smoking"];
/** @type {ServerChatRoomBlockCategory[]} */
var ChatBlockItemCategory = [];
var ChatBlockItemEditable = true;
/** @type {ScreenSpecifier | null} */
var ChatBlockItemReturnScreen = null;

/**
 * Loads the chat room item blocking screen
 * @type {ScreenLoadHandler}
 */
async function ChatBlockItemLoad() {
}

/** @type {CommonGenerateGridParameters} */
let ChatBlockListGridParams = {
	x: 200,
	y: 200,
	width: 2000 - 400,
	height: 1000 - 400,
	itemWidth: 450,
	itemHeight: 64,
	itemMarginY: 12,
	direction: "vertical",
};

/**
 * When the chat room item blocking screen runs, draws the screen
 * @returns {void} - Nothing
 */
function ChatBlockItemRun() {
	DrawText(TextGet("Title"), 1000, 150, "Black", "Gray");
	MainCanvas.textAlign = "left"; // For the checkbox text alignment
	CommonGenerateGrid(ChatBlockItemList, 0, ChatBlockListGridParams, (item, x, y, w, h) => {
		DrawCheckbox(x, y, 64, h, TextGet(item), ChatBlockItemCategory.includes(item), !ChatBlockItemEditable, "Black");
		return false;
	});
	MainCanvas.textAlign = "center";
	DrawButton(850, 800, 300, 65, TextGet("Return"), "White");
}

/**
 * Handles the click events on the chat room item blocking screen. Called from CommonClick()
 * @returns {void} - Nothing
 */
function ChatBlockItemClick() {
	if (MouseIn(850, 800, 300, 65)) ChatBlockItemExit();
	if (!ChatBlockItemEditable) return;
	CommonGenerateGrid(ChatBlockItemList, 0, ChatBlockListGridParams, (item, x, y, w, h) => {
		if (MouseIn(x, y, w, h)) {
			const idx = ChatBlockItemCategory.indexOf(item);
			if (idx < 0) {
				ChatBlockItemCategory.push(item);
			} else {
				ChatBlockItemCategory.splice(idx, 1);
			}
			return true;
		} else {
			return false;
		}
	});
}

/**
 * Handles exiting from the screen
 * @type {ScreenExitHandler}
 */
function ChatBlockItemExit() {
	if (ChatBlockItemReturnScreen) {
		CommonSetScreen(...ChatBlockItemReturnScreen);
	}
	ChatBlockItemEditable = true;
}

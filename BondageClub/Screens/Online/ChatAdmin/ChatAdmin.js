"use strict";
var ChatAdminBackground = "Sheet";
var ChatAdminMessage = "";
var ChatAdminBackgroundIndex = 0;
var ChatAdminPreviewBackgroundMode = false;
/** @type {ServerChatRoomGame[]} */
var ChatAdminGameList = ["", "ClubCard", "LARP", "MagicBattle", "GGTS"];
/**
 * @deprecated
 * @type {ServerChatRoomLanguage[]}
 */
var ChatAdminLanguageList = ServerChatRoomSupportedLanguages;
/** @type {null | string[]} */
var ChatAdminBackgroundList = null;
/** @type {ServerChatRoomLanguage} */
var ChatAdminDefaultLanguage = "EN";

// For the Visibility & Access UI elements
// TODO: Figure out a better way to handle this
var ChatAdminVisibilityModeLabels = CommonKeys(ChatRoomVisibilityMode);
var ChatAdminVisibilityModeValues = ChatAdminVisibilityModeLabels.map((key) => ChatRoomVisibilityMode[key]);
var ChatAdminVisibilityModeIndex = 0;
var ChatAdminAccessModeLabels = CommonKeys(ChatRoomAccessMode);
var ChatAdminAccessModeValues = ChatAdminAccessModeLabels.map((key) => ChatRoomAccessMode[key]);
var ChatAdminAccessModeIndex = 0;

/** @type {ChatRoomAdminSettings | null} */
var ChatAdminData = null;
/** @type {"create" | "update" | null} */
var ChatAdminMode = null;

/**
 * Show the room editor screen in creation mode
 */
function ChatAdminShowCreate() {
	ChatAdminStart("create");
}

/**
 * Show the room editor screen in update mode
 * @param {ChatRoom} roomData
 */
function ChatAdminShowEdit(roomData) {
	/** @type {ChatRoomSettings} */
	const copy = {
		Name: roomData.Name,
		Description: roomData.Description,
		Admin: roomData.Admin,
		Whitelist: roomData.Whitelist,
		Ban: roomData.Ban,
		Background: roomData.Background,
		Limit: roomData.Limit,
		Game: roomData.Game,
		Visibility: roomData.Visibility,
		Access: roomData.Access,
		BlockCategory: roomData.BlockCategory,
		Language: roomData.Language,
		Space: roomData.Space,
		MapData: roomData.MapData,
		Custom: roomData.Custom,
	};
	ChatAdminStart("update", copy);
}

/**
 * Sets up the chat room editor screen and switches to it
 *
 * This should not be called directly; use {@link ChatAdminShowCreate} or {@link ChatAdminShowEdit}
 *
 * @param {"create" | "update"} mode
 * @param {ChatRoomSettings | null} roomData
 */
function ChatAdminStart(mode, roomData = null) {
	ChatAdminMode = mode;
	if (mode === "create") {
		/** @type {("BlackList" | "GhostList")[]} */
		const banTypes = [];
		if (Player.OnlineSettings.AutoBanBlackList) {
			banTypes.push("BlackList");
		}
		if (Player.OnlineSettings.AutoBanGhostList) {
			banTypes.push("GhostList");
		}
		const banList = ChatRoomConcatenateBanList(banTypes);
		ChatAdminData = {
			Name: "",
			Description: "",
			Admin: [Player.MemberNumber],
			Whitelist: [],
			Ban: banList,
			Background: "",
			Limit: 10,
			Game: "",
			Visibility: ChatRoomVisibilityMode.PUBLIC,
			Access: ChatRoomAccessMode.PUBLIC,
			BlockCategory: [],
			Language: ChatAdminDefaultLanguage,
			Space: ChatSearchGetSpace() ?? undefined,
			MapData: { Type: "Never" },
			// Custom: {},
		};
	} else if (mode === "update") {
		if (roomData == null) {
			throw new Error(`missing room data for mode "${mode}"!`);
		}
		const MapData = {
			...(roomData.MapData ?? {}),
			Type: roomData.MapData?.Type ?? "Never",
		};
		ChatAdminData = { ...roomData, MapData };
	} else {
		throw new Error(`invalid mode "${mode}"!`);
	}
	CommonSetScreen("Online", "ChatAdmin");
}

/**
 * Return whether the editor can actually modify the data
 * @returns {boolean}
 */
function ChatAdminCanEdit() {
	return ChatAdminMode === "create" || !!ChatAdminData?.Admin.includes(Player.MemberNumber);
}

/**
 * Loads the given room data and sets up the UI for it
 * @type {ScreenLoadHandler}
 */
async function ChatAdminLoad() {
	const adminData = ChatAdminData;
	if (!adminData) {
		throw new Error('Missing "ChatAdminData" data');
	} else if (!adminData.Background) {
		adminData.Background = Player.OnlineSettings.DefaultChatRoomBackground;
	}
	ChatAdminBackgroundList = BackgroundsGenerateList(ChatSearchBackgroundTagList);

	// We have to reload the index here because we might be coming back from the background selection screen
	ChatAdminBackgroundIndex = ChatAdminBackgroundList.indexOf(adminData.Background);
	if (ChatAdminBackgroundIndex < 0) ChatAdminBackgroundIndex = 0;
	adminData.Background = ChatAdminBackgroundList[ChatAdminBackgroundIndex];

	// We have to reload the Visibility & Access mode indices to cover the case where it was changed by someone else or not through the UI
	// Note that we are using .findIndex() and .sort().join(',') (hacky way to compare string arrays) because we're looking for an [] in an [][].
	ChatAdminVisibilityModeIndex = ChatAdminVisibilityModeValues.findIndex((rolesAllowed) => rolesAllowed.sort().join(',') === adminData.Visibility.sort().join(','));
	if (ChatAdminVisibilityModeIndex < 0) ChatAdminVisibilityModeIndex = 0;
	ChatAdminAccessModeIndex = ChatAdminAccessModeValues.findIndex((rolesAllowed) => rolesAllowed.sort().join(',') === adminData.Access.sort().join(','));
	if (ChatAdminAccessModeIndex < 0) ChatAdminAccessModeIndex = 0;

	// Sets the chat room language
	if (adminData.Language == null) adminData.Language = ServerChatRoomSupportedLanguages[0];
	if (!ServerChatRoomSupportedLanguages.includes(adminData.Language)) adminData.Language = ServerChatRoomSupportedLanguages[0];

	// Prepares the controls to edit a room
	const nameInput = ElementCreateInput("InputName", "text", adminData.Name, "20");
	nameInput.setAttribute("autocomplete", "off");
	nameInput.setAttribute("pattern", "^[\x20-\x7E]+$");
	const sizeInput = ElementCreateInput("InputSize", "number", adminData.Limit.toString());
	sizeInput.setAttribute("min", "2");
	sizeInput.setAttribute("max", "20");
	sizeInput.setAttribute("autocomplete", "off");
	const descInput = ElementCreateTextArea("InputDescription");
	descInput.setAttribute("maxLength", ServerChatRoomDescriptionMaxLength);
	descInput.setAttribute("autocomplete", "off");
	descInput.setAttribute("placeholder", TextGet("InputDescriptionPlaceholder"));
	ElementValue("InputDescription", adminData.Description);
	const adminListInput = ElementCreateTextArea("InputAdminList");
	adminListInput.setAttribute("maxLength", 2000);
	adminListInput.setAttribute("autocomplete", "off");
	adminListInput.setAttribute("placeholder", TextGet("MemberNumbersFormatPlaceholder"));
	ElementValue("InputAdminList", CommonConvertArrayToString(adminData.Admin));
	const whitelistInput = ElementCreateTextArea("InputWhitelist");
	whitelistInput.setAttribute("maxLength", 2000);
	whitelistInput.setAttribute("autocomplete", "off");
	whitelistInput.setAttribute("placeholder", TextGet("MemberNumbersFormatPlaceholder"));
	ElementValue("InputWhitelist", CommonConvertArrayToString(adminData.Whitelist));
	const banListInput = ElementCreateTextArea("InputBanList");
	banListInput.setAttribute("maxLength", 2000);
	banListInput.setAttribute("autocomplete", "off");
	banListInput.setAttribute("placeholder", TextGet("MemberNumbersFormatPlaceholder"));
	ElementValue("InputBanList", CommonConvertArrayToString(adminData.Ban));

	// If the player isn't an admin, we disable the inputs
	if (!ChatAdminCanEdit()) {
		nameInput.setAttribute("disabled", "disabled");
		descInput.setAttribute("disabled", "disabled");

		// We also garble them if possible
		ElementValue("InputName", ChatSearchMuffle(adminData.Name));
		ElementValue("InputDescription", ChatSearchMuffle(adminData.Description));

		adminListInput.setAttribute("disabled", "disabled");
		whitelistInput.setAttribute("disabled", "disabled");
		banListInput.setAttribute("disabled", "disabled");
		sizeInput.setAttribute("disabled", "disabled");
		ChatAdminMessage = "AdminOnly";
	} else {
		ChatAdminMessage = "QuickaddExplanation";
	}
	TextPrefetch("Online", "ChatBlockItem");
}

/**
 * Handles unloading the editor screen
 * @type {ScreenUnloadHandler}
 */
function ChatAdminUnload() {
	ElementRemove("InputName");
	ElementRemove("InputDescription");
	ElementRemove("InputSize");
	ElementRemove("InputAdminList");
	ElementRemove("InputWhitelist");
	ElementRemove("InputBanList");
}

/**
 * Handles drawing the editor screen
 */
function ChatAdminRun() {
	const adminData = ChatAdminData;
	const backgroundList = ChatAdminBackgroundList;
	if (!adminData || !backgroundList) {
		return;
	} else if (ChatAdminPreviewBackgroundMode) {
		ChatAdminBackground = adminData.Background;
		DrawButton(40, 40, 260, 60, TextGet("ReturnMenu"), "White");
		return;
	}

	const canEdit = ChatAdminCanEdit();
	// Grey button backgrounds if the player isn't an admin
	const ButtonBackground = canEdit ? "White" : "#ebebe4";

	// Draw the main controls
	DrawText(TextGet(ChatAdminMessage), 675, 910, "Black", "Gray");
	DrawText(TextGet("RoomName"), 250, 105, "Black", "Gray");
	ElementPosition("InputName", 780, 100, 750);
	DrawText(TextGet("RoomLanguage"), 250, 190, "Black", "Gray");
	// FIXME: technically the `TextGet` is only needed for the "All language" cases,
	// but we also support Spanish as a room language which isn't actually in the translation files
	const languageLabel = TranslationGetLanguageName(adminData.Language, true) || TextGet("Language" + adminData.Language);
	const languageBGColor = canEdit && MouseIn(405, 157, 300, 60) ? "Cyan" : ButtonBackground;
	DrawButton(405, 157, 300, 60, languageLabel, languageBGColor, null, null, !ChatRoomPlayerIsAdmin());
	DrawText(TextGet("RoomSize"), 850, 190, "Black", "Gray");
	ElementPosition("InputSize", 1064, 185, 180);
	DrawText(TextGet("RoomDescription"), 675, 250, "Black", "Gray");
	ElementPosition("InputDescription", 675, 355, 1100, 170);
	DrawText(TextGet("RoomAdminList"), 295, 475, "Black", "Gray");
	ElementPosition("InputAdminList", 295, 615, 340, 240);
	DrawText(TextGet("RoomWhitelist"), 675, 475, "Black", "Gray");
	ElementPosition("InputWhitelist", 675, 615, 340, 240);
	DrawText(TextGet("RoomBanList"), 1055, 475, "Black", "Gray");
	ElementPosition("InputBanList", 1055, 615, 340, 240);
	DrawButton(125, 746, 340, 60, TextGet("QuickaddAdminOwner"), ButtonBackground, null, null, !canEdit);
	DrawButton(125, 816, 340, 60, TextGet("QuickaddAdminLovers"), ButtonBackground, null, null, !canEdit);
	DrawButton(505, 746, 165, 60, TextGet("QuickaddWhitelistOwner"), ButtonBackground, null, null, !canEdit);
	DrawButton(680, 746, 165, 60, TextGet("QuickaddWhitelistLovers"), ButtonBackground, null, null, !canEdit);
	DrawButton(505, 816, 165, 60, TextGet("QuickaddWhitelistFriends"), ButtonBackground, null, null, !canEdit);
	DrawButton(680, 816, 165, 60, TextGet("QuickaddWhitelistWhitelist"), ButtonBackground, null, null, !canEdit);
	DrawButton(885, 746, 340, 60, TextGet("QuickaddBanBlacklist"), ButtonBackground, null, null, !canEdit);
	DrawButton(885, 816, 340, 60, TextGet("QuickaddBanGhostlist"), ButtonBackground, null, null, !canEdit);

	// Import & export buttons
	DrawButton(1174, 76, 48, 48, "", ButtonBackground, undefined, undefined, !canEdit);
	DrawButton(1174, 160, 48, 48, "", "White");
	// We draw the icons separately to allow for resizing.
	DrawImageResize("Icons/Upload.png", 1176, 78, 44, 44);
	DrawImageResize("Icons/Download.png", 1176, 162, 44, 44);
	// We also draw the tooltips separately to prevent conflicting with adjacent DOM elements (which take render priority over canvas)
	if (!CommonIsMobile && !CommonPhotoMode) {
		if (MouseIn(1174, 76, 48, 48)) // Upload (Import)
			DrawHoverElements.push(() => DrawButtonHover(1247, 20, 48, 48, TextGet("UploadTooltip")));
		if (MouseIn(1174, 160, 48, 48)) // Download (Export)
			DrawHoverElements.push(() => DrawButtonHover(1247, 218, 48, 48, TextGet("DownloadTooltip")));
	}

	// Background selection, block button and game selection
	DrawImageResize("Backgrounds/" + adminData.Background + ".jpg", 1300, 75, 600, 350);
	DrawBackNextButton(1300, 450, 500, 60, BackgroundsTextGet(adminData.Background), ButtonBackground, null,
		() => BackgroundsTextGet((ChatAdminBackgroundIndex == 0) ? backgroundList[backgroundList.length - 1] : backgroundList[ChatAdminBackgroundIndex - 1]),
		() => BackgroundsTextGet((ChatAdminBackgroundIndex >= backgroundList.length - 1) ? backgroundList[0] : backgroundList[ChatAdminBackgroundIndex + 1]),
		!canEdit);
	DrawButton(1840, 450, 60, 60, "", ButtonBackground, "Icons/Small/Preference.png", null, !canEdit);
	DrawButton(1300, 550, 275, 60, TextGet("BlockCategory"), "White");
	DrawBackNextButton(1625, 550, 275, 60, TextGet("Game" + adminData.Game), ButtonBackground, null, () => "", () => "");
	DrawButton(1300, 640, 275, 60, TextGet("RoomCustomization"), (adminData.Custom == null) ? "White" : "#B0FFB0");
	DrawBackNextButton(1625, 640, 275, 60, TextGet("Map" + adminData.MapData.Type), ButtonBackground, null, () => "", () => "", !canEdit);
	if (MouseIn(1625, 640, 275, 60)) {
		DrawHoverElements.push(() => {
			DrawButtonHover(1625, 630, 275, 60, TextGet(`Map${adminData.MapData.Type}Tooltip`));
		});
	}

	// Visibility and access mode text & selections
	DrawText(TextGet("VisibilityModeHeader"), 1438, 733, "Black", "Gray");
	DrawBackNextButton(1300, 755, 275, 60, TextGet(`VisibilityMode${ChatAdminVisibilityModeLabels[ChatAdminVisibilityModeIndex]}`), ButtonBackground, null,
		() => TextGet(`VisibilityMode${ChatAdminVisibilityModeLabels[(ChatAdminVisibilityModeIndex == 0) ? ChatAdminVisibilityModeLabels.length - 1 : ChatAdminVisibilityModeIndex - 1]}`),
		() => TextGet(`VisibilityMode${ChatAdminVisibilityModeLabels[(ChatAdminVisibilityModeIndex >= ChatAdminVisibilityModeLabels.length - 1) ? 0 : ChatAdminVisibilityModeIndex + 1]}`),
		!canEdit);
	DrawText(TextGet("AccessModeHeader"), 1763, 733, "Black", "Gray");
	DrawBackNextButton(1625, 755, 275, 60, TextGet(`AccessMode${ChatAdminAccessModeLabels[ChatAdminAccessModeIndex]}`), ButtonBackground, null,
		() => TextGet(`AccessMode${ChatAdminAccessModeLabels[(ChatAdminAccessModeIndex == 0) ? ChatAdminAccessModeLabels.length - 1 : ChatAdminAccessModeIndex - 1]}`),
		() => TextGet(`AccessMode${ChatAdminAccessModeLabels[(ChatAdminAccessModeIndex >= ChatAdminAccessModeLabels.length - 1) ? 0 : ChatAdminAccessModeIndex + 1]}`),
		!canEdit);

	// Save & Cancel/Exit buttons + help text
	const commitLabel = ChatAdminMode === "create" ? TextGet("Create") : TextGet("Save");
	DrawButton(1325, 840, 250, 65, commitLabel, ButtonBackground, null, null, !canEdit);
	DrawButton(1625, 840, 250, 65, TextGet(canEdit ? "Cancel" : "Exit"), "White");
}

/**
 * Handles the click events on the editor screen. Is called from CommonClick()
 * @returns {void} - Nothing
 */
function ChatAdminClick() {
	const adminData = ChatAdminData;
	if (!adminData || !ChatAdminBackgroundList) {
		return;
	}

	// Background preview mode
	if (ChatAdminPreviewBackgroundMode || MouseIn(1300, 75, 600, 350)) {
		ChatAdminPreviewBackgroundMode = !ChatAdminPreviewBackgroundMode;
		ChatAdminBackground = "Sheet";
		ElementToggleGeneratedElements("ChatAdmin", !ChatAdminPreviewBackgroundMode);
		return;
	}

	// When the user cancels/exits
	if (MouseIn(1625, 840, 250, 65)) {
		ChatAdminExit();
		return;
	}

	// Import & export buttons
	if (MouseIn(1174, 76, 48, 48)) { // Upload (Import)
		if (!ChatAdminCanEdit()) return;

		const code = prompt(TextGet("UploadPrompt"))?.trim();
		if (code == null) return; // User cancelled the prompt
		if (!code) {
			ChatAdminMessage = "UploadInvalidCode";
			return;
		}

		const decompressedJSON = LZString.decompressFromBase64(code);
		if (!decompressedJSON) {
			ChatAdminMessage = "UploadInvalidCode";
			return;
		}
		const data = CommonJSONParse(decompressedJSON);
		if (!data || !ChatEditorValidateAdminSettings(data)) {
			ChatAdminMessage = "UploadInvalidCode";
			return;
		}

		ChatEditorAdminSettingsImport(data);
		ChatAdminMessage = "UploadSuccess";
	} else if (MouseIn(1174, 160, 48, 48)) { // Download (Export)
		const code = LZString.compressToBase64(JSON.stringify(ChatEditorGetAdminSettings()));
		navigator.clipboard.writeText(code)
			.then(() => ChatAdminMessage = "DownloadSuccess")
			.catch(() => ChatAdminMessage = "DownloadFailed");
		return;
	}

	// Background selection button (admin only) and item block button (anyone)
	if ((MouseIn(1300, 75, 600, 350) || MouseIn(1840, 450, 60, 60) && ChatAdminCanEdit() || MouseIn(1300, 550, 275, 60) || MouseIn(1300, 640, 275, 60))) {
		// We save the current data so we can restore it when coming back from the subscreens
		Object.assign(
			adminData,
			{
				Name: ElementValue("InputName"),
				Description: ElementValue("InputDescription"),
				Limit: parseInt(ElementValue("InputSize"), 10),
				Admin: CommonConvertStringToArray(ElementValue("InputAdminList")),
				Whitelist: CommonConvertStringToArray(ElementValue("InputWhitelist")),
				Ban: CommonConvertStringToArray(ElementValue("InputBanList")),
			},
		);
		if (MouseIn(1300, 640, 275, 60)) {
			CommonSetScreen("Online", "ChatAdminRoomCustomization");
			return;
		} else if (MouseIn(1300, 550, 275, 60)) {
			ChatBlockItemEditable = ChatAdminCanEdit();
			ChatBlockItemReturnScreen = CommonGetScreen();
			ChatBlockItemCategory = adminData.BlockCategory;
			CommonSetScreen("Online", "ChatBlockItem");
			return;
		} else {
			BackgroundSelectionMake(ChatSearchBackgroundTagList, adminData.Background, (Name, setBackground) => {
				if (setBackground) adminData.Background = Name;
				CommonSetScreen("Online", "ChatAdmin");
			});
			return;
		}
	}

	// All other controls are for administrators only
	if (ChatAdminCanEdit()) {
		// When we select a new background
		if (MouseIn(1300, 450, 500, 60)) {
			ChatAdminBackgroundIndex += ((MouseX < 1550) ? -1 : 1);
			if (ChatAdminBackgroundIndex >= ChatAdminBackgroundList.length) ChatAdminBackgroundIndex = 0;
			if (ChatAdminBackgroundIndex < 0) ChatAdminBackgroundIndex = ChatAdminBackgroundList.length - 1;
			adminData.Background = ChatAdminBackgroundList[ChatAdminBackgroundIndex];
			return;
		}

		// When we select a new game type
		if (MouseIn(1625, 550, 275, 60)) {
			let Index = ChatAdminGameList.indexOf(adminData.Game);
			Index = Index + ((MouseX < 1763) ? -1 : 1);
			if (Index < 0) Index = ChatAdminGameList.length - 1;
			if (Index >= ChatAdminGameList.length) Index = 0;
			adminData.Game = ChatAdminGameList[Index];
			return;
		}

		// When we select a new map type
		if (MouseIn(1625, 640, 275, 60)) {
			let Index = ChatRoomMapViewTypeList.indexOf(adminData.MapData.Type);
			Index = Index + ((MouseX < 1763) ? -1 : 1);
			if (Index < 0) Index = ChatRoomMapViewTypeList.length - 1;
			if (Index >= ChatRoomMapViewTypeList.length) Index = 0;
			adminData.MapData.Type = ChatRoomMapViewTypeList[Index];
			return;
		}

		if (MouseIn(405, 157, 300, 60)) {
			let Pos = ServerChatRoomSupportedLanguages.indexOf(adminData.Language) + 1;
			if (Pos >= ServerChatRoomSupportedLanguages.length) Pos = 0;
			adminData.Language = ServerChatRoomSupportedLanguages[Pos];
			return;
		}

		// When we select a new visibility mode
		if (MouseIn(1300, 755, 275, 60)) {
			ChatAdminVisibilityModeIndex += ((MouseX < 1438) ? -1 : 1);
			if (ChatAdminVisibilityModeIndex >= ChatAdminVisibilityModeValues.length) ChatAdminVisibilityModeIndex = 0;
			if (ChatAdminVisibilityModeIndex < 0) ChatAdminVisibilityModeIndex = ChatAdminVisibilityModeValues.length - 1;
			adminData.Visibility = ChatAdminVisibilityModeValues[ChatAdminVisibilityModeIndex];
			return;
		}

		// When we select a new access mode
		if (MouseIn(1625, 755, 275, 60)) {
			ChatAdminAccessModeIndex += ((MouseX < 1763) ? -1 : 1);
			if (ChatAdminAccessModeIndex >= ChatAdminAccessModeValues.length) ChatAdminAccessModeIndex = 0;
			if (ChatAdminAccessModeIndex < 0) ChatAdminAccessModeIndex = ChatAdminAccessModeValues.length - 1;
			adminData.Access = ChatAdminAccessModeValues[ChatAdminAccessModeIndex];
			return;
		}

		// Save button + quickban buttons
		if (MouseIn(1325, 840, 250, 65)) ChatAdminCommit();
		if (MouseIn(125, 746, 340, 60)) ElementValue("InputAdminList", CommonConvertArrayToString(ChatRoomConcatenateWhitelist(["Owner"], CommonConvertStringToArray(ElementValue("InputAdminList").trim()))));
		if (MouseIn(125, 816, 340, 60)) ElementValue("InputAdminList", CommonConvertArrayToString(ChatRoomConcatenateWhitelist(["Lovers"], CommonConvertStringToArray(ElementValue("InputAdminList").trim()))));
		if (MouseIn(505, 746, 165, 60)) ElementValue("InputWhitelist", CommonConvertArrayToString(ChatRoomConcatenateWhitelist(["Owner"], CommonConvertStringToArray(ElementValue("InputWhitelist").trim()))));
		if (MouseIn(680, 746, 165, 60)) ElementValue("InputWhitelist", CommonConvertArrayToString(ChatRoomConcatenateWhitelist(["Lovers"], CommonConvertStringToArray(ElementValue("InputWhitelist").trim()))));
		if (MouseIn(505, 816, 165, 60)) ElementValue("InputWhitelist", CommonConvertArrayToString(ChatRoomConcatenateWhitelist(["Friends"], CommonConvertStringToArray(ElementValue("InputWhitelist").trim()))));
		if (MouseIn(680, 816, 165, 60)) ElementValue("InputWhitelist", CommonConvertArrayToString(ChatRoomConcatenateWhitelist(["Whitelist"], CommonConvertStringToArray(ElementValue("InputWhitelist").trim()))));
		if (MouseIn(885, 746, 340, 60)) ElementValue("InputBanList", CommonConvertArrayToString(ChatRoomConcatenateBanList(["BlackList"], CommonConvertStringToArray(ElementValue("InputBanList").trim()))));
		if (MouseIn(885, 816, 340, 60)) ElementValue("InputBanList", CommonConvertArrayToString(ChatRoomConcatenateBanList(["GhostList"], CommonConvertStringToArray(ElementValue("InputBanList").trim()))));
	}
}

/**
 * Handles accepting the room editor
 */
function ChatAdminCommit() {
	if (ChatAdminMode === "update") {
		ChatEditorUpdateRoom();
	} else {
		ChatEditorCreateRoom();
	}
}

/**
 * Handles the key presses while in the creation screen. When the user presses enter, we create the room.
 * @type {KeyboardEventListener}
 */
function ChatAdminKeyDown(event) {
	if (event.repeat) return false;

	if (CommonKey.IsPressed(event, "Enter")) {
		ChatAdminCommit();
		return true;
	}
	return false;
}

/**
 * Handles exiting from the editor screen, removes the inputs and resets the state of the variables
 * @type {ScreenExitHandler}
 */
function ChatAdminExit() {
	AsylumGGTSReset();
	ChatAdminData = null;

	if (ChatAdminMode === "update") {
		CommonSetScreen("Online", "ChatRoom");
	} else {
		CommonSetScreen("Online", "ChatSearch");
	}
}

/**
 * Validates whether the given settings is in the correct format for a ChatRoomAdminSettings object
 * @param {unknown} settings - The settings to validate
 * @returns {settings is ChatRoomAdminSettings} - True if the settings are valid, false otherwise
 */
function ChatEditorValidateAdminSettings(settings) {
	if (typeof settings !== "object" || settings === null) return false;
	const s = /** @type {ChatRoomAdminSettings} */ (settings);
	const isMemberNumber = (/** @type {unknown} */ n) => typeof n === "number" && Number.isInteger(n) && n > 0;
	/* eslint-disable indent */
	return typeof s.Name === "string" && /^[\x20-\x7E]+$/.test(s.Name)
		&& typeof s.Language === "string" && ServerChatRoomSupportedLanguages.includes(s.Language)
		&& typeof s.Description === "string" && s.Description.length <= ServerChatRoomDescriptionMaxLength
		&& typeof s.Background === "string" && ChatAdminBackgroundList != null && ChatAdminBackgroundList.indexOf(s.Background) >= 0
		&& typeof s.Limit === "number" && Number.isInteger(s.Limit) && s.Limit >= 2 && s.Limit <= 20
		&& Array.isArray(s.Admin) && s.Admin.every(isMemberNumber)
		&& Array.isArray(s.Whitelist) && s.Whitelist.every(isMemberNumber)
		&& Array.isArray(s.Ban) && s.Ban.every(isMemberNumber)
		&& Array.isArray(s.BlockCategory) && s.BlockCategory.every(cat => ChatBlockItemList.includes(cat))
		&& typeof s.Game === "string" && ChatAdminGameList.includes(s.Game)
		&& Array.isArray(s.Visibility) && ChatAdminVisibilityModeValues.some(v =>
			v.length === s.Visibility.length &&
			v.every(role => s.Visibility.includes(role))
		)
		&& Array.isArray(s.Access) && ChatAdminAccessModeValues.some(v =>
			v.length === s.Access.length &&
			v.every(role => s.Access.includes(role))
		)
		&& typeof s.MapData === "object" && (
			s.MapData !== null &&
			typeof s.MapData.Type === "string" &&
			ChatRoomMapViewTypeList.includes(s.MapData.Type) &&
			(s.MapData.Fog === undefined || typeof s.MapData.Fog === "boolean") &&
			// Not validating Tiles/Objects further as this is the standard set by ChatRoomMapViewPaste
			(s.MapData.Tiles === undefined || typeof s.MapData.Tiles === "string") &&
			(s.MapData.Objects === undefined || typeof s.MapData.Objects === "string")
		);
	/* eslint-enable indent */
}

/**
 * Imports the given ChatRoomAdminSettings into the editor inputs
 * @param {ChatRoomAdminSettings} settings - The chat room settings to import
 */
function ChatEditorAdminSettingsImport(settings) {
	if (!ChatAdminData) return;

	ElementValue("InputName", settings.Name);
	ElementValue("InputDescription", settings.Description);
	ElementValue("InputSize", settings.Limit.toString());
	ElementValue("InputAdminList", CommonConvertArrayToString(settings.Admin));
	ElementValue("InputWhitelist", CommonConvertArrayToString(settings.Whitelist));
	ElementValue("InputBanList", CommonConvertArrayToString(settings.Ban));

	ChatAdminData.Language = settings.Language;
	ChatAdminData.Background = settings.Background;
	ChatAdminData.Limit = settings.Limit;
	ChatAdminData.BlockCategory = settings.BlockCategory;
	ChatAdminData.Game = settings.Game;
	ChatAdminData.MapData = settings.MapData;
	ChatAdminData.Custom = settings.Custom;

	ChatAdminVisibilityModeIndex = ChatAdminVisibilityModeValues.findIndex(elem => elem.length === settings.Visibility.length && elem.every(role => settings.Visibility.includes(role)));
	ChatAdminAccessModeIndex = ChatAdminAccessModeValues.findIndex(elem => elem.length === settings.Access.length && elem.every(role => settings.Access.includes(role)));
	// This shouldn't happen due to validation, but just in case...
	if (ChatAdminVisibilityModeIndex < 0) ChatAdminVisibilityModeIndex = 0;
	if (ChatAdminAccessModeIndex < 0) ChatAdminAccessModeIndex = 0;

	ChatAdminData.Visibility = ChatAdminVisibilityModeValues[ChatAdminVisibilityModeIndex];
	ChatAdminData.Access = ChatAdminAccessModeValues[ChatAdminAccessModeIndex];
}

/**
 * Gathers the data from the editor inputs and returns it as a ChatRoomAdminSettings object
 * @returns {ChatRoomAdminSettings | undefined} - The chat room settings based on the current editor inputs, or undefined if ChatAdminData is not set
 */
function ChatEditorGetAdminSettings() {
	if (!ChatAdminData) return;

	return {
		Name: ElementValue("InputName").trim(),
		Language: ChatAdminData.Language,
		Description: ElementValue("InputDescription").trim(),
		Background: ChatAdminData.Background,
		Limit: parseInt(ElementValue("InputSize"), 10),
		Admin: CommonConvertStringToArray(ElementValue("InputAdminList").trim()),
		Whitelist: CommonConvertStringToArray(ElementValue("InputWhitelist").trim()),
		Ban: CommonConvertStringToArray(ElementValue("InputBanList").trim()),
		BlockCategory: ChatAdminData.BlockCategory,
		Game: ChatAdminData.Game,
		Visibility: ChatAdminData.Visibility,
		Access: ChatAdminData.Access,
		MapData: ChatAdminData.MapData,
		Custom: ChatAdminData.Custom
	};
}

/**
 * Sends the chat room data packet to the server. The response will be handled by ChatAdminResponse once it is received
 * @returns {void} - Nothing
 */
function ChatEditorUpdateRoom() {
	const UpdatedRoom = ChatEditorGetAdminSettings();
	if (!UpdatedRoom) return;
	if (UpdatedRoom.MapData.Type !== "Never") {
		if (!(UpdatedRoom.MapData.Tiles && UpdatedRoom.MapData.Objects))
			UpdatedRoom.MapData = Object.assign(ChatRoomMapViewInitialize(UpdatedRoom.MapData.Type), UpdatedRoom.MapData);
	}
	ServerSend("ChatRoomAdmin", { MemberNumber: Player.ID, Room: UpdatedRoom, Action: "Update" });
	ChatAdminMessage = "UpdatingRoom";
}

/**
 * Handles the reception of the server response after attempting to update a chatroom
 * @param {ServerChatRoomUpdateResponse} data - Response from the server ("Updated" or error message)
 * @returns {void} - Nothing
 */
function ChatAdminResponse(data) {
	if (typeof data !== "string") {
		ChatAdminMessage = "ResponseInvalidData";
		return;
	}

	if (data !== "Updated") {
		ChatAdminMessage = "Response" + data;
		return;
	}

	// This is a server message handler, and we might receive this while entering a room on relog,
	// when we update the room back to its proper initial state.
	// In that case, ignore the screen close, since we're actually on the ChatRoom screen.
	if (CurrentScreen === "ChatAdmin") {
		ChatAdminExit();
	}
}

/**
 * Sends the chat room data packet to the server and prepares the player to join a room. The response will be handled by ChatCreateResponse once it is received
 * @returns {void} - Nothing
 */
function ChatEditorCreateRoom() {
	if (!ChatAdminData) {
		return;
	}

	ServerAccountUpdate.QueueData({ RoomCreateLanguage: ChatAdminData.Language });
	ChatAdminDefaultLanguage = ChatAdminData.Language;
	/** @type {ChatRoomSettings} */
	const NewRoom = {
		Name: ElementValue("InputName").trim(),
		Language: ChatAdminData.Language,
		Description: ElementValue("InputDescription").trim(),
		Background: ChatAdminData.Background,
		Visibility: ChatAdminData.Visibility,
		Access: ChatAdminData.Access,
		Space: ChatAdminData.Space,
		Game: ChatAdminData.Game,
		Admin: CommonConvertStringToArray(ElementValue("InputAdminList").trim()),
		Whitelist: CommonConvertStringToArray(ElementValue("InputWhitelist").trim()),
		Ban: CommonConvertStringToArray(ElementValue("InputBanList").trim()),
		Limit: parseInt(ElementValue("InputSize"), 10),
		BlockCategory: ChatAdminData.BlockCategory,
		Custom: ChatAdminData.Custom
	};
	if (ChatAdminData.MapData.Type !== "Never") {
		if (ChatAdminData.MapData.Tiles && ChatAdminData.MapData.Objects)
			NewRoom.MapData = ChatAdminData.MapData;
		else
			NewRoom.MapData = ChatRoomMapViewInitialize(ChatAdminData.MapData.Type);
	}
	ServerSend("ChatRoomCreate", NewRoom);
	ChatAdminMessage = "CreatingRoom";
}

/**
 * Handles the reception of the server response after attempting to create a chatroom: shows the error message, if applicable
 * @param {ServerChatRoomCreateResponse} data - Response from the server
 * @returns {void} - Nothing
 */
function ChatCreateResponse(data) {
	if (typeof data !== "string") {
		ChatAdminMessage = "ResponseInvalidData";
		return;
	}

	ChatAdminMessage = "Response" + data;
}

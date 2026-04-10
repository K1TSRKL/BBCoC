"use strict";
var ChatAdminRoomCustomizationBackground = "Sheet";
/** @type {null | ServerChatRoomCustomData} */
var ChatAdminRoomCustomizationCurrent = null;
/** @type {null | HTMLAudioElement} */
var ChatAdminRoomCustomizationMusic = null;
/** @type {null | "MusicLibrary"} */
var ChatAdminRoomCustomizationMode = null;
/** @type {number} */
var ChatAdminRoomCustomizationSizeMode = 0;
var ChatAdminRoomCustomizationMusicLibrary = [
	{
		Name: "FantasyAmbience",
		URL: "https://bondageprojects.com/music/FantasyAmbience.mp3",
		Source: "https://www.youtube.com/watch?v=enk9srBmTqQ&ab_channel=Jota-RMusicChannel"
	},
	{
		Name: "HorrorAmbience",
		URL: "https://bondageprojects.com/music/HorrorAmbience.mp3",
		Source: "https://www.youtube.com/watch?v=1JnPSMNuHtw&ab_channel=MarcvanderMeulen%E2%99%AB"
	},
	{
		Name: "WesternAmbience",
		URL: "https://bondageprojects.com/music/WesternAmbience.mp3",
		Source: "https://www.youtube.com/watch?v=wTm-WFM0v-g&ab_channel=MrSnoozeIBackgroundMusicforVideos"
	},
	{
		Name: "MetalInstrumental2021",
		URL: "https://bondageprojects.com/music/MetalInstrumental2021.mp3",
		Source: "https://www.youtube.com/watch?v=AZum7ymw_Ws&ab_channel=MaximumOfHeaven"
	},
	{
		Name: "Pop2020",
		URL: "https://bondageprojects.com/music/Pop2020.mp3",
		Source: "https://www.youtube.com/watch?v=Y7Dk3_hA3-8&ab_channel=therealahmedtn"
	},
	{
		Name: "Pop2022",
		URL: "https://bondageprojects.com/music/Pop2022.mp3",
		Source: "https://www.youtube.com/watch?v=IW0QkXpQs3k&ab_channel=MusicToListen"
	},
	{
		Name: "ProgressiveHouse2022",
		URL: "https://bondageprojects.com/music/ProgressiveHouse2022.mp3",
		Source: "https://www.youtube.com/watch?v=u6PUX87ZaX0&ab_channel=ElectroDanceMixes"
	},
	{
		Name: "ElectroDance2022",
		URL: "https://bondageprojects.com/music/ElectroDance2022.mp3",
		Source: "https://www.youtube.com/watch?v=oqGEyAFf6MI&ab_channel=ElectroDanceMixes"
	},
	{
		Name: "ElectroDance2023",
		URL: "https://bondageprojects.com/music/ElectroDance2023.mp3",
		Source: "https://www.youtube.com/watch?v=7IjvFZox1Jc&ab_channel=ElectroDanceMixes"
	},
	{
		Name: "ElectroRoyKnox",
		URL: "https://bondageprojects.com/music/ElectroRoyKnox.mp3",
		Source: "https://www.youtube.com/watch?v=dh01eSOn9_E&ab_channel=MagicMusic"
	},
	{
		Name: "DanceElectroPop",
		URL: "https://bondageprojects.com/music/DanceElectroPop.mp3",
		Source: "https://www.youtube.com/watch?v=MEkaqZecpUQ&ab_channel=NoCopyrightSounds"
	},
	{
		Name: "DarkTechno",
		URL: "https://bondageprojects.com/music/DarkTechno.mp3",
		Source: "https://www.youtube.com/watch?v=iAguE62acA8&ab_channel=AimToHeadOfficial"
	}
];

/**
 * Checks whether the player is allowed to change customization settings
 * @returns {boolean} - true if the player is allowed to change customization settings, false otherwise
 */
function ChatAdminRoomCustomizationCanEdit() {
	// Either the player is creating the room or they're an admin of an existing one
	return (ChatRoomData === null) || ChatRoomPlayerIsAdmin();
}

/**
 * Changes a customiation value from a chat room command
 * @param {"Image" | "Filter" | "Music"} Property - The custom property to change (Image, Filter or Music)
 * @param {string} Value - The value to set in that property
 * @returns {void} - Nothing
 */
function ChatAdminRoomCustomizationCommand(Property, Value) {
	if (!ChatRoomData) {
		throw new Error('Missing "ChatRoomData" data');
	}

	// Command type & value must be valid and player must be a room administrator
	if ((Property == null) || (Value == null) || (typeof Value !== "string") || !ChatRoomPlayerIsAdmin()) return;
	Value = Value.trim();

	// Builds the custom object
	/** @type {undefined | ServerChatRoomCustomData} */
	let Custom = ChatRoomData.Custom;
	if (Custom == null) Custom = { ImageURL: "", ImageFilter: "", MusicURL: "" };
	if (Property == "Image") Custom.ImageURL = Value;
	if (Property == "Filter") Custom.ImageFilter = Value;
	if (Property == "Music") Custom.MusicURL = Value;
	if ((Custom.ImageURL == "") && (Custom.ImageFilter == "") && (Custom.MusicURL == "")) Custom = undefined;

	// Update the room's custom data
	const UpdatedRoom = ChatRoomGetSettings(ChatRoomData);
	UpdatedRoom.Custom = Custom;
	ServerSend("ChatRoomAdmin", { MemberNumber: Player.ID, Room: UpdatedRoom, Action: "Update" });

}

/**
 * Loads the chat Admin Custom screen properties and creates the inputs
 * @type {ScreenLoadHandler}
 */
async function ChatAdminRoomCustomizationLoad() {
	if (!ChatAdminData) {
		return;
	}
	const canEditCustom = ChatAdminRoomCustomizationCanEdit();

	ChatAdminRoomCustomizationMode = null;
	ChatAdminRoomCustomizationCurrent = null;
	const data = ChatAdminData.Custom ? CommonCloneDeep(ChatAdminData.Custom) : { ImageURL: "", ImageFilter: "", MusicURL: "", SizeMode: DrawingResizeMode.Fill };
	const imageInput = ElementCreateInput("InputImageURL", "text", data.ImageURL ?? "", "250");
	const filterInput = ElementCreateInput("InputImageFilter", "text", data.ImageFilter ?? "", "10");
	const musicInput = ElementCreateInput("InputMusicURL", "text", data.MusicURL ?? "", "250");
	imageInput.setAttribute("autocomplete", "off");
	filterInput.setAttribute("autocomplete", "off");
	musicInput.setAttribute("autocomplete", "off");
	if (!canEditCustom) {
		imageInput.toggleAttribute("disabled", true);
		filterInput.toggleAttribute("disabled", true);
		musicInput.toggleAttribute("disabled", true);
	}
	ChatAdminRoomCustomizationSizeMode = data.SizeMode ?? DrawingResizeMode.Fill;
}

function ChatAdminRoomCustomizationUnload() {
	ElementRemove("InputImageURL");
	ElementRemove("InputImageFilter");
	ElementRemove("InputMusicURL");
}

/**
 * Plays or stop the background music
 * @param {string} Music - The URL of the music to play
 * @returns {void} - Nothing
 */
function ChatAdminRoomCustomizationPlayMusic(Music) {

	// If no music should play
	if ((Music == null) || (Music == "")) {
		if ((ChatAdminRoomCustomizationMusic != null) && !ChatAdminRoomCustomizationMusic.paused) ChatAdminRoomCustomizationMusic.pause();
		return;
	}

	// Only allows .mp3 and .mp4 files for now
	if (!CommonURLHasExtension(Music, [".mp3", ".mp4"])) {
		if ((ChatAdminRoomCustomizationMusic != null) && !ChatAdminRoomCustomizationMusic.paused) ChatAdminRoomCustomizationMusic.pause();
		return;
	}

	// If volume is more than zero, we start the background music at lower volume
	const vol = (Player.AudioSettings.MusicVolume == null) ? 100 : Player.AudioSettings.MusicVolume;
	if (vol > 0) {
		if (ChatAdminRoomCustomizationMusic == null) ChatAdminRoomCustomizationMusic = new Audio();
		let FileName = Music.trim();
		if ((ChatAdminRoomCustomizationMusic.src == null) || (ChatAdminRoomCustomizationMusic.src.indexOf(FileName) < 0)) {
			ChatAdminRoomCustomizationMusic.currentTime = 0;
			ChatAdminRoomCustomizationMusic.src = FileName;
			ChatAdminRoomCustomizationMusic.volume = Math.min(vol, 1) * 0.25;
			ChatAdminRoomCustomizationMusic.play();
			ChatAdminRoomCustomizationMusic.addEventListener('ended', function(ev) {
				this.currentTime = 0;
				this.play();
			}, false);
		}
		if (ChatAdminRoomCustomizationMusic.paused) ChatAdminRoomCustomizationMusic.play();
	} else {
		if ((ChatAdminRoomCustomizationMusic != null) && !ChatAdminRoomCustomizationMusic.paused) ChatAdminRoomCustomizationMusic.pause();
		return;
	}

}

/**
 * Runs the customization on the current screen, can be called from elsewhere
 * @param {ServerChatRoomCustomData | null} Custom - The customization to apply
 * @param {Rect | null} DrawBGToRect - If non-null draw the background to these coordinates. Online chat rooms will use the tracked values elsewhere
 * @param {boolean} DrawBGEffects - If true and drawing a background then apply blur/dark/tint
 * @returns {void} - Nothing
 */
function ChatAdminRoomCustomizationProcess(Custom, DrawBGToRect, DrawBGEffects) {

	// Make sure the customization data is valid first
	if (Custom == null) {
		ChatRoomCustomizationClear();
		return;
	}

	// The background image full image URL over the current background
	ChatRoomCustomBackground = "";
	ChatRoomCustomSizeMode = null;
	let drewBackground = false;
	if ((Custom.ImageURL != null) && (typeof Custom.ImageURL === "string") && (Custom.ImageURL !== "") && (Custom.ImageURL.length <= 250)) {

		// Only allows .jpg and .png files for now
		let URL = Custom.ImageURL.trim();
		if (CommonURLHasExtension(URL, [".jpg", ".jpeg", ".png", ".webp"])) {
			if (DrawBGToRect != null) {
				const opts = {
					blur: DrawBGEffects ? Player.GetBlurLevel() : undefined,
					darken: DrawBGEffects ? DrawGetDarkFactor() : undefined,
					tints: DrawBGEffects ? Player.GetTints() : undefined,
					sizeMode: Custom.SizeMode
				};
				DrawRoomBackground(URL, DrawBGToRect, opts);
				drewBackground = true;
			}
			ChatRoomCustomBackground = URL;
			ChatRoomCustomSizeMode = Custom.SizeMode;
		}
	}

	// The image filter is a full rectangle over the current background
	ChatRoomCustomFilter = "";
	if ((Custom.ImageFilter != null) && (typeof Custom.ImageFilter === "string") && (Custom.ImageFilter !== "") && (Custom.ImageFilter.length <= 10)) {
		if (DrawBGToRect != null && !drewBackground) DrawRect(...RectGetFrame(DrawBGToRect), Custom.ImageFilter);
		ChatRoomCustomFilter = Custom.ImageFilter;
	}

	// The background music can be any MP3 file from the web
	if ((Custom.MusicURL != null) && (typeof Custom.MusicURL === "string") && (Custom.MusicURL.length <= 250))
		ChatAdminRoomCustomizationPlayMusic(Custom.MusicURL);
	else
		ChatAdminRoomCustomizationPlayMusic("");

}

/**
 * When the chat Admin Custom screen runs, draws the screen
 * @returns {void} - Nothing
 */
function ChatAdminRoomCustomizationRun() {
	const canEditCustom = ChatAdminRoomCustomizationCanEdit();
	const isAdmin = ChatRoomPlayerIsAdmin();

	// Shows the background and plays the music if needed
	ChatAdminRoomCustomizationProcess(ChatAdminRoomCustomizationCurrent, { x: 500, y: 1000 * (1 - ChatRoomCharacterViewZoom) / 2, w: 1000, h: 1000 * ChatRoomCharacterViewZoom }, false);

	// In no special mode
	if (ChatAdminRoomCustomizationMode == null) {
		DrawText(TextGet("Title"), 1000, 120, "Black", "White");
		DrawText(TextGet("BackgroundImage1"), 1000, 230, "Black", "White");
		DrawText(TextGet("BackgroundImage2"), 1000, 290, "Black", "White");
		ElementPosition("InputImageURL", 1000, 350, 1500);
		MainCanvas.textAlign = "left";
		const urlEmpty = !ElementValue("InputImageURL");
		const disableButton = urlEmpty || !canEditCustom;
		DrawCheckbox(205, 400, 64, 64, TextGet("BackgroundSizeMode1"), ChatAdminRoomCustomizationSizeMode == DrawingResizeMode.Fill && !urlEmpty, disableButton);
		DrawCheckbox(560, 400, 64, 64, TextGet("BackgroundSizeMode2"), ChatAdminRoomCustomizationSizeMode == DrawingResizeMode.FillOriginalRatio && !urlEmpty, disableButton);
		DrawCheckbox(1265, 400, 64, 64, TextGet("BackgroundSizeMode3"), ChatAdminRoomCustomizationSizeMode == DrawingResizeMode.ShowFullOriginalRatio && !urlEmpty, disableButton);
		MainCanvas.textAlign = "center";
		DrawText(TextGet("BackgroundFilter"), 1000, 530, "Black", "White");
		ElementPosition("InputImageFilter", 1000, 590, 250);
		DrawText(TextGet("BackgroundMusic"), 1000, 690, "Black", "White");
		ElementPosition("InputMusicURL", 880, 750, 1360);
		DrawButton(1570, 722, 200, 65, TextGet("Library"), "White");
	}

	// In music library mode
	if (ChatAdminRoomCustomizationMode === "MusicLibrary") {
		ElementPosition("InputImageURL", 1000, -10000, 1500);
		ElementPosition("InputImageFilter", 1000, -10000, 250);
		ElementPosition("InputMusicURL", 880, 720, 1360);
		DrawText(TextGet("TitleMusicLibrary"), 1000, 120, "Black", "White");
		DrawButton(1570, 692, 200, 65, TextGet("Return"), "White");
		for (let L = 0; L < ChatAdminRoomCustomizationMusicLibrary.length; L++) {
			let X = Math.floor(L % 3) * 600 + 115;
			let Y = Math.floor(L / 3) * 100 + 210;
			DrawButton(X, Y, 500, 65, TextGet("MusicLibrary" + ChatAdminRoomCustomizationMusicLibrary[L].Name), "White");
			DrawButton(X + 500, Y, 65, 65, "", "White", "Icons/Small/YouTube.png");
		}
	}

	// Shows the bottom buttons

	// Only enable preview button if the player is an admin and currently in a room
	DrawButton(425, 840, 250, 65, TextGet("Preview"), isAdmin ? "White" : "#ebebe4", null, null, !isAdmin);

	DrawButton(725, 840, 250, 65, TextGet("Clear"), canEditCustom ? "White" : "#ebebe4", null, null, !canEditCustom);
	DrawButton(1025, 840, 250, 65, TextGet("Save"), canEditCustom ? "White" : "#ebebe4", null, null, !canEditCustom);
	DrawButton(1325, 840, 250, 65, TextGet("Cancel"), "White");

}

/**
 * Handles the click events on the admin custom screen. Is called from CommonClick()
 * @returns {void} - Nothing
 */
function ChatAdminRoomCustomizationClick() {

	// TO DO : REMOVE
	/*if (MouseIn(1800, 800, 200, 200)) {
		ElementValue("InputImageURL", "https://bondageprojects.com/images/school.jpg");
		ElementValue("InputImageURL", "Screens/Room/Platform/Background/Savannah/TentInterior.jpg");
		ElementValue("InputImageFilter", "#00008080");
		ElementValue("InputMusicURL", "https://bondageprojects.com/music/relax.mp3");
	}*/

	if (!ChatAdminData) {
		return;
	}
	const canEditCustom = ChatAdminRoomCustomizationCanEdit();

	// If there's no special mode loaded
	if (ChatAdminRoomCustomizationMode == null) {

		// Can show a preview right away in the screen
		if (MouseIn(1570, 722, 200, 65)) {
			ChatAdminRoomCustomizationMode = "MusicLibrary";
			return;
		}

		// Select the size mode for the background image
		if (MouseIn(205, 400, 1124, 64) && canEditCustom && !!ElementValue("InputImageURL")) {
			if (MouseIn(205, 400, 64, 64)) ChatAdminRoomCustomizationSizeMode = DrawingResizeMode.Fill;
			if (MouseIn(560, 400, 64, 64)) ChatAdminRoomCustomizationSizeMode = DrawingResizeMode.FillOriginalRatio;
			if (MouseIn(1265, 400, 64, 64)) ChatAdminRoomCustomizationSizeMode = DrawingResizeMode.ShowFullOriginalRatio;
		}

	}

	// In Music Library mode
	if (ChatAdminRoomCustomizationMode === "MusicLibrary") {

		// Can show a preview right away in the screen
		if (MouseIn(1570, 692, 200, 65)) {
			ChatAdminRoomCustomizationMode = null;
			return;
		}

		// If a button is clicked, we select that song
		for (const [L, music] of ChatAdminRoomCustomizationMusicLibrary.entries()) {
			let X = Math.floor(L % 3) * 600 + 115;
			let Y = Math.floor(L / 3) * 100 + 210;
			if (MouseIn(X, Y, 500, 65)) {
				ElementValue("InputMusicURL", music.URL);
				return;
			}
			if (MouseIn(X + 500, Y, 65, 65)) {
				window.open(music.Source, '_blank')?.focus();
				return;
			}
		}

	}

	// Can show a preview right away in the screen
	if (MouseIn(425, 840, 250, 65) && ChatRoomPlayerIsAdmin()) {
		ChatAdminRoomCustomizationCurrent = {
			ImageURL: ElementValue("InputImageURL").trim(),
			ImageFilter: ElementValue("InputImageFilter").trim(),
			MusicURL: ElementValue("InputMusicURL").trim(),
			SizeMode: ChatAdminRoomCustomizationSizeMode
		};
	}

	// Clear the current data and goes back to the admin screen
	if (MouseIn(725, 840, 250, 65) && canEditCustom) {
		ChatAdminData.Custom = undefined;
		ChatAdminRoomCustomizationExit();
	}

	// Admins can save the changes
	if (MouseIn(1025, 840, 250, 65) && canEditCustom) {
		if (ChatAdminData.Custom == null) ChatAdminData.Custom = {};
		ChatAdminData.Custom.ImageURL = ElementValue("InputImageURL").trim();
		ChatAdminData.Custom.SizeMode = ChatAdminRoomCustomizationSizeMode;
		ChatAdminData.Custom.ImageFilter = ElementValue("InputImageFilter").trim();
		ChatAdminData.Custom.MusicURL = ElementValue("InputMusicURL").trim();
		if ((ChatAdminData.Custom.ImageURL == "") && (ChatAdminData.Custom.ImageFilter == "") && (ChatAdminData.Custom.MusicURL == ""))
			ChatAdminData.Custom = undefined;
		ChatAdminRoomCustomizationExit();
	}

	// Cancels out without changes
	if (MouseIn(1325, 840, 250, 65)) ChatAdminRoomCustomizationExit();

}

/**
 * Handles exiting from the admin custom screen, removes the inputs
 * @type {ScreenExitHandler}
 */
function ChatAdminRoomCustomizationExit() {
	ChatAdminRoomCustomizationPlayMusic("");
	ElementRemove("InputImageURL");
	ElementRemove("InputImageFilter");
	ElementRemove("InputMusicURL");
	CommonSetScreen("Online", "ChatAdmin");
}

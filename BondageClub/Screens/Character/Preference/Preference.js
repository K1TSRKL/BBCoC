// @ts-strict-ignore
"use strict";
/**
 * The background to use for the settings screen
 */
var PreferenceBackground = "Sheet";

/**
 * A message shown by some subscreen
 * @type {string}
 */
var PreferenceMessage = "";

/**
 * The currently active subscreen
 *
 * @type {PreferenceSubscreen?}
 */
var PreferenceSubscreen = null;

/**
 * All the base settings screens
 * @type {PreferenceSubscreen[]}
 */
const PreferenceSubscreens = [
	{
		name: "Main",
		hidden: true,
		load: () => PreferenceSubscreenMainLoad(),
		run: () => PreferenceSubscreenMainRun(),
		click: () => PreferenceSubscreenMainClick(),
		resize: () => PreferenceSubscreenMainResize(),
		unload: () => PreferenceSubscreenMainUnload(),
		exit: () => PreferenceSubscreenMainExit(),
	},
	{
		name: "General",
		load: () => PreferenceSubscreenGeneralLoad(),
		run: () => PreferenceSubscreenGeneralRun(),
		click: () => PreferenceSubscreenGeneralClick(),
		exit: () => PreferenceSubscreenGeneralExit(),
		unload: () => PreferenceSubscreenGeneralUnload(),
		resize: () => PreferenceSubscreenGeneralResize(),
	},
	{
		name: "Difficulty",
		load: () => PreferenceSubscreenDifficultyLoad(),
		run: () => PreferenceSubscreenDifficultyRun(),
		click: () => PreferenceSubscreenDifficultyClick(),
		exit: () => PreferenceSubscreenDifficultyExit(),
		resize: () => PreferenceSubscreenDifficultyResize(),
	},
	{
		name: "Restriction",
		load: () => PreferenceSubscreenRestrictionLoad(),
		run: () => PreferenceSubscreenRestrictionRun(),
		click: () => PreferenceSubscreenRestrictionClick(),
		resize: () => PreferenceSubscreenRestrictionResize(),
	},
	{
		name: "Chat",
		load: () => PreferenceSubscreenChatLoad(),
		run: () => PreferenceSubscreenChatRun(),
		click: () => PreferenceSubscreenChatClick(),
		exit: () => PreferenceSubscreenChatExit(),
		resize: () => PreferenceSubscreenChatResize(),
	},
	{
		name: "CensoredWords",
		load: () => PreferenceSubscreenCensoredWordsLoad(),
		run: () => PreferenceSubscreenCensoredWordsRun(),
		click: () => PreferenceSubscreenCensoredWordsClick(),
		exit: () => PreferenceSubscreenCensoredWordsExit(),
		unload: () => PreferenceSubscreenCensoredWordsUnload(),
		resize: () => PreferenceSubscreenCensoredWordsResize(),
	},
	{
		name: "Audio",
		load: () => PreferenceSubscreenAudioLoad(),
		run: () => PreferenceSubscreenAudioRun(),
		click: () => PreferenceSubscreenAudioClick(),
		exit: () => PreferenceSubscreenAudioExit(),
		unload: () => PreferenceSubscreenAudioUnload(),
		resize: () => PreferenceSubscreenAudioResize(),
	},
	{
		name: "Arousal",
		load: () => PreferenceSubscreenArousalLoad(),
		run: () => PreferenceSubscreenArousalRun(),
		click: () => PreferenceSubscreenArousalClick(),
		exit: () => PreferenceSubscreenArousalExit(),
		unload: () => PreferenceSubscreenArousalUnload(),
	},
	{
		name: "Security",
		load: () => PreferenceSubscreenSecurityLoad(),
		run: () => PreferenceSubscreenSecurityRun(),
		click: () => PreferenceSubscreenSecurityClick(),
		exit: () => PreferenceSubscreenSecurityExit(),
		unload: () => PreferenceSubscreenSecurityUnload(),
		resize: () => PreferenceSubscreenSecurityResize(),
	},
	{
		name: "Online",
		load: () => PreferenceSubscreenOnlineLoad(),
		run: () => PreferenceSubscreenOnlineRun(),
		click: () => PreferenceSubscreenOnlineClick(),
		resize: () => PreferenceSubscreenOnlineResize(),
	},
	{
		name: "Visibility",
		load: () => PreferenceSubscreenVisibilityLoad(),
		run: () => PreferenceSubscreenVisibilityRun(),
		click: () => PreferenceSubscreenVisibilityClick(),
		exit: () => PreferenceSubscreenVisibilityExit(),
		unload: () => PreferenceSubscreenVisibilityUnload(),
	},
	{
		name: "Immersion",
		load: () => PreferenceSubscreenImmersionLoad(),
		run: () => PreferenceSubscreenImmersionRun(),
		click: () => PreferenceSubscreenImmersionClick(),
		resize: () => PreferenceSubscreenImmersionResize(),
	},
	{
		name: "Graphics",
		load: () => PreferenceSubscreenGraphicsLoad(),
		run: () => PreferenceSubscreenGraphicsRun(),
		click: () => PreferenceSubscreenGraphicsClick(),
		exit: () => PreferenceSubscreenGraphicsExit(),
		unload: () => PreferenceSubscreenGraphicsUnload(),
	},
	{
		name: "Controller",
		load: () => PreferenceSubscreenControllerLoad(),
		run: () => PreferenceSubscreenControllerRun(),
		click: () => PreferenceSubscreenControllerClick(),
		exit: () => PreferenceSubscreenControllerExit(),
		unload: () => PreferenceSubscreenControllerUnload(),
	},
	{
		name: "Notifications",
		load: () => PreferenceSubscreenNotificationsLoad(),
		run: () => PreferenceSubscreenNotificationsRun(),
		click: () => PreferenceSubscreenNotificationsClick(),
		exit: () => PreferenceSubscreenNotificationsExit(),
		unload: () => PreferenceSubscreenNotificationsUnload(),
	},
	{
		name: "Gender",
		load: () => PreferenceSubscreenGenderLoad(),
		run: () => PreferenceSubscreenGenderRun(),
		click: () => PreferenceSubscreenGenderClick(),
		resize: () => PreferenceSubscreenGenderResize(),
	},
	{
		name: "Scripts",
		load: () => PreferenceSubscreenScriptsLoad(),
		run: () => PreferenceSubscreenScriptsRun(),
		click: () => PreferenceSubscreenScriptsClick(),
		exit: () => PreferenceSubscreenScriptsExit(),
		unload: () => PreferenceSubscreenScriptsUnload(),
		resize: () => PreferenceSubscreenScriptsResize(),
	},
	{
		name: "Keybindings",
		icon: "Icons/Keyboard.png",
		load: () => PreferenceSubscreenKeybindingsLoad(),
		run: () => PreferenceSubscreenKeybindingsRun(),
		click: () => PreferenceSubscreenKeybindingsClick(),
		exit: () => PreferenceSubscreenKeybindingsExit(),
		resize: () => PreferenceSubscreenKeybindingsResize(),
	},
	{
		name: "Extensions",
		load: () => PreferenceSubscreenExtensionsLoad(),
		run: () => PreferenceSubscreenExtensionsRun(),
		click: () => PreferenceSubscreenExtensionsClick(),
		exit: () => PreferenceSubscreenExtensionsExit(),
		unload: () => PreferenceSubscreenExtensionsUnload(),
		resize: () => PreferenceSubscreenExtensionsResize(),
	},
];

/**
 * The current page ID for multi-page screens.
 *
 * This is automatically reset to 1 when a screen loads
 */
var PreferencePageCurrent = 1;

/** @type {Record<string,PreferenceExtensionsSettingItem>} */
let PreferenceExtensionsSettings = {};

/**
 * Open a specific subscreen
 * @param {PreferenceSubscreenName} subscreen
 * @param {number} page
 */
async function PreferenceOpenSubscreen(subscreen, page = 1) {
	if (CurrentModule !== "Character" || CurrentScreen !== "Preference") {
		InformationSheetLoadCharacter(Player);
		await CommonSetScreen("Character", "Preference");
	}
	PreferenceSubscreenUnload();

	PreferenceSubscreen = PreferenceSubscreens.find(s => s.name === subscreen) ?? null;
	if (!CommonIsNonNegativeInteger(page)) page = 1;
	PreferencePageCurrent = page;
	PreferenceMessage = "";
	const subscreenTitle = subscreen === "Main" ? "Preferences" : `${subscreen}Preferences`;

	PreferenceSubscreenCreateSubscreen(TextGet(subscreenTitle));
	await PreferenceSubscreen?.load?.();
	PreferenceResize(true);
}

const PreferenceIDs = Object.freeze({
	subscreen: 'preference-subscreen',
	exit: 'preference-exit',
	title: 'preference-subscreen-hgroup',
});

/**
 * Loads the preference screen. This function is called dynamically, when the character enters the preference screen
 * for the first time
 * @type {ScreenLoadHandler}
 */
async function PreferenceLoad() {
	await PreferenceOpenSubscreen("Main");
}

/**
 * Runs the preference screen. This function is called dynamically on a repeated basis.
 * So don't use complex loops or other function calls within this method
 * @returns {void} - Nothing
 */
function PreferenceRun() {
	// Backward-compatibility: automatically substitute strings for the actual subscreen
	if (typeof PreferenceSubscreen === "string") {
		const subscreenName = PreferenceSubscreen === "" ? "Main" : PreferenceSubscreen;
		PreferenceSubscreen = PreferenceSubscreens.find(s => s.name === subscreenName);
		if (!PreferenceSubscreen) PreferenceSubscreen = PreferenceSubscreens.find(s => s.name === "Main");
	}
	PreferenceSubscreen.run();
}

/**
 * Handles click events in the preference screen that are propagated from CommonClick()
 * @returns {void} - Nothing
 */
function PreferenceClick() {
	if (ControllerIsActive()) {
		ControllerClearAreas();
	}
	PreferenceSubscreen?.click();
}

/**
 * Is called when the player exits the preference screen. All settings of the preference screen are sent to the server.
 * If the player is in a subscreen, they exit to the main preferences menu instead.
 * @type {ScreenExitHandler}
 */
function PreferenceExit() {
	if (PreferenceSubscreen.name !== "Main") {
		// If we are in a subscreen, the only exit is to the main preference screen
		PreferenceSubscreenExit();
		return;
	}


	// Exit the preference menus
	// Only a normal exit triggers an update to server. so we don't send data in unload function,
	// which could be called from disconnects
	const P = {
		ArousalSettings: Player.ArousalSettings,
		ChatSettings: Player.ChatSettings,
		VisualSettings: Player.VisualSettings,
		AudioSettings: Player.AudioSettings,
		ControllerSettings: Player.ControllerSettings,
		GameplaySettings: Player.GameplaySettings,
		ImmersionSettings: Player.ImmersionSettings,
		RestrictionSettings: Player.RestrictionSettings,
		OnlineSettings: Player.OnlineSettings,
		OnlineSharedSettings: Player.OnlineSharedSettings,
		GraphicsSettings: Player.GraphicsSettings,
		NotificationSettings: Player.NotificationSettings,
		GenderSettings: Player.GenderSettings,
		ItemPermission: Player.AllowedInteractions,
		AllowedInteractions: Player.AllowedInteractions,
		LabelColor: Player.LabelColor,
		...ServerPackItemPermissions(Player.PermissionItems),
	};
	ServerAccountUpdate.QueueData(P);
	CommonSetScreen("Character", "InformationSheet");
}

/**
 * Clear all GUI data and DOM elements creates by the preference screen load function
 * We don't do this in exit function for disconnects do not trigger the exit function
 * @type {ScreenUnloadHandler}
 */
function PreferenceUnload() {
	PreferenceSubscreenUnload();
}

/** @type {ScreenResizeHandler} */
function PreferenceResize(onLoad) {
	PreferenceSubscreenResize?.(onLoad);
	PreferenceSubscreen.resize?.(onLoad);
}

/** @type {KeyboardEventListener} */
function PreferenceKeyUp(event) {
	// @ts-expect-error: TS, please stop pretending that `void` and `undefined` are distinct
	return PreferenceSubscreen?.keyUp?.(event) ?? false;
}

/**
 * @param {string} subscreenName
 * @returns
 */
function PreferenceSubscreenCreateSubscreen(subscreenName) {
	const subscreen = ElementDOMScreen.getTemplate(
		PreferenceIDs.subscreen,
		{
			menubarButtons: [ElementButton.Create(PreferenceIDs.exit, PreferenceSubscreenExit, { image: "Icons/Exit.png" })],
			header: subscreenName,
			parent: document.body,
			hgroupInHeader: true,
		},
	);

	return subscreen;
}

function PreferenceSubscreenResize(onLoad) {
	ElementPositionFixed(PreferenceIDs.subscreen, 0, 0, 2000, 1000);
	ElementPositionFixed(PreferenceIDs.exit, 1815, 75, 90, 90);
	ElementPositionFixed(PreferenceIDs.title, 500, 100, 1000, 45);
}

/**
 * Exit from a specific subscreen by running its handler and checking its validity
 */
async function PreferenceSubscreenExit() {
	const validExit = await PreferenceSubscreen.exit?.();

	// Only when the results is false (not undefined)
	// The exit is just a exit of the subscreen's substate, return to block more exit.
	if (validExit === false) return;

	// The exit is a full exit of the subscreen, unload resources
	await PreferenceOpenSubscreen("Main");
}

function PreferenceSubscreenUnload() {
	PreferenceSubscreen?.unload?.();
	ElementRemove(PreferenceIDs.subscreen);
}

/**
 * Draw a button to navigate multiple pages in a preference subscreen
 * @param {number} Left - The X co-ordinate of the button
 * @param {number} Top - The Y co-ordinate of the button
 * @param {number} TotalPages - The total number of pages on the subscreen
 * @returns {void} - Nothing
 */
function PreferencePageChangeDraw(Left, Top, TotalPages) {
	DrawBackNextButton(Left, Top, 200, 90, TextGet("Page") + " " + PreferencePageCurrent.toString() + "/" + TotalPages.toString(), "White", "", () => "", () => "");
}

/**
 * Handles clicks of the button to navigate multiple pages in a preference subscreen
 * @param {number} Left - The X co-ordinate of the button
 * @param {number} Top - The Y co-ordinate of the button
 * @param {number} TotalPages - The total number of pages on the subscreen
 * @returns {void} - Nothing
 */
function PreferencePageChangeClick(Left, Top, TotalPages) {
	if (MouseIn(Left, Top, 100, 90)) {
		PreferencePageCurrent--;
		if (PreferencePageCurrent < 1) PreferencePageCurrent = TotalPages;
	}
	else if (MouseIn(Left + 100, Top, 100, 90)) {
		PreferencePageCurrent++;
		if (PreferencePageCurrent > TotalPages) PreferencePageCurrent = 1;
	}
}

/**
 * Draws a back/next button for use on preference pages
 * @param {number} Left - The left offset of the button
 * @param {number} Top - The top offset of the button
 * @param {number} Width - The width of the button
 * @param {number} Height - The height of the button
 * @param {readonly string[]} List - The preference list that the button should be associated with
 * @param {number} Index - The current preference index for the given preference list
 * @returns {void} - Nothing
 */
function PreferenceDrawBackNextButton(Left, Top, Width, Height, List, Index) {
	DrawBackNextButton(Left, Top, Width, Height, TextGet(List[Index]), "White", "",
		() => TextGet(List[PreferenceGetPreviousIndex(List, Index)]),
		() => TextGet(List[PreferenceGetNextIndex(List, Index)]),
	);
}

/**
 * Returns the index of the previous preference list item (and wraps back to the end of the list if currently at 0)
 * @param {readonly unknown[]} List - The preference list
 * @param {number} Index - The current preference index for the given list
 * @returns {number} - The index of the previous item in the array, or the last item in the array if currently at 0
 */
function PreferenceGetPreviousIndex(List, Index) {
	return (List.length + Index - 1) % List.length;
}

/**
 * Returns the index of the next preference list item (and wraps back to the start of the list if currently at the end)
 * @param {readonly unknown[]} List - The preference list
 * @param {number} Index - The current preference index for the given list
 * @returns {number} - The index of the next item in the array, or 0 if the array is currently at the last item
 */
function PreferenceGetNextIndex(List, Index) {
	return (Index + 1) % List.length;
}

/**
 * Namespace with default values for {@link ActivityEnjoyment} properties.
 * @satisfies {ActivityEnjoyment}
 * @namespace
 */
var PreferenceActivityEnjoymentDefault = {
	/** @type {ActivityName | undefined} */
	Name: undefined,
	/** @type {ArousalFactor} */
	Self: 2,
	/** @type {ArousalFactor} */
	Other: 2,
};

/**
 * Namespace with default values for {@link ArousalFetish} properties.
 * @satisfies {ArousalFetish}
 * @namespace
 */
var PreferenceArousalFetishDefault = {
	/** @type {FetishName | undefined} */
	Name: undefined,
	/** @type {ArousalFactor} */
	Factor: 2,
};

/**
 * Namespace with default values for {@link ArousalZone} properties.
 * @satisfies {ArousalZone}
 * @namespace
 */
var PreferenceArousalZoneDefault = {
	/** @type {AssetGroupItemName | undefined} */
	Name: undefined,
	/** @type {ArousalFactor} */
	Factor: 2,
	/** @type {boolean} */
	Orgasm: false,
};

/**
 * Which zones are considered erogenous by default
 * @type {AssetGroupName[]}
 */
var PreferenceArousalZoneOrgasmDefault = ["ItemVulva", "ItemVulvaPiercings"];

/**
 * Namespace with default values for {@link ArousalSettingsType} properties.
 * @type {Required<ArousalSettingsType>}
 * @namespace
 */
var PreferenceArousalSettingsDefault = {
	Active: "Hybrid",
	Visible: "Access",
	ShowOtherMeter: true,
	AffectExpression: true,
	AffectStutter: "All",
	VFX: "VFXAnimatedTemp",
	VFXVibrator: "VFXVibratorAnimated",
	VFXFilter: "VFXFilterLight",
	Progress: 0,
	ProgressTimer: 0,
	VibratorLevel: 0,
	ChangeTime: 0,
	// Next three are initialized lazily since they depend on the loaded assets
	Activity: "",
	Zone: "",
	Fetish: "",
	OrgasmTimer: 0,
	OrgasmStage: 0,
	OrgasmCount: 0,
	DisableAdvancedVibes: false,
};

/**
 * Updates all of the validation "keys" based on the currently registered assets, groups, and activities
 */
function PreferenceArousalUpdateValidation() {
	const activities = AssetAllActivities("Female3DCG")
		.filter(a => a.ActivityID != null)
		.map(({ Name }) => ({ ...PreferenceActivityEnjoymentDefault, Name }))
		.sort(({ Name: aName }, { Name: bName }) => AssetGetActivity("Female3DCG", aName).ActivityID - AssetGetActivity("Female3DCG", bName).ActivityID);
	PreferenceArousalSettingsDefault.Activity = activities
		.map((act) => PreferenceArousalActivityToChar(act.Self, act.Other))
		.join("");

	// By default on new characters, all zones are of neutral preference and vulva/clit can trigger an orgasm
	const zones = AssetGroup.map((group) =>
		({
			...PreferenceArousalZoneDefault,
			Name: (group?.IsItem() && group.ArousalZoneID !== undefined) ? group.Name : undefined,
			Orgasm: PreferenceArousalZoneOrgasmDefault.includes(group.Name),
		}))
		.filter(({ Name }) => Name !== undefined)
		.sort(({ Name: aName }, { Name: bName }) => AssetGroupGet("Female3DCG", aName).ArousalZoneID - AssetGroupGet("Female3DCG", bName).ArousalZoneID);
	PreferenceArousalSettingsDefault.Zone = zones
		.map(act => PreferenceArousalZoneToChar(act.Factor, act.Orgasm))
		.join("");

	const fetishes = AssetAllFetishes("Female3DCG")
		.filter(f => f.FetishID != null)
		.map(({ Name }) => ({ ...PreferenceArousalFetishDefault, Name }))
		.sort(({ Name: aName }, { Name: bName }) => AssetGetFetish("Female3DCG", aName).FetishID - AssetGetFetish("Female3DCG", bName).FetishID);
	PreferenceArousalSettingsDefault.Fetish = fetishes
		.map(fet => PreferenceArousalFetishToChar(fet.Factor))
		.join("");
}

/**
 * Namespace with functions for validating {@link ArousalSettingsType} properties
 * @type {{ [k in keyof Required<ArousalSettingsType>]: (arg: ArousalSettingsType[k], C: Character) => ArousalSettingsType[k] }}
 * @namespace
 */
var PreferenceArousalSettingsValidate = {
	Active: (arg, C) => {
		return CommonIncludes(PreferenceArousalActiveList, arg) ? arg : PreferenceArousalSettingsDefault.Active;
	},
	Visible: (arg, C) => {
		return CommonIncludes(PreferenceArousalVisibleList, arg) ? arg : PreferenceArousalSettingsDefault.Visible;
	},
	ShowOtherMeter: (arg, C) => {
		return typeof arg === "boolean" ? arg : PreferenceArousalSettingsDefault.ShowOtherMeter;
	},
	AffectExpression: (arg, C) => {
		return typeof arg === "boolean" ? arg : PreferenceArousalSettingsDefault.AffectExpression;
	},
	AffectStutter: (arg, C) => {
		return CommonIncludes(PreferenceArousalAffectStutterList, arg) ? arg : PreferenceArousalSettingsDefault.AffectStutter;
	},
	VFX: (arg, C) => {
		return CommonIncludes(PreferenceSettingsVFXList, arg) ? arg : PreferenceArousalSettingsDefault.VFX;
	},
	VFXVibrator: (arg, C) => {
		return CommonIncludes(PreferenceSettingsVFXVibratorList, arg) ? arg : PreferenceArousalSettingsDefault.VFXVibrator;
	},
	VFXFilter: (arg, C) => {
		return CommonIncludes(PreferenceSettingsVFXFilterList, arg) ? arg : PreferenceArousalSettingsDefault.VFXFilter;
	},
	Progress: (arg, C) => {
		return CommonIsInteger(arg, 0, 100) ? arg : PreferenceArousalSettingsDefault.Progress;
	},
	ProgressTimer: (arg, C) => {
		return CommonIsInteger(arg, 0, 100) ? arg : PreferenceArousalSettingsDefault.ProgressTimer;
	},
	VibratorLevel: (arg, C) => {
		return CommonIsInteger(arg, 0, 4) ? /** @type {0 | 1 | 2 | 3 | 4} */(arg) : PreferenceArousalSettingsDefault.VibratorLevel;
	},
	ChangeTime: (arg, C) => {
		return CommonIsInteger(arg, 0, CommonTime()) ? arg : PreferenceArousalSettingsDefault.ChangeTime;
	},
	Activity: (arg, C) => {
		if (PreferenceArousalSettingsDefault.Activity === "") {
			PreferenceArousalUpdateValidation();
		}
		if (CommonIsArray(arg)) {
			// Old object-based activities
			let newActivity = PreferenceArousalSettingsDefault.Activity;
			const objectArousalSettings = /** @type {{ Name: string, Self: number, Other: number}[]} */ (/** @type {unknown} */ (arg));
			for (let oldActivity of objectArousalSettings) {
				if (!CommonIsObject(oldActivity) || typeof oldActivity.Name !== "string" || typeof oldActivity.Self === "number" || typeof oldActivity.Other === "number") continue;

				const activity = AssetGetActivity(C.AssetFamily, oldActivity.Name);
				if (!activity) continue;

				newActivity = newActivity.substring(0, activity.ActivityID) + PreferenceArousalActivityToChar(oldActivity.Self, oldActivity.Other) + newActivity.substring(activity.ActivityID + 1);
			}
			return newActivity;
		}
		if (typeof arg !== "string") return PreferenceArousalSettingsDefault.Activity;

		while (arg.length < PreferenceArousalSettingsDefault.Activity.length)
			arg = arg + PreferenceArousalActivityToChar(PreferenceActivityEnjoymentDefault.Self, PreferenceActivityEnjoymentDefault.Other);
		if (arg.length > PreferenceArousalSettingsDefault.Activity.length)
			arg = arg.substring(0, PreferenceArousalSettingsDefault.Activity.length);
		return arg;
	},
	Zone: (arg, C) => {
		// Set up the defaults for arousal zones now that we're done loading groups
		if (PreferenceArousalSettingsDefault.Zone === "") {
			PreferenceArousalUpdateValidation();
		}
		if (CommonIsArray(arg)) {
			// Old object-based zones
			let newZone = PreferenceArousalSettingsDefault.Zone;
			const objectZoneSettings = /** @type {{ Name: AssetGroupItemName, Factor: ArousalFactor, Orgasm: boolean }[]} */ (/** @type {unknown} */ (arg));
			for (let oldZone of objectZoneSettings) {
				if (!CommonIsObject(oldZone) || typeof oldZone.Name !== "string" || typeof oldZone.Factor !== "number" || typeof oldZone.Orgasm !== "boolean") continue;

				const group = AssetGroupGet(C.AssetFamily, oldZone.Name);
				if (!group || !group.IsItem()) return;

				newZone = newZone.substring(0, group.ArousalZoneID) + PreferenceArousalZoneToChar(oldZone.Factor, oldZone.Orgasm) + newZone.substring(group.ArousalZoneID + 1);
			}
			return newZone;
		}
		if (typeof arg !== "string") return PreferenceArousalSettingsDefault.Zone;

		while (arg.length < PreferenceArousalSettingsDefault.Zone.length)
			arg = arg + PreferenceArousalZoneToChar(PreferenceArousalZoneDefault.Factor, PreferenceArousalZoneDefault.Orgasm);
		if (arg.length > PreferenceArousalSettingsDefault.Zone.length)
			arg = arg.substring(0, PreferenceArousalSettingsDefault.Zone.length);
		return arg;
	},
	Fetish: (arg, C) => {
		if (PreferenceArousalSettingsDefault.Fetish === "") {
			PreferenceArousalUpdateValidation();
		}
		if (CommonIsArray(arg)) {
			// Old object-based fetishes
			let newFetish = PreferenceArousalSettingsDefault.Fetish;
			const objectFetishSettings = /** @type {{ Name: FetishName, Factor: ArousalFactor }[]} */ (/** @type {unknown} */ (arg));
			for (let oldFetish of objectFetishSettings) {
				if (!CommonIsObject(oldFetish) || typeof oldFetish.Name !== "string" || typeof oldFetish.Factor !== "number") continue;

				const fetish = AssetGetFetish(C.AssetFamily, oldFetish.Name);
				if (!fetish) continue;

				newFetish = newFetish.substring(0, fetish.FetishID) + PreferenceArousalFetishToChar(oldFetish.Factor) + newFetish.substring(fetish.FetishID + 1);
			}
			return newFetish;
		}
		if (typeof arg !== "string") return PreferenceArousalSettingsDefault.Fetish;

		while (arg.length < PreferenceArousalSettingsDefault.Fetish.length)
			arg = arg + PreferenceArousalFetishToChar(PreferenceArousalFetishDefault.Factor);
		if (arg.length > PreferenceArousalSettingsDefault.Fetish.length)
			arg = arg.substring(0, PreferenceArousalSettingsDefault.Fetish.length);
		return arg;
	},
	OrgasmTimer: (arg, C) => {
		return CommonIsFinite(arg, 0) ? arg : PreferenceArousalSettingsDefault.OrgasmTimer;
	},
	OrgasmStage: (arg, C) => {
		return CommonIsInteger(arg, 0, 2) ? /** @type {0 | 1 | 2} */(arg) : PreferenceArousalSettingsDefault.OrgasmStage;
	},
	OrgasmCount: (arg, C) => {
		return CommonIsInteger(arg, 0) ? arg : PreferenceArousalSettingsDefault.OrgasmCount;
	},
	DisableAdvancedVibes: (arg, C) => {
		return typeof arg === "boolean" ? arg : PreferenceArousalSettingsDefault.DisableAdvancedVibes;
	},
};

/**
 * Namespace with default values for {@link CharacterOnlineSharedSettings} properties.
 * @type {CharacterOnlineSharedSettings}
 * @namespace
 */
var PreferenceOnlineSharedSettingsDefault = {
	GameVersion: undefined,
	AllowFullWardrobeAccess: false,
	BlockBodyCosplay: false,
	AllowPlayerLeashing: true,
	AllowRename: true,
	DisablePickingLocksOnSelf: false,
	ItemsAffectExpressions: true,
	WheelFortune: "", // Initialized in `WheelFortune.js`
	ScriptPermissions: {
		Hide: { permission: 0 },
		Block: { permission: 0 },
	},
};

/**
 * Namespace with default values for {@link CharacterOnlineSharedSettings} properties.
 * @type {{ [k in keyof Required<CharacterOnlineSharedSettings>]: (arg: CharacterOnlineSharedSettings[k], C: Character) => CharacterOnlineSharedSettings[k] }}
 * @namespace
 */
var PreferenceOnlineSharedSettingsValidate = {
	GameVersion: (arg, C) => {
		return typeof arg === "string" ? arg : PreferenceOnlineSharedSettingsDefault.GameVersion;
	},
	AllowFullWardrobeAccess: (arg, C) => {
		return typeof arg === "boolean" ? arg : PreferenceOnlineSharedSettingsDefault.AllowFullWardrobeAccess;
	},
	BlockBodyCosplay: (arg, C) => {
		return typeof arg === "boolean" ? arg : PreferenceOnlineSharedSettingsDefault.BlockBodyCosplay;
	},
	AllowPlayerLeashing: (arg, C) => {
		return typeof arg === "boolean" ? arg : PreferenceOnlineSharedSettingsDefault.AllowPlayerLeashing;
	},
	AllowRename: (arg, C) => {
		return typeof arg === "boolean" ? arg : PreferenceOnlineSharedSettingsDefault.AllowRename;
	},
	DisablePickingLocksOnSelf: (arg, C) => {
		return typeof arg === "boolean" ? arg : PreferenceOnlineSharedSettingsDefault.DisablePickingLocksOnSelf;
	},
	ItemsAffectExpressions: (arg, C) => {
		return typeof arg === "boolean" ? arg : PreferenceOnlineSharedSettingsDefault.ItemsAffectExpressions;
	},
	WheelFortune: (arg, C) => {
		return typeof arg === "string" ? arg : PreferenceOnlineSharedSettingsDefault.WheelFortune;
	},
	ScriptPermissions: (arg, C) => {
		if (!CommonIsObject(arg)) {
			return CommonCloneDeep(PreferenceOnlineSharedSettingsDefault.ScriptPermissions);
		}

		return {
			Hide: {
				permission: CommonIsInteger(arg.Hide?.permission, 0, maxScriptPermission) ? arg.Hide.permission : 0,
			},
			Block: {
				permission: CommonIsInteger(arg.Block?.permission, 0, maxScriptPermission) ? arg.Block.permission : 0,
			},
		};
	},
};


/**
 * Namespace with default values for {@link ChatSettingsType} properties.
 * @type {Required<ChatSettingsType>}
 * @namespace
 */
var PreferenceChatSettingsDefault = {
	ColorActions: true,
	ColorActivities: true,
	ColorEmotes: true,
	ColorNames: true,
	ColorTheme: "Light",
	DisplayTimestamps: true,
	EnterLeave: "Normal",
	FontSize: "Medium",
	MemberNumbers: "Always",
	MuStylePoses: false,
	ShowActivities: true,
	ShowAutomaticMessages: false,
	ShowBeepChat: true,
	ShowChatHelp: true,
	ShrinkNonDialogue: false,
	WhiteSpace: "Preserve",
	CensoredWordsList: "",
	CensoredWordsLevel: 0,
	PreserveChat: true,
	OOCAutoClose: true,
	DisableReplies: false,
	ShowFriendRequestMessages: true,
};

/**
 * Namespace with functions for validating {@link ChatSettingsType} properties
 * @type {{ [k in keyof Required<ChatSettingsType>]: (arg: ChatSettingsType[k], C: Character) => ChatSettingsType[k] }}
 * @namespace
 */
var PreferenceChatSettingsValidate = {
	ColorActions: ServerValidation.isBool(PreferenceChatSettingsDefault.ColorActions),
	ColorActivities: ServerValidation.isBool(PreferenceChatSettingsDefault.ColorActivities),
	ColorEmotes: ServerValidation.isBool(PreferenceChatSettingsDefault.ColorEmotes),
	ColorNames: ServerValidation.isBool(PreferenceChatSettingsDefault.ColorNames),
	ColorTheme: ServerValidation.isItem(PreferenceChatColorThemeList, PreferenceChatSettingsDefault.ColorTheme),
	DisplayTimestamps: ServerValidation.isBool(PreferenceChatSettingsDefault.DisplayTimestamps),
	EnterLeave: ServerValidation.isItem(PreferenceChatEnterLeaveList, PreferenceChatSettingsDefault.EnterLeave),
	FontSize: ServerValidation.isItem(PreferenceChatFontSizeList, PreferenceChatSettingsDefault.FontSize),
	MemberNumbers: ServerValidation.isItem(PreferenceChatMemberNumbersList, PreferenceChatSettingsDefault.MemberNumbers),
	MuStylePoses: ServerValidation.isBool(PreferenceChatSettingsDefault.MuStylePoses),
	ShowActivities: ServerValidation.isBool(PreferenceChatSettingsDefault.ShowActivities),
	ShowAutomaticMessages: ServerValidation.isBool(PreferenceChatSettingsDefault.ShowAutomaticMessages),
	ShowBeepChat: ServerValidation.isBool(PreferenceChatSettingsDefault.ShowBeepChat),
	ShowChatHelp: ServerValidation.isBool(PreferenceChatSettingsDefault.ShowChatHelp),
	ShrinkNonDialogue: ServerValidation.isBool(PreferenceChatSettingsDefault.ShrinkNonDialogue),
	WhiteSpace: ServerValidation.isItem(["", "Preserve"], PreferenceChatSettingsDefault.WhiteSpace),
	CensoredWordsList: (arg, C) => {
		return typeof arg === "string" ? arg : PreferenceChatSettingsDefault.CensoredWordsList;
	},
	CensoredWordsLevel: (arg, C) => {
		return CommonIsInteger(arg, 0, 2) ? arg : PreferenceChatSettingsDefault.CensoredWordsLevel;
	},
	PreserveChat: ServerValidation.isBool(PreferenceChatSettingsDefault.PreserveChat),
	OOCAutoClose: ServerValidation.isBool(PreferenceChatSettingsDefault.OOCAutoClose),
	DisableReplies: ServerValidation.isBool(PreferenceChatSettingsDefault.DisableReplies),
	ShowFriendRequestMessages: ServerValidation.isBool(PreferenceChatSettingsDefault.ShowFriendRequestMessages),
};

/**
 * Namespace with default values for {@link VisualSettingsType} properties.
 * @type {Required<VisualSettingsType>}
 * @namespace
 */
var PreferenceVisualSettingsDefault = {
	ForceFullHeight: false,
	UseCharacterInPreviews: false,
	MainHallBackground: undefined,
	PrivateRoomBackground: undefined,
};

/**
 * Namespace with functions for validating {@link VisualSettingsType} properties
 * @type {{ [k in keyof Required<VisualSettingsType>]: (arg: VisualSettingsType[k], C: Character) => VisualSettingsType[k] }}
 * @namespace
 */
var PreferenceVisualSettingsValidate = {
	ForceFullHeight: ServerValidation.isBool(PreferenceVisualSettingsDefault.ForceFullHeight),
	UseCharacterInPreviews: ServerValidation.isBool(PreferenceVisualSettingsDefault.UseCharacterInPreviews),
	MainHallBackground: (arg, C) => {
		return typeof arg === "string" && arg.length && arg !== "MainHall" ? arg : PreferenceVisualSettingsDefault.MainHallBackground;
	},
	PrivateRoomBackground: (arg, C) => {
		return typeof arg === "string" && arg.length && arg !== "Private" ? arg : PreferenceVisualSettingsDefault.PrivateRoomBackground;
	}
};

/**
 * Namespace with default values for {@link AudioSettingsType} properties.
 * @type {Required<AudioSettingsType>}
 * @namespace
 */
var PreferenceAudioSettingsDefault = {
	Volume: 1,
	MusicVolume: 1,
	PlayItem: false,
	PlayItemPlayerOnly: false,
	Notifications: false,
	// @ts-expect-error deprecated
	PlayBeeps: undefined,
};

/**
 * Namespace with functions for validating {@link AudioSettingsType} properties
 * @type {{ [k in keyof Required<AudioSettingsType>]: (arg: AudioSettingsType[k], C: Character) => AudioSettingsType[k] }}
 * @namespace
 */
var PreferenceAudioSettingsValidate = {
	Volume: (arg) => {
		return CommonIsFinite(arg, 0, 1) ? arg : PreferenceAudioSettingsDefault.Volume;
	},
	MusicVolume: (arg) => {
		return CommonIsFinite(arg, 0, 1) ? arg : PreferenceAudioSettingsDefault.MusicVolume;
	},
	PlayItem: ServerValidation.isBool(PreferenceAudioSettingsDefault.PlayItem),
	PlayItemPlayerOnly: ServerValidation.isBool(PreferenceAudioSettingsDefault.PlayItemPlayerOnly),
	Notifications: ServerValidation.isBool(PreferenceAudioSettingsDefault.Notifications),
	// @ts-expect-error deprecated
	PlayBeeps: (arg) => undefined,
};

/**
 * Namespace with default values for {@link ControllerSettingsType} properties.
 * @type {Required<ControllerSettingsType>}
 * @namespace
 */
var PreferenceControllerSettingsDefault = {
	ControllerActive: false,
	ControllerSensitivity: 5,
	ControllerDeadZone: 0.01,
	Buttons: { 0: 0, 1: 1, 2: 2, 3: 3, 4: 4, 5: 5, 6: 6, 7: 7, 8: 8, 9: 9, 10: 10, 11: 11, 12: 12, 13: 13, 14: 14, 15: 15, 16: 16 },
	Axis: {0: 0, 1: 1, 2: 2, 3: 3},
};

/**
 * Namespace with functions for validating {@link ControllerSettingsType} properties
 * @type {{ [k in keyof Required<ControllerSettingsType>]: (arg: ControllerSettingsType[k], C: Character) => ControllerSettingsType[k] }}
 * @namespace
 */
var PreferenceControllerSettingsValidate = {
	ControllerActive: ServerValidation.isBool(PreferenceControllerSettingsDefault.ControllerActive),
	ControllerSensitivity: ServerValidation.isItem(PreferenceSettingsSensitivityList, PreferenceControllerSettingsDefault.ControllerSensitivity),
	ControllerDeadZone: ServerValidation.isItem(PreferenceSettingsDeadZoneList, PreferenceControllerSettingsDefault.ControllerDeadZone),
	Buttons: (arg) => { return arg; },
	Axis: (arg) => { return arg; },
};

/**
 * Namespace with default values for {@link GameplaySettingsType} properties.
 * @type {Required<GameplaySettingsType>}
 * @namespace
 */
var PreferenceGameplaySettingsDefault = {
	SensDepChatLog: "Normal",
	BlindDisableExamine: false,
	DisableAutoRemoveLogin: false,
	ImmersionLockSetting: false,
	EnableSafeword: true,
	DisableAutoMaid: false,
	OfflineLockedRestrained: false,
};

/**
 * Namespace with functions for validating {@link GameplaySettingsType} properties
 * @type {{ [k in keyof Required<GameplaySettingsType>]: (arg: GameplaySettingsType[k], C: Character) => GameplaySettingsType[k] }}
 * @namespace
 */
var PreferenceGameplaySettingsValidate = {
	SensDepChatLog: ServerValidation.isItem(PreferenceSettingsSensDepList, PreferenceGameplaySettingsDefault.SensDepChatLog),
	BlindDisableExamine: ServerValidation.isBool(PreferenceGameplaySettingsDefault.BlindDisableExamine),
	DisableAutoRemoveLogin: ServerValidation.isBool(PreferenceGameplaySettingsDefault.DisableAutoRemoveLogin),
	ImmersionLockSetting: ServerValidation.isBool(PreferenceGameplaySettingsDefault.ImmersionLockSetting),
	EnableSafeword: ServerValidation.isBool(PreferenceGameplaySettingsDefault.EnableSafeword),
	DisableAutoMaid: ServerValidation.isBool(PreferenceGameplaySettingsDefault.DisableAutoMaid),
	OfflineLockedRestrained: ServerValidation.isBool(PreferenceGameplaySettingsDefault.OfflineLockedRestrained),
};

/**
 * Namespace with default values for {@link ImmersionSettingsType} properties.
 * @type {Required<ImmersionSettingsType>}
 * @namespace
 */
var PreferenceImmersionSettingsDefault = {
	StimulationEvents: true,
	ReturnToChatRoom: false,
	ReturnToChatRoomAdmin: false,
	ChatRoomMapLeaveOnExit: false,
	SenseDepMessages: false,
	ChatRoomMuffle: false,
	BlindAdjacent: false,
	AllowTints: true,
	ShowUngarbledMessages: true,
	// @ts-expect-error deprecated
	BlockGaggedOOC: undefined,
};

/**
 * Namespace with functions for validating {@link ImmersionSettingsType} properties
 * @type {{ [k in keyof Required<ImmersionSettingsType>]: (arg: ImmersionSettingsType[k], C: Character) => ImmersionSettingsType[k] }}
 * @namespace
 */
var PreferenceImmersionSettingsValidate = {
	StimulationEvents: ServerValidation.isBool(PreferenceImmersionSettingsDefault.StimulationEvents),
	ReturnToChatRoom: ServerValidation.isBool(PreferenceImmersionSettingsDefault.ReturnToChatRoom),
	ReturnToChatRoomAdmin: ServerValidation.isBool(PreferenceImmersionSettingsDefault.ReturnToChatRoomAdmin),
	ChatRoomMapLeaveOnExit: ServerValidation.isBool(PreferenceImmersionSettingsDefault.ChatRoomMapLeaveOnExit),
	SenseDepMessages: ServerValidation.isBool(PreferenceImmersionSettingsDefault.SenseDepMessages),
	ChatRoomMuffle: ServerValidation.isBool(PreferenceImmersionSettingsDefault.ChatRoomMuffle),
	BlindAdjacent: ServerValidation.isBool(PreferenceImmersionSettingsDefault.BlindAdjacent),
	AllowTints: ServerValidation.isBool(PreferenceImmersionSettingsDefault.AllowTints),
	ShowUngarbledMessages: ServerValidation.isBool(PreferenceImmersionSettingsDefault.ShowUngarbledMessages),
	// @ts-expect-error deprecated
	BlockGaggedOOC: (arg) => undefined,
};

/**
 * Namespace with default values for {@link RestrictionSettingsType} properties.
 * @type {Required<RestrictionSettingsType>}
 * @namespace
 */
var PreferenceRestrictionSettingsDefault = {
	BypassStruggle: false,
	SlowImmunity: false,
	BypassNPCPunishments: false,
	NoSpeechGarble: false,
};

/**
 * Namespace with functions for validating {@link RestrictionSettingsType} properties
 * @type {{ [k in keyof Required<RestrictionSettingsType>]: (arg: RestrictionSettingsType[k], C: Character) => RestrictionSettingsType[k] }}
 * @namespace
 */
var PreferenceRestrictionSettingsValidate = {
	BypassStruggle: ServerValidation.isBool(PreferenceRestrictionSettingsDefault.BypassStruggle),
	SlowImmunity: ServerValidation.isBool(PreferenceRestrictionSettingsDefault.SlowImmunity),
	BypassNPCPunishments: ServerValidation.isBool(PreferenceRestrictionSettingsDefault.BypassNPCPunishments),
	NoSpeechGarble: ServerValidation.isBool(PreferenceRestrictionSettingsDefault.NoSpeechGarble),
};

/**
 * Namespace with default values for {@link PlayerOnlineSettings} properties.
 * @type {Required<PlayerOnlineSettings>}
 * @namespace
 */
var PreferenceOnlineSettingsDefault = {
	AutoBanBlackList: false,
	AutoBanGhostList: true,
	DisableAnimations: false,
	SearchFriendsFirst: false,
	EnableAfkTimer: true,
	ShowStatus: true,
	SendStatus: true,
	FriendListAutoRefresh: true,
	ShowRoomCustomization: 1,
	DefaultChatRoomBackground: "CosyChalet",
	// @ts-expect-error Deprecated
	SearchShowsFullRooms: undefined,
};

/**
 * Namespace with functions for validating {@link PlayerOnlineSettings} properties
 * @type {{ [k in keyof Required<PlayerOnlineSettings>]: (arg: PlayerOnlineSettings[k], C: Character) => PlayerOnlineSettings[k] }}
 * @namespace
 */
var PreferenceOnlineSettingsValidate = {
	AutoBanBlackList: ServerValidation.isBool(PreferenceOnlineSettingsDefault.AutoBanBlackList),
	AutoBanGhostList: ServerValidation.isBool(PreferenceOnlineSettingsDefault.AutoBanGhostList),
	DisableAnimations: ServerValidation.isBool(PreferenceOnlineSettingsDefault.DisableAnimations),
	SearchFriendsFirst: ServerValidation.isBool(PreferenceOnlineSettingsDefault.SearchFriendsFirst),
	EnableAfkTimer: ServerValidation.isBool(PreferenceOnlineSettingsDefault.EnableAfkTimer),
	ShowStatus: ServerValidation.isBool(PreferenceOnlineSettingsDefault.ShowStatus),
	SendStatus: ServerValidation.isBool(PreferenceOnlineSettingsDefault.SendStatus),
	FriendListAutoRefresh: ServerValidation.isBool(PreferenceOnlineSettingsDefault.FriendListAutoRefresh),
	ShowRoomCustomization: ServerValidation.isInt(0, 4, PreferenceOnlineSettingsDefault.ShowRoomCustomization),
	DefaultChatRoomBackground: (arg, C) => {
		return typeof arg === "string" ? arg : PreferenceOnlineSettingsDefault.DefaultChatRoomBackground;
	},
	// @ts-expect-error Deprecated
	SearchShowsFullRooms: (arg) => undefined,
};

/**
 * Namespace with default values for {@link GraphicsSettingsType} properties.
 * @type {Required<GraphicsSettingsType>}
 * @namespace
 */
var PreferenceGraphicsSettingsDefault = {
	Font: "Arial",
	InvertRoom: true,
	StimulationFlash: false,
	DoBlindFlash: false,
	AnimationQuality: 100,
	SmoothZoom: true,
	CenterChatrooms: true,
	AllowBlur: true,
	MaxFPS: DEFAULT_FRAMERATE,
	MaxUnfocusedFPS: 0,
	ShowFPS: false,
};

/**
 * Namespace with functions for validating {@link GraphicsSettingsType} properties
 * @type {{ [k in keyof Required<GraphicsSettingsType>]: (arg: GraphicsSettingsType[k], C: Character) => GraphicsSettingsType[k] }}
 * @namespace
 */
var PreferenceGraphicsSettingsValidate = {
	Font: ServerValidation.isItem(PreferenceGraphicsFontList, PreferenceGraphicsSettingsDefault.Font),
	InvertRoom: ServerValidation.isBool(PreferenceGraphicsSettingsDefault.InvertRoom),
	StimulationFlash: ServerValidation.isBool(PreferenceGraphicsSettingsDefault.StimulationFlash),
	DoBlindFlash: ServerValidation.isBool(PreferenceGraphicsSettingsDefault.DoBlindFlash),
	AnimationQuality: ServerValidation.isItem(PreferenceGraphicsAnimationQualityList, PreferenceGraphicsSettingsDefault.AnimationQuality),
	SmoothZoom: ServerValidation.isBool(PreferenceGraphicsSettingsDefault.SmoothZoom),
	CenterChatrooms: ServerValidation.isBool(PreferenceGraphicsSettingsDefault.CenterChatrooms),
	AllowBlur: ServerValidation.isBool(PreferenceGraphicsSettingsDefault.AllowBlur),
	MaxFPS: ServerValidation.isItem(PreferenceGraphicsFrameLimit, PreferenceGraphicsSettingsDefault.MaxFPS),
	MaxUnfocusedFPS: ServerValidation.isItem(PreferenceGraphicsFrameLimit, PreferenceGraphicsSettingsDefault.MaxUnfocusedFPS),
	ShowFPS: ServerValidation.isBool(PreferenceGraphicsSettingsDefault.ShowFPS),
};

/**
 * Namespace with default values for {@link GenderSettingsType} properties.
 * @type {Required<GenderSettingsType>}
 * @namespace
 */
var PreferenceGenderSettingsDefault = {
	AutoJoinSearch: { Female: false, Male: false },
	HideShopItems: { Female: false, Male: false },
	HideTitles: { Female: false, Male: false },
};

/**
 * @template {object} T
 * @param {T} shape
 * @returns {(arg: T) => T}
 */
const hasSameShape = (shape) => {
	return (arg) => {
		return CommonIsObject(arg) && CommonArraysEqual(CommonKeys(arg), CommonKeys(shape)) ? arg : shape;
	};
};

/**
 * Namespace with functions for validating {@link GenderSettingsType} properties
 * @type {{ [k in keyof Required<GenderSettingsType>]: (arg: GenderSettingsType[k], C: Character) => GenderSettingsType[k] }}
 * @namespace
 */
var PreferenceGenderSettingsValidate = {
	AutoJoinSearch: hasSameShape(PreferenceGenderSettingsDefault.AutoJoinSearch),
	HideShopItems: hasSameShape(PreferenceGenderSettingsDefault.HideShopItems),
	HideTitles: hasSameShape(PreferenceGenderSettingsDefault.HideTitles),
};

/**
 * Namespace with default values for {@link NotificationSettingsType} properties.
 * @type {Required<NotificationSettingsType>}
 * @namespace
 */
var PreferenceNotificationSettingsDefault = {
	Beeps: { Audio: NotificationAudioType.FIRST, AlertType: NotificationAlertType.POPUP },
	ChatMessage: { Audio: NotificationAudioType.FIRST, AlertType: NotificationAlertType.NONE, Normal: true, Whisper: true, Activity: false, Mention: false },
	ChatJoin: { Audio: NotificationAudioType.FIRST, AlertType: NotificationAlertType.NONE, Owner: false, Lovers: false, Friendlist: false, Subs: false },
	Disconnect: { Audio: NotificationAudioType.FIRST, AlertType: NotificationAlertType.NONE },
	Larp: { Audio: NotificationAudioType.NONE, AlertType: NotificationAlertType.NONE },
	Test: { Audio: NotificationAudioType.NONE, AlertType: NotificationAlertType.TITLEPREFIX },
};

/**
 * Namespace with functions for validating {@link NotificationSettingsType} properties
 * @type {{ [k in keyof Required<NotificationSettingsType>]: (arg: NotificationSettingsType[k], C: Character) => NotificationSettingsType[k] }}
 * @namespace
 */
var PreferenceNotificationSettingsValidate = {
	Beeps: ServerValidation.isValidNotification(PreferenceNotificationSettingsDefault.Beeps),
	ChatMessage: (arg) => {
		return {
			...ServerValidation.isValidNotification(PreferenceNotificationSettingsDefault.ChatMessage)(arg),
			Normal: ServerValidation.isBool(PreferenceNotificationSettingsDefault.ChatMessage.Normal)(arg.Normal),
			Whisper: ServerValidation.isBool(PreferenceNotificationSettingsDefault.ChatMessage.Whisper)(arg.Whisper),
			Activity: ServerValidation.isBool(PreferenceNotificationSettingsDefault.ChatMessage.Activity)(arg.Activity),
			Mention: ServerValidation.isBool(PreferenceNotificationSettingsDefault.ChatMessage.Mention)(arg.Mention),
		};
	},
	ChatJoin: (arg) => {
		return {
			...ServerValidation.isValidNotification(PreferenceNotificationSettingsDefault.ChatJoin)(arg),
			Owner: ServerValidation.isBool(PreferenceNotificationSettingsDefault.ChatJoin.Owner)(arg.Owner),
			Lovers: ServerValidation.isBool(PreferenceNotificationSettingsDefault.ChatJoin.Lovers)(arg.Lovers),
			Friendlist: ServerValidation.isBool(PreferenceNotificationSettingsDefault.ChatJoin.Friendlist)(arg.Friendlist),
			Subs: ServerValidation.isBool(PreferenceNotificationSettingsDefault.ChatJoin.Subs)(arg.Subs),
		};
	},
	Disconnect: ServerValidation.isValidNotification(PreferenceNotificationSettingsDefault.Disconnect),
	Larp: ServerValidation.isValidNotification(PreferenceNotificationSettingsDefault.Larp),
	Test: ServerValidation.isValidNotification(PreferenceNotificationSettingsDefault.Test),
};

/**
 * Registers a new extension setting to the preference screen
 * @param {PreferenceExtensionsSettingItem} Setting - The extension setting to register
 * @returns {void} - Nothing
 */
function PreferenceRegisterExtensionSetting(Setting) {
	if((typeof Setting.Identifier !== "string" || Setting.Identifier.length < 1)
		|| typeof Setting.load !== "function"
		|| typeof Setting.run !== "function"
		|| typeof Setting.click !== "function"
		|| (typeof Setting.ButtonText !== "string" && typeof Setting.ButtonText !== "function")
		|| (typeof Setting.Image !== "string" && typeof Setting.Image !== "function" && typeof Setting.Image !== "undefined")) {
		console.error("Invalid extension setting");
		return;
	}
	// Setting Names must be unique
	const existing = PreferenceExtensionsSettings[Setting.Identifier];
	if(existing) {
		console.error(`Extension setting "${existing.Identifier}" already exists`);
		return;
	}
	PreferenceExtensionsSettings[Setting.Identifier] = Setting;

	PreferenceExtensionsSettings = Object.fromEntries(
		Object.entries(PreferenceExtensionsSettings)
			.sort(([, a], [, b]) => {
				const textA = typeof a.ButtonText === "function" ? a.ButtonText() : a.ButtonText;
				const textB = typeof b.ButtonText === "function" ? b.ButtonText() : b.ButtonText;
				return textA.localeCompare(textB);
			})
	);
}

/**
 * Return a new object with default item permissions
 * @returns {ItemPermissions} - The item permissions
 */
function PreferencePermissionGetDefault() {
	return {
		Hidden: false,
		Permission: "Default",
		TypePermissions: {},
	};
}

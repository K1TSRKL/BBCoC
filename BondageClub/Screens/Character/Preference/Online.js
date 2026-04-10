// @ts-strict-ignore
"use strict";

/** @type {null | string[]} */
var PreferenceOnlineDefaultBackgroundList = null;
var PreferenceOnlineDefaultBackgroundIndex = 0;
var PreferenceOnlineDefaultBackground = "";

/** @type {{label: string, check: () => boolean, click: () => void}[]} */
const PreferenceSubscreenOnlineCheckboxes = [
	{ label: "AutoBanBlackList", check: () => Player.OnlineSettings.AutoBanBlackList, click: () => Player.OnlineSettings.AutoBanBlackList = !Player.OnlineSettings.AutoBanBlackList },
	{ label: "AutoBanGhostList", check: () => Player.OnlineSettings.AutoBanGhostList, click: () => Player.OnlineSettings.AutoBanGhostList = !Player.OnlineSettings.AutoBanGhostList },
	{ label: "SearchFriendsFirst", check: () => Player.OnlineSettings.SearchFriendsFirst, click: () => Player.OnlineSettings.SearchFriendsFirst = !Player.OnlineSettings.SearchFriendsFirst },
	{ label: "DisableAnimations", check: () => Player.OnlineSettings.DisableAnimations, click: () => Player.OnlineSettings.DisableAnimations = !Player.OnlineSettings.DisableAnimations },
	{ label: "EnableAfkTimer", check: () => Player.OnlineSettings.EnableAfkTimer, click: () => {
		Player.OnlineSettings.EnableAfkTimer = !Player.OnlineSettings.EnableAfkTimer;
		AfkTimerSetEnabled(Player.OnlineSettings.EnableAfkTimer);
	}},
	{ label: "AllowFullWardrobeAccess", check: () => Player.OnlineSharedSettings.AllowFullWardrobeAccess, click: () => Player.OnlineSharedSettings.AllowFullWardrobeAccess = !Player.OnlineSharedSettings.AllowFullWardrobeAccess },
	{ label: "BlockBodyCosplay", check: () => Player.OnlineSharedSettings.BlockBodyCosplay, click: () => Player.OnlineSharedSettings.BlockBodyCosplay = !Player.OnlineSharedSettings.BlockBodyCosplay },
	{ label: "ShowStatus", check: () => Player.OnlineSettings.ShowStatus, click: () => Player.OnlineSettings.ShowStatus = !Player.OnlineSettings.ShowStatus },
	{ label: "SendStatus", check: () => Player.OnlineSettings.SendStatus, click: () => Player.OnlineSettings.SendStatus = !Player.OnlineSettings.SendStatus },
];

const PreferenceSubscreenOnlineIDs = Object.freeze({
	grid: 'preference-online-grid',
	grid2: 'preference-online-grid2',
	subtitle: 'preference-online-subtitle',
	selection: 'preference-online-selection-button',
});

function PreferenceSubscreenOnlineLoad() {
	if (!PreferenceOnlineDefaultBackground) PreferenceOnlineDefaultBackground = Player.OnlineSettings.DefaultChatRoomBackground;
	PreferenceOnlineDefaultBackgroundList = BackgroundsGenerateList(BackgroundsTagList);
	PreferenceOnlineDefaultBackgroundIndex = PreferenceOnlineDefaultBackgroundList.indexOf(PreferenceOnlineDefaultBackground);

	const checkboxElements = PreferenceSubscreenOnlineCheckboxes.map((checkbox) => {
		const checked = checkbox.check();
		const label = TextGet(checkbox.label);

		return ElementCheckbox.CreateLabelled(`${checkbox.label}-checkbox`, label, checkbox.click, {
			checked
		});
	});

	const dropdownOptions = [0, 1, 2, 3].map((e) => /** @type {Omit<HTMLOptions<"option">, "tag">} */ ({attributes: { value: e.toString(), label: TextGet("RoomCustomizationLevel" + e.toString()), selected: e === Player.OnlineSettings.ShowRoomCustomization }}));

	const dropdown = ElementCreate({
		tag: "div",
		classList: ["preference-settings-dropdown"],
		attributes: {
			id: `RoomCustomizationLevel-dropdown-container`
		},
		children: [
			{
				tag: "label",
				children: [TextGet("RoomCustomizationLabel")],
				attributes: { for: "RoomCustomizationLevel" },
			},
			ElementCreateDropdown("RoomCustomizationLevel", dropdownOptions, (ev) => {
				ev.preventDefault();
				const value = parseInt(/** @type {HTMLSelectElement} */ (ev.target).value);
				if (!value) return;
				Player.OnlineSettings.ShowRoomCustomization = /** @type {0 | 1 | 2 | 3} */ (value);
			})
		]
	});

	const grid = ElementCreate({
		tag: "div",
		classList: ["preference-settings-grid", "scroll-box"],
		attributes: { id: PreferenceSubscreenOnlineIDs.grid },
		children: [
			...checkboxElements,
			dropdown
		]
	});
	ElementWrap(PreferenceIDs.subscreen).append(grid);

	const subtitle = ElementCreate({
		tag: "label",
		attributes: { id: PreferenceSubscreenOnlineIDs.subtitle, for: PreferenceSubscreenOnlineIDs.selection },
		children: [TextGet("DefaultChatRoomBackground")],
	});

	const selection = ElementButton.Create(PreferenceSubscreenOnlineIDs.selection, () => {
		BackgroundSelectionMake(BackgroundsTagList, PreferenceOnlineDefaultBackground, (Name, setBackground) => {
			if (setBackground) {
				PreferenceOnlineDefaultBackground = Name;
				Player.OnlineSettings.DefaultChatRoomBackground = Name;
				PreferenceOnlineDefaultBackgroundIndex = PreferenceOnlineDefaultBackgroundList.indexOf(PreferenceOnlineDefaultBackground);
			}
			PreferenceOpenSubscreen("Online", 2);
		});
	}, {
		image: "Icons/Preference.png",
	});

	const grid2 = ElementCreate({
		tag: "div",
		classList: ["preference-settings-grid", "scroll-box"],
		attributes: { id: PreferenceSubscreenOnlineIDs.grid2 },
		children: [
			subtitle,
			selection
		]
	});
	ElementWrap(PreferenceIDs.subscreen).append(grid2);
}
/**
 * Sets the online preferences for the player. Redirected to from the main Run function if the player is in the online
 * settings subscreen.
 * @returns {void} - Nothing
 */
function PreferenceSubscreenOnlineRun() {
	DrawCharacter(Player, 50, 50, 0.9);
	MainCanvas.textAlign = "center";
	PreferencePageChangeDraw(1595, 75, 2);
	ElementWrap(PreferenceSubscreenOnlineIDs.grid).toggleAttribute("hidden", PreferencePageCurrent !== 1);
	ElementWrap(PreferenceSubscreenOnlineIDs.grid2).toggleAttribute("hidden", PreferencePageCurrent !== 2);

	if (PreferencePageCurrent === 2) {
		DrawImageResize("Backgrounds/" + PreferenceOnlineDefaultBackground + ".jpg", 500, 210, 300, 185);
	}
}

/**
 * Handles the click events for the online settings.  Redirected from the main Click function.
 * @returns {void} - Nothing
 */
function PreferenceSubscreenOnlineClick() {
	PreferencePageChangeClick(1595, 75, 2);
}

function PreferenceSubscreenOnlineResize() {
	const { x, y } = PreferenceSubscreenMainGrid;
	ElementSetPosition(PreferenceSubscreenOnlineIDs.grid, x, y);
	ElementSetPosition(PreferenceSubscreenOnlineIDs.subtitle, 500, 150);
	ElementPositionFixed(PreferenceSubscreenOnlineIDs.selection, 820, 210, 90, 90);
}

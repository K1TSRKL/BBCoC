// @ts-strict-ignore
"use strict";

/** @type {SettingsSensDepName[]} */
var PreferenceSettingsSensDepList = ["SensDepLight", "Normal", "SensDepNames", "SensDepTotal", "SensDepExtreme"];

/** @type {{label: string, check: () => boolean, click: (value: boolean) => void, disabled?: (disableButtons: boolean) => boolean}[]} */
const PreferenceSubscreenImmersionCheckboxes = [
	{
		label: "BlindDisableExamine",
		check: () => (Player.GameplaySettings.BlindDisableExamine && Player.GameplaySettings.SensDepChatLog !== "SensDepLight") || Player.GameplaySettings.SensDepChatLog === "SensDepExtreme",
		click: (value) => Player.GameplaySettings.BlindDisableExamine = value,
		disabled: (disableButtons) => disableButtons || Player.GameplaySettings.SensDepChatLog === "SensDepLight" || Player.GameplaySettings.SensDepChatLog === "SensDepExtreme"
	},
	{
		label: "BlindAdjacent",
		check: () => Player.ImmersionSettings.BlindAdjacent,
		click: (value) => Player.ImmersionSettings.BlindAdjacent = value,
		disabled: (disableButtons) => disableButtons
	},
	{
		label: "ChatRoomMuffle",
		check: () => Player.ImmersionSettings.ChatRoomMuffle,
		click: (value) => Player.ImmersionSettings.ChatRoomMuffle = value,
		disabled: (disableButtons) => disableButtons
	},
	{
		label: "DisableAutoRemoveLogin",
		check: () => Player.GameplaySettings.DisableAutoRemoveLogin,
		click: (value) => Player.GameplaySettings.DisableAutoRemoveLogin = value,
		disabled: (disableButtons) => disableButtons
	},
	{
		label: "AllowPlayerLeashing",
		check: () => Player.OnlineSharedSettings.AllowPlayerLeashing,
		click: (value) => Player.OnlineSharedSettings.AllowPlayerLeashing = value,
		disabled: (disableButtons) => disableButtons
	},
	{
		label: "ReturnToChatRoom",
		check: () => Player.ImmersionSettings.ReturnToChatRoom,
		click: (value) => Player.ImmersionSettings.ReturnToChatRoom = value,
		disabled: (disableButtons) => disableButtons
	},
	{
		label: "ReturnToChatRoomAdmin",
		check: () => Player.ImmersionSettings.ReturnToChatRoom && Player.ImmersionSettings.ReturnToChatRoomAdmin,
		click: (value) => Player.ImmersionSettings.ReturnToChatRoomAdmin = value,
		disabled: (disableButtons) => !Player.ImmersionSettings.ReturnToChatRoom || disableButtons
	},
	{
		label: "SenseDepMessages",
		check: () => Player.GameplaySettings.SensDepChatLog !== "SensDepLight" && Player.ImmersionSettings.SenseDepMessages,
		click: (value) => Player.ImmersionSettings.SenseDepMessages = value,
		disabled: (disableButtons) => Player.GameplaySettings.SensDepChatLog === "SensDepLight" || disableButtons
	},
	{
		label: "StimulationEvents",
		check: () => Player.ImmersionSettings.StimulationEvents,
		click: (value) => Player.ImmersionSettings.StimulationEvents = value,
		disabled: (disableButtons) => disableButtons
	},
	{
		label: "AllowTints",
		check: () => Player.ImmersionSettings.AllowTints,
		click: (value) => Player.ImmersionSettings.AllowTints = value,
		disabled: (disableButtons) => disableButtons
	},
	{
		label: "ChatRoomMapLeaveOnExit",
		check: () => Player.ImmersionSettings.ChatRoomMapLeaveOnExit,
		click: (value) => Player.ImmersionSettings.ChatRoomMapLeaveOnExit = value,
		disabled: (disableButtons) => disableButtons
	},
	{
		label: "AllowRename",
		check: () => Player.OnlineSharedSettings.AllowRename,
		click: (value) => Player.OnlineSharedSettings.AllowRename = value,
		disabled: (disableButtons) => disableButtons || !CharacterCanChangeNickname(Player)
	},
	{
		label: "ShowUngarbledMessages",
		check: () => Player.ImmersionSettings.ShowUngarbledMessages,
		click: (value) => Player.ImmersionSettings.ShowUngarbledMessages = value,
		disabled: (disableButtons) => disableButtons
	},
];

const PreferenceSubscreenImmersionIDs = Object.freeze({
	wrapper: "preference-immersion-wrapper",
	grid: "preference-immersion-grid",
	header: "preference-immersion-header",
	lockCheckbox: "preference-ImmersionLockSetting"
});

function PreferenceSubscreenImmersionLoad() {
	const difficultyTooHigh = Player.GetDifficulty() > 2;
	const disableButtons = difficultyTooHigh || (Player.GameplaySettings.ImmersionLockSetting && Player.IsRestrained());
	const disableCheckbox = ElementCheckbox.CreateLabelled(
		PreferenceSubscreenImmersionIDs.lockCheckbox,
		difficultyTooHigh ? TextGet("ImmersionLocked") : TextGet("ImmersionLockSetting"),
		function () {
			const value = this.checked;
			Player.GameplaySettings.ImmersionLockSetting = value;
			PreferenceSubscreenImmersionCheckStates(disableButtons);
		},
		{
			checked: Player.GameplaySettings.ImmersionLockSetting,
			disabled: disableButtons,
		}
	);

	const options = PreferenceSettingsSensDepList.map((e) => /** @type {Omit<HTMLOptions<"option">, "tag">} */({ attributes: { value: e, label: TextGet(e), selected: e === Player.GameplaySettings.SensDepChatLog } }));

	const sensDepDropdown = ElementCreate({
		tag: "div",
		classList: ["preference-settings-dropdown"],
		attributes: {
			id: `SensDepSetting-dropdown-container`
		},
		children: [
			{
				tag: "label",
				children: [TextGet("SensDepSetting")],
				attributes: { for: "SensDepSetting-dropdown" },
			},
			ElementCreateDropdown(`SensDepSetting-dropdown`, options,
				function () {
					const value = /** @type {SettingsSensDepName} */ (this.value);
					if (!value) return;
					if (!PreferenceSettingsSensDepList.includes(value)) return;
					Player.GameplaySettings.SensDepChatLog = value;
					if (Player.GameplaySettings.SensDepChatLog === "SensDepExtreme") ChatRoomSetTarget(-1);
					PreferenceSubscreenImmersionCheckStates(disableButtons);
				},
				{
					disabled: disableButtons
				})
		]
	});

	const otherCheckboxes = PreferenceSubscreenImmersionCheckboxes.map((checkbox) => {
		return ElementCheckbox.CreateLabelled(
			`preference-immersion-${checkbox.label}`,
			TextGet(checkbox.label),
			function () {
				const value = this.checked;
				checkbox.click(value);
				PreferenceSubscreenImmersionCheckStates(disableButtons);
			},
			{
				checked: checkbox.check(),
				disabled: checkbox.disabled(disableButtons)
			});
	});

	ElementCreate({
		tag: "div",
		attributes: {
			id: PreferenceSubscreenImmersionIDs.wrapper
		},
		children: [
			disableCheckbox,
			{
				tag: "hr",
				classList: ["preference-settings-divider"]
			},
			{
				tag: "div",
				classList: ["preference-settings-grid", "scroll-box"],
				attributes: {
					id: PreferenceSubscreenImmersionIDs.grid
				},
				children: [
					sensDepDropdown,
					...otherCheckboxes
				],
			}
		],
		parent: ElementWrap(PreferenceIDs.subscreen)
	});
}

/**
 * Runs and draws the preference screen, immersion sub-screen
 * @returns {void} - Nothing
 */
function PreferenceSubscreenImmersionRun() {
	DrawCharacter(Player, 50, 50, 0.9);
}

/**
 * Handles the click events in the preference screen, immersion sub-screen, propagated from CommonClick()
 * @returns {void} - Nothing
 */
function PreferenceSubscreenImmersionClick() {
}

function PreferenceSubscreenImmersionResize(onLoad) {
	ElementSetPosition(PreferenceSubscreenImmersionIDs.wrapper, 500, 160);
}

/**
 * @param {boolean} disableButtons
 */
function PreferenceSubscreenImmersionCheckStates(disableButtons) {
	const lockCheckbox = /** @type {HTMLInputElement} */ (ElementWrap(PreferenceSubscreenImmersionIDs.lockCheckbox));

	if (lockCheckbox) {
		lockCheckbox.toggleAttribute("disabled", disableButtons);
	}

	const sensDepDropdown = /** @type {HTMLSelectElement} */ (ElementWrap(`SensDepSetting-dropdown`));

	if (sensDepDropdown) {
		sensDepDropdown.toggleAttribute("disabled", disableButtons);
	}

	PreferenceSubscreenImmersionCheckboxes.forEach((checkbox) => {
		const disabled = checkbox.disabled(disableButtons);
		const checked = checkbox.check();

		const checkboxElement = /** @type {HTMLInputElement} */ (ElementWrap(`preference-immersion-${checkbox.label}`));

		if (!checkboxElement) return;

		if (disabled !== checkboxElement.disabled) {
			checkboxElement.toggleAttribute("disabled", disabled);
		}

		if (checked !== checkboxElement.checked) {
			checkboxElement.checked = checked;
			checkbox.click(checked);
		}
	});
}

// @ts-strict-ignore
"use strict";

/** @type {boolean} */
var PreferenceSubscreenGeneralColorPicker = false;
var PreferenceSafewordConfirm = false;

/** @type {{label: string, check: () => boolean, click: (value: boolean) => void, disabled?: (disableButtons: boolean) => boolean}[]} */
const PreferenceSubscreenGeneralCheckboxes = [
	{
		label: "ForceFullHeight",
		check: () => Player.VisualSettings.ForceFullHeight,
		click: (value) => Player.VisualSettings.ForceFullHeight = value,
	},
	{
		label: "DisablePickingLocksOnSelf",
		check: () => Player.OnlineSharedSettings.DisablePickingLocksOnSelf,
		click: (value) => Player.OnlineSharedSettings.DisablePickingLocksOnSelf = value,
	},
	{
		label: "EnableSafeword",
		check: () => Player.GameplaySettings.EnableSafeword,
		click: () => {
			const canToggle = !Player.IsRestrained() && !Player.IsChaste();
			const enabled = Player.GameplaySettings.EnableSafeword;

			if (canToggle || enabled) {
				if (PreferenceSafewordConfirm) {
					Player.GameplaySettings.EnableSafeword = !enabled;
					PreferenceSafewordConfirm = false;
				} else {
					PreferenceSafewordConfirm = true;
				}
			}

			const checkbox = /** @type {HTMLInputElement} */ (ElementWrap("preference-immersion-EnableSafeword"));
			checkbox.checked = Player.GameplaySettings.EnableSafeword;

			const label = TextGet(PreferenceSafewordConfirm ? "ConfirmSafeword" : "EnableSafeword");
			ElementWrap("preference-immersion-EnableSafeword-label").textContent = label;
		},
		disabled: (onHighDifficulty) => onHighDifficulty
	},
	{
		label: "DisableAutoMaid",
		check: () => !Player.GameplaySettings.DisableAutoMaid,
		click: (value) => Player.GameplaySettings.DisableAutoMaid = !value,
		disabled: (onHighDifficulty) => onHighDifficulty
	},
	{
		label: "OfflineLockedRestrained",
		check: () => Player.GameplaySettings.OfflineLockedRestrained,
		click: (value) => Player.GameplaySettings.OfflineLockedRestrained = value,
		disabled: (onHighDifficulty) => onHighDifficulty
	},
	{
		label: "ItemsAffectExpressions",
		check: () => Player.OnlineSharedSettings.ItemsAffectExpressions,
		click: (value) => Player.OnlineSharedSettings.ItemsAffectExpressions = value,
	}
];

const PreferenceSubscreenGeneralIDs = Object.freeze({
	grid: "preference-general-grid",
	colorInput: "InputCharacterLabelColor",
	colorPickerToggle: "preference-general-color-picker-toggle",
	generalHardcoreWarning: "preference-general-hardcore-warning",
});

/**
 * Loads the Preferences screen.
 * @returns {void} - Nothing
 */
function PreferenceSubscreenGeneralLoad() {
	const colorInput = ElementCreateInput(PreferenceSubscreenGeneralIDs.colorInput, "text", Player.LabelColor);
	colorInput.addEventListener("input", function () {
		PreferenceSubscreenGeneralColorInput(this);
	});
	PreferenceSubscreenGeneralColorInput(colorInput);

	const colorInputGroup = ElementCreate({
		tag: "label",
		children: [
			TextGet("CharacterLabelColor"),
			colorInput,
			ElementButton.Create(PreferenceSubscreenGeneralIDs.colorPickerToggle,
				() => PreferenceSubscreenGeneralColorPickerToggle(),
				{
					image: "Icons/Color.png",
					tooltip: TextGet("ToggleColorPicker")
				}
			),
		],
		attributes: { for: PreferenceSubscreenGeneralIDs.colorInput },
	});

	const dropdownOptions = Object.values(AllowedInteractions)
		.map((e) => /** @type {Omit<HTMLOptions<"option">, "tag">} */({
			attributes: {
				value: e.toString(),
				label: TextGet("AllowedInteraction" + e.toString()),
				selected: e === Player.AllowedInteractions
			}
		}));

	const dropdown = ElementCreate({
		tag: "div",
		classList: ["preference-settings-dropdown"],
		attributes: {
			id: "AllowedInteractions-dropdown-container"
		},
		children: [
			{
				tag: "label",
				children: [TextGet("AllowedInteractions")],
				attributes: { for: "AllowedInteractions-dropdown" },
			},
			ElementCreateDropdown("AllowedInteractions-dropdown", dropdownOptions, function (ev) {
				ev.preventDefault();
				if (this.value in Object.values(AllowedInteractions) === false) return;
				Player.AllowedInteractions = /** @type {AllowedInteractions} */ (CommonParseInt(this.value));
				if (Player.GetDifficulty() >= Difficulty.EXTREME) LoginExtremeItemSettings(Player.AllowedInteractions === AllowedInteractions.Everyone);
			})
		]
	});

	const onHighDifficulty = Player.GetDifficulty() >= Difficulty.HARDCORE;

	const checkboxes = PreferenceSubscreenGeneralCheckboxes.map((checkbox) => {
		return ElementCheckbox.CreateLabelled(
			`preference-immersion-${checkbox.label}`,
			TextGet(checkbox.label),
			function () {
				const value = this.checked;
				checkbox.click(value);
			},
			{
				checked: checkbox.check(),
				disabled: checkbox.disabled?.(onHighDifficulty)
			});
	});

	ElementCreate({
		tag: "div",
		classList: ["preference-settings-grid", "scroll-box"],
		attributes: {
			id: PreferenceSubscreenGeneralIDs.grid
		},
		children: [
			colorInputGroup,
			dropdown,
			onHighDifficulty ? {
				tag: 'span',
				attributes: { id: PreferenceSubscreenGeneralIDs.generalHardcoreWarning },
				children: [TextGet("GeneralHardcoreWarning")],
			} : undefined,
			...checkboxes
		],
		parent: ElementWrap(PreferenceIDs.subscreen)
	});
}

/**
 * Handles click events in the preference screen that are propagated from CommonClick()
 * @returns {void} - Nothing
 */
function PreferenceSubscreenGeneralRun() {
	DrawCharacter(Player, 50, 50, 0.9);

	// Draw the online preferences
	MainCanvas.textAlign = "left";
	if (PreferenceMessage != "") DrawText(TextGet(PreferenceMessage), 920, 125, "Red", "Black");
	MainCanvas.textAlign = "center";

}

/**
 * Handles the click events in the preference screen, general sub-screen, propagated from CommonClick()
 * @returns {void} - Nothing
 */
function PreferenceSubscreenGeneralClick() {
	PreferenceSafewordConfirm = false;

	const label = TextGet(PreferenceSafewordConfirm ? "ConfirmSafeword" : "EnableSafeword");
	ElementWrap("preference-immersion-EnableSafeword-label").textContent = label;
}

/**
 * Exits the preference screen. Block exit when the color picker is active.
 * @returns {boolean} - Returns false if the color picker is active and input is not valid
 */
function PreferenceSubscreenGeneralExit() {
	if (PreferenceSubscreenGeneralColorPicker) {
		ColorPickerExit(true);
		document.getElementById("preference-general-color-picker-backdrop")?.remove();
		PreferenceSubscreenGeneralColorPicker = false;
		return false;
	}

	const color = ElementValue("InputCharacterLabelColor");
	if (!CommonIsColor(color)) {
		PreferenceMessage = "ErrorInvalidColor";
		return false;
	}

	PreferenceSafewordConfirm = false;

	return true;
}

/**
 * Cleans up elements that are not needed anymore
 * If the selected color is invalid, the player cannot leave the screen.
 */
function PreferenceSubscreenGeneralUnload() {
	const color = ElementValue("InputCharacterLabelColor");
	if (CommonIsColor(color)) {
		if (color !== Player.LabelColor) {
			Player.LabelColor = color;
			const elems = /** @type {HTMLElement[]} */(Array.from(document.querySelectorAll(`[style*="--label-color"][data-sender="${Player.MemberNumber}"]`)));
			elems.forEach(e => e.style.setProperty("--label-color", color));
		}
	}
	PreferenceMessage = "";
	ColorPickerExit(true);
}

function PreferenceSubscreenGeneralResize() {
	const { x, y } = PreferenceSubscreenMainGrid;
	ElementSetPosition(PreferenceSubscreenGeneralIDs.grid, x, y);
	ColorPickerResize(false);
}

function PreferenceSubscreenGeneralColorPickerToggle() {
	if (!PreferenceSubscreenGeneralColorPicker) {
		// See `PreferenceIDs.exit`: [1815, 75, 90, 90]
		const paddingTop = 75;
		const paddingRight = 2000 - (1815 + 90);
		const shape = /** @type {const} */([
			2000 - ColorPicker.defaultShape[2] - paddingRight + 25,
			paddingTop,
			ColorPicker.defaultShape[2],
			1000 - paddingTop * 2,
		]);
		ColorPickerInit({
			colorState: {
				colors: [Player.LabelColor || "#ffffff"],
				defaultColors: ["#ffffff"],
				opacity: [1],
				editOpacity: false,
			},
			heading: TextGet("CharacterLabelColor"),
			shape,
			onInput: () => null,
			onExit: ({ colors }, save) => {
				if (save) {
					ElementValue("InputCharacterLabelColor", colors[0]);
				}
				PreferenceSubscreenGeneralColorPicker = false;
				document.getElementById("preference-general-color-picker-backdrop")?.toggleAttribute("hidden", true);
			},
		}).then(colorPicker => {
			let backdrop = document.getElementById("preference-general-color-picker-backdrop");
			if (!backdrop) {
				ElementCreate({
					tag: "div",
					attributes: { id: "preference-general-color-picker-backdrop" },
					children: [colorPicker],
					parent: document.body,
					style: { "background-color": "rgba(0, 0, 0, 0.3)", width: "100%", height: "100%", position: "absolute" },
				});
			} else {
				backdrop.toggleAttribute("hidden", false);
			}
		});
	} else {
		ColorPickerHide();
		document.getElementById("preference-general-color-picker-backdrop")?.toggleAttribute("hidden", true);
	}
	PreferenceSubscreenGeneralColorPicker = !PreferenceSubscreenGeneralColorPicker;
}

/** @param {HTMLInputElement} input */
function PreferenceSubscreenGeneralColorInput(input) {
	/** @type {"" | HexColor} */
	let textColor = "";

	if (CommonIsColor(input.value))
		textColor = input.value;
	else
		textColor = Player.LabelColor;

	input.style.color = textColor;
	let TextColorHSV = ColorPickerCSSToHSV(textColor || "#FFFFFF");

	if (TextColorHSV.V > 0.4) {
		input.style.backgroundColor = "#111111";
	} else {
		input.style.backgroundColor = "#FFFFFF";
	}
}

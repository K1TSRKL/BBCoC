// @ts-strict-ignore
"use strict";

/** @type {PreferenceExtensionsMenuButtonInfo[]} */
let PreferenceExtensionsDisplay = [];
/** @type {PreferenceExtensionsSettingItem | null}*/
let PreferenceExtensionsCurrent = null;

const PreferenceExtensionsIDs = Object.freeze({
	grid: 'preference-extensions-grid',
	noExtensionLabel: 'preference-no-extensions-label',
});

/**
 * Handles the loading of the preference subscreen for extensions
 * @returns {void} - Nothing
 */
function PreferenceSubscreenExtensionsLoad() {
	PreferenceExtensionsDisplay = Object.keys(PreferenceExtensionsSettings).map(
		k => (
			s=>({
				Button: typeof s.ButtonText === "function" ? s.ButtonText() : s.ButtonText,
				Image: s.Image && (typeof s.Image === "function" ? s.Image() : s.Image),
				click: () => {
					PreferenceExtensionsCurrent = s;
					ElementWrap(PreferenceIDs.subscreen).hidden = true;
					s?.load();
				},
			}))(PreferenceExtensionsSettings[k]));

	if (PreferenceExtensionsDisplay.length === 0) {
		const noExtensionLabel = ElementCreate({
			tag: "span",
			attributes: { id: PreferenceExtensionsIDs.noExtensionLabel },
			children: [TextGet("ExtensionsNotFound")],
		});
		ElementWrap(PreferenceIDs.subscreen).append(noExtensionLabel);
	} else {
		ElementWrap(PreferenceExtensionsIDs.grid)?.remove();
		const buttonsGrid = ElementCreate({
			tag: "div",
			classList: ["preference-button-grid", "scroll-box"],
			attributes: { id: PreferenceExtensionsIDs.grid },
			children:
			PreferenceExtensionsDisplay.map((item) => {
				return ElementButton.Create(`preference-main-${item.Button}`,
					() => {
						item.click();
					},
					{
						image: item.Image,
						label: item.Button,
						labelPosition: "right",
					});
			}),
		});
		ElementWrap(PreferenceIDs.subscreen).append(buttonsGrid);
	}
}

/**
 * Runs and draws the preference subscreen for extensions
 * @returns {void} - Nothing
 */
function PreferenceSubscreenExtensionsRun() {
	if (PreferenceExtensionsCurrent) {
		PreferenceExtensionsCurrent.run();
		return;
	}

	DrawCharacter(Player, 50, 50, 0.9);
}

/**
 * Handles clicks in the preference subscreen for extensions
 * @returns {void} - Nothing
 */
function PreferenceSubscreenExtensionsClick() {
	if (PreferenceExtensionsCurrent) {
		PreferenceExtensionsCurrent.click();
		return;
	}
}

async function PreferenceSubscreenExtensionsExit() {
	if (PreferenceExtensionsCurrent) {
		const validExit = PreferenceExtensionsCurrent.exit();
		if (validExit === false) return false;
		await PreferenceSubscreenExtensionsClear();
		return false;
	}

	return true;
}

/**
 * Exit the preference subscreen for extensions, should be called when
 * leaving custom menu of extensions if the extension exits the menu from itself.
 * @returns {Promise<void>} - Nothing
 */
async function PreferenceSubscreenExtensionsClear() {
	if (PreferenceExtensionsCurrent === null) return;
	PreferenceExtensionsCurrent.unload?.();
	PreferenceExtensionsCurrent = null;
	// Reload the extension settings
	ElementWrap(PreferenceIDs.subscreen).hidden = false;
	await PreferenceOpenSubscreen("Extensions");
}

/**
 * Unloads the preference subscreen for extensions
 * Cleans up the current extension, and reset the current extension to null
 */
function PreferenceSubscreenExtensionsUnload() {
	PreferenceExtensionsCurrent?.unload?.();
	PreferenceExtensionsCurrent = null;
}

function PreferenceSubscreenExtensionsResize(onLoad) {
	const { x, y } = PreferenceSubscreenMainGrid;

	const grid = ElementWrap(PreferenceExtensionsIDs.grid);
	if (grid) ElementSetPosition(grid, x, y);

	const label = ElementWrap(PreferenceExtensionsIDs.noExtensionLabel);
	if (label) ElementPosition(label, 1000, 500, 1000);

	PreferenceExtensionsCurrent?.resize?.(onLoad);
}

/**
 * @param {string} screenIdentifier
 * @param {ScreenSpecifier} returnScreen
 */
async function PreferenceSubscreenExtensionsOpen(screenIdentifier, returnScreen) {
	if (PreferenceSubscreen?.name !== "Extensions") {
		const currentScreen = CommonGetScreen();
		await PreferenceOpenSubscreen("Extensions");
		InformationSheetReturnScreen = returnScreen ?? currentScreen;
	}
	if (PreferenceExtensionsCurrent?.Identifier === screenIdentifier) return;
	if (PreferenceExtensionsCurrent) await PreferenceSubscreenExtensionsExit();

	const screen = PreferenceExtensionsSettings[screenIdentifier];
	if (!screen) return;

	PreferenceExtensionsCurrent = screen;
	screen.load();
	ElementWrap(PreferenceIDs.subscreen).hidden = true;
}

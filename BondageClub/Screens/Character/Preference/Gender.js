"use strict";

const PreferenceSubscreenGenderIDs = Object.freeze({
	grid: "preference-gender-grid",
});

const PreferenceSubscreenGenderSettings = [
	{
		id: "AutoJoinSearch",
		label: "GenderAutoJoinSearch",
		setting: () => Player.GenderSettings.AutoJoinSearch,
	},
	{
		id: "HideShopItems",
		label: "GenderHideShopItems",
		setting: () => Player.GenderSettings.HideShopItems,
	},
	{
		id: "HideTitles",
		label: "GenderHideTitles",
		setting: () => Player.GenderSettings.HideTitles,
	},
];

/**
 * Loads the gender preference subscreen.
 * @returns {void} - Nothing
 */
function PreferenceSubscreenGenderLoad() {
	const femaleLabel = TextGet("GenderFemales");
	const maleLabel = TextGet("GenderMales");

	const header = ElementCreate({
		tag: "div",
		classList: ["preference-gender-row", "preference-gender-header"],
		children: [
			{
				tag: "span",
				classList: ["preference-gender-placeholder"],
				children: [""],
			},
			{
				tag: "span",
				children: [femaleLabel],
			},
			{
				tag: "span",
				children: [maleLabel],
			},
		],
	});

	const rows = PreferenceSubscreenGenderSettings.map((entry) => {
		const setting = entry.setting();
		const rowLabel = TextGet(entry.label);
		const femaleId = `preference-gender-${entry.id}-female`;
		const maleId = `preference-gender-${entry.id}-male`;

		const femaleCheckbox = ElementCheckbox.Create(
			femaleId,
			function () {
				setting.Female = this.checked;
			},
			{ checked: setting.Female },
			{
				checkbox: {
					attributes: {
						"aria-label": `${rowLabel} - ${femaleLabel}`,
					},
				},
			}
		);

		const maleCheckbox = ElementCheckbox.Create(
			maleId,
			function () {
				setting.Male = this.checked;
			},
			{ checked: setting.Male },
			{
				checkbox: {
					attributes: {
						"aria-label": `${rowLabel} - ${maleLabel}`,
					},
				},
			}
		);

		return ElementCreate({
			tag: "div",
			classList: ["preference-gender-row"],
			children: [
				{
					tag: "span",
					classList: ["preference-gender-label"],
					children: [rowLabel],
				},
				femaleCheckbox,
				maleCheckbox,
			],
		});
	});

	ElementCreate({
		tag: "div",
		classList: ["preference-settings-grid", "scroll-box", "preference-gender-grid"],
		attributes: {
			id: PreferenceSubscreenGenderIDs.grid,
		},
		children: [header, ...rows],
		parent: ElementWrap(PreferenceIDs.subscreen),
	});
}

/**
 * Sets the gender preferences for a player. Redirected to from the main Run function if the player is in the
 * gender settings subscreen
 * @returns {void} - Nothing
 */
function PreferenceSubscreenGenderRun() {
	DrawCharacter(Player, 50, 50, 0.9);
}

/**
 * Handles click events for the gender settings of a player. Redirected from the main Click function.
 * @returns {void} - Nothing
 */
function PreferenceSubscreenGenderClick() {
}

function PreferenceSubscreenGenderResize() {
	const { x, y } = PreferenceSubscreenMainGrid;
	ElementSetPosition(PreferenceSubscreenGenderIDs.grid, x, y);
}

// @ts-strict-ignore
"use strict";

/** @type {string[]} */
var PreferenceCensoredWordsList = [];

const PreferenceCensoredWordsIDs = Object.freeze({
	grid: 'preference-censored-words-grid',
	subtitle: 'preference-censored-words-subtitle',
	censorshipOption: 'preference-censored-words-censorship-group',
	wordInput: 'InputWord',
	wordInputGroup: "preference-censored-words-word-input-group",
	add: 'preference-censored-words-add-button',
});

/**
 * Loads the preference censored words screen.
 * @returns {void} - Nothing
 */
function PreferenceSubscreenCensoredWordsLoad() {
	PreferenceCensoredWordsList = [];
	if ((Player.ChatSettings.CensoredWordsList != null) && (Player.ChatSettings.CensoredWordsList != ""))
		PreferenceCensoredWordsList = Player.ChatSettings.CensoredWordsList.split("|");

	const subtitle = ElementCreate({
		tag: "span",
		classList: ["subscreen-title"],
		attributes: { id: PreferenceCensoredWordsIDs.subtitle },
		children: [TextGet("CensorTitle")],
	});
	ElementWrap(PreferenceIDs.subscreen).prepend(subtitle);

	const censorshipOption = ElementCreate({
		tag: "div",
		classList: ["preference-settings-dropdown"],
		attributes: {
			id: PreferenceCensoredWordsIDs.censorshipOption,
		},
		children: [
			{
				tag: "label",
				children: [TextGet("CensorLevel")],
				attributes: { for: "CensoredWordsLevel" },
			},
			ElementCreateDropdown(
				"CensoredWordsLevel",
				[
					{ attributes: { value: "0", label: TextGet("CensorLevel0") } },
					{ attributes: { value: "1", label: TextGet("CensorLevel1") } },
					{ attributes: { value: "2", label: TextGet("CensorLevel2") } },
				],
				function (ev) {
					ev.preventDefault();
					Player.ChatSettings.CensoredWordsLevel = parseInt(this.value);
				}
			),
		],
	});
	ElementWrap(PreferenceIDs.subscreen).append(censorshipOption);

	const wordInputGroup = ElementCreate({
		tag: "div",
		classList: ["preference-censored-words-word-input-group"],
		attributes: { id: PreferenceCensoredWordsIDs.wordInputGroup },
		children: [
			{
				tag: "label",
				children: [TextGet("CensorWord")],
				attributes: { for: "InputWord" },
			},
			ElementCreateInput("InputWord", "text", "", "50")
		]
	});
	ElementWrap(PreferenceIDs.subscreen).append(wordInputGroup);

	const addButton = ElementButton.Create(PreferenceCensoredWordsIDs.add,
		() => {
			let Word = ElementValue("InputWord").trim().toUpperCase().replace("|", "");
			if ((Word != "") && (PreferenceCensoredWordsList.indexOf(Word) < 0)) {
				PreferenceCensoredWordsList.push(Word);
				PreferenceCensoredWordsList.sort();
				ElementValue("InputWord", "");
				PreferenceSubscreenCensoredWordsBuildWords();
			}
		},
		{
			image: "Icons/Plus.png",
			tooltip: TextGet("CensorAdd"),
		});
	ElementWrap(PreferenceIDs.subscreen).append(addButton);

	const wordsGrid = ElementCreate({
		tag: "div",
		classList: ["preference-censored-words-grid", "scroll-box"],
		attributes: { id: PreferenceCensoredWordsIDs.grid },
	});
	ElementWrap(PreferenceIDs.subscreen).append(wordsGrid);

	PreferenceSubscreenCensoredWordsBuildWords();
}

/**
 * Sets the censored words for the player. Redirected to from the main Run function.
 * @returns {void} - Nothing
 */
function PreferenceSubscreenCensoredWordsRun() {
	DrawCharacter(Player, 50, 50, 0.9);
}

/**
 * Handles click events for the censored words preference settings.  Redirected from the main Click function.
 * @returns {void} - Nothing
 */
function PreferenceSubscreenCensoredWordsClick() {
}

/**
 * Exits the preference screen
 */
function PreferenceSubscreenCensoredWordsExit() {
	return true;
}

function PreferenceSubscreenCensoredWordsUnload() {
	Player.ChatSettings.CensoredWordsList = PreferenceCensoredWordsList.join("|");
}

function PreferenceSubscreenCensoredWordsResize() {
	ElementSetPosition(PreferenceCensoredWordsIDs.grid, 500, 400);
	ElementPositionFix(PreferenceCensoredWordsIDs.subtitle, 26, 500, 160, 1300, 60);
	ElementPositionFixed(PreferenceCensoredWordsIDs.censorshipOption, 500, 210, 1000, 60);
	ElementPositionFixed(PreferenceCensoredWordsIDs.wordInputGroup, 500, 290, 1000, 60);
	ElementPositionFixed(PreferenceCensoredWordsIDs.add, 1520, 235, 90, 90);
}

function PreferenceSubscreenCensoredWordsBuildWords() {
	ElementWrap(PreferenceCensoredWordsIDs.grid)?.replaceChildren();
	const words = PreferenceCensoredWordsList.map((word, index) => {
		return ElementCreate({
			tag: "div",
			classList: ["preference-settings-word-pair"],
			attributes: {
				id: `preference-censored-words-word-pair-${word}-${index}`,
			},
			children: [
				ElementButton.Create(`preference-censored-words-word-delete-${word}-${index}`, () => {
					PreferenceCensoredWordsList.splice(index, 1);
					PreferenceSubscreenCensoredWordsBuildWords();
				},
				{
					image: "Icons/Small/Remove.png",
					noStyling: true
				},
				{
					button: {
						classList: ["preference-settings-word-delete"],
					}
				}),
				{
					tag: "span",
					classList: ["preference-settings-word"],
					children: [word],
				},
			],
		});
	});

	ElementWrap(PreferenceCensoredWordsIDs.grid)?.replaceChildren(...words);
}

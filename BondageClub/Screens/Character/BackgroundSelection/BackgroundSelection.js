// @ts-strict-ignore
"use strict";

var BackgroundSelectionBackground = "Introduction";
/** @type {string[]} */
var BackgroundSelectionList = [];
/** @type {BackgroundTag[]} */
var BackgroundSelectionTagList = [];
var BackgroundSelectionIndex = 0;
/** @type {string | null} */
var BackgroundSelectionSelect = null;
var BackgroundSelectionSize = 12;
var BackgroundSelectionOffset = 0;
/** @type {null | ((selection: string, setBackground: boolean) => void)} */
var BackgroundSelectionCallback = null;
/** @type {never} */
var BackgroundSelectionReturnScreen;
/** @type {never} */
var BackgroundSelectionAll;
/** @type {string[]} */
var BackgroundSelectionView = [];

const Background = {
	elementID: {
		root: "background-subscreen",
		searchFilter: "background-input-search",
		tagFilter: "background-input-tag",
		btnPrev: "background-button-previous",
		btnNext: "background-button-next",
		btnCancel: "background-button-cancel",
		btnAccept: "background-button-commit",
	}
};

/**
 * Change the current screen to the background selection screen
 * @param {BackgroundTag[]} Tags - The list of possible Background names
 * @param {string} Name - The name of the current background
 * @param {(selection: string, setBackground: boolean) => void} Callback - The function to call when a new background has been selected
 * @returns {void} - Nothing
 */
function BackgroundSelectionMake(Tags, Name, Callback) {
	BackgroundSelectionTagList = Tags;
	BackgroundSelectionList = BackgroundsGenerateList(BackgroundSelectionTagList);
	const idx = BackgroundSelectionList.indexOf(Name);
	BackgroundSelectionIndex = idx >= 0 ? idx : 0;
	BackgroundSelectionCallback = Callback;
	CommonSetScreen("Character", "BackgroundSelection");
}

/**
 * Comapres two backgrounds by their description
 * @param {string} a - The name of the first background
 * @param {string} b - The name of the second background
 * @returns {number} - Returns -1 if the description of object a is less then that of b, 1 otherwise
 */
function BackgroundSelectionSort(a, b) {
	return BackgroundsTextGet(a).localeCompare(BackgroundsTextGet(b));
}

/**
 * Initializes the Background selection screen.
 * Function coiuld be called dynamically, so the body has to be there, even if it does nothing.
 * @type {ScreenLoadHandler}
 */
async function BackgroundSelectionLoad() {
	BackgroundSelectionSelect = BackgroundSelectionList[BackgroundSelectionIndex];
	BackgroundSelectionOffset = Math.floor(BackgroundSelectionIndex / BackgroundSelectionSize) * BackgroundSelectionSize;
	BackgroundSelectionBackground = BackgroundSelectionList[BackgroundSelectionIndex] ?? "Introduction";
	BackgroundSelectionView = BackgroundSelectionList.slice().sort(BackgroundSelectionSort);
	TextPrefetchFile(BackgroundsStringsPath);

	const root = document.getElementById(Background.elementID.root) ?? ElementCreate({
		tag: 'div',
		attributes: {
			id: Background.elementID.root,
			'screen-generated': 'Background',
			"aria-busy": "true",
		},
		classList: ['HideOnPopup'],
		parent: document.body,
	});

	TextScreenCache.loadedPromise.then(() => {
		const searchFilter = ElementCreateSearchInput(
			Background.elementID.searchFilter,
			() => BackgroundSelectionList.map(i => BackgroundsTextGet(i)).sort(),
			{ onInput: BackgroundSelectionInputChanged },
		);

		const tagFilter = ElementCreateDropdown(Background.elementID.tagFilter, BackgroundSelectionTagList, BackgroundSelectionTagChanged);
		if (BackgroundSelectionTagList.length < 2) {
			tagFilter.toggleAttribute("hidden", true);
		}
		root.append(
			searchFilter,
			tagFilter,
			ElementButton.Create(Background.elementID.btnPrev,
				() => {
					BackgroundSelectionOffset = CommonClamp(BackgroundSelectionOffset - BackgroundSelectionSize,
						0,
						Math.max(0, Math.ceil(BackgroundSelectionView.length / BackgroundSelectionSize - 1)) * BackgroundSelectionSize
					);
				},
				{
					tooltip: TextGet("Prev"),
					image: "Icons/Prev.png",
				},
			),
			ElementButton.Create(Background.elementID.btnNext,
				() => {
					BackgroundSelectionOffset = CommonClamp(BackgroundSelectionOffset + BackgroundSelectionSize,
						0,
						Math.max(0, Math.ceil(BackgroundSelectionView.length / BackgroundSelectionSize - 1)) * BackgroundSelectionSize
					);
				},
				{
					tooltip: TextGet("Next"),
					image: "Icons/Next.png",
				},
			),
			ElementButton.Create(Background.elementID.btnCancel,
				() => {
					BackgroundSelectionExit(false);
				},
				{
					tooltip: TextGet("Cancel"),
					image: "Icons/Cancel.png",
				},
			),
			ElementButton.Create(Background.elementID.btnAccept,
				() => {
					BackgroundSelectionExit(true);
				},
				{
					tooltip: TextGet("Accept"),
					image: "Icons/Accept.png",
				},
			),
		);
		BackgroundSelectionResize(false);
	});
}

function BackgroundSelectionUnload() {
	ElementRemove(Background.elementID.root);
}

/**
 * Handles input in the text box in the topmost row of the selection screen
 * and changes the offset of the background selection appropriately
 * @returns {void} - Nothing
 */
function BackgroundSelectionInputChanged() {
	let Input = ElementValue(Background.elementID.searchFilter);
	Input = Input.trim().toLowerCase();
	if (Input == "") {
		BackgroundSelectionView = BackgroundSelectionList.slice();
		BackgroundSelectionOffset = Math.floor(BackgroundSelectionIndex / BackgroundSelectionSize) * BackgroundSelectionSize;
	} else {
		BackgroundSelectionView = BackgroundSelectionList.filter(B => BackgroundsTextGet(B).toLowerCase().includes(Input));
		if (BackgroundSelectionOffset >= BackgroundSelectionView.length) BackgroundSelectionOffset = 0;
	}
	BackgroundSelectionView.sort(BackgroundSelectionSort);
}

/**
 * When a new value is selected in the tag selection drop-down, we refresh the displayed background
 * @this {HTMLSelectElement}
 * @returns {void} - Nothing
 */
function BackgroundSelectionTagChanged() {
	BackgroundSelectionList = BackgroundsGenerateList(this.value !== BackgroundsTagNone ? [/** @type {BackgroundTag} */(this.value)] : BackgroundSelectionTagList);
	BackgroundSelectionView = BackgroundSelectionList.slice().sort(BackgroundSelectionSort);
	ElementContent(`${Background.elementID.searchFilter}-datalist`, "");
	BackgroundSelectionInputChanged();
	if (BackgroundSelectionOffset >= BackgroundSelectionView.length) BackgroundSelectionOffset = 0;
}

/**
 * @type {ScreenResizeHandler}
 */
function BackgroundSelectionResize(load) {
	// We skip here because the DOM hasn't been set up yet
	if (load) return;
	ElementPositionFix(Background.elementID.tagFilter, 36, 550, 35, 300, 65);
	ElementPosition(Background.elementID.searchFilter, 1350, 60, 400);
	ElementPositionFix(Background.elementID.btnPrev, 36, 1585, 25, 90, 90);
	ElementPositionFix(Background.elementID.btnNext, 36, 1685, 25, 90, 90);
	ElementPositionFix(Background.elementID.btnCancel, 36, 1785, 25, 90, 90);
	ElementPositionFix(Background.elementID.btnAccept, 36, 1885, 25, 90, 90);
}

/**
 * Draws the Background selection screen:
 * - draws all the buttons and the text input field on the topmost rows
 * - paints the first (max) 12 possible backgrounds in the lower part of the screen
 * The function is called dynamically
 * @returns {void} - Nothing
 */
function BackgroundSelectionRun() {
	MainCanvas.textAlign = "center";
	DrawText(TextGet("Selection").replace("SelectedBackground", BackgroundsTextGet(BackgroundSelectionSelect)), 300, 65, "White", "Black");

	let text = TextGet("Filter").replace("Filtered", BackgroundSelectionView.length.toString()).replace("Total", BackgroundSelectionList.length.toString());
	DrawText(text, 1000, 65, "White", "Black");

	let X = 45;
	let Y = 150;
	for (let i = BackgroundSelectionOffset; i < BackgroundSelectionView.length && i - BackgroundSelectionOffset < BackgroundSelectionSize; ++i) {
		if (BackgroundSelectionView[i] === BackgroundSelectionSelect) {
			DrawButton(X - 4, Y - 4, 450 + 8, 225 + 8, BackgroundsTextGet(BackgroundSelectionView[i]), "Blue");
		}else {
			DrawButton(X, Y, 450, 225, BackgroundsTextGet(BackgroundSelectionView[i]), "White");
		}
		DrawImageResize("Backgrounds/" + BackgroundSelectionView[i] + ".jpg", X + 2, Y + 2, 446, 221);
		DrawTextFit(BackgroundsTextGet(BackgroundSelectionView[i]), X + 227, Y + 252, 450, "Black");
		DrawTextFit(BackgroundsTextGet(BackgroundSelectionView[i]), X + 225, Y + 250, 450, "White");
		X += 450 + 35;
		if (i % 4 == 3) {
			X = 45;
			Y += 225 + 55;
		}
	}

}

/**
 * Handles clicks in the background selection screen:
 * - Exit: Exit the screen without changes
 * - Accept: Exit the screen with a new background
 * - Prev: Paints the previous 12 backgrounds
 * - Next: Paints the nextt 12 backgrounds
 * - Click on any background: Sets this background for selection
 * This function is called dynamically
 *
 * @returns {void} - Nothing
 */
function BackgroundSelectionClick() {
	let X = 45;
	let Y = 150;
	for (let i = BackgroundSelectionOffset; i < BackgroundSelectionView.length && i - BackgroundSelectionOffset < BackgroundSelectionSize; ++i) {
		if (MouseIn(X, Y, 450, 225)) {
			BackgroundSelectionIndex = i;
			if (BackgroundSelectionIndex >= BackgroundSelectionView.length) BackgroundSelectionIndex = 0;
			if (BackgroundSelectionIndex < 0) BackgroundSelectionIndex = BackgroundSelectionView.length - 1;
			BackgroundSelectionSelect = BackgroundSelectionView[BackgroundSelectionIndex];
			// This sets the screen's background
			BackgroundSelectionBackground = BackgroundSelectionSelect;
		}
		X += 450 + 35;
		if (i % 4 == 3) {
			X = 45;
			Y += 225 + 55;
		}
	}

}

/**
 * Handles key events in the background selection screen:
 * - When the user presses "enter", we exit
 * @type {KeyboardEventListener}
 */
function BackgroundSelectionKeyDown(event) {
	if (CommonKey.IsPressed(event, "Enter")) {
		BackgroundSelectionExit(true);
		return true;
	}
	return false;
}

/**
 * Handles the exit of the selection screen. Sets the new background, if necessary, and
 * calls the previously defined callback function. Then exits the screen to the screen, the player was before
 * @satisfies {ScreenExitHandler}
 * @param {boolean} SetBackground - Defines, wether the background must be changed (true) or not (false)
 */
function BackgroundSelectionExit(SetBackground=false) {
	if (BackgroundSelectionCallback) {
		BackgroundSelectionCallback(BackgroundSelectionSelect, SetBackground);
	}
	BackgroundSelectionCallback = null;
}

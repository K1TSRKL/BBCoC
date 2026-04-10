// @ts-strict-ignore
"use strict";

/** @type {CommonGenerateGridParameters} */
const PreferenceSubscreenMainGrid = {
	x: 500,
	y: 160,
	width: 1700,
	height: 700,
	itemWidth: 400,
	itemHeight: 90,
	itemMarginX: 20,
	itemMarginY: 20,
	direction: "vertical",
};

const MainSubscreenIDs = Object.freeze({
	grid: 'preference-main-grid',
});

function PreferenceSubscreenMainLoad() {
	const subscreenButtons = PreferenceSubscreens.filter(s => !s.hidden);

	const buttons = ElementCreate({
		tag: "div",
		classList: ["preference-button-grid", "scroll-box"],
		attributes: { id: MainSubscreenIDs.grid },
		children:
			subscreenButtons.map((screen) => {
				return ElementButton.Create(`preference-main-${screen.name}`,
					() => {
						PreferenceOpenSubscreen(screen.name);
					},
					{
						image: screen.icon || `Icons/${screen.name}.png`,
						label: screen.description || TextGet(`Homepage${screen.name}`),
						labelPosition: "right",
					});
			}),
	});
	ElementWrap(PreferenceIDs.subscreen).append(buttons);
}

function PreferenceSubscreenMainRun() {
	// Draw the player & controls
	DrawCharacter(Player, 50, 50, 0.9);
}

function PreferenceSubscreenMainClick() {
}

function PreferenceSubscreenMainResize(onLoad) {
	const { x, y } = PreferenceSubscreenMainGrid;
	ElementSetPosition(MainSubscreenIDs.grid, x, y);
}

function PreferenceSubscreenMainExit() {
	PreferenceExit();
	// We return false here because we want `PreferenceSubscreenExit()` to stop;
	// `PreferenceExit` will handle saving and switching us out.
	return false;
}

function PreferenceSubscreenMainUnload() {
}




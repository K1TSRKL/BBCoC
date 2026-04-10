"use strict";

/** @type {null | DifficultyLevel} */
var PreferenceDifficultyLevel = null;
var PreferenceDifficultyAccept = false;
var PreferenceDifficultyStatusTimerActive = false;
var PreferenceDifficultyStatusTimerLastChange = 0;

const PreferenceSubscreenDifficultyIDs = Object.freeze({
	list: "preference-difficulty-list",
	listTitle: "preference-difficulty-list-title",
	detail: "preference-difficulty-detail",
	detailTitle: "preference-difficulty-detail-title",
	detailText: "preference-difficulty-detail-text",
	accept: "preference-difficulty-accept",
	changeButton: "preference-difficulty-change",
	status: "preference-difficulty-status",
	/** @param {number | ""} id */
	listLabel: (id) => `preference-difficulty-list-label-${id}`,
	/** @param {number | ""} id */
	listButton: (id) => `preference-difficulty-list-button-${id}`,
});

function PreferenceSubscreenDifficultyLoad() {
	const subscreen = ElementWrap(`${PreferenceIDs.subscreen}-main`);

	const list = ElementCreate({
		tag: "div",
		attributes: { id: PreferenceSubscreenDifficultyIDs.list },
		children: [
			{
				tag: "div",
				attributes: { id: PreferenceSubscreenDifficultyIDs.listTitle },
			},
		],
		parent: subscreen,
	});

	for (let D = 0; D <= 3; D++) {
		const label = ElementCreate({
			tag: "div",
			attributes: { id: PreferenceSubscreenDifficultyIDs.listLabel(D) },
			children: [
				...TextSubstitute(`DifficultyLevel${D}Label`, { "\\n": ElementCreate({ tag: "br" }) })
			],
		});

		const button = ElementButton.Create(
			PreferenceSubscreenDifficultyIDs.listButton(D),
			() => PreferenceSubscreenDifficultySelect(/** @type {DifficultyLevel} */ (D)),
			{ label: TextGet(`DifficultyLevel${D}`), labelPosition: "center" },
		);

		list.append(button, label);
	}

	ElementCreate({
		tag: "div",
		attributes: { id: PreferenceSubscreenDifficultyIDs.detail },
		children: [
			{
				tag: "div",
				attributes: { id: PreferenceSubscreenDifficultyIDs.detailTitle },
			},
			{
				tag: "div",
				attributes: { id: PreferenceSubscreenDifficultyIDs.detailText },
			},
			ElementCheckbox.CreateLabelled(
				PreferenceSubscreenDifficultyIDs.accept,
				TextGet("DifficultyIAccept"),
				function (ev) {
					PreferenceDifficultyAccept = this.checked;
					PreferenceSubscreenDifficultyUpdate();
				},
				{
					checked: PreferenceDifficultyAccept,
					orientation: "horizontal",
				},
			),
			ElementButton.Create(
				PreferenceSubscreenDifficultyIDs.changeButton,
				() => {
					if (PreferenceDifficultyAccept) PreferenceSubscreenDifficultyConfirm();
				},
				{ label: TextGet("DifficultyChangeMode") },
			),
			{
				tag: "div",
				attributes: { id: PreferenceSubscreenDifficultyIDs.status },
			}
		],
		parent: subscreen,
	});

	PreferenceSubscreenDifficultyUpdate();
}

/**
 * Runs and draw the preference screen, difficulty subscreen
 * @returns {void} - Nothing
 */
function PreferenceSubscreenDifficultyRun() {
	DrawCharacter(Player, 50, 50, 0.9);
	PreferenceSubscreenDifficultyUpdateStatusTimer();
}

/**
 * Handles the click events in the preference screen, difficulty sub-screen, propagated from CommonClick()
 * @returns {void} - Nothing
 */
function PreferenceSubscreenDifficultyClick() {
}

function PreferenceSubscreenDifficultyResize() {
	ElementPositionFixed(PreferenceSubscreenDifficultyIDs.list, 500, 225, 1300, 700);
	ElementPositionFixed(PreferenceSubscreenDifficultyIDs.detail, 500, 225, 1300, 650);
	const list = ElementWrap(PreferenceSubscreenDifficultyIDs.list);
	const labels = /** @type {NodeListOf<HTMLElement>} */ (list?.querySelectorAll(`[id^="${PreferenceSubscreenDifficultyIDs.listLabel("")}"]`) ?? []);
	labels.forEach(label => {
		ElementFitText(label);
	});
}

function PreferenceSubscreenDifficultyExit() {
	// When no level is selected, we are exiting the subscreen
	if (PreferenceDifficultyLevel == null) {
		PreferenceDifficultyAccept = false;
		return true;
	} else {
		// If a level is selected, we are returning to list of levels
		PreferenceDifficultyLevel = null;
		PreferenceSubscreenDifficultyUpdate();
		return false;
	}
}
function PreferenceSubscreenDifficultyConfirm() {
	if (PreferenceDifficultyLevel == null) return;
	if (PreferenceDifficultyLevel === Player.GetDifficulty()) return;

	const LastChange = ((Player.Difficulty == null) || (Player.Difficulty.LastChange == null) || (typeof Player.Difficulty.LastChange !== "number")) ? Player.Creation : Player.Difficulty.LastChange;
	if ((PreferenceDifficultyLevel > 1) && (LastChange + 604800000 >= CurrentTime)) return;

	Player.Difficulty = { LastChange: CurrentTime, Level: PreferenceDifficultyLevel };
	ServerSend("AccountDifficulty", PreferenceDifficultyLevel);
	LoginDifficulty(true);
	PreferenceDifficultyLevel = null;
	PreferenceSubscreenExit();
}

/**
 * Sets the text of an element to the given text, with line breaks
 * @param {ElementHelp.ElementOrId} elementOrId
 * @param {string} text
 */
function PreferenceSubscreenDifficultySetLines(elementOrId, text) {
	const element = ElementWrap(elementOrId);
	if (!element) return;

	const nodes = CommonStringPartitionReplace(text, { "\\n": ElementCreate({ tag: "br" }) });
	element.replaceChildren(...nodes);
}

function PreferenceSubscreenDifficultyUpdate() {
	const listVisible = PreferenceDifficultyLevel == null;
	const list = ElementWrap(PreferenceSubscreenDifficultyIDs.list);
	const detail = ElementWrap(PreferenceSubscreenDifficultyIDs.detail);

	list?.toggleAttribute("hidden", !listVisible);
	detail?.toggleAttribute("hidden", listVisible);
	PreferenceDifficultyStatusTimerActive = false;

	const listTitle = ElementWrap(PreferenceSubscreenDifficultyIDs.listTitle);
	if (listTitle) listTitle.textContent = TextGet("DifficultyTitle");

	for (let D = 0; D <= 3; D++) {
		const button = ElementWrap(PreferenceSubscreenDifficultyIDs.listButton(D));
		button?.classList?.toggle("preference-difficulty-level-selected", D === Player.GetDifficulty());
	}

	if (!listVisible) {
		const detailTitle = ElementWrap(PreferenceSubscreenDifficultyIDs.detailTitle);
		if (detailTitle) detailTitle.textContent = TextGet(`DifficultyLevel${PreferenceDifficultyLevel}Title`);

		const detailText = TextGet(`DifficultyLevel${PreferenceDifficultyLevel}Text`);
		PreferenceSubscreenDifficultySetLines(PreferenceSubscreenDifficultyIDs.detailText, detailText);

		const accept = /** @type {HTMLInputElement} */ (ElementWrap(PreferenceSubscreenDifficultyIDs.accept));
		const acceptLabel = ElementWrap(`${PreferenceSubscreenDifficultyIDs.accept}-label`);
		const acceptPair = ElementWrap(`checkbox-pair-${PreferenceSubscreenDifficultyIDs.accept}`);
		const changeButton = /** @type {HTMLButtonElement} */ (ElementWrap(PreferenceSubscreenDifficultyIDs.changeButton));
		const changeButtonLabel = ElementWrap(`${PreferenceSubscreenDifficultyIDs.changeButton}-label`);
		const status = ElementWrap(PreferenceSubscreenDifficultyIDs.status);

		if (acceptLabel) acceptLabel.textContent = TextGet("DifficultyIAccept");

		if (PreferenceDifficultyLevel === Player.GetDifficulty()) {
			acceptPair?.toggleAttribute("hidden", true);
			changeButton?.toggleAttribute("hidden", true);
			if (status) {
				PreferenceSubscreenDifficultyUpdateStatus(TextGet("DifficultyAlreadyPlayingOn"));
				status.toggleAttribute("hidden", false);
			}
		} else {
			const lastChange = ((Player.Difficulty == null) || (Player.Difficulty.LastChange == null) || (typeof Player.Difficulty.LastChange !== "number")) ? Player.Creation : Player.Difficulty.LastChange;
			const canChange = (PreferenceDifficultyLevel != null && PreferenceDifficultyLevel <= 1) || (lastChange + 604800000 < CurrentTime);

			acceptPair?.toggleAttribute("hidden", !canChange);
			changeButton?.toggleAttribute("hidden", !canChange);

			if (status) {
				if (!canChange) {
					PreferenceDifficultyStatusTimerActive = true;
					PreferenceDifficultyStatusTimerLastChange = lastChange;
					PreferenceSubscreenDifficultyUpdateStatusTimer();
					status.toggleAttribute("hidden", false);
				} else {
					PreferenceSubscreenDifficultyUpdateStatus("");
					status.toggleAttribute("hidden", true);
				}
			}

			if (accept) {
				accept.checked = PreferenceDifficultyAccept;
				accept.disabled = !canChange;
			}

			if (changeButton && changeButtonLabel) {
				changeButtonLabel.textContent = `${TextGet("DifficultyChangeMode")} ${TextGet(`DifficultyLevel${PreferenceDifficultyLevel}`)}`;
				changeButton.classList.toggle("preference-difficulty-change-disabled", !PreferenceDifficultyAccept);
				changeButton.disabled = !PreferenceDifficultyAccept;
			}
		}
	}
}

/**
 * Updates the status message
 * @param {string} status
 */
function PreferenceSubscreenDifficultyUpdateStatus(status) {
	const statusElement = ElementWrap(PreferenceSubscreenDifficultyIDs.status);
	if (!statusElement || statusElement.textContent === status) return;

	statusElement.textContent = status;
}

function PreferenceSubscreenDifficultyUpdateStatusTimer() {
	if (!PreferenceDifficultyStatusTimerActive) return;

	const statusElement = ElementWrap(PreferenceSubscreenDifficultyIDs.status);
	if (!statusElement) return;

	const formattedDuration = CommonFormatDurationRange(PreferenceDifficultyStatusTimerLastChange + 604800000, CurrentTime, {
		includeDays: true,
		includeHours: true,
		includeMinutes: true,
		includeSeconds: true,
		showFull: true,
	});
	const statusText = TextGet("DifficultyWaitSevenDays").replace("NumberOfHours", formattedDuration);
	PreferenceSubscreenDifficultyUpdateStatus(statusText);

	if (PreferenceDifficultyStatusTimerLastChange + 604800000 < CurrentTime) {
		PreferenceDifficultyStatusTimerActive = false;
		PreferenceSubscreenDifficultyUpdate();
	}
}

/**
 * Selects a difficulty level
 * @param {DifficultyLevel} level
 */
function PreferenceSubscreenDifficultySelect(level) {
	PreferenceDifficultyLevel = level;
	PreferenceDifficultyAccept = false;
	PreferenceSubscreenDifficultyUpdate();
}

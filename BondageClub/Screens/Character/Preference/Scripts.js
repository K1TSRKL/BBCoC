"use strict";

/** @type {ScriptPermissionProperty[]} */
const PreferenceScriptPermissionProperties = ["Hide", "Block"];
/** @type {null | "global" | "Hide" | "Block"} */
let PreferenceScriptHelp = null;
/** @type {null | ReturnType<typeof setTimeout>} */
let PreferenceScriptTimeoutHandle = null;
/** @type {null | number} */
let PreferenceScriptTimer = null;
let PreferenceScriptWarningAccepted = false;

const PreferenceSubscreenScriptsIDs = Object.freeze({
	grid: "preference-scripts-grid",
	content: "preference-scripts-content",
	warning: "preference-scripts-warning",
	warningTitle: "preference-scripts-warning-title",
	warningText: "preference-scripts-warning-text",
	warningAccept: "preference-scripts-warning-accept",
	explanation: "preference-scripts-explanation",
	helpGlobal: "preference-scripts-help-global",
	table: "preference-scripts-table",
	helpOverlay: "preference-scripts-help-overlay",
	/**
		 * @param {ScriptPermissionProperty} property
		 * @param {ScriptPermissionLevel} permissionLevel
		 * @returns {string}
		 */
	scriptsCheckboxId: (property, permissionLevel) => `preference-scripts-checkbox-${property}-${permissionLevel}`,
	/**
	 * @param {ScriptPermissionProperty} property
	 * @returns {string}
	 */
	scriptsHelpButtonId: (property) => `preference-scripts-help-${property}`,
});

const ScriptPermissionLevel = Object.freeze({
	SELF: "Self",
	OWNER: "Owner",
	LOVERS: "Lovers",
	FRIENDS: "Friends",
	WHITELIST: "Whitelist",
	PUBLIC: "Public",
});

const ScriptPermissionBits = Object.freeze({
	[ScriptPermissionLevel.SELF]: 1,
	[ScriptPermissionLevel.OWNER]: 2,
	[ScriptPermissionLevel.LOVERS]: 4,
	[ScriptPermissionLevel.FRIENDS]: 8,
	[ScriptPermissionLevel.WHITELIST]: 16,
	[ScriptPermissionLevel.PUBLIC]: 32,
});

const maxScriptPermission = Object.values(ScriptPermissionBits)
	.reduce((sum, bit) => sum | bit, 0);

/**
 * @returns {ScriptPermissionLevel[]}
 */
function PreferenceSubscreenScriptsGetPermissionLevels() {
	return Object.values(ScriptPermissionLevel);
}


function PreferenceSubscreenScriptsLoad() {
	if (!PreferenceScriptWarningAccepted) {
		PreferenceScriptTimer = Date.now() + 5000;
		PreferenceScriptTimeoutHandle = setTimeout(() => {
			PreferenceScriptTimer = null;
			PreferenceScriptTimeoutHandle = null;
		}, 5000);
	}

	const parent = ElementWrap(`${PreferenceIDs.subscreen}-main`);
	const root = ElementCreate({
		tag: "div",
		attributes: { id: PreferenceSubscreenScriptsIDs.grid },
		parent,
	});

	ElementCreate({
		tag: "section",
		attributes: { id: PreferenceSubscreenScriptsIDs.warning },
		classList: ["preference-scripts-warning"],
		parent: root,
		children: [
			{
				tag: "h2",
				attributes: { id: PreferenceSubscreenScriptsIDs.warningTitle },
				children: [TextGet("ScriptsWarningTitle")],
			},
			{
				tag: "div",
				attributes: { id: PreferenceSubscreenScriptsIDs.warningText },
				children: [TextGet("ScriptsWarning")],
			},
			ElementButton.Create(PreferenceSubscreenScriptsIDs.warningAccept, (ev) => {
				ev.stopPropagation();
				if (PreferenceScriptTimer == null) {
					PreferenceScriptWarningAccepted = true;
					PreferenceSubscreenScriptsResize();
				}
			}, {
				label: TextGet("ScriptsWarningAccept"),
			}),
		],
	});

	const content = ElementCreate({
		tag: "div",
		attributes: { id: PreferenceSubscreenScriptsIDs.content },
		parent: root,
	});

	ElementCreate({
		tag: "div",
		attributes: { id: PreferenceSubscreenScriptsIDs.explanation },
		classList: ["preference-scripts-text"],
		children: [TextGet("ScriptsExplanation")],
		parent: content,
	});

	ElementButton.Create(PreferenceSubscreenScriptsIDs.helpGlobal, (ev) => {
		ev.stopPropagation();
		PreferenceScriptHelp = PreferenceScriptHelp === "global" ? null : "global";
		PreferenceSubscreenScriptsUpdateHelp();
	}, {
		image: "Icons/Question.png",
		tooltip: TextGet("ScriptsShowHelp"),
	},
	{
		button: {
			parent: content,
		}
	});

	const table = ElementCreate({
		tag: "div",
		attributes: { id: PreferenceSubscreenScriptsIDs.table },
		classList: ["preference-scripts-table"],
		style: {
			"--script-columns": PreferenceScriptPermissionProperties.length.toString(),
		},
		parent: content,
	});

	const headerRow = ElementCreate({
		tag: "div",
		classList: ["preference-scripts-header-row"],
		parent: table,
	});

	ElementCreate({
		tag: "div",
		classList: ["preference-scripts-header-spacer"],
		parent: headerRow,
	});

	for (const property of PreferenceScriptPermissionProperties) {
		const helpButtonId = PreferenceSubscreenScriptsIDs.scriptsHelpButtonId(property);
		const helpButton = ElementButton.Create(helpButtonId, (ev) => {
			ev.stopPropagation();
			PreferenceScriptHelp = PreferenceScriptHelp === property ? null : property;
			PreferenceSubscreenScriptsUpdateHelp();
		}, {
			image: "Icons/Question.png",
			tooltip: TextGet("ScriptsShowHelp"),
		}, {
			button: { classList: ["preference-scripts-help-button"] },
		});

		const headerId = `preference-scripts-header-${property}`;
		ElementCreate({
			tag: "div",
			classList: ["preference-scripts-header-cell", "preference-scripts-column-divider"],
			children: [
				{
					tag: "div",
					classList: ["preference-scripts-header-content"],
					children: [
						helpButton,
						{
							tag: "span",
							attributes: { id: headerId },
							children: [TextGet(`ScriptsPermissionProperty${property}`)],
						},
					],
				},
			],
			parent: headerRow,
		});
	}

	const permissions = PreferenceSubscreenScriptsGetPermissionLevels();
	for (const [rowIndex, permissionLevel] of permissions.entries()) {
		const rowClassList = rowIndex === 0 ? ["preference-scripts-row-divider"] : [];
		const rowId = `preference-scripts-row-${permissionLevel}`;
		const row = ElementCreate({
			tag: "fieldset",
			classList: ["preference-scripts-row", ...rowClassList],
			children: [
				{
					tag: "legend",
					attributes: { id: rowId },
					children: [
						{
							tag: "span",
							classList: ["preference-scripts-row-label"],
							children: [TextGet(`ScriptsPermissionLevel${permissionLevel}`)],
						},
					],
				},
			],
			parent: table,
		});

		for (const property of PreferenceScriptPermissionProperties) {
			const checkboxId = PreferenceSubscreenScriptsIDs.scriptsCheckboxId(property, permissionLevel);
			const headerId = `preference-scripts-header-${property}`;
			const checkbox = ElementCheckbox.Create(checkboxId, function (ev) {
				ev.stopPropagation();
				const scriptPermissions = Player.OnlineSharedSettings.ScriptPermissions;
				const levelSelf = permissionLevel === ScriptPermissionLevel.SELF;
				const levelPublic = permissionLevel === ScriptPermissionLevel.PUBLIC;
				const selfAllowed = ValidationHasScriptPermission(Player, property, ScriptPermissionLevel.SELF);
				const publicAllowed = ValidationHasScriptPermission(Player, property, ScriptPermissionLevel.PUBLIC);
				if (levelSelf) {
					scriptPermissions[property].permission = selfAllowed ? 0 : ScriptPermissionBits[permissionLevel];
				} else if (levelPublic) {
					scriptPermissions[property].permission = publicAllowed ? 0 : maxScriptPermission;
				} else if (selfAllowed && !publicAllowed) {
					scriptPermissions[property].permission ^= ScriptPermissionBits[permissionLevel];
				}
				PreferenceSubscreenScriptsUpdateCheckboxes();
			}, {
				checked: ValidationHasScriptPermission(Player, property, permissionLevel),
			}, {
				checkbox: {
					classList: ["preference-scripts-checkbox"],
					attributes: { "aria-labelledby": `${rowId} ${headerId}` },
					eventListeners: {
						click: (ev) => ev.stopPropagation(),
					},
				},
			});

			ElementCreate({
				tag: "div",
				classList: ["preference-scripts-checkbox-cell", "preference-scripts-column-divider"],
				children: [checkbox],
				parent: row,
			});
		}
	}

	ElementCreate({
		tag: "div",
		attributes: { id: PreferenceSubscreenScriptsIDs.helpOverlay },
		classList: ["preference-scripts-help-overlay", "scroll-box"],
		parent: content,
	});

	PreferenceSubscreenScriptsUpdateCheckboxes();
}

function PreferenceSubscreenScriptsRun() {
	DrawCharacter(Player, 50, 50, 0.9);
	if (!PreferenceScriptWarningAccepted)
		PreferenceSubscreenScriptsUpdateWarning();
}

function PreferenceSubscreenScriptsClick() {
}

function PreferenceSubscreenScriptsExit(allowPanelClose=true) {
	if (PreferenceScriptHelp && allowPanelClose) {
		PreferenceScriptHelp = null;
		PreferenceSubscreenScriptsUpdateHelp();

		return false;
	}

	return true;
}

function PreferenceSubscreenScriptsUnload() {
	if (PreferenceScriptTimeoutHandle != null) {
		clearTimeout(PreferenceScriptTimeoutHandle);
		PreferenceScriptTimeoutHandle = null;
	}
	PreferenceScriptHelp = null;
	PreferenceScriptTimer = null;
	ElementRemove(PreferenceSubscreenScriptsIDs.grid);
	const scriptItem = InventoryGet(Player, "ItemScript");
	if (scriptItem) {
		const params = ValidationCreateDiffParams(Player, Player.MemberNumber);
		const { item, valid } = ValidationResolveScriptDiff(null, scriptItem, params);
		if (!valid) {
			console.info("Cleaning script item after permissions modification");
			if (item) {
				Player.Appearance = Player.Appearance.map((playerItem) => {
					return playerItem.Asset.Group.Name === "ItemScript" ? item : playerItem;
				});
			} else {
				InventoryRemove(Player, "ItemScript", false);
			}
			if (ServerPlayerIsInChatRoom()) {
				ChatRoomCharacterUpdate(Player);
			} else {
				CharacterRefresh(Player);
			}
		}
	}
}

function PreferenceSubscreenScriptsResize() {
	const permissions = PreferenceSubscreenScriptsGetPermissionLevels();
	const tableHeight = 90 * (permissions.length + 1);
	const tableWidth = 500 + PreferenceScriptPermissionProperties.length * 400;

	const { x, y } = PreferenceSubscreenMainGrid;
	ElementSetPosition(PreferenceSubscreenScriptsIDs.grid, x, y);
	ElementSetSize(PreferenceSubscreenScriptsIDs.grid, 1400, 800);

	ElementSetPosition(PreferenceSubscreenScriptsIDs.explanation, 500, 150);
	ElementSetSize(PreferenceSubscreenScriptsIDs.explanation, 1300, 120);

	ElementSetPosition(PreferenceSubscreenScriptsIDs.helpGlobal, 1815, 190);
	ElementSetSize(PreferenceSubscreenScriptsIDs.helpGlobal, 90, 90);

	ElementSetPosition(PreferenceSubscreenScriptsIDs.table, 500, 270);
	ElementSetSize(PreferenceSubscreenScriptsIDs.table, tableWidth, tableHeight);

	ElementSetPosition(PreferenceSubscreenScriptsIDs.warning, 500, 220);
	ElementSetSize(PreferenceSubscreenScriptsIDs.warning, 1200, 600);
	ElementSetSize(PreferenceSubscreenScriptsIDs.warningAccept, 400, 64);

	const table = ElementWrap(PreferenceSubscreenScriptsIDs.table);
	const headerLabels = /** @type {NodeListOf<HTMLSpanElement>} */(table?.querySelectorAll(".preference-scripts-header-content > span") ?? []);
	const checkboxLabels = /** @type {NodeListOf<HTMLSpanElement>} */(table?.querySelectorAll(".preference-scripts-row-label") ?? []);

	for (const label of headerLabels) {
		ElementFitText(label);
	}
	for (const label of checkboxLabels) {
		ElementFitText(label);
	}

	PreferenceSubscreenScriptsUpdateHelp();
	PreferenceSubscreenScriptsUpdateWarning();
}

function PreferenceSubscreenScriptsUpdateCheckboxes() {
	const permissions = PreferenceSubscreenScriptsGetPermissionLevels();

	for (const property of PreferenceScriptPermissionProperties) {
		for (const permissionLevel of permissions) {
			const checkbox = /** @type {HTMLInputElement | null} */(ElementWrap(PreferenceSubscreenScriptsIDs.scriptsCheckboxId(property, permissionLevel)));
			if (!checkbox) continue;
			const disabled = permissionLevel !== ScriptPermissionLevel.PUBLIC
				&& permissionLevel !== ScriptPermissionLevel.SELF
				&& (
					ValidationHasScriptPermission(Player, property, ScriptPermissionLevel.PUBLIC)
					|| !ValidationHasScriptPermission(Player, property, ScriptPermissionLevel.SELF)
				);
			checkbox.checked = ValidationHasScriptPermission(Player, property, permissionLevel);
			checkbox.disabled = disabled;
		}
	}
}

function PreferenceSubscreenScriptsUpdateWarning() {
	const warning = ElementWrap(PreferenceSubscreenScriptsIDs.warning);
	const content = ElementWrap(PreferenceSubscreenScriptsIDs.content);
	if (!warning || !content) return;

	const showWarning = !PreferenceScriptWarningAccepted;
	warning.toggleAttribute("hidden", !showWarning);
	content.toggleAttribute("hidden", showWarning);

	const acceptButton = /** @type {HTMLButtonElement | null} */ (ElementWrap(PreferenceSubscreenScriptsIDs.warningAccept));
	const acceptLabel = ElementWrap(`${PreferenceSubscreenScriptsIDs.warningAccept}-label`);
	const disabled = PreferenceScriptTimer != null;
	const seconds = PreferenceScriptTimer ? Math.ceil((PreferenceScriptTimer - Date.now()) / 1000) : null;
	if (acceptButton) acceptButton.disabled = disabled;
	if (acceptLabel) {
		acceptLabel.textContent = `${TextGet("ScriptsWarningAccept")}${seconds ? ` (${seconds})` : ""}`;
	}
}

function PreferenceSubscreenScriptsUpdateHelp() {
	const helpOverlay = ElementWrap(PreferenceSubscreenScriptsIDs.helpOverlay);
	if (!helpOverlay) return;

	const permissions = PreferenceSubscreenScriptsGetPermissionLevels();
	if (!PreferenceScriptHelp) {
		helpOverlay.toggleAttribute("hidden", true);
		PreferenceSubscreenScriptsUpdateHelpButtons();
		return;
	}

	const isGlobal = PreferenceScriptHelp === "global";
	const helpHeight = (isGlobal ? 90 : 0) + 90 * permissions.length;
	const helpTop = isGlobal ? 270 : 370;
	const textKey = isGlobal ? "ScriptsHelpGlobal" : `ScriptsHelp${PreferenceScriptHelp}`;

	const htmlized = TextSubstitute(textKey, {
		'\\n': ElementCreate({ tag: 'br' }),
	});
	helpOverlay.replaceChildren(...htmlized);
	ElementSetPosition(PreferenceSubscreenScriptsIDs.helpOverlay, 500, helpTop);
	ElementSetSize(PreferenceSubscreenScriptsIDs.helpOverlay, 1200, helpHeight);
	helpOverlay.toggleAttribute("hidden", false);
	PreferenceSubscreenScriptsUpdateHelpButtons();
}

function PreferenceSubscreenScriptsUpdateHelpButtons() {
	PreferenceSubscreenScriptsSetHelpIcon(
		PreferenceSubscreenScriptsIDs.helpGlobal,
		PreferenceScriptHelp === "global" ? "Icons/Question_Yellow.png" : "Icons/Question.png"
	);
	for (const property of PreferenceScriptPermissionProperties) {
		const active = PreferenceScriptHelp === property;
		PreferenceSubscreenScriptsSetHelpIcon(
			PreferenceSubscreenScriptsIDs.scriptsHelpButtonId(property),
			active ? "Icons/Question_Yellow.png" : "Icons/Question.png"
		);
	}
}

/**
 * @param {string} buttonId
 * @param {string} icon
 */
function PreferenceSubscreenScriptsSetHelpIcon(buttonId, icon) {
	ElementWrap(`${buttonId}-image`)?.setAttribute("src", icon);
}

// @ts-strict-ignore
'use strict';

var KeyGUI = {
	/** @type {Keybindings.Keybinding['id'] | null} */
	selectedAction: null,
	/** @type {readonly Set<KeybindingScreen.FilteringMode>} */
	searchingModes: new Set(['keyCombo', 'action', 'category']),
	/** @type {KeybindingScreen.FilteringMode} */
	currentSearchingMode: 'keyCombo',
	/** @type {boolean} */
	showConflictsOnly: false,
	selec: Object.freeze({
		keyId: (/** @type {string} */ id) => `key-id-${id}`,
		keybuttonId: (/** @type {string} */ id) => `key-button-id-${id}`,
		keyNameId: (/** @type {string} */ id) => `key-name-${id}`,
		keyContextsId: (/** @type {string} */ id) => `key-contexts-${id}`,
		keyConflictIndicatorId: (/** @type {string} */ id) => `key-conflict-indicator-${id}`,
		comboResetButtonId: (/** @type {string} */ id) => `key-combo-reset-button-${id}`,
		comboUnbindButtonId: (/** @type {string} */ id) => `key-combo-unbind-button-${id}`,
		categoryId: (/** @type {string} */ id) => `category-${id}`,
		categoryContentId: (/** @type {string} */ id) => `category-content-${id}`,

		categoryClass: 'category',
		categoryNameClass: 'category-name',
		categoryContentClass: 'category-content',

		keybindClass: 'keybinding',
		keybindNameClass: 'keybind-name',
		keybindContextsClass: 'keybind-contexts',
		keybindNavClass: 'keybind-nav',
		navSquareButtonClass: 'keybind-nav-button',
		keybindConflictIndicatorClass: 'keybind-conflict-indicator',
		keybindComboClass: 'keybind-combo',
		keybindResetClass: 'keybind-combo-reset',
		keybindUnbindClass: 'keybind-combo-unbind',

		mainContent: 'keybind-main-content',
		keybindModal: 'keybind-modal',
		keybindModalCancel: 'keybind-modal-cancel',

		keybindManager: 'keybind-manager',
		filtering: 'keybind-filter',
		searchInput: 'keybind-search-input',
		searchInputContainer: 'keybind-search-input-container',
		searchModePair: 'keybind-search-mode-pair',
		searchModeDropdown: 'keybind-search-mode-dropdown',
		sidebar: 'keybind-sidebar',
		helpSheet: 'keybind-help-sheet',
		helpHr: 'keybind-help-hr'
	}),

	/**
	 * @param {Keybindings.Keybinding} keybinding
	 */
	buildKeybinding: function (keybinding) {
		const keyCombo = keybinding.keyCombo;
		const keyString = "key" in keyCombo && keyCombo?.key ? KeybindingManager.ASCIIKeyboardMap[keyCombo?.key] : ("char" in keyCombo ? keyCombo.char : undefined);
		const contextsString = keybinding.contextIds.filter(ctx => KeyManager.getContext(ctx).showInUI).map(ctx => KeyManager.getContextLabel(ctx)).join(', ');
		const contextsTooltipString = keybinding.contextIds.filter(ctx => KeyManager.getContext(ctx).showInUI).map(ctx => `· ${KeyManager.getContextLabel(ctx)}`).join('\\n');
		const keybindElm = document.getElementById(KeyGUI.selec.keyId(keybinding.id));
		const conflicts = KeyManager.getConflictingKeybindings(keybinding.id);
		const conflictNames = conflicts.map(kb => `· ${KeyManager.getCategoryLabel(kb.categoryId)} > ${KeyManager.getKeybindingActionLabel(kb.id)}`).join('\\n');

		/** @type {(string | Node)[]} */
		let keyComboString;
		if (!("key" in keyCombo) && !("char" in keyCombo)) {
			keyComboString = [document.createTextNode(TextGet("KeybindNotBound"))];
		} else if (keyString) {
			const keys = keyCombo.modifiers
				? [...keyCombo.modifiers].flatMap(mod => [ElementCreate({
					tag: "kbd",
					classList: ["keybind-modifier"],
					children: [mod]
				}), document.createTextNode(" + ")])
				: [];

			keys.push(ElementCreate({
				tag: "kbd",
				classList: ["keybind-key"],
				children: [keyString]
			}));
			keyComboString = keys;
		} else {
			keyComboString = [document.createTextNode(TextGet("KeybindError"))];
		}

		keybindElm?.replaceChildren();

		/** @type {readonly (string | Node | HTMLOptionsUnion)[]} */
		const keyContents = [
			{
				tag: 'span',
				attributes: {
					id: KeyGUI.selec.keyNameId(keybinding.id)
				},
				dataAttributes: {
					tooltip: KeyManager.getKeybindingActionLabel(keybinding.id) + '\\hr' + KeyManager.getKeybindingActionDescription(keybinding.id)
				},
				classList: [KeyGUI.selec.keybindNameClass, 'truncated-text'],
				children: [KeyManager.getKeybindingActionLabel(keybinding.id)]
			},
			{
				tag: 'span',
				attributes: {
					id: KeyGUI.selec.keyContextsId(keybinding.id),
					concealed: keybinding.contextIds.length === 0
				},
				dataAttributes: {
					tooltip: TextSubstitute("KeybindContextsValid", {
						$contexts$: contextsTooltipString
					}).join('')
				},
				classList: [KeyGUI.selec.keybindContextsClass, 'truncated-text'],
				children: [contextsString]
			},
			{
				tag: 'div',
				classList: [KeyGUI.selec.keybindNavClass],
				children: [
					{
						tag: 'span',
						attributes: {
							id: KeyGUI.selec.keyConflictIndicatorId(keybinding.id),
						},
						dataAttributes: {
							tooltip: TextSubstitute("KeybindConflictsWith", {
								$conflicts$: conflictNames
							}).join('')
						},
						classList: [KeyGUI.selec.keybindConflictIndicatorClass],
						children: ["❗"]
					},
					ElementButton.Create(
						KeyGUI.selec.keybuttonId(keybinding.id),
						function () {
							KeyGUI.selectedAction = keybinding.id;
							KeyGUI.showModal();
						},
						null,
						{
							button: {
								classList: [KeyGUI.selec.keybindComboClass],
								attributes: {
									disabled: keybinding.readonly
								},
								children: keyComboString
							},
						}
					),
					ElementButton.Create(
						KeyGUI.selec.comboResetButtonId(keybinding.id),
						() => {
							KeyGUI.updateKeybinding(keybinding.id, keybinding.defaultKeyCombo);
						},
						{
							image: 'Icons/Reset.png',
							tooltip: TextGet("KeybindReset"),
						},
						{
							button: {
								classList: [KeyGUI.selec.keybindResetClass, KeyGUI.selec.navSquareButtonClass],
								attributes: {
									disabled: keybinding.readonly || !keybinding.defaultKeyCombo || KeyManager.isDefaultCombo(keybinding)
								}
							}
						}
					),
					ElementButton.Create(
						KeyGUI.selec.comboUnbindButtonId(keybinding.id),
						() => {
							KeyGUI.updateKeybinding(keybinding.id, { key: null });
						},
						{
							image: 'Icons/Trash.png',
							tooltip: TextGet("KeybindUnbind"),
						},
						{
							button: {
								classList: [KeyGUI.selec.keybindUnbindClass, KeyGUI.selec.navSquareButtonClass],
								attributes: {
									disabled: keybinding.readonly || "key" in keyCombo && keyCombo.key === null || "char" in keyCombo && keyCombo.char === null
								}
							}
						}
					)
				]
			}
		];

		const keybind = ElementCreate({
			tag: 'div',
			classList: [KeyGUI.selec.keybindClass],
			attributes: {
				id: KeyGUI.selec.keyId(keybinding.id)
			},
			dataAttributes: {
				conflict: conflicts.length > 0
			},
			children: keyContents
		});
		keybindElm?.toggleAttribute('data-conflict', conflicts.length > 0);

		keybindElm?.append(...keybind.children);

		return keybind;
	},
	/** @param {Keybindings.Category} categoryObject */
	buildCategory(categoryObject) {
		const categoryElm = document.getElementById(KeyGUI.selec.categoryId(categoryObject.id));

		categoryElm?.replaceChildren();

		const allKeybindings = KeyManager.getAllKeybindings()
			.filter(kb => kb.categoryId === categoryObject.id);

		if (allKeybindings.length === 0) {
			return;
		}

		/** @type {readonly (Node)[]} */
		const categoryKeybinds = allKeybindings.map(kb => KeyGUI.buildKeybinding(kb));

		const category = ElementCreate({
			tag: 'fieldset',
			classList: [KeyGUI.selec.categoryClass],
			attributes: {
				id: KeyGUI.selec.categoryId(categoryObject.id)
			},
			children: [
				{
					tag: 'legend',
					classList: [KeyGUI.selec.categoryNameClass],
					children: [
						KeyManager.getCategoryLabel(categoryObject.id)
					],
				},
				{
					tag: 'div',
					classList: [KeyGUI.selec.categoryContentClass],
					children: [
						...categoryKeybinds
					]
				}
			]
		});

		if (categoryElm) {
			categoryElm.append(...category.children);
		}

		return category;
	},
	buildSearchInput() {
		const existing = document.getElementById(KeyGUI.selec.searchInputContainer);

		existing?.replaceChildren();

		const searchInput = ElementCreateSearchInput(
			KeyGUI.selec.searchInput,
			() => {
				switch (KeyGUI.currentSearchingMode) {
					case 'action':
						return [...new Set(KeyManager.getAllKeybindings().map(kb => KeyManager.getKeybindingActionLabel(kb.id)))];
					case 'category':
						return [...new Set(KeyManager.getAllCategories().map(cat => KeyManager.getCategoryLabel(cat.id)))];
					case 'keyCombo':
						return [...new Set(KeyManager.getAllKeybindings().map(kb => {
							const keyCombo = kb.keyCombo;
							const keyString = "key" in keyCombo ? KeybindingManager.ASCIIKeyboardMap[keyCombo.key] : ("char" in keyCombo ? keyCombo.char : undefined);
							const modifiersString = kb.keyCombo?.modifiers ? [...kb.keyCombo.modifiers].join(' + ') : '';

							let keyComboString = TextGet('KeybindNotBound');
							if (modifiersString) keyComboString = `${modifiersString} + ${keyString}`;
							else if (keyString) keyComboString = keyString;

							return keyComboString;
						}))];
				}
			},
			{ placeholder: TextGet("KeybindSearchPlaceholder"), onInput: () => KeyGUI.searchFilteredAll() },
		);

		const searchInputContainer = ElementCreate({
			tag: 'label',
			attributes: {
				id: KeyGUI.selec.searchInputContainer,
			},
			children: [
				{ tag: 'span', children: [TextGet("KeybindFiltering")] },
				searchInput,
			],
		});

		existing?.append(...searchInputContainer.children);

		return searchInputContainer;
	},
	buildSearchModeDropdown() {
		const searchModeDropdown = ElementCreateDropdown(KeyGUI.selec.searchModeDropdown,
			Array.from(this.searchingModes.values()).map(mode => ({ attributes: { value: mode, label: TextGet(`KeybindSearchMode.${mode}`), selected: mode === this.currentSearchingMode } })),
			function () {
				const input = /** @type {HTMLInputElement} */ (ElementWrap(KeyGUI.selec.searchInput));
				input.value = '';
				KeyGUI.searchFilteredAll();
				const value = /** @type {KeybindingScreen.FilteringMode} */ (this.value);
				KeyGUI.currentSearchingMode = value;

				KeyGUI.buildSearchInput();
			}
		);

		const labeled = ElementCreate({
			tag: 'label',
			attributes: {
				id: KeyGUI.selec.searchModePair,
				for: KeyGUI.selec.searchModeDropdown
			},
			children: [
				TextGet("KeybindSearchMode"),
				searchModeDropdown
			]
		});

		return labeled;
	},
	buildFilteringMenu() {

		const searchInput = KeyGUI.buildSearchInput();

		const searchMode = this.buildSearchModeDropdown();

		const showConflictsOnly = ElementCheckbox.CreateLabelled(null, TextGet("KeybindConflictsOnly"), function () {
			KeyGUI.showConflictsOnly = this.checked;
			KeyGUI.searchFilteredAll();
		});

		const filteringMenu = ElementCreate({
			tag: 'section',
			classList: [KeyGUI.selec.filtering],
			attributes: {
				id: KeyGUI.selec.filtering
			},
			children: [
				searchInput,
				searchMode,
				showConflictsOnly
			]
		});

		return filteringMenu;
	},
	buildHelpSheet() {
		return ElementCreate({
			tag: 'section',
			attributes: {
				id: KeyGUI.selec.helpSheet,
				hidden: true
			},
			children: [
			]
		});
	},
	/** @param {string} content */
	changeHelpSheet(content) {
		const helpSheet = ElementWrap(KeyGUI.selec.helpSheet);
		if (!helpSheet) return;

		if (content.length === 0) {
			helpSheet.replaceChildren();
			helpSheet.toggleAttribute('hidden', true);
		} else {
			const constituted = CommonStringPartitionReplace(content, {
				'\\n': ElementCreate({ tag: 'br' }),
				'\\hr': ElementCreate({ tag: 'hr', classList: [KeyGUI.selec.helpHr] })
			});

			helpSheet?.replaceChildren(...constituted);
			helpSheet.toggleAttribute('hidden', false);
		}
	},
	buildSubscreen() {
		const categories = KeyManager.getAllCategories()
			.map((category) => KeyGUI.buildCategory(category));

		ElementCreate({
			tag: 'div',
			attributes: {
				id: KeyGUI.selec.mainContent
			},
			children: [
				{
					tag: 'div',
					attributes: {
						id: KeyGUI.selec.keybindManager
					},
					classList: ['scroll-box'],
					children: [
						...categories
					],
					eventListeners: {
						mouseover: function (ev) {
							const targetElements = [
								KeyGUI.selec.keybindNameClass,
								KeyGUI.selec.keybindContextsClass,
								KeyGUI.selec.keybindConflictIndicatorClass
							];

							const target = /** @type {HTMLElement} */ (ev.target);
							if (targetElements.some(cls => target.classList.contains(cls) && target.dataset.tooltip && !target.hasAttribute("hidden"))) {
								const tooltip = target.dataset.tooltip;
								KeyGUI.changeHelpSheet(tooltip);
							}
						},
						mouseout: function () {
							KeyGUI.changeHelpSheet('');
						}
					}
				},
				{
					tag: 'aside',
					attributes: {
						id: KeyGUI.selec.sidebar
					},
					children: [
						KeyGUI.buildFilteringMenu(),
						KeyGUI.buildHelpSheet()
					]
				}
			],
			parent: document.getElementById('preference-subscreen-main')
		});
	},

	searchFilteredAll() {
		const text = /** @type {HTMLInputElement} */ (ElementWrap(KeyGUI.selec.searchInput)).value.toLowerCase();
		const mode = KeyGUI.currentSearchingMode;

		/** @type {Record<KeybindingScreen.FilteringMode, string>} */
		const selectors = {
			action: `.${KeyGUI.selec.keybindNameClass}`,
			category: `.${KeyGUI.selec.categoryNameClass}`,
			keyCombo: `.${KeyGUI.selec.keybindComboClass}`
		};

		/** @type {Record<KeybindingScreen.FilteringMode, string>} */
		const closestParent = {
			action: `.${KeyGUI.selec.keybindClass}`,
			category: `.${KeyGUI.selec.categoryClass}`,
			keyCombo: `.${KeyGUI.selec.keybindClass}`
		};

		if (selectors[mode]) {
			const allElements = document.querySelectorAll(selectors[mode]);
			const parentSelector = closestParent[mode];

			for (const el of allElements) {
				const parent = el.closest(parentSelector);
				if (!parent) continue;

				const matchesText = el.textContent.toLowerCase().includes(text);
				const hasConflict = parent.hasAttribute('data-conflict');

				const shouldHide =
					(!matchesText && text.length > 0) ||
					(KeyGUI.showConflictsOnly && !hasConflict);

				parent.toggleAttribute('hidden', shouldHide);
			}
		}

		// hide categories if all their keybinds are hidden
		if (mode === 'keyCombo' || mode === 'action') {
			document.querySelectorAll(`.${KeyGUI.selec.categoryClass}`).forEach(cat => {
				const keybinds = cat.querySelectorAll(`.${KeyGUI.selec.keybindClass}`);
				const allHidden = [...keybinds].every(k => k.hasAttribute('hidden'));
				cat.toggleAttribute('hidden', allHidden);
			});
		}
	},

	/**
	 * Updates a keybinding's combination and updates all conflicting keybindings if any
	 * @param {string} targetActionId
	 * @param {Keybindings.KeyCombo} keyCombo
	 */
	updateKeybinding(targetActionId, keyCombo) {
		const conflictingBefore = KeyManager.getConflictingKeybindings(targetActionId);

		KeyManager.updateKeybinding(targetActionId, keyCombo);
		KeyManager.serialize();

		const updatedKeybind = KeyManager.getKeybinding(targetActionId);
		const conflictingAfter = KeyManager.getConflictingKeybindings(targetActionId);

		const allConflicts = new Set([...conflictingBefore, ...conflictingAfter]);

		if (allConflicts.size > 0) {
			allConflicts.forEach(kb => {
				KeyGUI.buildKeybinding(kb);
			});
		}

		KeyGUI.buildKeybinding(updatedKeybind);
	},

	showModal() {
		document.querySelectorAll(`#${KeyGUI.selec.keybindModal}`).forEach(m => m.remove());

		const keybindingName = KeyManager.getKeybindingActionLabel(KeyManager.getKeybinding(KeyGUI.selectedAction).id);
		const modal = ElementCreate({
			tag: 'dialog',
			attributes: {
				id: KeyGUI.selec.keybindModal,
				closedby: 'none'
			},
			children: [
				TextSubstitute("KeybindWaitingForInput", {
					$action$: keybindingName
				}).join(''),
				ElementButton.Create(
					KeyGUI.selec.keybindModalCancel,
					() => {
						modal.close();
						modal.remove();
						KeyGUI.selectedAction = null;
					},
					{
						label: InterfaceTextGet("Cancel")
					}
				)
			],
			eventListeners: {
				keyup: e => {
					if (PreferenceSubscreenKeybindingsKeyUp(e)) {
						modal.close();
						modal.remove();
					}
				},
			},
			parent: document.body
		});
		ElementSetFontSize(modal, 28);

		modal.showModal();
		modal.focus();
	}
};

function PreferenceSubscreenKeybindingsLoad() {
	KeyGUI.buildSubscreen();
}

function PreferenceSubscreenKeybindingsRun() {
}

function PreferenceSubscreenKeybindingsResize() {
	ElementPositionFixed(KeyGUI.selec.mainContent, 100, 175, 1800, 775);
	const modal = ElementWrap(KeyGUI.selec.keybindModal);
	if (modal) ElementSetFontSize(modal, 28);
}

function PreferenceSubscreenKeybindingsClick() {
}

function PreferenceSubscreenKeybindingsExit() {
	KeyManager.serialize();
	ServerSend('AccountUpdate', { KeybindingSettings: Player.KeybindingSettings });
	ElementRemove(KeyGUI.selec.mainContent);
	KeyGUI.selectedAction = null;

	return true;
}

/**
 * Handles keypresses in the keybindings subscreen, updates keybindings,
 * changes respecting element text and serializes changes.
 * @param {KeyboardEvent} e
 * @returns {boolean}
 */
function PreferenceSubscreenKeybindingsKeyUp(e) {
	if (KeyGUI.selectedAction === null) return false;
	e.preventDefault();
	e.stopImmediatePropagation();

	// Stop handling if the key is not allowed to be bound
	if (e.code in KeybindingManager.ASCIIKeyboardMap === false) return false;

	if (CommonKey.IsPressed(e, 'Escape', 0)) {
		KeyGUI.selectedAction = null;
		return true;
	}

	const modifiers = KeyManager.getModifiers(e);
	const normalizedKey = e.key.length === 1 ? e.key.toUpperCase() : e.key;

	/** @type {Keybindings.KeyCombo} */
	const keyCombo = { char: normalizedKey, modifiers: modifiers };

	KeyGUI.updateKeybinding(KeyGUI.selectedAction, keyCombo);

	KeyGUI.selectedAction = null;

	return true;
}

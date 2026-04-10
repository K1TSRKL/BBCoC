// @ts-strict-ignore
'use strict';

var KeybindingDefaults = {
	/**
	 * Default keybinding categories for organizing commands.
	 *
	 * @type {readonly Keybindings.Category[]}
	 */
	DefaultCategories: [
		{
			id: "chat"
		},
		{
			id: "maproom"
		},
		{
			id: "chatroom"
		},
		{
			id: "navigation"
		},
	],

	/**
	 * Default contexts where keybindings may be active.
	 * Each context has a prerequisite function to check if it should apply.
	 *
	 * @type {readonly Keybindings.Context[]}
	 */
	DefaultContexts: [
		{
			id: 'always',
			prerequisite: () =>
				(document.activeElement === null
					|| document.activeElement === document.body
					|| document.activeElement.id === "MainCanvas"
					|| document.activeElement instanceof HTMLDialogElement)
				&& document.activeElement.id !== "InputChat"
		},
		{
			id: 'isInChatRoom',
			prerequisite: () => ServerPlayerIsInChatRoom(),
			showInUI: true
		},
		{
			id: 'isOnChatRoomScreen',
			prerequisite: () => ServerPlayerIsInChatRoom() && CurrentScreen === "ChatRoom" && CurrentCharacter === null,
			showInUI: true
		},
		{
			id: 'isChatRoomCharacterMode',
			prerequisite: () => ServerPlayerIsInChatRoom() && ChatRoomIsViewActive("Character"),
			showInUI: true
		},
		{
			id: 'isChatRoomMapMode',
			prerequisite: () => ServerPlayerIsInChatRoom() && ChatRoomIsViewActive("Map"),
			showInUI: true
		},
		{
			id: 'isChatRoomChatFocused',
			prerequisite: () => document.activeElement === ElementWrap('InputChat'),
			showInUI: true
		},
		{
			id: 'isChatRoomChatNOTFocused',
			prerequisite: () => document.activeElement !== ElementWrap('InputChat'),
			showInUI: true
		},
		{
			id: 'noModifiers',
			prerequisite: (event) => !CommonKey.GetModifiers(event),
			showInUI: false
		}
	],

	/**
	 * Built-in default keybindings initialized at startup.
	 * Each binding specifies an action, its assigned keys, category, and contexts.
	 *
	 * @type {readonly Keybindings.Keybinding[]}
	 */
	DefaultKeybindings: [
		// #region Navigation
		{
			id: 'navigation_home',
			action: CommonNoop,
			contextIds: [],
			keyCombo: {
				key: 'Home',
			},
			readonly: true,
			categoryId: 'navigation',
		},
		{
			id: 'navigation_end',
			action: CommonNoop,
			contextIds: [],
			keyCombo: {
				key: 'End',
			},
			readonly: true,
			categoryId: 'navigation',
		},
		{
			id: 'navigation_pageup',
			action: CommonNoop,
			contextIds: [],
			keyCombo: {
				key: 'PageUp',
			},
			readonly: true,
			categoryId: 'navigation',
		},
		{
			id: 'navigation_pagedown',
			action: CommonNoop,
			contextIds: [],
			keyCombo: {
				key: 'PageDown',
			},
			readonly: true,
			categoryId: 'navigation',
		},
		{
			id: 'navigation_arrowup',
			action: CommonNoop,
			contextIds: [],
			keyCombo: {
				key: 'ArrowUp',
			},
			readonly: true,
			categoryId: 'navigation',
		},
		{
			id: 'navigation_arrowdown',
			action: CommonNoop,
			contextIds: [],
			keyCombo: {
				key: 'ArrowDown',
			},
			readonly: true,
			categoryId: 'navigation',
		},
		// #endregion Navigation
		// #region Map Chatroom
		{
			id: 'maproom_arrowup',
			action: () => false,
			contextIds: ["isOnChatRoomScreen", "isChatRoomChatNOTFocused", "isChatRoomMapMode"],
			keyCombo: {
				key: 'ArrowUp',
			},
			readonly: true,
			categoryId: 'maproom',
		},
		{
			id: 'maproom_W',
			action: () => false,
			contextIds: ["isOnChatRoomScreen", "isChatRoomChatNOTFocused", "isChatRoomMapMode"],
			keyCombo: {
				key: 'KeyW',
			},
			readonly: true,
			categoryId: 'maproom',
		},
		{
			id: 'maproom_arrowdown',
			action: () => false,
			contextIds: ["isOnChatRoomScreen", "isChatRoomChatNOTFocused", "isChatRoomMapMode"],
			keyCombo: {
				key: 'ArrowDown',
			},
			readonly: true,
			categoryId: 'maproom',
		},
		{
			id: 'maproom_S',
			action: () => false,
			contextIds: ["isOnChatRoomScreen", "isChatRoomChatNOTFocused", "isChatRoomMapMode"],
			keyCombo: {
				key: 'KeyS',
			},
			readonly: true,
			categoryId: 'maproom',
		},
		{
			id: 'maproom_arrowleft',
			action: () => false,
			contextIds: ["isOnChatRoomScreen", "isChatRoomChatNOTFocused", "isChatRoomMapMode"],
			keyCombo: {
				key: 'ArrowLeft',
			},
			readonly: true,
			categoryId: 'maproom',
		},
		{
			id: 'maproom_A',
			action: () => false,
			contextIds: ["isOnChatRoomScreen", "isChatRoomChatNOTFocused", "isChatRoomMapMode"],
			keyCombo: {
				key: 'KeyA',
			},
			readonly: true,
			categoryId: 'maproom',
		},
		{
			id: 'maproom_arrowright',
			action: () => false,
			contextIds: ["isOnChatRoomScreen", "isChatRoomChatNOTFocused", "isChatRoomMapMode"],
			keyCombo: {
				key: 'ArrowRight',
			},
			readonly: true,
			categoryId: 'maproom',
		},
		{
			id: 'maproom_D',
			action: () => false,
			contextIds: ["isOnChatRoomScreen", "isChatRoomChatNOTFocused", "isChatRoomMapMode"],
			keyCombo: {
				key: 'KeyD',
			},
			readonly: true,
			categoryId: 'maproom',
		},
		{
			id: 'map_zoom_out',
			action: () => {
				if (ChatRoomMapViewPerceptionRange < ChatRoomMapViewPerceptionRangeMax) ChatRoomMapViewPerceptionRange++;
				return true;
			},
			contextIds: ["isOnChatRoomScreen", "isChatRoomChatNOTFocused", "isChatRoomMapMode"],
			keyCombo: {
				key: "Slash",
			},
			readonly: true,
			categoryId: 'maproom',
		},
		{
			id: 'map_zoom_in',
			action: () => {
				if (ChatRoomMapViewPerceptionRange > ChatRoomMapViewPerceptionRangeMin) ChatRoomMapViewPerceptionRange--;
				return true;
			},
			contextIds: ["isOnChatRoomScreen", "isChatRoomChatNOTFocused", "isChatRoomMapMode"],
			keyCombo: {
				key: "Equal",
			},
			readonly: true,
			categoryId: 'maproom',
		},
		{
			id: 'map_focus_chat',
			action: () => {
				ElementFocus("InputChat");
				return true;
			},
			contextIds: ["isOnChatRoomScreen", "isChatRoomChatNOTFocused", "isChatRoomMapMode"],
			keyCombo: {
				key: "Enter",
			},
			readonly: true,
			categoryId: 'maproom',
		},
		{
			id: 'map_admin_undo',
			action: () => {
				if (ChatRoomPlayerIsAdmin()) ChatRoomMapViewUndo();
				return true;
			},
			contextIds: ["isOnChatRoomScreen", "isChatRoomChatNOTFocused", "isChatRoomMapMode"],
			keyCombo: {
				char: "z",
				modifiers: new Set(["Ctrl"]),
			},
			readonly: true,
			categoryId: 'maproom',
		},
		// #endregion Map ChatRoom
		// #region Chat
		{
			id: 'chat_autocomplete',
			action: () => {
				const inputChat = /** @type {HTMLTextAreaElement} */ (ElementWrap('InputChat'));
				if (inputChat?.value.length !== 0) {
					return CommandAutoComplete(inputChat.value);
				}

				return false;
			},
			contextIds: ['isInChatRoom', 'isChatRoomChatFocused', 'noModifiers'],
			categoryId: 'chat',
			readonly: true,
			defaultKeyCombo: {
				key: 'Tab',
			}
		},
		{
			id: 'chat_send_chat',
			action: (event) => {
				if (event.isComposing) return false;
				event.preventDefault();
				ChatRoomSendChat();
				return true;
			},
			contextIds: ['isInChatRoom', 'isChatRoomChatFocused'],
			categoryId: 'chat',
			readonly: false,
			defaultKeyCombo: {
				key: 'Enter',
			}
		},
		{
			id: 'chat_send_ooc_chat',
			action: (event) => {
				if (event.isComposing) return false;
				const inputChat = /** @type {HTMLInputElement} */ (ElementWrap("InputChat"));
				let text = inputChat?.value;
				if (!text) return true;
				inputChat.value = `(${text}`;
				ChatRoomSendChat();
				return true;
			},
			categoryId: 'chat',
			contextIds: ['isInChatRoom', 'isChatRoomChatFocused'],
			readonly: false,
			defaultKeyCombo: {
				key: 'Enter',
				modifiers: new Set(['Ctrl']),
			}
		},
		{
			id: 'chat_history_prev',
			action: () => {
				ChatRoomScrollHistory(true);
				return true;
			},
			contextIds: ['isInChatRoom', 'isChatRoomChatFocused', 'noModifiers'],
			categoryId: 'chat',
			readonly: true,
			defaultKeyCombo: {
				key: 'PageUp',
			}
		},
		{
			id: 'chat_history_next',
			action: () => {
				ChatRoomScrollHistory(false);
				return true;
			},
			contextIds: ['isInChatRoom', 'isChatRoomChatFocused', 'noModifiers'],
			categoryId: 'chat',
			readonly: true,
			defaultKeyCombo: {
				key: 'PageDown',
			}
		},
		{
			id: 'chat_focus_change',
			action: () => {
				if (
					document.activeElement.id === "MainCanvas" ||
					document.activeElement === null ||
					document.activeElement === document.body
				) {
					ElementScrollToEnd("TextAreaChatLog");
					ElementFocus("InputChat");

					return true;
				}

				return false;
			},
			contextIds: ['isOnChatRoomScreen', 'noModifiers'],
			categoryId: 'chat',
			readonly: true,
			defaultKeyCombo: {
				key: 'Escape',
			}
		},
		// #endregion Chat
		// #region ChatRoom
		{
			id: 'chatroom_leave',
			action: () => {
				ChatRoomAttemptLeave();
				return true;
			},
			contextIds: ['isInChatRoom'],
			categoryId: 'chatroom',
			readonly: false,
			defaultKeyCombo: {
				key: 'Escape',
				modifiers: new Set(['Shift'])
			}
		},
		{
			id: 'chatroom_toggle_kneel',
			action: (event) => {
				if (!event.repeat) {
					ChatRoomToggleKneel();
					return true;
				}

				return false;
			},
			contextIds: ['isInChatRoom'],
			categoryId: 'chatroom',
			readonly: false,
			defaultKeyCombo: {
				key: 'KeyK',
				modifiers: new Set(['Alt'])
			}
		},
		{
			id: 'chatroom_open_profile',
			action: () => {
				if (CurrentCharacter) { DialogLeave({ reload: false }); }
				ChatRoomOpenInformationScreen();

				return true;
			},
			contextIds: ['isInChatRoom'],
			categoryId: 'chatroom',
			readonly: false,
			defaultKeyCombo: {
				key: 'KeyI',
				modifiers: new Set(['Alt'])
			}
		},

		{
			id: "chatroom_prev_page",
			action: () => {
				if (ChatRoomCharacterViewIsActive() && ChatRoomCharacterViewCharacterCountTotal > 10) {
					ChatRoomCharacterViewOffset = 0;
					ChatRoomUpdateDisplay();
					return true;
				} else {
					return false;
				}
			},
			contextIds: ["isInChatRoom"],
			categoryId: "chatroom",
			readonly: false,
			defaultKeyCombo: {
				key: "Digit1",
				modifiers: new Set(["Alt"]),
			},
		},

		{
			id: "chatroom_next_page",
			action: () => {
				if (ChatRoomCharacterViewIsActive() && ChatRoomCharacterViewCharacterCountTotal > 10) {
					ChatRoomCharacterViewOffset = 10;
					ChatRoomUpdateDisplay();
					return true;
				} else {
					return false;
				}
			},
			contextIds: ["isInChatRoom"],
			categoryId: "chatroom",
			readonly: false,
			defaultKeyCombo: {
				key: "Digit2",
				modifiers: new Set(["Alt"]),
			},
		},

		{
			id: 'chatroom_open_wardrobe',
			action: () => {
				if (CurrentCharacter) { DialogLeave({ reload: false }); }
				ChatRoomOpenWardrobeScreen();

				return true;
			},
			contextIds: ['isInChatRoom'],
			categoryId: 'chatroom',
			readonly: false,
			defaultKeyCombo: {
				key: 'KeyB',
				modifiers: new Set(['Alt'])
			}
		},
		{
			id: 'chatroom_open_admin_screen',
			action: () => {
				if (CurrentCharacter) { DialogLeave({ reload: false }); }
				ChatRoomOpenAdminScreen();

				return true;
			},
			contextIds: ['isInChatRoom'],
			categoryId: 'chatroom',
			readonly: false,
			defaultKeyCombo: {
				key: 'KeyH',
				modifiers: new Set(['Alt'])
			}
		},
		// #endregion ChatRoom
	],
};

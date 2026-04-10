// @ts-strict-ignore
"use strict";
//#region VARIABLES
var FriendListBackground = "BrickWall";
/** @type {number[]} */
var FriendListConfirmDelete = [];
/** @type {FriendListReturn<any> | null} */
var FriendListReturn = null;
/** @type {FriendListModes} */
var FriendListMode = ["OnlineFriends", "Beeps", "AllFriends"];
var FriendListModeIndex = 0;
/** @type {IFriendListBeepLogMessage[]} */
var FriendListBeepLog = [];
/** @type {number} MemberNumber of the player to send beep to */
let FriendListBeepTarget = -1;
var FriendListBeepShowRoom = true;
/** @type {FriendListSortingMode} */
let FriendListSortingMode = 'None';
/** @type {FriendListSortingDirection} */
let FriendListSortingDirection = 'Asc';

const FriendListAutoRefresh = {
	interval: 30_000,
	nextRefresh: 0,
};

const FriendListIDs = Object.freeze({
	root: 'friend-list-subscreen',
	navBar: 'friend-list-nav-bar',
	header: 'friend-list-header',
	friendList: 'friend-list',
	friendListTable: 'friend-list-table',

	navButtons: 'friend-list-buttons',
	modeTitle: 'friend-list-mode-title',
	searchInput: 'friend-list-search-input',

	btnAutoRefresh: 'friend-list-button-auto-refresh',
	btnRefresh: 'friend-list-button-refresh',
	btnPrev: 'friend-list-button-prev',
	btnNext: 'friend-list-button-next',
	btnExit: 'friend-list-button-exit',

	btnResetSorting: 'friend-list-reset-sorting',

	beepList: 'friend-list-beep-dialog',
	beepTextArea: 'friend-list-beep-textarea',
	beepFooter: 'friend-list-beep-footer',
});
//#endregion

//#region SCREEN FUNCTIONS
/** @type {ScreenLoadHandler} */
async function FriendListLoad() {
	const mode = FriendListMode[FriendListModeIndex];

	FriendListConfirmDelete = [];

	const root = document.getElementById(FriendListIDs.root) ?? ElementCreate({
		tag: 'div',
		attributes: {
			id: FriendListIDs.root,
			'screen-generated': 'FriendList',
			"aria-busy": "true",
		},
		classList: ['HideOnPopup'],
		dataAttributes: {
			mode: mode
		},
		parent: document.body,
	});

	TextScreenCache?.loadedPromise.then(async () => {
		root.replaceChildren(
			ElementCreate({
				tag: "div",
				attributes: {
					id: FriendListIDs.navBar
				},
				children: [
					{
						tag: "span",
						attributes: {
							id: FriendListIDs.modeTitle,
						},
						children: [
							TextGet(mode),
						]
					},
					{
						tag: 'input',
						attributes: {
							id: FriendListIDs.searchInput,
							type: 'search',
							maxLength: 100,
						},
						eventListeners: {
							/**
							* @this {HTMLInputElement}
							*/
							input: function() {
								FriendListSearchByProperties(this.value);
							},
						},
					},
					ElementMenu.Create(FriendListIDs.navButtons, [
						ElementButton.Create(
							FriendListIDs.btnAutoRefresh,
							FriendListToggleAutoRefresh,
							{
								tooltip: TextGet("AutoRefresh"),
								role: "checkbox",
							},
							{
								button: {
									classList: ['friend-list-button'],
									attributes: { "aria-checked": Player.OnlineSettings.FriendListAutoRefresh.toString() },
								}
							}
						),
						ElementButton.Create(
							FriendListIDs.btnRefresh,
							() => {
								ServerSend("AccountQuery", { Query: "OnlineFriends" });
							},
							{
								tooltip: TextGet("Refresh"),
							},
							{
								button: {
									classList: ['friend-list-button'],
								}
							}
						),
						ElementButton.Create(
							FriendListIDs.btnPrev,
							() => {
								FriendListChangeMode(FriendListModeIndex - 1);
							},
							{
								tooltip: TextGet("PrevMode"),
							},
							{
								button: {
									classList: ['friend-list-button'],
								}
							}
						),
						ElementButton.Create(
							FriendListIDs.btnNext,
							() => {
								FriendListChangeMode(FriendListModeIndex + 1);
							},
							{
								tooltip: TextGet("NextMode"),
							},
							{
								button: {
									classList: ['friend-list-button'],
								}
							}
						),
						ElementButton.Create(
							FriendListIDs.btnExit,
							() => {
								FriendListExit();
							},
							{
								tooltip: TextGet("Exit"),
							},
							{
								button: {
									classList: ['friend-list-button'],
								}
							}
						)
					])
				]
			}),
			ElementCreate({
				tag: "hr",
				attributes: {
					id: 'friend-list-nav-hr'
				}
			}),
			ElementButton.Create(
				FriendListIDs.btnResetSorting,
				() => {
					FriendListChangeSortingMode('None');
				},
				{
					tooltip: TextGet("ResetSorting"),
					tooltipPosition: 'right'
				},
				{
					button: {
						classList: ['friend-list-button'],
					}
				}
			),
			ElementCreate({
				tag: 'table',
				attributes: {
					id: FriendListIDs.friendListTable,
					"aria-labelledby": FriendListIDs.modeTitle,
				},
				children: [
					{
						tag: 'thead',
						attributes: {
							id: FriendListIDs.header
						},
						children: [
							{
								tag: "tr",
								classList: ["friend-list-row"],
								children: [
									ElementButton.Create(
										"friend-list-member-name",
										() => FriendListChangeSortingMode("MemberName"),
										{ noStyling: true },
										{ button: {
											classList: ['friend-list-column', 'friend-list-link'],
											attributes: { role: "columnheader" },
										}},
									),
									ElementButton.Create(
										"friend-list-member-number",
										() => FriendListChangeSortingMode("MemberNumber"),
										{ noStyling: true },
										{ button: {
											classList: ['friend-list-column', 'friend-list-link'],
											attributes: { role: "columnheader" },
										}},
									),
									ElementButton.Create(
										"friend-list-chat-room-type",
										() => FriendListChangeSortingMode("ChatRoomType"),
										{ noStyling: true },
										{ button: {
											classList: ['friend-list-column', 'friend-list-link', 'mode-specific-content', 'fl-online-friends-content', 'fl-beeps-content'],
											attributes: { role: "columnheader" },
										}},
									),
									ElementButton.Create(
										"friend-list-chat-room-name",
										() => FriendListChangeSortingMode("ChatRoomName"),
										{ noStyling: true },
										{ button: {
											classList: ['friend-list-column', 'friend-list-link', 'mode-specific-content', 'fl-online-friends-content', 'fl-beeps-content'],
											attributes: { role: "columnheader" },
										}},
									),
									ElementButton.Create(
										"friend-list-relation-type",
										() => FriendListChangeSortingMode("RelationType"),
										{ noStyling: true },
										{ button: {
											classList: ['friend-list-column', 'friend-list-link', 'mode-specific-content', 'fl-all-friends-content'],
											attributes: { role: "columnheader" },
										}},
									),
									{
										tag: "th",
										classList: ['friend-list-column', 'mode-specific-content', 'fl-online-friends-content'],
										attributes: { scope: "col" },
										children: [TextGet("ActionFriends")],
									},
									{
										tag: "th",
										classList: ['friend-list-column', 'mode-specific-content', 'fl-beeps-content'],
										attributes: { scope: "col" },
										children: [TextGet("ActionRead")],
									},
									{
										tag: "th",
										classList: ['friend-list-column', 'mode-specific-content', 'fl-all-friends-content'],
										attributes: { scope: "col" },
										children: [TextGet("ActionDelete")],
									},
								],
							},
						]
					},
					{
						tag: 'hr',
						attributes: {
							id: 'friend-list-header-hr'
						}
					},
					{
						tag: 'tbody',
						classList: ["scroll-box"],
						attributes: {
							id: FriendListIDs.friendList
						},
					}
				]
			}),
		);

		root.setAttribute("aria-busy", "false");
		ServerSend("AccountQuery", { Query: "OnlineFriends" });
	});

	FriendListSortingMode = 'None';
	FriendListSortingDirection = 'Asc';
}

/** @type {ScreenResizeHandler} */
function FriendListResize() {
	ElementPositionFix(FriendListIDs.root, 36, 0, 0, 2000, 1000);
	if (FriendListBeepTarget !== -1) {
		ElementPositionFix(FriendListIDs.beepList, 36, 250, 150, 1500, 800);
	}
}

/** @type {ScreenRunHandler} */
function FriendListRun() {
}

/** @type {ScreenDrawHandler} */
function FriendListDraw() {
	if (Player.OnlineSettings.FriendListAutoRefresh && CommonTime() >= FriendListAutoRefresh.nextRefresh && ServerIsConnected) {
		FriendListAutoRefresh.nextRefresh = CommonTime() + FriendListAutoRefresh.interval;
		ServerSend("AccountQuery", { Query: "OnlineFriends" });
	}
}

/** @type {MouseEventListener} */
function FriendListClick() {
}

/** @type {KeyboardEventListener} */
function FriendListKeyDown(event) {
	const beepTextArea = /** @type {HTMLTextAreaElement} */(document.getElementById(FriendListIDs.beepTextArea));
	const beepTextAreaHasFocus = beepTextArea && document.activeElement === beepTextArea;

	if (FriendListBeepTarget !== -1 || beepTextArea) {
		if (CommonKey.IsPressed(event, "Escape")) {
			FriendListBeepMenuClose();
			return true;
		}
	}
	if (beepTextAreaHasFocus) {
		if (event.key === 'Enter' && CommonKey.IsPressed(event, "Enter", CommonKey.CTRL)) {
			FriendListBeepMenuSend();
			return true;
		}
	}

	return false;
}

/** @type {ScreenUnloadHandler} */
function FriendListUnload() {
}

/** @type {ScreenExitHandler} */
function FriendListExit() {
	const beepMenu = document.getElementById(FriendListIDs.beepList);
	if (beepMenu) {
		FriendListBeepMenuClose();
		return;
	}
	ElementRemove(FriendListIDs.root);
	if (FriendListReturn != null && FriendListReturn.Screen != "FriendList") {
		if (FriendListReturn?.Screen === "ChatRoom" && FriendListReturn?.hasScrolledChat) {
			ElementScrollToEnd("TextAreaChatLog");
		}
		ElementToggleGeneratedElements(FriendListReturn.Screen, true);
		CommonSetScreen(FriendListReturn.Module, FriendListReturn.Screen);
	} else CommonSetScreen("Character", "InformationSheet");
	FriendListReturn = null;
	FriendListModeIndex = 0;
}
//#endregion

//#region BEEP
/**
 * Creates beep message menu
 * @param {number} MemberNumber Member number of target player
 * @param {IFriendListBeepLogMessage|null} data Beep data of received beep
 */
function FriendListBeep(MemberNumber, data = null) {
	if (FriendListBeepTarget === -1) {
		ElementCreateDiv(FriendListIDs.beepList);
	}
	const FriendListBeepElement = document.getElementById(FriendListIDs.beepList);
	const beepTitle = data === null ? 'Send Beep' : data.Sent ? 'Sent Beep' : 'Received Beep';
	const userName = Player.FriendNames.get(MemberNumber) ?? data?.MemberName;
	const userCaption = `${userName} [${MemberNumber}]`;
	const beepDialog = ElementCreate({
		tag: 'div',
		attributes: {
			id: FriendListIDs.beepList,
			'screen-generated': 'FriendList'
		},
		classList: ['HideOnPopup'],
		dataAttributes: {
			'received': data !== null
		},
		children: [
			{
				tag: 'span',
				children: [
					beepTitle,
				]
			},
			{
				tag: 'span',
				children: [
					userCaption,
				]
			},
			{
				tag: 'textarea',
				attributes: {
					id: FriendListIDs.beepTextArea,
					maxlength: 1000,
					readonly: data !== null,
				},
			},
			{
				tag: 'div',
				attributes: {
					id: FriendListIDs.beepFooter
				},
				children: [
					{
						tag: 'button',
						classList: ['blank-button', 'friend-list-link'],
						children: [
							'Close'
						],
						eventListeners: {
							click: () => FriendListBeepMenuClose()
						}
					},
					{
						tag: 'button',
						classList: ['blank-button', 'friend-list-link', 'mode-specific-content', 'fl-beep-sent-content'],
						attributes: {
							disabled: !ServerPlayerIsInChatRoom(),
						},
						children: [
							FriendListBeepShowRoom && ServerPlayerIsInChatRoom() ? TextGet('ToggleRoomOn') : TextGet('ToggleRoomOff')
						],
						eventListeners: {
							click: function()  {
								FriendListBeepShowRoom = !FriendListBeepShowRoom;
								this.textContent = FriendListBeepShowRoom ? TextGet('ToggleRoomOn') : TextGet('ToggleRoomOff');
							}
						}
					},
					{
						tag: 'button',
						classList: ['blank-button', 'friend-list-link', 'mode-specific-content', 'fl-beep-sent-content'],
						children: [
							'Send'
						],
						eventListeners: {
							click: () => FriendListBeepMenuSend()
						}
					},
					{
						tag: 'button',
						classList: ['blank-button', 'friend-list-link', 'mode-specific-content', 'fl-beep-received-content'],
						children: [
							'Reply'
						],
						eventListeners: {
							click: () => FriendListBeep(data?.MemberNumber)
						}
					}
				]
			}
		]
	});

	FriendListBeepElement.replaceWith(beepDialog);


	const textArea = /** @type {HTMLTextAreaElement} */ (document.getElementById(FriendListIDs.beepTextArea));
	if (textArea) {
		textArea.value = data?.Message ?? '';
		textArea.focus();
	}

	FriendListBeepTarget = MemberNumber;
	FriendListResize(true);
}

/**
 * Closes the beep menu
 */
function FriendListBeepMenuClose() {
	ElementRemove(FriendListIDs.beepList);
	FriendListBeepTarget = -1;
	FriendListBeepShowRoom = true;
}

/**
 * Sends the beep and message on send click
 */
function FriendListBeepMenuSend() {
	if (FriendListBeepTarget === -1) return;

	const textarea = /** @type {HTMLTextAreaElement} */ (document.getElementById(FriendListIDs.beepTextArea));
	if (textarea) {
		const msg = textarea.value;
		ServerSendBeepMessage(FriendListBeepTarget, msg, { includeRoom: FriendListBeepShowRoom });
	}
	FriendListBeepMenuClose();
}

/**
 * Opens the friendlist from any screen
 */
async function FriendListShow() {
	if (CurrentScreen === 'FriendList') return;
	DialogLeave({ reload: false });
	ElementToggleGeneratedElements(CurrentScreen, false);
	FriendListReturn = {
		Screen: CurrentScreen,
		Module: CurrentModule,
		IsInChatRoom: ServerPlayerIsInChatRoom(),
		hasScrolledChat: ServerPlayerIsInChatRoom() && ElementIsScrolledToEnd("TextAreaChatLog")
	};
	await CommonSetScreen("Character", "FriendList");
}

/**
 * Shows the wanted beep on click from beep list
 * @param {number} i index of the beep
 */
async function FriendListShowBeep(i) {
	const beep = FriendListBeepLog[i];
	if (!beep) return;
	FriendListModeIndex = 1;
	await FriendListShow();
	FriendListBeep(beep.MemberNumber, beep);
}
//#endregion

//#region FRIEND LIST
/**
 * Exits the friendlist
 * @param {string} room The room to search for
 */
async function FriendListChatSearch(room) {
	if (FriendListReturn?.Screen !== "ChatSearch") return;
	FriendListExit();
	await CommonWaitFor(() => !ScreenIsLoading);
	// Change the text box so the player still cant read it
	ElementValue("InputSearch", ChatSearchMuffle(room));
	ChatSearchQuery(room);
}

/** @satisfies {{ [key in (ServerChatRoomSpace | "Private")]: FriendListIcon }} */
const FriendListIconMapping = {
	"": { src: "./Icons/FemaleInvert.png", tooltipKey: "TypeFemale", sortKey: "F " },
	M: { src: "./Icons/MaleInvert.png", tooltipKey: "TypeMale", sortKey: "M " },
	X: { src: "./Icons/GenderInvert.png", tooltipKey: "TypeMixed", sortKey: "X" },
	Asylum: { src: "./Icons/Asylum.png", tooltipKey: "TypeAsylum", sortKey: "A " },
	Private: { src: "./Icons/PrivateInvert.png", tooltipKey: "TypePrivate", sortKey: "P" },
};

/**
 * Loads the friend list data into the HTML div element.
 * @param {ServerFriendInfo[]} data - An array of data, we receive from the server
 *
 * `data.MemberName` - The name of the player
 *
 * `data.MemberNumber` - The ID of the player
 *
 * `data.ChatRoomName` - The name of the ChatRoom
 *
 * `data.ChatRoomSpace` - The space, where this room was created.
 *
 * `data.Type` - The relationship that exists between the player and the friend of the list.
 * @returns {void} - Nothing
 */
function FriendListLoadFriendList(data) {
	if (!document.getElementById(FriendListIDs.friendList)) return;

	// Loads the header caption
	const BeepCaption = InterfaceTextGet("Beep");
	const DeleteCaption = InterfaceTextGet("Delete");
	const ConfirmDeleteCaption = InterfaceTextGet("ConfirmDelete");
	const SentCaption = InterfaceTextGet("SentBeep");
	const ReceivedCaption = InterfaceTextGet("ReceivedBeep");
	const MailCaption = InterfaceTextGet("BeepWithMail");
	const FriendTypeCaption = {
		Owner: TextGet("TypeOwner"),
		Lover: TextGet("TypeLover"),
		Submissive: TextGet("TypeSubmissive"),
		Friend: TextGet("TypeFriend")
	};
	const relationTypeIcons = {
		Owner: './Icons/Small/Owner.png',
		Lover: './Icons/Small/Lover.png',
		Submissive: './Icons/Small/Family.png',
		Friend: './Icons/Small/FriendList.png'
	};
	const sortingSymbol = FriendListSortingDirection === "Asc" ? "↑" : "↓";
	const friendListScrollPercent = ElementGetScrollPercentage(FriendListIDs.friendList) || 0;
	const friendList = document.getElementById(FriendListIDs.friendList);
	friendList.innerHTML = "";

	const FriendListContent = [];

	const mode = FriendListMode[FriendListModeIndex];

	let infoChanged = false;
	data.forEach(friend => {
		if (!Player.FriendNames.has(friend.MemberNumber)) {
			Player.FriendNames.set(friend.MemberNumber, friend.MemberName);
			infoChanged = true;
		}
		if (Player.SubmissivesList.has(friend.MemberNumber) != (friend.Type == "Submissive")) {
			if (friend.Type == "Submissive") {
				Player.SubmissivesList.add(friend.MemberNumber);
			} else {
				Player.SubmissivesList.delete(friend.MemberNumber);
			}
			infoChanged = true;
		}
	});
	if (infoChanged) ServerPlayerRelationsSync();

	/** @satisfies {Record<string, FriendListSortingMode>} */
	const columnHeaders = {
		"friend-list-member-name": "MemberName",
		"friend-list-member-number": "MemberNumber",
		"friend-list-chat-room-name": "ChatRoomName",
		"friend-list-chat-room-type": "ChatRoomType",
		"friend-list-relation-type": "RelationType",
	};
	CommonEntries(columnHeaders).forEach(([id, modeName]) => {
		const elem = document.getElementById(id);
		const elemSortingSymbol = FriendListSortingMode === modeName ? sortingSymbol : "↕";
		elem.textContent = `${TextGet(modeName)} ${elemSortingSymbol}`;
		switch (elemSortingSymbol) {
			case "↑":
				elem.setAttribute("aria-sort", "ascending");
				break;
			case "↓":
				elem.setAttribute("aria-sort", "descending");
				break;
			default:
				elem.setAttribute("aria-sort", "none");
		}
	});

	/** @type {FriendRawData[]} */
	const friendRawData = [];

	if (mode === "OnlineFriends") {
		// In Friend List mode, we show the friend list and allow doing beeps
		for (const friend of data) {
			const originalChatRoomName = friend.ChatRoomName || '';
			const chatRoomSpaceCaption = InterfaceTextGet(`ChatRoomSpace${friend.ChatRoomSpace || "F"}`);
			const chatRoomName = ChatSearchMuffle(friend.ChatRoomName?.replaceAll('<', '&lt;').replaceAll('>', '&gt;') || undefined);
			const canSearchRoom = FriendListReturn?.Screen === 'ChatSearch' && ChatSearchGetSpace() === (friend.ChatRoomSpace || '');
			const canBeep = true;

			friendRawData.push({
				memberName: friend.MemberName,
				memberNumber: friend.MemberNumber,
				chatRoom: {
					name: originalChatRoomName,
					caption: chatRoomName || "-",
					canSearchRoom: canSearchRoom,
					types: [
						chatRoomSpaceCaption && chatRoomName ? FriendListIconMapping[friend.ChatRoomSpace ?? ""] : null,
						friend.Private ? FriendListIconMapping.Private : null,
					],
				},
				beep: {
					canBeep: canBeep,
					caption: BeepCaption
				}
			});
		}
	} else if (mode === "Beeps") {
		// In Beeps mode, we show all the beeps sent and received
		for (let i = FriendListBeepLog.length - 1; i >= 0; i--) {
			const beepData = FriendListBeepLog[i];
			const chatRoomSpaceCaption = InterfaceTextGet(`ChatRoomSpace${beepData.ChatRoomSpace || "F"}`);
			const chatRoomName = ChatSearchMuffle(beepData.ChatRoomName?.replaceAll('<', '&lt;').replaceAll('>', '&gt;') || undefined);
			let beepCaption = '';
			const canSearchRoom = FriendListReturn?.Screen === 'ChatSearch' && ChatSearchGetSpace() === (beepData.ChatRoomSpace || '');

			const rawBeepCaption = [];
			if (beepData.Sent) {
				rawBeepCaption.push(SentCaption);
			} else {
				rawBeepCaption.push(ReceivedCaption);
			}
			rawBeepCaption.push(TimerHourToString(beepData.Time));
			if (beepData.Message) {
				rawBeepCaption.push(MailCaption);
			}

			beepCaption = rawBeepCaption.join(' ');

			friendRawData.push({
				memberName: beepData.MemberName,
				memberNumber: beepData.MemberNumber,
				chatRoom: {
					name: beepData.ChatRoomName,
					caption: chatRoomName || "-",
					canSearchRoom: canSearchRoom,
					types: [
						chatRoomSpaceCaption && chatRoomName ? FriendListIconMapping[beepData.ChatRoomSpace ?? ""] : null,
						beepData.Private ? FriendListIconMapping.Private : null,
					],
				},
				beep: {
					beepIndex: i,
					hasMessage: !!beepData.Message,
					caption: beepCaption
				}
			});
		}
		if (document.hasFocus()) NotificationReset(NotificationEventType.BEEP);
	} else if (mode === "AllFriends") {
		// In Delete mode, we show the friend list and allow the user to remove them
		for (const [memberNumber, memberName] of Array.from(Player.FriendNames).sort((a, b) => a[1].localeCompare(b[1]))) {
			let Type = "Friend";
			if (Player.IsOwnedByMemberNumber(memberNumber)) {
				Type = "Owner";
			} else if (Player.IsLoverOfMemberNumber(memberNumber)) {
				Type = "Lover";
			} else if (Player.SubmissivesList.has(memberNumber)) {
				Type = "Submissive";
			}
			const canDelete = Type === "Friend" && Player.HasOnFriendlist(memberNumber) || Type === "Submissive" && Player.SubmissivesList.has(memberNumber);

			friendRawData.push({
				memberName: memberName,
				memberNumber: memberNumber,
				relationType: FriendTypeCaption[Type],
				canDelete: canDelete
			});
		}
	}

	friendRawData.forEach(friend => {
		const row = ElementCreate({
			tag: "tr",
			classList: ['friend-list-row'],
			children: [
				{
					tag: "td",
					classList: ['friend-list-column', 'MemberName'],
					children: [
						friend.memberName
					],
				},
				{
					tag: "td",
					classList: ['friend-list-column', 'MemberNumber'],
					children: [
						friend.memberNumber.toString()
					],
				},
			]
		});

		if (friend.chatRoom) {
			if (!friend.chatRoom.name || !friend.chatRoom.canSearchRoom) {
				// Sorting is performed via each cell's `textContent`,
				// so explicitly prepend an invisible node with some sorting key
				let totalSortKey = "";
				const imgContainer = ElementCreate({
					tag: "td",
					classList: ['friend-list-column', 'ChatRoomType'],
					children: [
						{ tag: "span", attributes: { hidden: true }, classList: ["friend-list-sorting-node"] },
						...friend.chatRoom.types.map((iconType) => {
							if (iconType != null) {
								const { src, tooltipKey, sortKey } = iconType;
								totalSortKey += sortKey;
								return {
									tag: /** @type {const} */("div"),
									classList: ["friend-list-icon-container"],
									children: [
										{
											tag: /** @type {const} */("img"),
											attributes: { src, decoding: "async", loading: "lazy", alt: TextGet(tooltipKey) },
											classList: ["friend-list-icon"],
										},
										{
											tag: /** @type {const} */("div"),
											attributes: { role: "tooltip", "aria-hidden": "true" },
											children: [TextGet(tooltipKey)],
											classList: ["button-tooltip", "button-tooltip-right"],
										},
									],
								};
							} else {
								// A hidden padding DIV
								totalSortKey += " ";
								return {
									tag: /** @type {const} */("div"),
									classList: ["friend-list-icon-container"],
									attributes: { "aria-hidden": "true" },
									children: ["-"],
								};
							}
						}),
					],
				});
				imgContainer.children[0].textContent = totalSortKey + " ";
				if (imgContainer.children.length === 1) {
					imgContainer.append("-");
				}
				row.append(
					imgContainer,
					ElementCreate({
						tag: "td",
						classList: ['friend-list-column', 'ChatRoomName'],
						children: [friend.chatRoom.caption],
						style: { "user-select": friend.chatRoom.caption === "-" ? "none" : undefined },
					}),
				);
			} else if (friend.chatRoom.canSearchRoom) {
				// Sorting is performed via each cell's `textContent`,
				// so explicitly prepend an invisible node with some sorting key
				let totalSortKey = "";
				const imgContainer = ElementCreate({
					tag: "td",
					classList: ['friend-list-column', 'ChatRoomType'],
					children: [
						{ tag: "span", attributes: { hidden: true }, classList: ["friend-list-sorting-node"] },
						...friend.chatRoom.types.map((iconType) => {
							if (iconType) {
								const { src, tooltipKey, sortKey } = iconType;
								totalSortKey += sortKey;
								return {
									tag: /** @type {const} */("div"),
									classList: ["friend-list-icon-container"],
									children: [
										{
											tag: /** @type {const} */("img"),
											attributes: { src, decoding: "async", loading: "lazy", alt: TextGet(tooltipKey) },
											classList: ["friend-list-icon"],
										},
										{
											tag: /** @type {const} */("div"),
											attributes: { role: "tooltip", "aria-hidden": "true" },
											children: [TextGet(tooltipKey)],
											classList: ["button-tooltip", "button-tooltip-right"],
										},
									],
								};
							} else {
								// A hidden padding DIV
								totalSortKey += " ";
								return {
									tag: /** @type {const} */("div"),
									classList: ["friend-list-icon-container"],
									attributes: { "aria-hidden": "true" },
									children: ["-"],
								};
							}
						}),
					],
				});
				imgContainer.children[0].textContent = totalSortKey + " ";
				if (imgContainer.children.length === 1) {
					imgContainer.append("-");
				}
				row.append(
					imgContainer,
					ElementCreate({
						tag: "td",
						classList: ['friend-list-column', 'friend-list-link', 'blank-button', 'ChatRoomName'],
						innerHTML: friend.chatRoom.caption,
						style: { "user-select": friend.chatRoom.caption === "-" ? "none" : undefined },
						eventListeners: {
							click: () => FriendListChatSearch(friend.chatRoom.name),
						},
					}),
				);
			}
		}

		if (friend.beep) {
			if (friend.beep.canBeep || friend.beep.hasMessage) {
				row.append(
					ElementButton.Create(
						`friend-list-beep-${friend.memberNumber}`,
						() => FriendListBeep(friend.memberNumber),
						{ noStyling: true },
						{ button: {
							classList: ['friend-list-column', 'friend-list-link', 'mode-specific-content', 'fl-online-friends-content'],
							children: [friend.beep.caption],
							attributes: { role: "cell" },
						}},
					),
					ElementButton.Create(
						`friend-list-show-beep-${friend.memberNumber}`,
						() => FriendListShowBeep(friend.beep.beepIndex),
						{ noStyling: true },
						{ button: {
							classList: ['friend-list-column', 'friend-list-link', 'mode-specific-content', 'fl-beeps-content'],
							children: [friend.beep.caption],
							attributes: { role: "cell" },
						}},
					),
				);
			} else {
				row.appendChild(ElementCreate({
					tag: "td",
					classList: ['friend-list-column'],
					children: [
						friend.beep.caption
					],
				}));
			}
		}

		if (friend.relationType) {
			row.appendChild(ElementCreate({
				tag: "td",
				classList: ['friend-list-column', 'RelationType', 'mode-specific-content', 'fl-all-friends-content'],
				children: [
					{
						tag: "img",
						attributes: {
							src: relationTypeIcons[friend.relationType],
							decoding: "async",
							loading: "lazy",
							"aria-hidden": "true",
						},
						classList: ["friend-list-icon-small"],
					},
					FriendTypeCaption[friend.relationType]
				],
			}));
		}

		row.appendChild(ElementButton.Create(
			`friend-list-delete-${friend.memberNumber}`,
			() => FriendListDelete(friend.memberNumber),
			{ noStyling: true },
			{ button: {
				classList: ['friend-list-column', 'friend-list-link', 'mode-specific-content', 'fl-all-friends-content'],
				children: [FriendListConfirmDelete.includes(friend.memberNumber) ? ConfirmDeleteCaption : DeleteCaption],
				attributes: { disabled: !friend.canDelete, role: "cell" },
			}}
		));

		FriendListContent.push(row);

	});

	// Loads the friend list and sorts it with current settings
	friendList.append(...FriendListContent);
	FriendListSort(FriendListSortingMode, FriendListSortingDirection);
	FriendListSearchByProperties(/** @type {HTMLInputElement} */ (document.getElementById(FriendListIDs.searchInput))?.value);
	ElementSetScrollPercentage(FriendListIDs.friendList, friendListScrollPercent, 'instant');
}

/**
 * When the user wants to delete someone from her friend list this must be confirmed.
 * This function either displays the confirm message or deletes the friend from the player's friendlist
 * @param {number} MemberNumber - The member to delete from the friendlist
 * @returns {void} - Nothing
 */
function FriendListDelete(MemberNumber) {
	if (FriendListConfirmDelete.includes(MemberNumber)) {
		FriendListConfirmDelete.splice(FriendListConfirmDelete.indexOf(MemberNumber), 1);
		if (Player.HasOnFriendlist(MemberNumber)) {
			Player.FriendList.splice(Player.FriendList.indexOf(MemberNumber), 1);
		}
		Player.SubmissivesList.delete(MemberNumber);
		ServerPlayerRelationsSync();
	} else FriendListConfirmDelete.push(MemberNumber);
	ServerSend("AccountQuery", { Query: "OnlineFriends" });
}

/**
 * Handles mode changes for friend list
 * @param {number} modeIndex - mode to change to
 */
function FriendListChangeMode(modeIndex) {
	FriendListModeIndex = modeIndex;
	if (FriendListModeIndex < 0) FriendListModeIndex = FriendListMode.length - 1;
	else if (FriendListModeIndex >= FriendListMode.length) FriendListModeIndex = 0;
	FriendListSortingMode = 'None';
	FriendListSortingDirection = 'Asc';
	document.getElementById(FriendListIDs.root).dataset.mode = FriendListMode[FriendListModeIndex];
	document.getElementById(FriendListIDs.modeTitle).textContent = TextGet(FriendListMode[FriendListModeIndex]);
	ServerSend("AccountQuery", { Query: "OnlineFriends" });
}

/**
 * Sorts the friend list depending on the sorting mode
 * and the sorting direction. If the sorting mode is none nothing is done.
 * @param {FriendListSortingMode} sortingMode
 * @param {FriendListSortingDirection} sortingDirection
 */
function FriendListSort(sortingMode, sortingDirection) {
	if (sortingMode === 'None') return;
	const friendlist = document.getElementById(FriendListIDs.friendList);
	if (!friendlist) return;

	const items = friendlist.children;
	const sortedItems = Array.from(items).sort((elmA, elmB) => {
		const contentA = elmA.querySelector(`.${sortingMode}`)?.textContent;
		const contentB = elmB.querySelector(`.${sortingMode}`)?.textContent;
		const numberA = Number.parseInt(contentA, 10);
		const numberB = Number.parseInt(contentB, 10);
		if (!isNaN(numberA) && !isNaN(numberB)) {
			return sortingDirection === 'Asc' ? numberA - numberB : numberB - numberA;
		} else {
			return sortingDirection === 'Asc' ?
        contentA.localeCompare(contentB) :
        contentB.localeCompare(contentA);
		}
	});
	friendlist.replaceChildren(...sortedItems);
}

/**
 * Sorts the friend list by properties based on the search input.
 * Searched properties: Name, Nickname (NYI) and MemberNumber
 * @param {string} text
 */
function FriendListSearchByProperties(text) {
	const friendlist = document.getElementById(FriendListIDs.friendList);
	if (!friendlist) return;

	const items = friendlist.children;
	Array.from(items).forEach((element) => element.toggleAttribute("hidden", true));
	const searchedItems = Array.from(items).filter(item => {
		return item.querySelector('.MemberName')?.textContent.toLowerCase().includes(text.toLowerCase()) ||
			item.querySelector('.MemberNickname')?.textContent.toLowerCase().includes(text.toLowerCase()) || // NYI
			item.querySelector('.MemberNumber')?.textContent.includes(text);
	});
	searchedItems.forEach((item) => {
		item.toggleAttribute("hidden", false);

		const nameItem = item.querySelector('.MemberName');
		if (nameItem) nameItem.innerHTML = FriendListHighlightProperty(nameItem, text);
		const nicknameItem = item.querySelector('.MemberNickname');
		if (nicknameItem) nicknameItem.innerHTML = FriendListHighlightProperty(nicknameItem, text);
		const numberItem = item.querySelector('.MemberNumber');
		if (numberItem) numberItem.innerHTML = FriendListHighlightProperty(numberItem, text);
	});
}

/**
 * Highlights the searched text in the innerHTML
 * @param {Element} element
 * @param {string} text
 * @returns {string} - The innerHTML with the searched text highlighted
 */
function FriendListHighlightProperty(element, text) {
	const textContent = element.textContent;
	if (!text) return textContent;
	const regex = new RegExp(text.toLowerCase(), 'gi');

	return `<span>${textContent.replace(regex, match => `<b class="highlight">${match}</b>`)}</span>`;
}

/**
 * Handles changes of the sorting mode
 * @param {FriendListSortingMode} sortingMode
 */
function FriendListChangeSortingMode(sortingMode) {
	if (sortingMode === 'None') {
		FriendListSortingMode = 'None';
		FriendListSortingDirection = 'Asc';
	} else if (sortingMode !== FriendListSortingMode) {
		FriendListSortingMode = sortingMode;
		FriendListSortingDirection = 'Asc';
	} else {
		FriendListSortingDirection = FriendListSortingDirection === 'Asc' ? 'Desc' : 'Asc';
	}

	ServerSend("AccountQuery", { Query: "OnlineFriends" });
}

/**
 * @this {HTMLButtonElement}
 */
function FriendListToggleAutoRefresh() {
	Player.OnlineSettings.FriendListAutoRefresh = this.getAttribute("aria-checked") === "true";
	ServerAccountUpdate.QueueData({ OnlineSettings: Player.OnlineSettings });
}
//#endregion

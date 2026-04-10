// @ts-strict-ignore
"use strict";

/**
 * An enum for the options for chat room spaces
 * @satisfies {Record<ChatRoomSpaceLabel, ServerChatRoomSpace>}
 */
const ChatRoomSpaceType = /** @type {const} */({
	MIXED: "X",
	FEMALE_ONLY: "",
	MALE_ONLY: "M",
	ASYLUM: "Asylum",
});
/** @type {Record<ChatRoomVisibilityModeLabel, ServerChatRoomRole[]>} */
const ChatRoomVisibilityMode = {
	PUBLIC: ["All"],
	ADMIN_WHITELIST: ["Admin", "Whitelist"],
	ADMIN: ["Admin"],
	UNLISTED: [],
};
/** @type {Record<ChatRoomAccessModeLabel, ServerChatRoomRole[]>} */
const ChatRoomAccessMode = {
	PUBLIC: ["All"],
	ADMIN_WHITELIST: ["Admin", "Whitelist"],
	ADMIN: ["Admin"],
};

var ChatRoomBackground = "";
/**
 * The data for the current chatroom, as recieved from the server.
 * @type {null | ServerChatRoomData}
 */
let ChatRoomData = null;
/**
 * The list of chatroom characters.
 * This is unpacked characters from the data recieved from the server in {@link ChatRoomData.Character}.
 * @type {Character[]}
 */
var ChatRoomCharacter = [];
var ChatRoomJustEntered = false;
/** @type {ChatRoomChatLogEntry[]} */
var ChatRoomChatLog = [];
var ChatRoomLastMessage = [""];
var ChatRoomLastMessageIndex = 0;
/** @type {number} */
var ChatRoomTargetMemberNumber = -1;
/** @type {ChatRoomOwnershipEvent | null} */
var ChatRoomOwnershipOption = null;
/** @type {ChatRoomLovershipEvent | null} */
var ChatRoomLovershipOption = null;
var ChatRoomMoneyForOwner = 0;
/** @type {number[]} */
var ChatRoomQuestGiven = [];
/**
 * @deprecated Use {@link ChatSearchGetSpace()}
 * @todo Remove after R121
 * @type {ServerChatRoomSpace}
 */
var ChatRoomSpace = ChatRoomSpaceType.MIXED;
/**
 * @deprecated Use {@link ChatRoomGetGame()}
 * @todo Remove after R121
 * @type {ServerChatRoomGame}
 */
var ChatRoomGame;
var ChatRoomHelpSeen = false;
var ChatRoomAllowCharacterUpdate = true;
var ChatRoomStruggleAssistBonus = 0;
var ChatRoomStruggleAssistTimer = 0;
/** @type {StruggleOnlineData} */
var ChatRoomStruggleData = null;
/**
 * The timer started when a slowed player attempts to leave
 * @type {number}
 */
var ChatRoomSlowtimer = 0;
/**
 * Whether someone attempted to stop the player in the middle of a slow-leave
 * @type {boolean}
 */
var ChatRoomSlowStop = false;

/**
 * Default position of the entire chat panel
 * @type {RectTuple}
 */
var ChatRoomDivRect = [1005, 62, 988, 938];

/**
 * The last approximate height (_i.e._ {@link HTMLElement.clientHeight} as opposed to {@link DOMRect.height}) of the `InputChat` element.
 * @type {number}
 */
let ChatRoomDivInputPrevHeight = NaN;

var ChatRoomChatHidden = false;
/**
 * The chatroom characters that were drawn in the last frame.
 * Used for limiting the "fov". Characters come from {@link ChatRoomCharacter}
 * @type {Character[]}
 */
var ChatRoomCharacterDrawlist = [];
/**
 * If non-empty, ChatRoomCharacterDrawlist will be filtered (after immersion removals) to only include the player and these character(s).
 * Used for the /focus command. List will be automatically removed if characters are removed from the room.
 * @type {Character[]}
 */
var ChatRoomDrawFocusList = [];
/**
 * The list of characters currently impacted (not drawn) by sensory deprivation in the chat room
 * Used as a check for whether to apply further sense dep effects to a given character (i.e. name removal, message, hiding, etc). Characters from {@link ChatRoomCharacter}
 * @type {Character[]}
 */
var ChatRoomImpactedBySenseDep = [];
var ChatRoomSenseDepBypass = false;
var ChatRoomGetUpTimer = 0;
/**
 * The complete data to update a recreated room with once the creation is successful
 * @type {ChatRoomSettings}
 * */
var ChatRoomNewRoomToUpdate = null;
var ChatRoomNewRoomToUpdateTimer = 0;
/**
 * The list of MemberNumbers whose characters we're holding the leash of
 * @type {number[]}
 */
var ChatRoomLeashList = [];
/**
 * The MemberNumber of the character holding our leash
 * @type {number|null}
 */
var ChatRoomLeashPlayer = null;
/**
 * The room name to join when being leashed
 * @type {string}
 */
var ChatRoomJoinLeash = "";
var ChatRoomCustomized = false;
var ChatRoomCustomBackground = "";
var ChatRoomCustomFilter = "";
var ChatRoomCustomSizeMode = null;

/**
 * The list of chat room views
 * @type {Record<"Character"|"Map", ChatRoomView>}
 */
var ChatRoomViews = {
	Character: {
		Run: ChatRoomCharacterViewRun,
		Draw: ChatRoomCharacterViewDraw,
		DrawUi: ChatRoomCharacterViewDrawUi,
		Click: ChatRoomCharacterViewClick,
		KeyDown: ChatRoomCharacterViewKeyDown,
		CanLeave: ChatRoomCharacterViewCanLeave,
		Screenshot: ChatRoomCharacterViewScreenshot
	},
	Map: {
		Activate: ChatRoomMapViewActivate,
		Deactivate: ChatRoomMapViewDeactivate,
		Run: ChatRoomMapViewRun,
		Draw: ChatRoomMapViewDraw,
		DrawUi: ChatRoomMapViewDrawUi,
		Click: ChatRoomMapViewClick,
		MouseDown: ChatRoomMapViewMouseDown,
		MouseUp: ChatRoomMapViewMouseUp,
		MouseMove: ChatRoomMapViewMouseMove,
		MouseWheel: ChatRoomMapViewMouseWheel,
		KeyDown: ChatRoomMapViewKeyDown,
		KeyUp: ChatRoomMapViewKeyUp,
		SyncRoomProperties: ChatRoomMapViewSyncRoomProperties,
		CanStartWhisper: ChatRoomMapViewCanStartWhisper,
		CanLeave: ChatRoomMapViewCanLeave,
		Screenshot: ChatRoomMapViewScreenshot
	}
};
/**
 * The active chat room view
 * @type {ChatRoomView}
 */
var ChatRoomActiveView = ChatRoomViews[ChatRoomCharacterViewName];

/**
 * Chances of a chat message popping up reminding you of some stimulation.
 *
 * @type {Record<StimulationAction, StimulationEvent>}
 */
const ChatRoomStimulationEvents = {
	Kneel: {
		Chance: 0.1,
		ArousalScaling: 0.8,
		VibeScaling: 0.0,
		InflationScaling: 0.1,
	},
	Walk: {
		Chance: 0.33,
		ArousalScaling: 0.67,
		VibeScaling: 0.8,
		InflationScaling: 0.5,
	},
	Struggle: {
		Chance: 0.05,
		ArousalScaling: 0.2,
		VibeScaling: 0.3,
		InflationScaling: 0.2,
	},
	StruggleFail: {
		Chance: 0.4,
		ArousalScaling: 0.4,
		VibeScaling: 0.3,
		InflationScaling: 0.4,
	},
	Talk: {
		Chance: 0,
		TalkChance: 0.3,
		ArousalScaling: 0.22,
	},
};

const ChatRoomArousalMsg_Chance = {
	"Kneel" : 0.1,
	"Walk" : 0.33,
	"StruggleFail" : 0.4,
	"StruggleAction" : 0.05,
	"Gag" : 0,
};
const ChatRoomArousalMsg_ChanceScaling = {
	"Kneel" : 0.8,
	"Walk" : 0.67,
	"StruggleFail" : 0.4,
	"StruggleAction" : 0.2,
	"Gag" : 0,
};
const ChatRoomArousalMsg_ChanceVibeMod = {
	"Kneel" : 0.0,
	"Walk" : 0.8,
	"StruggleFail" : 0.6,
	"StruggleAction" : 0.3,
	"Gag" : 0,
};
const ChatRoomArousalMsg_ChanceInflationMod = {
	"Kneel" : 0.1,
	"Walk" : 0.5,
	"StruggleFail" : 0.4,
	"StruggleAction" : 0.2,
	"Gag" : 0,
};
const ChatRoomArousalMsg_ChanceGagMod = {
	"Kneel" : 0,
	"Walk" : 0,
	"StruggleFail" : 0,
	"StruggleAction" : 0,
	"Gag" : 0.3,
};

var ChatRoomHideIconState = 0;
/**
 * The list of buttons in the top-right
 * @type {ChatRoomMenuButton[]}
 * */
var ChatRoomMenuButtons = [];
let ChatRoomFontSize = 30;
const ChatRoomFontSizes = {
	Small: 28,
	Medium: 36,
	Large: 44,
};

/** Sets whether an add/remove for one list automatically triggers an add/remove for another list */
const ChatRoomListOperationTriggers = () => [
	{
		list: Player.WhiteList, adding: true, triggers: [
			{ list: Player.BlackList, add: false },
			{ list: Player.GhostList, add: false }
		]
	},
	{
		list: Player.BlackList, adding: true, triggers: [
			{ list: Player.WhiteList, add: false }
		]
	},
	{
		list: Player.GhostList, adding: true, triggers: [
			{ list: Player.WhiteList, add: false },
			{ list: Player.BlackList, add: true }
		]
	},
	{
		list: Player.GhostList, adding: false, triggers: [
			{ list: Player.BlackList, add: false }
		]
	}
];

/**
 * Chat room resize manager object: Handles resize events for the chat log.
 * @constant
 * The chat room resize manager object. Contains the functions and properties required to handle
 *     resize events.
 */
let ChatRoomResizeManager = {
	atStart: true, // Is this the first event in a chain of resize events?
	/** @type {null | number} */
	timer: null, // Timer that triggers the end function after no resize events have been received recently.
	timeOut: 200, // The amount of milliseconds that has to pass before the chain of resize events is considered over and the timer is called.
	ChatRoomScrollPercentage: 0, // Height of the chat log scroll bar before the first resize event occurs, as a percentage.
	ChatLogScrolledToEnd: false, // Is the chat log scrolled all the way to the end before the first resize event occurs?

	// Triggered by resize event
	ChatRoomResizeEvent : function() {
		if (document.getElementById("TextAreaChatLog")?.hasAttribute("hidden")) {
			return;
		}
		if(ChatRoomResizeManager.atStart) { // Run code for the first resize event in a chain of resize events.
			ChatRoomResizeManager.ChatRoomScrollPercentage = ElementGetScrollPercentage("TextAreaChatLog");
			ChatRoomResizeManager.ChatLogScrolledToEnd = ElementIsScrolledToEnd("TextAreaChatLog");
			ChatRoomResizeManager.atStart = false;
		}

		// Reset timer if an event was received recently.
		if (ChatRoomResizeManager.timer) clearTimeout(ChatRoomResizeManager.timer);
		ChatRoomResizeManager.timer = setTimeout(ChatRoomResizeManager.ChatRoomResizeEventsEnd, ChatRoomResizeManager.timeOut);
	},

	// Triggered by ChatRoomResizeManager.timer at the end of a chain of resize events
	ChatRoomResizeEventsEnd : function(){
		var TextAreaChatLog = document.getElementById("TextAreaChatLog");

		if (TextAreaChatLog != null) {
			// Scrolls to the position held before the resize events.
			if (ChatRoomResizeManager.ChatLogScrolledToEnd) ElementScrollToEnd("TextAreaChatLog"); // Prevents drift away from the end of the chat log.
			else TextAreaChatLog.scrollTop = (ChatRoomResizeManager.ChatRoomScrollPercentage * TextAreaChatLog.scrollHeight) - TextAreaChatLog.clientHeight;
		}
		ChatRoomResizeManager.atStart = true;
	},
};

/**
 * Activates the chat room view with the passed name
 * @param {string} viewName - The name of the view to activate
 * @returns {void}
 */
function ChatRoomActivateView(viewName)
{
	if(!(viewName in ChatRoomViews)) { throw Error(`Tried to change to not existing view ${viewName}`); }
	if(ChatRoomActiveView.Deactivate) ChatRoomActiveView.Deactivate();
	ChatRoomActiveView = ChatRoomViews[viewName];
	if(ChatRoomActiveView.Activate) ChatRoomActiveView.Activate();
}

/**
 * Indicates if the chat room view with the passed name is active or not
 * @param {keyof typeof ChatRoomViews} viewName - The name of the view to check
 * @returns {boolean} - TRUE if the chat room character view is active, false if not
 */
function ChatRoomIsViewActive(viewName)
{
	if(!(viewName in ChatRoomViews)) { return false; }
	return ChatRoomActiveView === ChatRoomViews[viewName];
}

/**
 * Checks if the player can add the current character to her whitelist.
 * @returns {boolean} - TRUE if the current character is not in the player's whitelist nor blacklist.
 */
function ChatRoomCanAddWhiteList() { return CurrentCharacter && !CurrentCharacter.IsWhitelisted() && !CurrentCharacter.IsBlacklisted(); }
/**
 * Checks if the player can add the current character to her blacklist.
 * @returns {boolean} - TRUE if the current character is not in the player's whitelist nor blacklist.
 */
function ChatRoomCanAddBlackList() { return CurrentCharacter && !CurrentCharacter.IsWhitelisted() && !CurrentCharacter.IsBlacklisted(); }
/**
 * Checks if the player can remove the current character from her whitelist.
 * @returns {boolean} - TRUE if the current character is in the player's whitelist, but not her blacklist.
 */
function ChatRoomCanRemoveWhiteList() { return CurrentCharacter && CurrentCharacter.IsWhitelisted(); }
/**
 * Checks if the player can remove the current character from her blacklist.
 * @returns {boolean} - TRUE if the current character is in the player's blacklist, but not her whitelist.
 */
function ChatRoomCanRemoveBlackList() { return CurrentCharacter && CurrentCharacter.IsBlacklisted(); }
/**
 * Checks if the player can add the current character to her friendlist
 * @returns {boolean} - TRUE if the current character is not in the player's friendlist yet.
 */
function ChatRoomCanAddFriend() { return CurrentCharacter && !CurrentCharacter.IsFriend(); }
/**
 * Checks if the player can remove the current character from her friendlist.
 * @returns {boolean} - TRUE if the current character is in the player's friendlist.
 */
function ChatRoomCanRemoveFriend() { return CurrentCharacter && CurrentCharacter.IsFriend(); }
/**
 * Checks if the player can add the current character to her ghostlist
 * @returns {boolean} - TRUE if the current character is not in the player's ghostlist yet.
 */
function ChatRoomCanAddGhost() { return CurrentCharacter && !CurrentCharacter?.IsGhosted(); }
/**
 * Checks if the player can remove the current character from her ghostlist.
 * @returns {boolean} - TRUE if the current character is in the player's ghostlist.
 */
function ChatRoomCanRemoveGhost() { return CurrentCharacter && CurrentCharacter.IsGhosted(); }
/**
 * Checks if the player can change the current character's clothes
 * @returns {boolean} - TRUE if the player can change the character's clothes and is allowed to.
 */
function DialogCanChangeClothes() {
	return (
		["ChatRoom", "MainHall", "Private", "Photographic"].includes(CurrentScreen)
		&& CurrentCharacter != null
		&& Player.CanChangeClothesOn(CurrentCharacter)
		&& !InventoryIsBlockedByDistance(CurrentCharacter)
	);
}
/**
 * Checks if the specified owner option is available.
 * @param {ChatRoomOwnershipEvent} Option - The option to check for availability
 * @returns {boolean} - TRUE if the current ownership option is the specified one.
 */
function ChatRoomOwnershipOptionIs(Option) { return (Option == ChatRoomOwnershipOption); }
/**
 * Checks if the specified lover option is available.
 * @param {ChatRoomLovershipEvent} Option - The option to check for availability
 * @returns {boolean} - TRUE if the current lover option is the specified one.
 */
function ChatRoomLovershipOptionIs(Option) { return (Option == ChatRoomLovershipOption); }
/**
 * Returns TRUE if the room customization button can be used
 * @returns {boolean} - TRUE if can be used
 */
function ChatRoomCustomizationButton() { return (((ChatRoomData != null) && (ChatRoomData.Custom != null)) && ((Player.OnlineSettings == null) || (Player.OnlineSettings.ShowRoomCustomization == null) || (Player.OnlineSettings.ShowRoomCustomization == 1) || (Player.OnlineSettings.ShowRoomCustomization == 2))); }
/**
 * Checks if the player can take a drink from the current character's tray.
 * @returns {boolean} - TRUE if the current character is wearing a drinks tray and the player can interact.
 */
function ChatRoomCanTakeDrink() { return ((CurrentCharacter != null) && (CurrentCharacter.MemberNumber != null) && !CurrentCharacter.IsPlayer() && Player.CanInteract() && (InventoryGet(CurrentCharacter, "ItemMisc") != null) && (InventoryGet(CurrentCharacter, "ItemMisc").Asset.Name == "WoodenMaidTrayFull")); }
/**
 * Checks if the current character is owned by the player.
 * @returns {boolean} - TRUE if the current character is owned by the player.
 */
function ChatRoomIsCollaredByPlayer() { return (CurrentCharacter != null && CurrentCharacter.IsOwnedByPlayer() && CurrentCharacter.IsFullyOwned()); }
/**
 * Checks if the current character is owned by the player. (Including trial)
 * @returns {boolean} - TRUE if the current character is owned by the player.
 */
function ChatRoomIsOwnedByPlayer() { return (CurrentCharacter != null && CurrentCharacter.IsOwnedByPlayer()); }
/**
 * Checks if the current character is wearing any collar.
 * @returns {boolean} - TRUE if the current character is owned by the player.
 */
function ChatRoomIsWearingCollar() { return CurrentCharacter != null && InventoryGet(CurrentCharacter, "ItemNeck") !== null; }
/**
 * Checks if the current character is lover of the player.
 * @returns {boolean} - TRUE if the current character is lover of the player.
 */
function ChatRoomIsLoverOfPlayer() { return ((CurrentCharacter != null) && CurrentCharacter.GetLoversNumbers().includes(Player.MemberNumber)); }
/**
 * Checks if the current character can serve drinks.
 * @returns {boolean} - TRUE if the character is a maid and is free.
 */
function ChatRoomCanServeDrink() { return ((CurrentCharacter != null) && CurrentCharacter.CanWalk() && (ReputationCharacterGet(CurrentCharacter, "Maid") > 0) && CurrentCharacter.CanTalk()); }
/**
 * Checks if the player can give a money envelope to her owner
 * @returns {boolean} - TRUE if the current character is the owner of the player, and the player has the envelope
 */
function ChatRoomCanGiveMoneyForOwner() { return (CurrentCharacter != null && Player.IsOwnedByCharacter(CurrentCharacter) && Player.IsFullyOwned() && ChatRoomMoneyForOwner > 0); }
/**
 * Checks if a given character is a chatroom admin.
 * @param {Character} C - The character to check
 * @returns {boolean} - TRUE if the character is an admin of the current chatroom.
 */
function ChatRoomCharacterIsAdmin(C) { return ((ChatRoomData != null && ChatRoomData.Admin != null) && (C != null && C.MemberNumber != null) && (ChatRoomData.Admin.indexOf(C.MemberNumber) >= 0)); }
/**
 * Checks if the player is a chatroom admin.
 * @returns {boolean} - TRUE if the player is an admin of the current chatroom.
 */
function ChatRoomPlayerIsAdmin() { return ChatRoomCharacterIsAdmin(Player); }
/**
 * Checks if the current character is an admin of the chatroom.
 * @returns {boolean} - TRUE if the current character is an admin.
 */
function ChatRoomCurrentCharacterIsAdmin() { return ChatRoomCharacterIsAdmin(CurrentCharacter); }
/**
 * Checks if a given character is in the chatroom whitelist.
 * @param {Character} C - The character to check
 * @returns {boolean} - TRUE if the character is in the chatroom whitelist.
 */
function ChatRoomCharacterIsWhitelisted(C) { return ((ChatRoomData != null && ChatRoomData.Whitelist != null) && (C != null && C.MemberNumber != null) && (ChatRoomData.Whitelist.indexOf(C.MemberNumber) >= 0)); }
/**
 * Checks if the player is in the chatroom whitelist.
 * @returns {boolean} - TRUE if the player is in the chatroom whitelist.
 */
function ChatRoomPlayerIsWhitelisted() { return ChatRoomCharacterIsWhitelisted(Player); }
/**
 * Checks if the current character is in the chatroom whitelist.
 * @returns {boolean} - TRUE if the current character is in the chatroom whitelist.
 */
function ChatRoomCurrentCharacterIsWhitelisted() { return ChatRoomCharacterIsWhitelisted(CurrentCharacter); }
/**
 * Checks if the player is currently in focus mode (non-empty {@link ChatRoomDrawFocusList})
 * @returns {boolean} - TRUE if the player is in focus mode
 */
function ChatRoomPlayerIsInDrawFocus() { return ChatRoomDrawFocusList.length > 0; }
/**
 * Checks if the current character is in the player's focuslist (/focus).
 * @returns {boolean} - TRUE if the current character is in the player's focuslist.
 */
function ChatRoomCurrentCharacterInDrawFocusList() { return ((CurrentCharacter != null) && (ChatRoomDrawFocusList.indexOf(CurrentCharacter) >= 0)); }
/**
 * Checks if the room allows the photograph feature to be used.
 * @returns {boolean} - TRUE if the player can take a photo.
 */
function DialogCanTakePhotos() { return (ChatRoomData && ChatRoomData.BlockCategory && !ChatRoomData.BlockCategory.includes("Photos")) || !ChatRoomData; }
/**
 * Checks if the current character has a lucky wheel to spin
 * @returns {boolean} - TRUE if the player can take a photo.
 */
function ChatRoomCanStartWheelFortune() { return (CurrentCharacter != null) && InventoryIsWorn(CurrentCharacter, "ItemDevices", "WheelFortune"); }
/**
 * Starts the current character lucky wheel
 * @returns {void} - Nothing
 */
function ChatRoomStartWheelFortune() {
	if ((CurrentCharacter == null) || !InventoryIsWorn(CurrentCharacter, "ItemDevices", "WheelFortune")) return;
	WheelFortuneReturnScreen = CommonGetScreen();
	WheelFortuneBackground = ChatRoomData.Background;
	WheelFortuneCharacter = CurrentCharacter;
	DialogLeave({ reload: false });
	CommonSetScreen("MiniGame", "WheelFortune");
}
/**
 * If the player is owner and wearing a wheel of fortune, she can force her sub to spin it
 * @returns {boolean} - TRUE if the player can take a photo.
 */
function ChatRoomCanForceWheelFortune() { return (CurrentCharacter != null) && CurrentCharacter.IsOwnedByPlayer() && InventoryIsWorn(Player, "ItemDevices", "WheelFortune"); }

/**
 * Checks if the player can start searching a player
 * @returns {boolean} - Returns TRUE if the player can start searching a player
 */
function ChatRoomCanTakeSuitcase() {
	return ChatRoomCarryingBounty(CurrentCharacter) && !CurrentCharacter.CanInteract();
}
/**
 * Checks if the player can start searching a player
 * @returns {boolean} - Returns TRUE if the player can start searching a player
 */
function ChatRoomCanTakeSuitcaseOpened() {
	return ChatRoomCarryingBountyOpened(CurrentCharacter) && !CurrentCharacter.CanInteract();
}
/**
 * Checks if the player carries a bounty
 * @param {Character} C - The character to search
 * @returns {boolean} - Returns TRUE if the player can start searching a player
 */
function ChatRoomCarryingBounty(C) {
	return (ReputationGet("Kidnap") > 0 && Player.CanInteract() && C.AllowItem != false && InventoryIsWorn(C, "ItemMisc", "BountySuitcase"));
}
/**
 * Checks if the player carries an opened bounty
 * @param {Character} C - The character to search
 * @returns {boolean} - Returns TRUE if the player can start searching a player
 */
function ChatRoomCarryingBountyOpened(C) {
	return (ReputationGet("Kidnap") > 0 && Player.CanInteract() && C.AllowItem != false && InventoryIsWorn(C, "ItemMisc", "BountySuitcaseEmpty"));
}
/**
 * Checks if the player can start searching a player but the player is unbound
 * @returns {boolean} - Returns TRUE if the player can start searching a player
 */
function ChatRoomCantTakeSuitcase() {
	return (Player.CanInteract() && CurrentCharacter.CanInteract() && CurrentCharacter.AllowItem && InventoryIsWorn(CurrentCharacter, "ItemMisc", "BountySuitcase"));
}
/**
 * Checks if the player can start searching a player but the player is unbound
 * @returns {boolean} - Returns TRUE if the player can start searching a player
 */
function ChatRoomCantTakeSuitcaseOpened() {
	return (Player.CanInteract() && CurrentCharacter.CanInteract() && CurrentCharacter.AllowItem && InventoryIsWorn(CurrentCharacter, "ItemMisc", "BountySuitcaseEmpty"));
}
/**
 * Attempts to take the suitcase from the current player
 * @returns {void}
 */
function ChatRoomTryToTakeSuitcase() {
	ServerSend("ChatRoomChat", { Content: "TakeSuitcase", Type: "Hidden", Target: CurrentCharacter.MemberNumber});

	if (KidnapLeagueOnlineBountyTarget == 0) {
		KidnapLeagueOnlineBountyTargetStartedTime = CommonTime();
	}
	KidnapLeagueOnlineBountyTarget = CurrentCharacter.MemberNumber;
	DialogLeave();
}
/**
 * Receives money from the suitcase
 * @returns {void}
 */
function ChatRoomReceiveSuitcaseMoney() {
	let money = Math.max(1, Math.ceil(15 * Math.min(1, Math.max(0, (CommonTime() - KidnapLeagueOnlineBountyTargetStartedTime)/KidnapLeagueSearchFinishDuration))));
	CharacterChangeMoney(Player, money);
	const Dictionary = new DictionaryBuilder()
		.text("MONEYAMOUNT", Math.ceil(money).toString())
		.build();

	ChatRoomMessage({ Content: "OnlineBountySuitcaseFinish", Type: "Action", Dictionary: Dictionary, Sender: Player.MemberNumber });
	KidnapLeagueOnlineBountyTarget = 0;
	KidnapLeagueOnlineBountyTargetStartedTime = 0;
}

/**
 * Checks if the player can give the target character her high security keys.
 * @returns {boolean} - TRUE if the player can interact and is allowed to interact with the current character.
 */
function ChatRoomCanGiveHighSecurityKeys() {
	if (Player.Appearance != null)
		for (let A = 0; A < Player.Appearance.length; A++)
			if (Player.Appearance[A].Asset && Player.Appearance[A].Property && InventoryGetLock(Player.Appearance[A]) && InventoryGetLock(Player.Appearance[A]).Asset.ExclusiveUnlock
			&& (Player.Appearance[A].Property.MemberNumberListKeys)
			&& (Player.Appearance[A].Property.MemberNumberListKeys
			&& CommonConvertStringToArray("" + Player.Appearance[A].Property.MemberNumberListKeys).indexOf(Player.MemberNumber) >= 0
			&& CommonConvertStringToArray("" + Player.Appearance[A].Property.MemberNumberListKeys).indexOf(CurrentCharacter.MemberNumber) < 0)) // Make sure you have a lock they dont have the keys to
				return true;
	return false;
}

/**
 * Checks if the player can give the target character her high security keys, while also removing the ones from her
 * possession
 * @returns {boolean} - TRUE if the player can interact and is allowed to interact with the current character.
 */
function ChatRoomCanGiveHighSecurityKeysAll() {
	if (Player.Appearance != null)
		for (let A = 0; A < Player.Appearance.length; A++)
			if (Player.Appearance[A].Asset && Player.Appearance[A].Property && InventoryGetLock(Player.Appearance[A]) && InventoryGetLock(Player.Appearance[A]).Asset.ExclusiveUnlock
			&& (Player.Appearance[A].Property.MemberNumberListKeys || (!Player.Appearance[A].Property.MemberNumberListKeys && Player.Appearance[A].Property.LockMemberNumber == Player.MemberNumber))
			&& (!Player.Appearance[A].Property.MemberNumberListKeys
			|| (CommonConvertStringToArray("" + Player.Appearance[A].Property.MemberNumberListKeys).indexOf(Player.MemberNumber) >= 0))) // Make sure you have a lock they dont have the keys to
				return true;
	return false;
}

function ChatRoomGiveHighSecurityKeys() {
	var C = Player;
	if (C.Appearance != null)
		for (let A = 0; A < C.Appearance.length; A++)
			if (C.Appearance[A].Asset && C.Appearance[A].Property && InventoryGetLock(Player.Appearance[A]) && InventoryGetLock(Player.Appearance[A]).Asset.ExclusiveUnlock
			&& C.Appearance[A].Property.MemberNumberListKeys
			&& CommonConvertStringToArray("" + C.Appearance[A].Property.MemberNumberListKeys).indexOf(Player.MemberNumber) >= 0
			&& CommonConvertStringToArray("" + C.Appearance[A].Property.MemberNumberListKeys).indexOf(CurrentCharacter.MemberNumber) < 0) // Make sure you have a lock they dont have the keys to
				C.Appearance[A].Property.MemberNumberListKeys = C.Appearance[A].Property.MemberNumberListKeys + "," + CurrentCharacter.MemberNumber;
	CharacterRefresh(Player);
	ChatRoomCharacterUpdate(Player);
}
function ChatRoomGiveHighSecurityKeysAll() {
	var C = Player;
	if (C.Appearance != null)
		for (let A = 0; A < C.Appearance.length; A++)
			if (C.Appearance[A].Asset && C.Appearance[A].Property && InventoryGetLock(Player.Appearance[A]) && InventoryGetLock(Player.Appearance[A]).Asset.ExclusiveUnlock
			&& (C.Appearance[A].Property.MemberNumberListKeys || (!C.Appearance[A].Property.MemberNumberListKeys && C.Appearance[A].Property.LockMemberNumber == Player.MemberNumber))
			&& (!C.Appearance[A].Property.MemberNumberListKeys || (C.Appearance[A].Property.MemberNumberListKeys
			&& CommonConvertStringToArray("" + C.Appearance[A].Property.MemberNumberListKeys).indexOf(Player.MemberNumber) >= 0))) // Make sure you have a lock they dont have the keys to
			{
				if (C.Appearance[A].Property.MemberNumberListKeys) {
					var list = CommonConvertStringToArray("" + C.Appearance[A].Property.MemberNumberListKeys);

					if (list) {
						list = list.filter(x => x !== Player.MemberNumber);
						if (list.indexOf(CurrentCharacter.MemberNumber) < 0)
							list.push(CurrentCharacter.MemberNumber);
						C.Appearance[A].Property.MemberNumberListKeys = "" +
							CommonConvertArrayToString(list); // Convert to array and back; can only save strings on server
					}
				}
				C.Appearance[A].Property.LockMemberNumber = CurrentCharacter.MemberNumber;
			}
	CharacterRefresh(Player);
	ChatRoomCharacterUpdate(Player);
}

/**
 * Checks if the player can help the current character by giving them a lockpick
 * @returns {boolean} - TRUE if the player can interact and is allowed to interact with the current character.
 */
function ChatRoomCanGiveLockpicks() {
	return Player.CanInteract() ? InventoryAvailable(Player, "Lockpicks", "ItemMisc") : false;
}

/**
 * Checks if the player can help the current character by giving her lockpicks
 * @returns {boolean} - TRUE if the player can interact and is allowed to interact with the current character.
 */
function ChatRoomCanAssistStruggle() { return CurrentCharacter.AllowItem && !CurrentCharacter.CanInteract(); }

/**
 * Checks if the character options menu is available.
 * @returns {boolean} - Whether or not the player can interact with the target character
 */
function DialogCanPerformCharacterAction() {
	if (InventoryIsBlockedByDistance(CurrentCharacter)) return false;
	return (
		ChatRoomCanAssistStand() || ChatRoomCanAssistKneel() || ChatRoomCanAssistStruggle() ||
		ChatRoomCanHoldLeash() || ChatRoomCanStopHoldLeash() ||
		DialogCanTakePhotos() ||
		ChatRoomCanGiveLockpicks() || ChatRoomCanGiveHighSecurityKeys() || ChatRoomCanGiveHighSecurityKeysAll() ||
		DialogHasGamingHeadset() || DialogCanWatchKinkyDungeon()
	);
}

/**
 * Returns TRUE if the player can enter in whisper mode with the currently focused character
 * @returns {boolean} - TRUE is whipser can be started
 */
function ChatRoomCanStartWhisper() {
	if ((CurrentCharacter == null) || CurrentCharacter.IsPlayer()) return false;
	if (CurrentCharacter.MemberNumber === ChatRoomTargetMemberNumber) return false;
	if(ChatRoomActiveView.CanStartWhisper) return ChatRoomActiveView.CanStartWhisper(CurrentCharacter);
	return true;
}

/**
 * Enters whisper mode with the current character
 * @returns {void} - Nothing
 */
function ChatRoomStartWhisper() {
	if (CurrentCharacter == null) return;
	ChatRoomSetTarget(CurrentCharacter.MemberNumber);
	DialogLeave();
}

/**
 * Returns TRUE if the player can leave whisper mode with the currently focused character
 * @returns {boolean} - TRUE is whipser can exited
 */
function ChatRoomCanStopWhisper() {
	if (CurrentCharacter == null) return false;
	return (CurrentCharacter.MemberNumber === ChatRoomTargetMemberNumber);
}

/**
 * Leaves whisper mode
 * @returns {void} - Nothing
 */
function ChatRoomStopWhisper() {
	ChatRoomSetTarget(-1);
	DialogLeave();
}

/**
 * Checks if the target character can be helped back on her feet. This is different than CurrentCharacter.CanKneel()
 * because it listens for the current active pose and removes certain checks that are not required for someone else to
 * help a person kneel down.
 * @returns {boolean} - Whether or not the target character can stand
 */
function ChatRoomCanAssistStand() {
	return (
		Player.CanInteract()
		&& CurrentCharacter.AllowItem
		&& PoseAllStanding.some(p => PoseAvailable(CurrentCharacter, "BodyLower", p))
		&& CurrentCharacter.IsKneeling()
	);
}

/**
 * Checks if the target character can be helped down on her knees. This is different than CurrentCharacter.CanKneel()
 * because it listens for the current active pose and removes certain checks that are not required for someone else to
 * help a person kneel down.
 * @returns {boolean} - Whether or not the target character can stand
 */

function ChatRoomCanAssistKneel() {
	return (
		Player.CanInteract()
		&& CurrentCharacter.AllowItem
		&& PoseAllKneeling.some(p => PoseAvailable(CurrentCharacter, "BodyLower", p))
		&& !CurrentCharacter.IsKneeling()
	);
}

/**
 * Checks if the player character is kneeling and can stand up.
 * Will return true if there are any available transitions from {@link PoseAllKneeling} to {@link PoseAllStanding}.
 * @returns {boolean} - Whether or not the player character can stand
 */
function ChatRoomCanAttemptStand() {
	return Player.IsKneeling() && PoseAllStanding.some(p => PoseAvailable(Player, "BodyLower", p));
}

/**
 * Checks if the player character is standing and can kneel down.
 * Will return true if there are any available transitions from {@link PoseAllStanding} to {@link PoseAllKneeling}.
 * @returns {boolean} - Whether or not the player character can stand
 */
function ChatRoomCanAttemptKneel() {
	return Player.IsStanding() && PoseAllKneeling.some(p => PoseAvailable(Player, "BodyLower", p));
}

/**
 * Checks if the player can stop the current character from leaving.
 * @returns {boolean} - TRUE if the current character is slowed down and can be interacted with.
 */
function ChatRoomCanStopSlowPlayer() { return (CurrentCharacter.IsSlow() && Player.CanInteract() && CurrentCharacter.AllowItem ); }

/**
 * Checks if the player can interrupt another character from struggling.
 * @returns {boolean} - TRUE if the player can do it
 */
function ChatRoomCanInterruptOnlineStruggle() { return (Player.CanInteract() && !CurrentCharacter.IsPlayer() && CurrentCharacter.AllowItem); }

/**
 * Checks if the player can grab the targeted player's leash
 * @returns {boolean} - TRUE if the player can interact and is allowed to interact with the current character.
 */
function ChatRoomCanHoldLeash() { return CurrentCharacter.AllowItem && Player.CanInteract() && CurrentCharacter.OnlineSharedSettings && CurrentCharacter.OnlineSharedSettings.AllowPlayerLeashing != false && ChatRoomLeashList.indexOf(CurrentCharacter.MemberNumber) < 0
	&& ChatRoomCanBeLeashed(CurrentCharacter);}
/**
 * Checks if the player can let go of the targeted player's leash
 * @returns {boolean} - TRUE if the player can interact and is allowed to interact with the current character.
 */
function ChatRoomCanStopHoldLeash() {
	if (CurrentCharacter.AllowItem && Player.CanInteract() && CurrentCharacter.OnlineSharedSettings && CurrentCharacter.OnlineSharedSettings.AllowPlayerLeashing != false && ChatRoomLeashList.indexOf(CurrentCharacter.MemberNumber) >= 0) {
		if (ChatRoomCanBeLeashed(CurrentCharacter)) {
			return true;
		} else {
			ChatRoomLeashList.splice(ChatRoomLeashList.indexOf(CurrentCharacter.MemberNumber), 1);
		}
	}
	return false;
}
/**
 * Checks if the given character is a valid leash target for the player
 * @param {Character} C - The character to search
 * @returns {boolean} - TRUE if the player can be leashed
 */
function ChatRoomCanBeLeashed(C) {
	return ChatRoomCanBeLeashedBy(Player.MemberNumber, C);
}

/**
 * Checks if the targeted player is a valid leash target for the source member number
 * @param {number} sourceMemberNumber - Member number of the source player
 * @param {Character} C - Target player
 * @returns {boolean} - TRUE if the player can be leashed
 */
function ChatRoomCanBeLeashedBy(sourceMemberNumber, C) {
	if ((ChatRoomData && ChatRoomData.BlockCategory && ChatRoomData.BlockCategory.indexOf("Leashing") < 0) || !ChatRoomData) {
		// Have to not be tethered, and need a leash
		var canLeash = false;
		var isTrapped = false;
		var neckLock = null;
		for (let A = 0; A < C.Appearance.length; A++)
			if ((C.Appearance[A].Asset != null) && (C.Appearance[A].Asset.Group.Family == C.AssetFamily)) {
				if (InventoryItemHasEffect(C.Appearance[A], "Leash", true)) {
					canLeash = true;
					if (C.Appearance[A].Asset.Group.Name == "ItemNeckRestraints")
						neckLock = InventoryGetLock(C.Appearance[A]);
				} else if (InventoryItemHasEffect(C.Appearance[A], "Tethered", true) || InventoryItemHasEffect(C.Appearance[A], "Mounted", true) || InventoryItemHasEffect(C.Appearance[A], "Enclose", true) || InventoryItemHasEffect(C.Appearance[A], "OneWayEnclose", true)){
					isTrapped = true;
				}
			}

		// TODO: Use `DialogHasKey` here after refactoring it with access to both the source and destination character
		const isOwner = C.IsOwnedByMemberNumber(sourceMemberNumber);
		const isLover = C.IsLoverOfMemberNumber(sourceMemberNumber);
		const isFamily = C.IsFamilyOfPlayer();
		if (canLeash && !isTrapped) {
			if (
				sourceMemberNumber == 0
				|| !neckLock
				|| (!neckLock.Asset.OwnerOnly && !neckLock.Asset.LoverOnly && !neckLock.Asset.FamilyOnly)
				|| (neckLock.Asset.OwnerOnly && isOwner)
				|| (neckLock.Asset.LoverOnly && (isOwner || isLover))
				|| (neckLock.Asset.FamilyOnly && (isOwner || isLover || isFamily))
			) {
				return true;
			}
		}
	}
	return false;
}

/**
 * Checks if the player has waited long enough to be able to call the maids
 * @returns {boolean} - TRUE if the current character has been in the last chat room for more than 30 minutes
 */
function DialogCanCallMaids() { return (ServerPlayerIsInChatRoom() && ChatRoomData?.Game == "" && LogValue("Committed", "Asylum") < CurrentTime && !Player.CanWalk()) && !MainHallIsMaidsDisabled(); }


/**
 * Checks if the player has waited long enough to be able to call the maids
 * @returns {boolean} - TRUE if the current character has been in the last chat room for more than 30 minutes
 */
function DialogCanCallMaidsPunishmentOn() { return (DialogCanCallMaids() && (!Player.RestrictionSettings || !Player.RestrictionSettings.BypassNPCPunishments));}


/**
 * Checks if the player has waited long enough to be able to call the maids
 * @returns {boolean} - TRUE if the current character has been in the last chat room for more than 30 minutes
 */
function DialogCanCallMaidsPunishmentOff() { return (DialogCanCallMaids() && Player.RestrictionSettings && Player.RestrictionSettings.BypassNPCPunishments);}

/**
 * Namespace with functions for creating chat room separators.
 * @namespace
 */
var ChatRoomSep = {
	/**
	 * The most recently created chat room separator
	 * @type {null | HTMLDivElement}
	 */
	ActiveElem: null,

	/**
	 * Click event listener for collapsing one or more chat room separators
	 * @private
	 * @type {(this: HTMLButtonElement, event: PointerEvent) => Promise<void>}
	 */
	_ClickCollapse: async function _ClickCollapse(event) {
		const mode = this.getAttribute("aria-expanded") === "true" ? "Collapse" : "Uncollapse";
		const roomSep = /** @type {HTMLDivElement} */(this.parentElement.parentElement);
		if (event.shiftKey) {
			// (un)collapse all separators if the `shift` key is held down while clicking
			const roomSeps = /** @type {HTMLDivElement[]} */(Array.from(roomSep.parentElement.getElementsByClassName("chat-room-sep")));
			roomSeps.forEach(e => ChatRoomSep[mode](e));
		} else {
			ChatRoomSep[mode](roomSep);
		}
	},

	/**
	 * Click event listener for scrolling towards chat room seperator
	 * @private
	 * @type {(this: HTMLButtonElement, event: PointerEvent) => Promise<void>}
	 */
	_ClickScrollUp: async function _ClickScrollUp(event) {
		// Workaround as we can't directly use `chatArea.scrollIntoView` due to the seperators position being sticky
		const chatRoomSep = /** @type {HTMLDivElement} */(this.parentElement.parentElement);
		const sibbling = /** @type {null | HTMLElement} */(chatRoomSep.nextSibling);
		if (sibbling) {
			const chatArea = /** @type {HTMLDivElement} */(chatRoomSep.parentElement);
			chatArea.scroll({ top: sibbling.offsetTop - chatRoomSep.offsetHeight });
		}
	},

	/**
	 * Return a {@link HTMLElement.InnerHTML} representation of the passed button's room name
	 * @private
	 * @param {HTMLButtonElement} button
	 * @returns {(string | HTMLElement)[]}
	 */
	_GetDisplayName: function _GetDisplayName(button) {
		const namespace = FriendListIconMapping[button.dataset.space];
		return [
			namespace ? [
				ElementCreate({
					tag: "div",
					attributes: { role: "img", "aria-label": InterfaceTextGet(`ChatRoomSpace${button.dataset.space || "F"}`) },
					classList: ["chat-room-sep-image"],
					style: { mask: `url(${namespace.src}) center/contain` },
					children: [{ tag: "span", children: [InterfaceTextGet(`ChatRoomSpace${button.dataset.space || "F"}`)] }],
				}),
				" - ",
			] : undefined,
			button.dataset.private === "true" ? [
				ElementCreate({
					tag: "div",
					attributes: { role: "img", "aria-label": InterfaceTextGet("Private") },
					classList: ["chat-room-sep-image"],
					style: { mask: `url(${FriendListIconMapping.Private.src}) center/contain` },
					children: [{ tag: "span", children: [InterfaceTextGet("Private")] }],
				}),
				" - ",
			] : undefined,
			ChatSearchMuffle(button.dataset.room),
			button.dataset.messages ? [
				ElementCreate({
					tag: "span",
					classList: ["chat-room-no-copy"],
					children: [" ✉", { tag: "sup", children: [button.dataset.messages] }],
				}),
			] : undefined,
		].flat().filter(Boolean);
	},

	/**
	 * Create a dividing element serving as seperator for different chat rooms
	 * @param {boolean} appendChat - Whether to assign {@link ChatRoomSep.ActiveElem} and append the returned `<div>` to the chat log
	 * @returns {HTMLDivElement} - The created `<div>` element
	 */
	Create: function Create(appendChat=true) {
		const elem = ElementCreate({
			tag: "div",
			classList: ["ChatMessage", "ChatMessageAction", "chat-room-sep"],
			style: { ["--label-color"]: Player.LabelColor },
			dataAttributes: { time: ChatRoomCurrentTime(), sender: (Player.MemberNumber ?? "").toString() },
			children: [
				{
					tag: "div",
					classList: ["chat-room-sep-div"],
					children: [
						ElementButton.Create(
							null, this._ClickCollapse, { noStyling: true },
							{
								button: {
									children: ["˅"],
									classList: ["chat-room-sep-collapse"],
									attributes: { "aria-expanded": "true" },
								},
							},
						),
						ElementButton.Create(
							null, this._ClickScrollUp, { noStyling: true },
							{ button: { classList: ["chat-room-sep-header"], eventListeners: { copy: ChatRoomSep._CopyHeader } } },
						),
					],
				},
			],
		});
		if (appendChat) {
			ChatRoomAppendChat(elem);
			ChatRoomSep.ActiveElem?.classList.remove("chat-room-sep-last");
			ChatRoomSep.ActiveElem = elem;
			elem.classList.add("chat-room-sep-last");
		}
		return elem;
	},

	/**
	 * Return a {@link HTMLElement.innerHTML} representation of the separators room name
	 * @param {HTMLDivElement} roomSep - The chat room separator
	 * @returns {(string | HTMLElement)[]}
	 */
	GetDisplayName: function GetDisplayName(roomSep) {
		const button = /** @type {HTMLButtonElement} */(roomSep?.querySelector(".chat-room-sep-header"));
		return button ? ChatRoomSep._GetDisplayName(button) : [];
	},

	/**
	 * Return whether the passed room separator is collapsed OR NOT
	 * @param {HTMLDivElement} roomSep - The chat room separator
	 * @returns {boolean}
	 */
	IsCollapsed: function IsCollapsed(roomSep) {
		const button = /** @type {HTMLButtonElement} */(roomSep?.querySelector(".chat-room-sep-collapse"));
		return !!button && button.getAttribute("aria-expanded") === "false";
	},

	/**
	 * Uncollapse the passed room separator
	 * @param {HTMLDivElement} roomSep - The chat room separator
	 */
	Uncollapse: async function Uncollapse(roomSep) {
		const button = /** @type {HTMLButtonElement} */(roomSep?.querySelector(".chat-room-sep-collapse"));
		if (!button || button.getAttribute("aria-expanded") === "true") {
			return;
		}

		button.setAttribute("aria-expanded", "true");
		button.innerText = "˅";
		let sibbling = /** @type {null | HTMLElement} */(roomSep.nextSibling);
		while (sibbling && !sibbling.classList.contains("chat-room-sep")) {
			sibbling.toggleAttribute("hidden", false);
			sibbling = /** @type {null | HTMLElement} */(sibbling.nextSibling);
		}

		const headerButton = /** @type {HTMLButtonElement} */(button.nextSibling);
		if (headerButton) {
			headerButton.dataset.messages = "";
			headerButton.replaceChildren(...ChatRoomSep.GetDisplayName(roomSep));
		}
	},

	/**
	 * Collapse the passed room separator
	 * @param {HTMLDivElement} roomSep - The chat room separator
	 */
	Collapse: async function Collapse(roomSep) {
		const button = /** @type {HTMLButtonElement} */(roomSep?.querySelector(".chat-room-sep-collapse"));
		if (!button || button.getAttribute("aria-expanded") === "false") {
			return;
		}

		button.setAttribute("aria-expanded", "false");
		button.innerText = "˃";
		let sibbling = /** @type {null | HTMLElement} */(roomSep.nextSibling);
		while (sibbling && !sibbling.classList.contains("chat-room-sep")) {
			sibbling.toggleAttribute("hidden", true);
			sibbling = /** @type {null | HTMLElement} */(sibbling.nextSibling);
		}
	},

	/**
	 * Set the room-specific of the currently active chat room separator
	 * @param {HTMLDivElement} roomSep - The chat room separator
	 * @param {Pick<ServerChatRoomData, "Name" | "Visibility" | "Space">} data - The data of the room
	 */
	SetRoomData: async function SetRoomData(roomSep, data) {
		const button = /** @type {HTMLButtonElement} */(roomSep?.querySelector(".chat-room-sep-header"));
		if (!button) {
			return;
		}

		button.dataset.room = data.Name;
		button.dataset.space = data.Space;
		button.dataset.private = ChatRoomDataIsPrivate(data).toString();
		button.replaceChildren(...ChatRoomSep.GetDisplayName(roomSep));
	},

	/** Update all the displayed room names based on the player's degree of sensory deprivation. */
	UpdateDisplayNames: async function UpdateDisplayNames() {
		const roomLabels = /** @type {HTMLButtonElement[]} */(Array.from(document.querySelectorAll("#TextAreaChatLog .chat-room-sep-header")));
		roomLabels.forEach(e => e.replaceChildren(...ChatRoomSep._GetDisplayName(e)));
	},
};

/**
 * Creates the chat room input elements.
 * @returns {HTMLDivElement}
 */
function ChatRoomCreateElement() {
	// NOTE: If you want to add any custom buttons, make sure append them to the `#chat-room-buttons` grid

	let elem = /** @type {null | HTMLDivElement} */(document.getElementById("chat-room-div"));
	if (!elem) {
		elem = ElementCreate({
			tag: "div",
			attributes: {
				id: "chat-room-div",
				"screen-generated": CurrentScreen,
			},
			parent: document.body,
			classList: ["HideOnPopup"],
			children: [
				{
					tag: "div",
					attributes: { id: "TextAreaChatLog", role: "log" },
					classList: ["scroll-box"],
				},
				{
					tag: "div",
					attributes: { id: "chat-room-reply-indicator", hidden: true },
					children: [
						ElementButton.Create(
							"chat-room-reply-indicator-text",
							(ev) => {
								const msg = document.querySelector(`#TextAreaChatLog [msgid="${ChatRoomMessageGetReplyId()}"]`)?.parentElement;
								ChatRoomScrollToReplyID(msg);
								msg?.dispatchEvent(new PointerEvent("click", ev));
							},
							{ label: TextGet("ChatRoomReply"), noStyling: true },
						),
						ElementButton.Create(
							"chat-room-reply-indicator-close",
							ChatRoomMessageReplyStop,
							{ noStyling: true },
						),
					],
				},
				{
					tag: "div",
					attributes: { id: "chat-room-bot" },
					children: [
						{
							tag: "textarea",
							attributes: {
								id: "InputChat",
								name: "InputChat",
								maxLength: 10000,
								autocomplete: "off",
								enterkeyhint: "send",
							},
							eventListeners: {
								input: ChatRoomChatInputChangeHandler,
								keyup: ChatRoomStatusUpdateTalk,
								keydown: ChatRoomStopReplyOnEscape,
							},
						},
						{
							tag: "span",
							attributes: { id: "InputChatLength" },
						},
						{ tag: "div", attributes: { id: "chat-room-buttons-div" } },
						ElementButton.Create(
							"chat-room-buttons-collapse",
							function() {
								const displayState = this.getAttribute("aria-expanded") === "true";
								this.setAttribute("aria-expanded", displayState ? "false" : "true");
								this.innerText = displayState ? "<" : ">";
								const elements = /** @type {NodeListOf<HTMLElement>} */(document.querySelectorAll("#chat-room-buttons > *"));
								elements.forEach(b => {
									if (b.id !== "chat-room-send") {
										b.toggleAttribute("hidden", displayState);
									}
								});
							},
							{ noStyling: true },
							{
								button: {
									attributes: { "aria-expanded": "false", "aria-control": "chat-room-buttons" },
									children: ["<"],
								},
							},
						),
						ElementMenu.Create(
							"chat-room-buttons",
							[
								ElementButton.Create(
									"chat-room-send", () => ChatRoomSendChat(), { noStyling: true },
									{ button: { classList: ["chat-room-button"] } },
								),
							],
							{ direction: "rtl" },
						),
					],
				},
			],
		});

		ChatRoomRefreshChatSettings();
		ElementFocus("InputChat");
		window.addEventListener("resize", ChatRoomResizeManager.ChatRoomResizeEvent);
	} else if (ChatRoomChatHidden) {
		elem.toggleAttribute("hidden", false);
		ElementScrollToEnd("TextAreaChatLog");
		ChatRoomRefreshChatSettings();
		ElementFocus("InputChat");
	}
	ChatRoomChatHidden = false;

	return elem;
}

// const ChatRoomUIElementNames = ["InputChat", "TextAreaChatLog", "InputChatLength"];

/** Hide the UI elements of the chatroom screen */
function ChatRoomShowElements() {
	const elem = document.getElementById("chat-room-div");
	if (elem) {
		elem.toggleAttribute("hidden", false);

		// We can't accurately keep track of the scroll height within the likes of `ChatRoomAppendChat` when an element is hidden via `[hidden]`,
		// so as a compromise just scroll to the very bottom of the chat log when unhiding (which should be desireable in the majority cases)
		ElementScrollToEnd("TextAreaChatLog");
	}
	ChatRoomResize(false);
	ChatRoomChatHidden = false;
}

/** Show the UI elements of the chatroom screen */
function ChatRoomHideElements() {
	document.getElementById("chat-room-div")?.toggleAttribute("hidden", true);
	ChatRoomChatHidden = true;
}

/**
 * Construct and return a metadata-containing element with the time and member number
 * @param {string} time
 * @param {null | number | string} [sender]
 * @returns {HTMLDivElement}
 */
function ChatRoomGetMetadataElem(time, sender=null) {
	return ElementCreate({
		tag: "div",
		classList: ["chat-room-metadata"],
		children: [
			{ tag: "time", children: [time], attributes: { datetime: time }, classList: ["chat-room-time"] },
			{ tag: "span", children: [sender == null ? null : sender.toString()], classList: ["chat-room-sender"] },
		],
	});
}

/**
 * Append an element to the chatroom's chat log, scroll it down and restore focus
 * @param {HTMLElement} div
 */
function ChatRoomAppendChat(div) {
	const chatLog = document.getElementById("TextAreaChatLog");
	if (!chatLog) {
		return;
	}

	if (
		!Array.from(div.children).some(i => i.classList.contains("chat-room-metadata"))
		&& div.classList.contains("ChatMessage")
	) {
		div.prepend(ChatRoomGetMetadataElem(div.dataset.time, div.dataset.sender));
	}

	// Is the message from the player and was it explicitly sent? (e.g. a non-automatic message)
	const isPlayerMessage = (
		div.dataset.sender === Player.MemberNumber.toString()
		&& !div.classList.contains("ChatMessageNonDialogue")
	);

	// If the current room separator is collapsed then either uncollapse it
	if (ChatRoomSep.IsCollapsed(ChatRoomSep.ActiveElem)) {
		if (isPlayerMessage) {
			ChatRoomSep.Uncollapse(ChatRoomSep.ActiveElem);
		} else {
			div.toggleAttribute("hidden", true);
			const button = /** @type {HTMLButtonElement} */(ChatRoomSep.ActiveElem.querySelector(".chat-room-sep-header"));
			if (button) {
				button.dataset.messages = ((Number.parseInt(button.dataset.messages, 10) || 0) + 1).toString();
				button.replaceChildren(...ChatRoomSep.GetDisplayName(ChatRoomSep.ActiveElem));
			}
		}
	}

	const isScrolledToEnd = ElementIsScrolledToEnd("TextAreaChatLog");
	chatLog.appendChild(div);
	if (isPlayerMessage || isScrolledToEnd) ElementScrollToEnd("TextAreaChatLog");
	if (document.activeElement.id == "InputChat") ElementFocus("InputChat");
}

/**
 * Loads the chat room screen by displaying the proper inputs.
 * @type {ScreenLoadHandler}
 */
async function ChatRoomLoad() {
	ChatRoomRefreshFontSize();
	ChatRoomCreateElement();

	// Add a horizontal line to the chatlog the first time one enters the room; skip the very first room
	if (ChatRoomJustEntered) {
		const elem = ChatRoomSep.Create();
		elem.toggleAttribute("hidden", !(Player.ChatSettings?.PreserveChat ?? true));
		ChatRoomCharacterUpdate(Player);
		ActivityChatRoomArousalSync(Player);
		ChatRoomJustEntered = false;
	}

	if (!ChatRoomData || Player.LastChatRoom && ChatRoomData.Name !== Player.LastChatRoom.Name) {
		ChatRoomHideIconState = 0;
	}
	ChatRoomMenuBuild();
	ChatRoomCharacterViewInitialize = true;
	TextPrefetch("Character", "FriendList");
	TextPrefetch("Online", "ChatAdmin");
	TextPrefetch("Room", "Shop2");

	if (CommonVersionUpdated) {
		CommonGet("./changelog.html", (xhr) => {
			if (xhr.status === 200) {
				const changelog = CommandsChangelog.Publish(xhr.responseText);
				changelog.querySelectorAll(".chat-room-changelog-button-collapse[data-level='2']").forEach(e => e.dispatchEvent(new Event("click")));
				CommonVersionUpdated = false;
			}
		});
	}
}

/**
 * Removes all elements that can be open in the chat room
*/
function ChatRoomClearAllElements() {
	// Dialog
	DialogLeave({ reload: false });

	// Chatroom
	if (Player.ChatSettings?.PreserveChat ?? true) {
		ChatRoomHideElements();
	} else {
		ElementRemove("chat-room-div");
		window.removeEventListener("resize", ChatRoomResizeManager.ChatRoomResizeEvent);
		ChatRoomDivInputPrevHeight = NaN;
	}
}

/**
 * Starts the chatroom selection screen.
 * @deprecated Use {@link ChatSearchStart}
 * @template {ModuleType} T
 * @param {ServerChatRoomSpace} Space - Name of the chatroom space
 * @param {ServerChatRoomGame} Game - Name of the chatroom game to play
 * @param {ModuleScreens[T] | null} LeaveRoom - Name of the room to go back to when exiting chatsearch.
 * @param {T | null} LeaveSpace - Name of the space to go back to when exiting chatsearch.
 * @param {string} Background - Name of the background to use in chatsearch.
 * @param {BackgroundTag[]} BackgroundTagList - List of available backgrounds in the chatroom space.
 * @returns {void} - Nothing.
 */
function ChatRoomStart(Space, Game, LeaveRoom, LeaveSpace, Background, BackgroundTagList) {
	/** @type {ScreenSpecifier} */
	let ReturnScreen;
	if (!LeaveRoom || !LeaveSpace) {
		if (Player.GenderSettings.AutoJoinSearch.Female || Player.GenderSettings.AutoJoinSearch.Male) {
			ReturnScreen = ["Room", "MainHall"];
		} else {
			ReturnScreen = ["Online", "ChatSelect"];
		}
	} else {
		ReturnScreen = /** @type {ScreenSpecifier} */([LeaveSpace, LeaveRoom]);
	}
	ChatSearchStart(Space, ReturnScreen, { Game, Background, BackgroundTagList });
}

/**
 * Create the list of chat room menu buttons
 * @returns {void} - Nothing
 */
function ChatRoomMenuBuild() {
	ChatRoomMenuButtons = [];
	ChatRoomMenuButtons.push("Exit");
	ChatRoomMenuButtons.push("Kneel");
	ChatRoomMenuButtons.push("Icons");
	if (ChatRoomPlayerIsInDrawFocus()) ChatRoomMenuButtons.push("ClearFocus");
	if (DialogCanTakePhotos()) ChatRoomMenuButtons.push("Camera");
	ChatRoomMenuButtons.push("Cut");
	if (ChatRoomMapViewIsActive()) {
		if (ChatRoomData?.MapData?.Type === "Hybrid") {
			ChatRoomMenuButtons.push("CharacterView");
		}
	}
	if (ChatRoomCharacterViewIsActive()) {
		if (ChatRoomData?.MapData?.Type === "Hybrid") {
			ChatRoomMenuButtons.push("MapView");
		}
		if (ChatRoomCharacterViewCharacterCountTotal > 10) {
			if (ChatRoomCharacterViewOffset === 0) {
				ChatRoomMenuButtons.push("NextCharacters");
			} else {
				ChatRoomMenuButtons.push("PreviousCharacters");
			}
		}
	}
	if (ChatRoomCustomizationButton() && !ChatRoomCustomized) ChatRoomMenuButtons.push("CustomizationOn");
	if (ChatRoomCustomizationButton() && ChatRoomCustomized) ChatRoomMenuButtons.push("CustomizationOff");
	ChatRoomMenuButtons.push("Dress");
	ChatRoomMenuButtons.push("Profile");
	if (OnlineGameHasOptions()) ChatRoomMenuButtons.push("GameOption");
	ChatRoomMenuButtons.push("RoomAdmin");
}

/**
 * Checks if the player's owner is inside the chatroom.
 * @returns {boolean} - Returns TRUE if the player's owner is inside the room.
 */
function ChatRoomOwnerInside() {
	return ChatRoomCharacter.some(c => Player.IsOwnedByCharacter(c));
}

/**
 * Updates the temporary drawing arrays for characters, to handle things that are dependent on the drawn chat room
 * characters rather than the ones actually present
 * @returns {void} - Nothing
 */
function ChatRoomUpdateDisplay() {
	// The number of characters to show in the room
	const RenderSingle = Player.GameplaySettings.SensDepChatLog == "SensDepExtreme" && Player.GetBlindLevel() >= 3 && !Player.Effect.includes("VRAvatars");
	ChatRoomCharacterDrawlist = ChatRoomCharacter;
	ChatRoomSenseDepBypass = false;
	if (Player.Effect.includes("VRAvatars")) {
		ChatRoomImpactedBySenseDep = ChatRoomCharacterDrawlist.slice();
		ChatRoomCharacterDrawlist = [];
		ChatRoomSenseDepBypass = true;
		for (let CC = 0; CC < ChatRoomCharacter.length; CC++) {
			if (ChatRoomCharacter[CC].Effect.includes("VRAvatars")) {
				ChatRoomCharacterDrawlist.push(ChatRoomCharacter[CC]);
				ChatRoomImpactedBySenseDep.splice(ChatRoomImpactedBySenseDep.indexOf(ChatRoomCharacter[CC]), 1);
			}
		}
	} else if (Player.GetBlindLevel() > 0 && Player.GetBlindLevel() < 3 && Player.ImmersionSettings.BlindAdjacent) {
		ChatRoomImpactedBySenseDep = ChatRoomCharacterDrawlist.slice();
		// We hide all players except those who are adjacent
		ChatRoomCharacterDrawlist = [];
		ChatRoomSenseDepBypass = true;
		let PlayerIndex = -1;
		// First find the player index
		for (let CC = 0; CC < ChatRoomCharacter.length; CC++) {
			if (ChatRoomCharacter[CC].IsPlayer()) {
				PlayerIndex = CC;
				break;
			}
		}
		// Then filter the characters
		for (let CC = 0; CC < ChatRoomCharacter.length; CC++) {
			if (Math.abs(CC - PlayerIndex) <= 1) {
				ChatRoomCharacterDrawlist.push(ChatRoomCharacter[CC]);
				ChatRoomImpactedBySenseDep.splice(ChatRoomImpactedBySenseDep.indexOf(ChatRoomCharacter[CC]), 1);
			}
		}
	}

	// If we're in focus (focuslist exists), filter out any players not in it (/focus)
	if (ChatRoomPlayerIsInDrawFocus()) {
		ChatRoomCharacterDrawlist = ChatRoomCharacterDrawlist.filter(C => C.IsPlayer() || ChatRoomDrawFocusList.includes(C));
	}

	// Keeps the current character count and total
	ChatRoomCharacterViewCharacterCount = RenderSingle ? 1 : ChatRoomCharacterDrawlist.length;
	ChatRoomCharacterViewCharacterCountTotal = RenderSingle ? 1 : ChatRoomCharacterDrawlist.length;

	// In character view, we can only display 10 characters
	if (ChatRoomCharacterViewIsActive()) {

		// Make sure the drawing offset isn't set, if 10 characters or less in the room
		if ((ChatRoomCharacterViewOffset !== 0) && (ChatRoomCharacterViewCharacterCount <= 10)) ChatRoomCharacterViewOffset = 0;

		// Over 10 characters we cut based on the offest
		if (ChatRoomCharacterViewCharacterCount > 10) {
			if (ChatRoomCharacterViewOffset !== 0)
				ChatRoomCharacterDrawlist = ChatRoomCharacterDrawlist.slice((ChatRoomCharacterViewCharacterCount - 10) * -1);
			else
				ChatRoomCharacterDrawlist = ChatRoomCharacterDrawlist.slice(0, 10);
			ChatRoomCharacterViewCharacterCount = RenderSingle ? 1 : ChatRoomCharacterDrawlist.length;
		}

	}
}

/**
 * Draws the status bubble next to the character
 * @param {Character} C - The status bubble to draw
 * @param {number} X - Screen X position
 * @param {number} Y - Screen Y position
 * @param {number} Zoom - Screen zoom
 * @returns {void} - Nothing.
 */
function DrawStatus(C, X, Y, Zoom) {
	if ((Player.OnlineSettings != null) && (Player.OnlineSettings.ShowStatus != null) && (Player.OnlineSettings.ShowStatus == false)) return;
	if (ChatRoomHideIconState >= 2) return;
	if ((C.ArousalSettings != null) && (C.ArousalSettings.OrgasmTimer != null) && (C.ArousalSettings.OrgasmTimer > 0)) {
		DrawImageResize("Icons/Status/Orgasm" + (Math.floor(CommonTime() / 1000) % 3).toString() + ".png", X + 225 * Zoom, Y + 920 * Zoom, 50 * Zoom, 30 * Zoom);
		return;
	}
	if ((C.StatusTimer != null) && (C.StatusTimer < CommonTime())) {
		C.StatusTimer = null;
		C.Status = null;
		return;
	}
	if ((C.Status == null) || (C.Status == "")) return;
	DrawImageResize("Icons/Status/" + C.Status + (Math.floor(CommonTime() / 1000) % 3).toString() + ".png", X + 225 * Zoom, Y + 920 * Zoom, 50 * Zoom, 30 * Zoom);
}

/**
 * Draws the status icons of a character
 * @param {Character} C The target character
 * @param {number} CharX Character's X position on canvas
 * @param {number} CharY Character's Y position on canvas
 * @param {number} Zoom Room zoom
 */
function ChatRoomDrawCharacterStatusIcons(C, CharX, CharY, Zoom)
{
	if (C.IsWhitelisted()) {
		DrawImageResize("Icons/Small/WhiteList.png", CharX + 70 * Zoom, CharY, 40 * Zoom, 40 * Zoom);
	} else if (C.IsBlacklisted()) {
		DrawImageResize("Icons/Small/BlackList.png", CharX + 70 * Zoom, CharY, 40 * Zoom, 40 * Zoom);
	}
	// Unobtrusive but prominent warnings to alert user they are in focus mode -- drawn on player and all focused (visible) characters
	if (ChatRoomPlayerIsInDrawFocus() && (C.IsPlayer() || ChatRoomDrawFocusList.includes(C)))
	{
		DrawImageResize("Icons/Small/FocusEnabledWarning.png", CharX + 30 * Zoom, CharY, 40 * Zoom, 40 * Zoom);
		DrawImageResize("Icons/Small/FocusEnabledWarning.png", CharX + 30 * Zoom, CharY + 950 * Zoom, 40 * Zoom, 40 * Zoom);
	}
	if (C.IsGhosted()) {
		DrawImageResize("Icons/Small/GhostList.png", CharX + 110 * Zoom, CharY, 40 * Zoom, 40 * Zoom);
	} else if (C.IsFriend()) {
		DrawImageResize("Icons/Small/FriendList.png", CharX + 110 * Zoom, CharY, 40 * Zoom, 40 * Zoom);
	}
	if (C.IsBirthday())
	{
		DrawImageResize("Icons/Small/Birthday.png", CharX + 150 * Zoom, CharY, 40 * Zoom, 40 * Zoom);
	}
	else if (!C.IsPlayer() && C.IsOwner() && (Player.IsOwned() == "online"))
	{
		DrawImageResize("Icons/Small/Owner.png", CharX + 150 * Zoom, CharY, 40 * Zoom, 40 * Zoom);
	}
	else if (C.IsLoverOfPlayer())
	{
		DrawImageResize("Icons/Small/Lover.png", CharX + 150 * Zoom, CharY, 40 * Zoom, 40 * Zoom);
	}
	else if (C.IsFamilyOfPlayer())
	{
		DrawImageResize("Icons/Small/Family.png", CharX + 150 * Zoom, CharY, 40 * Zoom, 40 * Zoom);
	}
	if (ChatRoomCarryingBounty(C))
	{
		DrawImageResize("Icons/Small/Money.png", CharX + 310 * Zoom, CharY, 40 * Zoom, 40 * Zoom);
	}
	if (C.OnlineSharedSettings && C.OnlineSharedSettings.GameVersion !== GameVersion)
	{
		DrawImageResize("Icons/Small/Warning.png", CharX + 350 * Zoom, CharY, 40 * Zoom, 40 * Zoom);
	}
	if (Array.isArray(ChatRoomData.Admin) && ChatRoomData.Admin.includes(C.MemberNumber))
	{
		DrawImageResize("Icons/Small/Admin.png", CharX + 390 * Zoom, CharY, 40 * Zoom, 40 * Zoom);
	} else if (Array.isArray(ChatRoomData.Whitelist) && ChatRoomData.Whitelist.includes(C.MemberNumber)) {
		DrawImageResize("Icons/Small/RoomWhitelist.png", CharX + 390 * Zoom, CharY, 40 * Zoom, 40 * Zoom);
	}
}

/**
 * Select the character (open dialog) and clear other chatroom displays.
 * @param {Character} C - The character to focus on. Does nothing if null.
 * @param {null | { mode?: DialogMenuMode, selfMode?: DialogSelfMenuName }} options - The type of dialog- and dialog-self subscreen te open
 * @returns {void} - Nothing
 */
function ChatRoomFocusCharacter(C, options=null) {
	if (ChatRoomOwnerPresenceRule("BlockAccessSelf", C)) return;
	if (ChatRoomOwnerPresenceRule("BlockAccessOther", C)) return;
	if (C == null) return;
	ChatRoomHideElements();
	ChatRoomBackground = ChatRoomData.Background;
	C.AllowItem = C.IsPlayer() || ServerChatRoomGetAllowItem(Player, C);
	ChatRoomOwnershipOption = null;
	ChatRoomLovershipOption = null;
	if (!C.IsPlayer()) ServerSend("ChatRoomAllowItem", { MemberNumber: C.MemberNumber });
	if (C.IsOwnedByPlayer() || C.IsLoverOfPlayer()) ServerSend("ChatRoomChat", { Content: "RuleInfoGet", Type: "Hidden", Target: C.MemberNumber });
	CharacterSetCurrent(C, options);
}

/**
 * Sends the request to the server to check the current character's relationship status.
 * @returns {void} - Nothing.
 */
function ChatRoomCheckRelationships() {
	var C = CharacterGetCurrent();
	if (!C.IsPlayer()) ServerSend("AccountOwnership", { MemberNumber: C.MemberNumber });
	if (!C.IsPlayer()) ServerSend("AccountLovership", { MemberNumber: C.MemberNumber });
}

/**
 * Displays /help content to the player if it's their first visit to a chatroom this session
 * @returns {void} - Nothing.
 */
function ChatRoomFirstTimeHelp() {
	if (!ChatRoomHelpSeen) {
		if (!Player.ChatSettings || Player.ChatSettings.ShowChatHelp)
			ChatRoomMessage({ Content: "ChatRoomHelp", Type: "Action", Sender: Player.MemberNumber });
		ChatRoomHelpSeen = true;
	}
}

/**
 * Sets the current whisper target and flags a target update
 * @param {number} MemberNumber - The target member number to set. -1 to unselect
 * @returns {void} - Nothing
 */
function ChatRoomSetTarget(MemberNumber) {
	MemberNumber ??= -1;
	if (MemberNumber === ChatRoomTargetMemberNumber) return;

	ChatRoomTargetMemberNumber = MemberNumber;
	let target;
	if (ChatRoomTargetMemberNumber >= 0) {
		target = ChatRoomCharacter.find(c => c.MemberNumber === ChatRoomTargetMemberNumber);
	} else {
		target = null;
	}

	let placeholder;
	if (target) {
		placeholder = `${TextGetInScope("Screens/Online/ChatRoom/Text_ChatRoom.csv", "WhisperTo")} ${CharacterNickname(target)}`;
	} else {
		placeholder = TextGetInScope("Screens/Online/ChatRoom/Text_ChatRoom.csv", "PublicChat");
	}
	ElementSetAttribute("InputChat", "placeholder", placeholder);
}

/**
 * Updates the chat input's placeholder text to reflect the current whisper target
 *
 * @deprecated No-oped in R104, automatically handled when the target is set
 * @returns {void} - Nothing.
 */
function ChatRoomTarget() {
	// No-oped in R104
}

/**
 * Updates the account to set the last chat room
 * @param {ChatRoom|null} room - room to set it to. null to reset.
 * @returns {void} - Nothing
 */
function ChatRoomSetLastChatRoom(room) {
	if (room !== null && ChatRoomValidateProperties(room) && Player.ImmersionSettings?.ReturnToChatRoom) {
		if (!ChatRoomNewRoomToUpdate) {
			Player.LastChatRoom = ChatRoomGetSettings(room);
			ServerAccountUpdate.QueueData({ LastChatRoom: Player.LastChatRoom });
		}
	} else {
		Player.LastChatRoom = null;
		Player.LastMapData = null;
		ServerAccountUpdate.QueueData({ LastChatRoom: null, LastMapData: null });
	}
}

/**
 * Triggers a chat room message for stimulation events.
 *
 * Chance is calculated for worn items can cause stimulation (things like plugs
 * and crotch ropes), then one is randomly selected in the list and if it passes
 * a random chance check, it will send a player-only message.
 *
 * @param {StimulationAction} Action - The action that happened
 * @returns {void} - Nothing.
 */
function ChatRoomStimulationMessage(Action) {
	if (CurrentScreen !== "ChatRoom"
		|| Player.ImmersionSettings && !Player.ImmersionSettings.StimulationEvents
		|| !["Kneel", "Walk", "Struggle", "StruggleFail", "Talk"].includes(Action))
		return;

	const eventData = ChatRoomStimulationEvents[Action];
	if (!eventData) return;

	const arousal = Player.ArousalSettings && Player.ArousalSettings.Progress || 0;
	// Tracking for the PlugBoth event
	let isFilled = false;
	let isPlugged = false;

	// We go through every stimulating item and gather their effects
	/** @type {StimulationEventItem[]} */
	const events = [];
	for (let A of Player.Appearance) {
		// First handle single items
		const filled = InventoryItemHasEffect(A, "FillVulva", true);
		const plugged = InventoryItemHasEffect(A, "IsPlugged", true);
		const gagged = InventoryItemHasEffect(A, "GagTotal", true) || InventoryItemHasEffect(A, "GagTotal2", true);
		const wearsCrotchRope = InventoryItemHasEffect(A, "CrotchRope", true);
		const canWiggle = InventoryItemHasEffect(A, "Wiggling");

		// Track modifiers for vibrating and inflated toys
		const inflated = InventoryGetItemProperty(A, "InflateLevel", true) || 0;
		const vibrating = InventoryItemHasEffect(A, "Vibrating", true);
		const vibeIntensity = InventoryGetItemProperty(A, "Intensity", true) || 0;

		if (wearsCrotchRope && eventData.Chance > 0) {
			let chance = eventData.Chance;
			chance += eventData.ArousalScaling * arousal / 100;
			events.push({ chance: chance, arousal: 2, item: A, event: "CrotchRope" });
		}

		if (gagged && eventData.TalkChance > 0) {
			events.push({ chance: eventData.TalkChance, arousal: 12, item: A, event: "Talk" });
		}

		if ((filled || plugged) && eventData.Chance > 0) {
			/** @type {StimulationEventType} */
			let name = filled ? "PlugFront" : "PlugBack";
			let chance = eventData.Chance;
			chance += eventData.ArousalScaling * arousal / 100;
			let evtArousal = 1;
			if (vibrating) {
				chance += eventData.VibeScaling * (vibeIntensity + 1);
				evtArousal += (vibeIntensity + 1);
			}
			events.push({ chance: chance, arousal: evtArousal, item: A, event: name });
			isFilled = isFilled || filled;
			isPlugged = isPlugged || plugged;
		}

		if (vibrating && eventData.Chance > 0) {
			let chance = eventData.Chance;
			chance += eventData.VibeScaling * (vibeIntensity + 1);
			chance += eventData.ArousalScaling * arousal / 100;
			events.push({ chance: chance, arousal: (vibeIntensity + 1), item: A, event: "Vibe" });
		}

		if (inflated > 0 && eventData.Chance > 0) {
			let chance = eventData.Chance;
			chance += eventData.InflationScaling * inflated / 4;
			chance += eventData.ArousalScaling * arousal / 100;
			events.push({ chance: chance, arousal: inflated / 2, item: A, event: "Inflated" });
		}

		if (canWiggle && eventData.Chance > 0) {
			let chance = eventData.Chance;
			chance += eventData.ArousalScaling * arousal / 100;
			events.push({ chance: chance, arousal: 1, item: A, event: "Wiggling" });
		}
	}

	// If the player is both plugged and filled, insert a special event for that
	if (isFilled && isPlugged) {
		// Dummy item
		const pluggingItems = Player.Appearance.filter(item => InventoryItemHasEffect(item, "FillVulva", true) || InventoryItemHasEffect(item, "IsPlugged", true));
		let A = CommonRandomItemFromList(undefined, pluggingItems);
		let chance = eventData.Chance;
		chance += eventData.ArousalScaling * arousal / 100;
		events.push({ chance: chance, arousal: 2, item: A, event: "PlugBoth" });
	}

	if (!events.length)
		return;

	// Pick a random event, and check it
	const event = CommonRandomItemFromList(undefined, events);

	const dice = Math.random();
	if (dice > event.chance)
		return;

	// We have a trigger message, send it out!
	if ((Player.ChatSettings != null) && (Player.ChatSettings.ShowActivities != null) && !Player.ChatSettings.ShowActivities) return;

	let group = event.item.Asset.Group;
	if (event.item.Asset.ArousalZone) {
		group = AssetGroupGet(Player.AssetFamily, event.item.Asset.ArousalZone);
	}

	// Increase player arousal to the zone
	if (!Player.IsEdged() && arousal < 70 - event.arousal && event.event != "Talk")
		ActivityEffectFlat(Player, Player, event.arousal, /** @type {AssetGroupItemName} */ (group.Name), 1);
	const duration = (Math.random() + event.arousal / 2.4) * 500;
	DrawFlashScreen("#FFB0B0", duration, 140);
	if (Player.ArousalSettings?.AffectExpression) {
		CharacterSetFacialExpression(Player, "Blush", "VeryHigh", Math.ceil(duration / 250));
	}

	var index = Math.floor(Math.random() * 3);
	const Dictionary = [
		{ Tag: "AssetGroup", Text: group.Description.toLowerCase() },
		{ Tag: "AssetName", Text: (event.item.Asset.DynamicDescription ? event.item.Asset.DynamicDescription(Player) : event.item.Asset.Description).toLowerCase() },
	];
	ChatRoomMessage({ Content: "ChatRoomStimulationMessage" + event.event + index.toString(), Type: "Action", Sender: Player.MemberNumber, Dictionary: Dictionary, });
}

/**
 * @type {ScreenResizeHandler}
 */
function ChatRoomResize(load) {
	const chatInput = document.getElementById("InputChat");
	if (chatInput) {
		/** @type {RectTuple} */
		const shape = Player.ChatSettings.PreserveChat ? ChatRoomDivRect : [
			ChatRoomDivRect[0],
			ChatRoomDivRect[1] + 3,
			ChatRoomDivRect[2],
			ChatRoomDivRect[3] - 3,
		];
		ElementPositionFix("chat-room-div", ChatRoomFontSize, ...shape);
		chatInput.dispatchEvent(new InputEvent("input"));
	}
}

/**
 * @type {ScreenUnloadHandler}
 */
function ChatRoomUnload() {
	ChatRoomHideElements();
}

/**
 * Draws arousal screen filter
 * @param {number} y1 - Y to draw filter at.
 * @param {number} h - Height of filter
 * @param {number} Width - Width of filter
 * @param {number} ArousalOverride - Override to the existing arousal value
 * @returns {void} - Nothing.
 */
function ChatRoomDrawArousalScreenFilter(y1, h, Width, ArousalOverride, Color = '255, 100, 176', AlphaBonus = 0) {
	let Progress = (ArousalOverride) ? ArousalOverride : Player.ArousalSettings.Progress;
	let amplitude = 0.24 * Math.min(1, 2 - 1.5 * Progress/100); // Amplitude of the oscillation
	let percent = Progress/100.0;
	let level = Math.min(0.5, percent) + 0.5 * Math.pow(Math.max(0, percent*2 - 1), 4);
	let oscillation = Math.sin(CommonTime() / 1000 % Math.PI);
	let alpha = Math.min(1.0, AlphaBonus + 0.6 * level * (0.99 - amplitude + amplitude * oscillation));

	switch (Player.ArousalSettings.VFXFilter) {
		case "VFXFilterMedium":
			alpha /= 2;
			break;
		case "VFXFilterLight":
			alpha = (Progress >= 91) ? 0.25 : 0;
			break;
	}

	if (!CommonIsFinite(alpha, 0, 1)) {
		return;
	}

	switch (Player.ArousalSettings.VFXFilter) {
		case "VFXFilterHeavy": {
			const Grad = MainCanvas.createLinearGradient(0, y1, 0, h);
			const alphamin = Math.max(0, alpha / 2 - 0.05);
			Grad.addColorStop(0, `rgba(${Color}, ${alpha})`);
			Grad.addColorStop(0.1 + 0.2*percent * (1.2 + 0.2 * oscillation), `rgba(${Color}, ${alphamin})`);
			Grad.addColorStop(0.5, `rgba(${Color}, ${alphamin/2})`);
			Grad.addColorStop(0.9 - 0.2*percent * (1.2 + 0.2 * oscillation), `rgba(${Color}, ${alphamin})`);
			Grad.addColorStop(1, `rgba(${Color}, ${alpha})`);
			MainCanvas.fillStyle = Grad;
			MainCanvas.fillRect(0, y1, Width, h);
			break;
		}
		case "VFXFilterMedium":
		case "VFXFilterLight":
			DrawRect(0, y1, Width, h, `rgba(${Color}, ${alpha})`);
			break;
		case "VFXFilterNone":
			break;
	}
}
/**
 * Draws vibration screen filter for the specified player
 * @param {number} y1 - Y to draw filter at.
 * @param {number} h - Height of filter
 * @param {number} Width - Width of filter
 * @param {Character} C - Player to draw it for
 * @returns {void} - Nothing.
 */
function ChatRoomVibrationScreenFilter(y1, h, Width, C) {
	let VibratorLevelLower = 0;
	let VibratorLevelUpper = 0;
	for (let A = 0; A < C.Appearance.length; A++) {
		if (C.Appearance[A] && C.Appearance[A].Property) {
			let property = C.Appearance[A].Property;
			if (property.Effect && property.Effect.includes("Vibrating") && property.Intensity >= 0) {
				let intensity = property.Intensity + 1;
				let group = (C.Appearance[A].Asset && C.Appearance[A].Asset.Group) ? C.Appearance[A].Asset.Group.Name : "";
				if (group == "ItemVulva" || group == "ItemPelvis" || group == "ItemButt" || group == "ItemVulvaPiercings") {
					VibratorLevelLower += (100 -VibratorLevelLower) * 0.7*Math.min(1, intensity/4);
				} else {
					VibratorLevelUpper += (100 -VibratorLevelUpper) * 0.7*Math.min(1, intensity/4);
				}
			}
		}
	}
	ChatRoomDrawVibrationScreenFilter(y1, h, Width, VibratorLevelLower, VibratorLevelUpper);
}

/**
 * Draws vibration screen filter
 * @param {number} y1 - Y to draw filter at.
 * @param {number} h - Height of filter
 * @param {number} Width - Width of filter
 * @param {number} VibratorLower - 1-100 Strength of the vibrator "Down There"
 * @param {number} VibratorSides - 1-100 Strength of the vibrator at the breasts/nipples
 * @returns {void} - Nothing.
 */
function ChatRoomDrawVibrationScreenFilter(y1, h, Width, VibratorLower, VibratorSides) {
	let amplitude = 0.24; // Amplitude of the oscillation
	let percentLower = VibratorLower/100.0;
	let percentSides = VibratorSides/100.0;
	let level = Math.min(0.5, Math.max(percentLower, percentSides)) + 0.5 * Math.pow(Math.max(0, Math.max(percentLower, percentSides)*2 - 1), 4);
	let oscillation = Math.sin(CommonTime() / 1000 % Math.PI);
	if (Player.ArousalSettings.VFXVibrator != "VFXVibratorAnimated") oscillation = 0;
	let alpha = 0.6 * level * (0.99 - amplitude + amplitude * oscillation);

	if (VibratorLower > 0) {
		const Grad = MainCanvas.createRadialGradient(Width/2, y1, 0, Width/2, y1, h);
		let alphamin = Math.max(0, alpha / 2 - 0.05);
		let modifier = (Player.ArousalSettings.VFXVibrator == "VFXVibratorAnimated") ? Math.random() * 0.01: 0;
		Grad.addColorStop(VibratorLower / 100 * (0.7 + modifier), `rgba(255, 100, 176, 0)`);
		Grad.addColorStop(VibratorLower / 100 * (0.85 - 0.1*percentLower * (0.5 * oscillation)), `rgba(255, 100, 176, ${alphamin})`);
		Grad.addColorStop(1, `rgba(255, 100, 176, ${alpha})`);
		MainCanvas.fillStyle = Grad;
		MainCanvas.fillRect(0, y1, Width, h);
	}
	if (VibratorSides > 0) {
		let Grad = MainCanvas.createRadialGradient(0, 0, 0, 0, 0, Math.sqrt(h*h + Width*Width));
		let alphamin = Math.max(0, alpha / 2 - 0.05);
		let modifier = (Player.ArousalSettings.VFXVibrator == "VFXVibratorAnimated") ? Math.random() * 0.01: 0;
		Grad.addColorStop(VibratorSides / 100 * (0.8 + modifier), `rgba(255, 100, 176, 0)`);
		Grad.addColorStop(VibratorSides / 100 * (0.9 - 0.07*percentSides * (0.5 * oscillation)), `rgba(255, 100, 176, ${alphamin})`);
		Grad.addColorStop(1, `rgba(255, 100, 176, ${alpha})`);
		MainCanvas.fillStyle = Grad;
		MainCanvas.fillRect(0, y1, Width, h);

		Grad = MainCanvas.createRadialGradient(Width, 0, 0, Width, 0, Math.sqrt(h*h + Width*Width));
		modifier = (Player.ArousalSettings.VFXVibrator == "VFXVibratorAnimated") ? Math.random() * 0.01: 0;
		Grad.addColorStop(VibratorSides / 100 * (0.8 + modifier), `rgba(255, 100, 176, 0)`);
		Grad.addColorStop(VibratorSides / 100 * (0.9 - 0.07*percentSides * (0.5 * oscillation)), `rgba(255, 100, 176, ${alphamin})`);
		Grad.addColorStop(1, `rgba(255, 100, 176, ${alpha})`);
		MainCanvas.fillStyle = Grad;
		MainCanvas.fillRect(0, y1, Width, h);
	}
}

/**
 * Runs the chatroom online bounty loop.
 * @returns {void} - Nothing.
 */
function ChatRoomUpdateOnlineBounty() {
	if (KidnapLeagueSearchingPlayers.length > 0) {
		let misc = InventoryGet(Player, "ItemMisc");
		if (misc && misc.Asset && (misc.Asset.Name == "BountySuitcase" || misc.Asset.Name == "BountySuitcaseEmpty")) {
			if (KidnapLeagueSearchFinishTime > 0 && CommonTime() > KidnapLeagueSearchFinishTime) {
				for (let C = 0; C < ChatRoomCharacter.length; C++) {
					if (KidnapLeagueSearchingPlayers.includes(ChatRoomCharacter[C].MemberNumber)) {
						ServerSend("ChatRoomChat", { Content: "ReceiveSuitcaseMoney", Type: "Hidden", Target: ChatRoomCharacter[C].MemberNumber });
					}
				}
				if (misc.Asset.Name == "BountySuitcase") {
					InventoryRemove(Player, "ItemMisc");
					InventoryWear(Player, "BountySuitcaseEmpty", "ItemMisc");
					ChatRoomMessage({ Content: "OnlineBountySuitcaseEnd", Type: "Action", Sender: Player.MemberNumber });
					KidnapLeagueSearchFinishTime = 0;
					KidnapLeagueSearchingPlayers = [];
					ChatRoomCharacterItemUpdate(Player, "ItemMisc");
				} else {
					ChatRoomMessage({ Content: "OnlineBountySuitcaseEndOpened", Type: "Action", Sender: Player.MemberNumber });
					KidnapLeagueSearchFinishTime = 0;
					KidnapLeagueSearchingPlayers = [];
					if (!misc.Property) misc.Property = {};
					if (!misc.Property.Iterations) misc.Property.Iterations = 0;
					misc.Property.Iterations = misc.Property.Iterations + 1;
					ChatRoomCharacterItemUpdate(Player, "ItemMisc");
				}

			}
			let KidnapLeagueSearchingPlayersNew = [];
			for (let C = 0; C < ChatRoomCharacter.length; C++) {
				if (ChatRoomCharacter[C].CanInteract() && KidnapLeagueSearchingPlayers.includes(ChatRoomCharacter[C].MemberNumber)) {
					KidnapLeagueSearchingPlayersNew.push(ChatRoomCharacter[C].MemberNumber);
				}
			}
			KidnapLeagueSearchingPlayers = KidnapLeagueSearchingPlayersNew;
		} else {
			KidnapLeagueSearchingPlayers = [];
			KidnapLeagueSearchFinishTime = 0;
		}
	} else {
		if (KidnapLeagueSearchFinishTime > 0) {
			const Dictionary = new DictionaryBuilder()
				.sourceCharacter(Player)
				.build();
			if (InventoryIsWorn(Player, "ItemMisc", "BountySuitcase"))
				ChatRoomPublishCustomAction("OnlineBountySuitcaseEndEarly", true, Dictionary);
			else if (InventoryIsWorn(Player, "ItemMisc", "BountySuitcaseEmpty"))
				ChatRoomPublishCustomAction("OnlineBountySuitcaseEndEarlyOpened", true, Dictionary);
		}

		KidnapLeagueSearchFinishTime = 0;
	}
	if (!Player.CanInteract()) {
		KidnapLeagueOnlineBountyTarget = 0;
	}

}

/**
 * Updates the local view of character status
 * @param {Character} C - The character whose status we're updating
 * @param {string | null} Status - The new status to use
 * @returns {void} - Nothing.
 */
function ChatRoomStatusUpdateLocalCharacter(C, Status) {
	C.Status = ((Status == "") || (Status == "null")) ? null : Status;
	C.StatusTimer = (Status == "Talk") ? CommonTime() + 5000 : null;
}

/**
 * Updates the player status if needed and sends that new status in a chat message
 * @param {string | null} Status - The new status to use
 * @returns {void} - Nothing.
 */
function ChatRoomStatusUpdate(Status) {
	if (Status == Player.Status) return;
	if ((Player.OnlineSettings != null) && (Player.OnlineSettings.SendStatus != null) && (Player.OnlineSettings.SendStatus == false) && (Status != null)) return;
	ChatRoomStatusUpdateLocalCharacter(Player, Status);
	ServerSend("ChatRoomChat", { Content: ((Status == null) ? "null" : Status), Type: "Status" });
}

let ChatRoomStatusDeadKeys = [
	"Shift", "Control", "Alt", "Meta", "Fn", "Escape", "Dead",
	"ArrowLeft", "ArrowRight", "ArrowUp", "ArrowDown",
];

/**
 * Stops the reply when the escape key is pressed
 * @param {KeyboardEvent} key
 */
function ChatRoomStopReplyOnEscape(key) {
	if (key.key == "Escape") {
		ChatRoomMessageReplyStop();
	}
}
/**
 * Sends the "Talk" status to other players if the player typed in the text box and there's a value in it
 * @param {KeyboardEvent} Key
 * @returns {void} - Nothing.
 */
function ChatRoomStatusUpdateTalk(Key) {
	// Prevent dead keys from doing anything with the status
	if (ChatRoomStatusDeadKeys.includes(Key.key))
		return;

	const text = ElementValue("InputChat");
	let talking = true;
	// Not talking if no chat input
	if (!text) {
		talking = false;
	}
	// Don't send a public update if whispering someone
	else if (ChatRoomTargetMemberNumber >= 0) {
		talking = false;
	}
	// Not talking if entering a command that does not end up in chat
	else if (text.startsWith("/") && !text.startsWith("//") && !text.startsWith("/me ") && !text.startsWith("/action ")) {
		talking = false;
	}
	// No longer talking if pressed enter
	else if (Key.key == "Enter") {
		talking = false;
	}
	// Not talking if only one character in input: require at least 2 characters to prevent misclicks etc. from triggering unnecessary status updates
	else if (text.length <= 2) {
		talking = false;
	}
	ChatRoomStatusUpdate(talking ? "Talk" : null);
}

/**
 * Handler called when the chat input field changes
 * @this {HTMLTextAreaElement}
 * @param {Event} event
 */
function ChatRoomChatInputChangeHandler(event) {
	const label = document.getElementById("InputChatLength");
	if (!label) return;

	const length = this.value.length;
	if (length <= ServerChatMessageMaxLength - 100) {
		label.textContent = "";
	} else {
		label.textContent = `${ServerChatMessageMaxLength - length}`;
		if (length > ServerChatMessageMaxLength) {
			label.classList.add("invalid");
		} else {
			label.classList.remove("invalid");
		}
	}

	this.style.height = "100%";
	this.style.height = `${this.scrollHeight}px`;

	const inputHeight = this.clientHeight;
	if (inputHeight === ChatRoomDivInputPrevHeight) {
		return;
	}
	ChatRoomInputResize(this);
}

/**
 * Manually adjust the size of `TextAreaChatLog` based on the (auto-expanded) `chatInput` height.
 *
 * Why manually? Because doing it automatically can get veeeery slow as the chat log grows in size.
 * @param {HTMLElement} chatInput
 */
function ChatRoomInputResize(chatInput) {
	const chatLog = document.getElementById("TextAreaChatLog");
	const parent = document.getElementById("chat-room-div");
	if (!chatLog || !parent) {
		return;
	}
	ChatRoomDivInputPrevHeight = chatInput.clientHeight;

	const isScrolledToEnd = ElementIsScrolledToEnd("TextAreaChatLog");
	let height = parent.getBoundingClientRect().height;
	let nGaps = 0;
	for (const i of parent.children) {
		if (!ElementCheckVisibility(i, { checkVisibilityCSS: false })) {
			continue;
		}

		nGaps++;
		if (i !== chatLog) {
			height -= i.getBoundingClientRect().height;
		}
	}
	const gap = globalThis.getComputedStyle(chatLog).marginBottom;
	chatLog.style.height = `calc(${Math.max(0, height)}px - (${nGaps} * ${gap}))`;

	if (isScrolledToEnd) {
		ElementScrollToEnd("TextAreaChatLog");
	}
}

/**
 * Checks if status has expired or is otherwise no longer valid and resets status if so
 * @returns {void} - Nothing.
 */
function ChatRoomStatusCheckExpiration() {
	if (Player.StatusTimer) {
		if (Player.StatusTimer < CommonTime())
			ChatRoomStatusUpdate(null);
	} else {
		const isCrawling = (Player.Status == "Crawl") && ChatRoomIsLeavingSlowly();
		if (!isCrawling && (ChatRoomStruggleData == null))
			ChatRoomStatusUpdate(null);
	}
}

/**
 * Clears the room customization data
 * @returns {void} - Nothing.
 */
function ChatRoomCustomizationClear() {
	ChatRoomCustomBackground = "";
	ChatRoomCustomFilter = "";
	ChatAdminRoomCustomizationPlayMusic("");
	ChatRoomCustomSizeMode = null;
}

/**
 * Use the room customization features if needed
 * @returns {void} - Nothing.
 */
function ChatRoomCustomizationRun() {
	if ((Player.ImmersionSettings != null) && (Player.OnlineSettings.ShowRoomCustomization != null) && (Player.OnlineSettings.ShowRoomCustomization >= 3)) ChatRoomCustomized = true;
	if (ChatRoomCustomized) {
		if ((Player.ImmersionSettings == null) || (Player.OnlineSettings.ShowRoomCustomization == null) || (Player.OnlineSettings.ShowRoomCustomization >= 1)) {
			ChatAdminRoomCustomizationProcess(ChatRoomData.Custom, null, null);
		} else {
			ChatRoomCustomized = false;
			ChatRoomCustomizationClear();
		}
	}
}

/**
 * Runs the chatroom screen.
 * @type {ScreenRunHandler}
 */
function ChatRoomRun(time) {

	// Handles online GGTS, bounty & customizations
	AsylumGGTSProcess();
	PandoraPenitentiaryRun();
	ChatRoomUpdateOnlineBounty();
	ChatRoomCustomizationRun();
	ChatRoomMenuBuild();

	// Draws the chat room controls
	ChatRoomStatusCheckExpiration();
	ChatRoomUpdateDisplay();
	ChatRoomCreateElement();
	ChatRoomFirstTimeHelp();
	ChatRoomBackground = "";
	DrawRect(0, 0, 2000, 1000, "Black");

	// Draw the room characters or the map depending on the map type
	if ((ChatRoomData.MapData == null) || (ChatRoomData.MapData.Type == null) || (ChatRoomData.MapData.Type == "Never")) ChatRoomActivateView(ChatRoomCharacterViewName);
	if ((ChatRoomData.MapData != null) && (ChatRoomData.MapData.Type != null) && (ChatRoomData.MapData.Type == "Always")) ChatRoomActivateView(ChatRoomMapViewName);
	ChatRoomActiveView.Run(time);
	ChatRoomActiveView.Draw();
	if (!ChatRoomDrawArousalOverlay() && ChatRoomActiveView.DrawUi) ChatRoomActiveView.DrawUi();

	// Draws the chat elements in the bottom right
	if (ChatRoomChatHidden) ChatRoomShowElements();
	if (CurrentTime > ChatRoomGetUpTimer) ChatRoomGetUpTimer = 0;

	// Draw the buttons at the top-right
	if (ChatRoomStruggleData == null) ChatRoomMenuDraw();
	else ChatRoomStruggleDraw();

	// Process attempts at leaving slowly
	ChatRoomProcessSlowLeave();

	// Runs any needed online game script
	OnlineGameRun();

	// Clear notifications if needed
	ChatRoomNotificationReset();

	// Recreates the chatroom with the stored chatroom data if necessary
	ChatRoomRecreate();
}

/**
 * Runs the arousal overlay.
 * @returns {boolean} - Returns true if the orgasm overlay is active and false otherwise.
 */
function ChatRoomDrawArousalOverlay()
{
	let orgasmScreen = false;
	// In orgasm mode, we add a pink filter and different controls depending on the stage.  The pink filter shows a little above 90
	if ((Player.ArousalSettings != null) && (Player.ArousalSettings.Active != null) && (Player.ArousalSettings.Active != "Inactive") && (Player.ArousalSettings.Active != "NoMeter")) {
		if ((Player.ArousalSettings.OrgasmTimer != null) && (typeof Player.ArousalSettings.OrgasmTimer === "number") && !isNaN(Player.ArousalSettings.OrgasmTimer) && (Player.ArousalSettings.OrgasmTimer > 0)) {
			DrawRect(0, 0, 1003, 1000, "#FFB0B0B0");
			DrawRect(1003, 0, 993, 63, "#FFB0B0B0");
			if (Player.ArousalSettings.OrgasmStage == null) Player.ArousalSettings.OrgasmStage = 0;
			if (Player.ArousalSettings.OrgasmStage == 0) {
				DrawText(TextGet("OrgasmComing"), 500, 410, "White", "Black");
				DrawButton(200, 532, 250, 64, TextGet("OrgasmTryResist"), "White");
				DrawButton(550, 532, 250, 64, TextGet("OrgasmSurrender"), "White");
			}
			if (Player.ArousalSettings.OrgasmStage == 1) DrawButton(ActivityOrgasmGameButtonX, ActivityOrgasmGameButtonY, 250, 64, ActivityOrgasmResistLabel, "White");
			if (ActivityOrgasmRuined) ActivityOrgasmControl();
			if (Player.ArousalSettings.OrgasmStage == 2) DrawText(TextGet("OrgasmRecovering"), 500, 500, "White", "Black");
			orgasmScreen = true;
			ActivityOrgasmProgressBar(50, 970);
		} else if ((Player.ArousalSettings.Progress != null) && (Player.ArousalSettings.Progress >= 1) && (Player.ArousalSettings.Progress <= 99) && !CommonPhotoMode) {
			let y1 = 0;
			let h = 1000;

			if (ChatRoomCharacterViewCharacterCount == 3) {y1 = 50; h = 900;}
			else if (ChatRoomCharacterViewCharacterCount == 4) {y1 = 150; h = 700;}
			else if (ChatRoomCharacterViewCharacterCount == 5) {y1 = 250; h = 500;}

			ChatRoomDrawArousalScreenFilter(y1, h, 1003, Player.ArousalSettings.Progress);
		}
	}

	if (Player.ArousalSettings.VFXVibrator == "VFXVibratorSolid" || Player.ArousalSettings.VFXVibrator == "VFXVibratorAnimated") {
		let y1 = 0;
		let h = 1000;

		if (ChatRoomCharacterViewCharacterCount == 3) {y1 = 50; h = 900;}
		else if (ChatRoomCharacterViewCharacterCount == 4) {y1 = 150; h = 700;}
		else if (ChatRoomCharacterViewCharacterCount == 5) {y1 = 250; h = 500;}

		ChatRoomVibrationScreenFilter(y1, h, 1003, Player);
	}

	return orgasmScreen;
}

/**
 * Draws the chat room struggle progress bar and buttons
 * @returns {void} - Nothing
 */
function ChatRoomStruggleDraw() {

	// Increments the progress based on the time
	let Time = CommonTime();
	if (ChatRoomStruggleData.Timer <= 0) ChatRoomStruggleData.Timer = 1;
	let Progress = (Time - ChatRoomStruggleData.LastRun) / (ChatRoomStruggleData.Timer * 5);
	if (!ChatRoomStruggleData.LoosenMode && (ChatRoomStruggleData.Difficulty < 4) && (Math.random() >= 1 - ChatRoomStruggleData.Progress / 1000)) Progress = Progress * (ChatRoomStruggleData.Difficulty - 4);
	ChatRoomStruggleData.Progress = ChatRoomStruggleData.Progress + Progress;
	let MaxProgress = (!ChatRoomStruggleData.LoosenMode && (ChatRoomStruggleData.Difficulty < -6)) ? 100 + ChatRoomStruggleData.Difficulty : 100;
	if (MaxProgress < 50) MaxProgress = 50;
	if (MaxProgress > 100) MaxProgress = 100;
	if (ChatRoomStruggleData.Progress > MaxProgress) ChatRoomStruggleData.Progress = MaxProgress;
	if (ChatRoomStruggleData.Progress < 0) ChatRoomStruggleData.Progress = 0;
	ChatRoomStruggleData.LastRun = Time;

	// At 100 progress, we complete the struggle
	if (ChatRoomStruggleData.Progress == 100) {
		if (ChatRoomStruggleData.LoosenMode) StruggleChatRoomLoosenComplete();
		else StruggleChatRoomSuccess();
		return;
	}

	// Draw the controls, we allow loosening the item beyond progress 50% if the difficulty allows it
	if ((Player.Status == null) || (Player.Status !== "Talk")) ChatRoomStatusUpdate("Struggle");
	let Impossible = ((ChatRoomStruggleData.Difficulty < -6) && (ChatRoomStruggleData.Start + 60000 <= Time));
	if (!ChatRoomStruggleData.AllowLoosen && !ChatRoomStruggleData.LoosenMode)
		ChatRoomStruggleData.AllowLoosen = ((ChatRoomStruggleData.Progress >= 50) && (ChatRoomStruggleData.Difficulty >= -9) && (ChatRoomStruggleData.Difficulty < 0) && (ChatRoomStruggleData.Item != null) && (ChatRoomStruggleData.Item.Asset != null) && (ChatRoomStruggleData.Item.Asset != null) && ChatRoomStruggleData.Item.Asset.AllowTighten && !InventoryItemHasEffect(ChatRoomStruggleData.Item, "Lock"));
	let Text = "Struggling";
	if (Impossible) Text = "Impossible";
	if (ChatRoomStruggleData.LoosenMode) Text = "Loosening";
	let Path = `${AssetGetPreviewPath(ChatRoomStruggleData.Item.Asset)}/${ChatRoomStruggleData.Item.Asset.Name}.png`;
	DrawImageResize(Path, 1010, 5, 50, 50);
	DrawText(TextGet("ChatRoomStruggle" + Text), 1175, 30, "White", "Silver");
	if (ChatRoomStruggleData.AllowLoosen) {
		DrawProgressBar(1300, 3, 390, 55, ChatRoomStruggleData.Progress);
		DrawButton(1700, 0, 145, 60, TextGet("ChatRoomStruggleLoosen"), "White");
		DrawButton(1850, 0, 145, 60, TextGet("ChatRoomStruggleGiveUp"), "White");
	} else {
		DrawProgressBar(1300, 3, 490, 55, ChatRoomStruggleData.Progress);
		DrawButton(1800, 0, 195, 60, TextGet("ChatRoomStruggleGiveUp"), "White");
	}

	// Generates a struggle animation
	if (Player.OnlineSharedSettings && Player.OnlineSharedSettings.ItemsAffectExpressions && ChatRoomStruggleData.NextAnim <= Time) {

		// The animation gets stronger the more time passes
		let Sec = Math.round((Time - ChatRoomStruggleData.Start) / 1000) + (ChatRoomStruggleData.LoosenMode ? 15 : 0);
		if (Sec <= 15) {
			if (Math.random() >= 0.5) CharacterSetFacialExpression(Player, "Eyes", CommonRandomItemFromList("Afk", [null, "Dazed", "Shy"]));
			if (Math.random() >= 0.5) CharacterSetFacialExpression(Player, "Blush", CommonRandomItemFromList("Afk", [null, "Low"]));
			if (Math.random() >= 0.5) CharacterSetFacialExpression(Player, "Mouth", CommonRandomItemFromList("Afk", [null, "Grin", "Smirk", "HalfOpen"]));
			if (Math.random() >= 0.5) CharacterSetFacialExpression(Player, "Eyebrows", CommonRandomItemFromList("Afk", [null, "OneRaised", "Raised"]));
		} else if (Sec <= 30) {
			if (Math.random() >= 0.5) CharacterSetFacialExpression(Player, "Eyes", CommonRandomItemFromList("Afk", [null, "Dazed", "Shy", "Sad", "Closed"]));
			if (Math.random() >= 0.5) CharacterSetFacialExpression(Player, "Blush", CommonRandomItemFromList("Afk", [null, "Low", "Medium"]));
			if (Math.random() >= 0.5) CharacterSetFacialExpression(Player, "Mouth", CommonRandomItemFromList("Afk", [null, "Grin", "Smirk", "HalfOpen", "Open", "Pout"]));
			if (Math.random() >= 0.5) CharacterSetFacialExpression(Player, "Eyebrows", CommonRandomItemFromList("Afk", [null, "OneRaised", "Raised", "Lowered"]));
		} else if (Sec <= 45) {
			if (Math.random() >= 0.5) CharacterSetFacialExpression(Player, "Eyes", CommonRandomItemFromList("Afk", [null, "Dazed", "Shy", "Horny", "Lewd"]));
			if (Math.random() >= 0.5) CharacterSetFacialExpression(Player, "Blush", CommonRandomItemFromList("Afk", ["Low", "Medium", "High"]));
			if (Math.random() >= 0.5) CharacterSetFacialExpression(Player, "Mouth", CommonRandomItemFromList("Afk", [null, "HalfOpen", "Open", "Pout", "Moan", "LipBite"]));
			if (Math.random() >= 0.5) CharacterSetFacialExpression(Player, "Eyebrows", CommonRandomItemFromList("Afk", ["OneRaised", "Raised", "Lowered", "Soft"]));
		} else if (Sec <= 60) {
			if (Math.random() >= 0.5) CharacterSetFacialExpression(Player, "Eyes", CommonRandomItemFromList("Afk", [null, "Horny", "Lewd", "Sad", "Daydream", "Surprised"]));
			if (Math.random() >= 0.5) CharacterSetFacialExpression(Player, "Blush", CommonRandomItemFromList("Afk", ["Medium", "High", "VeryHigh"]));
			if (Math.random() >= 0.5) CharacterSetFacialExpression(Player, "Mouth", CommonRandomItemFromList("Afk", [null, "Open", "Pout", "Moan", "LipBite", "Pained", "Sad"]));
			if (Math.random() >= 0.5) CharacterSetFacialExpression(Player, "Eyebrows", CommonRandomItemFromList("Afk", [null, "Lowered", "Soft", "Harsh", "Angry"]));
		} else {
			if (Math.random() >= 0.5) CharacterSetFacialExpression(Player, "Eyes", CommonRandomItemFromList("Afk", [null, "Horny", "Daydream", "Sad", "Surprised", "Angry", "Closed"]));
			if (Math.random() >= 0.5) CharacterSetFacialExpression(Player, "Blush", CommonRandomItemFromList("Afk", ["High", "VeryHigh", "Extreme"]));
			if (Math.random() >= 0.5) CharacterSetFacialExpression(Player, "Mouth", CommonRandomItemFromList("Afk", [null, "Open", "Frown", "Moan", "LipBite", "Pained", "Sad", "TonguePinch"]));
			if (Math.random() >= 0.5) CharacterSetFacialExpression(Player, "Eyebrows", CommonRandomItemFromList("Afk", ["Raised", "Lowered", "Soft", "Harsh", "Angry"]));
		}

		// Sets the next animation time
		ChatRoomStruggleData.NextAnim = Time + 5000 + Math.floor(Math.random() * 5000);

	}

}

/**
 * Draws the chat room menu buttons
 * @returns {void} - Nothing
 */
function ChatRoomMenuDraw() {
	const Space = 992 / (ChatRoomMenuButtons.length);
	for (let [idx, name] of Object.entries(ChatRoomMenuButtons)) {
		let color = "White";
		let suffix = "";
		let hoverText = "";
		const buttonX = 1005 + Space * Number(idx);
		switch (name) {
			case "Exit":
				if (!ChatRoomCanLeave()) {
					color = "Pink";
				} else if (ChatRoomIsLeavingSlowly()) {
					color = "Yellow";
					name = "Cancel";
				} else {
					color = Player.IsSlow() ? "Yellow" : "White";
				}
				break;
			case "Icons":
				suffix = ChatRoomHideIconState.toString();
				break;
			case "Kneel": {
				let status = 0;
				if (Player.IsKneeling()) {
					status = Math.max(...PoseAllStanding.map(p => PoseCanChangeUnaidedStatus(Player, p)));
				} else if (Player.IsStanding()) {
					status = Math.max(...PoseAllKneeling.map(p => PoseCanChangeUnaidedStatus(Player, p)));
				}

				switch (status) {
					case PoseChangeStatus.NEVER:
					case PoseChangeStatus.NEVER_WITHOUT_AID:
						color = "Pink";
						break;
					case PoseChangeStatus.ALWAYS_WITH_STRUGGLE:
						color = ChatRoomGetUpTimer === 0 ? "Yellow" : "Pink";
						break;
					case PoseChangeStatus.ALWAYS:
						color = "White";
						break;
				}
				break;
			}
			case "Dress":
				if (!Player.CanChangeOwnClothes()) {
					color = "Pink";
					// Exploded version of `CanChangeClothesOn`
					if (Player.IsRestrained()) {
						hoverText = TextGet("MenuDressIsRestrained");
					} else if (ManagementIsClubSlave()) {
						hoverText = TextGet("MenuDressIsClubSlave");
					} else if (!OnlineGameAllowChange()) {
						hoverText = TextGet("MenuDressGameBlocked");
					} else if (!AsylumGGTSAllowChange(Player)) {
						hoverText = TextGet("MenuDressGGTSBlocked");
					} else if (LogQuery("BlockChange", "Rule")) {
						hoverText = TextGet("MenuDressRuleBlocked");
					} else if (LogQuery("BlockChange", "OwnerRule") && !Player.IsFullyOwned()) {
						hoverText = TextGet("MenuDressOwnerBlocked");
					}
				} else {
					color = "White";
				}
				break;
		}
		hoverText ??= TextGet("Menu" + name);
		DrawButton(buttonX, 2, Space - 2, 60, "", color, null, hoverText);

		const imageWidth = Math.min(114, Space - 4);
		DrawImageEx("Icons/Rectangle/" + name + suffix + ".png", MainCanvas, buttonX + 1 + (Space - 4 - imageWidth) / 2, 4,
			{ SourcePos: [(114 - imageWidth) / 2, 0, imageWidth, 56] }
		);
	}
}

/**
 * Redirects the Mouse Down event to the map if needed
 * @param {PointerEvent} event
 * @returns {void} - Nothing
 */
function ChatRoomMouseDown(event) {
	if (ChatRoomActiveView.MouseDown) return ChatRoomActiveView.MouseDown(event);
}

/**
 * Redirects the Mouse Up event to the map if needed
 * @param {PointerEvent} event
 * @returns {void} - Nothing
 */
function ChatRoomMouseUp(event) {
	if (ChatRoomActiveView.MouseUp) return ChatRoomActiveView.MouseUp(event);
}

/**
 * Redirects the Mouse Move event to the map if needed
 * @param {PointerEvent} event
 * @returns {void} - Nothing
 */
function ChatRoomMouseMove(event) {
	if (ChatRoomActiveView.MouseMove) return ChatRoomActiveView.MouseMove(event);
}

/**
 * Redirects the Mouse Wheel event to the map if needed
 * @type {MouseWheelEventListener}
 */
function ChatRoomMouseWheel(event) {
	if (ChatRoomActiveView.MouseWheel) return ChatRoomActiveView.MouseWheel(event);
}

/**
 * Handles clicks the chatroom screen.
 * @type {MouseEventListener}
 */
function ChatRoomClick(event) {

	// In orgasm mode, we do not allow any clicks expect the chat
	if ((Player.ArousalSettings != null) && (Player.ArousalSettings.OrgasmTimer != null) && (typeof Player.ArousalSettings.OrgasmTimer === "number") && !isNaN(Player.ArousalSettings.OrgasmTimer) && (Player.ArousalSettings.OrgasmTimer > 0)) {

		// On stage 0, the player can choose to resist the orgasm or not.  At 1, the player plays a mini-game to fight her orgasm
		if (MouseIn(200, 532, 250, 68) && (Player.ArousalSettings.OrgasmStage == 0)) ActivityOrgasmGameGenerate(0);
		if (MouseIn(550, 532, 250, 68) && (Player.ArousalSettings.OrgasmStage == 0)) ActivityOrgasmStart(Player);
		if ((MouseX >= ActivityOrgasmGameButtonX) && (MouseX <= ActivityOrgasmGameButtonX + 250) && (MouseY >= ActivityOrgasmGameButtonY) && (MouseY <= ActivityOrgasmGameButtonY + 64) && (Player.ArousalSettings.OrgasmStage == 1)) ActivityOrgasmGameGenerate(ActivityOrgasmGameProgress + 1);
		return;

	}

	// In the left part of the screen
	if (MouseIn(0, 0, 1000, 1000))
		if (ChatRoomActiveView.Click)
			return ChatRoomActiveView.Click(event);

	// When the user clicks a menu button in the top-right
	if ((MouseYIn(0, 62)) && (ChatRoomStruggleData == null))
		return ChatRoomMenuClick(event);

	// If the user wants to stop struggling (smaller button)
	if (MouseIn(1700, 0, 145, 60) && (ChatRoomStruggleData != null) && ChatRoomStruggleData.AllowLoosen)
		return StruggleChatRoomLoosenStart();

	// If the user wants to stop struggling (smaller button)
	if (MouseIn(1850, 0, 145, 60) && (ChatRoomStruggleData != null) && ChatRoomStruggleData.AllowLoosen)
		return StruggleChatRoomStop();

	// If the user wants to stop struggling (big button)
	if (MouseIn(1800, 0, 195, 60) && (ChatRoomStruggleData != null) && !ChatRoomStruggleData.AllowLoosen)
		return StruggleChatRoomStop();

}

/**
 * The handler for the "Kneel" top menu button
 */
function ChatRoomToggleKneel() {
	let status = 0;
	if (Player.IsKneeling()) {
		status = Math.max(...PoseAllStanding.map(p => PoseCanChangeUnaidedStatus(Player, p)));
	} else if (Player.IsStanding()) {
		status = Math.max(...PoseAllKneeling.map(p => PoseCanChangeUnaidedStatus(Player, p)));
	}

	switch (status) {
		case PoseChangeStatus.ALWAYS: {
			const PlayerIsKneeling = Player.IsKneeling();
			const Dictionary = new DictionaryBuilder()
				.sourceCharacter(Player)
				.build();
			ServerSend("ChatRoomChat", { Content: PlayerIsKneeling ? "StandUp" : "KneelDown", Type: "Action", Dictionary });
			PoseSetActive(Player, PlayerIsKneeling ? "BaseLower" : "Kneel");
			ChatRoomStimulationMessage("Kneel");
			ServerSend("ChatRoomCharacterPoseUpdate", { Pose: Player.ActivePose });
			return;
		}

		case PoseChangeStatus.ALWAYS_WITH_STRUGGLE: {
			if (ChatRoomGetUpTimer !== 0) {
				return;
			}

			// If the player can theoretically get up, we start a minigame!
			let diff = 0;
			if (Player.IsBlind()) diff += 1;
			if (Player.IsKneeling()) diff += 2;
			if (Player.IsDeaf()) diff += 1;
			if (InventoryGet(Player, "ItemTorso") || InventoryGroupIsBlocked(Player, "ItemTorso")) diff += 1;
			if (InventoryGroupIsBlocked(Player, "ItemHands")) diff += 1;
			if (InventoryGet(Player, "ItemArms")) diff += 1;
			if (InventoryGet(Player, "ItemLegs") || InventoryGroupIsBlocked(Player, "ItemLegs")) diff += 1;
			if (InventoryGet(Player, "ItemFeet") || InventoryGroupIsBlocked(Player, "ItemFeet")) diff += 1;
			if (InventoryGet(Player, "ItemBoots")) diff += 2;

			// 9 is the maximum difficulty, beyond 9 the struggle mini-game doesn't work
			if (diff > 9) diff = 9;

			// Starts the mini-game
			MiniGameStart("GetUp", diff, "ChatRoomAttemptStandMinigameEnd");
			return;

		}
	}
}

/**
 * The handler for the "Wardrobe" button
 */
function ChatRoomOpenWardrobeScreen() {
	if (Player.CanChangeOwnClothes()) {
		ChatRoomAppearanceLoadCharacter(Player);
	}
}

/**
 * The handler for the "Profile" button
 */
function ChatRoomOpenInformationScreen() {
	ChatRoomStatusUpdate("Preference");
	InformationSheetLoadCharacter(Player);
}

/**
 * The handler for the "Admin" button
 */
function ChatRoomOpenAdminScreen() {
	if ((ChatRoomData != null) && ChatRoomIsPrivate() && (ChatSearchReturnToScreen == "AsylumGGTS")) {
		AsylumGGTSMessage("NoAdminPrivate");
		return;
	}
	if ((ChatRoomData != null) && ChatRoomIsLocked() && (ChatRoomData.Game == "GGTS")) {
		AsylumGGTSMessage("NoAdminLocked");
		return;
	}

	ChatRoomStatusUpdate("Preference");
	ChatAdminShowEdit(ChatRoomData);
}

/**
 * Process chat room menu button clicks
 * @type {MouseEventListener}
 */
function ChatRoomMenuClick(event) {
	const Space = 992 / (ChatRoomMenuButtons.length);
	for (let B = 0; B < ChatRoomMenuButtons.length; B++) {
		if (MouseXIn(1005 + Space * B, Space - 2)) {
			switch (ChatRoomMenuButtons[B]) {
				case "Exit": {
					ChatRoomAttemptLeave();
					break;
				}
				case "Cut": {
					const roomSeps = document.querySelectorAll("#TextAreaChatLog .chat-room-sep");
					switch (roomSeps.length) {
						case 0:
							// No room separators? Move along
							break;
						case 1: {
							// We got one room separator (the current room): remove all but 20 messages
							const roomSep = roomSeps[0];
							const parent = roomSep.parentElement;
							while (roomSep.nextSibling && parent.childElementCount > 20) {
								parent.removeChild(roomSep.nextSibling);
							}
							break;
						}
						default: {
							// We got multiple room separators:
							// remove all content belong the first room or, if shift is pressed, all but the last room
							const roomSep = event.shiftKey ? roomSeps[roomSeps.length - 1] : roomSeps[1];
							const parent = roomSep.parentElement;
							while (roomSep.previousSibling) {
								parent.removeChild(roomSep.previousSibling);
							}
							break;
						}
					}
					ElementScrollToEnd("TextAreaChatLog");
					break;
				}
				case "GameOption":
					// The cut button can become the game option button if there's an online game going on
					CommonSetScreen("Online", /** @type {ModuleScreens["Online"]} */("Game" + ChatRoomData.Game));
					break;
				case "Kneel":
					ChatRoomToggleKneel();
					break;
				case "Icons":
					// When the user toggles icon visibility
					ChatRoomHideIconState += 1;
					if (ChatRoomHideIconState > 3) ChatRoomHideIconState = 0;
					break;
				case "ClearFocus":
					// When the user wants to exit focus mode (clear their focus list)
					ChatRoomDrawFocusListClear();
					break;
				case "Camera":
					// When the user takes a photo of the room
					ChatRoomPhotoFullRoom();
					break;
				case "Dress":
					ChatRoomOpenWardrobeScreen();
					break;
				case "Profile":
					ChatRoomOpenInformationScreen();
					break;
				case "RoomAdmin":
					ChatRoomOpenAdminScreen();
					break;
				case "CustomizationOn":
					ChatRoomCustomized = true;
					ChatRoomCustomizationClear();
					break;
				case "CustomizationOff":
					ChatRoomCustomized = false;
					ChatRoomCustomizationClear();
					break;
				case "CharacterView":
					ChatRoomActivateView(ChatRoomCharacterViewName);
					break;
				case "MapView":
					ChatRoomActivateView(ChatRoomMapViewName);
					break;
				case "NextCharacters":
					ChatRoomCharacterViewOffset = 10;
					ChatRoomUpdateDisplay();
					break;
				case "PreviousCharacters":
					ChatRoomCharacterViewOffset = 0;
					ChatRoomUpdateDisplay();
					break;
			}
		}
	}
}

function ChatRoomAttemptStandMinigameEnd() {

	if (MiniGameVictory)  {
		if (MiniGameType == "GetUp"){
			const Dictionary = new DictionaryBuilder()
				.sourceCharacter(Player)
				.build();
			ServerSend("ChatRoomChat", { Content: (!Player.IsKneeling()) ? "KneelDownPass" : "StandUpPass", Type: "Action", Dictionary });
			PoseSetActive(Player, (!Player.IsKneeling()) ? "Kneel" : null, true);
			ServerSend("ChatRoomCharacterPoseUpdate", { Pose: Player.ActivePose });
		}
	} else {
		if (MiniGameType == "GetUp") {
			ChatRoomGetUpTimer = CurrentTime + 15000;
			const Dictionary = new DictionaryBuilder()
				.sourceCharacter(Player)
				.build();
			ServerSend("ChatRoomChat", { Content: (!Player.IsKneeling()) ? "KneelDownFail" : "StandUpFail", Type: "Action", Dictionary });
			if (!Player.IsKneeling()) {
				CharacterSetFacialExpression(Player, "Eyebrows", "Soft", 15);
				CharacterSetFacialExpression(Player, "Blush", "Medium", 15);
				CharacterSetFacialExpression(Player, "Eyes", "Dizzy", 15);
			}
		}
	}

	CommonSetScreen("Online", "ChatRoom");
}

/**
 * Checks if the given chat room visibility property causes it to be "private" (has any form of visibility control)
 * @param {ServerChatRoomData | ServerChatRoomSearchData | ServerChatRoomSettings} room - The visibility property to check
 * @returns {boolean} - Returns TRUE if the room is private. FALSE otherwise, or visibility is not set.
 */
function ChatRoomDataIsPrivate(room) {
	return !CommonArraysEqual(room.Visibility, ChatRoomVisibilityMode.PUBLIC);
}

/**
 * Checks if the current chat room is "private" (has any form of visibility control)
 * @returns {boolean} - Returns TRUE if the room is private. FALSE otherwise, or if room doesn't exist.
 */
function ChatRoomIsPrivate() {
	return ChatRoomDataIsPrivate(ChatRoomData);
}

/**
 * Checks if the given chat room access property causes it to be "locked" (has any form of access control)
 * @param {ServerChatRoomData | ServerChatRoomSearchData | ServerChatRoomSettings} room - The access property to check
 * @returns {boolean} - Returns TRUE if the room is locked. FALSE otherwise, or access is not set.
 */
function ChatRoomDataIsLocked(room) {
	return !CommonArraysEqual(room.Access, ChatRoomAccessMode.PUBLIC);
}

/**
 * Checks if the current chat room is "locked" (has any form of access control)
 * @returns {boolean} - Returns TRUE if the room is locked. FALSE otherwise, or if room doesn't exist.
 */
function ChatRoomIsLocked() {
	return ChatRoomDataIsLocked(ChatRoomData);
}

/**
 * Checks if a given character has the needed permissions for a specific role
 * @param {Character} C - The character to check
 * @param {ServerChatRoomData} room - The roles to check
 * @param {"visible"|"access"} role
 * @returns {boolean} - Returns TRUE if the character matches any role. FALSE otherwise.
 */
function ChatRoomCharacterHasAnyRole(C, room, role) {
	if (C == null || room == null) return false;
	let perms;
	switch (role) {
		case "visible":
			perms = room.Visibility;
			break;
		case "access":
			perms = room.Access;
			break;
		default:
			return false;
	}
	if (perms.includes("All")) return true;
	if (perms.includes("Admin") && ChatRoomCharacterIsAdmin(C)) return true;
	if (perms.includes("Whitelist") && ChatRoomCharacterIsWhitelisted(C)) return true;
	return false;
}

/**
 * Checks if a given character can see the room (meets the visibility list requirements)
 * @param {Character} C - The character to check
 * @returns {boolean} - Returns TRUE if the player can see the room.
 */
function ChatRoomCharacterCanSeeRoom(C) { return ChatRoomCharacterHasAnyRole(C, ChatRoomData, "visible"); }

/**
 * Checks if the player can see the room (meets the visibility list requirements)
 * @returns {boolean} - Returns TRUE if the player can see the room.
 */
function ChatRoomPlayerCanSeeRoom() { return ChatRoomCharacterCanSeeRoom(Player); }

/**
 * Checks if the current character can see the room (meets the visibility list requirements)
 * @returns {boolean} - Returns TRUE if the current character can see the room.
 */
function ChatRoomCurrentCharacterCanSeeRoom() { return ChatRoomCharacterCanSeeRoom(CurrentCharacter); }

/**
 * Checks if a given character has access to the room (can enter/leave) (meets the access list requirements)
 * @param {Character} C - The character to check
 * @returns {boolean} - Returns TRUE if the player has access to the room.
 */
function ChatRoomCharacterCanAccessRoom(C) { return ChatRoomCharacterHasAnyRole(C, ChatRoomData, "access"); }

/**
 * Checks if the player has access to the room (can enter/leave) (meets the access list requirements)
 * @returns {boolean} - Returns TRUE if the player has access to the room.
 */
function ChatRoomPlayerCanAccessRoom() { return ChatRoomCharacterCanAccessRoom(Player); }

/**
 * Checks if the current character has access to the room (can enter/leave) (meets the access list requirements)
 * @returns {boolean} - Returns TRUE if the current character has access to the room.
 */
function ChatRoomCurrentCharacterCanAccessRoom() { return ChatRoomCharacterCanAccessRoom(CurrentCharacter); }

/**
 * Checks if the player can leave the chatroom.
 * @returns {boolean} - Returns TRUE if the player can leave the current chat room.
 */
function ChatRoomCanLeave() {
	if (ChatRoomLeashPlayer != null) { // Cannot leave if leashed
		if (ChatRoomCanBeLeashedBy(0, Player)) {
			return false;
		} else ChatRoomLeashPlayer = null;
	}
	if (!Player.CanWalk()) return false; // Cannot leave if cannot walk
	if ((ChatRoomData.Game == "Prison") && PandoraPenitentiaryIsInmate(Player)) return false; // Cannot leave if locked down in Pandora Penitentiary
	if (ChatRoomIsLocked() && (ChatRoomData.Game == "GGTS")) return false; // GGTS game can forbid anyone to leave
	if (ChatRoomActiveView.CanLeave && !ChatRoomActiveView.CanLeave()) return false;
	if (ChatRoomPlayerCanAccessRoom()) return true;
	for (let C = 0; C < ChatRoomCharacter.length; C++)
		if (ChatRoomData.Admin.indexOf(ChatRoomCharacter[C].MemberNumber) >= 0)
			return false; // Cannot leave if the room is locked and there's an administrator inside
	return true; // Can leave if the room is locked and there's no administrator inside
}

/** When slowed, we can't leave quicker than this */
const ChatRoomSlowLeaveMinTime = 5000;

/**
 * Calculates the slow leave duration
 *
 * @param {number} level - The slow level
 * @param {number} skill - The evasion skill level
 * @param {number} min - The minimum cap
 * @returns {number} The slow leave duration
 */
function ChatRoomSlowLeaveDuration(level, skill, min) {
	const timerLength = min + 2000 * level;
	const evasionModifier = 500 * skill;
	const leaveTime = Math.round(Math.max(min, timerLength - evasionModifier));
	return leaveTime;
}

function ChatRoomAttemptLeave() {
	// Check that we can actually exit the room
	if (!ChatRoomCanLeave()) return;

	if (Player.IsSlow()) {
		const Dictionary = new DictionaryBuilder()
			.sourceCharacter(Player)
			.build();
		if (ChatRoomSlowtimer !== 0) {
			// Timer is already running, cancel it
			ServerSend("ChatRoomChat", { Content: "SlowLeaveCancel", Type: "Action", Dictionary });
			ChatRoomSlowLeaveCancel();
		} else {
			ServerSend("ChatRoomChat", { Content: "SlowLeaveAttempt", Type: "Action", Dictionary });
			ChatRoomStatusUpdate("Crawl");
			ChatRoomSlowtimer = CurrentTime + ChatRoomSlowLeaveDuration(Player.GetSlowLevel(), SkillGetLevel(Player, "Evasion"), ChatRoomSlowLeaveMinTime);
		}
	} else {
		ChatRoomLeave();
		CommonSetScreen("Online", "ChatSearch");
	}
}

/**
 * Whether the player is currently leaving slowly
 */
function ChatRoomIsLeavingSlowly() {
	return ChatRoomSlowtimer !== 0 && CurrentTime < ChatRoomSlowtimer;
}

/**
 * Cancel our attempt at leaving slowly
 */
function ChatRoomSlowLeaveCancel() {
	if (!ChatRoomIsLeavingSlowly()) return;
	ChatRoomSlowtimer = 0;
	ChatRoomSlowStop = false;
}

/**
 * Processing function for the slow-leave "state machine"
 */
function ChatRoomProcessSlowLeave() {
	if (ChatRoomSlowtimer === 0) {
		// Timer isn't running, skip
		return;
	}

	if (!ChatRoomCanLeave()) {
		// Something blocked us from leaving
		const Dictionary = new DictionaryBuilder()
			.sourceCharacter(Player)
			.build();
		ServerSend("ChatRoomChat", { Content: "SlowLeaveInterrupt", Type: "Action", Dictionary });
		ServerSend("ChatRoomChat", { Content: "SlowLeaveInterrupt", Type: "Hidden", Dictionary });
		ChatRoomSlowLeaveCancel();
	} else if (ChatRoomSlowStop) {
		// We were stopped by someone, reset
		console.log(`stopped from leaving`);
		ChatRoomSlowLeaveCancel();
	} else if (!Player.IsSlow() || CurrentTime > ChatRoomSlowtimer) {
		// We're not slowed anymore, or the slow timer expired, exit
		ChatRoomLeave();
		CommonSetScreen("Online", "ChatSearch");
	}
}

/**
 * Make the player exit from the current chatroom
 * @param {boolean} clearCharacters - Whether the online character cache should be cleared
 */
function ChatRoomLeave(clearCharacters = false) {
	ChatRoomCustomizationClear();
	OnlineGameReset();
	ChatRoomGame = "";
	ChatRoomSlowtimer = 0;
	ChatRoomSlowStop = false;
	DialogLentLockpicks = false;
	ChatRoomData = null;
	Player.MapData = null;
	ChatRoomCharacter = [];
	ChatRoomJustEntered = false;
	ChatRoomDrawFocusList = [];
	ChatRoomMapViewTileFog = null;
	ChatRoomMapViewObjectFog = null;
	ChatRoomSetTarget(-1);
	ChatRoomClearAllElements();
	ChatRoomSetLastChatRoom(null);
	ServerSend("ChatRoomLeave", "");
	if (clearCharacters)
		CharacterDeleteAllOnline();
}

/**
 * Keyboard handler for keys common to all subviews
 * @type {KeyboardEventListener}
 */
function ChatRoomCommonKeyDown(event) {
	if (CommonIsMobile && CommonKey.IsPressed(event, "Enter", 0)) {
		event.preventDefault();
		ChatRoomSendChat();
		return true;
	};

	return false;
}

/**
 * Handles keyboard shortcuts in the chatroom screen.
 * @type {KeyboardEventListener}
 */
function ChatRoomKeyDown(event) {
	if (ChatRoomCommonKeyDown(event)) {
		return true;
	} else if (ChatRoomActiveView.KeyDown && ChatRoomActiveView.KeyDown(event)) {
		return true;
	}

	if (
		document.activeElement === null
		|| document.activeElement === document.body
		|| document.activeElement.id === "MainCanvas"
	) {
		const chatInput = /** @type {HTMLTextAreaElement} */(document.getElementById("InputChat"));
		const chatLog = /** @type {HTMLDivElement} */(document.getElementById("TextAreaChatLog"));
		if (!chatLog || !chatInput) {
			return false;
		}

		if (CommonKey.NavigationKeyDown(chatLog, event, (el) => el.clientHeight * 0.05)) {
			return true;
		} else if (CommonKey.InputKeyDown(chatInput, event, { allowCtrlA: false })) {
			return true;
		}
	}

	return false;
}

/**
 * @type {ClipboardEventListener}
 */
function ChatRoomPaste(event) {
	const chatInput = /** @type {HTMLTextAreaElement} */(document.getElementById("InputChat"));
	CommonKey.InputPaste(chatInput, event);
}

/**
 * Handles keyboard up event shortcuts in the chatroom screen.
 * @type {KeyboardEventListener}
 */
function ChatRoomKeyUp(event) {
	if (ChatRoomActiveView.KeyUp && ChatRoomActiveView.KeyUp(event)) {
		return true;
	}
	return false;
}

/**
 * Scroll through the chat history
 *
 * @param {boolean} up Whether to scroll up or down
 * @returns {void}
 */
function ChatRoomScrollHistory(up) {
	if (up && ChatRoomLastMessageIndex > 0) {
		ChatRoomLastMessageIndex--;
	} else if (!up && ChatRoomLastMessageIndex < ChatRoomLastMessage.length) {
		ChatRoomLastMessageIndex++;
	}
	ElementValue("InputChat", ChatRoomLastMessage[ChatRoomLastMessageIndex]);
}

/**
 * Sends the chat message to the room
 * @returns {void} - Nothing.
 */
function ChatRoomSendChat() {
	const inputChat = /** @type {null | HTMLTextAreaElement} */(document.getElementById("InputChat"));
	if (!inputChat) {
		return;
	}

	// If there's a message to send
	let msg = inputChat.value.trim();
	if (!msg.length) return;

	// Keeps the chat log in memory so it can be accessed with pageup/pagedown
	ChatRoomLastMessage.push(msg);
	ChatRoomLastMessageIndex = ChatRoomLastMessage.length;

	// Handle a possible command
	const parsed = CommandParse(msg);
	if (typeof parsed === "string") {
		msg = parsed;
	} else {
		return;
	}

	// Maximum of 1000 characters sent
	if (msg.length > ServerChatMessageMaxLength) return;

	// Emote parsing
	if (msg.startsWith("*") || (Player.ChatSettings.MuStylePoses && msg.startsWith(":") && msg.length > 3)) {
		ChatRoomSendEmote(msg);
		inputChat.value = "";
		inputChat.dispatchEvent(new InputEvent("input"));
		return;
	}

	// GGTS chat parser for completing tasks
	AsylumGGTSChatToParse = msg;

	let clearChat = false;
	// Check if this is a whisper
	let whisperStatus = ChatRoomSendWhisper(ChatRoomTargetMemberNumber, msg);
	if (whisperStatus === "target-gone") {
		ChatRoomSendLocal(`<span style="color: red">${TextGet("WhisperTargetGone")}</span>`);
		return;
	} else if (whisperStatus === "target-out-of-range") {
		ChatRoomSendLocal(`<span style="color: red">${TextGet("WhisperTargetOutOfRange")}</span>`);
		return;
	} else if (whisperStatus) {
		clearChat = true;
	} else {
		// This must be a regular chat message
		const status = ChatRoomSendChatMessage(msg);
		if (status) {
			clearChat = true;
		}
	}

	if (clearChat) {
		inputChat.value = "";
		inputChat.dispatchEvent(new InputEvent("input"));
	}
}

/**
 * Send a player message to the server
 *
 * This function automatically formats and sends the message with all the information
 * needed to reconstruct it on the receiver.
 *
 * @param {"Chat"|"Whisper"|"Emote"} type
 * @param {string} msg
 * @param {string} [replyId]
 * @return {ServerChatRoomMessage}
 */
function ChatRoomGenerateChatRoomChatMessage(type, msg, replyId) {
	const Dictionary = new DictionaryBuilder()
		.sourceCharacter(Player)
		.build();
	if (type === "Chat" || type === "Whisper") {
		// Ensure the last OOC content range is closed with a )
		const lastRange = SpeechGetOOCRanges(msg).pop();
		if (
			Player.ChatSettings.OOCAutoClose
			&& lastRange !== undefined
			&& msg.charAt(lastRange.start + lastRange.length - 1) !== ")"
			&& lastRange.start + lastRange.length === msg.length
			&& lastRange.length !== 1) {
			msg += ")";
		}

		const originalMsg = msg;
		// Chat messages are always garbled, unless the no speech restriction is lifted
		const process = SpeechTransformProcess(Player, originalMsg, SpeechTransformSenderEffects);
		msg = process.text;

		// We always garble, but if "no speech garbling" is enabled,
		// we also send down the ungarbled message if it's different
		if (Player.RestrictionSettings.NoSpeechGarble && msg !== originalMsg) {
			Dictionary.push({ Effects: process.effects, Original: originalMsg });
		}
	}

	if (replyId) {
		Dictionary.push({ ReplyId: replyId, Tag: "ReplyId" });
		ChatRoomMessageReplyStop();
	}
	return { Content: msg, Type: type, Dictionary };
}

/**
 * Send a specific chat message to the room
 * @param {string} msg
 * @returns
 */
function ChatRoomSendChatMessage(msg) {
	// Regular chat can be prevented with an owner presence rule, also validates for forbidden words
	if (ChatRoomOwnerPresenceRule("BlockTalk", null)) return false;
	if (!ChatRoomOwnerForbiddenWordCheck(msg)) return false;
	const replyId = ChatRoomMessageGetReplyId();
	const data = ChatRoomGenerateChatRoomChatMessage("Chat", msg, replyId);
	ServerSend("ChatRoomChat", data);

	const firstOOCRange = SpeechGetOOCRanges(msg).shift();
	if (!firstOOCRange || firstOOCRange.start > 0) ChatRoomStimulationMessage("Talk");
	return true;
}

/**
 * Send a whisper to a specific character
 * @param {number} targetNumber
 * @param {string} msg
 */
function ChatRoomSendWhisper(targetNumber, msg) {
	if (targetNumber < 0) return false;
	const targetChar = ChatRoomCharacter.find(C => C.MemberNumber === targetNumber);
	if (!targetChar) return "target-gone";

	if (ChatRoomMapViewIsActive() && !ChatRoomMapViewCharacterOnWhisperRange(targetChar) && !ChatRoomMapViewHasSuperPowers()) {
		return "target-out-of-range";
	}

	const replyId = ChatRoomMessageGetReplyId();
	const data = ChatRoomGenerateChatRoomChatMessage("Whisper", msg, replyId);
	data.Target = targetNumber;
	ServerSend("ChatRoomChat", data);

	// We're self-whispering, and that would cause two messages to show up
	// (one added below, the other added when it gets received).
	// Skip this one if that's the case
	if (targetChar.IsPlayer()) return true;
	data.Sender = Player.MemberNumber;

	ChatRoomMessage(data);
	return true;
}

/**
 * Sends message to user with HTML tags
 * @param {string} Content - InnerHTML for the message
 * @param {number} [Timeout] - total time to display the message in ms
 * @returns {void} - Nothing
 */
function ChatRoomSendLocal(Content, Timeout) {
	if (!ServerPlayerIsInChatRoom()) return;
	ChatRoomMessage({
		Sender: Player.MemberNumber,
		Type: "LocalMessage",
		Content, Timeout,
	});
}

/**
 * Removes (*) (/me) (/action) then sends message as emote
 * @param {string} msg - Emote message
 * @returns {void} - Nothing
 */
function ChatRoomSendEmote(msg) {
	// Emotes can be prevented with an owner presence rule
	if (ChatRoomOwnerPresenceRule("BlockEmote", null)) return;

	const match = msg.match(/^(\*|\/attempt )(\d{0,2}|100)%(.+)/);

	if (match) {
		msg = msg.replace(/^(\*|\/attempt )(\d{0,2}|100)%/, "");
		msg = msg.trim();
		if (msg == "") return;

		const chance = parseInt(match[2] ? match[2] : 50);
		const random = parseInt(Math.random() * 100);

		const attemptSucceeded = random <= chance;
		msg += attemptSucceeded ? ": ✔" : ": ❌";
		msg += " (" + chance + "%)";
	} else if (Player.ChatSettings.MuStylePoses && msg.startsWith(":")) {
		msg = msg.substring(1);
	} else {
		msg = msg.replace(/^\*/, "").replace(/\*$/, "");
	}
	msg = msg.trim();
	if (msg == "" || msg == "*") return;
	const replyId = ChatRoomMessageGetReplyId();
	const data = ChatRoomGenerateChatRoomChatMessage("Emote", msg, replyId);
	ServerSend("ChatRoomChat", data);
}

/**
 * Sends message as attempt emote. Emote can be failed or succeeded.
 * @param {string} msg - Emote message
 * @deprecated
 * @returns {void} - Nothing
 */
function ChatRoomSendAttemptEmote(msg) {
	ChatRoomSendEmote(msg);
}

/**
 * Publishes common player actions (add, remove, swap) to the rest of the chatroom.
 *
 * Note that this will *not* update the server database,
 * which requires either {@link CharacterRefresh}, {@link ServerPlayerAppearanceSync} or {@link ChatRoomCharacterUpdate}.
 *
 * @param {Character} C - Character on which the action is done.
 * @param {string} Action - Action modifier
 * @param {Item | null} PrevItem - The item that has been removed.
 * @param {Item | null} NextItem - The item that has been added.
 * @returns {boolean} - whether we published anything to the chat.
 */
function ChatRoomPublishAction(C, Action, PrevItem, NextItem) {
	// This can't use ServerPlayerIsInChatRoom because wardrobe changes can cause those to bleed through
	if (CurrentScreen !== "ChatRoom") return false;

	const dictionary = new DictionaryBuilder()
		.sourceCharacter(Player)
		.destinationCharacter(C)
		.targetCharacter(C);

	/** @type {AssetGroupName | null} */
	let groupName = C.FocusGroup?.Name;
	if (PrevItem != null) {
		groupName ??= PrevItem.Asset.Group.Name;
		dictionary.asset(PrevItem.Asset, "PrevAsset", PrevItem.Craft && PrevItem.Craft.Name);
	}
	if (NextItem != null) {
		groupName ??= NextItem.Asset.Group.Name;
		dictionary.asset(NextItem.Asset, "NextAsset", NextItem.Craft && NextItem.Craft.Name);
	}
	dictionary.focusGroup(groupName);

	// Prepares the item packet to be sent to other players in the chatroom
	ChatRoomCharacterItemUpdate(C, groupName);

	// Sends the result to the server and leaves the dialog if we need to
	ServerSend("ChatRoomChat", { Content: Action, Type: "Action", Dictionary: dictionary.build() });

	return true;
}

/**
 * Updates an item on character for everyone in a chat room - replaces ChatRoomCharacterUpdate to cut on the lag.
 *
 * Note that this will *not* update the server database,
 * which requires either {@link CharacterRefresh}, {@link ServerPlayerAppearanceSync} or {@link ChatRoomCharacterUpdate}.
 *
 * @param {Character} C - Character to update.
 * @param {AssetGroupName} [Group] - Item group to update.
 * @returns {void} - Nothing.
 */
function ChatRoomCharacterItemUpdate(C, Group) {
	if (!ServerPlayerIsInChatRoom()) return;
	Group ??= C.FocusGroup?.Name;
	if (!Group) return;

	// Single item updates aren't sent back to the source member, so update the ChatRoomData accordingly
	if (ChatRoomData?.Character) {
		const characterIndex = ChatRoomData.Character.findIndex((char) => char.MemberNumber === C.MemberNumber);
		if (characterIndex !== -1) {
			ChatRoomData.Character[characterIndex].Appearance = ServerAppearanceBundle(C.Appearance);
		}
	}

	const Item = InventoryGet(C, Group);
	/** @type {ServerCharacterItemUpdate} */
	const P = {
		Target: C.MemberNumber,
		Group: Group,
		Name: (Item != null) ? Item.Asset.Name : undefined,
		Color: (Item != null && Item.Color != null) ? Item.Color : "Default",
		Difficulty: (Item != null) ? Item.Difficulty - Item.Asset.Difficulty : SkillGetWithRatio(Player, "Bondage"),
		Property: ((Item != null) && (Item.Property != null)) ? Item.Property : undefined,
		Craft: ((Item != null) && (Item.Craft != null)) ? Item.Craft : undefined,
	};
	ServerSend("ChatRoomCharacterItemUpdate", P);
}

/**
 * Updates an item on a character for everyone in a chat room, for expression changes only.
 *
 * Note that this will *not* update the server database,
 * which requires either {@link CharacterRefresh}, {@link ServerPlayerAppearanceSync} or {@link ChatRoomCharacterUpdate}.
 *
 * @param {Character} C
 * @param {ExpressionGroupName} Group
 */
function ChatRoomCharacterExpressionUpdate(C, Group) {
	if (!ServerPlayerIsInChatRoom() || !C.IsPlayer()) return;
	const item = InventoryGet(C, Group);
	if (!item) return;

	const Name = item.Property ? item.Property.Expression : null;
	ServerSend("ChatRoomCharacterExpressionUpdate", { Name, Group, Appearance: ServerAppearanceBundle(C.Appearance) });
}

/**
 * Publishes a custom action to the rest of the chatroom.
 *
 * Note that this will *not* update the server database,
 * which requires either {@link CharacterRefresh}, {@link ServerPlayerAppearanceSync} or {@link ChatRoomCharacterUpdate}.
 *
 * @param {string} msg - Tag of the action to send
 * @param {boolean} LeaveDialog - Whether or not the dialog should be left.
 * @param {ChatMessageDictionary} Dictionary - Dictionary of tags and data to send
 *     to the room.
 * @returns {void} - Nothing.
 */
function ChatRoomPublishCustomAction(msg, LeaveDialog, Dictionary) {
	// This can't use ServerPlayerIsInChatRoom because wardrobe changes can cause those to bleed through
	if (CurrentScreen !== "ChatRoom") return;
	ServerSend("ChatRoomChat", { Content: msg, Type: "Action", Dictionary });
	const C = CharacterGetCurrent();
	if (C) ChatRoomCharacterItemUpdate(C);
	if (LeaveDialog && (C != null)) DialogLeave();
}

/**
 * Pushes the new character data/appearance to everyone else in a chat room and updates the server database.
 *
 * Note that this will *not* update the server database,
 * which requires either {@link CharacterRefresh} or {@link ServerPlayerAppearanceSync}.
 *
 * @param {Character} C - Character to update.
 * @returns {void} - Nothing.
 */
function ChatRoomCharacterUpdate(C) {
	if (!ServerPlayerIsInChatRoom()) return;
	if (ChatRoomAllowCharacterUpdate) {
		const data = {
			ID: C.CharacterID,
			ActivePose: C.ActivePose,
			Appearance: ServerAppearanceBundle(C.Appearance)
		};
		ServerSend("ChatRoomCharacterUpdate", data);
	}
}

/**
 * Regex used to split out a string at word boundaries
 *
 * Note that due to a bug in Safari, we can't use the one that handles chinese characters properly.
 */
// const mentionNameSplitter = /(?<=[^\w\u0000\u007F])|(?=[^\w\u0000\u007F])/gu;
const mentionNameSplitter = /\b/gu;

/**
 * Checks if the message contains mentions of the character. Case-insensitive.
 * @param {Character} C - Character to check mentions of
 * @param {string} msg - The message to check for mentions
 * @returns {boolean} - msg contains mention of C
 */
function ChatRoomMessageMentionsCharacter(C, msg) {
	const normalizeText = (text) => text.normalize('NFKC').toLowerCase();
	const nameParts = normalizeText(C.Name).split(mentionNameSplitter);
	const nickParts = C.Nickname ? normalizeText(C.Nickname).split(mentionNameSplitter) : [];
	const msgParts = normalizeText(msg).split(mentionNameSplitter);
	for (let i = 0; i < msgParts.length - (nameParts.length - 1); i++) {
		if (msgParts[i] === nameParts[0]) {
			let match = true;
			for (let j = 0; j < nameParts.length; j++) {
				if (msgParts[i + j] !== nameParts[j]) {
					match = false;
					break;
				}
			}
			if (match) return true;
		}
		if (msgParts[i] === nickParts[0]) {
			let match = true;
			for (let j = 0; j < nickParts.length; j++) {
				if (msgParts[i + j] !== nickParts[j]) {
					match = false;
					break;
				}
			}
			if (match) return true;
		}
	}
	return false;
}

/**
 * Escapes a given string.
 * @param {string} str - Text to escape.
 * @returns {string} - Escaped string.
 */
function ChatRoomHTMLEntities(str) {
	return String(str).replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;').replace(/"/g, '&quot;');
}

/**
 * Check is the player is either the sender of a message, or its target.
 *
 * @param {ServerChatRoomMessage} data - The chat message to check for involvment.
 * @returns {boolean} true if the player is involved, false otherwise.
 */
function ChatRoomMessageInvolvesPlayer(data) {
	return (data.Sender == Player.MemberNumber
		|| Array.isArray(data.Dictionary) && data.Dictionary.some(d => {
			return IsCharacterReferenceDictionaryEntry(d) && d.MemberNumber === Player.MemberNumber
				|| IsTargetCharacterDictionaryEntry(d) && d.TargetCharacter === Player.MemberNumber
				|| IsSourceCharacterDictionaryEntry(d) && d.SourceCharacter === Player.MemberNumber;
		}));
}

/**
 * Checks whether the given character's interactions are impacted by the player's sensory-deprivation.
 *
 * @param {Character} character - The character to check.
 * @returns true if the player is sensory-deprived from character, false otherwise.
 */
function ChatRoomIsCharacterImpactedBySensoryDeprivation(character) {
	return PreferenceIsPlayerInSensDep() && character.MemberNumber != Player.MemberNumber && (!ChatRoomSenseDepBypass || ChatRoomImpactedBySenseDep.includes(character));
}

/** @type {ChatRoomMessageExtractor[]} */
var ChatRoomMessageExtractors = [
	ChatRoomMessageDefaultMetadataExtractor,
];

/**
 * Global list of handlers for incoming messages.
 * @type {ChatRoomMessageHandler[]}
 * */
var ChatRoomMessageHandlers = [
	{
		Description: "Reset minigame on room updates",
		Priority: -210,
		Callback: (data, _sender, _msg) => {
			if (data.Type === "Action" && data.Content === "ServerUpdateRoom")
				OnlineGameReset();
			return false;
		}
	},
	{
		Description: "Ghosted player handling",
		Priority: -200,
		Callback: (data, _sender, _msg, __metadata) => {
			if (data.Type === "Action" && data.Content === "ServerUpdateRoom")
				return false;

			if (Player.HasOnGhostlist(data.Sender))
				return true;
		}
	},
	{
		Description: "Process status messages",
		Priority: -100,
		Callback: (data, sender, _msg) => {
			if (data.Type == "Status") {
				ChatRoomStatusUpdateLocalCharacter(sender, data.Content);
				return true;
			}
		}
	},
	{
		Description: "Break leash after a server disconnect",
		Priority: -100,
		Callback: (data, sender, _msg) => {
			if (data.Type === "Action" && data.Content.startsWith("ServerDisconnect") && sender.MemberNumber == ChatRoomLeashPlayer)
				ChatRoomLeashPlayer = null;
			return false;
		}
	},
	{
		Description: "Process hidden messages",
		Priority: -1,
		Callback: (data, sender, _msg) => {
			if (data.Type === "Hidden")
				return ChatRoomMessageProcessHidden(data, sender);
		}
	},
	{
		Description: "Emote messages formatting",
		Priority: 0,
		Callback: (data, _sender, msg, metadata) => {
			if (data.Type === "Emote") {
				if (msg.indexOf('*') === 0) {
					// **-message, yank starting *
					msg = msg.substring(1);
				} else {
					// *-message, prepend sender name and a space if needed
					const sep = (msg.indexOf("'") === 0 || msg.indexOf(",") === 0);
					msg = metadata.senderName + (!sep ? " " : "") + msg;
				}
			}

			return { msg: msg };
		}
	},
	{
		Description: "Sensory-deprivation processing",
		Priority: 100,
		Callback: (data, sender, msg, metadata) => {

			// Emotes parsing - Player is under sensory-dep, replace every character name from the message with the placeholder
			if (data.Type == "Emote") {
				if (ChatRoomIsCharacterImpactedBySensoryDeprivation(sender)) {
					metadata.senderName = InterfaceTextGet("Someone");
					msg = SpeechAnonymize(msg, ChatRoomCharacter);
				}
			}

			// Chat parsing - Garble the sender name and adds more garble when deaf
			if (data.Type == "Chat") {
				if (ChatRoomIsCharacterImpactedBySensoryDeprivation(sender)) {
					if (Player.GetDeafLevel() >= 4)
						metadata.senderName = InterfaceTextGet("Someone");
					else {
						const s = SpeechTransformProcess(sender, metadata.senderName, SpeechTransformReceiverEffects);
						metadata.senderName = s.text;
					}
				}
				if (Player.GetDeafLevel() > 0) {
					const s = SpeechTransformProcess(sender, msg, SpeechTransformReceiverEffects);
					msg = s.text;
				}
			}

			return { msg: msg };

		}
	},
	{
		Description: "Save chats and whispers to the chat log",
		Priority: 110,
		Callback: (data, sender, msg, metadata) => {
			if (data.Type == "Chat" || data.Type == "Whisper") {
				if (ChatRoomMapViewIsActive() && !ChatRoomMapViewCharacterIsHearable(sender)) {
					// Respect the map view hearing range
					return false;
				}
				const Original = data.Content;
				if (Player.GetDeafLevel() > 0) {
					const s = SpeechTransformProcess(sender, data.Content, SpeechTransformReceiverEffects);
					data.Content = s.text;
				}
				ChatRoomChatLog.push({ Chat: data.Content, Garbled: msg, Original, SenderName: metadata.senderName, SenderMemberNumber: sender.MemberNumber, Time: CommonTime() });
				if (ChatRoomChatLog.length > 6) ChatRoomChatLog.splice(0, 1);
			}
			return false;
		}
	},
	{
		Description: "Handle action visual effects",
		Priority: 120,
		Callback: (data, sender, msg, metadata) => {
			let intensity = null;
			if (data.Type === "Action" && metadata.ShockIntensity >= 0) {
				intensity = metadata.ShockIntensity;
			} else if (data.Type === "Activity" && data.Content.includes("ShockItem")) {
				intensity = 1.5;
				if (metadata.FocusGroup) {
					let item = InventoryGet(Player, metadata.FocusGroup.Name);
					if (item && item.Property && item.Property.ShockLevel != null) {
						intensity = 1.5 * item.Property.ShockLevel;
					}
				}
			}

			if (intensity !== null && metadata.TargetCharacter.IsPlayer()) {
				const duration = (Math.random() + intensity) * 500;
				DrawFlashScreen("#FFFFFF", duration, 500);
			}

			return false;
		}
	},
	{
		Description: "Hide automatic actions that don't involve the player, per preferences",
		Priority: 200,
		Callback: (data, sender, msg, metadata) => {
			if (data.Type !== "Action")
				return false;

			const IsPlayerInvolved = ChatRoomMessageInvolvesPlayer(data);
			if (metadata.Automatic && !IsPlayerInvolved && !Player.ChatSettings.ShowAutomaticMessages)
				return true;
			return false;
		}
	},
	{
		Description: "Handle stimulation events",
		Priority: 210,
		Callback: (data, sender, msg, metadata) => {
			if (data.Type !== "Action")
				return false;

			const IsPlayerInvolved = ChatRoomMessageInvolvesPlayer(data);
			if (["HelpKneelDown", "HelpStandUp"].includes(data.Content) && IsPlayerInvolved)
				ChatRoomStimulationMessage("Kneel");

			return false;
		}
	},
	{
		Description: "Arousal processing",
		Priority: 210,
		Callback: (data, sender, msg, metadata) => {
			if (
				!["Action", "ServerMessage", "Activity"].includes(data.Type)
				|| !metadata.ActivityName
				|| !metadata.FocusGroup
			) {
				return false;
			}

			const {ActivityCounter, ActivityName, ActivityAsset, FocusGroup, TargetMemberNumber} = metadata;

			const arousalEnabled = (Player.ArousalSettings && (Player.ArousalSettings.Active === "Hybrid" || Player.ArousalSettings.Active === "Automatic"));

			AsylumGGTSActivity(sender, metadata.TargetCharacter, metadata.ActivityName, FocusGroup.Name, metadata.ActivityCounter);

			// If another player is using an item which applies an activity on the current player, apply the effect here
			if (
				arousalEnabled
				&& ActivityName
				&& TargetMemberNumber
				&& TargetMemberNumber === Player.MemberNumber
				&& sender.MemberNumber !== Player.MemberNumber
			) {
				ActivityEffect(sender, Player, ActivityName, FocusGroup.Name, ActivityCounter, ActivityAsset);
			}
			return false;
		}
	},
	{
		Description: "Hide anything per sensory deprivation rules",
		Priority: 300,
		Callback: (data, sender, msg, metadata) => {
			const IsPlayerInvolved = ChatRoomMessageInvolvesPlayer(data);

			const IsPlayerInSensoryDep = Player.ImmersionSettings.SenseDepMessages
				&& PreferenceIsPlayerInSensDep()
				&& Player.GetDeafLevel() >= 4
				&& (!ChatRoomSenseDepBypass || ChatRoomImpactedBySenseDep.includes(sender));

			// When the player is in total sensory deprivation, hide non-whisper messages if the player is not involved
			const IsPlayerMentioned = ChatRoomMessageMentionsCharacter(Player, msg);
			switch (data.Type) {
				case "Whisper":
					return false;
				case "Chat":
					return IsPlayerInSensoryDep && !IsPlayerInvolved && !IsPlayerMentioned && !SpeechGetOOCRanges(msg).length;
				default:
					return IsPlayerInSensoryDep && !IsPlayerInvolved && !IsPlayerMentioned;
			}
		}
	},
	{
		Description: "Hide sexual activity messages, per preferences",
		Priority: 310,
		Callback: (data, sender, msg, metadata) => {
			if (data.Type === "Activity" && (Player.ChatSettings != null) && (Player.ChatSettings.ShowActivities != null) && !Player.ChatSettings.ShowActivities)
				return true;
			return false;
		}
	},
	{
		Description: "Map room hearing distances",
		Priority: 310,
		Callback: (data, sender, msg, metadata) => {
			if (!ChatRoomIsViewActive(ChatRoomMapViewName)) return false;

			// Active super powers let you experience everything
			if (ChatRoomMapViewHasSuperPowers() || metadata.HasSuperPowers) return false;

			let inRange;
			switch (data.Type) {
				case "Action":
				case "Activity":
					inRange = ChatRoomMapViewCharacterIsVisible(sender);
					// Out of range actions/activites shouldn't show at all. They aren't intended to have OOC content.
					if (!inRange) return true;
					break;

				case "Emote":
					inRange = ChatRoomMapViewCharacterIsVisible(sender);
					break;

				case "Chat":
					inRange = ChatRoomMapViewCharacterIsHearable(sender);
					break;
				case "Whisper":
					inRange = ChatRoomMapViewCharacterOnWhisperRange(sender);
					break;
				default:
					// We're okay with everything else
					return false;
			}

			if (inRange) {
				// We're in perception range, let through
				return false;
			}

			// The sender out of range, strip everything that's not OOC
			const oocRanges = SpeechGetOOCRanges(msg);
			let newMessage = "";
			for (let range of oocRanges) {
				newMessage += msg.substring(range.start, range.start+range.length);
			}
			return newMessage.length ? { msg: newMessage } : true;
		}
	},
	{
		Description: "Audio system hook for sound effects",
		Priority: 500,
		Callback: (data, sender, msg, metadata) => AudioPlaySoundForChatMessage(data, sender, msg, metadata),
	},
	{
		Description: "Raise a notification if required",
		Priority: 500,
		Callback: (data, sender, msg, metadata) => {
			const IsPlayerInvolved = ChatRoomMessageInvolvesPlayer(data);
			if ((["Action", "Activity"].includes(data.Type) && IsPlayerInvolved && Player.NotificationSettings.ChatMessage.Activity)
					|| (data.Type === "Chat" && Player.NotificationSettings.ChatMessage.Normal)
					|| (data.Type === "Whisper" && Player.NotificationSettings.ChatMessage.Whisper)
					|| (Player.NotificationSettings.ChatMessage.Mention && ChatRoomMessageMentionsCharacter(Player, msg)))
				ChatRoomNotificationRaiseChatMessage(sender, msg);
			return false;
		}
	},
	{
		Description: "Push message to the chat",
		Priority: 500,
		Callback: (data, sender, msg, metadata) => {
			ChatRoomMessageDisplay(data, msg, sender, metadata);
			return false;
		}
	}
];

/**
 * Adds a function to the list of message extractors.
 *
 * @see ChatRoomMessageExtractor for more info.
 *
 * @param {ChatRoomMessageExtractor} func - The extractor to register
 */
function ChatRoomRegisterMessageExtractor(func) {
	if (typeof func !== "function") {
		console.error("Invalid message extractor registration");
		return;
	}

	ChatRoomMessageExtractors.push(func);
}

/**
 * Adds a function to the list of message handlers
 *
 * @see ChatRoomMessageHandler for more info.
 *
 * @param {ChatRoomMessageHandler} handler - The handler to register
 */
function ChatRoomRegisterMessageHandler(handler) {
	if (!handler || typeof handler.Priority !== "number" || typeof handler.Callback !== "function") {
		console.error("Invalid message handler registration");
		return;
	}

	ChatRoomMessageHandlers.push(handler);
}

/**
 * Performs the processing for an hidden message.
 *
 * @param {ServerChatRoomMessage} data
 * @param {Character} SenderCharacter
 * @returns {boolean}
 */
function ChatRoomMessageProcessHidden(data, SenderCharacter) {
	if (data.Content == "RuleInfoGet") ChatRoomGetLoadRules(SenderCharacter);
	else if (data.Content == "RuleInfoSet") {
		// @ts-expect-error That message uses .Dictionary as storage for LogRecord[]
		ChatRoomSetLoadRules(SenderCharacter, data.Dictionary);
	}
	else if (data.Content.startsWith("StruggleAssist")) {
		let A = parseInt(data.Content.substr("StruggleAssist".length));
		if ((A >= 1) && (A <= 7)) {
			ChatRoomStruggleAssistTimer = CurrentTime + 60000;
			ChatRoomStruggleAssistBonus = A;
		}
	}
	else if (data.Content == "SlowStop") {
		ChatRoomSlowtimer = CurrentTime + 45000;
		ChatRoomSlowStop = true;
	}
	else if (data.Content == "OnlineStruggleInterrupt") {
		StruggleChatRoomEndAmination();
	}
	else if (data.Content.startsWith("MaidDrinkPick")) {
		let A = parseInt(data.Content.substr("MaidDrinkPick".length));
		if ((A == 0) || (A == 5) || (A == 10)) MaidQuartersOnlineDrinkPick(data.Sender, A);
	}
	else if (data.Content.startsWith("PayQuest")) {
		const money = parseInt(data.Content.substring(8));
		ChatRoomPayQuest(data.Sender, money);
	}
	else if (data.Content.startsWith("OwnerRule") || data.Content.startsWith("LoverRule")) {
		ChatRoomSetRule(data);
	}
	else if (data.Content == "HoldLeash") {
		ChatRoomDoHoldLeash(SenderCharacter);
	}
	else if (data.Content == "StopHoldLeash") {
		ChatRoomDoStopHoldLeash(SenderCharacter);
	}
	else if (data.Content == "PingHoldLeash") {
		ChatRoomDoPingLeashedPlayers(SenderCharacter);
	}
	else if (data.Content == "RemoveLeash") {
		ChatRoomDoRemoveLeash(SenderCharacter);
	}
	else if (data.Content == "GiveLockpicks") DialogLentLockpicks = true;
	else if (data.Content == "RequestFullKinkyDungeonData") {
		if (CurrentScreen == "KinkyDungeon") {
			KinkyDungeonStreamingPlayers.push(SenderCharacter.MemberNumber);
			KinkyDungeonSendData(KinkyDungeonPackData(true, true, true, true));
		}
	}
	else if (data.Content == "TakeSuitcase") {
		if (!Player.CanInteract() && ServerChatRoomGetAllowItem(SenderCharacter, Player)) {
			let misc = InventoryGet(Player, "ItemMisc");
			if (KidnapLeagueSearchingPlayers.length == 0) {
				if (misc && misc.Asset && misc.Asset.Name == "BountySuitcase") {
					KidnapLeagueSearchFinishTime = CommonTime() + KidnapLeagueSearchFinishDuration;
					ChatRoomPublishCustomAction("OnlineBountySuitcaseStart", true, [
						{ Tag: "SourceCharacter", Text: CharacterNickname(SenderCharacter), MemberNumber: SenderCharacter.MemberNumber },
						{ Tag: "DestinationCharacterName", Text: CharacterNickname(Player), MemberNumber: Player.MemberNumber },
					]);
				} else if (misc && misc.Asset && misc.Asset.Name == "BountySuitcaseEmpty") {
					KidnapLeagueSearchFinishTime = CommonTime() + KidnapLeagueSearchFinishDuration;
					ChatRoomPublishCustomAction("OnlineBountySuitcaseStartOpened", true, [
						{ Tag: "SourceCharacter", Text: CharacterNickname(SenderCharacter), MemberNumber: SenderCharacter.MemberNumber },
						{ Tag: "DestinationCharacterName", Text: CharacterNickname(Player), MemberNumber: Player.MemberNumber },
					]);
				}
			} else {
				ServerSend("ChatRoomGame", {
					OnlineBounty: {
						finishTime: KidnapLeagueSearchFinishTime,
						target: SenderCharacter.MemberNumber,
					}
				});
			}
			if (!KidnapLeagueSearchingPlayers.includes(SenderCharacter.MemberNumber)) {
				KidnapLeagueSearchingPlayers.push(SenderCharacter.MemberNumber);
			}

		}
	}
	else if (data.Content == "ReceiveSuitcaseMoney") {
		ChatRoomReceiveSuitcaseMoney();
	} else if (data.Content.substr(0, 4) == "GGTS") {
		AsylumGGTSHiddenMessage(SenderCharacter, data.Content, data);
	} else if (data.Content.substr(0, 7) == "Pandora") {
		PandoraPenitentiaryHiddenMessage(SenderCharacter, data.Content);
	} else if (data.Content.startsWith("PortalLink")) {
		PortalLinkProcessMessage(SenderCharacter, data);
	} else if (data.Content == "ClubCardGameConceded") {
		ClubCardPlayerConceded(data.Sender);
	} else if (data.Content == "ClubCardAdminResetGameHidden") {
		ClubCardResetGameStatus();
	} else if (data.Content == "ChatRoomMapViewTeleport") {
		ChatRoomMapViewTeleportHiddenMessage(SenderCharacter, data);
	} else if (data.Content == "ChatRoomMapViewChangeKey") {
		ChatRoomMapViewChangeKeyHiddenMessage(SenderCharacter, data);
	} else if (data.Content == "ChatRoomFriendRequestAdd") {
		ChatRoomFriendMessage(SenderCharacter, data);
	}
	return true;
}

/**
 * Extracts the metadata and message substitutions from a message's dictionary.
 *
 * @param {ServerChatRoomMessage} data - The message to parse.
 * @param {Character} SenderCharacter - The resolved character that sent that message.
 * @returns {{ metadata: IChatRoomMessageMetadata, substitutions: CommonSubtituteSubstitution[] }}
 */
function ChatRoomMessageDefaultMetadataExtractor(data, SenderCharacter) {
	/** @type {CommonSubtituteSubstitution[]} */
	const substitutions = [];
	/** @type {IChatRoomMessageMetadata} */
	const meta = {};

	meta.senderName = CharacterNickname(SenderCharacter);

	if (!data.Dictionary) {
		return { metadata: meta, substitutions };
	}

	// Loop through dictionary entries and extract message metadata & collect substitutions where possible
	for (let entry of data.Dictionary) {
		if (IsSourceCharacterDictionaryEntry(entry)) {
			const {SourceCharacter} = entry;
			const C = Character.find((c) => c.MemberNumber === SourceCharacter);
			if (C) {
				meta.SourceCharacter = C;
				if (ChatRoomData.Admin.includes(C.MemberNumber)) {
					meta.HasSuperPowers = entry.HasSuperPowers ?? false;
				}
			}
		} else if (IsTargetCharacterDictionaryEntry(entry)) {
			const {TargetCharacter, Index} = entry;
			const C = Character.find((c) => c.MemberNumber === TargetCharacter);
			if (C) {
				if (Index) {
					if (!meta.AdditionalTargets) meta.AdditionalTargets = {};
					meta.AdditionalTargets[Index] = C;
				} else {
					meta.TargetCharacter = C;
					meta.TargetMemberNumber = C.MemberNumber;
				}
			}
		} else if (IsCharacterReferenceDictionaryEntry(entry)) {
			const {Tag, MemberNumber} = entry;
			const C = Character.find((c) => c.MemberNumber === MemberNumber);
			if (C) {
				switch (Tag) {
					case "SourceCharacter":
						meta.SourceCharacter = C;
						break;
					case "TargetCharacter":
					case "TargetCharacterName":
					case "DestinationCharacter":
					case "DestinationCharacterName":
						meta.TargetCharacter = C;
						meta.TargetMemberNumber = C.MemberNumber;
				}
			}
		} else if (IsAssetReferenceDictionaryEntry(entry)) {
			const { Tag, GroupName, AssetName, CraftName } = entry;
			const asset = Asset.find(a => a.Name === AssetName && (!GroupName || a.Group.Name === GroupName));
			if (asset) {
				if (!meta.Assets) meta.Assets = {};
				meta.Assets[Tag] = asset;
				if (CraftName) {
					if (!meta.CraftingNames) meta.CraftingNames = {};
					meta.CraftingNames[Tag] = CraftName;
				}
			}
		} else if (IsGroupReferenceDictionaryEntry(entry)) {
			const group = AssetGroupGet("Female3DCG", entry.GroupName);
			if (group) {
				if (!meta.Groups) meta.Groups = {};
				if (!meta.Groups[entry.Tag]) meta.Groups[entry.Tag] = [];
				meta.Groups[entry.Tag].push(group);
			}
		} else if (IsFocusGroupDictionaryEntry(entry)) {
			const group = /** @type {AssetItemGroup} */(AssetGroupGet("Female3DCG", entry.FocusGroupName));
			if (group) {
				meta.FocusGroup = group;
				meta.GroupName = group.Name;
			}
		} else if (IsAssetGroupNameDictionaryEntry(entry)) {
			const group =  /** @type {AssetItemGroup} */ (AssetGroupGet("Female3DCG", entry.AssetGroupName));
			if (group) {
				meta.FocusGroup = group;
				meta.GroupName = group.Name;
			}
		} else if (IsAutomaticEventDictionaryEntry(entry)) {
			meta.Automatic = true;
		} else if (IsShockEventDictionaryEntry(entry)) {
			meta.ShockIntensity = entry.ShockIntensity;
		} else if (IsActivityCounterDictionaryEntry(entry)) {
			meta.ActivityCounter = entry.ActivityCounter;
		} else if (IsActivityNameDictionaryEntry(entry)) {
			meta.ActivityName = entry.ActivityName;
		} else if (IsTextDictionaryEntry(entry)) {
			let {Tag, Text} = entry;
			if (Tag === "ChatRoomName") {
				Text = ChatSearchMuffle(Text);
				meta.ChatRoomName = Text;
			}
			substitutions.push([Tag, Text.toString()]);
		} else if (IsTextLookupDictionaryEntry(entry)) {
			let text = AssetTextGet(entry.TextToLookUp);
			if (!text || text.startsWith(TEXT_NOT_FOUND_PREFIX)) {
				text = InterfaceTextGet(entry.TextToLookUp);
			} else {
				// We lower-case here to blend in asset names in messages
				text = text.toLowerCase();
			}
			substitutions.push([entry.Tag, text]);
		} else if (IsMsgIdDictionaryEntry(entry)) {
			meta.MsgId = entry.MsgId;
		} else if (IsReplyIdDictionaryEntry(entry)) {
			meta.ReplyId = entry.ReplyId;
		}
	}

	// Now collect any additional substitutions from the complete metadata

	// If there's a source character, add substitutions for the SourceCharacter tag
	if (meta.SourceCharacter) {
		substitutions.push(...ChatRoomGetSourceCharacterSubstitutions(data, meta.SourceCharacter));
	}

	// If there's a target character, add substitutions for the various target character tags
	if (meta.TargetCharacter) {
		const isSelf = SenderCharacter.MemberNumber === meta.TargetMemberNumber;
		substitutions.push(...ChatRoomGetTargetCharacterSubstitutions(meta.TargetCharacter, isSelf));
	}

	if (meta.AdditionalTargets) {
		for (const [index, C] of Object.entries(meta.AdditionalTargets)) {
			const isSelf = SenderCharacter.MemberNumber === C.MemberNumber;
			substitutions.push(...ChatRoomGetTargetCharacterSubstitutions(C, isSelf, Number(index)));
		}
	}

	// If there's a focus group, add a substitution for the group name
	if (meta.FocusGroup) {
		substitutions.push(...ChatRoomGetFocusGroupSubstitutions(data, meta.FocusGroup, meta.TargetCharacter));
	}

	// If there are referenced groups, add a substitution for the collected groups under their pluralized tag
	if (meta.Groups) {
		for (const [tag, groups] of Object.entries(meta.Groups)) {
			const groupNames = groups.map(group => {
				if (meta.TargetCharacter) {
					return DialogActualNameForGroup(meta.TargetCharacter, group).toLowerCase();
				}
				return group.Description;
			});
			groupNames.sort((a, b) => a.localeCompare(b));
			substitutions.push([tag + "s", CommonArrayJoinPretty(groupNames)]);
		}
	}

	// If there are referenced assets, substitute asset names
	if (meta.Assets) {
		const character = meta.SourceCharacter || Player;
		// Go over the asset references and collect appropriate substitutions
		for (const [tag, asset] of Object.entries(meta.Assets)) {
			if (tag === "ActivityAsset") {
				meta.ActivityAsset = asset;
			}

			const craftingName = meta.CraftingNames && meta.CraftingNames[tag];
			const assetName = asset.DynamicDescription(character).toLowerCase();
			if (craftingName) {
				substitutions.push([tag, `${craftingName} (${assetName})`]);
			} else {
				substitutions.push([tag, assetName]);
			}
		}
	}

	return { metadata: meta, substitutions };
}

/**
 * Gets a set of dictionary substitutions used when the given character is the source character of a chat message.
 * @param {ServerChatRoomMessage} data - The raw message data
 * @param {Character} character - The source character
 * @returns {CommonSubtituteSubstitution[]} - A list of dictionary substitutions that should be applied
 */
function ChatRoomGetSourceCharacterSubstitutions(data, character) {
	/** @type {CommonSubtituteSubstitution[]} */
	const substitutions = [];
	const isServerEnterLeave = ["ServerEnter", "ServerLeave", "ServerDisconnect"].includes(data.Content);
	let name = CharacterNickname(character);
	const hideIdentity = ChatRoomHideIdentity(character);

	// Alter server messages to show both the name and the nickname
	if (isServerEnterLeave) {
		if (name !== character.Name) {
			name += ` [${character.Name}]`;
		}
		substitutions.push(["SourceCharacter", name]);
	} else if (hideIdentity) {
		name = InterfaceTextGet("Someone");
	}

	substitutions.push(["SourceCharacter", name]);

	const pronounRepls = ChatRoomPronounSubstitutions(character, "Pronoun", hideIdentity);
	substitutions.push(...pronounRepls);
	return substitutions;
}

/**
 * Gets a set of dictionary substitutions used when the given character is the target character of a chat message.
 * @param {Character} character - The target character
 * @param {boolean} isSelf - If true, indicates that the target character is also the sender of the message (i.e. is
 * doing something to themselves)
 * @param {number} [index] - If the character is an additional target, the index that the substitution tags should be
 * given
 * @returns {CommonSubtituteSubstitution[]} - A list of dictionary substitutions that should be applied
 */
function ChatRoomGetTargetCharacterSubstitutions(character, isSelf, index) {
	/** @type {CommonSubtituteSubstitution[]} */
	const substitutions = [];
	const hideIdentity = ChatRoomHideIdentity(character);
	const pronounPossessive = CharacterPronoun(character, "Possessive", hideIdentity);
	const pronounSelf = CharacterPronoun(character, "Self", hideIdentity);
	let destinationCharacter;
	let destinationCharacterName;
	let targetCharacter;
	let targetCharacterName;
	if (hideIdentity) {
		const someone = InterfaceTextGet("Someone").toLowerCase();
		destinationCharacter = isSelf ? pronounPossessive : someone;
		destinationCharacterName = someone;
		targetCharacter = isSelf ? pronounSelf : someone;
		targetCharacterName = someone;
	} else {
		const name = CharacterNickname(character);
		destinationCharacterName = `${name}${InterfaceTextGet("'s")}`;
		destinationCharacter = isSelf ? pronounPossessive : destinationCharacterName;
		targetCharacter = isSelf ? pronounSelf : name;
		targetCharacterName = name;
	}

	const suffix = index ? `${index}` : '';

	substitutions.push(
		[`DestinationCharacter${suffix}`, destinationCharacter],
		[`DestinationCharacterName${suffix}`, destinationCharacterName],
		[`TargetCharacter${suffix}`, targetCharacter],
		[`TargetCharacterName${suffix}`, targetCharacterName],
	);

	const pronounRepls = ChatRoomPronounSubstitutions(character, "TargetPronoun", hideIdentity);
	substitutions.push(...pronounRepls);
	return substitutions;
}

/**
 * Gets a set of dictionary substitutions used for the focus group
 * @param {ServerChatRoomMessage} data - The raw message data
 * @param {AssetGroup} focusGroup - The group being acted upon by the chat message
 * @param {Character} targetCharacter - The target character of the message
 * @returns {[string,string][]} - A list of dictionary substitutions that should be applied
 */
function ChatRoomGetFocusGroupSubstitutions(data, focusGroup, targetCharacter) {
	if (targetCharacter) {
		return [["FocusAssetGroup", DialogActualNameForGroup(targetCharacter, focusGroup).toLowerCase()]];
	} else {
		console.warn(`Received message "${data.Content}" with focus group but no target character, assuming target's biology...`);
		return [["FocusAssetGroup", focusGroup.Description]];
	}
}

/**
 * Extracts all metadata and substitutions requested by a message.
 *
 * This goes through ChatRoomMessageExtractors and calls them in order
 * on the recieved message, collecting their output (metadata & tag substitutions).
 *
 * @param {ServerChatRoomMessage} data
 * @param {Character} sender
 * @returns {{ metadata?: IChatRoomMessageMetadata, substitutions?: CommonSubtituteSubstitution[] }}
 */
function ChatRoomMessageRunExtractors(data, sender) {
	if (!data || !sender) return {};

	let metadata = {};
	let substitutions = [];

	ChatRoomMessageExtractors.forEach(extractor => {
		let extracted = extractor(data, sender);

		if (extracted.metadata && typeof extracted.metadata === "object")
			Object.assign(metadata, extracted.metadata);
		if (extracted.substitutions && Array.isArray(extracted.substitutions))
			substitutions = substitutions.concat(extracted.substitutions);
	});

	return { metadata, substitutions };
}

/**
 * Run the message handlers on a given message.
 *
 * This runs a message and its metadata through the prioritized list
 * of ChatRoomMessageHandlers, and stops processing if one of them
 * requests it, ignoring the rest.
 *
 * @param {"pre"|"post"} type - The type of processing to perform
 * @param {ServerChatRoomMessage} data - The recieved message
 * @param {Character} sender - The actual message sender character object
 * @param {string} msg - The escaped message, likely different from data.Contents
 * @param {IChatRoomMessageMetadata} [metadata] - The message metadata, only available for post-handlers
 * @returns {boolean | string}
 */
function ChatRoomMessageRunHandlers(type, data, sender, msg, metadata) {
	if (!['pre', 'post'].includes(type) || !data || !sender) return;

	// Gather the handlers for the requested processing and sort by priority
	const handlers = ChatRoomMessageHandlers.filter(proc => (type === "pre" && proc.Priority < 0 || type === "post" && proc.Priority >= 0));
	handlers.sort((a, b) => a.Priority - b.Priority);

	// Go through the handlers and show them the message
	const originalMsg = msg;
	const skips = [];
	for (const handler of handlers) {
		// Check if one of the handlers wanted us to skip an oncoming handler
		if (skips.some(s => s(handler)))
			continue;

		const ret = handler.Callback(data, sender, msg, metadata);

		if (typeof ret === "boolean") {
			// Handler wishes to filter, and true means we should stop
			if (ret)
				return true;
			// Fallthrough, keep processing
		} else if (typeof ret === "object") {
			// Handler wishes to transform, collect their result and continue
			const { msg: newMsg, skip: skip } = ret;
			if (newMsg) msg = newMsg;
			if (skip) skips.push(skip);
		}
	}

	// If the message was transformed, return it, otherwise just say we're fine
	return msg === originalMsg ? false : msg;
}

/**
 * Handles the reception of a chatroom message.
 *
 * @see ChatRoomMessageHandler for more information
 * @param {ServerChatRoomMessage} data - Message object containing things like the message type, sender, content, etc.
 * @returns {void} - Nothing.
 */
function ChatRoomMessage(data) {

	// Make sure the message is valid (needs a Sender and Content)
	if (typeof data !== "object" || typeof data.Content !== "string" || typeof data.Sender !== "number")
		return;

	// We're not in a chat room anymore
	if (!ChatRoomData) return;

	// Make sure the sender is in the room
	const SenderCharacter = ChatRoomCharacter.find(c => c.MemberNumber == data.Sender);
	if (!SenderCharacter) return;

	// Make a copy of the message for the purpose of substitutions
	let msg = String(data.Content);

	const preHandlers = ChatRoomMessageRunHandlers("pre", data, SenderCharacter, msg);
	if (typeof preHandlers === "boolean" && preHandlers)
		return;
	else if (typeof preHandlers === "string")
		msg = preHandlers;

	// Hidden messages don't go any further
	if (data.Type === "Hidden") return;

	// Metadata extracted from the message's dictionary
	const { metadata, substitutions } = ChatRoomMessageRunExtractors(data, SenderCharacter);

	// Substitute actions and server messages for their fulltext version
	switch (data.Type) {
		case "Action":
			{
				let text;
				if (msg.startsWith("GGTS")) {
					text = AsylumGGTSGetMessage(msg);
				}
				if (!text || text.startsWith(TEXT_NOT_FOUND_PREFIX)) {
					text = AssetTextGet(msg);
				}
				if (!text || text.startsWith(TEXT_NOT_FOUND_PREFIX)) {
					text = InterfaceTextGet(msg);
				}
				msg = text;
			}
			break;

		case "ServerMessage":
			msg = InterfaceTextGet("ServerMessage" + msg);
			break;

		case "Activity":
			msg = ActivityDictionaryText(msg);
			break;
	}

	// Apply requested substitutions
	msg = CommonStringSubstitute(msg, substitutions);
	const messageEntry = /** @type {MessageEffectEntry} */(data.Dictionary?.find(e => IsMessageEffectDictionaryEntry(e)));
	if (messageEntry?.Original && Player.ImmersionSettings.ShowUngarbledMessages) {
		metadata.OriginalMsg = CommonStringSubstitute(messageEntry.Original, substitutions);
	}

	ChatRoomMessageRunHandlers("post", data, SenderCharacter, msg, metadata);
}

/**
 * @this {HTMLButtonElement}
 */
function ChatRoomMessageNameClick() {
	// When clicking on the reply button we always want to message the conversation partner,
	// regardless of whether they or the player were the sender
	const sender = Number.parseInt(this.parentElement?.dataset.sender, 10);
	const target = Number.parseInt(this.parentElement?.dataset.target, 10);
	const memberNumber = sender === Player.MemberNumber && !Number.isNaN(target) ? target : sender;
	const chatInput = /** @type {null | HTMLTextAreaElement} */(document.getElementById("InputChat"));
	if (!chatInput || !ChatRoomCharacter.some(C => C.MemberNumber === memberNumber)) {
		ChatRoomSendLocal(`${TextGet("CommandNoWhisperTarget")} ${memberNumber}.`, 30_000);
		return;
	}

	chatInput.value = `/whisper ${memberNumber} ${chatInput.value.replace(/\/whisper\s*\d+ ?/u, "")}`;
	chatInput.focus();
}
// ----- Replies
/**
 * Returns the HTML element for the message with the given ID
 * @param {string} id
 * @returns {HTMLElement | null}
 */
function ChatRoomMessageGetById(id) {
	const chatLog = document.getElementById("TextAreaChatLog");
	if (!chatLog) return null;
	return chatLog.querySelector(`[msgid="${id}"]`)?.parentElement;
}

/**
 * Returns the ID of the message that this message is a reply to
 * @returns {string | null}
 */
function ChatRoomMessageGetReplyId() {
	const chatInput = /** @type {null | HTMLTextAreaElement} */(document.getElementById("InputChat"));
	if (!chatInput) return;
	return chatInput.getAttribute("reply-id");
}

/**
 * Returns the name of the character that this message is a reply to.
 * We get the wrong name when replying to reply that's what this is for.
 * @param {string} msgId
 * @param {boolean} isWhisper
 * @returns {string | null}
 */
function ChatRoomMessageGetReplyName(msgId, isWhisper=false) {
	const message = ChatRoomMessageGetById(msgId);
	if (!message) {
		return null;
	}
	if (isWhisper) {
		const sender = Number(message.getAttribute("data-sender"));
		const char = ChatRoomCharacter.find(C => C.MemberNumber === sender);
		if (char) {
			return CharacterNickname(char);
		}
		// Fallthrough here if the character happened to leave
	}
	const names = message.querySelectorAll(".ChatMessageName");
	const name = names[names.length - 1];
	return name?.textContent;
}

/**
 * @param {string} msgId
 * @returns {string | null}
 */
function ChatRoomMessageGetReplyContent(msgId) {
	const message = ChatRoomMessageGetById(msgId);
	if (!message) {
		return null;
	}
	const contents = message.querySelectorAll(".chat-room-message-content");
	const content = contents[contents.length - 1];
	return content.textContent;
}


/**
 * Figures out the type of the message with the given ID
 * @param {string} msgId
 * @returns {"Chat" | "Whisper"}
 */
function ChatRoomMessageGetType(msgId) {
	if (!msgId) return "Chat";
	if (ChatRoomMessageGetById(msgId)?.classList?.contains("ChatMessageWhisper")) return "Whisper";
	return "Chat";
}
/**
 * Closes the reply.
 */
function ChatRoomMessageReplyStop() {
	const chatInput = document.getElementById("InputChat");
	document.getElementById("chat-room-reply-indicator")?.toggleAttribute("hidden", true);
	if (chatInput) {
		chatInput.removeAttribute("reply-id");
		ChatRoomInputResize(chatInput);
	}
}

/**
 * Sets the reply to the message with the given ID
 * @param {string} msgId
 */
function ChatRoomMessageSetReply(msgId) {
	const chatInput = /** @type {null | HTMLTextAreaElement} */(document.getElementById("InputChat"));
	const replyMessage = ChatRoomMessageGetById(msgId);
	if (!chatInput || !replyMessage) {
		return;
	}

	chatInput.setAttribute("reply-id", msgId);
	const type = ChatRoomMessageGetType(msgId);
	const isWhisper = type === "Whisper";
	if (isWhisper) {
		const receiver = Number(replyMessage.getAttribute("data-sender")) === Player.MemberNumber ? Number(replyMessage.getAttribute("data-target")) : Number(replyMessage.getAttribute("data-sender"));
		chatInput.value =  `/whisper ${receiver} ${chatInput.value.replace(/\/whisper\s*\d+ ?/u, "")}`;
	}
	const replyIndicator = document.getElementById("chat-room-reply-indicator");
	const replyIndicatorText = document.getElementById("chat-room-reply-indicator-text").querySelector(".button-label");
	const replyName = ChatRoomMessageGetReplyName(msgId, isWhisper);
	replyIndicatorText.textContent = `${TextGet("ChatRoomReply")}: ${replyName && `${replyName}` || "a message"}`;
	replyIndicator.toggleAttribute("hidden", false);
	ChatRoomInputResize(chatInput);
	chatInput.focus();
}

/**
 * Creates the HTML element for a reply message
 * @param {string} msgId
 * @param {string} displayMessage
 * @param {{ time: string, sender?: number }} data
 * @returns {(HTMLSpanElement | string)[]}
 */
function ChatRoomMessageCreateReplyMessageElement(msgId, displayMessage, data) {
	if (!msgId) {
		return [displayMessage];
	}

	const metadata = ChatRoomGetMetadataElem(data.time, data.sender);
	metadata.setAttribute("aria-hidden", "true");
	return [
		ElementCreate({
			tag: "span",
			classList: ["chat-room-message-content"],
			attributes:  { "msgid": msgId },
			children: [displayMessage],
		}),
		ElementMenu.Create(
			ElementGenerateID(),
			[
				metadata,
				ElementButton.Create(
					null,
					() => ChatRoomMessageSetReply(msgId),
					{ noStyling: true, tooltip: "Reply" },
					{ button: { attributes: { name: "reply" } } },
				),
			],
			{ direction: "rtl", role: "menu" },
			{ menu: { classList:  ["chat-room-message-popup"], attributes: { "aria-direction": "horizontal" } } },
		),
	];
}

/**
 * Scroll to the passed message (be it either via the element or its message ID), accounting for the offset of the sticky chat room separators
 * @param {HTMLElement} msg
 */
function ChatRoomScrollToReplyID(msg) {
	if (!msg) {
		return;
	}

	msg.scrollIntoView({ behavior: "instant" });
	const chatArea = document.getElementById("TextAreaChatLog");
	if (chatArea) {
		const sep = chatArea.querySelector(".chat-room-sep-div");
		chatArea.scrollTop -= (sep?.clientHeight ?? 0);
	}
}

/**
 * Update the Chat log with the recieved message
 *
 * @param {ServerChatRoomMessage} data
 * @param {string} msg
 * @param {Character} SenderCharacter
 * @param {IChatRoomMessageMetadata} metadata
 * @returns {HTMLDivElement}
 */
function ChatRoomMessageDisplay(data, msg, SenderCharacter, metadata) {
	// Censored words are filtered out, ¶¶¶ indicates that we must not display anything on screen
	const displayMessage = CommonCensor(msg);
	if (displayMessage == "¶¶¶") return;

	// Prepares the HTML tags
	/** @type {(string | Node)[]} */
	const divChildren = [];
	/** @type {undefined | string} */
	let innerHTML = undefined;
	let reply = undefined;
	const time = ChatRoomCurrentTime();
	if (metadata.ReplyId) {
		const replyMessage = ChatRoomMessageGetById(metadata.ReplyId);
		const type = ChatRoomMessageGetType(metadata.ReplyId);
		const isWhisper = type === "Whisper";
		reply = ElementButton.Create(
			null,
			(ev) => {
				ChatRoomScrollToReplyID(replyMessage);
				replyMessage?.dispatchEvent(new PointerEvent("click", ev));
			},
			{ noStyling: true },
			{
				button: {
					classList: ["chat-room-message-reply", "truncated-text"],
					attributes: { "tabindex": -1 },
					children: replyMessage ? [ChatRoomMessageGetReplyName(metadata.ReplyId, isWhisper), ": ", ChatRoomMessageGetReplyContent(metadata.ReplyId)] : [TextGet("ChatRoomNoMessageFound")],
				},
			},
		);
	}
	switch (data.Type) {
		case "Chat":
			divChildren.push(
				reply,
				ElementButton.Create(
					null, ChatRoomMessageNameClick, { noStyling: true },
					{
						button: {
							classList: ["ChatMessageName"],
							attributes: { "tabindex": -1 },
							style: { "--label-color": SenderCharacter.LabelColor },
							children: [CharacterNickname(SenderCharacter)],
						},
					},
				),
				": ",
				...ChatRoomMessageCreateReplyMessageElement(metadata.MsgId, displayMessage, { time, sender: data.Sender })
			);
			break;
		case "Whisper": {
			const whisperTarget = SenderCharacter.IsPlayer() ? ChatRoomCharacter.find(c => c.MemberNumber == data.Target) : SenderCharacter;
			divChildren.push(
				reply,
				ElementButton.Create(
					null, ChatRoomMessageNameClick, { noStyling: true },
					{ button: { classList: ["ReplyButton"], children: ["\u21a9\ufe0f"] } },
				),
				SenderCharacter.IsPlayer() ? TextGet("WhisperTo") : TextGetInScope("Screens/Online/ChatRoom/Text_ChatRoom.csv", "WhisperFrom"),
				" ",
				ElementButton.Create(
					null, ChatRoomMessageNameClick, { noStyling: true },
					{
						button: {
							classList: ["ChatMessageName"],
							attributes: { "tabindex": -1 },
							style: { "--label-color": whisperTarget.LabelColor },
							children: [CharacterNickname(whisperTarget)],
						},
					},
				),
				": ",
				...ChatRoomMessageCreateReplyMessageElement(metadata.MsgId,displayMessage, { time, sender: data.Sender })
			);

			if (!whisperTarget.IsPlayer()) {
				document.querySelector(`
					#TextAreaChatLog .ChatMessageWhisper[data-sender="${whisperTarget.MemberNumber}"] > .ReplyButton:not([tabindex='-1']),
					#TextAreaChatLog .ChatMessageWhisper[data-target="${whisperTarget.MemberNumber}"] > .ReplyButton:not([tabindex='-1'])
				`)?.setAttribute("tabindex", "-1");
			}
			break;
		}

		case "Action":
		case "Activity":
			divChildren.push(reply, ...ChatRoomMessageCreateReplyMessageElement(metadata.MsgId,`(${displayMessage})`, { time, sender: data.Sender }));
			break;

		case "ServerMessage":
			divChildren.push(ElementCreate({ tag: "br" }), displayMessage);
			break;

		case "LocalMessage":
			// Local messages can have HTML embedded in them
			innerHTML = data.Content;
			break;

		case "Emote":
			divChildren.push(reply, ...ChatRoomMessageCreateReplyMessageElement(metadata.MsgId,`*${displayMessage}*`, { time, sender: data.Sender }));
			break;

		default:
			console.warn(`unknown message type ${data.Type}, ignoring`);
			return;
	}

	if (metadata.OriginalMsg) {
		divChildren.push(
			ElementCreate({ tag: "br"}),
			ElementCreate({ tag: "span", children: [`[${metadata.OriginalMsg}]`], classList: ["chat-room-message-original"] }),
		);
	}

	// Checks if the message is a notification about the user entering or leaving the room
	const classList = ["ChatMessage", `ChatMessage${data.Type}`];
	if (data.Type === "Action" && ["ServerEnter", "ServerLeave", "ServerDisconnect", "ServerBan", "ServerKick"].some(m => data.Content.startsWith(m)))
		classList.push("ChatMessageEnterLeave");
	if ((data.Type != "Chat" && data.Type != "Whisper" && data.Type != "Emote"))
		classList.push("ChatMessageNonDialogue");

	// Adds the message and scrolls down unless the user has scrolled up
	const div = ElementCreate({
		tag: "div",
		classList,
		dataAttributes: {
			time,
			sender: data.Sender,
			target: data.Target,
		},
		innerHTML,
		children: divChildren,
		style: {
			"--label-color": ["Emote", "Action", "Activity"].includes(data.Type) ? SenderCharacter.LabelColor : undefined,
		},
		eventListeners: {
			click(ev) {
				if (Player.ChatSettings.DisableReplies) {
					return;
				}

				const selection = window.getSelection();
				if (this.contains(selection?.anchorNode) && selection.type === "Range") {
					return;
				}

				if (
					ev.target === this
					|| (
						ev.target instanceof Element
						&& (ev.target.classList.contains("chat-room-message-content") || ev.target.classList.contains("chat-room-message-original"))
					)
				) {
					this.setAttribute("tabindex", 0);
					this.focus();
				}
			},
			blur() {
				if (!Player.ChatSettings.DisableReplies) {
					this.removeAttribute("tabindex");
				}
			},
		},
	});

	if (typeof data.Timeout === 'number' && data.Timeout > 0) setTimeout(() => div.remove(), data.Timeout);
	if (div.querySelector(".chat-room-message-popup")) {
		div.setAttribute("aria-haspopup", "menu");
	}

	// Returns the focus on the chat box
	ChatRoomAppendChat(div);
	return div;
}

/**
 * Whether to replace message details which reveal information about an unseen/unheard character
 * @param {Character} C - The character whose identity should remain unknown
 * @returns {boolean} - Whether the character details should be hidden
 */
function ChatRoomHideIdentity(C) {
	return PreferenceIsPlayerInSensDep()
		&& C.MemberNumber != Player.MemberNumber
		&& (!ChatRoomSenseDepBypass || ChatRoomImpactedBySenseDep.includes(C));
}

/**
 * Adds a character into the chat room.
 * @param {Character} newCharacter - The new character to be added to the chat room.
 * @param {ServerChatRoomSyncCharacterResponse["Character"]} newRawCharacter - The raw character data of the new character as it was received from the server.
 * @returns {void} - Nothing
 */
function ChatRoomAddCharacterToChatRoom(newCharacter, newRawCharacter)
{
	if (ChatRoomData == null || newCharacter == null || newRawCharacter == null) { return; }

	// Update the chat room characters
	let characterIndex = ChatRoomCharacter.findIndex(x => x.MemberNumber == newCharacter.MemberNumber);
	if (characterIndex >= 0) // If we found an existing entry...
	{
		// Update it
		ChatRoomCharacter[characterIndex] = newCharacter;
	}
	else // If we didn't update existing data...
	{
		// Push a new entry
		ChatRoomCharacter.push(newCharacter);
	}

	// Update chat room data backup
	characterIndex = ChatRoomData.Character.findIndex(x => x.MemberNumber == newRawCharacter.MemberNumber);
	if (characterIndex >= 0) // If we found an existing entry...
	{
		// Update it
		ChatRoomData.Character[characterIndex] = newRawCharacter;
	}
	else // If we didn't update existing data...
	{
		// Push a new entry
		ChatRoomData.Character.push(newRawCharacter);
	}

}

/**
 * Handles the reception of the complete room data from the server.
 * @param {unknown} obj - Room object containing the updated chatroom data.
 * @returns {obj is ChatRoom} - Returns true if the passed properties are valid and false if they're invalid.
 */
function ChatRoomValidateProperties(obj)
{
	const room = /** @type {ChatRoom} */ (obj);
	return room != null && typeof room === "object"
		&& typeof room.Name === "string"
		&& typeof room.Description === "string"
		&& Array.isArray(room.Admin) && room.Admin.every(n => typeof n === "number")
		&& Array.isArray(room.Whitelist) && room.Whitelist.every(n => typeof n === "number")
		&& Array.isArray(room.Ban) && room.Ban.every(n => typeof n === "number")
		&& typeof room.Background === "string"
		&& typeof room.Limit === "number"
		&& typeof room.Game === "string"
		&& Array.isArray(room.Visibility) && room.Visibility.every(v => typeof v === "string")
		&& Array.isArray(room.Access) && room.Access.every(s => typeof s === "string")
		&& Array.isArray(room.BlockCategory) && room.BlockCategory.every(c => typeof c === "string")
		&& (!room.Character || Array.isArray(room.Character) && room.Character.every(c => typeof c === "object"))
		&& typeof room.Language === "string"
		&& typeof room.Space === "string";
}

/**
 * Handles the reception of the data for a room we've just entered.
 *
 * This only happens once per ChatRoom "lifetime".
 *
 * @param {ServerChatRoomSyncMessage} data - Room object containing the new chatroom data.
 * @returns {Promise<void>} - Nothing.
 */
async function ChatRoomSync(data) {
	if (data == null || (typeof data !== "object") || typeof data.SourceMemberNumber !== "number") {
		return;
	}

	// Split out the sender from the rest of the chatroom data
	const senderNumber = data.SourceMemberNumber;
	delete data.SourceMemberNumber;

	// Validate the actual chatroom properties
	if (!ChatRoomValidateProperties(data)) {
		// Instantly leave the chat room again
		ChatRoomLeave();
		await CommonSetScreen("Online", "ChatSearch");
		ChatSearchSendToast("InvalidRoomData");
		return;
	} else if (ChatRoomData) {
		// We're somehow already in a room. Bail out in case our idea of the room we're in doesn't match what the server thinks
		ChatRoomLeave();
		await CommonSetScreen("Online", "ChatSearch");
		ChatSearchSendToast("AlreadyInRoom");
		return;
	}

	// FIXME: this should really be more validated than that
	if (data.MapData?.Type === undefined) {
		data.MapData = { Type: "Never" };
	}

	// Set our chat room data to what the server sent us
	ChatRoomData = data;
	ChatRoomJustEntered = true;

	// Loads the room
	if (!ServerPlayerIsInChatRoom() || CurrentScreen === "ChatAdmin") {
		await CommonSetScreen("Online", "ChatRoom");
	}

	if (ChatRoomSep.ActiveElem) {
		ChatRoomSep.SetRoomData(ChatRoomSep.ActiveElem, data);
	}

	// Load the characters
	ChatRoomCharacter = [];
	for (let C = 0; C < data.Character.length; C++) {
		// Treat chatroom updates from ourselves as if the updated characters had sent them
		const sourceMemberNumber = senderNumber === Player.MemberNumber ? data.Character[C].MemberNumber : senderNumber;
		const Char = CharacterLoadOnline(data.Character[C], sourceMemberNumber);
		ChatRoomCharacter.push(Char);
	}

	// Reset when creating/joining a room, in case it wasn't by ChatRoomLeave() for whatever reason
	ChatRoomDrawFocusList = [];

	// If there's a game running in that chatroom, save it and perform a reset
	if (ChatRoomData.Game != null) {
		ChatRoomGame = ChatRoomData.Game;
		OnlineGameReset();
	}

	ChatRoomPingLeashedPlayers();

	// Check whether the player's last chatroom data needs updating
	ChatRoomCheckForLastChatRoomUpdates();

	// Reloads the online game statuses if needed
	OnlineGameLoadStatus();

	// The allowed menu actions may have changed
	ChatRoomMenuBuild();

	// Parse the new chat room map data, if any
	ChatRoomMapManager.OnMapDataUpdated();
}


/**
 * Handles the reception of the character data of a single player from the server.
 * @param {ServerChatRoomSyncCharacterResponse} data - object containing the character's data.
 * @returns {void} - Nothing.
 */
function ChatRoomSyncCharacter(data) {
	if (ChatRoomData == null || data == null || (typeof data !== "object")) {
		return;
	}

	const newCharacter = CharacterLoadOnline(data.Character, data.SourceMemberNumber);
	ChatRoomAddCharacterToChatRoom(newCharacter, data.Character);

}

/**
 * Handles the reception of the character data of a newly joined player from the server.
 * @param {ServerChatRoomSyncMemberJoinResponse} data - object containing the joined character's data.
 * @returns {void} - Nothing.
 */
function ChatRoomSyncMemberJoin(data) {
	if (ChatRoomData == null || data == null || (typeof data !== "object")) {
		return;
	}

	//Load the character to the chat room
	const newCharacter = CharacterLoadOnline(data.Character, data.SourceMemberNumber);
	ChatRoomAddCharacterToChatRoom(newCharacter, data.Character);

	if (Array.isArray(data.WhiteListedBy)) {
		for (const MemberNumber of data.WhiteListedBy) {
			for (const character of Character) {
				if (character.MemberNumber === MemberNumber && Array.isArray(character.WhiteList) && !character.IsPlayer()) {
					if (!character.WhiteList.includes(newCharacter.MemberNumber)) {
						character.WhiteList.push(newCharacter.MemberNumber);
						character.WhiteList.sort((a, b) => a - b);
					}
				}
			}
		}
	}
	if (Array.isArray(data.BlackListedBy)) {
		for (const MemberNumber of data.BlackListedBy) {
			for (const character of Character) {
				if (character.MemberNumber === MemberNumber && Array.isArray(character.BlackList) && !character.IsPlayer()) {
					if (!character.BlackList.includes(newCharacter.MemberNumber)) {
						character.BlackList.push(newCharacter.MemberNumber);
						character.BlackList.sort((a, b) => a - b);
					}
				}
			}
		}
	}

	// After Join Actions
	if (ChatRoomNotificationRaiseChatJoin(newCharacter)) {
		NotificationRaise(NotificationEventType.CHATJOIN, { characterName: newCharacter.Name });
	}
	if (ChatRoomLeashList.includes(newCharacter.MemberNumber)) {
		// Ping to make sure they are still leashed
		ServerSend("ChatRoomChat", { Content: "PingHoldLeash", Type: "Hidden", Target: newCharacter.MemberNumber });
	}
	// Check whether the player's last chatroom data needs updating
	ChatRoomCheckForLastChatRoomUpdates();
	// The allowed menu actions may have changed
	ChatRoomMenuBuild();

}

/**
 * Handles the reception of the leave notification of a player from the server.
 * @param {ServerChatRoomLeaveResponse} data - Room object containing the leaving character's member number.
 * @returns {void} - Nothing.
 */
function ChatRoomSyncMemberLeave(data) {
	if (ChatRoomData == null || data == null || (typeof data !== "object")) {
		return;
	}

	// Remove the character
	ChatRoomCharacter = ChatRoomCharacter.filter(x => x.MemberNumber != data.SourceMemberNumber);
	ChatRoomDrawFocusList = ChatRoomDrawFocusList.filter(x => x.MemberNumber != data.SourceMemberNumber);
	ChatRoomData.Character = ChatRoomData.Character.filter(x => x.MemberNumber != data.SourceMemberNumber);

	// Check whether the player's last chatroom data needs updating
	ChatRoomCheckForLastChatRoomUpdates();

	// The allowed menu actions may have changed
	ChatRoomMenuBuild();

	//For ClubCard, in case one of the players disconnects from the server, the other player sends a message about it to the game chat.
	if (CurrentScreen === "ClubCard") ClubCardCheckDisconnected(data.SourceMemberNumber);
}

/**
 * Handles the reception of the room properties from the server.
 * @param {ServerChatRoomSyncPropertiesMessage} data - Room object containing the updated chatroom properties.
 * @returns {void} - Nothing.
 */
function ChatRoomSyncRoomProperties(data) {
	if (ChatRoomData == null || data == null || typeof data !== "object" || typeof data.SourceMemberNumber !== "number") {
		return;
	}

	// Split out the sender from the rest of the chatroom data
	delete data.SourceMemberNumber;

	if(ChatRoomValidateProperties(data) == false) // If the room data we received is invalid...
	{
		ChatRoomLeave();
		ChatSearchSendToast("InvalidRoomData");
		CommonSetScreen("Online", "ChatSearch");
		return;
	}

	// Copy the received properties to chat room data
	// This uses Object.assign because the character data is missing in that case
	Object.assign(ChatRoomData, data);
	if (ChatRoomSep.ActiveElem) {
		ChatRoomSep.SetRoomData(ChatRoomSep.ActiveElem, data);
	}

	if (ChatRoomData.Game != null) {
		ChatRoomGame = ChatRoomData.Game;
	}

	// Check whether the player's last chatroom data needs updating
	ChatRoomCheckForLastChatRoomUpdates();

	// Reloads the online game statuses if needed
	OnlineGameLoadStatus();

	// The allowed menu actions may have changed
	ChatRoomMenuBuild();

	if(ChatRoomActiveView.SyncRoomProperties) ChatRoomActiveView.SyncRoomProperties(data);

	// Update our leash state
	CharacterRefreshLeash(Player);

	ChatRoomMapManager.OnMapDataUpdated();
}

/**
 * Handles the swapping of two players by a room administrator.
 * @param {ServerChatRoomReorderResponse} data - Object containing the member numbers of the swapped characters.
 * @returns {void} - Nothing.
 */
function ChatRoomSyncReorderPlayers(data) {
	if (ChatRoomData == null || data == null || (typeof data !== "object")) {
		return;
	}

	let newChatRoomCharacter = [];
	let newChatRoomDataCharacter = [];
	let index = 0;

	for(let i=0; i<data.PlayerOrder.length; i++) // For every player to reorder...
	{
		//Chat Room Characters
		index = ChatRoomCharacter.findIndex(x => x.MemberNumber == data.PlayerOrder[i]);
		newChatRoomCharacter.push(ChatRoomCharacter.splice(index, 1)[0]);

		//Chat Room Data Backup
		index = ChatRoomData.Character.findIndex(x => x.MemberNumber == data.PlayerOrder[i]);
		newChatRoomDataCharacter.push(ChatRoomData.Character.splice(index, 1)[0]);

	}

	if(ChatRoomCharacter.length > 0) // If we forgot about some characters for some reason...
	{
		//Push the missed entries to the end
		Array.prototype.push.apply(newChatRoomCharacter, ChatRoomCharacter);
	}
	if(ChatRoomData.Character.length > 0) // If we forgot about some entries for some reason...
	{
		//Push the missed entries to the end
		Array.prototype.push.apply(newChatRoomDataCharacter, ChatRoomData.Character);
	}

	//Update the origin arrays
	ChatRoomCharacter = newChatRoomCharacter;
	ChatRoomData.Character = newChatRoomDataCharacter;

}

/**
 * Updates a single character in the chatroom
 * @param {ServerChatRoomSyncCharacterResponse} data - Data object containing the new character data.
 * @returns {void} - Nothing.
 */
function ChatRoomSyncSingle(data) {

	// Sets the chat room character data
	if (ChatRoomData == null || data == null || typeof data !== "object") return;
	if ((data.Character == null) || (typeof data.Character !== "object")) return;
	for (let C = 0; C < ChatRoomCharacter.length; C++)
		if (ChatRoomCharacter[C].MemberNumber == data.Character.MemberNumber)
			ChatRoomCharacter[C] = CharacterLoadOnline(data.Character, data.SourceMemberNumber);

	// Keeps a copy of the previous version
	for (let C = 0; C < ChatRoomData.Character.length; C++)
		if (ChatRoomData.Character[C].MemberNumber == data.Character.MemberNumber)
			ChatRoomData.Character[C] = data.Character;

}

/**
 * Updates a single character's expression in the chatroom.
 * @param {ServerCharacterExpressionResponse} data - Data object containing the new character expression data.
 * @returns {void} - Nothing.
 */
function ChatRoomSyncExpression(data) {
	if (
		ChatRoomData == null
		|| !CommonIsObject(data)
		|| typeof data.Group !== "string"
		|| (typeof data.Name !== "string" && data.Name != null)
	) return;

	const character = ChatRoomCharacter.find(c => c.MemberNumber === data.MemberNumber);
	if (!character) return;

	const expr = /** @type {ExpressionName} */(data.Name);

	// Changes the facial expression if the group exists and allows it
	const item = character.Appearance.find(i => (
		i.Asset.Group.Name === data.Group
		&& i.Asset.Group.AllowExpression
		&& (data.Name == null || i.Asset.Group.AllowExpression.includes(expr))
	));
	if (!item) return;

	if (!item.Property) item.Property = {};
	if (item.Property.Expression !== expr) {
		item.Property.Expression = expr;
		CharacterRefresh(character, false);
	}

	// Update the cached copy in the chatroom
	const roomCharacter = ChatRoomData.Character.find(c => c.MemberNumber === data.MemberNumber);
	if (roomCharacter) {
		// @ts-expect-error FIXME: This is mistaking raw server data with unpacked character data
		roomCharacter.Appearance = character.Appearance;
	}
}

/**
 * Updates a single character's pose in the chatroom.
 * @param {ServerCharacterPoseResponse} data - Data object containing the new character pose data.
 * @returns {void} - Nothing.
 */
function ChatRoomSyncPose(data) {
	if (ChatRoomData == null || data == null || typeof data !== "object") return;
	const character = ChatRoomCharacter.find(c => c.MemberNumber === data.MemberNumber);
	if (!character) return;

	// Sets the active pose; data is validated by the `ActivePose` setter
	character.ActivePose = /** @type {AssetPoseName[]} */(data.Pose);
	CharacterRefresh(character, false);

	// Update the cached copy in the chatroom
	const roomCharacter = ChatRoomData.Character.find(c => c.MemberNumber === data.MemberNumber);
	if (roomCharacter) {
		roomCharacter.ActivePose = [...character.ActivePose];
	}
}

/**
 * Updates a single character's arousal progress in the chatroom.
 * @param {ServerCharacterArousalResponse} data - Data object containing the new character arousal data.
 * @returns {void} - Nothing.
 */
function ChatRoomSyncArousal(data) {
	if (ChatRoomData == null || data == null || typeof data !== "object") return;
	const character = ChatRoomCharacter.find(c => c.MemberNumber === data.MemberNumber);
	if (!character || !character.ArousalSettings) return;

	// Sets the orgasm count & progress
	character.ArousalSettings.OrgasmTimer = data.OrgasmTimer;
	character.ArousalSettings.OrgasmCount = data.OrgasmCount;
	character.ArousalSettings.Progress = data.Progress;
	character.ArousalSettings.ProgressTimer = data.ProgressTimer;
	if ((character.ArousalSettings.AffectExpression == null) || character.ArousalSettings.AffectExpression)
		ActivityExpression(character, character.ArousalSettings.Progress);

	// Update the cached copy in the chatroom
	const roomCharacter = ChatRoomData.Character.find(c => c.MemberNumber === data.MemberNumber);
	if (roomCharacter && roomCharacter.ArousalSettings) {
		roomCharacter.ArousalSettings.OrgasmTimer = data.OrgasmTimer;
		roomCharacter.ArousalSettings.OrgasmCount = data.OrgasmCount;
		roomCharacter.ArousalSettings.Progress = data.Progress;
		roomCharacter.ArousalSettings.ProgressTimer = data.ProgressTimer;
		// @ts-expect-error FIXME: This is mistaking raw server data with unpacked character data
		roomCharacter.Appearance = character.Appearance;
	}
}


/**
 * Updates a single item on a specific character in the chatroom.
 * @param {ServerChatRoomSyncItemResponse} data - Data object containing the data pertaining to the singular item to update.
 * @returns {void} - Nothing.
 */
function ChatRoomSyncItem(data) {
	if (!ChatRoomData) return;
	if (!CommonIsObject(data)) return;
	if (!CommonIsInteger(data.Source) || !CommonIsObject(data.Item) || typeof data.Item.Group !== "string" || !CommonIsInteger(data.Item.Target)) return;

	const targetChar = ChatRoomCharacter.find(char => char.MemberNumber === data.Item.Target);
	if (!targetChar) return;

	const updateParams = ValidationCreateDiffParams(targetChar, data.Source);
	const previousItem = InventoryGet(targetChar, data.Item.Group);
	const newItem = ServerBundledItemToAppearanceItem(targetChar.AssetFamily, data.Item);
	const unknownAsset = data.Item.Name !== undefined && newItem === null;

	let { item, valid } = ValidationResolveAppearanceDiff(data.Item.Group, previousItem, newItem, updateParams, unknownAsset);

	ChatRoomAllowCharacterUpdate = false;

	if (!item || (previousItem && previousItem.Asset.Name !== item.Asset.Name)) {
		InventoryRemove(targetChar, data.Item.Group, false);
	}

	item: if (item) {

		// Puts the item on the character and apply the craft & property
		const wornItem = CharacterAppearanceSetItem(targetChar, item.Asset.Group.Name, item.Asset, item.Color, item.Difficulty);
		if (wornItem == null) {
			valid = false;
			break item;
		}
		wornItem.Craft = item.Craft;
		wornItem.Property = item.Property;

		/** @type {AppearanceDiffMap} */
		const diffMap = {};
		for (const appearanceItem of targetChar.Appearance) {
			const groupName = appearanceItem.Asset.Group.Name;
			if (groupName === data.Item.Group) {
				diffMap[groupName] = [previousItem, appearanceItem];
			} else {
				diffMap[groupName] = [appearanceItem, appearanceItem];
			}
		}

		const cyclicBlockSanitizationResult = ValidationResolveCyclicBlocks(targetChar.Appearance, diffMap);
		targetChar.Appearance = cyclicBlockSanitizationResult.appearance;
		valid = valid && cyclicBlockSanitizationResult.valid;
	}

	ChatRoomAllowCharacterUpdate = true;

	// If the update was invalid, send a correction update
	if (targetChar.IsPlayer() && !valid) {
		console.warn(`Invalid appearance update to group ${data.Item.Group}. Updating with sanitized appearance.`);
		ChatRoomCharacterUpdate(targetChar);
	} else {
		CharacterRefresh(targetChar);
	}

	// Keeps the change in the chat room data and allows the character to be updated again
	const rawChar = ChatRoomData.Character.find(char => char.MemberNumber === data.Item.Target);
	if (rawChar) {
		rawChar.Appearance = ServerAppearanceBundle(targetChar.Appearance);
	}
}

/**
 * Refreshes the chat log elements for Player
 * @returns {void} - Nothing.
 */
function ChatRoomRefreshChatSettings() {
	if (Player.ChatSettings) {
		for (let property in Player.ChatSettings)
			ElementSetDataAttribute("TextAreaChatLog", property, Player.ChatSettings[property]);

		ChatRoomSep.UpdateDisplayNames();
		if (Player.GameplaySettings &&
			(Player.GameplaySettings.SensDepChatLog == "SensDepNames" || Player.GameplaySettings.SensDepChatLog == "SensDepTotal" || Player.GameplaySettings.SensDepChatLog == "SensDepExtreme") &&
			(Player.GetDeafLevel() >= 3) &&
			(Player.GetBlindLevel() >= 3)) {
			ElementSetDataAttribute("TextAreaChatLog", "EnterLeave", "Hidden");
		}
		if (Player.GameplaySettings && (Player.GameplaySettings.SensDepChatLog == "SensDepTotal" || Player.GameplaySettings.SensDepChatLog == "SensDepExtreme") && (Player.GetDeafLevel() >= 3) && (Player.GetBlindLevel() >= 3)) {
			ElementSetDataAttribute("TextAreaChatLog", "DisplayTimestamps", "false");
			ElementSetDataAttribute("TextAreaChatLog", "ColorNames", "false");
			ElementSetDataAttribute("TextAreaChatLog", "ColorActions", "false");
			ElementSetDataAttribute("TextAreaChatLog", "ColorEmotes", "false");
			ElementSetDataAttribute("TextAreaChatLog", "ColorActivities", "false");
			ElementSetDataAttribute("TextAreaChatLog", "MemberNumbers", "Never");
		}
	}
}

/**
 * Shows the current character's profile (Information Sheet screen)
 * @returns {void} - Nothing.
 */
function DialogViewProfile() {
	if (CurrentCharacter != null) {
		const C = CurrentCharacter;
		DialogLeave();
		InformationSheetLoadCharacter(C);
	}
}

/**
 * Brings the player into the main hall and starts the maid punishment sequence
 * @returns {void}
 */
function DialogCallMaids() {
	ChatRoomLeave(true);
	CommonSetScreen("Room", "MainHall").then(() => {
		if (!Player.RestrictionSettings.BypassNPCPunishments) {
			MainHallPunishFromChatroom();
		}
	});
}


/**
 * Triggered when the player assists another player to struggle out, the bonus is evasion / 2 + 1, with penalties if
 * the player is restrained.
 * @returns {void} - Nothing.
 */
function ChatRoomStruggleAssist() {
	var Bonus = SkillGetLevelReal(Player, "Evasion") / 2 + 1;
	if (!Player.CanInteract()) {
		if (InventoryItemHasEffect(InventoryGet(Player, "ItemArms"), "Block", true)) Bonus = Bonus / 1.5;
		if (InventoryItemHasEffect(InventoryGet(Player, "ItemHands"), "Block", true)) Bonus = Bonus / 1.5;
		if (!Player.CanTalk()) Bonus = Bonus / 1.25;
	}
	const Dictionary = new DictionaryBuilder()
		.sourceCharacter(Player)
		.targetCharacter(CurrentCharacter)
		.build();
	ServerSend("ChatRoomChat", { Content: "StruggleAssist", Type: "Action", Dictionary });
	ServerSend("ChatRoomChat", { Content: "StruggleAssist" + Math.round(Bonus).toString(), Type: "Hidden", Target: CurrentCharacter.MemberNumber });
	DialogLeave();
}

/**

 * Triggered when the player assists another player to by giving lockpicks
 * @returns {void} - Nothing.
 */
function ChatRoomGiveLockpicks() {
	const Dictionary = new DictionaryBuilder()
		.sourceCharacter(Player)
		.targetCharacter(CurrentCharacter)
		.build();
	ServerSend("ChatRoomChat", { Content: "GiveLockpicks", Type: "Action", Dictionary });
	ServerSend("ChatRoomChat", { Content: "GiveLockpicks", Type: "Hidden", Target: CurrentCharacter.MemberNumber });
	DialogLeave();
}

/**
 * Triggered when the player grabs another player's leash
 * @returns {void} - Nothing.
 */
function ChatRoomHoldLeash() {
	const Dictionary = new DictionaryBuilder()
		.sourceCharacter(Player)
		.targetCharacter(CurrentCharacter)
		.build();
	ServerSend("ChatRoomChat", { Content: "HoldLeash", Type: "Action", Dictionary });
	ServerSend("ChatRoomChat", { Content: "HoldLeash", Type: "Hidden", Target: CurrentCharacter.MemberNumber });
	if (ChatRoomLeashList.indexOf(CurrentCharacter.MemberNumber) < 0)
		ChatRoomLeashList.push(CurrentCharacter.MemberNumber);
	DialogLeave();
}

/**
 * Handle the reply to a leash being held
 * @param {Character} SenderCharacter
 */
function ChatRoomDoHoldLeash(SenderCharacter) {
	if (ChatRoomCanBeLeashedBy(SenderCharacter.MemberNumber, Player)) {
		if (SenderCharacter.MemberNumber != ChatRoomLeashPlayer && ChatRoomLeashPlayer != null) {
			// Someone that isn't our current leasher picked up our leash. Inform them that we dropped their leash
			ServerSend("ChatRoomChat", { Content: "RemoveLeash", Type: "Hidden", Target: ChatRoomLeashPlayer });
		}
		// Set the character as our new leasher
		ChatRoomLeashPlayer = SenderCharacter.MemberNumber;
	} else {
		ServerSend("ChatRoomChat", { Content: "RemoveLeash", Type: "Hidden", Target: SenderCharacter.MemberNumber });
	}
	CharacterRefreshLeash(Player);
}

/**
 * Triggered when the player lets go of another player's leash
 * @returns {void} - Nothing.
 */
function ChatRoomStopHoldLeash() {
	const Dictionary = new DictionaryBuilder()
		.sourceCharacter(Player)
		.targetCharacter(CurrentCharacter)
		.build();
	ServerSend("ChatRoomChat", { Content: "StopHoldLeash", Type: "Action", Dictionary });
	ServerSend("ChatRoomChat", { Content: "StopHoldLeash", Type: "Hidden", Target: CurrentCharacter.MemberNumber });
	if (ChatRoomLeashList.indexOf(CurrentCharacter.MemberNumber) >= 0)
		ChatRoomLeashList.splice(ChatRoomLeashList.indexOf(CurrentCharacter.MemberNumber), 1);
	DialogLeave();
}

/**
 * Handle the reply to a leash being released
 * @param {Character} SenderCharacter
 */
function ChatRoomDoStopHoldLeash(SenderCharacter) {
	if (SenderCharacter.MemberNumber == ChatRoomLeashPlayer) {
		ChatRoomLeashPlayer = null;
		CharacterRefreshLeash(Player);
	}
}

/**
 * Triggered when a dom enters the room
 * @returns {void} - Nothing.
 */
function ChatRoomPingLeashedPlayers() {
	if (ChatRoomLeashList && ChatRoomLeashList.length > 0) {
		for (let P = 0; P < ChatRoomLeashList.length; P++) {
			ServerSend("ChatRoomChat", { Content: "PingHoldLeash", Type: "Hidden", Target: ChatRoomLeashList[P] });
			ServerSend("AccountBeep", { MemberNumber: ChatRoomLeashList[P], BeepType:"Leash"});
		}
	}
}

/**
 * Handle the reply to a leash ping
 * @param {Character} SenderCharacter
 */
function ChatRoomDoPingLeashedPlayers(SenderCharacter) {
	// The dom will ping all players on her leash list and ones that no longer have her as their leasher will remove it
	if (SenderCharacter.MemberNumber != ChatRoomLeashPlayer || !ChatRoomCanBeLeashedBy(SenderCharacter.MemberNumber, Player)) {
		ServerSend("ChatRoomChat", { Content: "RemoveLeash", Type: "Hidden", Target: SenderCharacter.MemberNumber });
	}
}

/**
 * Handle the reply to a leash being broken
 * @param {Character} SenderCharacter
 */
function ChatRoomDoRemoveLeash(SenderCharacter) {
	if (ChatRoomLeashList.indexOf(SenderCharacter.MemberNumber) >= 0) {
		ChatRoomLeashList.splice(ChatRoomLeashList.indexOf(SenderCharacter.MemberNumber), 1);
	}
}

/**
 * Triggered when a character makes another character kneel/stand.
 * @returns {void} - Nothing
 */
function ChatRoomKneelStandAssist() {
	const Dictionary = new DictionaryBuilder()
		.sourceCharacter(Player)
		.targetCharacter(CurrentCharacter)
		.build();
	ServerSend("ChatRoomChat", { Content: !CurrentCharacter.IsKneeling() ? "HelpKneelDown" : "HelpStandUp", Type: "Action", Dictionary });
	PoseSetActive(CurrentCharacter, !CurrentCharacter.IsKneeling() ? "Kneel" : "BaseLower", false);
	ChatRoomCharacterUpdate(CurrentCharacter);
}

/**
 * Triggered when a character stops another character from leaving.
 * @returns {void} - Nothing
 */
function ChatRoomStopLeave() {
	const Dictionary = new DictionaryBuilder()
		.sourceCharacter(Player)
		.targetCharacter(CurrentCharacter)
		.build();
	ServerSend("ChatRoomChat", { Content: "SlowStop", Type: "Action", Dictionary });
	ServerSend("ChatRoomChat", { Content: "SlowStop", Type: "Hidden", Target: CurrentCharacter.MemberNumber });
	DialogLeave();
}

/**
 * Triggered when a character interrupt online struggles on another character.
 * @returns {void} - Nothing
 */
function ChatRoomOnlineStruggleInterrupt() {
	const Dictionary = new DictionaryBuilder()
		.sourceCharacter(Player)
		.targetCharacter(CurrentCharacter)
		.build();
	ServerSend("ChatRoomChat", { Content: "OnlineStruggleInterrupt", Type: "Action", Dictionary });
	ServerSend("ChatRoomChat", { Content: "OnlineStruggleInterrupt", Type: "Hidden", Target: CurrentCharacter.MemberNumber });
	DialogLeave();
}

/**
 * Sends an administrative command to the server for the chat room from the character dialog.
 * @param {"Move"|"Kick"|"Ban"} ActionType - Type of action performed.
 * @param {boolean | string} [Publish=true] - Whether or not the action should be published.
 * @returns {void} - Nothing
 */
function ChatRoomAdminAction(ActionType, Publish) {
	if ((CurrentCharacter != null) && (CurrentCharacter.MemberNumber != null) && ChatRoomPlayerIsAdmin()) {
		if (ActionType == "Move") {
			ChatRoomCharacterViewMoveTarget = CurrentCharacter.MemberNumber;
		} else {
			ServerSend("ChatRoomAdmin", { MemberNumber: CurrentCharacter.MemberNumber, Action: ActionType, Publish: (Publish !== false && Publish !== "false") });
		}
		DialogLeave();
	}
}

/**
 * Sends an administrative command to the server from the chat text field.
 * @param {"Ban"|"Unban"|"Kick"|"Promote"|"Demote"|"Whitelist"|"Unwhitelist"} ActionType - Type of action performed.
 * @param {string} Argument - Target number of the action.
 * @returns {void} - Nothing
 */
function ChatRoomAdminChatAction(ActionType, Argument) {
	if (ChatRoomPlayerIsAdmin()) {
		var C = parseInt(Argument);
		if (!isNaN(C) && (C > 0) && (C != Player.MemberNumber))
			ServerSend("ChatRoomAdmin", { MemberNumber: C, Action: ActionType });
	}
}

/**
 * Gets the player's current time as a string.
 * @returns {string} - The player's current local time as a string.
 */
function ChatRoomCurrentTime() {
	var D = new Date();
	return ("0" + D.getHours()).substr(-2) + ":" + ("0" + D.getMinutes()).substr(-2);
}

/**
 * Adds or removes an online member to/from a specific list. (From the dialog menu)
 * @param {"Add" | "Remove"} Operation - Operation to perform.
 * @param {"WhiteList" | "FriendList" | "BlackList" | "GhostList" | "DrawFocusList"} ListType - Name of the list to alter. (Whitelist, friendlist, blacklist, ghostlist, drawfocuslist)
 * @param {"FriendRequest"} [notification] - used to send notifications
 * @returns {void} - Nothing
 */
function ChatRoomListManage(Operation, ListType, notification) {
	if (!CurrentCharacter) return;
	if (!CurrentCharacter.IsOnline()) return;
	const isAdd = Operation === "Add";
	if (ListType === "DrawFocusList") {
		if (isAdd) {
			ChatRoomDrawFocusListAdd([CurrentCharacter]);
		} else {
			ChatRoomDrawFocusListRemove([CurrentCharacter]);
		}
	} else if (Array.isArray(Player[ListType])) {
		ChatRoomListUpdate(Player[ListType], isAdd, CurrentCharacter.MemberNumber, ListType === "FriendList" ? notification : undefined);
		CharacterRefreshDialog(CurrentCharacter);
	}
}

/**
 * Adds or removes an online member to/from a specific list from a typed message.
 * @param {number[]} List - List to add to or remove from.
 * @param {boolean} Adding - If TRUE adding to the list, if FALSE removing from the list.
 * @param {string} Argument - Member number to add/remove.
 * @param {"FriendRequest"} [notification] - used to send notifications
 * @deprecated Use {@link ChatRoomListUpdate}
 * @returns {void} - Nothing
 */
function ChatRoomListManipulation(List, Adding, Argument, notification) {
	const C = CommonParseInt(Argument);
	if (C === null || !CommonIsNonNegativeInteger(C) || C === Player.MemberNumber) return;
	ChatRoomListUpdate(List, Adding, C, notification);
}

/** @type {Map<string, number>} */
const ChatRoomLastFriendRequest = new Map();

/**
 * Sends a notification message when a friend request is received.
 * @param {Character} SenderCharacter - The character who sent the request.
 * @param {ServerChatRoomMessage} data - The chat message data.
 * @returns {void} - Nothing
 */

function ChatRoomFriendMessage(SenderCharacter, data) {
	if (!Player.ChatSettings.ShowFriendRequestMessages) return;
	const lastRequest = ChatRoomLastFriendRequest.get(SenderCharacter.MemberNumber+data.Content) ?? -Infinity;
	if (!(lastRequest < CurrentTime + 5 * 60 * 1000)) return;
	ChatRoomLastFriendRequest[SenderCharacter.MemberNumber+data.Content] = CurrentTime;
	/** @type {CommonSubtituteSubstitution[]} this is ass */
	const substitutions = [
		["SourceCharacter", CharacterNickname(SenderCharacter) + " (" + SenderCharacter.MemberNumber + ")"],
	];
	if (Player.FriendList.includes(SenderCharacter.MemberNumber)) {
		ChatRoomSendLocal(CommonStringSubstitute(TextGet("FriendAcceptMessage"), substitutions));
		return;
	}
	let id = CommonGenerateUniqueID();
	const hide = () => {
		document.getElementById(id)?.remove();
	};
	const addBack = () => {
		ChatRoomListUpdate(Player.FriendList, true, SenderCharacter.MemberNumber, "FriendRequest");
		ChatRoomSendLocal(CommonStringSubstitute(TextGet("FriendAddbackMessage"), substitutions));
		hide();
	};
	const ghost = () => {
		ChatRoomSendLocal(CommonStringSubstitute(TextGet("FriendGhostMessage"), substitutions));
		hide();
	};
	ChatRoomSendLocal(
		ElementCreate({
			tag: "div",
			children: TextSubstitute("FriendRequestMessage", {
				"SourceCharacter": CharacterNickname(SenderCharacter) + " (" + SenderCharacter.MemberNumber + ")",
				"{buttons}": ElementCreate(
					{
						tag: "div",
						classList: ["chat-room-friendrequest-buttons"],
						attributes: {id},
						children: [
							ElementButton.Create(null, null, null, {
								button: {
									classList: ["chat-room-friendrequest-add-back"],
									children: [TextGet("FriendAddback")],
								}
							}),
							ElementButton.Create(null, null, null, {
								button: {
									classList: ["chat-room-friendrequest-hide"],
									children: [TextGet("FriendIgnore")],
								}
							}),
							ElementButton.Create(null, null, null, {
								button: {
									classList: ["chat-room-friendrequest-ghost"],
									children: TextSubstitute("FriendGhost", {
										"SourceCharacter": CharacterNickname(SenderCharacter) + " (" + SenderCharacter.MemberNumber + ")",
									}),
								}
							}),
						],
					})
			}),
		}).outerHTML
	);

	const button = document.getElementById(id);
	if (button) {
		document.querySelector(`.chat-room-friendrequest-add-back`)?.addEventListener("click", addBack);
		document.querySelector(`.chat-room-friendrequest-ghost`)?.addEventListener("click", ghost);
		document.querySelector(`.chat-room-friendrequest-hide`)?.addEventListener("click", hide);
	}
}


/**
 * Updates character lists for the player and saves the change
 * @param {number[]} list - The array of member numbers to update
 * @param {boolean} adding - If TRUE adding to the list, if FALSE removing from the list
 * @param {number} memberNumber - The member number to add/remove
 * @param {"FriendRequest"} [notification] - used to send notifications
 * @returns {void} - Nothing
 */
function ChatRoomListUpdate(list, adding, memberNumber, notification) {
	if (memberNumber === Player.MemberNumber) return;
	if (!CommonIsNonNegativeInteger(memberNumber)) return;
	const numIdx = list.indexOf(memberNumber);
	if (adding && numIdx < 0) {
		if (notification) ServerSend("ChatRoomChat", { Content: `ChatRoom${notification}Add`, Type: "Hidden", Target: memberNumber});
		list.push(memberNumber);
	}
	else if (!adding && numIdx >= 0) {
		list.splice(numIdx, 1);
	}

	const triggeredOperations = ChatRoomListOperationTriggers().find(w => w.list == list && w.adding == adding);
	if (triggeredOperations) {
		triggeredOperations.triggers.forEach(op => {
			ChatRoomListUpdate(op.list, op.add, memberNumber);
		});
	}

	if (list == Player.GhostList) {
		const C = Character.find(Char => Char.MemberNumber == memberNumber);
		if (C) {
			CharacterRefresh(C, false);
		}
	}

	ServerPlayerRelationsSync();
	// The server will take care of pushing out updated character if the blacklist or whitelist was touched
}

/**
 * Adds a list of character(s) into the Focus List
 * @param {Character[]} characters - Characters to add
 * @param {boolean} [enableMessage=true] - If enabled, will tell (warn) the user when the focus feature becomes enabled (empty -> non-empty)
 * @returns {Character[]} - Characters that were actually added (not already in the list)
 */
function ChatRoomDrawFocusListAdd(characters, enableMessage=true) {
	const added = [];
	const wasInFocus = ChatRoomPlayerIsInDrawFocus();
	characters.forEach(c => {
		if (!ChatRoomDrawFocusList.includes(c)) {
			ChatRoomDrawFocusList.push(c);
			added.push(c);
		}
	});
	if (enableMessage && !wasInFocus && ChatRoomPlayerIsInDrawFocus()) {
		const enableMessageText = TextGet("FocusEnabled").replaceAll('FocusEnabledWarningIcon', TextGet("FocusEnabledWarningIcon"));
		ChatRoomSendLocal(`<span style="color: deepskyblue">${enableMessageText}</span>`, 60_000);
	}
	return added;
}

/**
 * Removes a list of character(s) from the Focus List
 * @param {Character[]} characters - Characters to remove
 * @returns {Character[]} - Characters that were actually removed (were in the list)
 */
function ChatRoomDrawFocusListRemove(characters) {
	const removed = [];
	characters.forEach(c => {
		if (ChatRoomDrawFocusList.includes(c)) {
			ChatRoomDrawFocusList.splice(ChatRoomDrawFocusList.indexOf(c), 1);
			removed.push(c);
		}
	});
	return removed;
}

/**
 * Clears the Focus List
 */
function ChatRoomDrawFocusListClear() {
	ChatRoomDrawFocusList = [];
}

/**
 * Handles reception of data pertaining to if applying an item is allowed.
 * @param {ServerChatRoomAllowItemResponse} data - Data object containing if the player is allowed to interact with a character.
 * @returns {void} - Nothing
 */
function ChatRoomAllowItem(data) {
	if ((data != null) && (typeof data === "object") && (data.MemberNumber != null) && (typeof data.MemberNumber === "number") && (data.AllowItem != null) && (typeof data.AllowItem === "boolean"))
		if (CurrentCharacter != null && CurrentCharacter.MemberNumber == data.MemberNumber && data.AllowItem !== CurrentCharacter.AllowItem) {
			console.warn(`ChatRoomGetAllowItem mismatch trying to access ${CurrentCharacter.Name} (${CurrentCharacter.MemberNumber})`);
			CurrentCharacter.AllowItem = data.AllowItem;
			CharacterSetCurrent(CurrentCharacter);
		}
}

/**
 * Opens the appearance editor for the given character
 * @param {Character} C
 */
function ChatRoomAppearanceLoadCharacter(C) {
	const screen = CommonGetScreen();
	const inChatRoom = ServerPlayerIsInChatRoom();
	if (inChatRoom) {
		ChatRoomStatusUpdate("Wardrobe");
	}
	CharacterAppearanceLoadCharacter(C, (ready) => {
		CommonSetScreen(...screen);
		if (inChatRoom) {
			ChatRoomShowElements();
			ChatRoomStatusUpdate(null);
			if (ready) {
				ChatRoomCharacterUpdate(C);
				if (!C.IsPlayer()) {
					// Send a notification if we've changed clothes on someone else
					const Dictionary = new DictionaryBuilder()
						.sourceCharacter(Player)
						.destinationCharacter(C)
						.build();
					ServerSend("ChatRoomChat", { Content: "ChangeClothes", Type: "Action", Dictionary: Dictionary });
				}
			}
		}
	});
}

/**
 * Triggered when the player wants to change another player's outfit.
 * @returns {void} - Nothing
 */
function DialogChangeClothes() {
	const C = CurrentCharacter;
	DialogLeave();
	ChatRoomAppearanceLoadCharacter(C);
}

/**
 * Triggered when the player selects an ownership dialog option. (It can change money and reputation)
 * @param {"Propose" | "Accept" | "Release" | "Break"} RequestType - Type of request being performed.
 * @returns {void} - Nothing
 */
function ChatRoomSendOwnershipRequest(RequestType) {
	if ((ChatRoomOwnershipOption == "CanOfferEndTrial") && (RequestType == "Propose")) {
		CharacterChangeMoney(Player, -100);
		DialogChangeReputation("Dominant", 10);
	}
	if ((ChatRoomOwnershipOption == "CanEndTrial") && (RequestType == "Accept")) {
		DialogChangeReputation("Dominant", -20);
	}
	ChatRoomOwnershipOption = null;
	ServerSend("AccountOwnership", { MemberNumber: CurrentCharacter.MemberNumber, Action: RequestType });
	if (RequestType === "Propose") {
		const msg = InterfaceTextGet("OwnerProposeSub").replace("TargetCharacterName", CharacterNickname(CurrentCharacter));
		ChatRoomSendLocal(msg);
	}
	if (RequestType == "Accept") DialogLeave();
}

/**
 * Triggered when the player selects an lovership dialog option. (It can change money and reputation)
 * @param {"Propose" | "Accept" | "Release" | "Break"} RequestType - Type of request being performed.
 * @returns {void} - Nothing
 */
function ChatRoomSendLovershipRequest(RequestType) {
	if ((ChatRoomLovershipOption == "CanOfferBeginWedding") && (RequestType == "Propose")) CharacterChangeMoney(Player, -100);
	if ((ChatRoomLovershipOption == "CanBeginWedding") && (RequestType == "Accept")) CharacterChangeMoney(Player, -100);
	ChatRoomLovershipOption = null;
	ServerSend("AccountLovership", { MemberNumber: CurrentCharacter.MemberNumber, Action: RequestType });
	if (RequestType == "Accept" || RequestType === "Break") DialogLeave();
}

/**
 * Triggered when the player picks a drink from a character's maid tray.
 * @param {string} DrinkType - Drink chosen.
 * @param {number} Money - Cost of the drink.
 * @returns {void} - Nothing
 */
function ChatRoomDrinkPick(DrinkType, Money) {
	if (ChatRoomCanTakeDrink()) {
		const Dictionary = new DictionaryBuilder()
			.sourceCharacter(Player)
			.targetCharacter(CurrentCharacter)
			.destinationCharacter(CurrentCharacter)
			.build();
		ServerSend("ChatRoomChat", { Content: "MaidDrinkPick" + DrinkType, Type: "Action", Dictionary });
		ServerSend("ChatRoomChat", { Content: "MaidDrinkPick" + Money.toString(), Type: "Hidden", Target: CurrentCharacter.MemberNumber });
		CharacterChangeMoney(Player, Money * -1);
		DialogLeave();
	}
}

/** @type {(RuleType: LogNameType[keyof LogNameType], Option: "Quest" | "Leave") => void} */
function ChatRoomSendLoverRule(RuleType, Option) {
	ChatRoomSendRule(RuleType, Option, "Lover");
	TimerCreate(() => {
		CharacterRefreshDialog(CurrentCharacter);
	}, 400, false);
}
/** @type {(RuleType: LogNameType[keyof LogNameType], Option: "Quest" | "Leave") => void} */
function ChatRoomSendOwnerRule(RuleType, Option) {
	ChatRoomSendRule(RuleType, Option, "Owner");
	TimerCreate(() => {
		CharacterRefreshDialog(CurrentCharacter);
	}, 400, false);
}
/** @type {(RuleType: LogNameAdvanced) => void} */
function ChatRoomAdvancedRule(RuleType) { AdvancedRuleOpen(RuleType); }
function ChatRoomForbiddenWords() { ForbiddenWordsOpen(); }

/**
 * Sends a rule / restriction / punishment to the player's slave/lover client, it will be handled on the slave/lover's
 * side when received.
 * @param {LogNameType[keyof LogNameType]} RuleType - The rule selected.
 * @param {"Quest" | "Leave"} Option - If the rule is a quest or we should just leave the dialog.
 * @param {"Owner" | "Lover"} Sender - Type of the sender
 * @returns {void} - Nothing
 */
function ChatRoomSendRule(RuleType, Option, Sender) {
	ServerSend("ChatRoomChat", { Content: Sender + "Rule" + RuleType, Type: "Hidden", Target: CurrentCharacter.MemberNumber });
	if (Option == "Quest") {
		if (ChatRoomQuestGiven.indexOf(CurrentCharacter.MemberNumber) >= 0) ChatRoomQuestGiven.splice(ChatRoomQuestGiven.indexOf(CurrentCharacter.MemberNumber), 1);
		ChatRoomQuestGiven.push(CurrentCharacter.MemberNumber);
	}
	if ((Option == "Leave") || (Option == "Quest")) DialogLeave();
}

/**
 * @param {LogNameType["LoverRule"]} RuleType
 * @returns {boolean}
 */
function ChatRoomGetLoverRule(RuleType) { return ChatRoomGetRule(RuleType, "Lover"); }

/**
 * @param {LogNameType["OwnerRule"]} RuleType
 * @returns {boolean}
 */
function ChatRoomGetOwnerRule(RuleType) { return ChatRoomGetRule(RuleType, "Owner"); }

/**
 * Return TRUE if the current character allows to change her own nickname by her owner
 * @returns {boolean}
 */
function ChatRoomCanChangeNickname() { return (CurrentCharacter != null) && (CurrentCharacter.OnlineSharedSettings != null) && (CurrentCharacter.OnlineSharedSettings.AllowRename !== false) && CurrentCharacter.IsOwnedByPlayer(); }

/**
 * Enters the submissive character nickname edit/lock screen
 * @returns {void}
 */
function ChatRoomChangeNickname() {
	NicknameManagementTarget = CurrentCharacter;
	DialogLeave();
	CommonSetScreen("Online", "NicknameManagement");
}

/**
 * Gets a rule from the current character
 * @param {LogNameType["OwnerRule" | "LoverRule"]} RuleType - The name of the rule to retrieve.
 * @param {"Owner" | "Lover"} Sender - Type of the sender
 * @returns {boolean} - The owner or lover rule corresponding to the requested rule name
 */
function ChatRoomGetRule(RuleType, Sender) {
	return LogQueryRemote(CurrentCharacter, RuleType, `${Sender}Rule`);
}


/**
 * Processes a rule sent to the player from her owner or from her lover.
 * @param {ServerChatRoomMessage} data - Received rule data object.
 * @returns {void}
 */
function ChatRoomSetRule(data) {

	// Only works if the sender is the player, and the player is fully collared
	if (data != null && Player.IsFullyOwned() && Player.IsOwnedByMemberNumber(data.Sender)) {

		// Wardrobe/changing rules
		if (data.Content == "OwnerRuleChangeAllow") LogDelete("BlockChange", "OwnerRule");
		if (data.Content == "OwnerRuleChangeBlock1Hour") LogAdd("BlockChange", "OwnerRule", CurrentTime + 3600000);
		if (data.Content == "OwnerRuleChangeBlock1Day") LogAdd("BlockChange", "OwnerRule", CurrentTime + 86400000);
		if (data.Content == "OwnerRuleChangeBlock1Week") LogAdd("BlockChange", "OwnerRule", CurrentTime + 604800000);
		if (data.Content == "OwnerRuleChangeBlock") LogAdd("BlockChange", "OwnerRule", CurrentTime + 1000000000000);

		// Owner presence rules
		if (data.Content == "OwnerRuleTalkAllow") LogDelete("BlockTalk", "OwnerRule");
		if (data.Content == "OwnerRuleTalkBlock") LogAdd("BlockTalk", "OwnerRule");
		if (data.Content == "OwnerRuleEmoteAllow") LogDelete("BlockEmote", "OwnerRule");
		if (data.Content == "OwnerRuleEmoteBlock") LogAdd("BlockEmote", "OwnerRule");
		if (data.Content == "OwnerRuleWhisperAllow") LogDelete("BlockWhisper", "OwnerRule");
		if (data.Content == "OwnerRuleWhisperBlock") { LogAdd("BlockWhisper", "OwnerRule"); ChatRoomSetTarget(-1); }
		if (data.Content == "OwnerRuleChangePoseAllow") LogDelete("BlockChangePose", "OwnerRule");
		if (data.Content == "OwnerRuleChangePoseBlock") LogAdd("BlockChangePose", "OwnerRule");
		if (data.Content == "OwnerRuleAccessSelfAllow") LogDelete("BlockAccessSelf", "OwnerRule");
		if (data.Content == "OwnerRuleAccessSelfBlock") LogAdd("BlockAccessSelf", "OwnerRule");
		if (data.Content == "OwnerRuleAccessOtherAllow") LogDelete("BlockAccessOther", "OwnerRule");
		if (data.Content == "OwnerRuleAccessOtherBlock") LogAdd("BlockAccessOther", "OwnerRule");

		// Key rules
		if (data.Content == "OwnerRuleKeyAllow") LogDelete("BlockKey", "OwnerRule");
		if (data.Content == "OwnerRuleKeyConfiscate") { InventoryConfiscateKey(); DialogLentLockpicks = false; }
		if (data.Content == "OwnerRuleKeyBlock") LogAdd("BlockKey", "OwnerRule");
		if (data.Content == "OwnerRuleKeyAllowFamily") LogDelete("BlockFamilyKey", "OwnerRule");
		if (data.Content == "OwnerRuleKeyBlockFamily") LogAdd("BlockFamilyKey", "OwnerRule");
		if (data.Content == "OwnerRuleSelfOwnerLockAllow") LogDelete("BlockOwnerLockSelf", "OwnerRule");
		if (data.Content == "OwnerRuleSelfOwnerLockBlock") LogAdd("BlockOwnerLockSelf", "OwnerRule");

		// Remote rules
		if (data.Content == "OwnerRuleRemoteAllow") LogDelete("BlockRemote", "OwnerRule");
		if (data.Content == "OwnerRuleRemoteAllowSelf") LogDelete("BlockRemoteSelf", "OwnerRule");
		if (data.Content == "OwnerRuleRemoteConfiscate") InventoryConfiscateRemote();
		if (data.Content == "OwnerRuleRemoteBlock") LogAdd("BlockRemote", "OwnerRule");
		if (data.Content == "OwnerRuleRemoteBlockSelf") LogAdd("BlockRemoteSelf", "OwnerRule");

		// Sent to timer cell
		let TimerCell = 0;
		if (data.Content == "OwnerRuleTimerCell5") TimerCell = 5;
		if (data.Content == "OwnerRuleTimerCell15") TimerCell = 15;
		if (data.Content == "OwnerRuleTimerCell30") TimerCell = 30;
		if (data.Content == "OwnerRuleTimerCell60") TimerCell = 60;
		if (TimerCell > 0) {
			const Dictionary = new DictionaryBuilder()
				.targetCharacterName(Player)
				.build();
			ServerSend("ChatRoomChat", { Content: "ActionGrabbedForCell", Type: "Action", Dictionary });
			ChatRoomLeave(true);
			CellLock(TimerCell);
		}

		// Sent to GGTS
		let GGTS = 0;
		if (data.Content == "OwnerRuleGGTS5") GGTS = 5;
		if (data.Content == "OwnerRuleGGTS15") GGTS = 15;
		if (data.Content == "OwnerRuleGGTS30") GGTS = 30;
		if (data.Content == "OwnerRuleGGTS60") GGTS = 60;
		if (data.Content == "OwnerRuleGGTS90") GGTS = 90;
		if (data.Content == "OwnerRuleGGTS120") GGTS = 120;
		if (data.Content == "OwnerRuleGGTS180") GGTS = 180;
		if (GGTS > 0) {
			const Dictionary = new DictionaryBuilder()
				.targetCharacterName(Player)
				.build();
			ServerSend("ChatRoomChat", { Content: "ActionGrabbedForGGTS", Type: "Action", Dictionary });
			ChatRoomLeave(true);
			AsylumGGTSLock(GGTS, TextGet("GGTSIntro"));
		}

		// Nickname changing and locking
		if (data.Content == "OwnerRuleNicknameAllow") LogDelete("BlockNickname", "OwnerRule");
		if (data.Content == "OwnerRuleNicknameBlock") LogAdd("BlockNickname", "OwnerRule");
		if (data.Content.startsWith("OwnerRuleNicknameNew")) {
			let NewNick = data.Content.substring(20);
			CharacterSetNickname(Player, NewNick, true);
			data.Content = "OwnerRuleNicknameNew";
		}

		// Collar rules
		if (data.Content == "OwnerRuleCollarRelease") {
			if ((InventoryGet(Player, "ItemNeck") != null) && (InventoryGet(Player, "ItemNeck").Asset.Name == "SlaveCollar")) {
				InventoryRemove(Player, "ItemNeck");
				ChatRoomCharacterItemUpdate(Player, "ItemNeck");
				const Dictionary = new DictionaryBuilder()
					.destinationCharacterName(Player)
					.build();
				ServerSend("ChatRoomChat", { Content: "PlayerOwnerCollarRelease", Type: "Action", Dictionary });
			}
			LogAdd("ReleasedCollar", "OwnerRule");
		}
		if (data.Content == "OwnerRuleCollarWear") {
			if ((InventoryGet(Player, "ItemNeck") == null) || ((InventoryGet(Player, "ItemNeck") != null) && (InventoryGet(Player, "ItemNeck").Asset.Name != "SlaveCollar"))) {
				const Dictionary = new DictionaryBuilder()
					.targetCharacterName(Player)
					.build();
				ServerSend("ChatRoomChat", { Content: "PlayerOwnerCollarWear", Type: "Action", Dictionary });
			}
			LogDelete("ReleasedCollar", "OwnerRule");
			LoginValidCollar();
		}

		// Advanced rules - Block screens
		if (data.Content.startsWith("OwnerRuleBlockScreen")) {
			LogDeleteStarting("BlockScreen", "OwnerRule");
			LogAdd(`BlockScreen${data.Content.substring("OwnerRuleBlockScreen".length, 100)}`, "OwnerRule");
			data.Content = "OwnerRuleBlockScreen";
		}

		// Advanced rules - Block appearance zones
		if (data.Content.startsWith("OwnerRuleBlockAppearance")) {
			LogDeleteStarting("BlockAppearance", "OwnerRule");
			LogAdd(`BlockAppearance${data.Content.substring("OwnerRuleBlockAppearance".length, 100)}`, "OwnerRule");
			data.Content = "OwnerRuleBlockAppearance";
		}

		// Advanced rules - Block item groups
		if (data.Content.startsWith("OwnerRuleBlockItemGroup")) {
			LogDeleteStarting("BlockItemGroup", "OwnerRule");
			LogAdd(`BlockItemGroup${data.Content.substring("OwnerRuleBlockItemGroup".length, 100)}`, "OwnerRule");
			data.Content = "OwnerRuleBlockItemGroup";
		}

		// Advanced rules - Forbidden Words List
		if (data.Content.startsWith("OwnerRuleForbiddenWords")) {
			LogDeleteStarting("ForbiddenWords", "OwnerRule");
			LogAdd(`ForbiddenWords${data.Content.substring("OwnerRuleForbiddenWords".length, 10000)}`, "OwnerRule");
			data.Content = "OwnerRuleForbiddenWords";
		}

		// Forced labor
		if (data.Content == "OwnerRuleLaborMaidDrinks" && Player.CanTalk()) {
			PoseSetActive(Player, null);
			var D = TextGet("ActionGrabbedToServeDrinksIntro");
			const Dictionary = new DictionaryBuilder()
				.targetCharacterName(CurrentCharacter)
				.build();
			ServerSend("ChatRoomChat", { Content: "ActionGrabbedToServeDrinks", Type: "Action", Dictionary });
			ChatRoomLeave();
			CommonSetScreen("Room", "MaidQuarters");
			CharacterSetCurrent(MaidQuartersMaid);
			MaidQuartersMaid.CurrentDialog = D;
			MaidQuartersMaid.Stage = "205";
			MaidQuartersOnlineDrinkFromOwner = true;
		}

		// Forced Wheel of Fortune
		if (data.Content == "OwnerRuleForceWheelFortune") {
			for (let C of ChatRoomCharacter)
				if (C.IsOwner())
					CharacterSetCurrent(C);
			if ((CurrentCharacter == null) || !CurrentCharacter.IsOwner() || !InventoryIsWorn(CurrentCharacter, "ItemDevices", "WheelFortune")) return;
			WheelFortuneReturnScreen = CommonGetScreen();
			WheelFortuneBackground = ChatRoomData.Background;
			WheelFortuneCharacter = CurrentCharacter;
			WheelFortuneForced = true;
			DialogLeave();
			CommonSetScreen("MiniGame", "WheelFortune");
		}

		ChatRoomGetLoadRules(data.Sender);

		// Switches it to a server message to announce the new rule to the player
		data.Type = "ServerMessage";
		ChatRoomMessage(data);
	}

	// Only works if the sender is the lover of the player
	if ((data != null) && Player.GetLoversNumbers().includes(data.Sender)) {
		if (data.Content == "LoverRuleSelfLoverLockAllow") LogDelete("BlockLoverLockSelf", "LoverRule");
		if (data.Content == "LoverRuleSelfLoverLockBlock") LogAdd("BlockLoverLockSelf", "LoverRule");
		if (data.Content == "LoverRuleOwnerLoverLockAllow") LogDelete("BlockLoverLockOwner", "LoverRule");
		if (data.Content == "LoverRuleOwnerLoverLockBlock") LogAdd("BlockLoverLockOwner", "LoverRule");

		ChatRoomGetLoadRules(data.Sender);

		// Switches it to a server message to announce the new rule to the player
		data.Type = "ServerMessage";
		ChatRoomMessage(data);
	}
}

/**
 * Sends quest money to the player's owner.
 * @returns {void} - Nothing
 */
function ChatRoomGiveMoneyForOwner() {
	if (ChatRoomCanGiveMoneyForOwner()) {
		const Dictionary = new DictionaryBuilder()
			.targetCharacterName(CurrentCharacter)
			.build();
		ServerSend("ChatRoomChat", { Content: "ActionGiveEnvelopeToOwner", Type: "Action", Dictionary });
		ServerSend("ChatRoomChat", { Content: "PayQuest" + ChatRoomMoneyForOwner.toString(), Type: "Hidden", Target: CurrentCharacter.MemberNumber });
		ChatRoomMoneyForOwner = 0;
		DialogLeave();
	}
}

/**
 * Handles the reception of quest data, when payment is received.
 * @param {number} questGiverNumber
 * @param {number} paymentAmount
 * @returns {void} - Nothing
 */
function ChatRoomPayQuest(questGiverNumber, paymentAmount) {
	if (ChatRoomQuestGiven.indexOf(questGiverNumber) < 0) return;

	if (paymentAmount == null || isNaN(paymentAmount)) return;

	if (paymentAmount < 0) paymentAmount = 0;
	if (paymentAmount > 30) paymentAmount = 30;
	CharacterChangeMoney(Player, paymentAmount);
	ChatRoomQuestGiven.splice(ChatRoomQuestGiven.indexOf(questGiverNumber), 1);
}

/**
 * Triggered when online game data comes in
 * @param {ServerChatRoomGameBountyUpdateRequest["OnlineBounty"]} data - Game data to process, sent to the current game handler.
 * @param {number} sender
 * @returns {void} - Nothing
 */
function ChatRoomOnlineBountyHandleData(data, sender) {
	if (data.finishTime && data.target == Player.MemberNumber) {
		let senderChar = ChatRoomCharacter.find(c => c.MemberNumber == sender);
		const remaining = Math.max(1, Math.ceil((data.finishTime - CommonTime()) / 60000));
		const content = ChatRoomCarryingBountyOpened(senderChar) ? "OnlineBountySuitcaseOngoingOpened" : "OnlineBountySuitcaseOngoing";
		const dict = new DictionaryBuilder()
			.sourceCharacter(senderChar)
			.targetCharacter(Player)
			.text("TIMEREMAINING", remaining.toString())
			.build();
		ChatRoomMessage({ Content: content, Type: "Action", Dictionary: dict, Sender: sender });
	}
}

/**
 * Triggered when a game message comes in, we forward it to the current online game being played.
 * @param {ServerChatRoomGameResponse} data - Game data to process, sent to the current game handler.
 * @returns {void} - Nothing
 */
function ChatRoomGameResponse(data) {
	if (data.Data.KinkyDungeon) {
		if (CurrentScreen == "KinkyDungeon") {
			KinkyDungeonHandleData(data.Data.KinkyDungeon, data.Sender);
		}
	} else if (KidnapLeagueOnlineBountyTarget && data.Data.OnlineBounty)
		ChatRoomOnlineBountyHandleData(data.Data.OnlineBounty, data.Sender);
	else if (ChatRoomData.Game == "LARP") GameLARPProcess(data);
	else if (ChatRoomData.Game == "MagicBattle") GameMagicBattleProcess(data);
	else if (ChatRoomData.Game == "ClubCard") GameClubCardProcess(data);
}

/**
 * Triggered when the player uses the /safeword command, we revert the character if safewords are enabled, and display
 * a warning in chat if not.
 * @returns {void} - Nothing
 */
function ChatRoomSafewordChatCommand() {
	if (DialogChatRoomCanSafeword())
		ChatRoomSafewordRevert();
	else if (ServerPlayerIsInChatRoom()) {
		/** @type {ServerChatRoomMessage} */
		var msg = {Sender: Player.MemberNumber, Content: "SafewordDisabled", Type: "Action"};
		ChatRoomMessage(msg);
	}
}

/**
 * Triggered when the player activates her safeword to revert, we swap her appearance to the state when she entered the
 * chat room lobby, minimum permission becomes whitelist and up.
 * @returns {void} - Nothing
 */
function ChatRoomSafewordRevert() {
	if (ChatSearchSafewordAppearance != null) {
		Player.Appearance = ChatSearchSafewordAppearance.slice(0);
		Player.ActivePoseMapping = ChatSearchSafewordPose;
		CharacterRefresh(Player);
		ChatRoomCharacterUpdate(Player);
		const Dictionary = new DictionaryBuilder()
			.sourceCharacter(Player)
			.build();
		ServerSend("ChatRoomChat", { Content: "ActionActivateSafewordRevert", Type: "Action", Dictionary });
		if (Player.AllowedInteractions < AllowedInteractions.OwnerLoversWhitelistOnly) {
			Player.AllowedInteractions = AllowedInteractions.OwnerLoversWhitelistOnly;
			ServerAccountUpdate.QueueData({ AllowedInteractions: Player.AllowedInteractions, ItemPermission: Player.AllowedInteractions }, true);
			setTimeout(() => ChatRoomCharacterUpdate(Player), 5000);
		}
	}
}

/**
 * Triggered when the player activates her safeword and wants to be released, we remove all bondage from her and return
 * her to the chat search screen.
 * @returns {void} - Nothing
 */
function ChatRoomSafewordRelease() {
	PandoraPenitentiarySafewordRooms.push(ChatRoomData.Name);
	CharacterReleaseTotal(Player);
	CharacterRefresh(Player);
	const Dictionary = new DictionaryBuilder()
		.sourceCharacter(Player)
		.build();
	ServerSend("ChatRoomChat", { Content: "ActionActivateSafewordRelease", Type: "Action", Dictionary });
	ChatRoomLeave();
	CommonSetScreen("Online", "ChatSearch");
}

/**
 * Concatenates the list of users to ban.
 * @param {("BlackList" | "GhostList")[]} [IncludesTypes] - The types of lists to concatenate to the banlist
 * @param {readonly number[]} [ExistingList] - The existing Banlist, if applicable
 * @returns {number[]} Complete array of members to ban
 */
function ChatRoomConcatenateBanList(IncludesTypes, ExistingList) {
	var BanList = Array.isArray(ExistingList) ? ExistingList : [];
	IncludesTypes.forEach(Type => {
		if (Type == "BlackList") BanList = BanList.concat(Player.BlackList);
		else if (Type == "GhostList") BanList = BanList.concat(Player.GhostList);
	});
	return BanList.filter((MemberNumber, Idx, Arr) => Arr.indexOf(MemberNumber) == Idx);
}

/**
 * Concatenates the list of users for the whitelist.
 * @param {("Owner" | "Lovers" | "Friends" | "Whitelist")[]} [IncludesTypes] - The types of lists to concatenate to the whitelist
 * @param {readonly number[]} [ExistingList] - The existing Whitelist, if applicable
 * @returns {number[]} Complete array of whitelisted members
 */
function ChatRoomConcatenateWhitelist(IncludesTypes, ExistingList) {
	/** @type {readonly number[]} */
	let Whitelist = Array.isArray(ExistingList) ? ExistingList : [];
	IncludesTypes.forEach(Type => {
		if (Type == "Owner" && Player.OwnerNumber() !== -1) Whitelist = Whitelist.concat(Player.OwnerNumber());
		else if (Type == "Lovers") Whitelist = Whitelist.concat(Player.GetLoversNumbers(true));
		else if (Type == "Friends") Whitelist = Whitelist.concat(Player.FriendList);
		else if (Type == "Whitelist") Whitelist = Whitelist.concat(Player.WhiteList);
	});
	return Whitelist.filter((MemberNumber, Idx, Arr) => Arr.indexOf(MemberNumber) == Idx);
}

/**
 * Concatenates the list of users for Admin list.
 * @param {("Owner" | "Lovers")[]} [IncludesTypes] - The types of lists to concatenate to the adminlist
 * @param {readonly number[]} [ExistingList] - The existing Admin list, if applicable
 * @returns {number[]} Complete array of admin members
 */
function ChatRoomConcatenateAdminList(IncludesTypes, ExistingList) {
	/** @type {readonly number[]} */
	let AdminList = Array.isArray(ExistingList) ? ExistingList : [];
	IncludesTypes.forEach(Type => {
		if (Type == "Owner" && Player.OwnerNumber() !== -1) AdminList = AdminList.concat(Player.OwnerNumber());
		else if (Type == "Lovers") AdminList = AdminList.concat(Player.GetLoversNumbers(true));
	});
	return AdminList.filter((MemberNumber, Idx, Arr) => Arr.indexOf(MemberNumber) == Idx);
}

/**
 * Handles a request from another player to read the player's log entries that they are permitted to read. Lovers and
 * owners can read certain entries from the player's log.
 * @param {Character|number} C - A character object representing the requester, or the account number of the requester.
 * @returns {void} - Nothing
 */
function ChatRoomGetLoadRules(C) {
	if (typeof C === "number") {
		C = ChatRoomCharacter.find(CC => CC.MemberNumber == C);
	}
	if (C == null) return;
	if (Player.IsOwnedByCharacter(C)) {
		ServerSend("ChatRoomChat", {
			Content: "RuleInfoSet",
			Type: "Hidden",
			Target: C.MemberNumber,
			// @ts-expect-error That message uses .Dictionary as storage for LogRecord[]
			Dictionary: LogGetOwnerReadableRules(C.IsLoverOfPlayer()),
		});
	} else if (C.IsLoverOfPlayer()) {
		ServerSend("ChatRoomChat", {
			Content: "RuleInfoSet",
			Type: "Hidden",
			Target: C.MemberNumber,
			// @ts-expect-error That message uses .Dictionary as storage for LogRecord[]
			Dictionary: LogGetLoverReadableRules(),
		});
	}
}

/**
 * Handles a response from another player containing the rules that the current player is allowed to read.
 * @param {Character} C - Character to set the rules on
 * @param {LogRecord[]} Rule - An array of rules that the current player can read.
 * @returns {void} - Nothing
 */
function ChatRoomSetLoadRules(C, Rule) {
	if (CommonIsArray(Rule)) {
		C.Rule = Rule;
	}
}

/**
 * Take a screenshot of all characters in the chatroom
 * @returns {void} - Nothing
 */
function ChatRoomPhotoFullRoom() {
	ChatRoomActiveView.Screenshot();
}

/**
 * Take a screenshot of the player and current character
 * @returns {void} - Nothing
 */
function DialogPhotoCurrentCharacters() {
	ChatRoomPhoto(0, 0, 1000, 1000, [Player, CurrentCharacter]);
}

/**
 * Take a screenshot of the player
 * @returns {void} - Nothing
 */
function DialogPhotoPlayer() {
	ChatRoomPhoto(500, 0, 500, 1000, [Player]);
}

/**
 * Take a screenshot in a chatroom, temporary removing emoticons
 * @param {number} Left - Position of the area to capture from the left of the canvas
 * @param {number} Top - Position of the area to capture from the top of the canvas
 * @param {number} Width - Width of the area to capture
 * @param {number} Height - Height of the area to capture
 * @param {readonly Character[]} Characters - The characters that will be included in the screenshot
 * @returns {void} - Nothing
 */
function ChatRoomPhoto(Left, Top, Width, Height, Characters) {
	// Temporarily remove AFK emoticons
	let CharsToReset = [];
	for (let CR = 0; CR < Characters.length; CR++) {
		let C = Characters[CR];
		let Emoticon = C.Appearance.find(A => A.Asset.Group.Name == "Emoticon");
		if (Emoticon && Emoticon.Property && Emoticon.Property.Expression == "Afk") {
			CharsToReset.push(C);
			Emoticon.Property.Expression = null;
			CharacterRefresh(C, false);
		}
	}

	// Take the photo
	CommonTakePhoto(Left, Top, Width, Height);

	// Revert temporary changes
	for (let CR = 0; CR < CharsToReset.length; CR++) {
		let C = CharsToReset[CR];
		C.Appearance.find(A => A.Asset.Group.Name == "Emoticon").Property.Expression = "Afk";
		CharacterRefresh(C, false);
	}
}

/**
 * Returns whether the most recent chat message is on screen
 * @returns {boolean} - TRUE if the screen has focus and the chat log is scrolled to the bottom
 */
function ChatRoomNotificationNewMessageVisible() {
	const chatlog = document.getElementById("TextAreaChatLog");
	return (
		chatlog
		&& document.hasFocus()
		&& ElementCheckVisibility(chatlog)
		&& ElementIsScrolledToEnd("TextAreaChatLog")
	);
}

/**
 * Raise a notification for the new chat message if required
 * @param {Character} C - The character that sent the message
 * @param {string} msg - The text of the message
 * @returns {void} - Nothing
 */
function ChatRoomNotificationRaiseChatMessage(C, msg) {
	if (!C.IsPlayer()
		&& Player.NotificationSettings.ChatMessage.AlertType !== NotificationAlertType.NONE
		&& !ChatRoomNotificationNewMessageVisible())
	{
		NotificationRaise(NotificationEventType.CHATMESSAGE, { body: msg, character: C, useCharAsIcon: true });
	}
}

/**
 * Resets any previously raised Chat Message or Chatroom Join notifications if required
 * @returns {void} - Nothing
 */
function ChatRoomNotificationReset() {
	if (CurrentScreen !== "ChatRoom" || ChatRoomNotificationNewMessageVisible()) {
		NotificationReset(NotificationEventType.CHATMESSAGE);
	}
	if (document.hasFocus()) NotificationReset(NotificationEventType.CHATJOIN);
}

/**
 * Returns whether a notification should be raised for the character entering a chatroom
 * @param {Character} C - The character that entered the room
 * @returns {boolean} - Whether a notification should be raised
 */
function ChatRoomNotificationRaiseChatJoin(C) {
	let raise = false;
	if (!document.hasFocus()) {
		const settings = Player.NotificationSettings.ChatJoin;
		if (settings.AlertType === NotificationAlertType.NONE) raise = false;
		else if (PreferenceIsPlayerInSensDep()) raise = false;
		else if (!settings.Owner && !settings.Lovers && !settings.Friendlist && !settings.Subs) raise = true;
		else if (settings.Owner && Player.IsOwnedByMemberNumber(C.MemberNumber)) raise = true;
		else if (settings.Lovers && C.IsLoverOfPlayer()) raise = true;
		else if (settings.Friendlist && C.IsFriend()) raise = true;
		else if (settings.Subs && C.IsOwnedByPlayer()) raise = true;
	}
	return raise;
}

/**
 * Updates the chatroom with the player's stored chatroom data if needed (happens when entering a recreated chatroom for
 * the first time)
 * @returns {void} - Nothing
 */
function ChatRoomRecreate() {
	if (CurrentTime > ChatRoomNewRoomToUpdateTimer && ChatRoomNewRoomToUpdate && Player.ImmersionSettings && Player.ImmersionSettings.ReturnToChatRoomAdmin &&
		Player.ImmersionSettings.ReturnToChatRoom && Player.LastChatRoom?.Admin) {
		// Add the player if they are not an admin
		if (!Player.LastChatRoom.Admin.includes(Player.MemberNumber) && ChatRoomDataIsPrivate(Player.LastChatRoom)) {
			Player.LastChatRoom.Admin.push(Player.MemberNumber);
		}

		ServerSend("ChatRoomAdmin", { MemberNumber: Player.ID, Room: Player.LastChatRoom, Action: "Update" });
		ChatRoomNewRoomToUpdate = null;
	}
}

/**
 * Checks whether or not the player's last chatroom data needs updating
 * @returns {void} - Nothing
 */
function ChatRoomCheckForLastChatRoomUpdates() {
	const Blacklist = Player.BlackList || [];
	// Check whether the chatroom contains at least one "safe" character (a friend, owner, or non-blacklisted player)
	const ContainsSafeCharacters = ChatRoomCharacter.length === 1 || ChatRoomCharacter.some((Char) => {
		return !Char.IsPlayer() && (
			Char.IsFriend() ||
			Player.IsOwnedByMemberNumber(Char.MemberNumber) ||
			!Blacklist.includes(Char.MemberNumber)
		);
	});

	if (!ChatRoomData || !ContainsSafeCharacters) {
		// If the room only contains blacklisted characters, do not save the room data
		ChatRoomSetLastChatRoom(null);
	} else if (Player.ImmersionSettings && ChatRoomDataChanged()) {
		// Otherwise save the chatroom data if it has changed
		ChatRoomSetLastChatRoom(ChatRoomData);
	}
}

/**
 * Determines whether or not the current chatroom data differs from the locally stored chatroom data
 * @returns {boolean} - TRUE if the stored chatroom data is different from the current chatroom data, FALSE otherwise
 */
function ChatRoomDataChanged() {
	const prev = Player.LastChatRoom;
	const curr = ChatRoomData;

	if (typeof curr.Custom != typeof prev) return true;
	if ((typeof curr.Custom === "object") && (typeof prev === "object")) {
		if ((curr.Custom == null) != (prev == null)) return true;
		if (JSON.stringify(curr.Custom) !== JSON.stringify(prev)) return true;
	}

	return prev !== curr || prev.Name !== curr.Name ||
		prev.Background !== curr.Background ||
		prev.Limit !== curr.Limit ||
		prev.Language !== curr.Language ||
		prev.Visibility !== curr.Visibility ||
		prev.Access !== curr.Access ||
		prev.Description !== curr.Description ||
		!CommonArraysEqual(prev.Admin, curr.Admin) ||
		!CommonArraysEqual(prev.Whitelist, curr.Whitelist) ||
		!CommonArraysEqual(prev.Ban, curr.Ban) ||
		!CommonArraysEqual(prev.BlockCategory, curr.BlockCategory) ||
		prev.Space !== curr.Space ||
		JSON.stringify(prev.MapData) !== JSON.stringify(curr.MapData);
}

function ChatRoomRefreshFontSize() {
	ChatRoomFontSize = ChatRoomFontSizes[Player.ChatSettings.FontSize || "Medium"];
}

/**
 * Validates that the words said in the local chat are not breaking any forbidden words rule
 * @param {string} Message - The message typed by the player
 * @returns {boolean} - Returns FALSE if we must block the message from being sent
 */
function ChatRoomOwnerForbiddenWordCheck(Message) {

	// Exits right away if not owned
	if (CurrentScreen != "ChatRoom") return true;
	if (!Player.IsOwned()) return true;
	if (LogQuery("BlockTalkForbiddenWords", "OwnerRule")) return false;

	// Gets the forbidden words list from the log
	let ForbiddenList = [];
	for (let L of Log)
		if ((L.Group == "OwnerRule") && L.Name.startsWith("ForbiddenWords"))
			ForbiddenList = L.Name.substring("ForbiddenWords".length, 10000).split("|");
	if (ForbiddenList.length <= 1) return true;

	// Gets the consequence for saying the forbidden word
	let Consequence = ForbiddenList[0].trim();
	if (ForbiddenWordsConsequenceList.indexOf(Consequence) < 0) Consequence = "";
	ForbiddenList.splice(0, 1);
	if (Consequence == "") return true;

	// Prepares an array of all words said
	let M = Message.trim().toUpperCase();
	M = M.replace(/-/g, "");
	M = M.replace(/ /g, "|");
	M = M.replace(/,/g, "|");
	M = M.replace(/\./g, "|");
	let WordList = M.split("|");
	if (WordList.length <= 0) return true;

	// For each word said, we check if that word is forbidden
	let FoundWord = "";
	for (let W of WordList)
		if ((W != "") && (ForbiddenList.indexOf(W) >= 0)) {
			FoundWord = W;
			break;
		}
	if (FoundWord == "") return true;

	// If we must block the message
	if (Consequence == "Block") {
		ChatRoomMessage({Type: "ServerMessage", Content: "ForbiddenWordsBlocked", Sender: Player.MemberNumber});
		return false;
	}

	// If we must mute the player after she said the words
	if (Consequence.startsWith("Mute")) {
		let Minutes = parseInt(Consequence.substring(4, 100));
		if (isNaN(Minutes)) Minutes = 5;
		if ((Minutes != 5) && (Minutes != 15) && (Minutes != 30)) Minutes = 5;
		ChatRoomMessage({Type: "ServerMessage", Content: "ForbiddenWordsMute" + Minutes.toString(), Sender: Player.MemberNumber});
		LogAdd("BlockTalkForbiddenWords", "OwnerRule",  CurrentTime + Minutes * 60 * 1000);
		return true;
	}

	// If no valid consquence, we continue
	return true;

}

/**
 * Returns TRUE if the owner presence rule is enforced for the current player
 * @param {LogNameType["OwnerRule"]} RuleName - The name of the rule to validate (BlockWhisper, BlockTalk, etc.)
 * @param {Character} Target - The target character
 * @returns {boolean} - TRUE if the rule is enforced
 */
function ChatRoomOwnerPresenceRule(RuleName, Target) {

	if (!LogQuery(RuleName, "OwnerRule")) return false; // FALSE if the rule isn't set
	if (!Player.IsFullyOwned()) return false; // FALSE if the player isn't fully collared
	if (!ChatRoomOwnerInside()) return false; // FALSE if the owner isn't inside

	// Some rules are only on with specific targets
	let Rule = true;
	if (RuleName == "BlockAccessSelf") Rule = ((Target != null) && (Player.MemberNumber === Target.MemberNumber)); // Block access self only if target is herself
	if (RuleName == "BlockAccessOther") Rule = ((Target != null) && (Player.MemberNumber !== Target.MemberNumber)); // Block access other only if target is another member
	if (RuleName == "BlockWhisper") Rule = ((Target != null) && !Player.IsOwnedByCharacter(Target)); // Block whisper doesn't block whispering to the owner
	if (RuleName === "BlockChangePose") return true; // We don't do the notification there, otherwise we'll spam chat

	// Shows a warning message in the chat log if the rule is enforced
	if (Rule) {
		const div = document.createElement("div");
		div.setAttribute('class', 'ChatMessage ChatMessageServerMessage');
		div.setAttribute('data-time', ChatRoomCurrentTime());
		div.setAttribute('data-sender', Player.MemberNumber.toString());
		div.innerHTML = "<b><i>" + TextGet("OwnerPresence" + RuleName) + "</i></b>";
		ChatRoomAppendChat(div);
	}

	// If all validations passed, we enforce the rule
	return Rule;

}

/**
 * Replaces pronoun-related tags with the relevant text for the character
 * @param {Character} C - The character that the message key relates to
 * @param {string} key - Key for the dialog entry to use
 * @param {boolean} hideIdentity - Whether to hide details revealing the character's identity
 * @returns {CommonSubtituteSubstitution[]} - The replacement pronoun text for keywords in the original message
 */
function ChatRoomPronounSubstitutions(C, key, hideIdentity) {
	/** @type {(match: string, offset: number, repl: string, string: string) => string} */
	function replacer(match, offset, repl, string) {
		// We matched at the start of the string, easy
		if (offset === 0 || offset === 1 && string[0] === "(") return CommonStringTitlecase(repl);

		// Harder, walk backward from the match, checking for a sentence separator
		let pos;
		for (pos = offset - 1; pos >= 0; pos--) {
			if (string[pos] !== " ") break;
		}
		// We hit the beginning of the string, or we found a sentence separator
		if (string[pos] === undefined || string[pos].match(/[.?()!…]/)) {
			repl = CommonStringTitlecase(repl);
		}
		return repl;
	}

	/** @type {CommonSubtituteSubstitution[]} */
	let repls = [];
	for (const pronounType of ["Possessive", "Self", "Subject", "Object"]) {
		repls.push([key + pronounType, CharacterPronoun(C, pronounType, hideIdentity), replacer]);
	}
	return repls;
}

/**
 * Gets only the settings/configurable properties of a chat room.
 * @param {ChatRoom} room
 * @return {ChatRoomSettings}
 */
function ChatRoomGetSettings(room) {
	/** @type {(keyof ChatRoomSettings)[]} */
	const keys = ["Name", "Description", "Admin", "Whitelist", "Ban", "Background", "Limit", "Game", "Visibility", "Access", "BlockCategory", "Language", "Space", "MapData", "Custom"];
	return /** @type {ChatRoomSettings} */(Object.fromEntries(keys.map(k => [k, room[k]])));
}

/**
 * Gets a character by MemberNumber or name or nickname
 * @param {string|number} spec
 * @return {Character|null}
 */
function ChatRoomGetCharacter(spec) {
	/** @type {number} */
	const numSpec = CommonIsInteger(spec) ? spec : CommonParseInt(spec);
	if (numSpec !== null) {
		return ChatRoomCharacter.find((character) => character.MemberNumber === numSpec);
	}
	if (typeof spec !== "string") return null;

	const nameMatches = ChatRoomCharacter.filter(c => c.Name.toLocaleLowerCase() === spec.toLocaleLowerCase() || c.Nickname?.toLocaleLowerCase() === spec.toLocaleLowerCase());
	if (nameMatches.length > 1) return null;
	return nameMatches[0] ?? null;
}

/**
 * Returns the currently running game in the room
 */
function ChatRoomGetGame() {
	return ChatRoomData?.Game ?? null;
}

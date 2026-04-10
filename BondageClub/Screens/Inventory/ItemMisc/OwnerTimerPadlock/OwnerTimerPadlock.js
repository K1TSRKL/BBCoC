// @ts-strict-ignore
"use strict";

const OwnerTimerChooseList = [1, 2, 4, 8, 16, 24, 48, 72, 96, 120, 144, 168, -144, -72, -48, -24, -8, -4];
let OwnerTimerChooseIndex = 0;

/**
 * @param {Character} C
 * @returns {boolean} - Whether the passed character is elligble for full control over the lock
 */
function InventoryItemMiscOwnerTimerPadlockValidator(C) {
	return C.IsOwnedByPlayer();
}

/**
 * @param {NoArchItemData} data
 * @param {null | (() => void)} originalFunction
 * @param {(C: Character) => boolean} validator
 * @satisfies {ExtendedItemScriptHookCallbacks.Draw<NoArchItemData>}
 */
function InventoryItemMiscOwnerTimerPadlockDrawHook({ asset }, originalFunction, validator=InventoryItemMiscOwnerTimerPadlockValidator) {
	const property = DialogFocusSourceItem.Property;

	if (!DialogFocusItem || property.RemoveTimer < CurrentTime) {
		DialogLeaveFocusItem();
		return;
	}

	originalFunction();
	const C = CharacterGetCurrent();

	if (property.ShowTimer) {
		DrawText(InterfaceTextGet("TimerLeft") + " " + TimerToString(property.RemoveTimer - CurrentTime), 1500, 500, "white", "gray");
	} else {
		DrawText(InterfaceTextGet("TimerUnknown"), 1500, 500, "white", "gray");
	}
	DrawText(AssetTextGet(asset.Group.Name + asset.Name + "Intro"), 1500, 600, "white", "gray");

	// Draw the settings
	if (Player.CanInteract() && validator(C)) {
		MainCanvas.textAlign = "left";
		DrawButton(1100, 666, 64, 64, "", "White", property.RemoveItem ? "Icons/Checked.png" : "");
		DrawText(InterfaceTextGet("RemoveItemWithTimer"), 1200, 698, "white", "gray");
		DrawButton(1100, 746, 64, 64, "", "White", property.ShowTimer ? "Icons/Checked.png" : "");
		DrawText(InterfaceTextGet("ShowItemWithTimerRemaining"), 1200, 778, "white", "gray");
		DrawButton(1100, 826, 64, 64, "", "White", property.EnableRandomInput ? "Icons/Checked.png" : "");
		DrawText(InterfaceTextGet("EnableRandomInput"), 1200, 858, "white", "gray");
		MainCanvas.textAlign = "center";
	} else {
		if (property.LockMemberNumber != null) {
			DrawText(InterfaceTextGet("LockMemberNumber") + " " + property.LockMemberNumber.toString(), 1500, 700, "white", "gray");
		}

		let msg = AssetTextGet(asset.Group.Name + asset.Name + "Detail");
		const subst = ChatRoomPronounSubstitutions(CurrentCharacter, "TargetPronoun", false);
		msg = CommonStringSubstitute(msg, subst);
		DrawText(msg, 1500, 800, "white", "gray");

		DrawText(InterfaceTextGet(property.RemoveItem ? "WillRemoveItemWithTimer" : "WontRemoveItemWithTimer"), 1500, 868, "white", "gray");
	}

	// Draw buttons to add/remove time if available
	if (Player.CanInteract() && validator(C)) {
		DrawButton(1100, 910, 250, 70, InterfaceTextGet("AddTimerTime"), "White");
		DrawBackNextButton(1400, 910, 250, 70, OwnerTimerChooseList[OwnerTimerChooseIndex] + " " + InterfaceTextGet("Hours"), "White", "",
			() => OwnerTimerChooseList[(OwnerTimerChooseList.length + OwnerTimerChooseIndex - 1) % OwnerTimerChooseList.length] + " " + InterfaceTextGet("Hours"),
			() => OwnerTimerChooseList[(OwnerTimerChooseIndex + 1) % OwnerTimerChooseList.length] + " " + InterfaceTextGet("Hours")
		);
	} else if (Player.CanInteract() && property.EnableRandomInput && !property.MemberNumberList.includes(Player.MemberNumber)) {
		DrawButton(1100, 910, 250, 70, "- 2 " + InterfaceTextGet("Hours"), "White");
		DrawButton(1400, 910, 250, 70, InterfaceTextGet("Random"), "White");
		DrawButton(1700, 910, 250, 70, "+ 2 " + InterfaceTextGet("Hours"), "White");
	}
}

/**
 * @param {NoArchItemData} data
 * @param {null | (() => void)} originalFunction
 * @param {(C: Character) => boolean} validator
 * @satisfies {ExtendedItemScriptHookCallbacks.Draw<NoArchItemData>}
 */
function InventoryItemMiscOwnerTimerPadlockClickHook(data, originalFunction, validator=InventoryItemMiscOwnerTimerPadlockValidator) {
	originalFunction();
	if (DialogFocusSourceItem == null) {
		// TODO: Let the click handlers return a boolean flag indicating whether a button has been clicked or not.
		// As a stop-gap measure simply check whether `DialogFocusSourceItem` has been de-initialized
		return;
	}

	if (!Player.CanInteract()) {
		return;
	}

	const C = CharacterGetCurrent();
	const property = DialogFocusSourceItem.Property;

	if (validator(C)) { // Owner gets full control over lock
		if (MouseIn(1100, 666, 64, 64)) { // Remove when timer runs out checkbox
			property.RemoveItem = !property.RemoveItem;
			ChatRoomCharacterItemUpdate(C);
		} else if (MouseIn(1100, 746, 64, 64)) { // Show/hide timer checkbox
			property.ShowTimer = !property.ShowTimer;
			ChatRoomCharacterItemUpdate(C);
		} else if (MouseIn(1100, 826, 64, 64)) { // Enable random input checkbox
			property.EnableRandomInput = !property.EnableRandomInput;
			ChatRoomCharacterItemUpdate(C);
		} else if (MouseIn(1100, 910, 250, 70)) { // Add time button
			InventoryItemMiscOwnerTimerPadlockAdd(OwnerTimerChooseList[OwnerTimerChooseIndex] * 3600);
		} else if (MouseIn(1400, 910, 125, 70)) { // Previous time option
			OwnerTimerChooseIndex = (OwnerTimerChooseList.length + OwnerTimerChooseIndex - 1) % OwnerTimerChooseList.length;
		} else if (MouseIn(1525, 910, 125, 70)) { // Next time option
			OwnerTimerChooseIndex = (OwnerTimerChooseIndex + 1) % OwnerTimerChooseList.length;
		}
	} else if (property.EnableRandomInput && !property.MemberNumberList.includes(Player.MemberNumber)) {
		// Everyone else can add/remove time if permitted, and they've not already done so
		if (MouseIn(1100, 910, 250, 70)) { // -2 hours
			InventoryItemMiscOwnerTimerPadlockAdd(-2 * 3600, true);
		} else if (MouseIn(1400, 910, 250, 70)) { // Random - +/-4 hours
			InventoryItemMiscOwnerTimerPadlockAdd(4 * 3600 * ((Math.random() >= 0.5) ? 1 : -1), true);
		} else if (MouseIn(1700, 910, 250, 70)) { // +2 hours
			InventoryItemMiscOwnerTimerPadlockAdd(2 * 3600, true);
		}
	}
}

// When a value is added to the timer, can be a negative one
/**
 * @param {number} TimeToAdd
 * @param {boolean} PlayerMemberNumberToList
 */
function InventoryItemMiscOwnerTimerPadlockAdd(TimeToAdd, PlayerMemberNumberToList=false) {
	const C = CharacterGetCurrent();
	const property = DialogFocusSourceItem.Property;
	const TimerBefore = property.RemoveTimer;

	if (PlayerMemberNumberToList) {
		property.MemberNumberList.push(Player.MemberNumber);
	}
	if (DialogFocusItem.Asset.RemoveTimer > 0) {
		property.RemoveTimer = Math.round(Math.min(property.RemoveTimer + (TimeToAdd * 1000), CurrentTime + (DialogFocusItem.Asset.MaxTimer * 1000)));
	}
	if (CurrentScreen === "ChatRoom") {
		const timeAdded = (property.RemoveTimer - TimerBefore) / (1000 * 3600);
		let msg = "TimerAddRemoveUnknownTime";
		if (property.ShowTimer) {
			msg = timeAdded < 0 ? "TimerRemoveTime" : "TimerAddTime";
		}

		const dictionary = new DictionaryBuilder()
			.sourceCharacter(Player)
			.destinationCharacter(C)
			.focusGroup(C.FocusGroup.Name)
			.if(property.ShowTimer)
			.text("TimerTime", Math.round(Math.abs(timeAdded)).toString())
			.textLookup("TimerUnit", "Hours")
			.endif()
			.build();

		ChatRoomPublishCustomAction(msg, true, dictionary);
	} else {
		DialogLeaveFocusItem();
	}
}

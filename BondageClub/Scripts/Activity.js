// @ts-strict-ignore
"use strict";
/** @type {null | string[][]} */
var ActivityDictionary = null;
var ActivityOrgasmGameButtonX = 0;
var ActivityOrgasmGameButtonY = 0;
var ActivityOrgasmGameProgress = 0;
var ActivityOrgasmGameDifficulty = 0;
var ActivityOrgasmGameResistCount = 0;
var ActivityOrgasmGameTimer = 0;
var ActivityOrgasmResistLabel = "";
var ActivityOrgasmRuined = false; // If set to true, the orgasm will be ruined right before it happens

/** @type { ()=>void | undefined } */
let ActivityTranslateResolve = undefined;

let ActivityDebug = false;

/**
 * Debug logging function for activities
 */
function ActivityLog(...args) {
	if (ActivityDebug) {
		console.log(...args);
	}
}

/**
 * Checks if the current room allows for activities. (They can only be done in certain rooms)
 * @returns {boolean} - Whether or not activities can be done
 */
function ActivityAllowed() {
	return (ServerPlayerIsInChatRoom() && !(ChatRoomData && ChatRoomData.BlockCategory && ChatRoomData.BlockCategory.includes("Arousal")))
		|| (((CurrentScreen == "Private") || (CurrentScreen == "PrivateBed")) && LogQuery("RentRoom", "PrivateRoom")); }

/**
 * Loads the activity dictionary that will be used throughout the game to output messages. Loads from cache first if possible.
 * @return {void} - Nothing
 */
function ActivityDictionaryLoad() {

	// Tries to read it from cache first
	var FullPath = "Screens/Character/Preference/ActivityDictionary.csv";
	var TranslationPath = FullPath.replace(".csv", "_" + TranslationLanguage + ".txt");

	if (CommonCSVCache[FullPath]) {
		ActivityDictionary = CommonCloneDeep(CommonCSVCache[FullPath]);
	} else {
		// Opens the file, parse it and returns the result in an object
		CommonGet(FullPath, function () {
			if (this.status == 200) {
				CommonCSVCache[FullPath] = CommonParseCSV(this.responseText);
				ActivityDictionary = CommonCloneDeep(CommonCSVCache[FullPath]);
				ActivityTranslateResolve?.();
			}
		});
	}

	// If a translation file is available, we open the txt file and keep it in cache
	if (TranslationAvailable(TranslationPath))
		CommonGet(TranslationPath, function () {
			if (this.status == 200) {
				TranslationCache[TranslationPath] = TranslationParseTXT(this.responseText);
				ActivityTranslate(TranslationPath);
			}
		});
}

/**
 * Translates the activity dictionary.
 * @param {string} CachePath - Path to the language cache.
 */
function ActivityTranslate(CachePath) {
	if (!Array.isArray(TranslationCache[CachePath])) return;
	const DoTranslate = () => {
		for (let T = 0; T < ActivityDictionary.length; T++) {
			if (ActivityDictionary[T][1]) {
				let indexText = TranslationCache[CachePath].indexOf(ActivityDictionary[T][1].trim());
				if (indexText >= 0) {
					ActivityDictionary[T][1] = TranslationCache[CachePath][indexText + 1];
				}
			}
		}
	};
	if(ActivityDictionary) DoTranslate();
	else ActivityTranslateResolve = DoTranslate;
}

/**
 * Searches in the dictionary for a specific keyword's text
 * @param {string} KeyWord - Tag of the activity description to search for
 * @returns {string} - Description associated to the given keyword
 */
function ActivityDictionaryText(KeyWord) {
	for (let D = 0; D < ActivityDictionary.length; D++)
		if (ActivityDictionary[D][0] == KeyWord)
			return ActivityDictionary[D][1].trim();
	return "MISSING ACTIVITY DESCRIPTION FOR KEYWORD " + KeyWord;
}

/**
 * Resolve a group name to the correct group for activities
 * @param {IAssetFamily} family - The asset family for the named group
 * @param {AssetGroupItemName} groupname - The name of the group to resolve
 * @returns {AssetItemGroup | null} - The resolved group
 */
function ActivityGetGroupOrMirror(family, groupname) {
	const group = AssetGroupGet(family, groupname);
	if (group && group.MirrorActivitiesFrom != null) {
		const mirror = AssetGroupGet(family, group.MirrorActivitiesFrom);
		if (mirror) {
			return mirror;
		}
	}
	return group;
}

/**
 * Gets all groups that mirror or are mirrored by the given group name for activities. The returned array includes the
 * named group.
 * @param {IAssetFamily} family - The asset family for the named group
 * @param {AssetGroupName} groupName - The name of the group to resolve
 * @returns {AssetGroup[]} - The group and all groups from the same family that mirror or are mirrored by it
 */
function ActivityGetAllMirrorGroups(family, groupName) {
	return AssetActivityMirrorGroups.get(groupName) || [];
}

/**
 * Check if any activities are possible for a character's given group.
 * @param {Character} C - The character on which the check is done
 * @param {AssetGroupItemName} GroupName - The group to check access on
 * @returns {boolean} Whether any activity is possible
 */
function ActivityPossibleOnGroup(C, GroupName) {
	const CharacterNotEnclosedOrSelfActivity = ((!C.IsEnclose() && !Player.IsEnclose()) || C.IsPlayer());
	if (!CharacterNotEnclosedOrSelfActivity || !ActivityAllowed() || !CharacterHasArousalEnabled(C))
		return false;
	const Group = ActivityGetGroupOrMirror(C.AssetFamily, GroupName);
	const Zone = PreferenceGetArousalZone(C, Group.Name);
	return Zone && Zone.Factor > 0;
}

/**
 * Check whether a given activity can be performed on a group
 * @param {Character} char - The character being targeted
 * @param {Activity} act - The activity to consider
 * @param {AssetGroup} group - The group to check
 * @returns {boolean} whether that activity's target is valid
 */
function ActivityHasValidTarget(char, act, group) {
	let activities = AssetActivitiesForGroup(char.AssetFamily, group.Name, (char.IsPlayer() ? "self" : "other"));
	return activities.some(a => a.Name === act.Name);
}

/**
 * Check that an activity is permitted by an actor's settings.
 * @param {Activity} A - The activity to consider
 * @param {Character|PlayerCharacter} C - The character to check with
 * @param {boolean} Other - Whether we look at doing to or being done on
 * @returns {boolean} whether the activity is permitted
 */
function ActivityCheckPermissions(A, C, Other) {
	if ((C.ArousalSettings == null) || (C.ArousalSettings.Activity == null)) return true;
	return (PreferenceGetActivityFactor(C, A.Name, !Other) != 0);
}

/**
 * Check that that a given prerequisite is met.
 * @param {ActivityPrerequisite} prereq - The prerequisite to consider
 * @param {Character|PlayerCharacter} acting - The character performing the activity
 * @param {Character|PlayerCharacter} acted - The character being acted on
 * @param {AssetGroup} group - The group being acted on
 * @returns {boolean} whether the given activity's prerequisite are satisfied
 */
function ActivityCheckPrerequisite(prereq, acting, acted, group) {
	switch (prereq) {
		case "UseMouth":
			return !acting.IsMouthBlocked() && acting.CanTalk();
		case "UseTongue":
			return !acting.IsMouthBlocked();
		case "TargetMouthBlocked":
			return acted.IsMouthBlocked();
		case "IsGagged":
			return acting.IsGagged();
		case "TargetKneeling":
			return acted.IsKneeling();
		case "UseHands":
			return acting.CanInteract() && !acting.Effect.includes("MergedFingers");
		case "UseArms":
			return acting.CanInteract() || (!InventoryGet(acting, "ItemArms") && !InventoryGroupIsBlocked(acting, "ItemArms"));
		case "UseFeet":
			return acting.CanWalk();
		case "CantUseArms":
			return !acting.CanInteract() && (!!InventoryGet(acting, "ItemArms") || InventoryGroupIsBlocked(acting, "ItemArms"));
		case "CantUseFeet":
			return !acting.CanWalk();
		case "TargetCanUseTongue":
			return !acted.IsMouthBlocked();
		case "TargetMouthOpen":
			if (group.Name === "ItemMouth")
				return !InventoryGet(acted, "ItemMouth") || acted.IsMouthOpen();
			break;
		case "VulvaEmpty":
			if (group.Name === "ItemVulva")
				return acted.HasVagina() && !acted.IsVulvaFull();
			break;
		case "AssEmpty":
			if (group.Name === "ItemButt")
				return !acted.IsPlugged();
			break;
		case "MoveHead":
			if (group.Name === "ItemHead")
				return !acted.IsFixedHead();
			break;
		case "ZoneAccessible":
		case "TargetZoneAccessible": {
			// FIXME: The original ZoneAccessible should have been prefixed with Target, which is why those are reversed
			// TargetZoneAccessible is only used for ReverseSuckItem, which is marked as reverse, adding in to the confusion
			const actor = prereq.startsWith("Target") ? acting : acted;
			return ActivityGetAllMirrorGroups(actor.AssetFamily, group.Name).some((g) => g.IsItem() ? !InventoryGroupIsBlocked(actor, g.Name, true) : true);
		}
		case "ZoneNaked":
		case "TargetZoneNaked": {
			// FIXME: Ditto
			const actor = prereq.startsWith("Target") ? acting : acted;
			if (group.Name === "ItemButt")
				return InventoryPrerequisiteMessage(actor, "AccessButt") === "" && !(actor.IsPlugged() || actor.IsButtChaste());
			else if (group.Name === "ItemVulva")
				return InventoryPrerequisiteMessage(actor, "AccessCrotch") === "" && InventoryPrerequisiteMessage(actor, "AccessVulva") === "" && !actor.IsVulvaChaste();
			else if (group.Name === "ItemVulvaPiercings")
				return InventoryPrerequisiteMessage(actor, "AccessCrotch") === "" && InventoryPrerequisiteMessage(actor, "AccessVulva") === "" && !actor.IsVulvaChaste();
			else if (group.Name === "ItemBreast" || group.Name === "ItemNipples")
				return InventoryPrerequisiteMessage(actor, "AccessBreast") === "" && !actor.IsBreastChaste();
			else if (group.Name === "ItemBoots")
				return InventoryPrerequisiteMessage(actor, "NakedFeet") === "";
			else if (group.Name === "ItemHands")
				return InventoryPrerequisiteMessage(actor, "NakedHands") === "";
			break;
		}
		case "CanUsePenis":
			if (!acting.HasPenis()) return true;
			return !acting.IsVulvaChaste() && InventoryPrerequisiteMessage(acting, "AccessVulva") === "";
		case "Sisters":
			return !acting.HasPenis() && !acted.HasPenis() && acting.IsSiblingOfCharacter(acted);
		case "Brothers":
			return acting.HasPenis() && acted.HasPenis() && acting.IsSiblingOfCharacter(acted);
		case "SiblingsWithDifferentGender":
			return (acting.HasPenis() != acted.HasPenis()) && acting.IsSiblingOfCharacter(acted);
		case "Collared":
			return acted.WearingCollar();
		default:
			break;
	}
	return true;
}

/**
 * Check that an activity's prerequisites are met.
 * @param {Activity} activity - The activity to consider
 * @param {Character|PlayerCharacter} acting - The character performing the activity
 * @param {Character|PlayerCharacter} acted - The character being acted on
 * @param {AssetGroup} group - The group being acted on
 * @returns {boolean} whether the given activity's prerequisite are satisfied
 */
function ActivityCheckPrerequisites(activity, acting, acted, group) {
	if (!activity.Prerequisite)
		return true;

	return activity.Prerequisite.every((pre) => {
		const res = ActivityCheckPrerequisite(pre, acting, acted, group);
		if (!res) {
			ActivityLog(`${acting.Name} on ${acted.Name}, act: ${activity.Name}, g: ${group.Name}: Prereq ${pre} failed`);
		}
		return res;
	});
}

/**
 *
 * @param {Character} acting
 * @param {Character} acted
 * @param {ActivityNameItem} needsItem
 * @param {Activity} activity
 * @param {AssetGroup} targetGroup
 */
function ActivityGenerateItemActivitiesFromNeed(acting, acted, needsItem, activity, targetGroup, useTargetItems = false) {
	let items = CharacterItemsForActivity(useTargetItems ? acted : acting, needsItem);
	if ((useTargetItems ? acted : acting).HasEffect("Chaste")) {
		items = items.filter(item => item.Asset.Name !== "Penis");
	}

	return items.reduce((activities, item) => {
		const typeList = CommonIsObject(item.Property?.TypeRecord) ? PropertyTypeRecordToStrings(item.Property.TypeRecord) : [null];

		/** @type {ItemActivityRestriction} */
		let blocked = null;
		if (typeList.some((type) => InventoryIsAllowedLimited(acted, item, type))) {
			blocked = "limited";
		} else if (typeList.some((type) => InventoryBlockedOrLimited(acted, item, type))) {
			blocked = "blocked";
		} else if (InventoryGroupIsBlocked(acting, /** @type {AssetGroupItemName} */(item.Asset.Group.Name))) {
			blocked = "unavail";
		}

		// FIXME: workaround for reverse activities because those are in a non-activity group

		if (InventoryItemHasEffect(item, "UseRemote")) {
			// That item actually needs a remote, so handle it separately
		} else {
			ActivityLog(`${acting.Name} on ${acted.Name}: act: ${activity.Name} needs item ${needsItem} satisfied by ${item.Asset.Name}`);
			activities.push({ Activity: activity, Item: item, Blocked: blocked, Group: targetGroup.MirrorActivitiesFrom ?? targetGroup.Name });
			return activities;
		}
		return activities;
	}, []);
}

/**
 * Builds the allowed activities on a group given the character's settings.
 * @param {Character} character - The character for which to build the activity dialog options
 * @param {AssetGroupItemName} groupname - The group to check
 * @return {ItemActivity[]} - The list of allowed activities
 */
function ActivityAllowedForGroup(character, groupname) {
	ActivityLog(`${Player.Name} on ${character.Name}: looking up allowed activities for group: ${groupname}`);

	// If we are not within interaction range, don't allow any activities
	if(InventoryIsBlockedByDistance(character)) return [];

	// Get the group and all possible activities
	let activities = AssetAllActivities(character.AssetFamily);
	let group = ActivityGetGroupOrMirror(character.AssetFamily, groupname);
	if (!activities || !group) return [];

	// Make sure the target player zone is allowed for an activity
	if (!ActivityPossibleOnGroup(character, groupname)) {
		ActivityLog(`${Player.Name} on ${character.Name}, group: ${groupname}: not possible`);
		return [];
	}

	const targetedItem = InventoryGet(character, groupname);

	/** @type {ItemActivity[]} */
	let allowed = activities.reduce((allowedActivities, activity) => {
		// Validate that this activity can be done
		if (!ActivityHasValidTarget(character, activity, group)) {
			ActivityLog(`${Player.Name} on ${character.Name}, act: ${activity.Name}: Invalid target ${group.Name}`);
			return allowedActivities;
		}

		// Make sure all the prerequisites are met, unless chaste and the item is StrapOn because otherwise you can't penetrate with strap on
		if (!ActivityCheckPrerequisites(activity, Player, character, group)) {
			ActivityLog(`${Player.Name} on ${character.Name}, act: ${activity.Name}: Prereq fail`);
			return allowedActivities;
		}

		// Ensure this activity is permitted for both actors
		if (!ActivityCheckPermissions(activity, Player, true)
			|| !ActivityCheckPermissions(activity, character, false)) {
			ActivityLog(`${Player.Name} on ${character.Name}, act: ${activity.Name}: Perms`);
			return allowedActivities;
		}

		// All checks complete, this activity is allowed

		let targetNeedsItem = activity.Prerequisite.find(p => p.startsWith("TargetNeeds-"));
		let needsItem = activity.Prerequisite.find(p => p.startsWith("Needs-"));

		if (needsItem) {
			const needsItemActivity = /** @type {ActivityNameItem} */(needsItem.substring(6));
			ActivityLog(`${Player.Name} on ${character.Name}: needs item ${needsItem}`);
			return [...allowedActivities, ...ActivityGenerateItemActivitiesFromNeed(Player, character, needsItemActivity, activity, group)];
		}
		if (targetNeedsItem) {
			const targetNeedsItemActivity = /** @type {ActivityNameItem} */(targetNeedsItem.substring(12));
			return [...allowedActivities, ...ActivityGenerateItemActivitiesFromNeed(Player, character, targetNeedsItemActivity, activity, group, true)];
		}

		if (activity.Name === "ShockItem" && InventoryItemHasEffect(targetedItem, "ReceiveShock")) {
			let remote = Player.Appearance.find(a => InventoryItemHasEffect(a, "TriggerShock"));
			if (remote) {
				ActivityLog(`${Player.Name} on ${character.Name}, act: ${activity.Name}: can trigger shock, adding in`);
				return allowedActivities.concat({ Activity: activity, Item: remote, Group: group.Name });
			}
		}

		ActivityLog(`${Player.Name} on ${character.Name}, act: ${activity.Name}: not handled by item stuff, adding in`);
		return allowedActivities.concat({ Activity: activity, Group: group.Name });
	}, []);

	ActivityLog(`${Player.Name} on ${character.Name}: allowed activities for group ${groupname} lookup complete`, allowed);

	// Sort allowed activities by their group declaration order
	return allowed.sort((a, b) => Math.sign(ActivityFemale3DCGOrdering.indexOf(a.Activity.Name) - ActivityFemale3DCGOrdering.indexOf(b.Activity.Name)));
}

/**
 * Returns TRUE if an activity can be done
 * @param {Character} C - The character to evaluate
 * @param {ActivityName} Activity - The name of the activity
 * @param {AssetGroupItemName} Group - The name of the group
 * @return {boolean} - TRUE if the activity can be done
 */
function ActivityCanBeDone(C, Activity, Group) {
	let ActList = ActivityAllowedForGroup(C, Group);
	for (let A = 0; A < ActList.length; A++)
		if (ActList[A].Activity.Name == Activity)
			return true;
	return false;
}

/**
 * Calculates the effect of an activity performed on a zone
 * @param {Character} S - The character performing the activity
 * @param {Character} C - The character on which the activity is performed
 * @param {ActivityName | Activity} A - The activity performed
 * @param {AssetGroupItemName} Z - The group/zone name where the activity was performed
 * @param {number} [Count=1] - If the activity is done repeatedly, this defines the number of times, the activity is done.
 * If you don't want an activity to modify arousal, set this parameter to '0'
 * @param {Asset} [Asset] - The asset used to perform the activity
 * @return {void} - Nothing
 */
function ActivityEffect(S, C, A, Z, Count, Asset) {

	// Converts from activity name to the activity object
	if (typeof A === "string") A = AssetGetActivity(C.AssetFamily, A);
	if ((A == null) || (typeof A === "string")) return;
	if ((Count == null) || (Count == undefined) || (Count == 0)) Count = 1;

	// Calculates the next progress factor
	var Factor = (PreferenceGetActivityFactor(C, A.Name, (C.IsPlayer())) * 5) - 10; // Check how much the character likes the activity, from -10 to +10
	Factor = Factor + (PreferenceGetZoneFactor(C, Z) * 5) - 10; // The zone used also adds from -10 to +10
	Factor = Factor + Math.floor((Math.random() * 8)); // Random 0 to 7 bonus
	if ((C.ID != S.ID) && (((!C.IsPlayer()) && C.IsLoverOfPlayer()) || ((C.IsPlayer()) && S.IsLoverOfPlayer()))) Factor = Factor + Math.floor((Math.random() * 8)); // Another random 0 to 7 bonus if the target is the player's lover
	Factor = Factor + ActivityFetishFactor(C) * 2; // Adds a fetish factor based on the character preferences
	Factor = Factor + Math.round(Factor * (Count - 1) / 3); // if the action is done repeatedly, we apply a multiplication factor based on the count

	// Grab the relevant expression from either the asset or the activity
	const expression = Asset && Asset.ActivityExpression && Asset.ActivityExpression[A.Name] ? Asset.ActivityExpression[A.Name] : A.ActivityExpression;
	if (Array.isArray(expression))
		InventoryExpressionTriggerApply(C, expression);

	ActivitySetArousalTimer(C, A, Z, Factor);

}

/**
 * Used for arousal events that are not activities, such as stimulation events
 * @param {Character} S - The character performing the activity
 * @param {Character} C - The character on which the activity is performed
 * @param {number} Amount - The base amount of arousal to add
 * @param {AssetGroupItemName} Z - The group/zone name where the activity was performed
 * @param {number} [Count=1] - If the activity is done repeatedly, this defines the number of times, the activity is done.
 * If you don't want an activity to modify arousal, set this parameter to '0'
 * @param {Asset} [Asset] - The asset used to perform the activity
 * @return {void} - Nothing
 */
function ActivityEffectFlat(S, C, Amount, Z, Count, Asset) {

	// Converts from activity name to the activity object
	if ((Amount == null) || (typeof Amount != "number")) return;
	if ((Count == null) || (Count == undefined) || (Count == 0)) Count = 1;

	// Calculates the next progress factor
	var Factor = Amount; // Check how much the character likes the activity, from -10 to +10
	Factor = Factor + (PreferenceGetZoneFactor(C, Z) * 5) - 10; // The zone used also adds from -10 to +10
	Factor = Factor + ActivityFetishFactor(C) * 2; // Adds a fetish factor based on the character preferences
	Factor = Factor + Math.round(Factor * (Count - 1) / 3); // if the action is done repeatedly, we apply a multiplication factor based on the count

	ActivitySetArousalTimer(C, null, Z, Factor, Asset);
}

/**
 * Syncs the player arousal with everyone in chatroom
 * @param {Character} C - The character for which to sync the arousal data
 * @return {void} - Nothing
 */
function ActivityChatRoomArousalSync(C) {
	if (C.IsPlayer() && ServerPlayerIsInChatRoom())
		ServerSend("ChatRoomCharacterArousalUpdate", { OrgasmTimer: C.ArousalSettings.OrgasmTimer, Progress: C.ArousalSettings.Progress, ProgressTimer: C.ArousalSettings.ProgressTimer, OrgasmCount: C.ArousalSettings.OrgasmCount });
}

/**
 * Sets the character arousal level and validates the value
 * @param {Character} C - The character for which to set the arousal progress of
 * @param {number} Progress - Progress to set for the character (Ranges from 0 to 100)
 * @return {void} - Nothing
 */
function ActivitySetArousal(C, Progress) {
	if ((C.ArousalSettings.Progress == null) || (typeof C.ArousalSettings.Progress !== "number") || isNaN(C.ArousalSettings.Progress)) C.ArousalSettings.Progress = 0;
	if ((Progress == null) || (Progress < 0)) Progress = 0;
	if (Progress > 100) Progress = 100;
	if (Progress == 0) C.ArousalSettings.OrgasmTimer = 0;
	if (C.ArousalSettings.Progress != Progress) {
		C.ArousalSettings.Progress = Progress;
		C.ArousalSettings.ProgressTimer = 0;
		ActivityChatRoomArousalSync(C);
	}
}

/**
 * Sets an activity progress on a timer, activities are capped at MaxProgress
 * @param {Character} C - The character for which to set the timer for
 * @param {null | Activity} Activity - The activity for which the timer is for
 * @param {AssetGroupItemName | "ActivityOnOther"} Zone - The target zone of the activity
 * @param {number} Progress - Progress to set
 * @param {Asset} [Asset] - The asset used to perform the activity
 * @return {void} - Nothing
 */
function ActivitySetArousalTimer(C, Activity, Zone, Progress, Asset) {

	// If there's already a progress timer running, we add it's value but divide it by 2 to lessen the impact, the progress must be between -25 and 25
	if ((C.ArousalSettings.ProgressTimer == null) || (typeof C.ArousalSettings.ProgressTimer !== "number") || isNaN(C.ArousalSettings.ProgressTimer)) C.ArousalSettings.ProgressTimer = 0;
	Progress = Math.round((C.ArousalSettings.ProgressTimer / 2) + Progress);
	if (Progress < -25) Progress = -25;
	if (Progress > 25) Progress = 25;

	// Make sure we do not allow orgasms if the activity (MaxProgress or MaxProgressSelf) or the zone (AllowOrgasm) doesn't allow it
	let Max = ((Activity == null || Activity.MaxProgress == null) || (Activity.MaxProgress > 100)) ? 100 : Activity.MaxProgress;
	if (Max > 95 && Zone !== "ActivityOnOther" && !PreferenceGetZoneOrgasm(C, Zone)) Max = 95;
	// For activities on other, it cannot go over 2/3
	if (Max > 67 && Zone === "ActivityOnOther") {
		if (["PenetrateSlow", "PenetrateFast"].includes(Activity.Name) && Asset && Asset.Group.Name === "Pussy" && Asset.Name === "Penis") {
			// If it's a penis penetration, don't cap it. This makes the cap either 100 or 95, depending on the character orgasm setting
			Max = PreferenceGetZoneOrgasm(Player, "ItemVulva") ? 100 : 95;
		} else {
			Max = Activity.MaxProgressSelf != null ? Activity.MaxProgressSelf : 67;
		}
	}

	if (Progress > 0 && (C.ArousalSettings.Progress + Progress) > Max)
		Progress = (Max - C.ArousalSettings.Progress >= 0) ? Max - C.ArousalSettings.Progress : 0;

	// If we must apply a progress timer change, we publish it
	if (C.ArousalSettings.ProgressTimer !== Progress) {
		C.ArousalSettings.ProgressTimer = Progress;
		ActivityChatRoomArousalSync(C);
	}

}


/**
 * Draws the arousal progress bar at the given coordinates for every orgasm timer.
 * @param {number} X - Position on the X axis
 * @param {number} Y - Position on the Y axis
 * @return {void} - Nothing
 */
function ActivityOrgasmProgressBar(X, Y) {
	var Pos = 0;
	if ((ActivityOrgasmGameTimer != null) && (ActivityOrgasmGameTimer > 0) && (CurrentTime < Player.ArousalSettings.OrgasmTimer))
		Pos = ((Player.ArousalSettings.OrgasmTimer - CurrentTime) / ActivityOrgasmGameTimer) * 100;
	if (Pos < 0) Pos = 0;
	if (Pos > 100) Pos = 100;
	DrawProgressBar(X, Y, 900, 25, Pos);
}

/**
 * Ends the orgasm early if progress is close or progress is sufficient
 * @return {void} - Nothing
 */
function ActivityOrgasmControl() {
	if ((ActivityOrgasmGameTimer != null) && (ActivityOrgasmGameTimer > 0) && (CurrentTime < Player.ArousalSettings.OrgasmTimer)) {
		// Ruin the orgasm
		if (ActivityOrgasmGameProgress >= ActivityOrgasmGameDifficulty - 1 || CurrentTime > Player.ArousalSettings.OrgasmTimer - 500) {
			if (ServerPlayerIsInChatRoom()) {
				if (CurrentTime > Player.ArousalSettings.OrgasmTimer - 500) {
					if (Player.ArousalSettings.OrgasmStage == 0) {
						ChatRoomMessage({ Content: "OrgasmFailPassive" + (Math.floor(Math.random() * 3)).toString(), Type: "Action", Sender: Player.MemberNumber });
					} else {
						const Dictionary = new DictionaryBuilder()
							.sourceCharacter(Player)
							.build();
						ServerSend("ChatRoomChat", { Content: "OrgasmFailTimeout" + (Math.floor(Math.random() * 3)).toString(), Type: "Activity", Dictionary: Dictionary });
						ActivityChatRoomArousalSync(Player);
					}
				} else {
					const Dictionary = new DictionaryBuilder()
						.sourceCharacter(Player)
						.build();
					ServerSend("ChatRoomChat", { Content: ("OrgasmFailResist" + (Math.floor(Math.random() * 3))).toString(), Type: "Activity", Dictionary: Dictionary });
					ActivityChatRoomArousalSync(Player);
				}
			}
			ActivityOrgasmGameResistCount++;
			ActivityOrgasmStop(Player, 65 + Math.ceil(Math.random()*20));
		}
	}
}


/**
 * Increases the player's willpower when resisting an orgasm.
 * @param {Character} C - The character currently resisting
 * @return {void} - Nothing
 */
function ActivityOrgasmWillpowerProgress(C) {
	if ((C.IsPlayer()) && (ActivityOrgasmGameProgress > 0)) {
		SkillProgress(Player, "Willpower", ActivityOrgasmGameProgress);
		ActivityOrgasmGameProgress = 0;
	}
}

/**
 * Starts an orgasm for a given character, lasts between 5 to 15 seconds and can be displayed in a chatroom.
 * @param {Character} C - Character for which an orgasm is starting
 * @returns {void} - Nothing
 */
function ActivityOrgasmStart(C) {
	if ((C.IsPlayer()) || C.IsNpc()) {
		if (C.IsPlayer() && !ActivityOrgasmRuined) ActivityOrgasmGameResistCount = 0;
		AsylumGGTSTOrgasm(C);
		PrivateBedOrgasm(C);
		ActivityOrgasmWillpowerProgress(C);
		if (!ActivityOrgasmRuined) {
			C.ArousalSettings.OrgasmTimer = CurrentTime + (Math.random() * 10000) + 5000;
			C.ArousalSettings.OrgasmStage = 2;
			C.ArousalSettings.OrgasmCount = (C.ArousalSettings.OrgasmCount == null) ? 1 : C.ArousalSettings.OrgasmCount + 1;
			ActivityOrgasmGameTimer = C.ArousalSettings.OrgasmTimer - CurrentTime;
			if (C.IsPlayer() && ServerPlayerIsInChatRoom()) {

				const Dictionary = new DictionaryBuilder()
					.sourceCharacter(Player)
					.build();
				ServerSend("ChatRoomChat", { Content: "Orgasm" + (Math.floor(Math.random() * 10)).toString(), Type: "Activity", Dictionary: Dictionary });
				ActivityChatRoomArousalSync(C);
			}
		} else {
			ActivityOrgasmStop(Player, 65 + Math.ceil(Math.random() * 20));
			if (C.IsPlayer() && ServerPlayerIsInChatRoom()) {
				let ChatModifier = C.ArousalSettings.OrgasmStage == 1 ? "Timeout" : "Surrender";
				const Dictionary = new DictionaryBuilder()
					.sourceCharacter(Player)
					.build();
				ServerSend("ChatRoomChat", { Content: ("OrgasmFail" + ChatModifier + (Math.floor(Math.random() * 3))).toString(), Type: "Activity", Dictionary: Dictionary });
				ActivityChatRoomArousalSync(C);
			}
		}
	}
}

/**
 * Triggered when an orgasm needs to be stopped
 * @param {Character} C - Character for which to stop the orgasm
 * @param {number} Progress - Arousal level to set the character at once the orgasm ends
 * @returns {void} - Nothing
 */
function ActivityOrgasmStop(C, Progress) {
	if ((C.IsPlayer()) || C.IsNpc()) {
		ActivityOrgasmWillpowerProgress(C);
		C.ArousalSettings.OrgasmTimer = 0;
		C.ArousalSettings.OrgasmStage = 0;
		ActivitySetArousal(C, Progress);
		ActivityTimerProgress(C, 0);
		ActivityChatRoomArousalSync(C);
	}
}

/**
 * Generates an orgasm button and progresses in the orgasm mini-game. Handles the resets and success/failures
 * @param {number} Progress - Progress of the currently running mini-game
 * @returns {void} - Nothing
 */
function ActivityOrgasmGameGenerate(Progress) {

	// If we must reset the mini-game
	if (Progress == 0) {
		Player.ArousalSettings.OrgasmStage = 1;
		Player.ArousalSettings.OrgasmTimer = CurrentTime + 5000 + (SkillGetLevel(Player, "Willpower") * 1000);
		ActivityOrgasmGameTimer = Player.ArousalSettings.OrgasmTimer - CurrentTime;
		ActivityOrgasmGameDifficulty = (6 + (ActivityOrgasmGameResistCount * 2)) * (CommonIsMobile ? 1.5 : 1);
		ActivityOrgasmGameDifficulty = ActivityOrgasmGameDifficulty + InventoryCraftCount(Player, "Arousing", true) * (CommonIsMobile ? 3 : 2);
		ActivityOrgasmGameDifficulty = ActivityOrgasmGameDifficulty - InventoryCraftCount(Player, "Dull", true) * (CommonIsMobile ? 3 : 2);
	}

	// Runs the game or finish it if the threshold is reached, it can trigger a chatroom message for everyone to see
	if (Progress >= ActivityOrgasmGameDifficulty) {
		if (ServerPlayerIsInChatRoom()) {
			const Dictionary = new DictionaryBuilder()
				.sourceCharacter(Player)
				.build();
			ServerSend("ChatRoomChat", { Content: "OrgasmResist" + (Math.floor(Math.random() * 10)).toString(), Type: "Activity", Dictionary: Dictionary });
			AsylumGGTSOrgasmResist();
		}
		ActivityOrgasmGameResistCount++;
		ActivityOrgasmStop(Player, 70);
	} else {
		ActivityOrgasmResistLabel = TextGet("OrgasmResist") + " (" + (ActivityOrgasmGameDifficulty - Progress).toString() + ")";
		ActivityOrgasmGameProgress = Progress;
		ActivityOrgasmGameButtonX = 50 + Math.floor(Math.random() * 650);
		ActivityOrgasmGameButtonY = 50 + Math.floor(Math.random() * 836);
	}

}

/**
 * Triggers an orgasm for the player or an NPC which lasts from 5 to 15 seconds
 * @param {Character} C - Character for which an orgasm was triggered
 * @param {boolean} [Bypass=false] - If true, this will do a ruined orgasm rather than a real one
 * @returns {void} - Nothing
 */
function ActivityOrgasmPrepare(C, Bypass) {
	if (C.IsPlayer())
		ActivityOrgasmRuined = false;

	if (C.Effect.includes("DenialMode")) {
		C.ArousalSettings.Progress = 99;
		if (C.IsPlayer() && (Bypass || C.Effect.includes("RuinOrgasms"))) ActivityOrgasmRuined = true;
		else return;
	}

	if (C.IsEdged() || ((InventoryCraftCount(Player, "Edging")) > 0)) {
		C.ArousalSettings.Progress = 95;
		if (C.IsPlayer() && Bypass) ActivityOrgasmRuined = true;
		else return;
	}

	if (C.IsPlayer() && ActivityOrgasmRuined) {
		ActivityOrgasmGameGenerate(0); // Resets the game
	}

	if ((C.IsPlayer()) || C.IsNpc()) {

		// Starts the timer and exits from dialog if necessary
		C.ArousalSettings.OrgasmTimer = (C.IsPlayer()) ? CurrentTime + 5000 : CurrentTime + (Math.random() * 10000) + 5000;
		C.ArousalSettings.OrgasmStage = (C.IsPlayer()) ? 0 : 2;
		if (C.IsNpc()) PrivateBedOrgasm(C);
		if (C.IsPlayer()) ActivityOrgasmGameTimer = C.ArousalSettings.OrgasmTimer - CurrentTime;
		if ((CurrentCharacter != null) && ((C.IsPlayer()) || (CurrentCharacter.ID == C.ID))) DialogLeave();
		ActivityChatRoomArousalSync(C);

		// If an NPC orgasmed, it will raise her love based on the horny trait
		if (C.IsNpc())
			if ((C.Love == null) || (C.Love < 60) || (C.IsOwner()) || (C.IsOwnedByPlayer()) || C.IsLoverOfPlayer())
				NPCLoveChange(C, Math.floor((NPCTraitGet(C, "Horny") + 100) / 20) + 1);

	}
}

/**
 * Sets a character's facial expressions based on their arousal level if their settings allow it.
 * @param {Character} C - Character for which to set the facial expressions
 * @param {number} Progress - Current arousal progress
 * @returns {void} - Nothing
 */
function ActivityExpression(C, Progress) {

	// Floors the progress to the nearest 10 to pick the expression
	Progress = Math.floor(Progress / 10) * 10;

	// The blushes goes to red progressively
	/** @type {null | ExpressionNameMap["Blush"]} */
	var Blush = null;
	if ((Progress == 10) || (Progress == 30) || (Progress == 50) || (Progress == 70)) Blush = "Low";
	if ((Progress == 60) || (Progress == 80) || (Progress == 90)) Blush = "Medium";
	if (Progress == 100) Blush = "High";

	// The eyebrows position changes
	/** @type {null | ExpressionNameMap["Eyebrows"]} */
	var Eyebrows = null;
	if ((Progress == 20) || (Progress == 30)) Eyebrows = "Raised";
	if ((Progress == 50) || (Progress == 60)) Eyebrows = "Lowered";
	if ((Progress == 80) || (Progress == 90)) Eyebrows = "Soft";

	// Drool can activate at a few stages
	/** @type {null | ExpressionNameMap["Fluids"]} */
	var Fluids = null;
	if ((Progress == 40) || (C.ArousalSettings.Progress == 70)) Fluids = "DroolLow";
	if (Progress == 100) Fluids = "DroolMedium";

	// Eyes can activate at a few stages
	/** @type {null | ExpressionNameMap["Eyes"]} */
	var Eyes = null;
	if (Progress == 20) Eyes = "Dazed";
	if (Progress == 70) Eyes = "Horny";
	if (Progress == 90) Eyes = "Surprised";
	if (Progress == 100) Eyes = "Closed";

	// Find the expression in the character appearance and alters it
	for (let A = 0; A < C.Appearance.length; A++) {
		if (C.Appearance[A].Asset.Group.Name == "Blush") C.Appearance[A].Property = { Expression: Blush };
		if (C.Appearance[A].Asset.Group.Name == "Eyebrows") C.Appearance[A].Property = { Expression: Eyebrows };
		if (C.Appearance[A].Asset.Group.Name == "Fluids") C.Appearance[A].Property = { Expression: Fluids };
		if (C.Appearance[A].Asset.Group.Name == "Eyes") C.Appearance[A].Property = { Expression: Eyes };
		if (C.Appearance[A].Asset.Group.Name == "Eyes2") C.Appearance[A].Property = { Expression: Eyes };
	}

	// Penis gets hard at arousal 30+
	let Penis = InventoryGet(C, "Pussy");
	if ((Penis != null) && (Penis.Asset != null) && (Penis.Asset.Name == "Penis")) {
		if (Progress < 30) Penis.Property = { Expression: null };
		else Penis.Property = { Expression: "Hard" };
	}

	// Refreshes the character
	CharacterRefresh(C, false);

}

/**
 * With time, we increase or decrease the arousal. Validates the result to keep it within 0 to 100 and triggers an orgasm when it reaches 100
 * @param {Character} C - Character for which the timer is progressing
 * @param {number} Progress - Progress made (from -100 to 100)
 * @returns {void} - Nothing
 */
function ActivityTimerProgress(C, Progress) {

	// Changes the current arousal progress value
	C.ArousalSettings.Progress = C.ArousalSettings.Progress + Progress;
	// Decrease the vibratorlevel to 0 if not being aroused, while also updating the change time to reset the vibrator animation
	if (Progress < 0) {
		if (C.ArousalSettings.VibratorLevel != 0) {
			C.ArousalSettings.VibratorLevel = 0;
			C.ArousalSettings.ChangeTime = CommonTime();
		}
	}

	if (C.ArousalSettings.Progress < 0) C.ArousalSettings.Progress = 0;
	if (C.ArousalSettings.Progress > 100) C.ArousalSettings.Progress = 100;

	// Update the recent change time, so that on other player's screens the character's arousal meter will vibrate again when vibes start
	if (C.ArousalSettings.Progress == 0) {
		C.ArousalSettings.ChangeTime = CommonTime();
	}

	// Out of orgasm mode, it can affect facial expressions at every 10 steps
	if ((C.ArousalSettings.OrgasmTimer == null) || (typeof C.ArousalSettings.OrgasmTimer !== "number") || isNaN(C.ArousalSettings.OrgasmTimer) || (C.ArousalSettings.OrgasmTimer < CurrentTime))
		if (((C.ArousalSettings.AffectExpression == null) || C.ArousalSettings.AffectExpression) && ((C.ArousalSettings.Progress + ((Progress < 0) ? 1 : 0)) % 10 == 0))
			ActivityExpression(C, C.ArousalSettings.Progress);

	// Can trigger an orgasm
	if (C.ArousalSettings.Progress == 100) ActivityOrgasmPrepare(C);

}

/**
 * Set the current vibrator level for drawing purposes
 * @param {Character} C - Character for which the timer is progressing
 * @param {0 | 1 | 2 | 3 | 4} Level - Level from 0 to 4 (higher = more vibration)
 * @returns {void} - Nothing
 */
function ActivityVibratorLevel(C, Level) {
	if (C.ArousalSettings != null) {
		if (Level != C.ArousalSettings.VibratorLevel) {
			C.ArousalSettings.VibratorLevel = Level;
			C.ArousalSettings.ChangeTime = CommonTime();
		}
	}
}


/**
 * Calculates the progress one character does on another right away
 * @param {Character} Source - The character who performed the activity
 * @param {Character} Target - The character on which the activity was performed
 * @param {Activity} Activity - The activity performed
 * @param {AssetGroup} Group - The group on which the activity is performed
 * @param {Asset} [Asset] - The asset used to perform the activity
 * @returns {void} - Nothing
 */
function ActivityRunSelf(Source, Target, Activity, Group, Asset) {
	if (((Player.ArousalSettings.Active == "Hybrid") || (Player.ArousalSettings.Active == "Automatic")) && Source.IsPlayer() && !Target.IsPlayer()) {
		var Factor = (PreferenceGetActivityFactor(Player, Activity.Name, false) * 5) - 10; // Check how much the player likes the activity, from -10 to +10
		Factor = Factor + Math.floor((Math.random() * 8)); // Random 0 to 7 bonus
		if (Target.IsLoverOfPlayer()) Factor = Factor + Math.floor((Math.random() * 8)); // Another random 0 to 7 bonus if the target is the player's lover
		ActivitySetArousalTimer(Player, Activity, "ActivityOnOther", Factor, Asset);
	}
}

/**
 * Build the chat tag needed for lookup in ActivityDictionary.csv
 * @param {Character} character
 * @param {AssetGroup} group
 * @param {Activity} activity
 */
function ActivityBuildChatTag(character, group, activity, is_label = false) {
	const groupMap = {"ItemVulva":"ItemPenis", "ItemVulvaPiercings": "ItemGlans"};
	const realGroup = character.HasPenis() && groupMap[group.Name] ? groupMap[group.Name] : group.Name;

	return `${is_label ? "Label-" : ""}${(character.IsPlayer() ? "ChatSelf" : "ChatOther")}-${realGroup}-${activity.Name}`;
}

/**
 * Launches a sexual activity for a character and sends the chatroom message if applicable.
 * @param {Character} actor - Character which is performing the activity
 * @param {Character} acted - Character on which the activity was triggered
 * @param {AssetItemGroup} targetGroup - The group targetted by the activity
 * @param {ItemActivity} ItemActivity - The activity performed, with its optional item used
 * @param {boolean} sendMessage - Whether to send a message to the chat or not
 */
function ActivityRun(actor, acted, targetGroup, ItemActivity, sendMessage=true) {
	ActivityLog(`${actor.Name} on ${acted.Name}: triggering activity on group ${targetGroup.Name}`, ItemActivity);
	const Activity = ItemActivity.Activity;
	const UsedAsset = ItemActivity && ItemActivity.Item ? ItemActivity.Item.Asset : null;

	let group = ActivityGetGroupOrMirror(acted.AssetFamily, targetGroup.Name);
	// If the player does the activity on herself or an NPC, we calculate the result right away
	if ((acted.ArousalSettings.Active == "Hybrid") || (acted.ArousalSettings.Active == "Automatic"))
		if (acted.IsPlayer() || acted.IsNpc())
			ActivityEffect(actor, acted, Activity, group.Name, 0, UsedAsset);

	if (acted.IsPlayer()) {
		if (Activity.MakeSound) {
			PropertyAutoPunishHandled = new Set();
		}
	}
	if (actor.IsPlayer()) {
		PropertyPunishActivityCache.add(Activity.Name);
	}

	// If the player does the activity on someone else, we calculate the progress for the player right away
	ActivityRunSelf(actor, acted, Activity, group, UsedAsset);

	// The text result can be outputted in the chatroom or in the NPC dialog
	if (ServerPlayerIsInChatRoom() && sendMessage) {

		// Publishes the activity to the chatroom
		const dictionary = new DictionaryBuilder()
			.sourceCharacter(actor)
			.targetCharacter(acted)
			.focusGroup(group.Name);
		if (ItemActivity.Item) {
			dictionary.asset(ItemActivity.Item.Asset, "ActivityAsset", ItemActivity.Item.Craft && ItemActivity.Item.Craft.Name);
		}

		const Dictionary = dictionary.build();
		Dictionary.push({ ActivityName: Activity.Name });
		ServerSend("ChatRoomChat", { Content: ActivityBuildChatTag(acted, group, Activity), Type: "Activity", Dictionary });

		// If the activity is a stimulation trigger, run it if the target is the player
		if (acted.IsPlayer() && Activity.StimulationAction) {
			ChatRoomStimulationMessage(Activity.StimulationAction);
		}
	}
}

/**
 * Checks if a used asset should trigger an activity/arousal progress on the target character
 * @param {Character} Source - The character who used the item
 * @param {Character} Target - The character on which the item was used
 * @param {Asset} Asset - Asset used
 * @return {void} - Nothing
 */
function ActivityArousalItem(Source, Target, Asset) {
	var AssetActivity = Asset.DynamicActivity(Source);
	if (AssetActivity != null) {
		var Activity = AssetGetActivity(Target.AssetFamily, AssetActivity);
		if (Source.IsPlayer() && !Target.IsPlayer()) ActivityRunSelf(Source, Target, Activity, Asset.Group);
		if (PreferenceArousalAtLeast(Target, "Hybrid") && (Target.IsPlayer() || Target.IsNpc()))
			ActivityEffect(Source, Target, AssetActivity, /** @type {AssetGroupItemName} */ (Asset.Group.Name));
	}
}

/**
 * Checks if the character is wearing an item tagged with the fetish type name and returns the love factor for it
 * @param {Character} C - The character to validate
 * @param {FetishName} Type - The fetish type name
 * @return {number} - From -2 (hate it) to 2 (adore it) based on the player preferences
 */
function ActivityFetishItemFactor(C, Type) {
	const Factor = (PreferenceGetFetishFactor(C, Type) - 2);
	if (Factor === 0) {
		return Factor;
	}

	for (const item of C.Appearance) {
		const fetish = [
			...InventoryGetItemProperty(item, "Fetish"),
			...(item.Asset.Fetish || []),
		];
		if (fetish.includes(Type)) {
			return Factor;
		}
	}
	return 0;
}

/**
 * Loops in all fetishes for a character and calculates the total fetish factor
 * @param {Character} C - The character to validate
 * @return {number} - The negative/positive number will have negative/positive impact on arousal
 */
function ActivityFetishFactor(C) {
	var Factor = 0;
	if ((C.ArousalSettings != null) && (C.ArousalSettings.Fetish != null) && (typeof C.ArousalSettings.Fetish == "string"))
		for (let F of FetishFemale3DCG)
			if (PreferenceGetFetishFactor(C, F.Name) != 2)
				Factor = Factor + F.GetFactor(C);
	return Factor;
}

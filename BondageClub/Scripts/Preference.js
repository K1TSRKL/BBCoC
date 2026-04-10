// @ts-strict-ignore
"use strict";

/**
 * Get the sensory deprivation setting for the player
 * @returns {boolean} - Return true if sensory deprivation is active, false otherwise
 */
function PreferenceIsPlayerInSensDep() {
	return (
		Player.GameplaySettings
		&& ((Player.GameplaySettings.SensDepChatLog == "SensDepNames") || (Player.GameplaySettings.SensDepChatLog == "SensDepTotal") || (Player.GameplaySettings.SensDepChatLog == "SensDepExtreme"))
		&& (Player.GetDeafLevel() >= 3)
		&& (Player.GetBlindLevel() >= 3 || ChatRoomSenseDepBypass)
	);
}

/**
 * Compares the arousal preference level and returns TRUE if that level is met, or an higher level is met
 * @param {Character} C - The player who performs the sexual activity
 * @param {ArousalActiveName} Level - The name of the level ("Inactive", "NoMeter", "Manual", "Hybrid", "Automatic")
 * @returns {boolean} - Returns TRUE if the level is met or more
 */
function PreferenceArousalAtLeast(C, Level) {
	if (AsylumGGTSIsEnabled() && AsylumGGTSGetLevel(C) >= 4) {
		if (InventoryIsWorn(C, "ItemPelvis", "FuturisticChastityBelt") || InventoryIsWorn(C, "ItemPelvis", "FuturisticTrainingBelt") || InventoryIsWorn(C, "ItemDevices", "FuckMachine"))
			return true;
	}
	if ((C.ArousalSettings == null) || (C.ArousalSettings.Active == null)) return false;
	if (Level === C.ArousalSettings.Active) return true;
	if (C.ArousalSettings.Active == "Automatic") return true;
	if ((Level == "Manual") && (C.ArousalSettings.Active == "Hybrid")) return true;
	if ((Level == "NoMeter") && ((C.ArousalSettings.Active == "Manual") || (C.ArousalSettings.Active == "Hybrid"))) return true;
	return false;
}

/**
 * Gets the effect of a sexual activity on the player
 * @param {Character} C - The player who performs the sexual activity
 * @param {ActivityName} Type - The type of the activity that is performed
 * @param {boolean} Self - Determines, if the current player is giving (false) or receiving (true)
 * @returns {ArousalFactor} - Returns the love factor of the activity for the character (0 is horrible, 2 is normal, 4 is great)
 */
function PreferenceGetActivityFactor(C, Type, Self) {
	const activity = AssetGetActivity(C.AssetFamily, Type);
	if (!activity || !CommonIsNonNegativeInteger(activity.ActivityID)) return 0;

	// Gets the value and make sure it's valid
	let Value = C.ArousalSettings.Activity.charCodeAt(activity.ActivityID) - 100;
	if (Self) Value = Value % 10;
	else Value = Math.floor(Value / 10);

	return /** @type {ArousalFactor} */ (Value >= 0 && Value <= 4 ? Value : 2);
}

/**
 * Sets the love factor of a sexual activity for the character
 * @param {Character} C - The character for whom the activity factor should be set
 * @param {ActivityName} Type - The type of the activity that is performed
 * @param {boolean} Self - Determines, if the current player is giving (false) or receiving (true)
 * @param {ArousalFactor} Factor - The factor of the sexual activity (0 is horrible, 2 is normal, 4 is great)
 */
function PreferenceSetActivityFactor(C, Type, Self, Factor) {
	// Make sure the Activity data is valid
	if ((typeof Factor !== "number") || (Factor < 0) || (Factor > 4)) return;

	const activity = AssetGetActivity(C.AssetFamily, Type);
	if (!activity || !CommonIsNonNegativeInteger(activity.ActivityID)) return;

	// Gets and sets the factors
	let SelfFactor = PreferenceGetActivityFactor(C, Type, true);
	let OtherFactor = PreferenceGetActivityFactor(C, Type, false);
	if (Self) {
		SelfFactor = Factor;
	} else {
		OtherFactor = Factor;
	}

	const val = PreferenceArousalActivityToChar(SelfFactor, OtherFactor);
	const def = PreferenceArousalActivityToChar(PreferenceActivityEnjoymentDefault.Self, PreferenceActivityEnjoymentDefault.Other);
	C.ArousalSettings.Activity = CommonStringSplice(C.ArousalSettings.Activity, activity.ActivityID, val, def);
}

/**
 * Gets the factor of a fetish for the player, "2" for normal is default if factor isn't found
 * @param {Character} C - The character to query
 * @param {FetishName} Type - The name of the fetish
 * @returns {ArousalFactor} - Returns the love factor of the fetish for the character (0 is horrible, 2 is normal, 4 is great)
 */
function PreferenceGetFetishFactor(C, Type) {
	// Finds the ID of the fetish specified
	const fetish = AssetGetFetish(C.AssetFamily, Type);
	if (!fetish || !CommonIsNonNegativeInteger(fetish.FetishID)) return 0;

	// If value is between 0 and 4, we return it
	let Value = C.ArousalSettings.Fetish.charCodeAt(fetish.FetishID) - 100;
	return /** @type {ArousalFactor} */ (Value >= 0 && Value <= 4 ? Value : 2);
}

/**
 * Sets the arousal factor of a fetish for a character
 * @param {Character} C - The character to set
 * @param {FetishName} Type - The name of the fetish
 * @param {ArousalFactor} Factor - New arousal factor for that fetish (0 is horrible, 2 is normal, 4 is great)
 * @returns {void} - Nothing
 */
function PreferenceSetFetishFactor(C, Type, Factor) {
	// Make sure the fetish data is valid
	if ((typeof Factor !== "number") || (Factor < 0) || (Factor > 4)) return;

	const fetish = AssetGetFetish(C.AssetFamily, Type);
	if (!fetish || !CommonIsNonNegativeInteger(fetish.FetishID)) return;

	// Sets the Fetish in the compressed string
	const val = PreferenceArousalFetishToChar(Factor);
	const def = PreferenceArousalFetishToChar(PreferenceArousalFetishDefault.Factor);
	C.ArousalSettings.Fetish = CommonStringSplice(C.ArousalSettings.Fetish, fetish.FetishID, val, def);
}

/**
 * Validates the character arousal object and converts it's objects to compressed string if needed
 * @param {ArousalFactor} factor - The factor of enjoyability from 0 (turn off) to 4 (very high)
 * @param {boolean} allowOrgasm - Whether the zone can give an orgasm
 * @returns {string} - A string of 1 char that represents the compressed zone
 */
function PreferenceArousalZoneToChar(factor, allowOrgasm) {
	if ((factor < 0) || (factor > 4)) factor = 2;
	return String.fromCharCode(100 + factor + (allowOrgasm ? 10 : 0));
}

/**
 * Turn a fetish factor value into its serialized character representation
 * @param {ArousalFactor} factor - The factor of enjoyability from 0 (turn off) to 4 (very high)
 * @returns {string} - A string of 1 char that represents the compressed zone
 */
function PreferenceArousalFetishToChar(factor) {
	if ((factor < 0) || (factor > 4)) factor = 2;
	return String.fromCharCode(100 + factor);
}

/**
 * Validates the character arousal object and converts it's objects to compressed string if needed
 * @param {number} selfFactor - The first factor of enjoyability from 0 (turn off) to 4 (very high)
 * @param {number} otherFactor - The second factor of enjoyability from 0 (turn off) to 4 (very high)
 * @returns {string} - A string of 1 char that represents the compressed zone
 */
function PreferenceArousalActivityToChar(selfFactor, otherFactor) {
	if ((selfFactor < 0) || (selfFactor > 4)) selfFactor = 2;
	if ((otherFactor < 0) || (otherFactor > 4)) otherFactor = 2;
	return String.fromCharCode(100 + selfFactor + (otherFactor * 10));
}

/**
 * Gets the corresponding arousal zone definition from a player's preferences (if the group's activities are mirrored,
 * returns the arousal zone definition for the mirrored group).
 * @param {Character} C - The character for whom to get the arousal zone
 * @param {AssetGroupItemName} ZoneName - The name of the zone to get
 * @returns {null | ArousalZone} - Returns the arousal zone preference object,
 * or null if a corresponding zone definition could not be found.
 */
function PreferenceGetArousalZone(C, ZoneName) {
	// Finds the asset group and make sure the string contains it
	let Group = AssetGroupGet(C.AssetFamily, ZoneName);
	if (!Group || !CommonIsNonNegativeInteger(Group.ArousalZoneID) || (C.ArousalSettings.Zone.length <= Group.ArousalZoneID)) return null;

	const Value = C.ArousalSettings.Zone.charCodeAt(Group.ArousalZoneID) - 100;
	let Factor = /** @type {ArousalFactor} */ (CommonClamp(Value % 10, 0, 4));
	return {
		Name: ZoneName,
		Factor: Factor,
		Orgasm: (Value >= 10)
	};
}

/**
 * Gets the love factor of a zone for the character
 * @param {Character} C - The character for whom the love factor of a particular zone should be gotten
 * @param {AssetGroupItemName} ZoneName - The name of the zone to get the love factor for
 * @returns {ArousalFactor} - Returns the love factor of a zone for the character (0 is horrible, 2 is normal, 4 is great)
 */
function PreferenceGetZoneFactor(C, ZoneName) {
	const Zone = PreferenceGetArousalZone(C, ZoneName);
	if (!Zone) return 0;
	return Zone.Factor;
}

/**
 * Sets the arousal zone data for a specific body zone on the player
 * @param {Character} C - The character, for whom the love factor of a particular zone should be set
 * @param {AssetGroupItemName} ZoneName - The name of the zone, the factor should be set for
 * @param {ArousalFactor} Factor - The factor of the zone (0 is horrible, 2 is normal, 4 is great)
 * @param {boolean} CanOrgasm - Sets, if the character can cum from the given zone (true) or not (false)
 * @returns {void} - Nothing
 */
function PreferenceSetArousalZone(C, ZoneName, Factor = null, CanOrgasm = null) {
	// Gets the zone object
	let Zone = PreferenceGetArousalZone(C, ZoneName);
	if (!Zone) return;

	const Group = AssetGroupGet(C.AssetFamily, ZoneName);

	if (typeof Factor === "number") {
		Zone.Factor = Factor;
	}
	if (typeof CanOrgasm === "boolean") {
		Zone.Orgasm = CanOrgasm;
	}

	// Creates the new char and slides it in the compressed string
	const val = PreferenceArousalZoneToChar(Zone.Factor, Zone.Orgasm);
	const def = PreferenceArousalZoneToChar(PreferenceArousalZoneDefault.Factor, PreferenceArousalZoneDefault.Orgasm);
	C.ArousalSettings.Zone = CommonStringSplice(C.ArousalSettings.Zone, Group.ArousalZoneID, val, def);
}

/**
 * Determines, if a player can reach on orgasm from a particular zone
 * @param {Character} C - The character whose ability to orgasm we check
 * @param {AssetGroupItemName} ZoneName - The name of the zone to check
 * @returns {boolean} - Returns true if the zone allows orgasms for a character, false otherwise
 */
function PreferenceGetZoneOrgasm(C, ZoneName) {
	const Zone = PreferenceGetArousalZone(C, ZoneName);
	return !!Zone && !!Zone.Orgasm;
}

/**
 * Checks, if the arousal activity controls must be activated
 * @returns {boolean} - Returns true if we must activate the preference controls, false otherwise
 */
function PreferenceArousalIsActive() {
	return (PreferenceArousalActiveList[PreferenceArousalActiveIndex] != "Inactive");
}

/**
 * Initialize and validates the character settings
 * @param {Character} C - The character, whose preferences are initialized
 * @returns {void} - Nothing
 */
function PreferenceInit(C) {
	C.ArousalSettings = ValidationApplyRecord(C.ArousalSettings, C, PreferenceArousalSettingsValidate);
}

/**
 * Initialize and validates Player settings
 * @param {PlayerCharacter} C
 * @param {Partial<ServerAccountData>} data
 * @returns {void} - Nothing
 */
function PreferenceInitPlayer(C, data) {

	/**
	 * Save settings for comparison
	 * @satisfies {Partial<Record<keyof ServerAccountData, string>>}
	 */
	const PrefBefore = {
		ArousalSettings: JSON.stringify(data.ArousalSettings) ?? "",
		ChatSettings: JSON.stringify(data.ChatSettings) ?? "",
		VisualSettings: JSON.stringify(data.VisualSettings) ?? "",
		AudioSettings: JSON.stringify(data.AudioSettings) ?? "",
		ControllerSettings: JSON.stringify(data.ControllerSettings) ?? "",
		GameplaySettings: JSON.stringify(data.GameplaySettings) ?? "",
		ImmersionSettings: JSON.stringify(data.ImmersionSettings) ?? "",
		RestrictionSettings: JSON.stringify(data.RestrictionSettings) ?? "",
		OnlineSettings: JSON.stringify(data.OnlineSettings) ?? "",
		OnlineSharedSettings: JSON.stringify(data.OnlineSharedSettings) ?? "",
		GraphicsSettings: JSON.stringify(data.GraphicsSettings) ?? "",
		NotificationSettings: JSON.stringify(data.NotificationSettings) ?? "",
		GenderSettings: JSON.stringify(data.GenderSettings) ?? "",
		LabelColor: JSON.stringify(data.LabelColor) ?? "",
	};

	C.LabelColor = ServerAccountDataSyncedValidate.LabelColor(data.LabelColor, C);
	C.AllowedInteractions = data.AllowedInteractions ?? data.ItemPermission ?? 2;

	C.ArousalSettings = ValidationApplyRecord(data.ArousalSettings, C, PreferenceArousalSettingsValidate);
	C.AudioSettings = ValidationApplyRecord(data.AudioSettings, C, PreferenceAudioSettingsValidate);

	// @ts-ignore: Just backward-compat cleanup
	delete data.ChatSettings?.AutoBanBlackList;
	// @ts-ignore: Just backward-compat cleanup
	delete data.ChatSettings?.AutoBanGhostList;
	// @ts-ignore: Just backward-compat cleanup
	delete data.ChatSettings?.SearchFriendsFirst;
	// @ts-ignore: Just backward-compat cleanup
	delete data.ChatSettings?.DisableAnimations;
	// @ts-ignore: Just backward-compat cleanup
	delete data.ChatSettings?.SearchShowsFullRooms;
	// @ts-ignore: Just backward-compat cleanup
	delete data.OnlineSettings?.EnableWardrobeIcon;
	C.ChatSettings = ValidationApplyRecord(data.ChatSettings, C, PreferenceChatSettingsValidate);

	// @ts-expect-error: checking for old-style mapping
	if (data.ControllerSettings && typeof data.ControllerSettings?.ControllerA === "number") {
		// Port over to new mapping
		const s = /** @type {ControllerSettingsOld} */(/** @type {unknown} */(data.ControllerSettings));
		const buttonsMapping = {
			[ControllerButton.A]: s.ControllerA,
			[ControllerButton.B]: s.ControllerB,
			[ControllerButton.X]: s.ControllerX,
			[ControllerButton.Y]: s.ControllerY,
			[ControllerButton.DPadU]: s.ControllerDPadUp,
			[ControllerButton.DPadD]: s.ControllerDPadDown,
			[ControllerButton.DPadL]: s.ControllerDPadLeft,
			[ControllerButton.DPadR]: s.ControllerDPadRight,
		};
		const axisMapping = {
			[ControllerAxis.StickLV]: s.ControllerStickUpDown,
			[ControllerAxis.StickLH]: s.ControllerStickLeftRight,
		};
		ControllerLoadMapping(buttonsMapping, axisMapping);
		// Delete the old mapping
		const oldKeys = [
			"ControllerA",
			"ControllerB",
			"ControllerX",
			"ControllerY",
			"ControllerStickUpDown",
			"ControllerStickLeftRight",
			"ControllerStickRight",
			"ControllerStickDown",
			"ControllerDPadUp",
			"ControllerDPadDown",
			"ControllerDPadLeft",
			"ControllerDPadRight",
		];
		for (const old of oldKeys) {
			delete data.ControllerSettings[old];
		}
		// @ts-expect-error we don't have all the buttons
		data.ControllerSettings.Buttons = buttonsMapping;
		// @ts-expect-error we don't have all the axis
		data.ControllerSettings.Axis = axisMapping;
	}

	C.ControllerSettings = ValidationApplyRecord(data.ControllerSettings, C, PreferenceControllerSettingsValidate);
	ControllerLoadMapping(C.ControllerSettings.Buttons, C.ControllerSettings.Axis);

	ControllerStart();

	C.GameplaySettings = ValidationApplyRecord(data.GameplaySettings, C, PreferenceGameplaySettingsValidate);
	C.GraphicsSettings = ValidationApplyRecord(data.GraphicsSettings, C, PreferenceGraphicsSettingsValidate);
	C.GenderSettings = ValidationApplyRecord(data.GenderSettings, C, PreferenceGenderSettingsValidate);
	C.ImmersionSettings = ValidationApplyRecord(data.ImmersionSettings, C, PreferenceImmersionSettingsValidate);
	C.OnlineSettings = ValidationApplyRecord(data.OnlineSettings, C, PreferenceOnlineSettingsValidate, true);
	const extraKeys = CommonKeys(C.OnlineSettings).filter(i => !(i in PreferenceOnlineSettingsValidate));
	if (extraKeys.length) {
		console.warn(`Found extra keys ${extraKeys} in Player.OnlineSettings. Please move those to Player.ExtensionSettings`);
	}
	C.OnlineSharedSettings = ValidationApplyRecord(data.OnlineSharedSettings, C, PreferenceOnlineSharedSettingsValidate, true);
	C.RestrictionSettings = ValidationApplyRecord(data.RestrictionSettings, C, PreferenceRestrictionSettingsValidate);
	C.VisualSettings = ValidationApplyRecord(data.VisualSettings, C, PreferenceVisualSettingsValidate);

	// Convert old version of notification settings
	let NS = /** @type {Partial<NotificationSettingsType>} */ (data.NotificationSettings ?? {});

	if (typeof NS.Beeps !== "object") NS.Beeps = PreferenceInitNotificationSetting(NS.Beeps, NotificationAudioType.FIRST, NotificationAlertType.POPUP);
	// @ts-expect-error object gets its missing properties afterwards
	if (typeof NS.ChatMessage !== "object") NS.ChatMessage = PreferenceInitNotificationSetting(NS.ChatMessage, NotificationAudioType.FIRST);
	if (typeof NS.ChatMessage.Normal !== "boolean") NS.ChatMessage.Normal = true;
	if (typeof NS.ChatMessage.Whisper !== "boolean") NS.ChatMessage.Whisper = true;
	if (typeof NS.ChatMessage.Activity !== "boolean") NS.ChatMessage.Activity = false;
	// @ts-expect-error object gets its missing properties afterwards
	if (typeof NS.ChatJoin !== "object") NS.ChatJoin = PreferenceInitNotificationSetting(NS.ChatJoin, NotificationAudioType.FIRST);
	if (typeof NS.ChatJoin.Owner !== "boolean") NS.ChatJoin.Owner = false;
	if (typeof NS.ChatJoin.Lovers !== "boolean") NS.ChatJoin.Lovers = false;
	if (typeof NS.ChatJoin.Friendlist !== "boolean") NS.ChatJoin.Friendlist = false;
	if (typeof NS.ChatJoin.Subs !== "boolean") NS.ChatJoin.Subs = false;
	if (typeof NS.Disconnect !== "object") NS.Disconnect = PreferenceInitNotificationSetting(NS.Disconnect, NotificationAudioType.FIRST);
	if (typeof NS.Larp !== "object") NS.Larp = PreferenceInitNotificationSetting(NS.Larp, NotificationAudioType.FIRST, NotificationAlertType.NONE);
	if (typeof NS.Test !== "object") NS.Test = PreferenceInitNotificationSetting(NS.Test, NotificationAudioType.FIRST, NotificationAlertType.TITLEPREFIX);
	data.NotificationSettings = /** @type {NotificationSettingsType} */ (NS);

	C.NotificationSettings = ValidationApplyRecord(data.NotificationSettings, C, PreferenceNotificationSettingsValidate);

	// Forces some preferences depending on difficulty

	// Difficulty: non-Roleplay settings
	if (C.GetDifficulty() >= Difficulty.REGULAR) {
		C.RestrictionSettings.BypassStruggle = false;
		C.RestrictionSettings.SlowImmunity = false;
		C.RestrictionSettings.BypassNPCPunishments = false;
		C.RestrictionSettings.NoSpeechGarble = false;
	}

	// Difficulty: Hardcore settings
	if (C.GetDifficulty() >= Difficulty.HARDCORE) {
		C.GameplaySettings.EnableSafeword = false;
		C.GameplaySettings.DisableAutoMaid = true;
		C.GameplaySettings.OfflineLockedRestrained = true;
	}

	// Difficulty: Extreme settings
	if (C.GetDifficulty() >= Difficulty.EXTREME) {
		C.GameplaySettings.SensDepChatLog = "SensDepExtreme";
		C.GameplaySettings.BlindDisableExamine = true;
		C.GameplaySettings.DisableAutoRemoveLogin = true;
		C.ArousalSettings.DisableAdvancedVibes = false;
		C.GameplaySettings.ImmersionLockSetting = true;
		C.ImmersionSettings.StimulationEvents = true;
		C.ImmersionSettings.ReturnToChatRoom = true;
		C.ImmersionSettings.ReturnToChatRoomAdmin = true;
		C.ImmersionSettings.ChatRoomMapLeaveOnExit = true;
		C.ImmersionSettings.SenseDepMessages = true;
		C.ImmersionSettings.ChatRoomMuffle = true;
		C.ImmersionSettings.BlindAdjacent = true;
		C.ImmersionSettings.AllowTints = true;
		C.ImmersionSettings.ShowUngarbledMessages = false;
		C.OnlineSharedSettings.AllowPlayerLeashing = true;
		C.OnlineSharedSettings.AllowRename = true;
	}

	// Sync settings if anything changed
	/** @type {{ [k in keyof typeof PrefBefore]?: PlayerCharacter[k] }} */
	const toUpdate = {};

	for (const [prop, stringPrefBefore] of CommonEntries(PrefBefore))
		if (JSON.stringify(C[prop]) !== stringPrefBefore)
			toUpdate[/** @type {string} */(prop)] = data[prop];

	if (CommonVersionUpdated && (toUpdate != null) && (toUpdate.OnlineSharedSettings != null))
		toUpdate.OnlineSharedSettings.GameVersion = GameVersion;

	if (Object.keys(toUpdate).length > 0)
		ServerAccountUpdate.QueueData(toUpdate);
}

/**
 * Initialise the Notifications settings, converting the old boolean types to objects
 * @param {boolean} setting - The old version of the setting
 * @param {NotificationAudioType} audio - The audio setting
 * @param {NotificationAlertType} [defaultAlertType] - The default AlertType to use
 * @returns {NotificationSetting} - The setting to use
 */
function PreferenceInitNotificationSetting(setting, audio, defaultAlertType) {
	const alertType = typeof setting === "boolean" && setting === true ? NotificationAlertType.TITLEPREFIX : defaultAlertType ?? NotificationAlertType.NONE;
	return {
		AlertType: alertType,
		Audio: audio,
	};
}

/**
 * Migrates a named preference from one preference object to another if not already migrated
 * @param {object} from - The preference object to migrate from
 * @param {object} to - The preference object to migrate to
 * @param {string} prefName - The name of the preference to migrate
 * @param {any} defaultValue - The default value for the preference if it doesn't exist
 * @returns {void} - Nothing
 */
function PreferenceMigrate(from, to, prefName, defaultValue) {
	// Check that there's something to migrate (new characters) and that
	// we're not already migrated.

	if (typeof from !== "object" || typeof to !== "object") return;
	if (to[prefName] == null) {
		to[prefName] = from[prefName];
		if (to[prefName] == null) to[prefName] = defaultValue;
		if (from[prefName] != null) delete from[prefName];
	}
}

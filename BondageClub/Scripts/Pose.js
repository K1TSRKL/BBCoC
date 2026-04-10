// @ts-strict-ignore
"use strict";

/**
 * A list with all kneeling {@link AssetPoseMap["BodyLower"]} pose names.
 * @satisfies {readonly AssetPoseMap["BodyLower"][]}
 */
const PoseAllKneeling = Object.freeze(["Kneel", "KneelingSpread"]);

/**
 * A list with all standing {@link AssetPoseMap["BodyLower"]} pose names.
 * @satisfies {readonly AssetPoseMap["BodyLower"][]}
 */
const PoseAllStanding = Object.freeze(["BaseLower", "LegsOpen", "LegsClosed", "Spread"]);

/**
 * Namespace with functions for converting pose name arrays into records
 * @namespace
 */
const PoseToMapping = /** @type {const} */({
	/**
     * Unflatten a pose name array, converting it into a record mapping pose categories to aforementioned pose names
     * @param {readonly AssetPoseName[]} poses - The to-be unflattened pose array
     * @param {null | string} warningPrefix - A prefix to-be prepended to any warning messages
     * @returns {Partial<Record<AssetPoseCategory, AssetPoseName[]>>}
     */
	Array: function (poses, warningPrefix=null) {
		const prefix = warningPrefix == null ? "" : `${warningPrefix}: `;

		/** @type {Partial<Record<AssetPoseCategory, AssetPoseName[]>>} */
		const poseMapping = {};
		if (!CommonIsArray(poses)) {
			console.warn(`${prefix}Invalid pose array type: ${typeof poses}`);
			return poseMapping;
		}

		for (const poseName of poses) {
			const pose = PoseRecord[poseName];
			if (!pose) {
				console.warn(`${prefix}Ignoring invalid "${poseName}" pose`);
				continue;
			}

			const poseList = poseMapping[pose.Category];
			if (poseList) {
				poseList.push(poseName);
			} else {
				poseMapping[pose.Category] = [poseName];
			}
		}
		return poseMapping;
	},
	/**
     * Unflatten a pose name array, converting it into a record mapping pose categories to a single pose.
     * A warning will be logged if multiple poses within the same category are present.
     * @param {readonly AssetPoseName[]} poses - The to-be unflattened pose array
     * @param {null | string} warningPrefix - A prefix to-be prepended to any warning messages
     * @returns {Partial<Record<AssetPoseCategory, AssetPoseName>>}
     */
	Scalar: function (poses, warningPrefix=null) {
		const prefix = warningPrefix == null ? "" : `${warningPrefix}: `;

		/** @type {Partial<Record<AssetPoseCategory, AssetPoseName>>} */
		const poseMapping = {};
		if (!CommonIsArray(poses)) {
			console.warn(`${prefix}Invalid pose array type: ${typeof poses}`);
			return poseMapping;
		}

		for (const poseName of poses) {
			const pose = PoseRecord[poseName];
			if (!pose) {
				console.warn(`${prefix}Ignoring invalid "${poseName}" pose`);
				continue;
			}
			if (poseMapping[pose.Category]) {
				const invalidPoses = [poseMapping[pose.Category], poseName];
				console.warn(`${prefix}Found two or more poses within the ${pose.Category} category: ${invalidPoses}`);
			}
			poseMapping[pose.Category] = poseName;
		}
		return poseMapping;
	},
});

/**
 * Status codes for representing whether a character can or cannot change to a pose unaided.
 * @see {@link PoseCanChangeUnaided}
 * @satisfies {Record<string, PoseChangeStatus>}
 */
const PoseChangeStatus = /** @type {const} */({
	/** Never allow a particular change in pose  */
	NEVER: 0,
	/** Allow a particular change in pose only with someone else's assistance */
	NEVER_WITHOUT_AID: 1,
	/** Allow a particular change in pose only via some sort of struggle (_i.e._ the kneeling/standing minigame) */
	ALWAYS_WITH_STRUGGLE: 2,
	/** Always allow a particular change in pose */
	ALWAYS: 3,
});

/**
 * Checks to what extent the given character can change to a given pose.
 *
 * @see {@link PoseCanChangeUnaided} Check whether one can change to a pose _unaided_
 * @param {Character} C - The character to check
 * @param {AssetPoseName} poseName - The name of the pose to check for
 * @returns {PoseChangeStatus} - A status code denoting if and under what conditions the character can change pose
 */
function PoseCanChangeUnaidedStatus(C, poseName) {
	const pose = PoseRecord[poseName];
	if (!pose || !C) {
		return PoseChangeStatus.NEVER;
	}

	const canChange = PoseAvailable(C, pose.Category, pose.Name);
	if (!canChange) {
		return PoseChangeStatus.NEVER;
	} else if (ChatRoomOwnerPresenceRule("BlockChangePose", C)) {
		return PoseChangeStatus.NEVER_WITHOUT_AID;
	}

	// Add special casing for BodyLower, forcing usage of the "kneel/stand up" button if one or more standing poses have explicit support.
	if (pose.Category !== "BodyLower") {
		return PoseChangeStatus.ALWAYS;
	} else if (C.IsStanding() && (C.HasEffect("Freeze") || PoseAllStanding.some(p => PoseSetByItems(C, "BodyLower", p)))) {
		// Only allow standing -> standing transitions unaided
		return CommonIncludes(PoseAllStanding, poseName) ? PoseChangeStatus.ALWAYS : PoseChangeStatus.ALWAYS_WITH_STRUGGLE;
	} else if (C.IsKneeling() && (C.HasEffect("Freeze") || PoseAllKneeling.some(p => PoseSetByItems(C, "BodyLower", p)))) {
		// Only allow kneeling -> kneeling transitions unaided
		return CommonIncludes(PoseAllKneeling, poseName) ? PoseChangeStatus.ALWAYS : PoseChangeStatus.ALWAYS_WITH_STRUGGLE;
	} else {
		return PoseChangeStatus.ALWAYS;
	}
}

/**
 * Checks whether the given character can change to the pose unaided.
 *
 * Equivalent to checking whether a pose change has the {@link PoseChangeStatus.ALWAYS} status.
 * @param {Character} C - The character to check
 * @param {AssetPoseName} poseName - The name of the pose to check for
 * @returns {boolean} - Returns true if the character can always change a pose without struggle or external aid
 */
function PoseCanChangeUnaided(C, poseName) {
	return PoseCanChangeUnaidedStatus(C, poseName) === PoseChangeStatus.ALWAYS;
}

/**
 * Returns whether a pose is available.
 * @param {Character} C - Character to check for the pose
 * @param {AssetPoseCategory} category - The pose category
 * @param {AssetPoseName} poseName - The pose in question
 * @returns {boolean}
 */
function PoseAvailable(C, category, poseName) {
	if (!C) {
		return false;
	}
	const poseList = C.AllowedActivePoseMapping[category];
	return poseList?.includes(poseName) ?? true;
}

/**
 * Returns whether any poses are available in the passed category
 * @param {Character} C - Character to check for the pose category
 * @param {AssetPoseCategory} category - The pose category in question
 * @returns {boolean}
 */
function PoseCategoryAvailable(C, category) {
	if (!C) {
		return false;
	}
	const poseNames = C.AllowedActivePoseMapping[category];
	return !poseNames || poseNames.length > 0;
}

/**
 * Return whether the items on a character set a given pose.
 * Note that this does not guarantee that the pose is actually active.
 * @param {Character} C - Character to check for the pose
 * @param {AssetPoseCategory} category - The pose category
 * @param {AssetPoseName} poseName - The pose in question
 * @returns {boolean}
 */
function PoseSetByItems(C, category, poseName) {
	if (!C) {
		return false;
	}
	const poseList = C.AllowedActivePoseMapping[category];
	return poseList?.includes(poseName) ?? false;
}

/**
 * Sets a new pose for the character
 * @param {Character} C - Character for which to set the pose
 * @param {null | AssetPoseName} poseName - Name of the pose to set as active or `null` to return to the default pose
 * @param {boolean} [ForceChange=false] - TRUE if the set pose(s) should overwrite current active pose(s)
 * @param {boolean} [RefreshDialog] - Refresh {@link DialogSelfMenuMapping.Pose} if so required
 * @returns {void} - Nothing
 */
function PoseSetActive(C, poseName, ForceChange=false, RefreshDialog=true) {
	const newPose = PoseRecord[poseName];
	if (
		poseName == null
		|| ForceChange
		|| (newPose && newPose.Category === "BodyFull")
	) {
		C.ActivePoseMapping = (newPose == null) ? { BodyLower: "BaseLower", BodyUpper: "BaseUpper" } : { [newPose.Category]: newPose.Name };
		CharacterRefresh(C, false);
		if (RefreshDialog && DialogSelfMenuSelected === "Pose" && DialogSelfMenuMapping.Pose.C.ID === C.ID) {
			DialogSelfMenuMapping.Pose.Reload();
		}
		return;
	}

	// Validate the pre-existing activated poses before setting the new pose
	if (newPose) {
		for (const [category, name] of CommonEntries(C.ActivePoseMapping)) {
			const pose = PoseRecord[name];
			if (!pose || !pose.AllowMenu || pose.Category === "BodyFull") {
				delete C.ActivePoseMapping[category];
				continue;
			}
		}
		C.ActivePoseMapping[newPose.Category] = newPose.Name;
	}

	// If we reset to base, we remove the poses
	if (C.ActivePoseMapping.BodyFull) {
		delete C.ActivePoseMapping.BodyUpper;
		delete C.ActivePoseMapping.BodyLower;
	} else {
	    C.PoseMapping.BodyUpper = C.PoseMapping.BodyUpper ?? "BaseUpper";
	    C.PoseMapping.BodyLower = C.PoseMapping.BodyLower ?? "BaseLower";
	}

	CharacterRefresh(C, false);
	if (RefreshDialog && DialogSelfMenuSelected === "Pose" && DialogSelfMenuMapping.Pose.C.ID === C.ID) {
		DialogSelfMenuMapping.Pose.Reload();
	}
}

/**
 * Refreshes the list of poses for a character. Each pose can only be found once in the pose array
 * @param {Character} C - Character for which to refresh the pose list
 * @returns {void} - Nothing
 */
function PoseRefresh(C) {
	C.AllowedActivePoseMapping = {};

	/**
	 * Categories mapped to the `SetPose` name-union of all items
	 * @type {Partial<Record<AssetPoseCategory, Set<AssetPoseName>>>}
	 * @see {@link Character.PoseMapping}
	 */
	const setPose = {};
	for (const item of C.Appearance) {
		const allowActivePoseList = InventoryGetItemProperty(item, "AllowActivePose");
		if (allowActivePoseList.length === 0) {
			continue;
		}
		const itemAllowActivePose = PoseToMapping.Array(allowActivePoseList, "Item.AllowActivePose");
		const itemSetPose = PoseToMapping.Array(InventoryGetItemProperty(item, "SetPose"), "Item.SetPose");

		// Update the allowed pose intersections
		for (const [category, poses] of CommonEntries(itemAllowActivePose)) {
			const poseList = C.AllowedActivePoseMapping[category];
			if (poseList) {
				C.AllowedActivePoseMapping[category] = poseList.filter(i => poses.includes(i));
			} else {
				C.AllowedActivePoseMapping[category] = poses;
			}
		}

		// BodyLower & BodyUpper are incompatible with `BodyFull`
		if ((itemAllowActivePose.BodyUpper || itemAllowActivePose.BodyLower) && !itemAllowActivePose.BodyFull) {
			C.AllowedActivePoseMapping.BodyFull = [];
		}

		// Update the setpose union
		for (const [category, poses] of CommonEntries(itemSetPose)) {
			if (category in setPose) {
				poses.forEach(p => setPose[category].add(p));
			} else {
				setPose[category] = new Set(poses);
			}
		}
	}

	// Ammend the `SetPose` union with `ActivePose` members, letting the latter take priority (within the limits of `AllowedActivePose`)
	const activePose = PoseToMapping.Array(C.ActivePose, "Character.ActivePose");
	for (const [category, poses] of CommonEntries(setPose)) {
		if (activePose[category]) {
			activePose[category].push(...poses);
		} else {
			activePose[category] = [...poses];
		}
	}

	// Find the intersection between the allowed active poses and the set poses
	/** @type {Partial<Record<AssetPoseCategory, AssetPoseName>>} */
	const poseMapping = {};
	const categories = new Set(PoseFemale3DCG.map(p => p.Category));
	for (const category of categories) {
		const poses = C.AllowedActivePoseMapping[category];
		const poseCandidate = activePose[category] && activePose[category].find(p => !poses || poses.includes(p));
		if (poseCandidate) {
			poseMapping[category] = poseCandidate;
		}
	}

	// Make the (somewhat arbitrary?) decision to have `BodyFull` take priority over `BodyUpper/Lower`
	// Only relevant in rare/hypothetical cases wherein both are eligible
	if (poseMapping.BodyFull) {
		delete poseMapping.BodyUpper;
		delete poseMapping.BodyLower;
	} else {
	    poseMapping.BodyUpper ??= C.PoseMapping.BodyUpper ?? "BaseUpper";
	    poseMapping.BodyLower ??= C.PoseMapping.BodyLower ?? "BaseLower";
	}

	// The `TapedHands` pose acts like a drop-in replacement for the `BaseUpper` pose
	if (C.PoseMapping.BodyHands) {
		delete C.PoseMapping[(!C.PoseMapping.BodyUpper || C.PoseMapping.BodyUpper === "BaseUpper") ? "BodyUpper" : "BodyHands"];
	}

	C.PoseMapping = poseMapping;
}

//@ts-check
"use strict";

/** @type {AssetOverride} */
const AssetOverride = "ASSET_OVERRIDE";
/** @type {Asset[]} */
var Asset = [];
/** @type {AssetGroup[]} */
var AssetGroup = [];
/** @type {Map<`${AssetGroupName}/${string}`, Asset>} */
var AssetMap = new Map();
/** @type {Map<AssetGroupName, AssetGroup>} */
var AssetGroupMap = new Map();
/** @type {Pose[]} */
var Pose = [];
/** A record mapping pose names to their respective {@link Pose}. */
const PoseRecord = /** @type {Record<AssetPoseName, Pose>} */({});
/**
 * A record mapping pose categories to sorting priorities.
 *
 * Used for prioritising certain poses over others in {@link CommonDrawResolveAssetPose},
 * a process required due to BC's lack of pose combinatorics support.
 * @satisfies {Record<AssetPoseCategory, number>}
 */
const PoseCategoryPriority = {
	// FIXME: Hack to ensure that `Suspension` poses take priority over `BodyUpper`
	BodyAddon: 3,
	// FIXME: Hack to ensure that `BodyLower` poses take priority over `BodyUpper` if both are specified.
	// BC simply doesn't support the required combinatorics, so just stick to the (completely aribtrary) historical
	// precedent of prioritizing the lower body (a precedent used most notably by the wedding dress and teachers outfit)
	BodyLower: 2,
	BodyFull: 1,
	BodyHands: 1,
	BodyUpper: 1,
};

/** @type {Map<AssetGroupName, AssetGroup[]>} */
var AssetActivityMirrorGroups = new Map();

/**
 * A record mapping all {@link Asset.IsLock} asset names to their respective assets.
 * @type {Record<AssetLockType, Asset>}
 */
const AssetLocks = /** @type {Record<AssetLockType, Asset>} */({});

/** Special values for {@link AssetDefinition.PoseMapping} for hiding or using pose-agnostic assets. */
const PoseType = /** @type {const} */({
	/**
	 * Ensures that the asset is hidden for a specific pose.
	 * Supercedes the old `HideForPose` property.
	 */
	HIDE: "Hide",
	/**
	 * Ensures that the default (pose-agnostic) asset used for a particular pose.
	 * Supercedes the old `AllowPose` property.
	 */
	DEFAULT: "",
});

/**
 * Adds a new asset group to the main list
 * @param {IAssetFamily} Family
 * @param {AssetGroupDefinition} GroupDef
 * @returns {AssetGroup}
 */
function AssetGroupAdd(Family, GroupDef) {
	const AllowNone = typeof GroupDef.AllowNone === "boolean" ? GroupDef.AllowNone : true;
	/** @type {BCColor[]} */
	const ColorSchema = (GroupDef.Color == null) ? ["Default"] : GroupDef.Color;

	/** @type {AssetGroup} */
	var A = {
		Family: Family,
		Name: GroupDef.Group,
		Description: GroupDef.Group,
		Asset: [],
		ParentGroup: AssetParseParentGroup(GroupDef.ParentGroup, {}),
		Category: (GroupDef.Category == null) ? "Appearance" : GroupDef.Category,
		IsDefault: (GroupDef.Default == null) ? true : GroupDef.Default,
		IsRestraint: (GroupDef.IsRestraint == null) ? false : GroupDef.IsRestraint,
		AllowNone,
		AllowColorize: (GroupDef.AllowColorize == null) ? true : GroupDef.AllowColorize,
		AllowCustomize: (GroupDef.AllowCustomize == null) ? true : GroupDef.AllowCustomize,
		Random: (GroupDef.Random == null) ? true : GroupDef.Random,
		ColorSchema,
		DefaultColor: ColorSchema[0],
		ParentSize: (GroupDef.ParentSize == null) ? "" : GroupDef.ParentSize,
		ParentColor: (GroupDef.ParentColor == null) ? "" : GroupDef.ParentColor,
		Clothing: (GroupDef.Clothing == null) ? false : GroupDef.Clothing,
		Underwear: (GroupDef.Underwear == null) ? false : GroupDef.Underwear,
		BodyCosplay: (GroupDef.BodyCosplay == null) ? false : GroupDef.BodyCosplay,
		EditOpacity: (GroupDef.EditOpacity == null) ? false : GroupDef.EditOpacity,
		MinOpacity: (GroupDef.MinOpacity == null) ? 1 : GroupDef.MinOpacity,
		MaxOpacity: (GroupDef.MaxOpacity == null) ? 1 : GroupDef.MaxOpacity,
		Hide: GroupDef.Hide,
		Block: GroupDef.Block,
		Zone: GroupDef.Zone,
		ArousalZoneID: GroupDef.ArousalZoneID,
		SetPose: GroupDef.SetPose,
		PoseMapping: GroupDef.PoseMapping || {},
		AllowExpression: GroupDef.AllowExpression,
		Effect: Array.isArray(GroupDef.Effect) ? GroupDef.Effect : [],
		MirrorGroup: (GroupDef.MirrorGroup == null) ? "" : GroupDef.MirrorGroup,
		RemoveItemOnRemove: (GroupDef.RemoveItemOnRemove == null) ? [] : GroupDef.RemoveItemOnRemove,
		DrawingPriority: (GroupDef.Priority == null) ? AssetGroup.length : GroupDef.Priority,
		DrawingLeft: AssetParseTopLeft(GroupDef.Left, 0),
		DrawingTop: AssetParseTopLeft(GroupDef.Top, 0),
		DrawingBlink: (GroupDef.Blink == null) ? false : GroupDef.Blink,
		InheritColor: (typeof GroupDef.InheritColor === "string" ? GroupDef.InheritColor : null),
		PreviewZone: GroupDef.PreviewZone,
		DynamicGroupName: GroupDef.DynamicGroupName || GroupDef.Group,
		MirrorActivitiesFrom: GroupDef.MirrorActivitiesFrom || undefined,
		ArousalZone: (typeof GroupDef.ArousalZone === "string" ? GroupDef.ArousalZone : undefined),
		ColorSuffix: GroupDef.ColorSuffix || {},
		ExpressionPrerequisite: GroupDef.ExpressionPrerequisite || [],
		HasPreviewImages: typeof GroupDef.HasPreviewImages === "boolean" ? GroupDef.HasPreviewImages : AllowNone,
		/** @type {() => this is AssetAppearanceGroup} */
		IsAppearance() { return this.Category === "Appearance"; },
		/** @type {() => this is AssetItemGroup} */
		IsItem() { return this.Category === "Item"; },
		/** @type {() => this is AssetScriptGroup} */
		IsScript() { return this.Category === "Script"; },
	};
	AssetGroupMap.set(A.Name, A);
	AssetActivityMirrorGroupSet(A);
	AssetGroup.push(A);
	return A;
}

/**
 * Parse the passed {@link AssetDefinition.Top} and Left values
 * @param {undefined | TopLeft.Definition} value
 * @param {number | TopLeft.Data} fallback
 * @returns {TopLeft.Data}
 */
function AssetParseTopLeft(value, fallback) {
	fallback = typeof fallback === "number" ? { [PoseType.DEFAULT]: fallback } : { ...fallback };
	if (value == null) {
		return fallback;
	} else if (typeof value === "number") {
		return { [PoseType.DEFAULT]: value };
	} else {
		let def = value[PoseType.DEFAULT];
		if (def == null) {
			def = fallback[PoseType.DEFAULT];
		}
		return { ...value, [PoseType.DEFAULT]: def };
	}
}

/**
 * Parse the passed item-left {@link ItemPropertiesConfig["DrawingTop"]} and DrawingLeft values
 * @param {TopLeft.ItemDefinition} value
 * @param {null | string} [propName] The name of the underlying property for the purpose of error reporting
 * @returns {undefined | TopLeft.ItemData}
 */
function ItemParseTopLeft(value, propName=null) {
	if (!CommonIsObject(value)) {
		throw new TypeError(`Invalid ${propName ?? "DrawingTop or DrawingLeft"} property type: ${value}`);
	}
	return CommonFromEntries(CommonEntries(value).map(([layerName, protoConfig]) => {
		/** @type {TopLeft.DataMutable} */
		let config;
		if (CommonIsInteger(protoConfig)) {
			config = { [PoseType.DEFAULT]: protoConfig };
		} else if (CommonIsObject(protoConfig)) {
			config = protoConfig;
		} else {
			throw new TypeError(`Invalid ${propName ?? "Top or Left"} value for layer "${layerName}": ${protoConfig}`);
		}
		return [layerName, config];
	}));
}

/**
 * Collects the group equivalence classes defined by the MirrorActivitiesFrom property into a map for easy access to
 * mirror group sets (i.e. all groups that are mirror activities from, or are mirrored by, each other).
 * @param {AssetGroup} group - The group to register
 */
function AssetActivityMirrorGroupSet(group) {
	if (group.MirrorActivitiesFrom) {
		const mirrorGroups = AssetActivityMirrorGroups.get(group.MirrorActivitiesFrom);
		if (mirrorGroups) {
			mirrorGroups.push(group);
			AssetActivityMirrorGroups.set(group.Name, mirrorGroups);
			return;
		}
	}
	AssetActivityMirrorGroups.set(group.Name, [group]);
}

/**
 * Adds a new asset to the main list
 * @param {AssetGroup} Group
 * @param {AssetDefinition} AssetDef
 * @param {ExtendedItemMainConfig} ExtendedConfig
 * @returns {void} - Nothing
 */
function AssetAdd(Group, AssetDef, ExtendedConfig) {
	const allowLock = typeof AssetDef.AllowLock === "boolean" ? AssetDef.AllowLock : false;
	const difficulty = AssetDef.Difficulty ?? 0;

	const editOpacity = (typeof AssetDef.EditOpacity === "boolean") ? AssetDef.EditOpacity : (typeof Group.EditOpacity === "boolean") ? Group.EditOpacity : false;
	let minOpacity = editOpacity ? AssetParseOpacity(typeof AssetDef.MinOpacity === "number" ? AssetDef.MinOpacity : Group.MinOpacity) : 1;
	let maxOpacity = editOpacity ? AssetParseOpacity(typeof AssetDef.MaxOpacity === "number" ? AssetDef.MaxOpacity : Group.MaxOpacity) : 1;
	const opacity = editOpacity ? AssetParseOpacity(AssetDef.Opacity, minOpacity, maxOpacity) : 1;

	/** @type {Mutable<Asset>} */
	var A = {
		Name: AssetDef.Name,
		Description: AssetDef.Name,
		Group: Group,
		ParentItem: AssetDef.ParentItem,
		ParentGroup: AssetParseParentGroup(AssetDef.ParentGroup, Group.ParentGroup),
		Enable: (AssetDef.Enable == null) ? true : AssetDef.Enable,
		Visible: (AssetDef.Visible == null) ? true : AssetDef.Visible,
		StyleOverride: AssetDef.StyleOverride,
		CreateLayerTypesOverride: AssetDef.CreateLayerTypesOverride,
		DrawOffset: AssetDef.DrawOffset,
		NotVisibleOnScreen: Array.isArray(AssetDef.NotVisibleOnScreen) ? AssetDef.NotVisibleOnScreen : [],
		Wear: (AssetDef.Wear == null) ? true : AssetDef.Wear,
		Activity: (typeof AssetDef.Activity === "string" ? AssetDef.Activity : null),
		ActivityAudio: Array.isArray(AssetDef.ActivityAudio) ? AssetDef.ActivityAudio : [],
		AllowActivity: Array.isArray(AssetDef.AllowActivity) ? AssetDef.AllowActivity : [],
		AllowActivityOn: Array.isArray(AssetDef.AllowActivityOn) ? AssetDef.AllowActivityOn : [],
		ActivityExpression: Array.isArray(AssetDef.ActivityExpression) ? AssetDef.ActivityExpression : {},
		BuyGroup: AssetDef.BuyGroup,
		InventoryID: AssetDef.InventoryID,
		Effect: (AssetDef.Effect == null) ? Group.Effect : AssetDef.Effect,
		Bonus: AssetDef.Bonus,
		Block: (AssetDef.Block == null) ? Group.Block : AssetDef.Block,
		Expose: (AssetDef.Expose == null) ? [] : AssetDef.Expose,
		Hide: (AssetDef.Hide == null) ? Group.Hide : AssetDef.Hide,
		HideItem: AssetDef.HideItem,
		HideItemExclude: AssetDef.HideItemExclude || [],
		HideItemAttribute: AssetDef.HideItemAttribute || [],
		Require: (!Array.isArray(AssetDef.Require) ? [] : AssetDef.Require),
		SetPose: (AssetDef.SetPose == null) ? Group.SetPose : AssetDef.SetPose,
		AllowActivePose: AssetDef.AllowActivePose,
		Value: (AssetDef.Value == null) ? 0 : AssetDef.Value,
		NeverSell: AssetDef.NeverSell ?? false,
		Difficulty: difficulty,
		SelfBondage: (AssetDef.SelfBondage == null) ? 0 : AssetDef.SelfBondage,
		SelfUnlock: (AssetDef.SelfUnlock == null) ? true : AssetDef.SelfUnlock,
		ExclusiveUnlock: (AssetDef.ExclusiveUnlock == null) ? false : AssetDef.ExclusiveUnlock,
		Random: (AssetDef.Random == null) ? true : AssetDef.Random,
		RemoveAtLogin: (AssetDef.RemoveAtLogin == null) ? false : AssetDef.RemoveAtLogin,
		WearTime: (AssetDef.Time == null) ? 0 : AssetDef.Time,
		RemoveTime: (AssetDef.RemoveTime == null) ? ((AssetDef.Time == null) ? 0 : AssetDef.Time) : AssetDef.RemoveTime,
		RemoveTimer: (AssetDef.RemoveTimer == null) ? 0 : AssetDef.RemoveTimer,
		MaxTimer: (AssetDef.MaxTimer == null) ? 0 : AssetDef.MaxTimer,
		DrawingPriority: AssetDef.Priority,
		DrawingLeft: AssetParseTopLeft(AssetDef.Left, Group.DrawingLeft),
		DrawingTop: AssetParseTopLeft(AssetDef.Top, Group.DrawingTop),
		HeightModifier: (AssetDef.Height == null) ? 0 : AssetDef.Height,
		ZoomModifier: CommonClamp(AssetDef.Zoom ?? 1, 0.9, 1.0),
		Alpha: AssetParseAlpha(AssetDef.Alpha, "Asset.Alpha"),
		FullAlpha: AssetDef.FullAlpha == null ? true : AssetDef.FullAlpha,
		Prerequisite: (typeof AssetDef.Prerequisite === "string" ? [AssetDef.Prerequisite] : Array.isArray(AssetDef.Prerequisite) ? AssetDef.Prerequisite : []),
		Extended: (AssetDef.Extended == null) ? false : AssetDef.Extended,
		AlwaysExtend: (AssetDef.AlwaysExtend == null) ? false : AssetDef.AlwaysExtend,
		AlwaysInteract: (AssetDef.AlwaysInteract == null) ? false : AssetDef.AlwaysInteract,
		AllowLock: allowLock,
		LayerVisibility: (AssetDef.LayerVisibility == null) ? false : AssetDef.LayerVisibility,
		IsLock: (AssetDef.IsLock == null) ? false : AssetDef.IsLock,
		PickDifficulty: (AssetDef.PickDifficulty == null) ? 0 : AssetDef.PickDifficulty,
		OwnerOnly: (AssetDef.OwnerOnly == null) ? false : AssetDef.OwnerOnly,
		LoverOnly: (AssetDef.LoverOnly == null) ? false : AssetDef.LoverOnly,
		FamilyOnly: (AssetDef.FamilyOnly == null) ? false : AssetDef.FamilyOnly,
		ExpressionTrigger: AssetDef.ExpressionTrigger,
		RemoveItemOnRemove: (AssetDef.RemoveItemOnRemove == null) ? Group.RemoveItemOnRemove : Group.RemoveItemOnRemove.concat(AssetDef.RemoveItemOnRemove),
		AllowEffect: AssetDef.AllowEffect,
		AllowBlock: AssetDef.AllowBlock,
		AllowTighten: AssetDef.AllowTighten ?? (AssetDef.IsRestraint || difficulty > 0),
		AllowHide: AssetDef.AllowHide,
		AllowHideItem: AssetDef.AllowHideItem,
		DefaultColor: [],
		EditOpacity: editOpacity,
		Opacity: opacity,
		MinOpacity: minOpacity,
		MaxOpacity: maxOpacity,
		Audio: AssetDef.Audio,
		Category: AssetDef.Category,
		Fetish: AssetDef.Fetish,
		ArousalZone: typeof AssetDef.ArousalZone === "string" ? AssetDef.ArousalZone : (Group.ArousalZone ? Group.ArousalZone : /** @type {AssetGroupItemName} */ (Group.Name)),
		IsRestraint: (AssetDef.IsRestraint == null) ? ((Group.IsRestraint == null) ? false : Group.IsRestraint) : AssetDef.IsRestraint,
		BodyCosplay: (AssetDef.BodyCosplay == null) ? Group.BodyCosplay : AssetDef.BodyCosplay,
		OverrideBlinking: (AssetDef.OverrideBlinking == null) ? false : AssetDef.OverrideBlinking,
		DialogSortOverride: AssetDef.DialogSortOverride,
		// @ts-ignore: this has no type, because we are in JS file
		DynamicDescription: (typeof AssetDef.DynamicDescription === 'function') ? AssetDef.DynamicDescription : function () { return this.Description; },
		DynamicPreviewImage: (typeof AssetDef.DynamicPreviewImage === 'function') ? AssetDef.DynamicPreviewImage : function () { return ""; },
		DynamicAllowInventoryAdd: (typeof AssetDef.DynamicAllowInventoryAdd === 'function') ? AssetDef.DynamicAllowInventoryAdd : function () { return true; },
		// @ts-ignore: this has no type, because we are in JS file
		DynamicName: (typeof AssetDef.DynamicName === 'function') ? AssetDef.DynamicName : function () { return this.Name; },
		DynamicGroupName: (AssetDef.DynamicGroupName || Group.DynamicGroupName),
		DynamicActivity: (typeof AssetDef.DynamicActivity === 'function') ? AssetDef.DynamicActivity : function () { return AssetDef.Activity; },
		DynamicAudio: (typeof AssetDef.DynamicAudio === 'function') ? AssetDef.DynamicAudio : null,
		AllowRemoveExclusive: typeof AssetDef.AllowRemoveExclusive === 'boolean' ? AssetDef.AllowRemoveExclusive : false,
		InheritColor: AssetDef.InheritColor || Group.InheritColor,
		DynamicBeforeDraw: (typeof AssetDef.DynamicBeforeDraw === 'boolean') ? AssetDef.DynamicBeforeDraw : false,
		DynamicAfterDraw: (typeof AssetDef.DynamicAfterDraw === 'boolean') ? AssetDef.DynamicAfterDraw : false,
		DynamicScriptDraw: (typeof AssetDef.DynamicScriptDraw === 'boolean') ? AssetDef.DynamicScriptDraw : false,
		CreateLayerTypes: Array.isArray(AssetDef.CreateLayerTypes) ? AssetDef.CreateLayerTypes : [],
		AllowLockType: null,
		AvailableLocations: AssetDef.AvailableLocations || [],
		OverrideHeight: AssetDef.OverrideHeight,
		DrawLocks: allowLock && (typeof AssetDef.DrawLocks === "boolean" ? AssetDef.DrawLocks : true),
		AllowExpression: AssetDef.AllowExpression,
		MirrorExpression: AssetDef.MirrorExpression,
		FixedPosition: typeof AssetDef.FixedPosition === "boolean" ? AssetDef.FixedPosition : false,
		Layer: [],
		ColorableLayerCount: 0,
		CustomBlindBackground: typeof AssetDef.CustomBlindBackground === 'string' ? AssetDef.CustomBlindBackground : undefined,
		Attribute: AssetDef.Attribute || [],
		PreviewIcons: AssetDef.PreviewIcons || [],
		PoseMapping: AssetParsePoseMapping(AssetDef.PoseMapping, Group.PoseMapping, AssetDef.InheritPoseMappingFields),
		Tint: Array.isArray(AssetDef.Tint) ? AssetDef.Tint : [],
		AllowTint: Array.isArray(AssetDef.Tint) && AssetDef.Tint.length > 0,
		DefaultTint: typeof AssetDef.DefaultTint === "string" ? AssetDef.DefaultTint : undefined,
		Gender: AssetDef.Gender,
		CraftGroup: typeof AssetDef.CraftGroup === "string" ? AssetDef.CraftGroup : AssetDef.Name,
		ColorSuffix: AssetDef.ColorSuffix || Group.ColorSuffix,
		ExpressionPrerequisite: Array.isArray(AssetDef.ExpressionPrerequisite) ? AssetDef.ExpressionPrerequisite : Group.ExpressionPrerequisite,
		AllowColorize: typeof AssetDef.AllowColorize === "boolean" ? AssetDef.AllowColorize : Group.AllowColorize,
	};

	if (A.SetPose || A.AllowActivePose) {
		Object.assign(A, AssetParsePosePrerequisite(A));
	}

	const layers = AssetDef.Layer ? [...AssetDef.Layer] : [{}];
	if (A.DrawLocks) {
		layers.push({ Name: "Lock", LockLayer: true, AllowColorize: false, ParentGroup: {} });
	}
	A.Layer = layers.map((Layer, I) => {
		Layer.InheritPoseMappingFields ??= AssetDef.InheritPoseMappingFields;
		return AssetMapLayer(Layer, A, I);
	});
	A.Layer.forEach((layer, i) => {
		// Now that most layer pose mappings are initialized, handle all `Layer.CopyLayerPoseMapping` cases
		if (layer.PoseMapping) {
			return;
		}

		const layerDef = layers[i];
		const copiedLayer = A.Layer.find(l => l.Name === layerDef.CopyLayerPoseMapping);
		if (copiedLayer) {
			if (!copiedLayer.PoseMapping) {
				throw new Error(`${A.Group.Name}:${A.Name}:${layer.Name}: Trying to copy a null-valued pose mapping from layer "${copiedLayer.Name}"`);
			}
			/** @type {Mutable<AssetLayer>} */(layer).PoseMapping = AssetParsePoseMapping(
				layerDef.PoseMapping, copiedLayer.PoseMapping, layerDef.InheritPoseMappingFields,
			);
		}
	});

	AssetAssignColorIndices(A);
	A.DefaultColor = AssetParseDefaultColor(A.ColorableLayerCount, Group.DefaultColor, AssetDef.DefaultColor);

	// Unwearable assets are not visible but can be overwritten
	if (!A.Wear && AssetDef.Visible != true) A.Visible = false;
	/** @type {Asset[]} */(Group.Asset).push(A);
	AssetMap.set(`${Group.Name}/${A.Name}`, A);
	Asset.push(A);
	if (A.IsLock) {
		AssetLocks[/** @type {AssetLockType} */(A.Name)] = A;
	}

	// Initialize the extended item data of archetypical items
	if (ExtendedConfig) {
		const assetBaseConfig = AssetFindExtendedConfig(ExtendedConfig, A.Group.Name, A.Name);
		if (assetBaseConfig != null) {
			AssetBuildExtended(A, assetBaseConfig, ExtendedConfig);
		}
	}

	// Ensure that restraints do not have clothing-exclusive properties and vice versa
	switch (Group.Category) {
		case "Item":
			A.BodyCosplay = false;
			break;
		case "Appearance":
			A.AllowLock = false;
			A.AllowLockType = null;
			A.AllowRemoveExclusive = false;
			A.AllowTighten = false;
			A.AlwaysExtend = false;
			A.AlwaysInteract = false;
			A.CustomBlindBackground = undefined;
			A.Difficulty = 0;
			A.DrawLocks = false;
			A.ExclusiveUnlock = false;
			A.FamilyOnly = false;
			A.IsLock = false;
			A.IsRestraint = false;
			A.LoverOnly = false;
			A.MaxTimer = 0;
			A.OwnerOnly = false;
			A.PickDifficulty = 0;
			A.RemoveTime = 0;
			A.RemoveTimer = 0;
			A.SelfBondage = 0;
			A.SelfUnlock = true;
			A.WearTime = 0;
			break;
	}
}

/**
 * Automatically generated pose-related asset prerequisites
 * @param {Partial<Pick<Asset, "AllowActivePose" | "SetPose" | "Prerequisite" | "Effect">>} asset The asset or any other object with the expected asset interface subset
 * @returns {{ Prerequisite?: AssetPrerequisite[], AllowActivePose?: AssetPoseName[], SetPose?: AssetPoseName[] }} The newly generated prerequisites
 */
function AssetParsePosePrerequisite({ SetPose, AllowActivePose, Effect, Prerequisite }) {
	if (SetPose == null) {
		if (AllowActivePose?.length) {
			SetPose = AllowActivePose.slice(0, 1);
		} else {
			return {};
		}
	}

	const allowActivePose = CommonArrayConcatDedupe([...SetPose], AllowActivePose || []);
	const poseMapping = PoseToMapping.Array(allowActivePose);

	// Automatically add support for `BodyFull` poses, which are a bit weird in the sense that
	// they're sort of a combination of (hypothetical) `BodyUpper` and `BodyLower` poses
	if (
		(poseMapping.BodyUpper || poseMapping.BodyLower)
		&& (!poseMapping.BodyUpper || poseMapping.BodyUpper.includes("BackElbowTouch"))
		&& (!poseMapping.BodyLower || poseMapping.BodyLower.includes("Kneel"))
	) {
		// Add explicit Hogtied support if `Kneel` and/or `BackElbowTouch` are set
		CommonArrayConcatDedupe(allowActivePose, ["Hogtied"]);
	}
	if (
		!poseMapping.BodyUpper
		&& poseMapping.BodyLower
		&& poseMapping.BodyLower.includes("Kneel")
	) {
		// Add explicit AllFours support if `Kneel` is set and no `BodyUpper` poses are set
		CommonArrayConcatDedupe(allowActivePose, ["AllFours"]);
	}

	/** @type {AssetPrerequisite[]} */
	const posePrerequisite = SetPose.map(i => /** @type {const} */(`Can${i}`));
	if (PoseAllStanding.some(p => SetPose.includes(p)) && !allowActivePose.includes("Kneel")) {
		posePrerequisite.push("NotKneeling");
	}

	if (Effect && Effect.includes("Suspended")) {
		posePrerequisite.push("NotChained");
	}

	return {
		Prerequisite: CommonArrayConcatDedupe([...(Prerequisite || [])], posePrerequisite),
		AllowActivePose: allowActivePose,
		SetPose: [...SetPose],
	};
}

/**
 * @template T
 * @param config The config
 * @param superConfig The super config
 * @param key A human-readable identifier for `config`
 * @param superKey A human-readable identifier for `superConfig`
 * @returns `true` if the validation failed and `false` otherwise
 * @typedef {(config: T, superConfig: T, key: string, superKey: string) => boolean} AssetCopyConfigValidator
 */

/**
 * Namespace for resolving `CopyConfig` fields in (extended) asset configs.
 * @namespace
 */
var AssetResolveCopyConfig = {
	/**
	 * Take an (ordered) list of `CopyConfig`-referenced configs and group them all together in a `BuyGroup`.
	 * The buygroup's name will either be extracted from the configs if present, or alternatively use the `Name` of the top-most config.
	 * @param {readonly { BuyGroup?: string, Value?: number, Name?: string }[]} configList
	 */
	_AssignBuyGroup: function _AssignBuyGroup(configList) {
		const topIndex = configList.length - 1;
		const topConfig = configList[topIndex];

		// Check if a buygroup is already present in one of the super configs
		/** @type {number | undefined} */
		let stop = undefined;
		const buyGroup = configList.find((cfg, i) => {
			if (cfg.BuyGroup) {
				stop = Math.max(1, i);
				return true;
			} else {
				return false;
			}
		})?.BuyGroup ?? topConfig.Name;
		if (buyGroup == null) {
			// Only relevant if an extended config (instead of a normal one) somehow gets passed
			return;
		}

		configList.slice(0, stop).forEach((cfg, i) => {
			cfg.BuyGroup = buyGroup;
			if (i !== topIndex) {
				cfg.Value = -1;
			}
		});
	},

	/**
	 * Merge the passed config with all it's to-be copied super configs (per its `CopyConfig` settings)
	 * @template {{ CopyConfig?: { GroupName?: AssetGroupName, AssetName: string }, BuyGroup?: string, Value?: number, Name?: string }} T
	 * @param {T} config - The (extended) asset config
	 * @param {string} assetName - The name of the corresponding asset
	 * @param {AssetGroupName} groupName - The name of the corresponding asset group
	 * @param {Partial<Record<AssetGroupName, Record<string, T>>>} configRecord - A (nested) record containing the configs of all assets
	 * @param {string} configType - The name of the config type. Used for error reporting
	 * @param {null | AssetCopyConfigValidator<T>} configValidator - An optional validator for comparing the config with its to-be copied counterpart(s)
	 * @param {boolean} setBuyGroup - Whether to automatically assign a buygroup to the config and, if required, all `CopyConfig`-referenced super configs
	 * @returns {null | T} - The original config merged with its to-be copied super configs. Returns `null` if an error is encountered.
	 */
	_Resolve: function _Resolve(config, assetName, groupName, configRecord, configType, configValidator=null, setBuyGroup=false) {
		const key = `${groupName}:${assetName}`;
		const visitedKeys = new Set([key]);
		const visitedConfigs = [config];
		while (config.CopyConfig) {
			const { GroupName, AssetName } = config.CopyConfig;
			const superKey = `${GroupName ?? groupName}:${AssetName}`;

			if (visitedKeys.has(superKey)) {
				console.error(`Found cyclic ${configType} CopyConfig reference ${superKey} in ${key}:`, visitedKeys);
				return null;
			}

			const superConfig = configRecord[GroupName ?? groupName]?.[AssetName];
			if (!superConfig) {
				console.error(`${superKey} ${configType} CopyConfig not found for ${key}`);
				return null;
			} else if (configValidator?.(config, superConfig, key, superKey)) {
				return null;
			} else {
				visitedKeys.add(superKey);
				visitedConfigs.push(superConfig);
			}

			config = {
				...superConfig,
				...CommonOmit(config, ["CopyConfig"]),
			};
		}

		if (setBuyGroup) {
			visitedConfigs[0] = config;
			AssetResolveCopyConfig._AssignBuyGroup(visitedConfigs);
		}

		return config;
	},

	/**
	 * Validator for extended item configs
	 * @type {AssetCopyConfigValidator<AssetArchetypeConfig>}
	 */
	_ExtendedValidator: function _ExtendedValidator(config, superConfig, key, superKey) {
		if (config.Archetype !== superConfig.Archetype) {
			console.error(`Archetype for ${superKey} (${superConfig.Archetype}) doesn't match archetype for ${key} (${config.Archetype})`);
			return true;
		} else {
			return false;
		}
	},

	/**
	 * Construct the items asset config, merging via {@link AssetDefinition.CopyConfig} if required.
	 * @param {AssetDefinition} assetDef - The asset definition
	 * @param {AssetGroupName} groupName - The name of the asset group
	 * @param {Partial<Record<AssetGroupName, Record<string, AssetDefinition>>>} assetRecord - A record containg all asset definitions
	 * @returns {null | AssetDefinition} - The oiginally passed base item configuration.
	 * Returns `null` insstead if an error was encountered.
	 */
	AssetDefinition: function AssetDefinition(assetDef, groupName, assetRecord) {
		return AssetResolveCopyConfig._Resolve(
			assetDef, assetDef.Name, groupName, assetRecord,
			"AssetDefinition", undefined, assetDef.CopyConfig?.BuyGroup,
		);
	},

	/**
	 * Construct the items extended item config, merging via {@link AssetArchetypeConfig.CopyConfig} if required.
	 * @param {Asset} asset - The asset to configure
	 * @param {AssetArchetypeConfig} config - The extended item configuration of the base item
	 * @param {ExtendedItemMainConfig} extendedConfig - The extended item configuration object for the asset's family
	 * @returns {null | AssetArchetypeConfig} - The oiginally passed base item configuration.
	 * Returns `null` instead if an error was encountered.
	 */
	ExtendedItemConfig: function ExtendedItemConfig(asset, config, extendedConfig) {
		return AssetResolveCopyConfig._Resolve(
			config, asset.Name, asset.Group.Name, extendedConfig, "ExtendedItemConfig",
			AssetResolveCopyConfig._ExtendedValidator,
		);
	},
};

/**
 * Constructs extended item functions for an asset, if extended item configuration exists for the asset.
 * Updates the passed config inplace if {@link ExtendedItem.CopyConfig} is present.
 * @param {Asset} A - The asset to configure
 * @param {AssetArchetypeConfig} baseConfig - The extended item configuration of the base item
 * @param {ExtendedItemMainConfig} extendedConfig - The extended item configuration object for the asset's family
 * @param {null | ExtendedItemOption} parentOption
 * @param {boolean} createCallbacks
 * @returns {null | AssetArchetypeData} - The extended itemdata or `null` if an error was encoutered
 */
function AssetBuildExtended(A, baseConfig, extendedConfig, parentOption=null, createCallbacks=true) {
	const config = AssetResolveCopyConfig.ExtendedItemConfig(A, baseConfig, extendedConfig);
	if (config === null) {
		return null;
	}

	/** @type {null | AssetArchetypeData} */
	let data = null;
	switch (config.Archetype) {
		case ExtendedArchetype.MODULAR:
			data = ModularItemRegister(A, config);
			break;
		case ExtendedArchetype.TYPED:
			data = TypedItemRegister(A, config);
			break;
		case ExtendedArchetype.VIBRATING:
			data = VibratorModeRegister(A, config, parentOption);
			break;
		case ExtendedArchetype.VARIABLEHEIGHT:
			data = VariableHeightRegister(A, config, parentOption);
			break;
		case ExtendedArchetype.TEXT:
			data = TextItemRegister(A, config, parentOption, createCallbacks);
			break;
		case ExtendedArchetype.NOARCH:
			data = NoArchItemRegister(A, config, parentOption);
			break;
	}

	if (!A.Archetype && parentOption == null) {
		/** @type {Mutable<Asset>} */(A).Archetype = config.Archetype;
	}
	return data;
}

/**
 * Finds the extended item configuration for the provided group and asset name, if any exists
 * @param {ExtendedItemMainConfig} ExtendedConfig - The full extended item configuration object
 * @param {AssetGroupName} GroupName - The name of the asset group to find extended configuration for
 * @param {string} AssetName - The name of the asset to find extended configuration fo
 * @returns {AssetArchetypeConfig | undefined} - The extended asset configuration object for the specified asset, if
 * any exists, or undefined otherwise
 */
function AssetFindExtendedConfig(ExtendedConfig, GroupName, AssetName) {
	const GroupConfig = ExtendedConfig[GroupName] || {};
	return GroupConfig[AssetName];
}

/**
 * Maps a layer definition to a drawable layer object
 * @param {AssetLayerDefinition} Layer - The raw layer definition
 * @param {Asset} A - The built asset
 * @param {number} I - The index of the layer within the asset
 * @return {AssetLayer} - A Layer object representing the drawable properties of the given layer
 */
function AssetMapLayer(Layer, A, I) {
	const editOpacity = A.EditOpacity;
	const minOpacity = editOpacity ? AssetParseOpacity(Layer.MinOpacity ?? A.MinOpacity, 0, 1) : 1;
	const maxOpacity = editOpacity ? AssetParseOpacity(Layer.MaxOpacity ?? A.MaxOpacity, 0, 1) : 1;
	const opacity = AssetParseOpacity(Layer.Opacity ?? A.Opacity, minOpacity, maxOpacity);

	/** @type {AssetLayer} */
	const L = {
		Name: Layer.Name || null,
		AllowColorize: !Layer.TextureMask && (typeof Layer.AllowColorize === "boolean" ? Layer.AllowColorize : A.AllowColorize),
		CopyLayerColor: typeof Layer.CopyLayerColor === "string" ? Layer.CopyLayerColor : null,
		ColorGroup: typeof Layer.ColorGroup === "string" ? Layer.ColorGroup : null,
		HideColoring: typeof Layer.HideColoring === "boolean" ? Layer.HideColoring : false,
		AllowTypes: Layer.AllowTypes != null ? AssetParseAllowTypes(Layer.AllowTypes) : null,
		CreateLayerTypes: Array.isArray(Layer.CreateLayerTypes) ? Layer.CreateLayerTypes : A.CreateLayerTypes,
		Visibility: typeof Layer.Visibility === "string" ? Layer.Visibility : null,
		ParentGroup: AssetParseParentGroup(Layer.ParentGroup, A.ParentGroup),
		Priority: Layer.Priority || A.DrawingPriority || A.Group.DrawingPriority,
		InheritColor: typeof Layer.InheritColor === "string" ? Layer.InheritColor : A.InheritColor,
		Alpha: AssetParseLayerAlpha(Layer, A, I),
		Asset: A,
		DrawingLeft: AssetParseTopLeft(Layer.Left, A.DrawingLeft),
		DrawingTop: AssetParseTopLeft(Layer.Top, A.DrawingTop),
		HideAs: Layer.HideAs,
		FixedPosition: typeof Layer.FixedPosition === "boolean" ? Layer.FixedPosition : false,
		HasImage: Layer.HasImage ?? A.Visible,
		Opacity: opacity,
		MinOpacity: minOpacity,
		MaxOpacity: maxOpacity,
		BlendingMode: Layer.BlendingMode || "source-over",
		TextureMask: Layer.TextureMask,
		LockLayer: typeof Layer.LockLayer === "boolean" ? Layer.LockLayer : false,
		MirrorExpression: Layer.MirrorExpression,
		ColorIndex: 0,
		StyleOverride: Layer.StyleOverride ?? A.StyleOverride,
		CreateLayerTypesOverride: Layer.CreateLayerTypesOverride ?? A.CreateLayerTypesOverride,
		// If `null`, initialized in the second asset layer loop in `AssetAdd()`
		PoseMapping: Layer.CopyLayerPoseMapping != null ? /** @type {never} */(null) : AssetParsePoseMapping(Layer.PoseMapping, A.PoseMapping, Layer.InheritPoseMappingFields),
		HideForAttribute: Array.isArray(Layer.HideForAttribute) ? Layer.HideForAttribute : null,
		ShowForAttribute: Array.isArray(Layer.ShowForAttribute) ? Layer.ShowForAttribute : null,
		ColorSuffix: Layer.ColorSuffix || A.ColorSuffix,
	};
	return L;
}

/**
 *
 * @param {null | undefined | AssetPoseMapping} poseMapping
 * @param {AssetPoseMapping} superPoseMapping
 * @param {boolean} inheritFields
 * @returns {AssetPoseMapping}
 */
function AssetParsePoseMapping(poseMapping, superPoseMapping, inheritFields=false) {
	if (inheritFields) {
		return { ...superPoseMapping, ...(poseMapping ?? {}) };
	} else {
		return poseMapping ?? { ...superPoseMapping };
	}
}

/**
 * @param {AllowTypes.Definition} allowTypes
 * @returns {AllowTypes.Data}
 */
function AssetParseAllowTypes(allowTypes) {
	/** @type {{ [k in keyof AllowTypes.Data]: Mutable<AllowTypes.Data[k]> }} */
	const ret = {
		TypeToID: {},
		IDToTypeKey: {},
		AllTypes: {},
	};
	if (!CommonIsArray(allowTypes)) {
		allowTypes = [allowTypes];
	}

	for (const [id, typeRecord] of CommonEnumerate(allowTypes)) {
		for (let [name, indices] of Object.entries(typeRecord)) {
			if (!CommonIsArray(indices)) {
				indices = [indices];
			}

			for (const i of indices) {
				/** @type {PartialType} */
				const key = `${name}${i}`;

				const typeToIDSet = ret.TypeToID[key];
				if (typeToIDSet) {
					typeToIDSet.add(id);
				} else {
					ret.TypeToID[key] = new Set([id]);
				}

				const allTypesSet = ret.AllTypes[name];
				if (allTypesSet) {
					allTypesSet.add(i);
				} else {
					ret.AllTypes[name] = new Set([i]);
				}
			}

			const idToTypeList = ret.IDToTypeKey[id];
			if (idToTypeList) {
				/** @type {Mutable<idToTypeList>} */(idToTypeList).push(name);
			} else {
				ret.IDToTypeKey[id] = [name];
			}
		}
	}
	return ret;
}

/**
 * Parse the passed {@link AssetDefinition.ParentGroup}.
 * @param {AssetDefinition["ParentGroup"]} parentGroup - The to-be parsed parent group value
 * @param {ParentGroup.Data} superParentGroup - The parsed parent group value of the layer's/asset's super-asset/group
 * @returns {ParentGroup.Data} - The parsed parent group value
 */
function AssetParseParentGroup(parentGroup, superParentGroup) {
	if (parentGroup === undefined) {
		return superParentGroup;
	} else if (typeof parentGroup === "string" && parentGroup === "") {
		return {};
	} else if (typeof parentGroup === "string") {
		return { [PoseType.DEFAULT]: parentGroup };
	} else {
		return parentGroup;
	}
}

/**
 * Parses and validates asset's opacity
 * @param {number|undefined} opacity
 * @param {number} min - The minimum opacity
 * @param {number} max - The maximum opacity
 * @returns {number}
 */
function AssetParseOpacity(opacity, min=0, max=1) {
	if (CommonIsNumeric(opacity)) {
		return CommonClamp(opacity, min, max);
	}
	return max;
}

/**
 * Parse the passed alpha mask definitions.
 * @param {undefined | Alpha.Definition[]} alphaDef The unparsed alpha mask definition
 * @param {null | string} warningPrefix - A prefix to-be prepended to any warning messages
 * @returns {null | Alpha.Data[]} The parsed alpha mask data
 */
function AssetParseAlpha(alphaDef, warningPrefix=null) {
	return (alphaDef == null) ? null : alphaDef.map(a => {
		/** @type {Mutable<Alpha.Data>} */
		const data = {
			...a,
			Pose: a.Pose ? PoseToMapping.Array(a.Pose, warningPrefix) : null,
			AllowTypes: a.AllowTypes ? AssetParseAllowTypes(a.AllowTypes) : null,
		};
		return data;
	});
}

/**
 * Parse the passed layers alpha mask definitions.
 * @param {AssetLayerDefinition} Layer - The raw layer definition
 * @param {Asset} NewAsset - The raw asset definition
 * @param {number} I - The index of the layer within its asset
 * @return {Alpha.Data[]} - a list of alpha mask data for the layer
 */
function AssetParseLayerAlpha(Layer, NewAsset, I) {
	const Alpha = AssetParseAlpha(Layer.Alpha, "Layer.Alpha") || [];
	// If the layer is the first layer for an asset, add the asset's alpha masks
	if (I === 0 && NewAsset.Alpha) {
		Alpha.push(...NewAsset.Alpha);
	}
	return Alpha;
}

/**
 * Assigns color indices to the layers of an asset. These determine which colors get applied to the layer. Also adds
 * a count of colorable layers to the asset definition.
 * @param {Mutable<Asset>} A - The built asset
 * @returns {void} - Nothing
 */
function AssetAssignColorIndices(A) {
	var colorIndex = 0;
	/** @type {Record<string, number>} */
	var colorMap = {};
	A.Layer.forEach(Layer => {
		// If the layer can't be colored, we don't need to set a color index
		if (!Layer.AllowColorize) return;

		var LayerKey = Layer.CopyLayerColor || Layer.Name;
		if (LayerKey === undefined)
			LayerKey = "undefined";
		if (LayerKey === null)
			LayerKey = "null";

		if (typeof colorMap[LayerKey] !== "number") {
			colorMap[LayerKey] = colorIndex;
			colorIndex++;
		}
		/** @type {Mutable<AssetLayer>} */(Layer).ColorIndex = colorMap[LayerKey];
	});
	A.ColorableLayerCount = colorIndex;
}

/**
 * Builds the asset description from the CSV file
 * @param {IAssetFamily} Family
 * @param {string[][]} CSV
 */
function AssetBuildDescription(Family, CSV) {

	/** @type {Map<string, string>} */
	const map = new Map();

	for (const line of CSV) {
		if (Array.isArray(line) && line.length === 3) {
			if (map.has(`${line[0]}:${line[1]}`)) {
				console.warn("Duplicate Asset Description: ", line);
			}
			map.set(`${line[0]}:${line[1]}`, line[2].trim());
		} else {
			console.warn("Bad Asset Description line: ", line);
		}
	}

	// For each asset group in family
	for (const G of AssetGroup) {
		if (G.Family !== Family)
			continue;

		const res = map.get(`${G.Name}:`);
		/** @type {Mutable<AssetGroup>} */(G).Description = (res !== undefined) ? res : `MISSING ASSETGROUP DESCRIPTION: ${G.Name}`;
	}

	// For each asset in the family
	for (const A of Asset) {
		if (A.Group.Family !== Family)
			continue;

		const res = map.get(`${A.DynamicGroupName}:${A.Name}`);
		/** @type {Mutable<Asset>} */(A).Description = (res !== undefined) ? res : `MISSING ASSET DESCRIPTION: ${A.DynamicGroupName}:${A.Name}`;
	}

	// Translates the descriptions to a foreign language
	TranslationAsset(Family);

}

/**
 * Loads the description of the assets in a specific language
 * @param {IAssetFamily} Family The asset family to load the description for
 */
async function AssetLoadDescription(Family) {
	// Finds the full path of the CSV file to use cache
	const path = "Assets/" + Family + "/" + Family + ".csv";
	if (!CommonCSVCache[path]) {
		const response = await CommonFetch(path);
		if (response.status !== 200) {
			console.error(`Failed to load asset descriptions`);
		} else {
			const data = await response.text();
			CommonCSVCache[path] = CommonParseCSV(data);
		}
	}
	AssetBuildDescription(Family, CommonCSVCache[path]);
}

/**
 * Loads a specific asset file
 * @param {readonly AssetGroupDefinition[]} Groups
 * @param {IAssetFamily} Family
 * @param {ExtendedItemMainConfig} ExtendedConfig
 */
function AssetLoad(Groups, Family, ExtendedConfig) {
	/**
	 * Pass one: Resolve all string-based asset definitions and convert the entire thing into a
	 * nested record mapping group names, to asset names, to asset definitions.
	 * @type {Record<AssetGroupName, Record<string, AssetDefinition>>}
	 */
	const assetDefsParsed = CommonFromEntries(Groups.map(g => {
		return [
			g.Group,
			CommonFromEntries(g.Asset.map(a => {
				/** @type {[name: string, config: AssetDefinition]} */
				const ret = typeof a === "string" ? [a, { Name: a }] : [a.Name, a];
				return ret;
			})),
		];
	}));

	// Pass two: handle all copy configs
	for (const [groupName, assetDefs] of CommonEntries(assetDefsParsed)) {
		for (const [assetName, assetDef] of Object.entries(assetDefs)) {
			const assetDefNew = AssetResolveCopyConfig.AssetDefinition(assetDef, groupName, assetDefsParsed);
			if (assetDefNew == null) {
				delete assetDefs[assetName];
			} else {
				assetDefs[assetName] = assetDefNew;
			}
		}
	}

	// Pass three: finally parse the asset/group defs
	for (const groupDef of Groups) {
		const G = AssetGroupAdd(Family, groupDef);
		for (const assetDef of Object.values(assetDefsParsed[G.Name])) {
			AssetAdd(G, assetDef, ExtendedConfig);
		}
	}

	AssetLoadDescription(Family);
}

// Reset and load all the assets
function AssetLoadAll() {
	Asset = [];
	AssetGroup = [];
	Pose = PoseFemale3DCG;
	Pose.forEach(p => PoseRecord[p.Name] = p);
	AssetLoad(AssetFemale3DCG, "Female3DCG", AssetFemale3DCGExtended);
	CraftingAssets = CraftingAssetsPopulate();
	ExtendedItemManualRegister();
	PropertyAutoPunishHandled = new Set(AssetGroup.map((a) => a.Name));
	Shop2._PopulateBuyGroups();
	Shop2._PopulateKeysAndRemotes();
	AssetLoadCheckActivities();
	PreferenceArousalUpdateValidation();
}

/**
 * Gets a specific asset by family/group/name
 * @param {IAssetFamily} Family - The family to search in (Ignored until other family is added)
 * @param {AssetGroupName} Group - Name of the group of the searched asset
 * @param {string} Name - Name of the searched asset
 * @returns {Asset | null}
 */
function AssetGet(Family, Group, Name) {
	return AssetMap.get(`${Group}/${Name}`) ?? null;
}

/**
 * Gets all activities on a family and name
 * @param {IAssetFamily} family - The family to search in
 * @returns {Activity[]}
 */
function AssetAllActivities(family) {
	if (family == "Female3DCG")
		return ActivityFemale3DCG;
	return [];
}

/**
 * Gets an activity asset by family and name
 * @param {IAssetFamily} family - The family to search in
 * @param {string} name - Name of activity to search for
 * @returns {Activity|null}
 */
function AssetGetActivity(family, name) {
	return AssetAllActivities(family).find(a => (a.Name === name)) ?? null;
}

/**
 * Get the list of all activities on a group for a given family.
 *
 * @description Note that this just returns activities as defined, no checks are
 * actually done on whether the activity makes sense.
 *
 * @param {IAssetFamily} family
 * @param {AssetGroupName} groupname
 * @param {"self" | "other" | "any"} onSelf
 * @returns {Activity[]}
 */
function AssetActivitiesForGroup(family, groupname, onSelf = "other") {
	const activities = AssetAllActivities(family);
	/** @type {Activity[]} */
	const defined = [];
	activities.forEach(a => {
		/** @type {string[] | undefined} */
		let targets;
		// Get the correct target list
		if (onSelf === "self") {
			targets = (typeof a.TargetSelf === "boolean" ? a.Target : a.TargetSelf);
		} else if (onSelf === "any") {
			targets = a.Target;
			if (Array.isArray(a.TargetSelf))
				targets = targets.concat(a.TargetSelf);
		} else {
			targets = a.Target;
		}
		if (targets && targets.includes(groupname))
			defined.push(a);
	});
	return defined;
}

/**
 * Gets all fetishes for a family
 * @param {IAssetFamily} family - The family to search in
 * @returns {Fetish[]}
 */
function AssetAllFetishes(family) {
	if (family == "Female3DCG")
		return FetishFemale3DCG;
	return [];
}

/**
 * Gets an activity asset by family and name
 * @param {IAssetFamily} family - The family to search in
 * @param {FetishName} name - Name of fetish to search for
 * @returns {Fetish|null}
 */
function AssetGetFetish(family, name) {
	return AssetAllFetishes(family).find(a => (a.Name === name)) ?? null;
}

/**
 * Gets an asset group by the asset family name and group name
 * @template {AssetGroupName} T
 * @param {IAssetFamily} Family - The asset family that the group belongs to (Ignored until other family is added)
 * @param {T} Group - The name of the asset group to find
 * @returns {AssetGroupMapping[T] | null} - The asset group matching the provided family and group name
 */
function AssetGroupGet(Family, Group) {
	return /** @type {AssetGroupMapping[T]} */(AssetGroupMap.get(Group)) ?? null;
}

/**
 * Check whether a group can be hidden through the item visibility settings
 * @param {AssetGroup} group
 */
function AssetGroupIsHideable(group) {
	return group.IsItem() || group.IsAppearance() && group.AllowNone;
}

/**
 * Utility function for retrieving the preview image directory path for an asset
 * @param {Asset} A - The asset whose preview path to retrieve
 * @returns {string} - The path to the asset's preview image directory
 */
function AssetGetPreviewPath(A) {
	return `Assets/${A.Group.Family}/${A.DynamicGroupName}/Preview`;
}

/**
 * Utility function for retrieving the base path of an asset's inventory directory, where extended item scripts are
 * held
 * @param {Asset} A - The asset whose inventory path to retrieve
 * @returns {string} - The path to the asset's inventory directory
 */
function AssetGetInventoryPath(A) {
	return `Screens/Inventory/${A.DynamicGroupName}/${A.Name}`;
}

/**
 * Sort a list of asset layers for the {@link Character.AppearanceLayers } property.
 * Performs an inplace update of the passed array and then returns it.
 * @param {AssetLayer[]} layers - The to-be sorted asset layers
 * @returns {AssetLayer[]} - The newly sorted asset layers
 */
function AssetLayerSort(layers) {
	return layers.sort((l1, l2) => {
		// If priorities are different, sort by priority
		if (l1.Priority !== l2.Priority) return l1.Priority - l2.Priority;
		// If the priorities are identical and the layers belong to the same Asset, ensure layer order is preserved
		if (l1.Asset === l2.Asset) return l1.Asset.Layer.indexOf(l1) - l1.Asset.Layer.indexOf(l2);
		// If priorities are identical, first try to sort by group name
		if (l1.Asset.Group !== l2.Asset.Group) return l1.Asset.Group.Name.localeCompare(l2.Asset.Group.Name);
		// If the groups are identical, then sort by asset name - this shouldn't actually be possible unless you've
		// somehow equipped two different assets from the same group, but use it as an if-the-unexpected-happens
		// fallback.
		return l1.Asset.Name.localeCompare(l2.Asset.Name);
	});
}

/**
 * Convert {@link AssetDefinition} default color into a {@link Asset} default color list
 * @param {number} colorableLayerCount The number of colorable layers
 * @param {BCColor} fillValue The default color. Usually `"Default"` though skin colors can also be supplied on occasion.
 * @param {BCColor | readonly BCColor[]} [color] See {@link AssetDefinition.DefaultColor}
 * @returns {BCColor[]} See {@link Asset.DefaultColor}
 */
function AssetParseDefaultColor(colorableLayerCount, fillValue, color) {
	/** @type {BCColor[]} */
	const defaultColor = Array(colorableLayerCount).fill(fillValue);
	if (typeof color === "string") {
		defaultColor.fill(color);
	} else if (CommonIsArray(color)) {
		color.slice(0, colorableLayerCount).forEach((c, i) => defaultColor[i] = c);
	}
	return defaultColor;
}

const AssetStringsPath = "Assets/Female3DCG/AssetStrings.csv";

/**
 * Get the translated string for an asset-specific message
 * @param {string} msg
 * @returns {string}
 */
function AssetTextGet(msg) {
	const repo = TextAllScreenCache.get(AssetStringsPath);
	if (!repo) return "";
	return repo.get(msg);
}

/**
 * Validates that the InventoryID is setup properly in the Female3DCG assets
 * Launched each time the game is started for assets maker to apply corrections
 * Outputs all possible errors in the console log, it runs aynscronious
 */
async function AssetInventoryIDValidate() {

	// Skips these validations in production environments
	let URL = window.location.href.toLowerCase();
	if (URL.includes("bondageprojects.elementfx.com")) return;
	if (URL.includes("bondageprojects.com")) return;
	if (URL.includes("bondage-europe.com")) return;

	const allAssets = AssetFemale3DCG.reduce((assets, group) => {
		const objAssets = /** @type {AssetDefinition[]} */ (group.Asset.filter(a => CommonIsObject(a)));
		return assets.concat(objAssets);
	}, /** @type {(AssetDefinition)[]} */ ([]));

	const realLastID = Math.max(...allAssets.map(a => a.InventoryID ?? 0 ));
	let lastId = realLastID;

	/** @type {Map<string, AssetDefinition[]>} */
	const buyGroups = new Map();
	/** @type {AssetDefinition[][]} */
	// A bit cursed; this is a sparse array because we want to track the holes
	const inventoryIDs = [];
	for (const A of allAssets) {
		const isFreeOrUnbuyableAsset = (A.Value == null || A.Value === 0 || A.Enable === false);

		if (A.InventoryID && isFreeOrUnbuyableAsset) {
			console.warn(`Unnecessary InventoryID on asset "${A.Name}", remove it`);
		} else if (!A.InventoryID && !isFreeOrUnbuyableAsset && !A.BuyGroup && A.Value !== -1 && !A.RemoveAtLogin) {
			// Additional checks are for scenario-only items
			lastId++;
			console.warn(`Missing InventoryID on asset "${A.Name}", suggesting ${lastId}`);
		}

		// Warn for all Inventory IDs that are duplicated out of a buy group
		if (A.BuyGroup && !isFreeOrUnbuyableAsset) {
			const buyAssets = buyGroups.get(A.BuyGroup) ?? [];
			let match;
			if ((match = buyAssets.find(asset => asset.InventoryID !== A.InventoryID))) {
				lastId++;
				console.warn(`InventoryID should be the same within BuyGroup ${A.BuyGroup}, ${A.Name} (${A.InventoryID}) is different: ${match.Name} (${match.InventoryID}), suggesting ${lastId}`);
			} else if ((match = allAssets.find(asset => asset.InventoryID === A.InventoryID && asset.BuyGroup !== A.BuyGroup))) {
				console.warn(`InventoryID matching without being in the same BuyGroup ${A.BuyGroup}, ${A.Name} (${A.InventoryID}) is different: ${match.Name} (${match.InventoryID})`);
			}
			buyAssets.push(A);
			buyGroups.set(A.BuyGroup, buyAssets);
		}

		// Warn for all Inventory ID conflicts between buy groups
		if (A.InventoryID && !isFreeOrUnbuyableAsset) {
			const inventoryAssets = inventoryIDs[A.InventoryID] ?? [];
			let match;
			// Find matches with different names that either have no buygroup or aren't part of the same buygroup
			if ((match = inventoryAssets.find(asset => (!asset.BuyGroup || !A.BuyGroup || asset.BuyGroup !== A.BuyGroup) && asset.Name !== A.Name))) {
				lastId++;
				console.warn(`InventoryID should be different between different BuyGroups: asset "${A.Name}", buyGroup: ${A.BuyGroup}, ID ${A.InventoryID}, doesn't match: "${match.Name}", buyGroup: ${match.BuyGroup}, ID: ${match.InventoryID}, suggesting ${lastId}`);
			}
			inventoryAssets.push(A);
			inventoryIDs[A.InventoryID] = inventoryAssets;
		}
	}
	const debugHoles = false;
	if (debugHoles) {
		/** @type {Set<number>} */
		const holes = new Set();
		for (let index = 100; index < inventoryIDs.length; index++) {
			if (!inventoryIDs[index]) holes.add(index);
		}
		console.warn(`Known holes in InventoryIDs: ${[...holes.values()]}`);
	}
}

function AssetLoadCheckActivities() {
	/** @type {Map<number, string[]>} */
	const ids = new Map();
	let report = false;
	for (const act of ActivityFemale3DCG) {
		const dup = ids.get(act.ActivityID);
		if (dup) {
			console.warn(`Activity ${act.Name} has the same ID as ${dup}!`);
			dup.push(act.Name);
			report = true;
		} else {
			ids.set(act.ActivityID, [act.Name]);
		}
	}
	if (report) {
		console.info(`Next available activity ID is ${Math.max(...ids.keys()) + 1}`);
	}
}

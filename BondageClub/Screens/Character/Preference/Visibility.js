// @ts-strict-ignore
"use strict";

/** @type {{ Group: AssetGroup, Assets: { Asset: Asset, Hidden: boolean, Blocked: boolean, Limited: boolean}[]}[]} */
var PreferenceVisibilityGroupList = [];
var PreferenceVisibilityGroupIndex = 0;
var PreferenceVisibilityAssetIndex = 0;
var PreferenceVisibilityHideChecked = false;
var PreferenceVisibilityBlockChecked = false;
var PreferenceVisibilityCanBlock = true;
/** @type {null | Asset} */
var PreferenceVisibilityPreviewAsset = null;
var PreferenceVisibilityResetClicked = false;
/** @type {Partial<Record<`${AssetGroupName}/${string}`, ItemPermissions>>} */
var PreferenceVisibilityRecord = {};

/**
 * Handles the loading of the visibility settings of a player
 * @returns {void} - Nothing
 */
function PreferenceSubscreenVisibilityLoad() {
	ElementWrap(PreferenceIDs.exit).hidden = true;
	PreferenceVisibilityRecord = { ...Player.PermissionItems };
	PreferenceVisibilityGroupList = [];
	const hideableGroups = AssetGroup.filter(g => AssetGroupIsHideable(g));
	for (const group of hideableGroups) {
		const hideableAssets = [];
		for (const asset of group.Asset) {
			if (!asset.Visible) continue;
			hideableAssets.push({
				Asset: asset,
				Hidden: CharacterAppearanceItemIsHidden(asset.Name, group.Name),
				Blocked: InventoryIsPermissionBlocked(Player, asset.Name, group.Name),
				Limited: InventoryIsPermissionLimited(Player, asset.Name, group.Name),
			});
		}
		if (hideableAssets.length > 0) {
			PreferenceVisibilityGroupList.push({
				Group: group,
				Assets: hideableAssets.sort((a, b) =>
					a.Asset.Description.localeCompare(b.Asset.Description))
			});
		}
	}
	PreferenceVisibilityGroupList.sort((a, b) =>
		a.Group.Category.localeCompare(b.Group.Category) || a.Group.Description.localeCompare(b.Group.Description)
	);
	PreferenceVisibilityAssetChanged(true);
}

/**
 * Sets the item visibility preferences for a player. Redirected to from the main Run function if the player is in the
 * visibility settings subscreen
 * @returns {void} - Nothing
 */
function PreferenceSubscreenVisibilityRun() {

	// Character and exit buttons
	DrawCharacter(Player, 50, 50, 0.9);
	DrawButton(1720, 60, 90, 90, "", "White", "Icons/Accept.png", TextGet("LeaveSave"));
	DrawButton(1820, 60, 90, 90, "", "White", "Icons/Cancel.png", TextGet("LeaveNoSave"));
	MainCanvas.textAlign = "left";

	// Not available in Extreme mode
	if (Player.GetDifficulty() <= 2) {

		// Left-aligned text controls
		DrawText(TextGet("VisibilityGroup"), 500, 225, "Black", "Gray");
		DrawText(TextGet("VisibilityAsset"), 500, 304, "Black", "Gray");
		DrawCheckbox(500, 352, 64, 64, TextGet("VisibilityCheckboxHide"), PreferenceVisibilityHideChecked);
		DrawCheckbox(500, 432, 64, 64, TextGet("VisibilityCheckboxBlock"), PreferenceVisibilityBlockChecked, !PreferenceVisibilityCanBlock);
		if (PreferenceVisibilityHideChecked) {
			DrawImageResize("Screens/Character/Player/HiddenItem.png", 500, 516, 86, 86);
			DrawText(TextGet("VisibilityWarning"), 600, 548, "Black", "Gray");
		}
		if (PreferenceVisibilityResetClicked) DrawText(TextGet("VisibilityResetDescription"), 500, 732, "Black", "Gray");
		MainCanvas.textAlign = "center";

		// Buttons
		DrawBackNextButton(650, 193, 500, 64, PreferenceVisibilityGroupList[PreferenceVisibilityGroupIndex].Group.Description, "White", "", () => "", () => "");
		DrawBackNextButton(650, 272, 500, 64, PreferenceVisibilityGroupList[PreferenceVisibilityGroupIndex].Assets[PreferenceVisibilityAssetIndex].Asset.Description, "White", "", () => "", () => "");
		DrawButton(500, PreferenceVisibilityResetClicked ? 780 : 700, 300, 64, TextGet("VisibilityReset"), "White", "");

		// Preview icon
		if (PreferenceVisibilityHideChecked) DrawPreviewBox(1200, 193, "Icons/HiddenItem.png", "", { Border: true });

		else DrawAssetPreview(1200, 193, PreferenceVisibilityPreviewAsset, {Description: "", Border: true});
	} else {
		MainCanvas.textAlign = "center";
		DrawText(TextGet("VisibilityLocked"), 1200, 500, "Red", "Gray");
	}

}

/**
 * Handles the click events for the visibility settings of a player.  Redirected from the main Click function.
 * @returns {void} - Nothing
 */
function PreferenceSubscreenVisibilityClick() {

	// Most controls are not available in Extreme mode
	if (Player.GetDifficulty() <= 2) {

		// Group button
		if (MouseIn(650, 193, 500, 64)) {
			if (MouseX >= 900) {
				PreferenceVisibilityGroupIndex++;
				if (PreferenceVisibilityGroupIndex >= PreferenceVisibilityGroupList.length) PreferenceVisibilityGroupIndex = 0;
			}
			else {
				PreferenceVisibilityGroupIndex--;
				if (PreferenceVisibilityGroupIndex < 0) PreferenceVisibilityGroupIndex = PreferenceVisibilityGroupList.length - 1;
			}
			PreferenceVisibilityAssetIndex = 0;
			PreferenceVisibilityAssetChanged(true);
		}

		// Asset button
		if (MouseIn(650, 272, 500, 64)) {
			if (MouseX >= 900) {
				PreferenceVisibilityAssetIndex++;
				if (PreferenceVisibilityAssetIndex >= PreferenceVisibilityGroupList[PreferenceVisibilityGroupIndex].Assets.length) PreferenceVisibilityAssetIndex = 0;
			}
			else {
				PreferenceVisibilityAssetIndex--;
				if (PreferenceVisibilityAssetIndex < 0) PreferenceVisibilityAssetIndex = PreferenceVisibilityGroupList[PreferenceVisibilityGroupIndex].Assets.length - 1;
			}
			PreferenceVisibilityAssetChanged(true);
		}

		// Hide checkbox
		if (MouseIn(500, 352, 64, 64)) {
			PreferenceVisibilityHideChange();
			if (PreferenceVisibilityHideChecked != PreferenceVisibilityBlockChecked && PreferenceVisibilityCanBlock) PreferenceVisibilityBlockChange();
		}

		// Block checkbox
		if (MouseIn(500, 432, 64, 64) && PreferenceVisibilityCanBlock) PreferenceVisibilityBlockChange();

		// Reset button
		if (MouseIn(500, PreferenceVisibilityResetClicked ? 780 : 700, 300, 64)) {
			if (PreferenceVisibilityResetClicked) {
				Object.values(Player.PermissionItems).forEach(i => i.Hidden = false);
				PreferenceVisibilityExit(true);
			}
			else PreferenceVisibilityResetClicked = true;
		}

	}

	// Confirm button
	if (MouseIn(1720, 60, 90, 90)) {
		CommonEntries(PreferenceVisibilityRecord).forEach(([key, permission]) => {
			Player.PermissionItems[key] ??= permission;
			Player.PermissionItems[key].Hidden = permission.Hidden;
			Player.PermissionItems[key].Permission = permission.Permission;
		});
		PreferenceVisibilityExit(true);
	}

	// Cancel button
	if (MouseIn(1820, 60, 90, 90)) PreferenceVisibilityExit(false);

}

/**
 * Update the checkbox settings and asset preview image based on the new asset selection
 * @param {boolean} RefreshCheckboxes - If TRUE, load the new asset settings. If FALSE, a checkbox was just manually
 *     changed so don't refresh them
 * @returns {void} - Nothing
 */
function PreferenceVisibilityAssetChanged(RefreshCheckboxes) {
	var CurrAsset = PreferenceVisibilityGroupList[PreferenceVisibilityGroupIndex].Assets[PreferenceVisibilityAssetIndex];

	// Load info for the new asset
	if (RefreshCheckboxes) {
		PreferenceVisibilityHideChecked = CurrAsset.Hidden;
		PreferenceVisibilityBlockChecked = CurrAsset.Blocked;
	}

	// Can't change the Block setting if the item is worn or set to limited permissions
	var WornItem = InventoryGet(Player, PreferenceVisibilityGroupList[PreferenceVisibilityGroupIndex].Group.Name);
	PreferenceVisibilityCanBlock = (WornItem == null || WornItem.Asset.Name != CurrAsset.Asset.Name) && !CurrAsset.Limited;

	// Get the preview image path
	PreferenceVisibilityPreviewAsset = CurrAsset.Asset;

	PreferenceVisibilityResetClicked = false;
}

/**
 * Toggles the Hide checkbox
 * @returns {void} - Nothing
 */
function PreferenceVisibilityHideChange() {
	PreferenceVisibilityHideChecked = !PreferenceVisibilityHideChecked;
	PreferenceVisibilityCheckboxChanged(PreferenceVisibilityRecord, PreferenceVisibilityHideChecked, "Hidden");
	PreferenceVisibilityGroupList[PreferenceVisibilityGroupIndex].Assets[PreferenceVisibilityAssetIndex].Hidden = PreferenceVisibilityHideChecked;
	PreferenceVisibilityAssetChanged(false);
}

/**
 * Toggles the Block checkbox
 * @returns {void} - Nothing
 */
function PreferenceVisibilityBlockChange() {
	PreferenceVisibilityBlockChecked = !PreferenceVisibilityBlockChecked;
	PreferenceVisibilityCheckboxChanged(PreferenceVisibilityRecord, PreferenceVisibilityBlockChecked, "Block");
	PreferenceVisibilityGroupList[PreferenceVisibilityGroupIndex].Assets[PreferenceVisibilityAssetIndex].Blocked = PreferenceVisibilityBlockChecked;
	PreferenceVisibilityAssetChanged(false);
}

/**
 * Adds or removes the current item to/from the list based on the new state of the corresponding checkbox
 * @param {Partial<Record<`${AssetGroupName}/${string}`, ItemPermissions>>} permissionRecord - The record to add or remove the item from
 * @param {boolean} CheckSetting - The new true/false setting of the checkbox
 * @param {"Hidden" | "Block"} Type
 */
function PreferenceVisibilityCheckboxChanged(permissionRecord, CheckSetting, Type) {
	var CurrGroup = PreferenceVisibilityGroupList[PreferenceVisibilityGroupIndex].Group.Name;
	var CurrAsset = PreferenceVisibilityGroupList[PreferenceVisibilityGroupIndex].Assets[PreferenceVisibilityAssetIndex].Asset.Name;
	const permission = permissionRecord[`${CurrGroup}/${CurrAsset}`] ??= PreferencePermissionGetDefault();
	switch (Type) {
		case "Block":
			permission.Permission = CheckSetting ? "Block" : "Default";
			break;
		case "Hidden":
			permission.Hidden = CheckSetting;
			break;
	}
}

/**
 * Exits the preference screen
 */
function PreferenceSubscreenVisibilityExit() {
	return true;
}


function PreferenceSubscreenVisibilityUnload() {
	PreferenceVisibilityGroupList = [];
	PreferenceVisibilityRecord = {};
}

/**
 * Trigger a subscreen exit
 * @param {boolean} SaveChanges - If TRUE, this will commit the configuration
 * @returns {void} - Nothing
 */
function PreferenceVisibilityExit(SaveChanges) {
	if (SaveChanges) ServerPlayerBlockItemsSync();

	PreferenceSubscreenExit();
}

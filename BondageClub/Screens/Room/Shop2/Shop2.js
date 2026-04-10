"use strict";
var Shop2Background = "Shop";

/** @satisfies {Record<string, ShopDropdownState>} */
const ShopDropdownState = /** @type {const} */({
	NONE: "None",
	GROUP: "Group",
	POSE: "Pose",
});

/**
 * Namespace with shop-specific variables that are expected to mutate over the course of the (sub-)screens lifetime
 * @namespace
 */
const Shop2Vars = CommonVariableContainer(
	{
		/**
		 * The item (if any) currently equipped in preview mode
		 * @type {null | Item}
		 */
		EquippedItem: null,

		/**
		 * The current page
		 * @type {number}
		 */
		Page: 0,

		/**
		 * Whether any item has been bought or sold, thus requiring a push to the server
		 * @type {boolean}
		 */
		Push: false,

		/**
		 * The current shop mode
		 * @private
		 * @type {ShopMode}
		 */
		_Mode: "Buy",

		/**
		 * The current dressing state of the preview character
		 * @type {ShopClothesMode}
		 */
		ClothesMode: "Clothes",

		/**
		 * All (filtered) items that can still be bought
		 * @type {ShopItem[]}
		 */
		BuyItems: [],

		/**
		 * All (filtered) items that can still be sold
		 * @type {ShopItem[]}
		 */
		SellItems: [],

		/**
		 * All (filtered) items that can be equipped in preview mode
		 * @type {ShopItem[]}
		 */
		PreviewItems: [],

		/**
		 * The currently active dropdown menu
		 * @type {ShopDropdownState}
		 */
		DropdownState: ShopDropdownState.NONE,

		/**
		 * A record mapping filter ID to filter callbacks.
		 * Each callback is expected to return a list denoting for which modes the item is to-be shown.
		 * Note that an item will only be shown if the respective mode is included in the output list of every callback.
		 * @type {Record<string, (item: ShopItem) => ("Buy" | "Sell" | "Preview")[]>}
		 */
		Filters: {},
	},
	{
		/**
		 * The current shop mode
		 * @type {ShopMode}
		 */
		get Mode() { return Shop2Vars._Mode; },
		set Mode(value) {
			ElementContent("Shop2InputSearch-datalist", "");
			Shop2Vars._Mode = value;
		},

		/**
		 * Get the maximum number of pages for the current {@link Shop2Vars.Mode}.
		 * @type {number}
		 */
		get PageCount() {
			switch (Shop2Vars.Mode) {
				case "Preview":
					return Math.max(1, Math.ceil(Shop2Vars.PreviewItems.length / 12));
				case "Buy":
					return Math.max(1, Math.ceil(Shop2Vars.BuyItems.length / 12));
				case "Sell":
					return Math.max(1, Math.ceil(Shop2Vars.SellItems.length / 12));
				default:
					return 1;
			}
		},

		/**
		 * Get all <=12 assets given the current {@link Shop2Vars.Page} and {@link Shop2Vars.Mode}.
		 * @type {readonly ShopItem[]}
		 */
		get CurrentAssets() {
			switch (Shop2Vars.Mode) {
				case "Preview":
					return Shop2Vars.PreviewItems.slice(12 * Shop2Vars.Page, 12 * (1 + Shop2Vars.Page));
				case "Buy":
					return Shop2Vars.BuyItems.slice(12 * Shop2Vars.Page, 12 * (1 + Shop2Vars.Page));
				case "Sell":
					return Shop2Vars.SellItems.slice(12 * Shop2Vars.Page, 12 * (1 + Shop2Vars.Page));
				default:
					return [];
			}
		},
	},
);

/**
 * Namespace with shop-specific variables that are expected to remain constant over the course of the (sub-)screens lifetime.
 * @namespace
 */
const Shop2InitVars = CommonVariableContainer(
	{
		/**
		 * The shop background
		 * @type {string}
		 */
		Background: "Shop",

		/**
		 * The shop preview character
		 * @type {null | Character}
		 */
		Preview: null,

		/**
		 * The module- and screen-name of the previous screen (if any)
		 * @type {null | ScreenSpecifier}
		 */
		PreviousScreen: null,

		/**
		 * Super set of all items that be bought or sold
		 * @type {readonly ShopItem[]}
		 */
		Items: [],

		/**
		 * A record mapping group category descriptions, to {@link AssetGroup.Description} to a set with all respective (shop-elligble) group names.
		 *
		 * Note that keys will vary based on the users active language.
		 * @type {Record<string, Record<string, Set<AssetGroupName>>>}
		 */
		GroupDescriptions: {},
	},
	{
		/** The shop background */
		get Background() { return Shop2Background; },
		set Background(value) { Shop2Background = value; },
	},
	{
		replacer: (_, value) => value instanceof Set ? ["__Set__", ...value] : value,
		reviver: (_, value) => Array.isArray(value) && value[0] === "__Set__" ? new Set(value.slice(1)) : value,
	},
);

/**
 * Namespace with shop-specific constants.
 * @namespace
 */
const Shop2Consts = {
	/**
	 * Grid parameters for the to-be displayed shop items
	 */
	Grid: {
		x: 1115,
		y: 185,
		width: 860,
		height: 772,
		itemWidth: 200,
		itemHeight: 244,
	},

	/**
	 * Coordinates for the `Color` mode
	 * @type {RectTuple}
	 */
	ItemColorCoords: [
		1115 - 25,
		25,
		860 + 25,
		772 + (185 - 25),
	],

	/**
	 * A list denoting the rotation order between the respective shop modes.
	 * @type {readonly ShopMode[]}
	 */
	BuyModeCycleOrder: ["Preview", "Buy", "Sell"],

	/**
	 * A list denoting the rotation order (and their callbacks) between the respective clothing modes.
	 * @type {readonly { Mode: ShopClothesMode, Callback: (C: Character, items: Item[]) => void }[]}
	 */
	ClothesCycleOrder: [
		{
			Mode: "Clothes",
			Callback: (C, items) => C.Appearance = items,
		},
		{
			Mode: "Underwear",
			Callback: (C, items) => C.Appearance = items.filter(i => !i.Asset.Group.AllowNone || i.Asset.BodyCosplay || i.Asset.Group.Underwear),
		},
		{
			Mode: "Cosplay",
			Callback: (C, items) => C.Appearance = items.filter(i => !i.Asset.Group.AllowNone || i.Asset.BodyCosplay),
		},
		{
			Mode: "Nude",
			Callback: (C, items) => C.Appearance = items.filter(i => !i.Asset.Group.AllowNone),
		},
	],

	// NOTE: Initialized in `AssetLoadAll`
	/**
	 * A record mapping {@link Asset.BuyGroup} names to the asset's value and all members of the buygroup.
	 * Only includes buy groups with at least 2 members.
	 * @type {Record<string, { Value: number, Assets: readonly ItemBundle[] }>}
	 */
	BuyGroups: {},

	// NOTE: Initialized in `AssetLoadAll`
	/**
	 * A set with the group + asset names of all asset keys.
	 * @type {Set<string>}
	 */
	Keys: new Set(),

	// NOTE: Initialized in `AssetLoadAll`
	/**
	 * A set with the group + asset names of all asset remotes.
	 * @type {Set<string>}
	 */
	Remotes: new Set(),
};

/**
 * Namespace with shop-related functions.
 * @namespace
 */
var Shop2 = {
	/**
	 * Populate {@link Shop2Consts.BuyGroups} with buy groups.
	 * @private
	 */
	_PopulateBuyGroups: function _PopulateBuyGroups() {
		/** @type {Record<string, ({ Money: number } & ItemBundle)[]>} */
		const buyGroups = {};
		for (const asset of Asset) {
			if (asset.BuyGroup) {
				buyGroups[asset.BuyGroup] ??= [];
				buyGroups[asset.BuyGroup].push({ Group: asset.Group.Name, Name: asset.Name, Money: asset.Value });
			}
		}

		for (const [buyGroup, members] of Object.entries(buyGroups)) {
			if (members.length <= 1) {
				continue;
			}

			// Find the smallest >0 money value; fall back to -1 | >0 if it cannot be found
			const allMoney = members.map(i => i.Money);
			let money = Math.min(...allMoney.filter(i => i > 0));
			if (money === Infinity) {
				money = -1;
			}
			Shop2Consts.BuyGroups[buyGroup] = { Value: money, Assets: members.map(i => CommonOmit(i, ["Money"])) };
		}
	},

	/**
	 * Populate {@link Shop2InitVars.GroupDescriptions} with group descriptions and all corresponding group names
	 * @param {readonly ShopItem[]} assets
	 * @private
	 */
	_PopulateGroupDescriptions: function _PopulateGroupDescriptions(assets) {
		const groups = new Set(assets.map(a => a.Asset.Group));
		for (const group of groups) {
			let description = group.Description;
			switch (group.Name) {
				case "ItemVulva":
				case "ItemVulvaPiercings":
					if (Player.GenderSettings.HideShopItems.Female === Player.GenderSettings.HideShopItems.Male) {
						description += ` & ${InterfaceTextGet(group.Name === "ItemVulva" ? "DialogGroupNameItemPenis" : "DialogGroupNameItemGlans")}`;
					} else if (Player.GenderSettings.HideShopItems.Female) {
						description = InterfaceTextGet(group.Name === "ItemVulva" ? "DialogGroupNameItemPenis" : "DialogGroupNameItemGlans");
					}
					break;
			}

			Shop2InitVars.GroupDescriptions[group.Category] ??= {};
			Shop2InitVars.GroupDescriptions[group.Category][description] ??= new Set();
			Shop2InitVars.GroupDescriptions[group.Category][description].add(group.Name);
		}
	},

	/**
	 * Populate {@link Shop2Consts.Keys} and {@link Shop2Consts.Remote} with the name of all asset keys and remotes.
	 * @private
	 */
	_PopulateKeysAndRemotes: function _PopulateKeysAndRemotes() {
		for (const asset of Asset) {
			if (asset.Effect.some(e => e.startsWith("Unlock"))) {
				Shop2Consts.Keys.add(`${asset.Group.Name}${asset.Name}`);
			}
			if (asset.Effect.some(e => e === E.Remote)) {
				Shop2Consts.Remotes.add(`${asset.Group.Name}${asset.Name}`);
			}
		}
	},

	/**
	 * Draw function for a single item in the shop
	 * @param {number} x
	 * @param {number} y
	 * @param {number} w
	 * @param {number} h
	 * @param {number} assetIndex - The assets index within {@link Shop2Vars.CurrentAssets}
	 * @satisfies {ScreenDrawHandler}
	 * @private
	 */
	_AssetElementDraw: function _AssetElementDraw(x, y, w, h, assetIndex) {
		const C = Shop2InitVars.Preview;
		const { Asset } = Shop2Vars.CurrentAssets[assetIndex] ?? {};
		if (!Asset || !C) {
			return;
		}

		if (MouseIn(x, y, w, h)) {
			DrawHoverElements.push(() => DrawButtonHover(x, y, w, h, Asset.Group.Description));
		}

		/** @type {InventoryIcon[]} */
		const Icons = [];
		if (Asset.Extended) {
			Icons.push("Extended");
		}

		const buyGroups = Asset.BuyGroup != null ? Shop2Consts.BuyGroups[Asset.BuyGroup] : null;
		if (buyGroups) {
			Icons.push("BuyGroup");
		}

		/** @type {PreviewDrawOptions} */
		const options = { Width: w, Height: h };
		const hover = MouseIn(x, y, w, h) && !CommonIsMobile;
		let money = buyGroups?.Value ?? Asset.Value;
		switch (Shop2Vars.Mode) {
			case "Preview": {
				const item = Shop2Vars.EquippedItem;
				if (hover) {
					options.Background = "cyan";
				} else if (item && item.Asset.Name === Asset.Name && item.Asset.Group.Name === Asset.Group.Name) {
					options.Background = "pink";
				} else {
					options.Background = "white";
				}
				DrawItemPreview({ Asset, Icons }, C, x, y, options);
				break;
			}
			case "Sell":
			case "Buy": {
				if (Shop2Vars.Mode === "Sell") {
					money = Math.ceil(money * 0.5);
				}

				let label = "";
				if (money <= 0) {
					options.Background = "gray";
					options.Hover = false;
					label = "N.A.";
				} else if (Shop2Vars.Mode === "Buy" && money > Player.Money) {
					options.Background = "gray";
					options.Hover = false;
					label = `$${money}`;
				} else if (hover) {
					options.Background = "cyan";
					label = `$${money}`;
				} else {
					options.Background = "white";
					label = `$${money}`;
				}

				DrawItemPreview({ Asset, Icons }, C, x, y, options);
				Shop2.DrawPriceRibbon(label, x, y, w, Shop2Vars.Mode === "Buy" ? "Red" : "Green");
				break;
			}
		}
	},

	/**
	 * Click function for a single item in the shop
	 * @param {PointerEvent} event
	 * @param {number} assetIndex - The assets index within {@link Shop2Vars.CurrentAssets}
	 * @satisfies {MouseEventListener}
	 * @private
	 */
	_AssetElementClick: function _AssetElementClick(event, assetIndex) {
		const C = Shop2InitVars.Preview;
		const asset = Shop2Vars.CurrentAssets[assetIndex]?.Asset;
		if (!asset || !C) {
			return;
		}

		const buyGroups = (asset.BuyGroup ? Shop2Consts.BuyGroups[asset.BuyGroup] : null) ?? { Value: asset.Value, Assets: [{ Group: asset.Group.Name, Name: asset.Name }] };
		switch (Shop2Vars.Mode) {
			case "Preview": {
				const item = Shop2Vars.EquippedItem;

				const index = Shop2Consts.ClothesCycleOrder.findIndex(({ Mode }) => Mode === Shop2Vars.ClothesMode);
				if (index === -1) {
					return;
				}
				const { Callback } = Shop2Consts.ClothesCycleOrder[index];
				Callback(C, Player.Appearance.filter(i => i.Asset.Group.IsAppearance()));

				if (item && item.Asset.Name === asset.Name && item.Asset.Group.Name === asset.Group.Name) {
					Shop2Vars.EquippedItem = null;
				} else {
					Shop2Vars.EquippedItem = CharacterAppearanceSetItem(C, asset.Group.Name, asset, [...asset.DefaultColor]) ?? null;
				}
				CharacterRefresh(C, false, false);
				Shop2._UpdatePoseButtons();
				break;
			}
			case "Buy":
			case "Sell": {
				let money = buyGroups.Value;
				if (money <= 0) {
					return;
				}

				/** @type {"BuyItems" | "SellItems"} */
				let removalField;
				/** @type {"BuyItems" | "SellItems"} */
				let additionField;
				/** @type {typeof InventoryAdd} */
				let modifyInventory;
				if (Shop2Vars.Mode === "Buy") {
					removalField = "BuyItems";
					additionField = "SellItems";
					modifyInventory = InventoryAdd;
				} else {
					removalField = "SellItems";
					additionField = "BuyItems";
					money = -Math.ceil(money * 0.5);
					modifyInventory = InventoryDelete;
				}

				if (money > Player.Money) {
					return;
				}

				Shop2Vars.Push = true;
				for (const { Group, Name } of buyGroups.Assets) {
					modifyInventory(Player, Name, Group, false);

					// An index -1 can be expected here in a few cases, namely for -1-valued buygroup members that cannot be directly bought and
					// are thus absent from `Shop2Vars.BuyItems`/`.SellItems`
					const indexOld = Shop2Vars[removalField].findIndex(({ Asset }) => Asset.Name === Name && Asset.Group.Name === Group);
					if (indexOld === -1) {
						continue;
					}
					const shopItem = Shop2Vars[removalField][indexOld];
					shopItem.Buy = Shop2Vars.Mode !== "Buy";
					Shop2Vars[removalField].splice(indexOld, 1);

					// Do not move items to the sell list if they should never be sold, nor to the buy list if they cannot be bought
					if ((Shop2Vars.Mode === "Buy" && !shopItem.NeverSell) || (Shop2Vars.Mode === "Sell" && !shopItem.CannotBuy)) {
						let indexNew = Shop2Vars[additionField].findIndex(({ SortPriority }) => SortPriority >= shopItem.SortPriority);
						if (indexNew === -1) {
							indexNew = Shop2Vars[additionField].length;
						}
						Shop2Vars[additionField].splice(indexNew, 0, shopItem);
					}
				}
				Player.Money -= money;

				if (Shop2Vars.Page >= Shop2Vars.PageCount) {
					Shop2Vars.Page = Shop2Vars.PageCount - 1;
				}
				break;
			}
		}
	},

	/**
	 * Construct screen functions for the <=12 items displayed in the shop.
	 * @returns {Record<string, ShopScreenFunctions>}
	 */
	_GenerateAssetElements: function _GenerateAssetElements() {
		const coordsList = CommonGenerateGridCoords(12, Shop2Consts.Grid);
		return Object.fromEntries(coordsList.map((coords, i) => {
			return [
				`Asset${i}`,
				{
					Coords: coords,
					Mode: new Set(["Preview", "Buy", "Sell"]),
					Draw: (...args) => Shop2._AssetElementDraw(...args, i),
					Click: (...args) => Shop2._AssetElementClick(...args, i),
				},
			];
		}));
	},

	/**
	 * Filter the buy, sell and preview items in {@link Shop2Vars} based on the {@link Shop2Vars.Filters} settings,
	 * clipping the current {@link Shop2Vars.Page} if required.
	 * @param {boolean} clearDatalist - Whether the search bars datalist should be cleared (and thus be recomputed on a focus event)
	 */
	ApplyItemFilters: function ApplyItemFilters(clearDatalist=true) {
		// Empty the filter caches and mark all relevant assets as filtered or not
		Shop2Vars.BuyItems = [];
		Shop2Vars.SellItems = [];
		Shop2Vars.PreviewItems = [];
		for (const item of Shop2InitVars.Items) {
			const fieldNames = Object.values(Shop2Vars.Filters).reduce((prev, func) => {
				const next = func(item);
				return prev.filter(mode => next.includes(mode));
			}, /** @type {("Preview" | "Buy" | "Sell")[]} */(["Preview", "Buy", "Sell"]));

			for (const fieldName of fieldNames) {
				Shop2Vars[`${fieldName}Items`].push(item);
			}
		}

		// Ensure that after the filtering we're still the [0, Shop2Vars.PageCount) range
		if (Shop2Vars.Page >= Shop2Vars.PageCount) {
			Shop2Vars.Page = Shop2Vars.PageCount - 1;
		}

		if (clearDatalist) {
			ElementContent("Shop2InputSearch-datalist", "");
		}
	},

	/** Click handler for the group-selection checkboxes */
	_SetCheckboxFilters: function _SetCheckboxFilters() {
		/** @type {Set<AssetGroupName>} */
		const checkedSet = new Set();
		const elements = /** @type {HTMLInputElement[]} */(Array.from(document.querySelectorAll(`[id^="Shop2GroupSelect-checkbox"]`)));
		for (const checkbox of elements) {
			if (checkbox.checked) {
				const [category, groupDescr] = checkbox.id.split("-").slice(-2);
				Shop2InitVars.GroupDescriptions[category]?.[groupDescr]?.forEach(i => checkedSet.add(i));
			}
		}

		Shop2Vars.Filters.AssetGroup = (item) => checkedSet.has(item.Asset.Group.Name) ? ["Buy", "Sell", "Preview"] : [];
		Shop2.ApplyItemFilters();
	},

	/**
	 * Update the state of all pose-buttons, disabling or selecting them if so required.
	 */
	_UpdatePoseButtons: function _UpdatePoseButtons() {
		const C = Shop2InitVars.Preview;
		if (!C) {
			return;
		}

		const buttonElements = /** @type {HTMLButtonElement[]} */(Array.from(document.querySelectorAll("[data-pose]")));
		for (const button of buttonElements) {
			const pose = PoseRecord[/** @type {AssetPoseName} */(button.dataset.pose)];
			if (!pose) {
				continue;
			}

			button.disabled = false;
			button.classList.remove("layering-button-pink");
			if (C.PoseMapping[pose.Category] === pose.Name) {
				button.classList.add("layering-button-pink");
			} else if (!PoseAvailable(C, pose.Category, pose.Name)) {
				button.disabled = true;
			}
		}
	},

	/**
	 * @param {string} id
	 */
	_ClickDropdown: function _ClickDropdown(id) {
		const elems = Array.from(document.getElementsByClassName("dropdown"));
		for (const elem of elems) {
			elem.toggleAttribute("hidden", elem.id !== id || !elem.hasAttribute("hidden"));
		}
	},

	/**
	 * Draw a ribbon with the specified label in the top-right corner of the passed square.
	 * @type {(label: string, x: number, y: number, w: number, color?: string) => void}
	 */
	DrawPriceRibbon: function DrawPriceRibbon(label, x, y, w, color="Red") {
		MainCanvas.save();

		// Draw a ribbon (i.e. triangle with the tip removed)
		const triangle = 85;
		const tip = 30;
		MainCanvas.beginPath();
		MainCanvas.fillStyle = color;
		MainCanvas.moveTo(x + w - triangle, y);
		MainCanvas.lineTo(x + w - tip, y);
		MainCanvas.lineTo(x + w, y + tip);
		MainCanvas.lineTo(x + w, y + triangle);
		MainCanvas.closePath();
		MainCanvas.fill();
		MainCanvas.strokeStyle = "Black";
		MainCanvas.lineWidth = 1;
		MainCanvas.stroke();

		// Draw 45 degree rotated text inside the triangle
		const textX = x + w - 30;
		const textY = y + 30;
		MainCanvas.translate(textX, textY);
		MainCanvas.rotate(Math.PI / 4);
		MainCanvas.translate(-textX, -textY);
		DrawTextFit(label, textX, textY, triangle * 0.8, "White");

		MainCanvas.restore();
	},

	/**
	 * Convert the passed asset list into a list consisting of shop items
	 * @param {readonly Asset[]} assets - The assets in question
	 * @returns {ShopItem[]} - The shop items constructed from the passed assets
	 */
	ParseAssets: function ParseAssets(assets) {
		return assets.map((a, i) => {
			const Buy = !InventoryAvailable(Player, a.Name, a.Group.Name) && a.Value !== 0;
			const CannotBuy = (
				(LogQuery("BlockKey", "OwnerRule") && Shop2Consts.Keys.has(`${a.Group.Name}${a.Name}`))
				|| (LogQuery("BlockRemote", "OwnerRule") && Shop2Consts.Remotes.has(`${a.Group.Name}${a.Name}`))
			);
			const NeverSell = a.NeverSell;
			return { Asset: a, SortPriority: i, Buy, CannotBuy, NeverSell };
		});
	},

	// NOTE: Asset-specific entries are assigned further down below outside the `Shop2` namespace
	/**
	 * Namespace with the individual screen function components of the shop screen
	 * @type {Record<string, ShopScreenFunctions>}
	 */
	Elements: {
		DarkFactor: {
			Coords: [0, 0, 2000, 1000],
			Mode: new Set(["Preview", "Buy", "Sell", "Extended", "Color", "Layering"]),
			Draw: (...coords) => DrawRect(...coords, "rgba(0,0,0,0.5)"),
		},
		Character: {
			Coords: [650, 0, 0, 0],
			Mode: new Set(["Preview", "Buy", "Sell", "Extended", "Color", "Layering"]),
			Load: async () => {
				if (Shop2InitVars.Preview) {
					return;
				}
				Shop2InitVars.Preview = CharacterLoadSimple("Shop2Preview");
				Shop2InitVars.Preview.Appearance = Player.Appearance.filter(i => i.Asset.Group.IsAppearance());
				Shop2InitVars.Preview.HeightRatio = 1;
				// @ts-expect-error: partially initialized shared settings
				Shop2InitVars.Preview.OnlineSharedSettings = { ItemsAffectExpressions: false };
				CharacterRefresh(Shop2InitVars.Preview, false, false);
			},
			Draw: (x, y) => {
				const C = Shop2InitVars.Preview;
				if (C) {
					DrawCharacter(C, x, y, 1);
				}
			},
			Exit: () => {
				switch (Shop2Vars.Mode) {
					case "Buy":
					case "Sell":
					case "Preview":
						if (Shop2InitVars.Preview) {
							CharacterDelete(Shop2InitVars.Preview);
							Shop2InitVars.Preview = null;
						}
						break;
				}
			},
		},
		InputSearch: {
			Coords: [25, 38, 660, 60],
			Mode: new Set(["Preview", "Buy", "Sell"]),
			Load: async () => {
				let elem = /** @type {null | HTMLInputElement} */(document.getElementById("Shop2InputSearch"));
				if (elem) {
					elem.toggleAttribute("hidden", false);
					return;
				}

				// We've got a caching related race condition going on for `TextGet("InputSearch")`, so hard code the english text as fallback
				elem = ElementCreateSearchInput(
					"Shop2InputSearch",
					() => {
						switch (Shop2Vars.Mode) {
							case "Preview":
								return new Set(Shop2Vars.PreviewItems.map(i => i.Asset.Description).sort());
							case "Buy":
								return new Set(Shop2Vars.BuyItems.map(i => i.Asset.Description).sort());
							case "Sell":
								return new Set(Shop2Vars.SellItems.map(i => i.Asset.Description).sort());
							default:
								return new Set();
						}
					},
					{
						parent: document.body,
						placeholder: TextGet("InputSearch"),
						onInput() {
							if (!this.value) {
								delete Shop2Vars.Filters.Keyword;
							} else {
								Shop2Vars.Filters.Keyword = (item) => {
									const description = item.Asset.Description.toUpperCase();
									return description.includes(this.value.toUpperCase().trim()) ? ["Buy", "Sell", "Preview"] : [];
								};
							}
							Shop2.ApplyItemFilters(false);
						},
					},
				);
			},
			Draw: (...coords) => {
				ElementPositionFixed("Shop2InputSearch", ...coords);
			},
			Unload: () => {
				document.getElementById("Shop2InputSearch")?.toggleAttribute("hidden", true);
			},
			Exit: () => ElementRemove("Shop2InputSearch"),
		},
		GroupSelectHeader: {
			Coords: [345, 155, 0, 0],
			Mode: new Set(["Preview", "Buy", "Sell"]),
			Draw: (x, y) => DrawText(TextGet("GroupSelectHeader"), x, y, "White"),
		},
		GroupSelectCollapse: {
			Coords: [25, Shop2Consts.Grid.y, 90, 90],
			Mode: new Set(["Preview", "Buy", "Sell"]),
			Draw: (...coords) => {
				if (Shop2Vars.DropdownState === ShopDropdownState.GROUP) {
					DrawButton(...coords, "", "Pink", "Icons/Down.png", TextGet("GroupSelectCollapse"));
				} else {
					DrawButton(...coords, "", "White", "Icons/Next.png", TextGet("GroupSelectCollapse"));
				}
			},
			Click: () => {
				Shop2Vars.DropdownState = Shop2Vars.DropdownState === ShopDropdownState.GROUP ? ShopDropdownState.NONE : ShopDropdownState.GROUP;
				Shop2._ClickDropdown("Shop2GroupSelect");
			},
		},
		GroupSelectAll: {
			Coords: [135, Shop2Consts.Grid.y, 200, 90],
			Mode: new Set(["Preview", "Buy", "Sell"]),
			Draw: (...coords) => DrawButton(...coords, TextGet("GroupSelectAll"), "White"),
			Click: () => {
				const elements = /** @type {HTMLInputElement[]} */(Array.from(document.querySelectorAll(`[id^="Shop2GroupSelect-checkbox"]`)));
				elements.forEach(checkbox => checkbox.checked = true);
				delete Shop2Vars.Filters.AssetGroup;
				Shop2.ApplyItemFilters();
			},
		},
		GroupSelectNone: {
			Coords: [355, Shop2Consts.Grid.y, 200, 90],
			Mode: new Set(["Preview", "Buy", "Sell"]),
			Draw: (...coords) => DrawButton(...coords, TextGet("GroupSelectNone"), "White"),
			Click: () => {
				const elements = /** @type {HTMLInputElement[]} */(Array.from(document.querySelectorAll(`[id^="Shop2GroupSelect-checkbox"]`)));
				elements.forEach(checkbox => checkbox.checked = false);
				Shop2Vars.Filters.AssetGroup = () => [];
				Shop2.ApplyItemFilters();
			},
		},
		GroupSelect: {
			Coords: [25, Shop2Consts.Grid.y + 100, 660, Shop2Consts.Grid.height - 120],
			Mode: new Set(["Preview", "Buy", "Sell"]),
			Load: async () => {
				let elem = document.getElementById("Shop2GroupSelect");
				if (elem) {
					elem.toggleAttribute("hidden", true);
					return;
				}

				const entries = Object.entries(Shop2InitVars.GroupDescriptions);
				const groups = Object.fromEntries(entries.map(([k, v]) => [k, Object.keys(v)]));
				elem = ElementCheckboxDropdown.FromRecord("Shop2GroupSelect", groups, Shop2._SetCheckboxFilters, { checked: true });
				const headers = /** @type {NodeListOf<HTMLSpanElement>} */(elem.querySelectorAll(".dropdown-header"));
				headers.forEach(headerElem => headerElem.innerText = TextGet(`AssetGroupCategory${headerElem.innerText}`));
			},
			Draw: (...coords) => {
				if (Shop2Vars.DropdownState !== ShopDropdownState.GROUP) {
					return;
				}
				ElementPositionFixed("Shop2GroupSelect", ...coords);
			},
			Unload: () => {
				document.getElementById("Shop2GroupSelect")?.toggleAttribute("hidden", true);
			},
			Exit: () => ElementRemove("Shop2GroupSelect"),
		},
		PoseSelectHeader: {
			Coords: [345, 155 + 160, 0, 0],
			Mode: new Set(["Preview", "Buy", "Sell"]),
			Draw: (x, y) => {
				switch (Shop2Vars.DropdownState) {
					case ShopDropdownState.GROUP:
						DrawText(TextGet("PoseSelectHeader"), x, y, "Gray");
						break;
					default:
						DrawText(TextGet("PoseSelectHeader"), x, y, "White");
						break;
				}
			}
		},
		PoseSelectCollapse: {
			Coords: [25, Shop2Consts.Grid.y + 160, 90, 90],
			Mode: new Set(["Preview", "Buy", "Sell"]),
			Draw: (...coords) => {
				switch (Shop2Vars.DropdownState) {
					case ShopDropdownState.POSE:
						DrawButton(...coords, "", "Pink", "Icons/Down.png", TextGet("PoseSelectCollapse"));
						break;
					case ShopDropdownState.GROUP:
						DrawButton(...coords, "", "Gray", "Icons/Next.png", TextGet("PoseSelectCollapse"), true);
						break;
					default:
						DrawButton(...coords, "", "White", "Icons/Next.png", TextGet("PoseSelectCollapse"));
						break;
				}
			},
			Click: () => {
				Shop2Vars.DropdownState = Shop2Vars.DropdownState === ShopDropdownState.POSE ? ShopDropdownState.NONE : ShopDropdownState.POSE;
				Shop2._ClickDropdown("Shop2PoseSelect");
			},
		},
		PoseSelectNone: {
			Coords: [135, Shop2Consts.Grid.y + 160, 200, 90],
			Mode: new Set(["Preview", "Buy", "Sell"]),
			Draw: (...coords) => {
				switch (Shop2Vars.DropdownState) {
					case ShopDropdownState.GROUP:
						DrawButton(...coords, TextGet("PoseSelectReset"), "Gray");
						break;
					default:
						DrawButton(...coords, TextGet("PoseSelectReset"), "White");
						break;
				}
			},
			Click: () => {
				const C = Shop2InitVars.Preview;
				if (!C) {
					return;
				}
				PoseSetActive(C, null, true);
				Shop2._UpdatePoseButtons();
			},
		},
		PoseSelect: {
			Coords: [25, Shop2Consts.Grid.y + 260, 660, Shop2Consts.Grid.height - 280],
			Mode: new Set(["Preview", "Buy", "Sell"]),
			Load: async () => {
				const elem = document.getElementById("Shop2PoseSelect");
				if (elem) {
					elem.toggleAttribute("hidden", false);
					return;
				}

				/** @type {Partial<Record<AssetPoseCategory, Pose[]>>} */
				const poses = {};
				for (const pose of PoseFemale3DCG) {
					if (pose.AllowMenu || pose.AllowMenuTransient) {
						(poses[pose.Category] ??= []).push(pose);
					}
				}

				ElementCreate({
					tag: "div",
					attributes: { hidden: true, id: "Shop2PoseSelect", "screen-generated": CurrentScreen },
					parent: document.body,
					classList: ["HideOnPopup", "dropdown", "scroll-box"],
					children: [{
						tag: "div",
						classList: ["shop2-pose-outer-grid"],
						children: Object.values(poses).map(poseList => {
							return {
								tag: "div",
								classList: ["shop2-pose-inner-grid"],
								children: poseList.map(pose => ElementButton.Create(
									`shop2-pose-${pose.Name}`,
									() => {
										const C = Shop2InitVars.Preview;
										if (!C) {
											return;
										}
										PoseSetActive(C, pose.Name);
										Shop2._UpdatePoseButtons();
									}, undefined,
									{
										button: {
											style: { "background-image": `url("./Icons/Poses/${pose.Name}.png")` },
											dataAttributes: { pose: pose.Name },
											classList: ["shop-button"],
										},
									},
								)),
							};
						}),
					}],
				});
				Shop2._UpdatePoseButtons();
			},
			Draw: (...coords) => {
				if (Shop2Vars.DropdownState !== ShopDropdownState.POSE) {
					return;
				}

				ElementPositionFixed("Shop2PoseSelect", ...coords);
				const elem = document.getElementById("Shop2PoseSelect");
				elem?.style.setProperty("width", "fit-content");
			},
			Unload: () => {
				document.getElementById("Shop2PoseSelect")?.toggleAttribute("hidden", true);
			},
			Exit: () => ElementRemove("Shop2PoseSelect"),
		},
		ItemHeader: {
			Coords: [Shop2Consts.Grid.x + 20 + 1.5 * Shop2Consts.Grid.itemWidth, 155, 0, 0],
			Mode: new Set(["Preview", "Buy", "Sell"]),
			Draw: (x, y) => {
				let i = 0;
				let j = Shop2Consts.BuyModeCycleOrder.indexOf(Shop2Vars.Mode);
				const hideShopItems = Player.GenderSettings.HideShopItems;
				if (hideShopItems.Male === hideShopItems.Female) {
					i = 0;
				} else if (hideShopItems.Male) {
					i = 1;
				} else if (hideShopItems.Female) {
					i = 2;
				}

				const txt = TextGet(`ItemHeader${i}${j}`).replace("0", `${1 + Shop2Vars.Page}/${Shop2Vars.PageCount}`);
				DrawText(txt, x, y, "White");
			},
		},
		MoneyHeader: {
			Coords: [Shop2Consts.Grid.x + 3 * 20 + 3.5 * Shop2Consts.Grid.itemWidth, 155, 0, 0],
			Mode: new Set(["Preview", "Buy", "Sell"]),
			Draw: (x, y) => {
				const money = Intl.NumberFormat(
					"en-US", { style: "currency", currency: "USD", maximumFractionDigits: 0 },
				).format(Math.min(999999, Player.Money));
				DrawText(money, x, y, "White");
			},
		},
		LayeringButton: {
			Coords: [1115, 25, 90, 90],
			Mode: new Set(["Preview", "Buy", "Sell"]),
			Draw: (...coords) => {
				const item = Shop2Vars.EquippedItem;
				if (!item || Shop2Vars.Mode !== "Preview") {
					DrawButton(...coords, "", "Gray", "Icons/Layering.png", TextGet("LayeringButton"), true);
				} else {
					DrawButton(...coords, "", "White", "Icons/Layering.png", TextGet("LayeringButton"));
				}
			},
			Click: () => {
				const C = Shop2InitVars.Preview;
				const item = Shop2Vars.EquippedItem;
				if (!item || Shop2Vars.Mode !== "Preview" || !C) {
					return;
				}

				Shop2Unload();
				Layering.Init(item, C, { x: 1115, w: 2000 - 1115 - 25 });
				Shop2Vars.Mode = "Layering";
			},
		},
		BuyMode: {
			Coords: [1225, 25, 90, 90],
			Mode: new Set(["Preview", "Buy", "Sell"]),
			Draw: (...coords) => {
				switch (Shop2Vars.Mode) {
					case "Buy":
						return DrawButton(...coords, "", "Red", `Icons/Shop${Shop2Vars.Mode}.png`, TextGet(`BuyMode${Shop2Vars.Mode}`));
					case "Sell":
						return DrawButton(...coords, "", "Green", `Icons/Shop${Shop2Vars.Mode}.png`, TextGet(`BuyMode${Shop2Vars.Mode}`));
					case "Preview":
						return DrawButton(...coords, "", "Blue", `Icons/Shop${Shop2Vars.Mode}.png`, TextGet(`BuyMode${Shop2Vars.Mode}`));
				}
			},
			Click: () => {
				const i = Shop2Consts.BuyModeCycleOrder.indexOf(Shop2Vars.Mode);
				if (i !== -1) {
					Shop2Vars.Mode = Shop2Consts.BuyModeCycleOrder[(i + 1) % Shop2Consts.BuyModeCycleOrder.length];
				}
				Shop2Vars.Page = 0;
			},
		},
		Color: {
			Coords: [1335, 25, 90, 90],
			Mode: new Set(["Preview", "Buy", "Sell"]),
			Draw: (...coords) => {
				const asset = Shop2Vars.EquippedItem?.Asset;
				const icon = (asset?.DefaultColor?.length ?? 1) <= 1 ? "ColorChange" : "ColorChangeMulti";
				if (!asset || Shop2Vars.Mode !== "Preview") {
					DrawButton(...coords, "", "Gray", `Icons/${icon}.png`, TextGet("Color"), true);
				} else {
					DrawButton(...coords, "", "White", `Icons/${icon}.png`, TextGet("Color"));
				}
			},
			Click: () => {
				const C = Shop2InitVars.Preview;
				if (Shop2Vars.EquippedItem && Shop2Vars.Mode === "Preview" && C) {
					Shop2Unload();
					ItemColorLoad(C, Shop2Vars.EquippedItem, ...Shop2Consts.ItemColorCoords, true);
					ItemColorOnExit(() => {
						Shop2Vars.Mode = "Preview";
						Shop2Load();
					});
					Shop2Vars.Mode = "Color";
				}
			},
		},
		ExtendedItemButton: {
			Coords: [1445, 25, 90, 90],
			Mode: new Set(["Preview", "Buy", "Sell"]),
			Draw: (...coords) => {
				const asset = Shop2Vars.EquippedItem?.Asset;
				if (!asset || !asset.Archetype || asset.IsLock || Shop2Vars.Mode !== "Preview") {
					DrawButton(...coords, "", "Gray", "Icons/Use.png", TextGet("ExtendedItemButton"), true);
				} else {
					DrawButton(...coords, "", "White", "Icons/Use.png", TextGet("ExtendedItemButton"));
				}
			},
			Click: () => {
				const item = Shop2Vars.EquippedItem;
				const asset = item?.Asset;
				if (!asset || !asset.Archetype || asset.IsLock || Shop2Vars.Mode !== "Preview") {
					return;
				}
				Shop2Unload();
				DialogExtendItem(item);
				Shop2Vars.Mode = "Extended";
			},
		},
		Clothes: {
			Coords: [1555, 25, 90, 90],
			Mode: new Set(["Preview", "Buy", "Sell"]),
			Draw: (...coords) => {
				if (Shop2Vars.Mode !== "Preview") {
					DrawButton(...coords, "", "Gray", "Icons/Dress.png", TextGet(`ClothesMode${Shop2Vars.ClothesMode}`), true);
				} else {
					DrawButton(...coords, "", "white", "Icons/Dress.png", TextGet(`ClothesMode${Shop2Vars.ClothesMode}`));
				}
			},
			Click: () => {
				const C = Shop2InitVars.Preview;
				if (Shop2Vars.Mode !== "Preview" || !C) {
					return;
				}

				let index = Shop2Consts.ClothesCycleOrder.findIndex(({ Mode }) => Mode === Shop2Vars.ClothesMode);
				if (index === -1) {
					index = 0;
				}

				const clothesMode = Shop2Consts.ClothesCycleOrder[(index + 1) % Shop2Consts.ClothesCycleOrder.length];
				Shop2Vars.ClothesMode = clothesMode.Mode;
				clothesMode.Callback(C, Player.Appearance.filter(i => i.Asset.Group.IsAppearance()));
				if (Shop2Vars.EquippedItem !== null) {
					const item = CharacterAppearanceSetItem(
						C,
						Shop2Vars.EquippedItem.Asset.Group.Name,
						Shop2Vars.EquippedItem.Asset,
						Shop2Vars.EquippedItem.Color
					);
					if (item) {
						item.Property = Shop2Vars.EquippedItem.Property;
					}
					Shop2Vars.EquippedItem = item ?? null;
				}
				CharacterRefresh(C, false, false);
			},
		},
		PagePrev: {
			Coords: [1665, 25, 90, 90],
			Mode: new Set(["Preview", "Buy", "Sell"]),
			Draw: (...coords) => {
				if (Shop2Vars.PageCount > 1) {
					DrawButton(...coords, "", "White", "Icons/Prev.png", TextGet("PagePrev"));
				} else {
					DrawButton(...coords, "", "Gray", "Icons/Prev.png", TextGet("PagePrev"), true);
				}
			},
			Click: () => {
				if (Shop2Vars.PageCount > 1) {
					Shop2Vars.Page = Shop2Vars.Page === 0 ? Shop2Vars.PageCount - 1 : (Shop2Vars.Page - 1) % Shop2Vars.PageCount;
				}
			},
		},
		PageNext: {
			Coords: [1775, 25, 90, 90],
			Mode: new Set(["Preview", "Buy", "Sell"]),
			Draw: (...coords) => {
				if (Shop2Vars.PageCount > 1) {
					DrawButton(...coords, "", "White", "Icons/Next.png", TextGet("PageNext"));
				} else {
					DrawButton(...coords, "", "Gray", "Icons/Next.png", TextGet("PageNext"), true);
				}
			},
			Click: () => {
				if (Shop2Vars.PageCount > 1) {
					Shop2Vars.Page = (Shop2Vars.Page + 1) % Shop2Vars.PageCount;
				}
			},
		},
		Exit: {
			Coords: [1885, 25, 90, 90],
			Mode: new Set(["Preview", "Buy", "Sell", "Extended"]),
			Draw: (...coords) => DrawButton(...coords, "", "White", "Icons/Exit.png", TextGet("Exit")),
			Click: () => Shop2Exit(),
		},
		MouseWheel: {
			Mode: new Set(["Buy", "Sell", "Preview"]),
			Coords: [
				Shop2Consts.Grid.x,
				Shop2Consts.Grid.y,
				Shop2Consts.Grid.x + Shop2Consts.Grid.width,
				Shop2Consts.Grid.y + Shop2Consts.Grid.height,
			],
			Draw: () => {},
			MouseWheel: (event) => {
				if (Shop2Vars.PageCount === 0) {
					return;
				} else if (event.deltaY < 0) {
					Shop2Vars.Page = Shop2Vars.Page === 0 ? Shop2Vars.PageCount - 1 : (Shop2Vars.Page - 1) % Shop2Vars.PageCount;
				} else if (event.deltaY > 0) {
					Shop2Vars.Page = (Shop2Vars.Page + 1) % Shop2Vars.PageCount;
				}
			},
		},
		// Keep these two at the very button as we can't reliably perform `MouseIn(...Coords)` checks on them
		ExtendedItemScreen: {
			Coords: [0, 0, 2000, 1000],
			Mode: new Set(["Extended"]),
			Draw: (...coords) => {
				if (DialogFocusItem) {
					CommonCallFunctionByNameWarn(`Inventory${DialogFocusItem.Asset.Group.Name}${DialogFocusItem.Asset.Name}Draw`);
				}
			},
			Click: () => {
				if (DialogFocusItem) {
					CommonCallFunctionByNameWarn(`Inventory${DialogFocusItem.Asset.Group.Name}${DialogFocusItem.Asset.Name}Click`);
				}
			},
			Exit: () => DialogLeaveFocusItem(),
		},
		ColorScreen: {
			Coords: [0, 0, 2000, 1000],
			Mode: new Set(["Color"]),
			Draw: (...coords) => {
				if (Shop2InitVars.Preview && ItemColorItem) {
					ItemColorDraw(Shop2InitVars.Preview, ItemColorItem.Asset.Group.Name, ...Shop2Consts.ItemColorCoords);
				}
			},
			Click: () => {
				if (Shop2InitVars.Preview && ItemColorItem) {
					ItemColorClick(Shop2InitVars.Preview, ItemColorItem.Asset.Group.Name, ...Shop2Consts.ItemColorCoords);
				}
			},
			Exit: () => ItemColorExitClick(),
		},
		Layering: {
			Coords: [0, 0, 2000, 1000],
			Mode: new Set(["Layering"]),
			Draw: () => {},
			Resize: (load) => Layering.Resize(load),
			Unload: () => Layering.Unload(),
			Exit: () => Layering.Exit(),
		},
	},

	/**
	 * Helper function for initializing the `Shop2` screen.
	 * @param {null | string} background - The shops background image
	 * @param {null | ScreenSpecifier} screen - A 2-tuple containing the module and name of the previous screen
	 * @param {null | readonly Asset[]} assets - A list of all assets that should appear in the shop
	 */
	Init(background=null, screen=null, assets=null) {
		if (background != null) {
			Shop2InitVars.Background = background;
		}
		if (screen != null) {
			Shop2InitVars.PreviousScreen = screen;
		}
		if (assets != null) {
			Shop2InitVars.Items = Shop2.ParseAssets(assets);
		}
		CommonSetScreen("Room", "Shop2");
	}
};

/** @type {ScreenLoadHandler} */
async function Shop2Load() {
	if (Shop2InitVars.Items.length === 0) {
		Shop2InitVars.Items = Shop2.ParseAssets(
			Asset.filter(a => {
				const value = (a.BuyGroup ? Shop2Consts.BuyGroups[a.BuyGroup]?.Value : null) ?? a.Value;
				return (
					a.Group.Name === a.DynamicGroupName
					&& value > 0
					&& !ShopHideGenderedAsset(a)
				);
			}).sort((a1, a2) => {
				return (
					a1.Group.Category.localeCompare(a2.Group.Category)
					|| a1.Group.Description.localeCompare(a2.Group.Description)
					|| a1.Description.localeCompare(a2.Description)
				);
			}),
		);
	}

	Shop2Vars.Filters.CannotBuy ??= (item) => item.CannotBuy ? ["Sell", "Preview"] : ["Sell", "Buy", "Preview"];
	Shop2Vars.Filters.NeverSell ??= (item) => item.NeverSell ? ["Buy", "Preview"] : ["Sell", "Buy", "Preview"];
	Shop2Vars.Filters.Buy ??= (item) => item.Buy ? ["Buy", "Preview"] : ["Sell", "Preview"];
	Shop2.ApplyItemFilters(false);
	Shop2._PopulateGroupDescriptions(Shop2InitVars.Items);

	Object.values(Shop2.Elements).forEach((e) => {
		if (e.Mode.has(Shop2Vars.Mode)) {
			e.Load?.();
		}
	});
}

/** @type {MouseEventListener} */
function Shop2Click(event) {
	Object.values(Shop2.Elements).some((e) => {
		if (e.Click && e.Mode.has(Shop2Vars.Mode) && MouseIn(...e.Coords)) {
			e.Click(event);
			return true;
		} else {
			return false;
		}
	});
}

/** @type {ScreenDrawHandler} */
function Shop2Draw() {
	Object.values(Shop2.Elements).forEach((e) => {
		if (e.Mode.has(Shop2Vars.Mode)) {
			e.Draw(...e.Coords);
		}
	});
}

/** @type {ScreenRunHandler} */
function Shop2Run() {}

/** @type {ScreenResizeHandler} */
function Shop2Resize(load) {
	Object.values(Shop2.Elements).forEach((e) => {
		if (e.Mode.has(Shop2Vars.Mode)) {
			e.Resize?.(load);
		}
	});
}

/** @type {ScreenUnloadHandler} */
function Shop2Unload() {
	Object.values(Shop2.Elements).forEach((e) => {
		if (e.Mode.has(Shop2Vars.Mode)) {
			e.Unload?.();
		}
	});
}

/** @type {MouseWheelEventListener} */
function Shop2MouseWheel(event) {
	Object.values(Shop2.Elements).forEach((e) => {
		if (e.Mode.has(Shop2Vars.Mode) && MouseIn(...e.Coords)) {
			e.MouseWheel?.(event);
		}
	});
}

/** @type {ScreenExitHandler} */
function Shop2Exit() {
	const oldMode = Shop2Vars.Mode;
	Object.values(Shop2.Elements).forEach((e) => {
		if (e.Mode.has(Shop2Vars.Mode)) {
			e.Exit?.();
		}
	});

	switch (oldMode) {
		case "Extended":
			Shop2._UpdatePoseButtons();
			break;
		case "Buy":
		case "Sell":
		case "Preview":
			if (Shop2Vars.Push) {
				ServerPlayerInventorySync();
				ServerPlayerSync();
			}
			if (Shop2InitVars.PreviousScreen) {
				CommonSetScreen(...Shop2InitVars.PreviousScreen);
			} else {
				CommonSetScreen("Room", "Shop");
			}
			Shop2Vars.Reset();
			Shop2InitVars.Reset();
			break;
	}
}

Object.assign(Shop2.Elements, Shop2._GenerateAssetElements());

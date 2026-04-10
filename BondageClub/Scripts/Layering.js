// @ts-strict-ignore
"use strict";

/**
 * Namespace with functions for managing the layering sub screen
 *
 * Below is an example of some basic usage of the {@link Layering} subscreen,
 * including a `Click` function for initializing the screen and a set of
 * `Resize` and `Exit` functions for, respectively, handling the screens
 * drawing/resizing and exiting
 *
 * @namespace
 * @example
 *
 * let FancyScreenMode: "default" | "layering" = "default";
 *
 * // Make sure the fancy screen mode is changed back to its default upon exiting the layering subscreen
 * Layering.RegisterExitCallbacks({
 *     screen: "FancyScreen",
 *     callback: () => FancyScreenMode = "default",
 * });
 *
 * function FancyScreenClick() {
 *     const C: Character;
 *     const item: Item;
 *     switch (FancyScreenMode) {
 *         case "default": {
 *             if Mousein(...) {
 *                 FancyScreenMode = "layering";
 *                 Layering.Init(C, item);
 *             }
 *             return;
 *         }
 *     }
 * }
 *
 * function FancyScreenResize(load) {
 *     switch (FancyScreenMode) {
 *         case "layering":
 *             Layering.Resize(load);
 *             return;
 *     }
 * }
 *
 * function FancyScreenExit() {
 *     switch (FancyScreenMode) {
 *         case "layering":
 *             Layering.Exit();
 *             return;
 *     }
 * }
 */
var Layering = {
	/**
	 * The character in question
	 * @type {null | Character}
	 */
	Character: null,

	/**
	 * The (rectangular) shape and inter-button gap of the layering screen
	 * @type {null | LayeringDisplay}
	 */
	Display: null,

	/**
	 * The selected item in question
	 * @type {null | Item}
	 */
	Item: null,

	/**
	 * Get or set whether the layering screen is readonly
	 * @type {Boolean}
	 */
	get Readonly() {
		return this._Readonly;
	},
	set Readonly(value) {
		if (value !== this._Readonly && this.IsActive()) {
			this._ApplyReadonly(value);
		}
		this._Readonly = value;
	},

	/**
	 * Get the item's asset
	 * @readonly
	 * @type {Asset}
	 */
	get Asset() { return this.Item.Asset; },

	/**
	 * Get or set the items `Property.OverridePriority`
	 * @returns {undefined | AssetLayerOverridePriority}
	 */
	get OverridePriority() {
		return this.Item.Property.OverridePriority;
	},
	set OverridePriority(value) {
		this.Item.Property.OverridePriority = value;
	},

	/**
	 * The items default `Property.OverridePriority` value.
	 *
	 * This is generally `undefined`, though certain extended item options do overwrite it.
	 * @private
	 * @type {undefined | AssetLayerOverridePriority}
	 */
	_PriorityDefault: undefined,

	/**
	 * Whether the layering screen is readonly or not
	 * @private
	 * @see {@link Layering.Readonly}
	 * @type {Boolean}
	 */
	_Readonly: false,

	/**
	 * Return whether the layering sub screen has currently been initialized (be it either active or unloaded)
	 * @returns {this is typeof this & Pick<Required<typeof this>, "Character" | "Display" | "Item">}
	 */
	IsActive() { return !!document.getElementById(this.ID.root); },

	/**
	 * The default (rectangular) shape and inter-button gap of the layering screen
	 * @readonly
	 * @type {Readonly<LayeringDisplay>}
	 */
	DisplayDefault: Object.freeze({
		buttonGap: 20,
		x: 2000 - (9 * 110) - 25,
		y: 25,
		w: (9 * 110),
		h: 1000 - (2 * 25),
	}),

	/**
	 * The IDs of layering-specific DOM elements
	 * @readonly
	 */
	ID: Object.freeze({
		root: "layering",

		buttonGrid: "layering-button-grid",
		resetButton: "layering-reset-button",
		exitButton: "layering-exit-button",
		hideButton: "layering-hide-button",
		hideTooltip: "layering-hide-button-tooltip",
		lockButton: "layering-lock-button",

		assetHeader: "layering-asset-header",
		assetGrid: "layering-asset-grid",

		layerHeader: "layering-layer-header",
		layerDIV: "layering-layer-div",
		layerOuterGrid: "layering-layer-outer-grid",
	}),

	/**
	 * Screen-specific callbacks that will be executed after calling {@link Layering.Exit}.
	 *
	 * Used as helpers for setting up the next screen.
	 * @private
	 * @readonly
	 * @type {((screen: string, C: Character, item: Item) => void)[]}
	 * @see {@link Layering.RegisterExitCallbacks}
	 */
	_ExitCallbacks: [],

	/**
	 * @private
	 * Initialize the object-based variant of {@link AssetLayerOverridePriority}
	 */
	_InitOverridePriorityObject() {
		this.OverridePriority = {};
		const layerElements = /** @type {NodeListOf<HTMLInputElement>} */(document.querySelectorAll("[data-layer-priority]"));
		layerElements.forEach(e => {
			const value = e.valueAsNumber;
			if (!Number.isNaN(value) && value.toString() !== e.dataset.layerPriority) {
				this.OverridePriority[e.dataset.name] = CommonClamp(Math.round(value), -99, 99);
			}
		});
	},

	/**
	 * @private
	 * @param {string} name - The name of the layer
	 * @param {number} priority - The stringified layer priority
	 * @param {string} defaultPriority - The stringified default priority of the layer
	 */
	_ApplyLayerPriority(name, priority, defaultPriority) {
		const old = this.OverridePriority?.[name];
		if (!CommonIsObject(this.OverridePriority)) {
			this._UpdateInputColors("layer-priority");
			this._InitOverridePriorityObject();
		}

		if (!Number.isNaN(priority) && priority.toString() !== defaultPriority) {
			this.OverridePriority[name] = CommonClamp(priority, -99, 99);
		} else {
			delete this.OverridePriority[name];
		}

		if (old !== this.OverridePriority[name]) {
			this._CharacterRefresh(this.Character, false, false);
		}
	},

	/**
	 * @private
	 * @param {number} priority - The layer priority
	 * @param {string} defaultPriority - The stringified default priority of the layer
	 */
	_ApplyAssetPriority(priority, defaultPriority) {
		const old = this.OverridePriority;
		if (!Number.isInteger(old)) {
			this._UpdateInputColors("asset-priority");
		}

		if (!Number.isNaN(priority) && priority.toString() !== defaultPriority) {
			this.OverridePriority = CommonClamp(Math.round(priority), -99, 99);
		} else {
			this.OverridePriority = undefined;
		}

		if (old !== this.OverridePriority) {
			this._CharacterRefresh(this.Character, false, false);
		}
	},

	/**
	 * Event listener for `input` events involving layer priorities
	 * @private
	 * @param {Event} event
	 */
	_LayerInputListener(event) {
		const target = /** @type {HTMLInputElement} */(event.target);
		this._ApplyLayerPriority(target.dataset.name, target.valueAsNumber, target.dataset.layerPriority);
	},

	/**
	 * Event listener for `input` events involving asset priorities
	 * @private
	 * @param {Event} event
	 */
	_AssetInputListener(event) {
		const target = /** @type {HTMLInputElement} */(event.target);
		this._ApplyAssetPriority(target.valueAsNumber, target.dataset["asset-priority"]);
	},

	/**
	 * A limited version of {@link CharacterRefresh}
	 * @private
	 */
	_CharacterRefresh: CommonLimitFunction(CharacterRefresh, 100, 100),

	/**
	 * Event listener for `click` events of the reset button
	 * @this {HTMLButtonElement}
	 * @param {Event} ev
	 * @private
	 */
	_ResetClickListener(ev) {
		Layering.OverridePriority = Layering._PriorityDefault == null ? undefined : CommonCloneDeep(Layering._PriorityDefault);

		const layerElements = /** @type {NodeListOf<HTMLInputElement>} */(document.querySelectorAll("[data-layer-priority]"));
		layerElements.forEach(e => e.value = e.dataset.layerPriority);

		const assetElements = /** @type {NodeListOf<HTMLInputElement>} */(document.querySelectorAll("[data-asset-priority]"));
		assetElements.forEach(e => e.value = e.dataset.assetPriority);

		Layering._CharacterRefresh(Layering.Character, false, false);
	},

	/**
	 * Event listener for `click` events of the show hidden layers button
	 * @this {HTMLButtonElement}
	 * @param {Event} ev
	 * @private
	 */
	_ShowLayersClickListener(ev) {
		const elements = Array.from(document.querySelectorAll("[data-layer-priority]"));
		if (this.getAttribute("aria-checked") === "true") {
			const typeRecord = Layering.Item.Property?.TypeRecord;
			const layers = elements.map(e => {
				const asset = Layering.Asset;
				return /** @type {const} */([e, Layering.Asset.Layer.find(l => l.Name === e.getAttribute("data-name")) ?? asset.Layer[0]]);
			});
			layers.forEach(([e, layer]) => e.parentElement.toggleAttribute("hidden", !CharacterAppearanceIsLayerVisible(Layering.Character, layer, layer.Asset, typeRecord)));
		} else {
			elements.forEach(e => e.parentElement.toggleAttribute("hidden", false));
		}
	},

	/**
	 * Update the background colors of the `number`-based input elements, the color change depending on whether one is changing an asset- or layer-specific priority.
	 * @private
	 * @param {"layer-priority" | "asset-priority"} activeType
	 */
	_UpdateInputColors(activeType) {
		const layerElements = /** @type {NodeListOf<HTMLInputElement>} */(document.querySelectorAll("[data-layer-priority]"));
		const assetElements = /** @type {NodeListOf<HTMLInputElement>} */(document.querySelectorAll("[data-asset-priority]"));
		if (activeType === "layer-priority") {
			layerElements.forEach(e => e.classList.remove("layering-input-unfocused"));
			assetElements.forEach(e => e.classList.add("layering-input-unfocused"));
		} else {
			layerElements.forEach(e => e.classList.add("layering-input-unfocused"));
			assetElements.forEach(e => e.classList.remove("layering-input-unfocused"));
		}
	},

	/**
	 * Group all layers by their {@link AssetLayer.CopyLayerColor} properties
	 * @private
	 * @param {readonly AssetLayer[]} layers
	 * @returns {Record<string, AssetLayer[]>}
	 */
	_GroupLayers(layers) {
		/** @type {Record<string, AssetLayer[]>} */
		const ret = {};
		for (const layer of layers) {
			const name = layer.CopyLayerColor ?? layer.Name ?? "";
			ret[name] ??= [];
			ret[name].push(layer);
		}

		for (const layerList of Object.values(ret)) {
			layerList.sort((l1, l2) => {
				const name1 = l1.Name ?? l1.Asset.Name;
				const name2 = l2.Name ?? l2.Asset.Name;
				return name1.localeCompare(name2);
			});
		}
		return ret;
	},

	/**
	 * Return the default `Property.OverridePriority` of the current item.
	 *
	 * This is generally `undefined`, though certain extended item options do overwrite it.
	 * @private
	 * @returns {undefined | AssetLayerOverridePriority}
	 */
	_GetDefaultPriority() {
		if (!this.Item.Property.TypeRecord) {
			return undefined;
		}

		// Recreate the items default state (given a provided type record) and extract its default priority
		/** @type {Item} */
		const item = { Asset: this.Item.Asset };
		ExtendedItemInit(this.Character, item, false, false);
		ExtendedItemSetOptionByRecord(this.Character, item, this.Item.Property.TypeRecord, { push: false, refresh: false });
		return item.Property.OverridePriority;
	},

	/**
	 * Update all input elements and buttons with the passed {@link Layering.Readonly} status.
	 * @param {boolean} isReadonly
	 * @private
	 */
	_ApplyReadonly(isReadonly) {
		const elements = /** @type {HTMLInputElement[]} */([
			...Array.from(document.querySelectorAll("[data-asset-priority]")),
			...Array.from(document.querySelectorAll("[data-layer-priority]")),
		]);

		document.getElementById(this.ID.resetButton)?.setAttribute("aria-disabled", isReadonly);
		for (const e of elements) {
			e.disabled = isReadonly;
		}

		const lockButton = document.getElementById(this.ID.lockButton);
		lockButton.toggleAttribute("hidden", !isReadonly);
	},

	/**
	 * Initialize the layering subscreen
	 * @param {Item} item - The affected item
	 * @param {Character} character - The item's owning character
	 * @param {null | Partial<LayeringDisplay>} display - The shape of the layering subscreen
	 * @param {boolean} reload - Whether we're loading or reloading the screen.
	 * A reload pushes any current changes towards the server and reinitializes all DOM elements.
	 * @returns {HTMLDivElement} The div containing the layering subscreen
	 */
	Init(item, character, display=null, reload=false, readonly=false) {
		if (this.IsActive()) {
			if (reload) {
				this.Exit(true);
			} else {
				console.error('Layering screen is already active; re-initialization requires passing the "reload" parameter');
				return /** @type {HTMLDivElement} */(document.getElementById(this.ID.root));
			}
		}

		this.Item = item;
		this.Item.Property ??= {};
		this.Character = character;
		this.Display = {
			...this.DisplayDefault,
			...(display ?? {}),
		};
		this.Readonly = readonly;
		this.Load();
		return /** @type {HTMLDivElement} */(document.getElementById(this.ID.root));
	},

	/** @type {ScreenLoadHandler} */
	Load() {
		let elem = document.getElementById(this.ID.root);
		if (elem != null) {
			elem.toggleAttribute("hidden", false);
			this.Resize(true);
			return;
		}

		this._PriorityDefault = this._GetDefaultPriority();
		const priorityIsObject = CommonIsObject(this.OverridePriority);

		const layerGroupings = this._GroupLayers(this.Asset.Layer);
		const assetPriority = this.Asset.DrawingPriority ?? this.Asset.Group.DrawingPriority;
		const itemPriority = Number.isInteger(this.OverridePriority) ? /** @type {number} */(this.OverridePriority) : assetPriority;
		const defaultItemPriority = Number.isInteger(this._PriorityDefault) ? /** @type {number} */(this._PriorityDefault) : assetPriority;

		elem = ElementCreate({
			tag: "div",
			attributes: {
				id: this.ID.root,
				["screen-generated"]: CurrentScreen,
				"aria-busy": "true",
			},
			parent: document.body,
			classList: ["HideOnPopup"],
			style: { ["--button-gap"]: `min(${this.Display.buttonGap / 10}vh, ${this.Display.buttonGap / 20}vw)` },
			children: [
				{
					tag: "h1",
					attributes: { id: this.ID.assetHeader },
					children: [InterfaceTextGet("LayeringAsset")],
				},
				ElementMenu.Create(
					this.ID.buttonGrid,
					[
						ElementButton.Create(this.ID.exitButton, () => this.Exit(), { tooltip: InterfaceTextGet("LayeringExit") }),
						ElementButton.Create(this.ID.resetButton, this._ResetClickListener, { tooltip: InterfaceTextGet("LayeringReset") }),
						ElementButton.Create(
							this.ID.hideButton, this._ShowLayersClickListener,
							{ role: "menuitemcheckbox" },
							{
								button: { attributes: { "aria-checked": "true" } },
								tooltip: { children: [
									{ tag: "span", attributes: { id: `${this.ID.hideTooltip}-show` }, children: [InterfaceTextGet("LayeringShow")] },
									{ tag: "span", attributes: { id: `${this.ID.hideTooltip}-hide` }, children: [InterfaceTextGet("LayeringHide")] },
								]},
							},
						),
						ElementButton.Create(
							this.ID.lockButton, () => null, { tooltip: InterfaceTextGet("LayeringLock") },
							{ button: { attributes: { "aria-disabled": "true" } } },
						),
					],
					{ direction: "rtl" },
					{ menu: { classList: ["layering-button-grid"] } },
				),
				{
					tag: "div",
					attributes: { id: this.ID.assetGrid },
					classList: ["layering-pair"],
					children: [
						{
							tag: "input",
							attributes: { type: "number", min: "-99", max: "99", value: itemPriority, defaultValue: defaultItemPriority.toString(), inputMode: "numeric", id: "layering-input-asset" },
							dataAttributes: { assetPriority: defaultItemPriority.toString() },
							classList: priorityIsObject ? ["layering-input-unfocused"] : [],
							eventListeners: {
								input: (event) => this._AssetInputListener(event),
								focus: (event) => /** @type {HTMLInputElement} */(event.target).select(),
								blur: ElementNumberInputBlur,
								wheel: ElementNumberInputWheel,
							},
						},
						{
							tag: "label",
							attributes: { for: "layering-input-asset" },
							classList: ["layering-pair-text"],
							children: [this.Asset.Description],
						},
					],
				},
				{
					tag: "h1",
					attributes: { id: this.ID.layerHeader },
					children: [InterfaceTextGet("LayeringLayer")],
				},
				{
					tag: "div",
					attributes: { id: this.ID.layerDIV },
					classList: ["scroll-box"],
					children: [
						{
							tag: "div",
							attributes: { id: this.ID.layerOuterGrid },
							children: Object.entries(layerGroupings).flatMap(([layerGroupName, layerList]) => {
								return [
									{
										tag: "h2",
										dataAttributes: { layeringGroup: layerGroupName },
										children: [layerGroupName],
									},
									{
										tag: "div",
										classList: ["layering-layer-inner-grid"],
										children: layerList.map((layer) => {
											const name = layer.Name ?? this.Asset.Name;
											/** @type {number} */
											const layerPriority = this.OverridePriority?.[name] ?? layer.Priority;
											/** @type {number} */
											const defaultLayerPriority = this._PriorityDefault?.[name] ?? layer.Priority;
											return {
												tag: "div",
												classList: ["layering-pair"],
												attributes: { hidden: !CharacterAppearanceIsLayerVisible(Layering.Character, layer, layer.Asset, this.Item.Property?.TypeRecord) },
												children: [
													{
														tag: "input",
														attributes: { type: "number", min: "-99", max: "99", value: layerPriority, defaultValue: defaultLayerPriority.toString(), inputMode: "numeric", id: `layering-input-${layerGroupName}-${name}` },
														dataAttributes: { layerPriority: defaultLayerPriority.toString(), name },
														classList: priorityIsObject ? [] : ["layering-input-unfocused"],
														eventListeners: {
															input: (event) => this._LayerInputListener(event),
															focus: (event) => /** @type {HTMLInputElement} */(event.target).select(),
															blur: ElementNumberInputBlur,
															wheel: ElementNumberInputWheel,
														},
													},
													{
														tag: "label",
														attributes: { for: `layering-input-${layerGroupName}-${name}` },
														classList: ["layering-pair-text"],
														children: [name],
													},
												],
											};
										}),
									},
								];
							}),
						},
					],
				},
			],
		});

		// Load and set all translated text
		TextCache.buildAsync(`Assets/${this.Character.AssetFamily}/LayerNames.csv`).then((cache) => {
			const headers = /** @type {NodeListOf<HTMLHeadingElement>} */(document.querySelectorAll("[data-layering-group]"));
			headers.forEach(h => {
				const key = `${this.Asset.DynamicGroupName}${this.Asset.Name}${h.dataset.layeringGroup}`;
				h.innerText = cache.cache[key] ?? (h.dataset.layeringGroup || this.Asset.Description);
			});

			elem.setAttribute("aria-busy", "false");
		});

		this.Resize(true);
		this._ApplyReadonly(this.Readonly);
	},

	/**
	 * Can be also be used, alternatively, as a {@link ScreenFunctions.Draw} function
	 * @type {ScreenResizeHandler}
	 */
	Resize(load) {
		ElementPositionFix(this.ID.root, 0, this.Display.x, this.Display.y, this.Display.w, this.Display.h);
	},

	/** @type {ScreenUnloadHandler} */
	Unload() {
		// Need the null check here due to `CommonSetScreen` calling `Unload` after `Exit`
		document.getElementById(this.ID.root)?.toggleAttribute("hidden", true);
	},

	/**
	 * @satisfies {ScreenExitHandler}
	 * @param {boolean} reload - Whether the exit call is part of a reload (see {@link Layering.Init})
	 */
	Exit(reload=false) {
		ElementRemove(this.ID.root);
		ChatRoomCharacterItemUpdate(this.Character, this.Asset.Group.Name);
		if (this.Character.IsPlayer()) {
			ServerPlayerAppearanceSync();
		}

		if (!reload) {
			this._ExitCallbacks.forEach(func => func(CurrentScreen, this.Character, this.Item));
		}

		this.Item = null;
		this.Character = null;
		this.Display = null;
		this._Readonly = false;
		this._PriorityDefault = undefined;
	},

	/**
	 * Register screen-specific callbacks to-be executed after calling {@link Layering.Exit}.
	 *
	 * Callbacks registered herein must be used _exclusively_ for setting up the next screen, and not for tearing down the layering sub screen.
	 * As such, they are ignored when performing a reload of the layering sub screen (see {@link Layering.Init})
	 * @param {readonly LayeringExitOptions[]} options
	 */
	RegisterExitCallbacks(...options) {
		for (let { screen, callback } of options) {
			if (screen) {
				callback ??= CommonNoop;
				this._ExitCallbacks.push((currentScreen, ...args) => currentScreen === screen ? callback(...args) : undefined);
			} else if (callback) {
				this._ExitCallbacks.push((currentScreen, ...args) => callback(...args));
			}
		}
	},
};

Layering.RegisterExitCallbacks(
	{
		screen: "Crafting",
		callback: (C, item) => {
			CraftingSelectedItem.ItemProperty.OverridePriority = item.Property.OverridePriority;
			CraftingModeSet("Name");
		},
	},
	{
		callback: () => DialogMenuMode === "layering" ? DialogChangeMode("items") : undefined,
	},
	{
		screen: "Shop2",
		callback: () => {
			Shop2Vars.Mode = "Preview";
			Shop2Load();
		},
	},
);

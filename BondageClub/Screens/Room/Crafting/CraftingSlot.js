"use strict";

/** Namespace for managing the various crafting `Slots`-related modes */
var CraftingSlots = {
	/**
	 * @private
	 * @readonly
	 * @type {Map<"scroll", IntersectionObserver>}
	 */
	_observers: new Map,

	/**
	 * @readonly
	 * @satisfies {Record<string, (this: HTMLElement, ev: Event) => any>}
	 */
	eventListeners: {
		/**
		 * Exit. Just exit.
		 * @type {(this: HTMLButtonElement, ev: PointerEvent) => void}
		 */
		clickExit: function (ev) {
			CraftingExit(false);
		},

		/**
		 * Open the crafting JSON import modal
		 * @type {(this: HTMLButtonElement, ev: PointerEvent) => void}
		 */
		clickUpload: function (ev) {
			const { dialog } = CraftingJSON.createDialog(document.body);
			CraftingResize(true);
			dialog.showModal();
		},

		/**
		 * Download/export all crafts to JSON
		 * @type {(this: HTMLButtonElement, ev: PointerEvent) => void}
		 */
		clickDownload: function (ev) {
			const href = URL.createObjectURL(new Blob(
				[JSON.stringify(CraftingJSON.encode(Player.Crafting), null, 4)],
				{ type: "application/json" },
			));
			const date = new Date();
			const download = ElementCreate({
				tag: "a",
				parent: document.body,
				attributes: {
					href,
					hidden: true,
					download: `craft${Player.MemberNumber}-${date.getFullYear()}-${date.getMonth().toString().padStart(2, "0")}-${date.getDay().toString().padStart(2, "0")}.json`
				},
			});
			download.click();
			download.remove();
			URL.revokeObjectURL(href);
		},

		/**
		 * Listener for the `Slot` crafting mode; opens the `Name` mode for item creation/modification.
		 *
		 * See {@link CraftingSlots._getMultiSelectListeners} for the `Delete` & `Reorder` analog.
		 * @type {(this: HTMLButtonElement, ev: PointerEvent) => void}
		 */
		clickSlot: function (ev) {
			CraftingSlot = Number.parseInt(this.getAttribute("data-index") || "NaN", 10);
			if (Number.isNaN(CraftingSlot)) {
				ev.stopImmediatePropagation();
				return;
			}

			const craftItem = Player.Crafting[CraftingSlot];
			if (craftItem) {
				CraftingSelectedItem = CraftingConvertItemToSelected(craftItem);
			} else {
				CraftingSelectedItem = {
					Name: "",
					Description: "",
					DifficultyFactor: 0,
					Color: "Default",
					Assets: [],
					get Asset() {
						return this.Assets[0];
					},
					Effects: {},
					Lock: null,
					Private: false,
					TypeRecord: null,
					ItemProperty: {},
					get OverridePriority() {
						return this.ItemProperty.OverridePriority;
					},
					set OverridePriority(value) {
						if (value == null) {
							delete this.ItemProperty.OverridePriority;
						} else {
							this.ItemProperty.OverridePriority = value;
						}
					},
				};
			}
			CraftingModeSet("Name");
		},

		/**
		 * Accept a mode specific change for the `Delete` mode
		 * @type {(this: HTMLButtonElement, ev: PointerEvent) => void}
		 */
		clickModeAcceptSlotDelete: function (ev) {
			/** @type {HTMLButtonElement[] | NodeListOf<HTMLButtonElement>} */
			const deleteList = this.closest(".screen")?.querySelectorAll(".crafting-slot-button[aria-checked='true']") ?? [];
			const indexList = Array.from(deleteList).map(el => Number.parseInt(el.getAttribute("data-index") || "NaN", 10));
			if (indexList.includes(NaN)) {
				CraftingModeSet("Slot");
				return;
			}

			const craftsBackup = [...Player.Crafting];
			let nChanges = 0;
			for (const index of indexList) {
				if (Player.Crafting[index] != null) {
					Player.Crafting[index] = null;
					nChanges++;
				}
			}
			if (!CommonArraysEqual(craftsBackup, Player.Crafting)) {
				CraftingSaveServer();
				ToastManager.info(
					TextGet("ModeDeleteSuccess").replace("{nItems}", nChanges.toString()),
					{ duration: 2000, icon: "../Icons/Crafting.png", iconColor: "white" },
				);

				// Reset the list of search suggestions
				/** @type {null | undefined | HTMLInputElement} */
				const searchInput = this.closest(".screen")?.querySelector("input[type='search'][name='slot-search']");
				searchInput?.list?.replaceChildren();
			} else {
				ToastManager.info(
					TextGet("ModeDeleteFail"),
					{ duration: 2000, icon: "../Icons/Crafting.png", iconColor: "white" },
				);
			}
			CraftingModeSet("Slot");
		},

		/**
		 * Accept a mode specific change for the `Reorder` mode
		 * @type {(this: HTMLButtonElement, ev: PointerEvent) => void}
		 */
		clickModeAcceptSlotReorder: function (ev) {
			const moveList = this.closest(".screen")?.querySelectorAll(".crafting-slot-button") ?? [];
			const indexList = Array.from(moveList).map(el => Number.parseInt(el.getAttribute("data-index") || "NaN", 10));
			if (indexList.includes(NaN)) {
				CraftingModeSet("Slot");
				return;
			}

			const craftsBackup = [...Player.Crafting];
			let nChanges = 0;
			Player.Crafting = Array(craftsBackup.length).fill(null);
			for (const [indexNew, indexOld] of indexList.entries()) {
				if (indexNew !== indexOld && Player.Crafting[indexNew] != craftsBackup[indexOld]) {
					nChanges++;
				}
				Player.Crafting[indexNew] = craftsBackup[indexOld] ?? null;
			}
			if (!CommonArraysEqual(craftsBackup, Player.Crafting)) {
				CraftingSaveServer();
				ToastManager.info(
					TextGet("ModeReorderSuccess").replace("{nItems}", nChanges.toString()),
					{ duration: 2000, icon: "../Icons/Crafting.png", iconColor: "white" },
				);
			} else {
				ToastManager.info(TextGet("ModeReorderFail"), { duration: 2000, icon: "../Icons/Crafting.png", iconColor: "white" });
			}
			CraftingModeSet("Slot");
		},

		/**
		 * Collapse a section/page
		 * @type {(this: HTMLButtonElement, ev: PointerEvent) => void}
		 */
		clickSectionCollapse: function (ev) {
			const expand = this.getAttribute("aria-expanded") === "true";
			ElementUnpackIDs.fromAttribute(this, "aria-controls").forEach(el => el.toggleAttribute("hidden", !expand));
		},

		/**
		 * Hide/show crafts based on whether their text content matches the search value
		 * @type {(this: HTMLInputElement, ev: Event) => void}
		 */
		inputSearch: function (ev) {
			const query = this.value.toLowerCase().normalize().split(" ").map(i => i.trim()).filter(Boolean);
			const main = this.closest(".screen")?.querySelector(".screen-main");
			for (const button of (main?.querySelectorAll(".crafting-slot-button") ?? [])) {
				const textContent = button.textContent.toLowerCase().normalize();
				button.closest("li")?.toggleAttribute("hidden", !query.every(i => textContent.includes(i)));
			}
		},

		/**
		 * Blur the input search and uncollapse + scroll to any matched craft
		 * @type {(this: HTMLInputElement, ev: KeyboardEvent) => void}
		 */
		keydownSearch: function (ev) {
			if (CommonKey.IsPressed(ev, "Enter")) {
				// Uncollapse any section with a match
				const main = this.closest(".screen")?.querySelector(".screen-main");
				if (!main) {
					return;
				}

				for (const section of (main.querySelectorAll("section") ?? [])) {
					/** @type {null | HTMLButtonElement} */
					const sectionCollapser = section.querySelector("header button[aria-expanded='false']");
					if (sectionCollapser && section.querySelector(".crafting-slot-ul > li:not([hidden])")) {
						sectionCollapser.click();
					}
				}

				// Scroll to the closest match if none is in view
				const hits = main.querySelectorAll(".crafting-slot-ul > li:not([hidden])") ?? [];
				if (!Array.from(hits).some(i => CraftingSlots._isElementVisible(i, main))) {
					hits[0]?.scrollIntoView({ behavior: "instant" });
				}

				// Need to stop the propagation in order to prevent a new `focus` event from immediately firing.
				// Namely, enter key presses with no focused element would _normally_ trigger a search input focus via `CommonKey.InputKeyDown`
				ev.stopPropagation();
				this.blur();
			}
		},

		/**
		 * Switch mooooode
		 * @type {(this: HTMLSelectElement, ev: Event) => void}
		 */
		changeModeSelect: function(ev) {
			CraftingModeSet(/** @type {CraftingMode} */(this.value));
		},

		/**
		 * Add the `move` dropeffect whole drag-and-dropping
		 * @type {(this: HTMLFieldSetElement, ev: DragEvent) => void}
		 */
		dragover: function(ev) {
			if (CraftingMode !== "Reorder") {
				return;
			}
			ev.preventDefault();
			if (ev.dataTransfer) {
				ev.dataTransfer.dropEffect = "move";
			}
		},

		/**
		 * Drop the dragged content, reordering the crafted item list
		 * @type {(this: HTMLFieldSetElement, ev: DragEvent) => void}
		 */
		drop: function(ev) {
			if (CraftingMode !== "Reorder") {
				return;
			}
			ev.preventDefault();

			// Grab all checked <li> slots
			const draggedSources = Array.from(this.querySelectorAll(".crafting-slot-button[aria-checked='true']")).map(e => e.closest("li")).filter(li => li != null);
			const dropTarget = ev.target instanceof Element && ev.target.closest("li");
			if (!dropTarget) {
				ev.stopImmediatePropagation();
				return;
			}

			// Abort if the dragged content is dropped on whichever button was initially clicked in `dragstart`
			const dataTransferID = ev.dataTransfer?.getData("application/my-app");
			const dragstartSource = dataTransferID ? document.getElementById(dataTransferID)?.closest("li") : null;
			if (!dragstartSource || dragstartSource === dropTarget) {
				ev.stopImmediatePropagation();
				return;
			}

			// Make sure that the initially dragged button is always included, even when lacking `[aria-checked='true']`
			if (!draggedSources.includes(dragstartSource)) {
				draggedSources.splice(0, 0, dragstartSource);
			}

			// Construct a flattened, newly reordered list of <li> slots
			/** @type {HTMLElement[]} */
			const newLIList = [];
			/** @type {NodeListOf<HTMLLIElement>} */
			const OldLIList = this.querySelectorAll(".crafting-slot-ul > li");
			for (const li of OldLIList) {
				if (!draggedSources.includes(li)) {
					newLIList.push(li);
				}
				if (li === dropTarget) {
					 // insert to either the left or the right of the drop target
					if (dropTarget.getAttribute("data-hover") === "right") {
						newLIList.push(...draggedSources);
					} else {
						newLIList.splice(newLIList.length - 1, 0, ...draggedSources);
					}
				}
			}

			// Unflatten the <li> list, inserting them back into the <ul> elements
			let offset = 0;
			for (const [_i, ul] of this.querySelectorAll(".crafting-slot-ul").entries()) {
				const nItems = ul.children.length;
				ul.replaceChildren(...newLIList.slice(offset, offset + nItems));
				offset += nItems;
			}

			// Update the displayed number of reordered crafts
			let nReorders = 0;
			for (const [indexNew, button] of this.querySelectorAll(".crafting-slot-button").entries()) {
				const indexOld = Number.parseInt(button.getAttribute("data-index") || "NaN", 10);
				if (indexOld !== indexNew) {
					nReorders += 1;
				}
			}
			this.closest(".screen")?.querySelector("h1 > code")?.replaceChildren(nReorders.toString());

			// Uncheck all moved crafts
			draggedSources.forEach(li => li.querySelector("[aria-checked='true']")?.setAttribute("aria-checked", "false"));
		},

		/**
		 * Clear any remaining drop target markers
		 * @type {(this: HTMLElement, ev: DragEvent) => void}
		 */
		dragend: function(ev) {
			if (CraftingMode !== "Reorder") {
				return;
			}
			this.querySelectorAll(".crafting-slot-ul > li[data-hover]").forEach(e => e.removeAttribute("data-hover"));
			document.getElementById(CraftingSlots.ids.dragImage)?.remove();
		},

		/** @type {(this: HTMLDivElement, ev: DragEvent) => void} */
		dragstart: function(ev) {
			if (!ev.dataTransfer) {
				return;
			}

			// Grab all item images that will be used for constructing a dedicated `DataTransfer.setDragImage` image
			const images = Array.from(document.querySelectorAll(".crafting-slot-button[aria-checked='true'] > img.button-image:not([data-hidden])"));

			const thisButton = this.closest(".crafting-slot-button");
			if (thisButton && thisButton?.getAttribute("aria-checked") !== "true") {
				const buttonImg = thisButton.querySelector("img.button-image:not([data-hidden])");
				if (buttonImg) {
					images.splice(0, 0, buttonImg);
				}
			}

			// Got to put this image in the document body somewhere for this to work
			const dragImage = ElementCreate({
				tag: "div",
				attributes: { id: CraftingSlots.ids.dragImage, "aria-hidden": "true", inert: true },
				classList: ["crafting-image-stack"],
				parent: document.body,
				children: images.slice(0, 10).map((_img, i) => {
					const img = ElementCreate({ tag: "img", attributes: { src: _img.getAttribute("src") } });
					img.style.zIndex = (10 - i).toString();
					img.style.left = `calc(${i} * min(2vh, 1vw))`;
					img.style.top = `calc(${i} * min(1vh, 0.5vw))`;
					return img;
				}),
			});

			ev.dataTransfer.setDragImage(dragImage, 0, 0);
			ev.dataTransfer.setData("application/my-app", this.closest(".crafting-slot-button")?.id ?? "");
			ev.dataTransfer.effectAllowed = "move";
		},

		/**
		 * Set the drop target marker
		 * @type {(this: HTMLLIElement, ev: DragEvent) => void}
		 * */
		dragenter: function(ev) {
			const liRect = this.getBoundingClientRect();
			const hoverDirection = ev.clientX <= (liRect.x + liRect.width / 2) ? "left" : "right";
			this.setAttribute("data-hover", hoverDirection);
		},

		/**
		 * Clear the drop target marker
		 * @type {(this: HTMLLIElement, ev: DragEvent) => void}
		 */
		dragleave: function(ev) {
			if (ev.relatedTarget instanceof Node && !this.contains(ev.relatedTarget)) {
				this.removeAttribute("data-hover");
			}
		},
	},

	/**
	 * @readonly
	 * @satisfies {Record<string, string>}
	 */
	ids: /** @type {const} */({
		root: "crafting-slot-screen",
		dragImage: "crafting-slot-drag-image",
	}),

	/**
	 * An object for registering all crafting slot modes
	 * @readonly
	 * @type {CraftingSlotModeData}
	 */
	modeData: {
		Slot: {
			/** @type {CraftingSlotsMode.Callback} */
			callback: function (crafts) {
				crafts.forEach(({ button }) => {
					button.addEventListener("click", CraftingSlots.eventListeners.clickSlot);
				});
				return {
					heading: TextGet("SelectSlot"),
					modeAcceptTooltip: TextSubstitute(
						"ModeAcceptSlot",
						{
							"{br}": ElementCreate({ tag: "br" }),
							"{click}": ElementCreate({ tag: "kbd", children: [TextGet("TermMouseClick")] }),
						},
					),
				};
			},
		},
		Reorder: {
			/** @type {CraftingSlotsMode.Callback} */
			callback: function (crafts) {
				crafts.forEach(({ button, multiSelectListeners }) => {
					ElementButton.SetRole(button, "checkbox");
					button.addEventListener("click", multiSelectListeners.click);
					button.addEventListener("focus", multiSelectListeners.focus);

					// Put the draggable area in a button child (spanning the entire width and height of the button) rather than the button itself
					// Why? Because firefox does not support draggable <button> elements, so this is a plan B
					button.append(
						ElementCreate({
							tag: "div",
							attributes: { draggable: "true" },
							dataAttributes: { hover: "left" },
							classList: ["crafting-draggable"],
							eventListeners: { dragstart: CraftingSlots.eventListeners.dragstart },
						}),
						ElementCreate({
							tag: "div",
							attributes: { draggable: "true" },
							dataAttributes: { hover: "right" },
							classList: ["crafting-draggable"],
							eventListeners: { dragstart: CraftingSlots.eventListeners.dragstart },
						}),
					);

					// Allow the parent <li> element to be valid drop targets
					// Those are little bit bigger than the buttons themselves; makes it easier to target them
					button.closest("li")?.addEventListener("dragenter", CraftingSlots.eventListeners.dragenter);
					button.closest("li")?.addEventListener("dragleave", CraftingSlots.eventListeners.dragleave);
				});
				return {
					modeAcceptListener: CraftingSlots.eventListeners.clickModeAcceptSlotReorder,
					modeAcceptQuestionColor: "yellow",
					modeAcceptImgSrc: "./Icons/Swap.png",
					modeAcceptTooltip: TextSubstitute(
						"ModeAcceptReorder",
						{
							"{br}": ElementCreate({ tag: "br" }),
							"{click}": ElementCreate({ tag: "kbd", children: [TextGet("TermMouseClick")] }),
							"{shift}": ElementCreate({ tag: "kbd", children: [TextGet("TermShift")] }),
						},
					),
					heading: TextSubstitute(
						"SelectReorder",
						{ "{n}": ElementCreate({ tag: "code", children: ["0"] }) },
					),
				};
			},
		},
		Delete: {
			/** @type {CraftingSlotsMode.Callback} */
			callback: function (crafts) {
				crafts.forEach(({ craft, button, multiSelectListeners }) => {
					ElementButton.SetRole(button, "checkbox");
					button.addEventListener("click", multiSelectListeners.click);
					button.addEventListener("focus", multiSelectListeners.focus);
					button.disabled = craft == null;
				});
				return {
					modeAcceptListener: CraftingSlots.eventListeners.clickModeAcceptSlotDelete,
					modeAcceptQuestionColor: "pink",
					modeAcceptImgSrc: "./Icons/Trash.png",
					modeAcceptTooltip: TextSubstitute(
						"ModeAcceptDelete",
						{
							"{br}": ElementCreate({ tag: "br" }),
							"{permanent}": ElementCreate({ tag: "em", children: [TextGet("TermPermanent")] }),
							"{click}": ElementCreate({ tag: "kbd", children: [TextGet("TermMouseClick")] }),
							"{shift}": ElementCreate({ tag: "kbd", children: [TextGet("TermShift")] }),
						},
					),
					heading: TextSubstitute(
						"SelectDelete",
						{ "{n}": ElementCreate({ tag: "code", children: ["0"] }) },
					),
				};
			},
		},
	},

	/**
	 * Get a set of all registered crafting slot modes.
	 * @type {ReadonlySet<CraftingSlotModes>}
	 */
	get modeKeys() {
		return new Set(CommonKeys(CraftingSlots.modeData));
	},

	/**
	 * Construct click listeners for the crafting slot buttons in the `Delete` & `Reorder` modes.
	 *
	 * See {@link CraftingSlots.eventListeners.clickSlot} for the `Slot`.
	 * @private
	 * @param {CraftingSlotModes} mode
	 */
	_getMultiSelectListeners: function _getMultiSelectListeners(mode) {
		/** @type {null | HTMLElement} */
		let prevFocus = null;

		/** @type {(this: HTMLButtonElement, ev: FocusEvent) => void} */
		function focus(ev) {
			prevFocus = (ev.relatedTarget instanceof HTMLElement && ev.relatedTarget.matches(".crafting-slot-button")) ? ev.relatedTarget : null;
		}

		/** @type {(this: HTMLButtonElement, ev: PointerEvent) => void} */
		function click(ev) {
			if (ev.shiftKey && prevFocus) {
				const buttons = Array.from(this.closest("fieldset[name='crafting-slot']")?.querySelectorAll(".crafting-slot-button") ?? []);
				let start = 0;
				let end = buttons.length - 1;
				for (const [j, elem] of buttons.entries()) {
					if (elem === prevFocus) {
						start = j;
					}
					if (elem === this) {
						end = j;
					}
				}

				const buttonsSubset = (start > end) ? buttons.slice(end + 1, start + 1) : buttons.slice(start, end);
				for (const button of buttonsSubset) {
					if (!(button.hasAttribute("disabled") || button.getAttribute("aria-disabled") === "true")) {
						button.setAttribute("aria-checked", this.getAttribute("aria-checked") || "false");
					}
				}
			}
			this.focus();

			// Update the main header with the current amount of selected to-be deleted crafts
			if (mode === "Delete") {
				const nChecked = this.closest("fieldset[name='crafting-slot']")?.querySelectorAll(".crafting-slot-button[aria-checked='true']")?.length ?? 0;
				this.closest(".screen")?.querySelector("h1 > code")?.replaceChildren(nChecked.toString());
			}
		}
		return { click, focus };
	},

	/**
	 * Check wether an element is fully vissible within its parent
	 * @private
	 * @param {Element} el
	 * @param {Element} parent
	 * @returns {boolean}
	 */
	_isElementVisible: function _isElementVisible(el, parent) {
		const rect = el.getBoundingClientRect();
		return (rect.top >= 0) && (rect.bottom <= parent.clientHeight);
	},

	/**
	 * Construct a single crafting slot `<section>` header or, if it already exists, clear if of existing slot buttons
	 * @private
	 * @param {number} pageIndex - The (0-based) index of the item page as represented by the `<section>`
	 * @param {{ craftsPerPage: number, nCrafts: number }} options
	 * @returns {{ section: HTMLElement, list: HTMLUListElement }} The section and the button list embedded therein
	 */
	_createButtonSection: function _createButtonSection(pageIndex, options) {
		const { nCrafts, craftsPerPage } = options;
		const sectionID = `crafting-slot-section-${Math.floor(pageIndex / craftsPerPage)}`;
		let section = document.getElementById(sectionID);
		if (section) {
			/** @type {null | HTMLUListElement} */
			let list = section.querySelector("ul.crafting-slot-ul");
			if (list) {
				list.replaceChildren();
			} else {
				list = ElementCreate({
					tag: "ul",
					attributes: { id: ElementGenerateID() },
					classList: ["crafting-slot-ul"],
				});
				section.append(list);
				section.querySelector("header > [aria-expanded]")?.setAttribute("aria-controls", list.id);
			}
			return { list, section };
		} else {
			const pageLabel = TextGet("Page");
			const headingID = `crafting-page-${Math.floor(pageIndex / craftsPerPage)}`;
			const list = ElementCreate({
				tag: "ul",
				attributes: { id: ElementGenerateID() },
				classList: ["crafting-slot-ul"],
			});
			section = ElementCreate({
				tag: "section",
				attributes: { "aria-labelledby": headingID, id: sectionID },
				children: [
					{
						tag: "header",
						children: [
							ElementButton.Create(
								null,
								CraftingSlots.eventListeners.clickSectionCollapse,
								{ noStyling: true, role: "checkbox" },
								{
									button: {
										classList: ["crafting-slot-collapser"],
										attributes: { "aria-label": `Collapse page`, "aria-checked": "true", "aria-expanded": "true", "aria-controls": list.id },
									},
								},
							),
							{
								tag: "a",
								children: [{ tag: "h2", children: [`${pageLabel} ${1 + Math.floor(pageIndex / craftsPerPage)} / ${nCrafts / craftsPerPage}`], attributes: { id: headingID } }],
								attributes: { href: `#${headingID}` },
							},
						],
					},
					list,
				],
			});
			return { list, section };
		}
	},

	/**
	 * Construct all the various crafting slot `<section>`s, each representing a single "page".
	 * @private
	 * @param {CraftingSlotModes} mode
	 * @param {null | { craftsPerPage?: number }} options
	 * @returns {{ sections: HTMLElement[], modeArgs: CraftingSlotsMode.Args[] }}
	 */
	_createButtonAllSections: function _createButtonAllSections(mode, options=null) {
		/** @type {CraftingSlotsMode.Args[]} */
		const modeArgs = [];
		/** @type {HTMLElement[]} */
		const sections = [];
		/** @type {HTMLUListElement} */
		let list;
		const craftsPerPage = options?.craftsPerPage ?? 20;
		const multiSelectListeners = CraftingSlots._getMultiSelectListeners(mode);
		for (const [i, craft] of Player.Crafting.entries()) {
			if (i % craftsPerPage === 0) {
				const sectionElems = CraftingSlots._createButtonSection(i, { craftsPerPage, nCrafts: Player.Crafting.length });
				list = sectionElems.list;
				sections.push(sectionElems.section);
			}

			/** @type {HTMLButtonElement} */
			let button;
			const asset = craft ? CraftingAssets[craft.Item]?.[0] : undefined;
			if (craft && asset) {
				const item = { Asset: asset, Craft: craft };
				button = ElementButton.CreateForAsset(
					null, item, null, null,
					{ labelPosition: "right", },
					{ button: { classList: ["crafting-slot-button"], dataAttributes: { index: i } }},
				);
			} else {
				button = ElementButton.Create(
					null, null, {
						label: ElementCreate({ tag: "i", children: [TextGet("EmptySlot")] }),
						labelPosition: "right",
						image: "./Icons/NoCraft.png",
					},
					{ button: { classList: ["crafting-slot-button"], dataAttributes: { index: i } }},
				);
			}

			// @ts-ignore: list _is_ in fact assigned during the `i == 0` loop
			list.append(ElementCreate({ tag: "li", children: [button] }));
			modeArgs.push({ craft, button, multiSelectListeners });
		}
		return { sections, modeArgs };
	},

	/**
	 * @private
	 * @param {CraftingSlotModes} mode
	 * @param {readonly CraftingSlotsMode.Args[]} modeArgs
	 */
	_applyModeData: function _applyModeData(mode, modeArgs) {
		const rootID = CraftingSlots.ids.root;
		const modeButtonOld = document.querySelector(`#${rootID} button[name='mode-accept']`);
		/** @type {null | HTMLSelectElement} */
		const modeSelect = document.querySelector(`#${rootID} select[name='mode-select']`);
		const fieldset = document.querySelector(`#${rootID} fieldset[name='crafting-slot']`);
		const heading = document.querySelector(`#${rootID} h1`);
		if (!modeButtonOld || !heading || !modeSelect || !fieldset) {
			return;
		}

		const modeResult = CraftingSlots.modeData[mode].callback(modeArgs);
		const modeButtonNew = ElementButton.Create(
			null,
			modeResult.modeAcceptListener ?? null,
			{
				image: modeResult.modeAcceptImgSrc ?? "./Icons/Crafting.png",
				tooltip: modeResult.modeAcceptTooltip,
				tooltipPosition: "right",
				name: "mode-accept",
			},
			{ button: {
				attributes: { "aria-disabled": modeResult.modeAcceptListener == null ? "true" : "false" },
				children: [{
					tag: "div",
					classList: ["question-div"],
					attributes: { "aria-hidden": "true" },
					style: { "background-color": modeResult.modeAcceptQuestionColor ?? "white" },
				}],
			}},
		);
		fieldset.setAttribute("aria-describedby", modeButtonNew.querySelector(".button-tooltip")?.id ?? "");
		modeButtonOld.replaceWith(modeButtonNew);
		heading.replaceChildren(...(CommonIsArray(modeResult.heading) ? modeResult.heading : [modeResult.heading]));
		modeSelect.value = mode;
	},

	/**
	 * Use {@link CraftingModeSet} instead.
	 * @private
	 * @param {CraftingSlotModes} mode
	 */
	_changeMode: function _changeMode(mode) {
		const root = document.getElementById(CraftingSlots.ids.root);
		if (!root) {
			return;
		}

		root.setAttribute("aria-busy", "true");
		const { sections, modeArgs } = CraftingSlots._createButtonAllSections(mode);
		root.toggleAttribute("hidden", false);
		root.setAttribute("data-mode", mode);
		root.querySelector(".screen-main > fieldset[name='crafting-slot']")?.replaceChildren(...sections);
		CraftingSlots._applyModeData(mode, modeArgs);
		root.removeAttribute("aria-busy");
		CraftingResize(false);
	},

	/**
	 * Construct a crafting Slots-esque screen
	 * @param {null | { id?: string, mode?: CraftingSlotModes, craftsPerPage?: number }} options Various options
	 * @returns {{ screen: HTMLElement, observer: IntersectionObserver }} The screen and its intersection observer as used for the nav bar
	 */
	createScreen: function createScreen(options=null) {
		options ??= {};
		const rootID = options.id ?? CraftingSlots.ids.root;
		const { modeArgs, sections } = CraftingSlots._createButtonAllSections(options.mode ?? "Slot");

		// Construct the main screen
		const screen = ElementDOMScreen.getTemplate(rootID, {
			parent: document.body,
			hgroupInHeader: true,
			menubarButtons: [
				ElementButton.Create(
					null, CraftingSlots.eventListeners.clickExit,
					{ tooltip: TextGet("Exit"), tooltipPosition: "left", image: "./Icons/Exit.png", name: "exit" },
				),
				ElementButton.Create(
					null, CraftingSlots.eventListeners.clickUpload,
					{ tooltip: TextGet("JSONUpload"), tooltipPosition: "left", image: "./Icons/Upload.png", name: "upload" }
				),
				ElementButton.Create(
					null, CraftingSlots.eventListeners.clickDownload,
					{ tooltip: TextGet("JSONDownload"), tooltipPosition: "left", image: "./Icons/Download.png", name: "download" },
				),
				ElementCreateSearchInput(
					null,
					(input) => {
						/** @type {Set<string>} */
						const labels = new Set;
						const buttonLabels = input.closest(".screen")?.querySelectorAll(".crafting-slot-button[name] .button-label");
						buttonLabels?.forEach(el => labels.add(CommonCapitalize(el.textContent)));
						return Array.from(labels).sort();
					},
					{
						placeholder: TextGet("FilterCrafts"),
						name: "slot-search",
						onInput: CraftingSlots.eventListeners.inputSearch,
						onKeydown: CraftingSlots.eventListeners.keydownSearch,
					},
				),
			],
			mainContent: [
				ElementCreate({
					tag: "fieldset",
					children: sections,
					attributes: { "aria-labelledby": `${rootID}-h1`, name: "crafting-slot" },
					eventListeners: {
						dragover: CraftingSlots.eventListeners.dragover,
						drop: CraftingSlots.eventListeners.drop,
					},
				}),
			],
			leftContent: [
				// Add a nav bar for easy switching between crafting pages
				{
					tag: "nav",
					children: [
						{
							tag: "ul",
							children: sections.map((el, i) => {
								const h2 = el.querySelector("h2");
								if (!h2) {
									return null;
								}
								return { tag: "li", children: [{ tag: "a", attributes: { href: `#${h2.id}` }, children: [(1 + i).toString().padStart(2, " ")] }] };
							}),
						},
					],
				},
			],
		});
		screen.addEventListener("dragend", CraftingSlots.eventListeners.dragend);
		screen.setAttribute("data-mode", options.mode ?? "Slot");

		const screenMain = screen.querySelector(".screen-main");
		const screenHeader = screen.querySelector(".screen-header");
		const aside = screen.querySelector(".screen-aside-l");
		if (!screenMain || !screenHeader || !aside) {
			throw new Error();
		}

		aside.classList.add("scroll-box");

		// Rearrange header/heading elements and append the header with a few more buttons and inputs
		const selectLabelID = ElementGenerateID();
		const dropdownOptions = [
			{ attributes: { label: TextGet("LabelSelectCraft"), value: "", disabled: true, id: selectLabelID } },
			{ tag: "hr" },
			...CommonEntries(CraftingSlots.modeData).map(([key, data]) => {
				const label = data.selectLabel ??= TextGet(`Label${key}`);
				return { attributes: { label, value: key, selected: key === "Slot" } };
			}),
		];

		screenHeader.append(
			ElementCreate({
				tag: "div",
				attributes: { role: "group" },
				children: [
					ElementCreateDropdown(
						null,
						dropdownOptions,
						CraftingSlots.eventListeners.changeModeSelect,
						{ required: true, name: "mode-select" },
						{ "select": { attributes: { "aria-labelledby": selectLabelID } } },
					),
					// Button is properly initialized in down below via `CraftingSlots._applyModeData()`
					ElementButton.Create(null, null, { name: "mode-accept" }),
				],
			}),
		);
		CraftingSlots._applyModeData(options.mode ?? "Slot", modeArgs);

		// Highlight a page entry in the nav bar whenever its respective section comes (partially) into view
		const observer = new IntersectionObserver(
			(entries) => {
				const navList = screen.querySelector("aside ul");
				for (const entry of entries) {
					const heading = entry.target.querySelector("h2");
					const anchor = navList?.querySelector(`a[href="#${heading?.id}"]`);
					if (!anchor) {
						continue;
					}

					anchor.setAttribute("aria-current", entry.isIntersecting ? "true" : "false");
					if (entry.isIntersecting) {
						anchor.scrollIntoView({ behavior: "smooth", block: "nearest" });
					}
				}
			},
			{ root: screenMain, threshold: 0.1 },
		);
		sections.forEach(el => observer.observe(el));
		return { screen, observer };
	},

	/** @type {ScreenLoadHandler} */
	Load: async function Load() {
		// Pad the crafting array if it is too short
		let nCrafts = 200;
		if (Player.Crafting.length < nCrafts) {
			nCrafts -= Player.Crafting.length;
			Player.Crafting.push(...Array(nCrafts).fill(null));
		}

		const mode = CraftingMode in CraftingSlots.modeData ? /** @type {CraftingSlotModes} */(CraftingMode) : "Slot";

		// Check if we're doing a reload
		const root = document.getElementById(CraftingSlots.ids.root);
		if (root) {
			root.hidden = false;
			CraftingSlots._changeMode(mode);
			return;
		}

		const { observer } = CraftingSlots.createScreen({ id: CraftingSlots.ids.root, mode });
		CraftingSlots._observers.get("scroll")?.disconnect();
		CraftingSlots._observers.set("scroll", observer);
	},

	/** @type {ScreenResizeHandler} */
	Resize: function Resize() {
		ElementPositionFixed(CraftingSlots.ids.root, 0, 0, 2000, 1000);
	},

	/**
	 * @satisfies {ScreenExitHandler}
	 * @param {boolean} [allowDeselect] - Whether exit calls are allowed to clear the current selection in `Delete` and `Reorder`, rather than always exiting the screen
	 * @returns {boolean} Whether a deselect-esque action was actually performed
	 */
	Exit: function Exit(allowDeselect=true) {
		if (allowDeselect) {
			const rootID = CraftingSlots.ids.root;
			const selected = document.querySelectorAll(`#${rootID} .crafting-slot-button[aria-checked='true']`);
			if (selected.length) {
				selected.forEach(e => e.setAttribute("aria-checked", "false"));
				if (CraftingMode === "Delete") {
					document.querySelector(`#${rootID} h1 > code`)?.replaceChildren("0");
				}
				return true;
			} else if (CraftingMode !== "Slot") {
				CraftingModeSet("Slot");
				return true;
			}
		}

		CraftingSlots._observers.forEach(observer => observer.disconnect());
		CraftingSlots._observers.clear();
		ElementRemove(CraftingSlots.ids.root);
		return false;
	},

	/** @type {ScreenUnloadHandler} */
	Unload: function Unload() {
		ElementDOMScreen.clearStatus(ColorPicker.ids.root);
		document.getElementById(CraftingSlots.ids.root)?.toggleAttribute("hidden", true);
	},

	/** @type {KeyboardEventListener} */
	KeyDown: function KeyDown(ev) {
		/** @type {null | HTMLInputElement} */
		const searchInput = document.querySelector(`#${CraftingSlots.ids.root} input[type='search'][name='slot-search']`);
		const main = document.querySelector(`#${CraftingSlots.ids.root} .screen-main`);
		if (!main) {
			return false;
		} else if (CommonKey.NavigationKeyDown(main, ev, (el) => el.querySelector(".crafting-slot-button")?.clientHeight ?? el.clientHeight / 6)) {
			return true;
		} else if (searchInput && CommonKey.InputKeyDown(searchInput, ev)) {
			return true;
		} else {
			return false;
		}
	},

	/** @type {ClipboardEventListener} */
	Paste: function Paste(ev) {
		/** @type {null | HTMLInputElement} */
		const searchInput = document.querySelector(`#${CraftingSlots.ids.root} input[type='search'][name='slot-search']`);
		if (searchInput) {
			CommonKey.InputPaste(searchInput, ev);
		}
	},
};

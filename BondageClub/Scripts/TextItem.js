// @ts-strict-ignore
"use strict";

/**
 * A lookup for the text item configurations for each registered text item
 * @const
 * @type {Record<string, TextItemData>}
 * @see {@link TextItemData}
 */
const TextItemDataLookup = {};

/**
 * Registers a typed extended item. This automatically creates the item's load, draw and click functions.
 * @param {Asset} asset - The asset being registered
 * @param {TextItemConfig} config - The item's typed item configuration
 * @param {null | ExtendedItemOption} parentOption
 * @param {boolean} createCallbacks - Whether the archetype-specific callbacks should be created or not
 * @returns {TextItemData} - The generated extended item data for the asset
 */
function TextItemRegister(asset, config, parentOption=null, createCallbacks=true) {
	const data = TextItemCreateTextItemData(asset, config, parentOption);
	if (createCallbacks) {
		/** @type {ExtendedItemCallbackStruct<TextItemOption>} */
		const defaultCallbacks = {
			load: () => TextItem.Load(data),
			click: () => NoArch.Click(data),
			draw: () => TextItem.Draw(data),
			publishAction: (...args) => TextItem.PublishAction(data, ...args),
			init: (...args) => TextItem.Init(data, ...args),
			exit: () => TextItem.Exit(data),
			validate: (...args) => ExtendedItemValidate(data, ...args),
		};
		ExtendedItemCreateCallbacks(data, defaultCallbacks);
	}

	const mutableAsset = /** @type {Mutable<Asset>} */(data.asset);
	if (data.allowEffect.length) {
		mutableAsset.AllowEffect = Array.from(new Set([
			...mutableAsset.Effect,
			...(CommonIsArray(mutableAsset.AllowEffect) ? mutableAsset.AllowEffect : []),
			...data.allowEffect,
		]));
	}
	mutableAsset.Extended = true;
	return data;
}

/**
 * Parse the passed text item draw data as passed via the extended item config
 * @param {readonly TextItemNames[]} fieldNames
 * @param {ExtendedItemConfigDrawData<{}> | undefined} drawData - The to-be parsed draw data
 * @return {ExtendedItemDrawData<ElementMetaData.Text>} - The parsed draw data
 */
function TextItemGetDrawData(fieldNames, drawData) {
	const itemsPerPage = 8;
	/** @type {ElementData<ElementMetaData.Text>[]} */
	const elementData = fieldNames.map((_, i) => {
		return { position: [1505, 600 + 80 * (i % itemsPerPage), 400, 40] };
	});
	return ExtendedItemGetDrawData(drawData, { elementData, itemsPerPage });
}

/**
 * Generates an asset's typed item data
 * @param {Asset} asset - The asset to generate modular item data for
 * @param {TextItemConfig} config - The item's extended item configuration
 * @param {null | ExtendedItemOption} parentOption - The parent extended item option of the super screens (if any)
 * @returns {TextItemData} - The generated typed item data for the asset
 */
function TextItemCreateTextItemData(asset, {
	MaxLength,
	Font,
	DialogPrefix,
	ChatTags,
	Dictionary,
	ScriptHooks,
	BaselineProperty,
	EventListeners,
	DrawData,
	PushOnPublish,
	AllowEffect,
	Name,
}, parentOption=null) {
	// Gather the asset's relevant text property names
	const textNames = CommonKeys(MaxLength);

	// Specify an event listener for each text property
	const eventListeners = EventListeners || {};
	for (const i of textNames) {
		if (typeof eventListeners[i] !== "function") {
			eventListeners[i] = asset.DynamicAfterDraw ? TextItemChange : TextItemChangeNoCanvas;
		}
	}

	const baselineProperty = BaselineProperty || {};
	for (const i of textNames) {
		if (typeof baselineProperty[i] !== "string") {
			baselineProperty[i] = "";
		}
	}

	DialogPrefix = DialogPrefix || {};
	const name = Name != null ? Name : (parentOption == null ? ExtendedArchetype.TEXT : parentOption.Name);
	const key = `${asset.Group.Name}${asset.Name}${parentOption == null ? "" : name}`;
	return TextItemDataLookup[key] = {
		archetype: ExtendedArchetype.TEXT,
		asset,
		key,
		name,
		maxLength: MaxLength,
		font: typeof Font === "string" ? Font : null,
		functionPrefix: `Inventory${key}`,
		dynamicAssetsFunctionPrefix: `Assets${asset.Group.Name}${asset.Name}`,
		dialogPrefix: {
			header: DialogPrefix.Header || `TextItemSelect`,
			chat: DialogPrefix.Chat || "TextItem",
		},
		chatTags: Array.isArray(ChatTags) ? ChatTags : [
			CommonChatTags.SOURCE_CHAR,
			CommonChatTags.DEST_CHAR,
			CommonChatTags.ASSET_NAME,
		],
		scriptHooks: ExtendedItemParseScriptHooks(ScriptHooks || {}),
		dictionary: Dictionary || [],
		chatSetting: "default",
		baselineProperty,
		eventListeners,
		textNames,
		parentOption,
		drawData: TextItemGetDrawData(textNames, DrawData),
		pushOnPublish: typeof PushOnPublish === "boolean" ? PushOnPublish : true,
		allowEffect: Array.isArray(AllowEffect) ? AllowEffect : [],
	};
}

const TextItem = {
	/**
	 * Init function for items with text input fields.
	 * @param {TextItemData} data
	 * @param {Character} C — The character that has the item equiped
	 * @param {Item} item — The item in question
	 * @param {boolean} push - Whether to push to changes to the server
	 * @param {boolean} refresh - Whether to refresh the character. This should generally be `true`, with custom script hooks being a potential exception.
	 * @returns {boolean} Whether properties were updated or not
	 */
	Init: function ({ asset, font, baselineProperty, maxLength }, C, item, push=true, refresh=true) {
		if (font != null) {
			DynamicDrawLoadFont(font);
		}

		let changed = false;
		if (!CommonIsObject(item.Property)) {
			changed = true;
			item.Property = {};
		}

		for (const [field, length] of CommonEntries(maxLength)) {
			const textProperty = item.Property[field];
			if (!(typeof textProperty === "string" && DynamicDrawTextRegex.test(textProperty))) {
				item.Property[field] = baselineProperty[field];
				changed = true;
			} else if (textProperty.length > length) {
				item.Property[field] = textProperty.slice(0, textProperty.length);
				changed = true;
			}
		}

		if (!changed) {
			return false;
		}
		if (refresh) {
			CharacterRefresh(C, push, false);
		}
		if (push) {
			ChatRoomCharacterItemUpdate(C, asset.Group.Name);
		}
		return true;
	},
	/**
	 * Load function for items with text input fields.
	 * @param {TextItemData} data
	 */
	Load: function (data) {
		ExtendedItemLoad(data);

		const { asset, eventListeners, maxLength } = data;
		const item = (asset.IsLock) ? DialogFocusSourceItem : DialogFocusItem;
		const C = CharacterGetCurrent();

		// Lock the UI if the validation fails (_e.g._ when the item is locked)
		const { newOption, previousOption } = TextItemConstructOptions(data, item);
		const requirementMessage = ExtendedItemRequirementCheckMessage(data, C, item, newOption, previousOption);
		let disabled = false;
		if (requirementMessage) {
			DialogExtendedMessage = requirementMessage;
			disabled = true;
		}

		for (const [name, length] of CommonEntries(maxLength)) {
			const ID = PropertyGetID(name, item);
			if (!PropertyOriginalValue.has(ID)) {
				PropertyOriginalValue.set(ID, item.Property[name]);
			}

			const textInput = ElementCreateInput(ID, "text", item.Property[name], length);
			if (textInput) {
				const callback = eventListeners[name];
				textInput.pattern = DynamicDrawTextInputPattern;
				textInput.addEventListener("input", (e) => {
					const innerItem = (asset.IsLock) ? DialogFocusSourceItem : DialogFocusItem;
					callback(C, innerItem, name, /** @type {HTMLInputElement} */ (e.target).value);
				});
				if (disabled) {
					textInput.setAttribute("disabled", true);
				}
			}
		}
	},
	/**
	 * Draw handler for extended item screens with text input fields.
	 * @param {TextItemData} data - The items extended item data
	 */
	Draw: function (data) {
		const { asset, drawData, textNames } = data;

		ExtendedItemDrawHeader();
		DrawText(DialogExtendedMessage, 1500, 375, "#fff", "808080");
		if (drawData.paginate) {
			DrawButton(1665, 240, 90, 90, "", "White", "Icons/Prev.png");
			DrawButton(1775, 240, 90, 90, "", "White", "Icons/Next.png");
		}

		const item = (asset.IsLock) ? DialogFocusSourceItem : DialogFocusItem;
		const offset = ExtendedItemGetOffset();
		const elementData = drawData.elementData.slice(offset, offset + drawData.itemsPerPage);
		elementData.forEach(({ position }, i) => {
			const name = textNames[i];
			const ID = PropertyGetID(name, item);
			ElementPosition(ID, ...position);
		});
		ExtendedItemTighten.Draw(data, item, [1050, 220, 300, 65]);
	},
	/**
	 * Exit function for items with text input fields.
	 * @param {TextItemData} data - The items extended item data
	 * @param {boolean} publishAction - Whether
	 */
	Exit: function (data, publishAction=true) {
		if (publishAction) {
			const C = CharacterGetCurrent();
			const { newOption, previousOption } = TextItemConstructOptions(data, DialogFocusItem);
			const requirementMessage = ExtendedItemRequirementCheckMessage(data, C, DialogFocusItem, newOption, previousOption);
			if (requirementMessage) {
				TextItemPropertyRevert(data, DialogFocusItem);
			} else {
				/** @type {Parameters<ExtendedItemCallbacks.PublishAction<TextItemOption>>} */
				const args = [C, DialogFocusItem, newOption, previousOption];
				CommonCallFunctionByNameWarn(`${data.functionPrefix}PublishAction`, ...args);
				if (data.pushOnPublish) {
					CharacterRefresh(C, true, false);
					ChatRoomCharacterItemUpdate(C, data.asset.Group.Name);
				}
			}
		}

		for (const name of data.textNames) {
			const ID = PropertyGetID(name, DialogFocusItem);
			ElementRemove(ID);
			PropertyOriginalValue.delete(ID);
		}
	},
	/**
	 * PublishAction function for items with text input fields.
	 * @param {TextItemData} data - The items extended item data
	 * @param {Character} C - The character in question
	 * @param {Item} item - The item in question
	 * @param {TextItemOption} newOption
	 * @param {TextItemOption} previousOption
	 */
	PublishAction: function (data, C, item, newOption, previousOption) {
		const oldText = data.textNames.map((p) => previousOption.Property[p]).filter(Boolean).join(" ");
		const newText = data.textNames.map((p) => newOption.Property[p]).filter(Boolean).join(" ");
		if (oldText === newText) {
			return;
		}

		if (CurrentScreen === "ChatRoom") {
			/** @type {ExtendedItemChatData<TextItemOption>} */
			const chatData = {
				C,
				previousOption,
				newOption,
				previousIndex: -1,
				newIndex: -1,
			};
			const dictionary = ExtendedItemBuildChatMessageDictionary(chatData, data, item);
			dictionary.text("NewText", newText);

			// Avoid `ChatRoomPublishCustomAction` for tighter control over character refreshing
			const suffix = (newText === "") ? "Remove" : "Change";
			const prefix = (typeof data.dialogPrefix.chat === "function") ? data.dialogPrefix.chat(chatData) : data.dialogPrefix.chat;
			ServerSend(
				"ChatRoomChat",
				{ Content: `${prefix}${suffix}`, Type: "Action", Dictionary: dictionary.build() }
			);
		}
	},
	/**
	 * Usage AfterDraw: (...args) => TextItem.GenericTextDrawHook(...args, {Width: 128, Height: 128, XOffset: 0, YOffset: 10, drawOptions: { fontSize: 12 }})
	 * @param {TextItemData} data
	 * @param {((drawData: DynamicDrawingData<Record<string, unknown>>) => void) | null} originalFunction
	 * @param {{C: Character; A: Asset; CA: Item; X: number; Y: number; Property: ItemProperties; drawCanvas: DrawCanvasCallback; drawCanvasBlink: DrawCanvasCallback; AlphaMasks: RectTuple[]; L: string; Color: string}} drawArgs
	 * @param {{Width?: number; Height?: number; XOffset?: number; YOffset?: number; LayerName?: string; drawOptions?: DynamicDrawOptions;}} options
	 */
	GenericTextDrawHook(
		data,
		originalFunction,
		{
			C,
			A,
			CA,
			X,
			Y,
			Property,
			drawCanvas,
			drawCanvasBlink,
			AlphaMasks,
			L,
			Color,
		},
		{ Width=128, Height=128, XOffset=0, YOffset=0, LayerName="Text", drawOptions={} },
	) {
		if (L === LayerName) {
			const TempCanvas = AnimationGenerateTempCanvas(C, A, Width, Height);

			TextItem.Init(data, C, CA, false, false);
			const text = CA.Property.Text;

			let ctx = TempCanvas.getContext("2d");

			DynamicDrawText(text, ctx, Width / 2, Height / 2, {
				fontFamily: data.font,
				color: Color,
				width: Width,
				fontSize: 20,
				...drawOptions,
			});

			drawCanvas(TempCanvas, X + XOffset, Y + YOffset, AlphaMasks);
			drawCanvasBlink(TempCanvas, X + XOffset, Y + YOffset, AlphaMasks);
		}
	},
	/**
	 * Is equivalent to GenericTextDrawHook but arc
	 * @param {TextItemData} data
	 * @param {((drawData: DynamicDrawingData<Record<string, unknown>>) => void) | null} originalFunction
	 * @param {{C: Character; A: Asset; CA: Item; X: number; Y: number; Property: ItemProperties; drawCanvas: DrawCanvasCallback; drawCanvasBlink: DrawCanvasCallback; AlphaMasks: RectTuple[]; L: string; Color: string}} drawArgs
	 * @param {{Width?: number; Height?: number; XOffset?: number; YOffset?: number; LayerName?: string; drawOptions?: DynamicDrawOptions;}} options
	 */
	GenericTextArcDrawHook(
		data,
		originalFunction,
		{
			C,
			A,
			CA,
			X,
			Y,
			Property,
			drawCanvas,
			drawCanvasBlink,
			AlphaMasks,
			L,
			Color,
		},
		{ Width=128, Height=128, XOffset=0, YOffset=0, LayerName="Text", drawOptions={} },
	) {
		if (L === LayerName) {
			const TempCanvas = AnimationGenerateTempCanvas(C, A, Width, Height);

			TextItem.Init(data, C, CA, false, false);
			const text = CA.Property.Text;

			let ctx = TempCanvas.getContext("2d");

			DynamicDrawTextArc(text, ctx, Width / 2, Height / 2, {
				fontFamily: data.font,
				color: Color,
				width: Width,
				fontSize: 20,
				...drawOptions,
			});

			drawCanvas(TempCanvas, X + XOffset, Y + YOffset, AlphaMasks);
			drawCanvasBlink(TempCanvas, X + XOffset, Y + YOffset, AlphaMasks);
		}
	}

};

/**
 * Throttled callback for handling text changes.
 * @type {TextItemEventListener}
 */
const TextItemChange = CommonLimitFunction((C, item, name, text) => {
	if (DynamicDrawTextRegex.test(text)) {
		item.Property[name] = text;
		CharacterLoadCanvas(C);
	}
});

/**
 * Throttled callback for handling text changes that do not require a canvas.
 * @type {TextItemEventListener}
 */
const TextItemChangeNoCanvas = CommonLimitFunction((C, item, name, text) => {
	if (DynamicDrawTextRegex.test(text)) {
		item.Property[name] = text;
	}
});

/**
 * @param {TextItemData} data - The extended item data
 * @param {Item} item - The item in question
 * @returns {{ newOption: TextItemOption, previousOption: TextItemOption }}
 */
function TextItemConstructOptions(data, item) {
	/** @type {TextItemOption} */
	const newOption = { Name: "newOption", OptionType: "TextItemOption", Property: {}, ParentData: data };
	/** @type {TextItemOption} */
	const previousOption = { Name: "previousOption", OptionType: "TextItemOption", Property: {}, ParentData: data };

	for (const name of data.textNames) {
		const ID = PropertyGetID(name, item);
		previousOption.Property[name] = PropertyOriginalValue.get(ID);
		newOption.Property[name] = item.Property[name];
	}
	return { newOption, previousOption };
}

/**
 * Revert all text item properties back to their previous state prior to opening the extended item menu
 * @param {TextItemData} data - The extended item data
 * @param {Item} item - The item in question
 */
function TextItemPropertyRevert({ textNames }, item) {
	for (const name of textNames) {
		const ID = PropertyGetID(name, item);
		item.Property[name] = PropertyOriginalValue.get(ID);
	}
}

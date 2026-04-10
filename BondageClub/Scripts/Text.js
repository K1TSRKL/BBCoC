"use strict";

/** @type {TextCache | null} */
let TextScreenCache = null;
/** @type {Map<string, TextCache>} */
const TextAllScreenCache = new Map;

/** Prefix for the Text-generated warning message on a missing key */
const TEXT_NOT_FOUND_PREFIX = "MISSING TEXT IN";

var TextLogMissingStrings = false;

/**
 * Finds the text value linked to the tag in the buffer
 * @param {string} TextTag - Tag for the text to find
 * @returns {string} - Returns the text associated to the tag, will return a missing tag text if the tag was not found.
 */
function TextGet(TextTag) {
	return TextScreenCache ? TextScreenCache.get(TextTag) : "";
}

/**
 * Finds the translated string for key in the specified text cache
 * @param {string} filePath
 * @param {string} key
 * @returns {string} — The translated string for the key
 */
function TextGetInScope(filePath, key) {
	const stringsFile = TextAllScreenCache.get(filePath);

	let lastSlash = filePath.lastIndexOf("/");
	if (lastSlash === -1) {
		lastSlash = 0;
	} else {
		lastSlash = lastSlash + 1;
	}
	const fileName = filePath.substring(lastSlash);

	if (!stringsFile) return `${TEXT_NOT_FOUND_PREFIX} "${fileName}": ${key}`;
	const text = stringsFile.get(key);
	if (!text) return `${TEXT_NOT_FOUND_PREFIX} "${fileName}": ${key}`;
	return text;
}

/**
 * Loads the CSV text file of the current screen into the buffer. It will get the CSV from the cache if the file was already fetched from
 * the server
 * @param {string} [TextGroup] - Screen for which to load the CSV of
 * @returns {TextCache} - The CSV text file's correpsonding text cache
 */
function TextLoad(TextGroup) {

	// Finds the full path of the CSV file to use cache
	if ((TextGroup == null) || (TextGroup == "")) TextGroup = CurrentScreen;
	const FullPath = "Screens/" + CurrentModule + "/" + TextGroup + "/Text_" + TextGroup + ".csv";

	TextScreenCache = TextPrefetchFile(FullPath);
	return TextScreenCache;
}

/**
 * Cache the Module and TextGroup for later use, speeds up first use
 * @param {string} Module
 * @param {string} TextGroup
 * @returns {TextCache}  - The Module + TextGroup's correpsonding text cache
 */
function TextPrefetch(Module, TextGroup) {
	const file = "Screens/" + Module + "/" + TextGroup + "/Text_" + TextGroup + ".csv";
	return TextPrefetchFile(file);
}

/**
 * Trigger the caching of a specific file into the text cache
 * @param {string} file
 * @returns {TextCache}
 */
function TextPrefetchFile(file) {
	let cache = TextAllScreenCache.get(file);
	if (!cache) {
		cache = new TextCache(file);
		TextAllScreenCache.set(file, cache);
	}
	return cache;
}

/**
 * Finds the text value linked to the tag in the buffer, partition the text value into separate parts using the given replacer keys, and then substitute them with replacer values
 * @template T
 * @param {string} textTag Tag for the text to find
 * @param {Record<string, T>} replacers An object mapping replacement terms to values. Note that {@link Node} elements are cloned prior to the replacement
 * @param {Object} [options]
 * @param {TextCache} [options.textCache] A custom text cache from which to retrieve the text; defaults to {@link TextScreenCache}
 * @returns {(string | T)[]} The text associated to the tag, split into a list according to the passed replacers. Missing tag texts will be interpreted as empty strings.
 */
function TextSubstitute(textTag, replacers, options) {
	const { textCache } = options ?? {};
	/** @type {(key: string) => string} */
	const getter = textCache ? (key) => textCache.get(key) : TextGet;
	return CommonStringPartitionReplace(getter(textTag), replacers);
}

const InterfaceStringsPath = "Screens/Interface.csv";

/**
 * @param {string} msg
 * @returns {string}
 */
function InterfaceTextGet(msg) {
	const stringsFile = TextAllScreenCache.get(InterfaceStringsPath);
	if (!stringsFile) return `MISSING INTERFACE TEXT: ${msg}`;
	const text = stringsFile.get(msg);
	if (!text) return `MISSING INTERFACE TEXT: ${msg}`;
	return text;
}

/**
 * A class that can be used to cache a simple key/value CSV file for easy text lookups. Text lookups will be automatically translated to
 * the game's current language, if a translation is available.
 */
class TextCache {
	/**
	 * Creates a new TextCache from the provided CSV file path.
	 * @param {string} path - The path to the CSV lookup file for this TextCache instance
	 */
	constructor(path) {
		/** @type {string} */
		this.path = path;
		/** @type {ServerChatRoomLanguage | "TW"} */
		this.language = TranslationLanguage;
		/** @type {Record<string, string>} */
		this.cache = {};
		/** @type {((cache?: TextCache) => void)[]} */
		this.rebuildListeners = [];
		/**
		 * Whether the cache has finished building.
		 * @type {boolean}
		 */
		this.loaded = false;
		/**
		 * Promised object used for building the cache (see {@link TextCache.loaded}).
		 * @type {Promise<TextCache>}
		 */
		this.loadedPromise = this.buildCache();
	}

	/**
	 * Creates a new TextCache from the provided CSV file path asynchronously,
	 * promising its return after the cache has been build.
	 * @param {string} path - The path to the CSV lookup file for this TextCache instance
	 */
	static async buildAsync(path) {
		const cache = new TextCache(path);
		await cache.loadedPromise;
		return cache;
	}

	/**
	 * @param {string} msg
	 */
	log(msg) {
		// console.log(`TextCache "${this.path}" (loaded: ${this.loaded}):`, msg);
	}

	/**
	 * Return the basename of the cached file
	 * @returns {string}
	 */
	fileName() {
		let lastSlash = this.path.lastIndexOf("/");
		if (lastSlash === -1) {
			lastSlash = 0;
		} else {
			lastSlash = lastSlash + 1;
		}
		return this.path.substring(lastSlash);
	}

	/**
	 * Looks up a string from this TextCache. If the cache contains a value for the provided key and a translation is available, the return
	 * value will be automatically translated. Otherwise the EN string will be used. If the cache does not contain a value for the requested
	 * key, the key will be returned.
	 * @param {string} key - The text key to lookup
	 * @returns {string} - The text value corresponding to the provided key, translated into the current language, if available
	 */
	get(key) {
		if (!this.loaded) return "";
		if (TranslationLanguage !== this.language) {
			this.loadedPromise = this.buildCache();
		}
		const value = this.cache[key];
		if (typeof value !== "string") {
			if (TextLogMissingStrings) {
				console.warn(`Unknown translation key in ${this.fileName()}: ${key}`);
			}
			this.log(`Unknown translation key: ${key}`);
			return `${TEXT_NOT_FOUND_PREFIX} "${this.fileName()}": ${key}`;
		}
		return value;
	}

	/**
	 * Adds a callback function as a rebuild listener. Rebuild listeners will
	 * be called whenever the cache has completed a rebuild (either after
	 * initial construction, or after a language change).
	 * @param {(cache?: TextCache) => void} callback - The callback to register
	 * @param {boolean} [immediate] - Whether or not the callback should be called on registration
	 * @returns {() => void} - A callback function which can be used to unsubscribe the added listener
	 */
	onRebuild(callback, immediate = true) {
		if (typeof callback === "function") {
			this.rebuildListeners.push(callback);
			if (immediate) {
				callback();
			}
			return () => {
				this.rebuildListeners = this.rebuildListeners.filter((listener) => listener !== callback);
			};
		}
		return CommonNoop;
	}

	/**
	 * Kicks off a build of the text lookup cache.
	 * @returns {Promise<TextCache>} - Promised object that returns the original text cache
	 */
	async buildCache() {
		if (!this.path) return this;
		this.log("buildCache");
		return this.fetchCsv()
			.then((lines) => this.translate(lines))
			.then((lines) => this.cacheLines(lines))
			.then(() => {
				this.rebuildListeners.forEach((listener) => listener(this));
				return this;
			}).catch(reason => {
				console.error(reason);
				return this;
			});
	}

	/**
	 * Fetches and parses the CSV file for this TextCache
	 * @returns {Promise<string[][]>} - A promise resolving to an array of string arrays, corresponding to lines of CSV values in the CSV
	 * file.
	 */
	fetchCsv() {
		if (CommonCSVCache[this.path]) {
			this.log("fetchCsv: returning from cache");
			return Promise.resolve(CommonCSVCache[this.path]);
		}
		this.log("fetchCsv: fetching from server");
		return new Promise((resolve, reject) => {
			CommonFetch(this.path).then(response => {
				if (response.status !== 200) {
					// We say we're loaded even though that's wrong because we want `.get()`
					// to return the "MISSING" string
					this.loaded = true;
					reject(`Failed to fetch csv file "${this.path}"`);
					return;
				}
				response.text().then((data => {
					CommonCSVCache[this.path] = CommonParseCSV(data);
					this.log("fetchCsv: parsing");
					return resolve(CommonCSVCache[this.path]);
				}));
			});
		});
	}

	/**
	 * Stores the contents of a CSV file in the TextCache's internal cache
	 * @param {string[][]} lines - An array of string arrays corresponding to lines in the CSV file
	 * @returns {void} - Nothing
	 */
	cacheLines(lines) {
		lines.forEach((line) => (this.cache[line[0]] = line[1]));
		this.loaded = true;
		this.log("cacheLines complete");
	}

	/**
	 * Translates the contents of a CSV file into the current game language
	 * @param {string[][]} lines - An array of string arrays corresponding to lines in the CSV file
	 * @returns {Promise<string[][]>} - A promise resolving to an array of string arrays corresponding to lines in the CSV file with the
	 * values translated to the current game language
	 */
	translate(lines) {
		this.language = TranslationLanguage;
		const lang = (TranslationLanguage || "").trim().toUpperCase();
		if (!lang || lang === "EN") return Promise.resolve(lines);

		const translationPath = this.path.replace(/\/([^/]+)\.csv$/, `/$1_${lang}.txt`);
		if (!TranslationAvailable(translationPath)) {
			this.log(`translate: no translation available: ${translationPath}`);
			return Promise.resolve(lines);
		}

		if (TranslationCache[translationPath]) {
			this.log(`translate: using cache`);
			return Promise.resolve(this.buildTranslations(lines, TranslationCache[translationPath]));
		} else {
			this.log(`translate: fetching translation from ${translationPath}`);
			return new Promise((resolve) => {
				CommonGet(translationPath, (xhr) => {
					if (xhr.status === 200) {
						this.log(`translate: parsing translation`);
						TranslationCache[translationPath] = TranslationParseTXT(xhr.responseText);
						return resolve(this.buildTranslations(lines, TranslationCache[translationPath]));
					}
					return resolve(lines);
				});
			});
		}
	}

	/**
	 * Maps lines of a CSV to equivalent CSV lines with values translated according to the corresponding translation file
	 * @param {string[][]} lines - An array of string arrays corresponding to lines in the CSV file
	 * @param {string[]} translations - An array of strings in translation file format (with EN and translated values on alternate lines)
	 * @returns {string[][]} - An array of string arrays corresponding to lines in the CSV file with the
	 * values translated to the current game language
	 */
	buildTranslations(lines, translations) {
		this.log(`buildTranslations`);
		return lines.map(line => ([line[0], TranslationString(line[1], translations)]));
	}
}

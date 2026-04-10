"use strict";

const {
	defineConfig,
	globalIgnores,
} = require("eslint/config");

const globals = require("globals");
const sortKeysCustom = require("eslint-plugin-sort-keys-custom");
const compatPlugin = require("eslint-plugin-compat");
const js = require("@eslint/js");

const {
	FlatCompat,
} = require("@eslint/eslintrc");

const compat = new FlatCompat({
	baseDirectory: __dirname,
	recommendedConfig: js.configs.recommended,
	allConfig: js.configs.all
});

/** @type {import("eslint/config").Config} */
const common = {
	extends: compat.extends("eslint:recommended", "plugin:compat/recommended"),

	plugins: {
		"sort-keys-custom": sortKeysCustom,
		"compat": compatPlugin,
	},

	settings: {
		polyfills: ["Notification"],
	},

	rules: {
		"dot-notation": "error",
		"no-unused-expressions": "error",
		"no-caller": "error",
		"no-eval": "error",
		"no-new-wrappers": "error",
		"no-throw-literal": "error",

		"no-shadow": ["warn", {
			"hoist": "all",
		}],

		"strict": ["error", "global"],

		"no-constant-condition": ["error", {
			"checkLoops": false,
		}],

		"no-unused-vars": ["warn", {
			"vars": "local",
			"args": "none",
			"varsIgnorePattern": "^_",
			"argsIgnorePattern": "^_",
			"caughtErrorsIgnorePattern": "^_",
		}],

		"no-trailing-spaces": "warn",
		"semi": "warn",

		"indent": ["warn", "tab", {
			"SwitchCase": 1,
			"ignoredNodes": ["ConditionalExpression"],
		}],

		"unicode-bom": ["error", "never"],
		"eol-last": "error",

		"no-tabs": ["warn", {
			"allowIndentationTabs": true,
		}],

		"no-mixed-spaces-and-tabs": ["error", "smart-tabs"],

		// Until globals are properly documented
		"no-undef": "off",
		"no-var": "off",
	},
};

module.exports = defineConfig([
	{
		...common,
		ignores: ["Tools/Node/**/*.js"],

		languageOptions: {
			globals: {
				...globals.browser,
			},

			ecmaVersion: 2022,
			parserOptions: {},
			sourceType: "script",
		},
	},
	{
		...common,
		files: ["Tools/Node/**/*.js"],

		languageOptions: {
			globals: {
				...globals.browser,
			},

			ecmaVersion: 2022,
			parserOptions: {},
			sourceType: "module",
		},

	},
	globalIgnores(
		[
			"Scripts/lib/**/*.js",
			"**/*.min.js",
			"Screens/MiniGame/KinkyDungeon/*.js",
		],
	),
]);

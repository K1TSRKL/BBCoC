'use strict';

// @ts-ignore
let StandalonePatched = false;

/** @type {Map<Character, any>} */
let KDCurrentModels = new Map();

/** @type {HTMLCanvasElement} */
// @ts-expect-error Either that or the whole block at KDDraw.js:3231 is wrong
let PIXICanvas = MainCanvas;

const EYEPOSES = [];
const EYE2POSES = [];
const BROWPOSES = [];
const BROW2POSES = [];
const MOUTHPOSES = [];
const BLUSHPOSES = [];
const STANDPOSES = [];

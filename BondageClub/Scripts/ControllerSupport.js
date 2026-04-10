// @ts-strict-ignore
"use strict";

/**
 * Controller support function
 *
 * If you need to make sense of browser's gamepad events, https://gamepad-tester.com/ has a nice button viewer.
 *
 * The (crappy) gamepad I have ("PS3 GamePad (STANDARD GAMEPAD Vendor: 054c Product: 0268)")
 * has a lot of weird behaviors; some buttons appear on another gamepad entirely.
 *
 * The initial implementation also reports some gamepads mapping D-pad events to an axis with range > 1, so there's
 * some (incomplete) code to handle that case.
 *
 * FIXME: Not that we actually do anything if the D-pad is an axis.
 */

/**
 * A list of points that can be interacted in the UI.
 *
 * @type {[X: number, Y: number][]}
 */
var ControllerActiveAreas = [];

/** Number of detected controllers */
var ControllerDetectedCount = 0;

/**
 * Gamepad-agnostic constants for the buttons
 *
 * Those values come from the order https://hardwaretester.com/gamepad shows them in
 */
const ControllerButton = /** @type {const} */({
	A: 0,
	B: 1,
	X: 2,
	Y: 3,
	BumperL: 4,
	BumperR: 5,
	TriggerL: 6,
	TriggerR: 7,
	/**
	 * Select triggers Launchpad on macOS
	 */
	Select: 8,
	Start: 9,
	StickL: 10,
	StickR: 11,
	DPadU: 12,
	DPadD: 13,
	DPadL: 14,
	DPadR: 15,
	/**
	 * Home triggers Chrome's screen sharing feature on macOS
	 */
	Home: 16,
});

const MAX_KNOWN_BUTTONS = 17;

/** Gamepad-agnostic constants for the axes */
const ControllerAxis = /** @type {const} */({
	StickLV: 0,
	StickLH: 1,
	StickRV: 2,
	StickRH: 3,
});

const MAX_KNOWN_AXIS = 4;

/**
 * Default button name to gamepad button index mapping
 *
 * The player's calibrated config will be read from their preferences.
 */
const ControllerButtonMapping = {
	[ControllerButton.A]: 0,
	[ControllerButton.B]: 1,
	[ControllerButton.X]: 2,
	[ControllerButton.Y]: 3,
	[ControllerButton.BumperL]: -1,
	[ControllerButton.BumperR]: -1,
	[ControllerButton.TriggerL]: 6,
	[ControllerButton.TriggerR]: 7,
	[ControllerButton.Select]: -1,
	[ControllerButton.Start]: -1,
	[ControllerButton.StickL]: -1,
	[ControllerButton.StickR]: -1,
	[ControllerButton.DPadU]: 12,
	[ControllerButton.DPadD]: 13,
	[ControllerButton.DPadL]: 14,
	[ControllerButton.DPadR]: 15,
	[ControllerButton.Home]: -1,
};

/**
 * Default axis name to gamepad axis index mapping
 *
 * The player's calibrated config will be read from their preferences.
 */
const ControllerAxisMapping = {
	[ControllerAxis.StickLV]: 1,
	[ControllerAxis.StickLH]: 0,
	[ControllerAxis.StickRV]: -1,
	[ControllerAxis.StickRH]: -1,
};

/**
 * Multiplier for any axis value we apply
 *
 * Stored in player's preferences.
 */
var ControllerSensitivity = 5;

/**
 * Minimum range an axis should move before we detect it
 *
 * Stored in player's preferences.
 */
var ControllerDeadZone = 0.01;

/**
 * At which stage of the calibration we are
 *
 * -1 means we're not calibrating
 */
var ControllerCalibrationStage = -1;

/**
 * Whether the current gamepad actually has real D-Pad buttons
 */
var ControllerDPadAsAxisWorkaround = false;

/**
 * Whether we're waiting for gamepad axes to reset
 */
var ControllerAxesWaitRelease = false;

/**
 * Whether we're waiting for gamepad buttons to be released
 */
var ControllerButtonsWaitRelease = false;

/**
 * List of axes we ignore
 *
 * @type {number[]}
 */
var ControllerIgnoredAxes = [];

/**
 * The previous state the buttons were in, for each gamepad
 *
 * Used to handle repeats
 * @type {boolean[][]}
 */
var ControllerLastButtonState = [];

/**
 * Register the gamepad connection/disconnection events.
 */
function ControllerStart() {
	if (!ControllerIsEnabled()) return;

	window.addEventListener('gamepadconnected', (event) => {
		console.log("gamepadconnected", event);
		ControllerDetectedCount++;
	});

	window.addEventListener("gamepaddisconnected", (event) => {
		console.log("gamepaddisconnected", event);
		ControllerDetectedCount--;
		if (ControllerDetectedCount < 0) ControllerDetectedCount = 0;
	});
}

/**
 * Check whether controller support is enabled.
 *
 * Uses the Player's configuration, with a workaround to allow
 * the controller to activate on login.
 */
function ControllerIsEnabled() {
	if (!Player || !Player.ControllerSettings) return true;

	return Player.ControllerSettings.ControllerActive;
}

/**
 * Check whether we have detected a gamepad.
 */
function ControllerIsActive() {
	return ControllerIsEnabled() && ControllerDetectedCount > 0;
}

/**
 * Load a gamepad mapping
 * @param {Partial<Record<ControllerButton, number>>} buttonsMapping
 * @param {Partial<Record<ControllerAxis, number>>} axisMapping
 */
function ControllerLoadMapping(buttonsMapping, axisMapping) {
	if (!buttonsMapping || !axisMapping) return;
	if (ControllerIsActive()) {
		for (const gamepad of navigator.getGamepads()) {
			if (!gamepad) continue;
			if (gamepad.buttons.length < MAX_KNOWN_BUTTONS || gamepad.axes.length < MAX_KNOWN_AXIS) {
				console.warn(`Detected gamepad ${gamepad.index} doesn't have the minimum supported buttons/axis. Make sure to calibrate it properly in Preferences!`);
			} else if (Object.keys(buttonsMapping).length !== gamepad.buttons.length || Object.keys(axisMapping).length !== gamepad.axes.length) {
				console.warn(`Loaded controller mapping doesn't match gamepad ${gamepad.index} layout. Make sure to calibrate it properly in Preferences!`);
			}
		}
	}
	for (const btnIdx of Object.keys(ControllerButtonMapping)) {
		ControllerButtonMapping[btnIdx] = buttonsMapping[btnIdx] ?? -1;
	}
	for (const axisIdx of Object.keys(ControllerAxisMapping)) {
		ControllerAxisMapping[axisIdx] = axisMapping[axisIdx] ?? -1;
	}
}

/**
 * Main gamepad processing.
 *
 * This functions goes over gamepads and collects their inputs.
 */
function ControllerProcess() {
	if (!ControllerIsEnabled() || !ControllerIsActive()) return;

	// Loop through all gamepads, which seems odd but the one I
	// have at hand registers as two controllers and the buttons
	// are literally everywhere.
	for (const gamepad of navigator.getGamepads()) {
		if (!gamepad) continue;

		// Manually set each button as a repeat if it was previously held
		for (let padIdx = 0; padIdx < gamepad.buttons.length; padIdx++) {
			ControllerLastButtonState[gamepad.index] ??= [];
			ControllerLastButtonState[gamepad.index][padIdx] ??= false;
			gamepad.buttons[padIdx].repeat = ControllerLastButtonState[gamepad.index][padIdx];
		}

		if (ControllerIsCalibrating()) {
			ControllerCalibrateButtons(gamepad.buttons);
			ControllerCalibrateAxis(gamepad.axes);
		} else {
			ControllerProcessButton(gamepad.buttons);
			ControllerProcessAxis(gamepad.axes);
		}

		// Keep track of the pressed state of each button for next event
		for (let padIdx = 0; padIdx < gamepad.buttons.length; padIdx++) {
			ControllerLastButtonState[gamepad.index][padIdx] = gamepad.buttons[padIdx].pressed;
		}
	}
}

/**
 * Adds a point to the active points list.
 *
 * @param {number} X - The X coordinate of the point
 * @param {number} Y - The Y coordinate of the point
 */
function ControllerAddActiveArea(X, Y) {
	if (!ControllerIsActive()) return;

	// Skip coordinates out-of-bound from the canvas. Happens because we're
	// piggy-backing on the drawing, and sometimes it does that.
	if (X < 0 || X > 2000 || Y < 0 || Y > 1000) return;

	X += 10;
	Y += 10;
	if (!ControllerActiveAreas.some(([x, y]) => x === X && y === Y)) {
		ControllerActiveAreas.push([X, Y]);
	}
}

/**
 * Removes all active points.
 */
function ControllerClearAreas() {
	ControllerActiveAreas = [];
}

const ControllerMissingAxisWarning = new Set();

/**
 * Detect and convert gamepad axis movements
 * @param {readonly number[]} axes the raw data of all axes of the controller
 */
function ControllerProcessAxis(axes) {
	if (ControllerIsCalibrating()) return;

	// Bondage Brawl handles its own controls
	if ((CurrentScreen == "Platform") || (CurrentScreen == "PlatformDialog")) return;

	// if a value is over 1, it is from a d-pad (some d-pads register as buttons, some d-pads register like this)
	for (let axisIdx = 0; axisIdx < axes.length; axisIdx++) {
		if (Math.abs(axes[axisIdx]) > 1 && !ControllerIgnoredAxes.includes(axisIdx)) {
			ControllerIgnoredAxes.push(axisIdx);
		}
	}

	for (let axisIdx = 0; axisIdx < axes.length && !ControllerDPadAsAxisWorkaround; axisIdx++) {
		if (Math.abs(axes[axisIdx]) > 0.1 && !ControllerIgnoredAxes.includes(axisIdx)) {
			ControllerDPadAsAxisWorkaround = true;
		}
	}

	function handleAxis(axisId, handler) {
		const padAxisId = ControllerAxisMapping[axisId];
		const val = axes[padAxisId] ?? undefined;
		if (val === undefined && !ControllerMissingAxisWarning.has(axisId)) {
			console.warn(`gamepad axis handler requested an unknown axis: ${axisId} (${padAxisId})`);
			ControllerMissingAxisWarning.add(axisId);
			return;
		}
		if (Math.abs(val) > ControllerDeadZone) {
			//console.log(`gamepad axis event: game id: ${axisId}, pad id: ${padAxisId}, value: ${val}`);
			handler(val);
		}
	}

	if (ControllerDPadAsAxisWorkaround) {
		handleAxis(ControllerAxis.StickLH, (val) => {
			const dX = val * ControllerSensitivity;
			MouseX = CommonClamp(MouseX + dX, 0, 2000);
		});
		handleAxis(ControllerAxis.StickLV, (val) => {
			const dY = val * ControllerSensitivity;
			MouseY = CommonClamp(MouseY + dY, 0, 1000);
		});
		handleAxis(ControllerAxis.StickRH, (_v) => {});
		handleAxis(ControllerAxis.StickRV, (_v) => {});
	}
}

/**
 * Returns TRUE if current screen is a game that handles the controller, sends the input to that screen
 * @param {readonly GamepadButton[]} buttons - The raw button data
 * @return {boolean}
 */
function ControllerManagedByGame(buttons) {

	// Map the gamepad button indexes to the game's button names
	const mappedButtons = [];
	for (const btnId of Object.values(ControllerButton)) {
		const padBtnId = ControllerButtonMapping[btnId];
		if (padBtnId === -1) continue;
		// Grab either the actual button or make a dummy, in case the player has it unmapped
		mappedButtons[btnId] ??= buttons[padBtnId] ?? { pressed: false, repeat: false };
	}

	// If the screen manages the controller, we call it
	let Managed = false;
	if (CurrentScreen == "PlatformDialog") Managed = PlatformDialogController(mappedButtons);
	if (CurrentScreen == "Platform") Managed = PlatformController(mappedButtons);

	// TRUE if the screen managed the controller
	return Managed;
}

const ControllerMissingButtonWarning = new Set();

/**
 * Handles button input
 * @param {readonly GamepadButton[]} buttons raw buttons data
 */
function ControllerProcessButton(buttons) {
	if (ControllerIsCalibrating()) return;

	// If a game intercepts the controller inputs
	if (ControllerManagedByGame(buttons)) return;

	/**
	 * Helper function to process a button press
	 */
	function handleButton(btnId, handler) {
		if (ControllerButtonsWaitRelease) return;
		const padBtnId = ControllerButtonMapping[btnId];
		if (padBtnId === -1 && !ControllerMissingButtonWarning.has(btnId)) {
			ControllerMissingButtonWarning.add(btnId);
			return;
		}
		if (!buttons[padBtnId] && !ControllerMissingButtonWarning.has(btnId)) {
			ControllerMissingButtonWarning.add(btnId);
			return;
		}
		const isPressed = buttons[padBtnId]?.pressed;
		if (isPressed) {
			handler();
			ControllerButtonsWaitRelease = true;
		}
	}

	handleButton(ControllerButton.A, () => {
		if (!ControllerDPadAsAxisWorkaround) return;
		// Trigger a fake click event
		CommonClick(null);
	});
	handleButton(ControllerButton.B, () => {
		const fakeEvent = new KeyboardEvent("Escape", { code: "Escape" });
		GameKeyDown(fakeEvent);
	});
	handleButton(ControllerButton.X, () => {
		const fakeEvent = new KeyboardEvent("A", { code: "KeyA" });
		StruggleKeyDown(fakeEvent);
	});
	handleButton(ControllerButton.Y, () => {
		const fakeEvent = new KeyboardEvent("S", { code: "KeyS" });
		StruggleKeyDown(fakeEvent);
	});
	handleButton(ControllerButton.DPadU, () => {
		ControllerDPadAsAxisWorkaround = true;
		ControllerMoveToActiveZone("Up");
	});
	handleButton(ControllerButton.DPadD, () => {
		ControllerDPadAsAxisWorkaround = true;
		ControllerMoveToActiveZone("Down");
	});
	handleButton(ControllerButton.DPadL, () => {
		ControllerDPadAsAxisWorkaround = true;
		ControllerMoveToActiveZone("Left");
	});
	handleButton(ControllerButton.DPadR, () => {
		ControllerDPadAsAxisWorkaround = true;
		ControllerMoveToActiveZone("Right");
	});
	handleButton(ControllerButton.BumperL, () => {});
	handleButton(ControllerButton.BumperR, () => {});
	handleButton(ControllerButton.TriggerL, () => {});
	handleButton(ControllerButton.TriggerR, () => {});
	handleButton(ControllerButton.Start, () => {});
	handleButton(ControllerButton.Select, () => {});
	handleButton(ControllerButton.StickL, () => {});
	handleButton(ControllerButton.StickR, () => {});

	// Don't process more buttons until they all got released
	if (ControllerButtonsWaitRelease == true) {
		if (buttons.every(b => !b.pressed)) {
			ControllerButtonsWaitRelease = false;
		}
	}
}

const ControllerCalibrationAxisOffset = 100;

/**
 * Start the calibration process
 * @param {"buttons"|"axis"} type
 */
function ControllerStartCalibration(type) {
	if (type === "buttons") {
		ControllerCalibrationStage = ControllerButton.A;
	} else if (type === "axis") {
		ControllerCalibrationStage = ControllerCalibrationAxisOffset + ControllerAxis.StickLV;
	}
}

/**
 * Move to the next calibration step
 * @param {boolean} skip
 */
function ControllerCalibrationNextStage(skip = false) {
	const isAxis = ControllerCalibrationStage >= ControllerCalibrationAxisOffset;
	const stage = isAxis ? ControllerCalibrationStage - ControllerCalibrationAxisOffset : ControllerCalibrationStage;

	if (skip) {
		// We're skipping, unset the value for that input
		if (isAxis) {
			ControllerAxisMapping[stage] = -1;
		} else {
			ControllerButtonMapping[stage] = -1;
		}
	}

	ControllerCalibrationStage++;

	// Doing a >= here because we've just incremented the stage but not that cached value
	if (!isAxis && stage >= ControllerButton.Home) {
		ControllerStopCalibration();
	} else if (isAxis && stage >= ControllerAxis.StickRH) {
		ControllerStopCalibration();
	}
}


/**
 * Stop the calibration process
 *
 * @param {boolean} commit - Whether to save the changes made to the mappings or not
 *
 */
function ControllerStopCalibration(commit = false) {
	if (commit) {
		Player.ControllerSettings.Buttons = ControllerButtonMapping;
		Player.ControllerSettings.Axis = ControllerAxisMapping;
	}
	ControllerCalibrationStage = -1;
}

/**
 * Whether we're currently calibrating the controller
 */
function ControllerIsCalibrating() {
	return ControllerCalibrationStage !== -1;
}

/**
 * The label for the current stage of calibration
 * @returns {string}
 */
function ControllerCalibrationStageLabel() {
	switch (ControllerCalibrationStage) {
		case ControllerButton.A:
			return TextGet("PressA");
		case ControllerButton.B:
			return TextGet("PressB");
		case ControllerButton.X:
			return TextGet("PressX");
		case ControllerButton.Y:
			return TextGet("PressY");
		case ControllerButton.BumperL:
			return TextGet("PressLeftBumper");
		case ControllerButton.BumperR:
			return TextGet("PressRightBumper");
		case ControllerButton.TriggerL:
			return TextGet("PressLeftTrigger");
		case ControllerButton.TriggerR:
			return TextGet("PressRightTrigger");
		case ControllerButton.Select:
			return TextGet("PressSelect");
		case ControllerButton.Start:
			return TextGet("PressStart");
		case ControllerButton.StickL:
			return TextGet("PressLeftStick");
		case ControllerButton.StickR:
			return TextGet("PressRightStick");
		case ControllerButton.DPadU:
			return TextGet("PressUpOnDpad");
		case ControllerButton.DPadD:
			return TextGet("PressDownOnDpad");
		case ControllerButton.DPadL:
			return TextGet("PressLeftOnDpad");
		case ControllerButton.DPadR:
			return TextGet("PressRightOnDpad");
		case ControllerButton.Home:
			return TextGet("PressHome");
	}

	switch (ControllerCalibrationStage - 100) {
		case ControllerAxis.StickLV:
			return TextGet("MoveLeftStickUp");
		case ControllerAxis.StickLH:
			return TextGet("MoveLeftStickRight");
		case ControllerAxis.StickRV:
			return TextGet("MoveRightStickUp");
		case ControllerAxis.StickRH:
			return TextGet("MoveRightStickRight");
	}
}

const ControllerCalibrationLowWatermark = 0.05;
const ControllerCalibrationHighWatermark = 0.8;

/**
 * Handles the sticks input when calibrating
 * @param {readonly number[]} axes the raw data of all axes of the controller
 */
function ControllerCalibrateAxis(axes) {
	if (!ControllerIsCalibrating()) return;

	for (const axisIdx of Object.values(ControllerAxis)) {
		if (axisIdx !== ControllerCalibrationStage - ControllerCalibrationAxisOffset) continue;
		// We detected an axis moving button this event loop, don't process until it's released
		if (ControllerAxesWaitRelease) continue;
		if (axes.filter(b => Math.abs(b) > ControllerCalibrationHighWatermark && !ControllerIgnoredAxes.includes(axisIdx)).length > 1) continue;

		const detectedIdx = axes.findIndex(b => Math.abs(b) > ControllerCalibrationHighWatermark && !ControllerIgnoredAxes.includes(axisIdx));
		if (detectedIdx === -1) continue;
		ControllerAxisMapping[axisIdx] = detectedIdx;
		ControllerCalibrationNextStage();
		ControllerAxesWaitRelease = true;
		break;
	}

	if (ControllerAxesWaitRelease) {
		const idle = axes.every((axisValue, axisIdx) => !ControllerIgnoredAxes.includes(axisIdx) && Math.abs(axisValue) < ControllerCalibrationLowWatermark);
		if (idle) {
			ControllerAxesWaitRelease = false;
		}
	}
}

/**
 * Handles gamepad button calibration
 * @param {readonly GamepadButton[]} buttons raw buttons data
 */
function ControllerCalibrateButtons(buttons) {
	if (!ControllerIsCalibrating()) return;

	for (const btnIdx of Object.values(ControllerButton)) {
		if (btnIdx != ControllerCalibrationStage) continue;
		// We got a button press this event loop, don't process until it's released
		if (ControllerButtonsWaitRelease) continue;
		if (buttons.filter(b => b.pressed).length > 1) continue;

		const pressedIdx = buttons.findIndex(b => b.pressed);
		if (pressedIdx === -1) continue;
		ControllerButtonMapping[btnIdx] = pressedIdx;
		ControllerCalibrationNextStage();
		ControllerButtonsWaitRelease = true;
		break;
	}

	// Don't process more buttons until they all got released
	if (ControllerButtonsWaitRelease) {
		if (buttons.every(b => !b.pressed)) {
			ControllerButtonsWaitRelease = false;
		}
	}
}

//uncomment to test it with keyboard
/**
 * handles keyboard inputs in controller mode
 * @type {KeyboardEventListener}
 */
function ControllerSupportKeyDown(event) {
	// if (event.code === "KeyI") {
	//  ControllerUp();
	//  return true;
	// } else if (event.code === "KeyK") {
	//  ControllerDown();
	//  return true;
	// } else if (event.code === "KeyJ") {
	//  ControllerLeft();
	//  return true;
	// } else if (event.code === "KeyL") {
	//  ControllerRight();
	//  return true;
	// } else if (event.code === "Space") {
	//  ControllerClick();
	//  return true;
	// }
	return false;
}

/**
 * Finds the closest point in a list, favoring the given direction.
 *
 * Used to navigate the active zones with a controller.
 *
 * @param {[X: number, Y: number]} point
 * @param {[X: number, Y: number][]} points
 * @param {"Up"|"Down"|"Left"|"Right"} direction
 */
function ControllerFindClosestPoint(point, points, direction) {
	//console.log("finding point: ", point, "closest to", ...points.map(([x, y]) => `(${x}, ${y})`));
	const [X, Y] = point;

	// Filter points in the opposite direction we're searching, then map the remainder in 2d-space using good old Pythagoras
	points = points.filter(([x, y]) => direction === "Up" && y < Y || direction === "Down" && y > Y || direction === "Left" && x < X || direction === "Right" && x > X);
	//console.log("filtered: ", ...points.map(([x, y]) => `(${x}, ${y})`));

	let candidates = points.map(([x, y]) => [x, y, Math.sqrt((x - X) ** 2 + (y - Y) ** 2)]); // XXX: not enough. Might need a bit of trig too to find the closest, most in-line point
	//console.log("candidates: ", ...candidates.map(([x, y, dist]) => `(${x}, ${y}, ${dist})`));

	candidates = candidates.sort(([ax, ay, adist], [bx, by, bdist]) => adist - bdist);
	//console.log("sorted: ", ...candidates.map(([x, y, dist]) => `(${x}, ${y}, ${dist})`));

	if (!candidates[0]) return null;

	return [candidates[0][0], candidates[0][1]];
}

/**
 * Moves the pointer throught the active zones in the direction wanted.
 *
 * @param {"Up"|"Down"|"Left"|"Right"} direction
 */
function ControllerMoveToActiveZone(direction) {
	// No active points right now, bail as there's nothing to navigate
	if (ControllerActiveAreas.length === 0) return;

	// Filter out our current location so we don't jump to it
	const points = ControllerActiveAreas.filter(([x, y]) => !(x === MouseX && y === MouseY));
	//console.log("filtered areas: ", points.map(([x, y]) => `(${x}, ${y})`).join(", "));

	const dest = ControllerFindClosestPoint([MouseX, MouseY], points, direction);
	if (!dest) return;

	MouseX = dest[0];
	MouseY = dest[1];
}

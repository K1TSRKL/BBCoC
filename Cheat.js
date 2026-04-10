var CheatAllow = false;
var TranslationCheatAllow = false;
var TranslationCacheCounter = 0; // used to bypass browser cache for CSV
var TranslationCurrentText = 0;
var TranslationCurrentStageFileLine = 0;
var TranslationSavedStage;

const cheatHtml = `
<div id="cheat-backdrop" style="display:none;position:fixed;z-index:999999;top:0;left:0;width:100%;height:100%;background:rgba(0,0,0,0.75);overflow:auto;">
	<div style="position:relative;max-width:980px;margin:40px auto;padding:16px;background:#161616;border-radius:16px;color:#f5f5f5;font-family:Arial,Helvetica,sans-serif;box-shadow:0 0 32px rgba(0,0,0,0.8);">
		<div style="display:flex;align-items:center;justify-content:space-between;gap:12px;margin-bottom:16px;">
			<div>
				<h2 style="margin:0 0 4px;font-size:1.5rem;">Cheat Menu</h2>
				<div style="font-size:0.95rem;color:#ccc;">Tap a button to apply cheats. Works on touch devices.</div>
			</div>
			<button onclick="CloseCheatMenu()" style="background:#e91e63;border:none;color:#fff;padding:10px 14px;border-radius:10px;font-size:0.95rem;cursor:pointer;">Close</button>
		</div>
		<div style="display:grid;grid-template-columns:repeat(auto-fit,minmax(240px,1fr));gap:14px;">
			<div style="background:#222;padding:14px;border-radius:12px;">
				<h3 style="margin:0 0 12px;font-size:1.1rem;color:#fff;">Target</h3>
				<button onclick="AddActorLove()" style="margin:2px 2px 2px 0;padding:10px 12px;border:none;border-radius:10px;background:#4caf50;color:#fff;cursor:pointer;">Add Love</button>
				<button onclick="AddActorHate()" style="margin:2px 2px 2px 0;padding:10px 12px;border:none;border-radius:10px;background:#f44336;color:#fff;cursor:pointer;">Add Hate</button>
				<button onclick="AddActorSubmission()" style="margin:2px 2px 2px 0;padding:10px 12px;border:none;border-radius:10px;background:#2196f3;color:#fff;cursor:pointer;">Add Submission</button>
				<button onclick="AddActorDominance()" style="margin:2px 2px 2px 0;padding:10px 12px;border:none;border-radius:10px;background:#ff9800;color:#fff;cursor:pointer;">Add Dominance</button>
			</div>
			<div style="background:#222;padding:14px;border-radius:12px;">
				<h3 style="margin:0 0 12px;font-size:1.1rem;color:#fff;">Time</h3>
				<button onclick="CheatTime(600000)" style="margin:2px 2px 2px 0;padding:10px 12px;border:none;border-radius:10px;background:#4caf50;color:#fff;cursor:pointer;">+10 min</button>
				<button onclick="CheatTime(-600000)" style="margin:2px 2px 2px 0;padding:10px 12px;border:none;border-radius:10px;background:#f44336;color:#fff;cursor:pointer;">-10 min</button>
				<button onclick="JumpToNextEvent()" style="margin:2px 2px 2px 0;padding:10px 12px;border:none;border-radius:10px;background:#2196f3;color:#fff;cursor:pointer;">Next event</button>
				<button onclick="ToggleGameTimer()" style="margin:2px 2px 2px 0;padding:10px 12px;border:none;border-radius:10px;background:#9c27b0;color:#fff;cursor:pointer;">Pause/Resume</button>
			</div>
			<div style="background:#222;padding:14px;border-radius:12px;">
				<h3 style="margin:0 0 12px;font-size:1.1rem;color:#fff;">Fight/Race/Quiz</h3>
				<button onclick="WinFight()" style="margin:2px 2px 2px 0;padding:10px 12px;border:none;border-radius:10px;background:#4caf50;color:#fff;cursor:pointer;">Win fight</button>
				<button onclick="WinDoubleFight()" style="margin:2px 2px 2px 0;padding:10px 12px;border:none;border-radius:10px;background:#4caf50;color:#fff;cursor:pointer;">Win double fight</button>
				<button onclick="FinishRace()" style="margin:2px 2px 2px 0;padding:10px 12px;border:none;border-radius:10px;background:#2196f3;color:#fff;cursor:pointer;">Finish race</button>
				<button onclick="AutoAnswerQuiz()" style="margin:2px 2px 2px 0;padding:10px 12px;border:none;border-radius:10px;background:#ff9800;color:#fff;cursor:pointer;">Auto answer quiz</button>
			</div>
			<div style="background:#222;padding:14px;border-radius:12px;">
				<h3 style="margin:0 0 12px;font-size:1.1rem;color:#fff;">Dorm</h3>
				<button onclick="ReleaseDormBondage()" style="margin:2px 2px 2px 0;padding:10px 12px;border:none;border-radius:10px;background:#00bcd4;color:#fff;cursor:pointer;">Release dorm bondage</button>
			</div>
			<div style="background:#222;padding:14px;border-radius:12px;grid-column:span 2;">
				<h3 style="margin:0 0 12px;font-size:1.1rem;color:#fff;">Skills</h3>
				<button onclick="PlayerAddSkill('Arts', 1)" style="margin:2px 2px 2px 0;padding:10px 12px;border:none;border-radius:10px;background:#4caf50;color:#fff;cursor:pointer;">Arts</button>
				<button onclick="PlayerAddSkill('Fighting', 1)" style="margin:2px 2px 2px 0;padding:10px 12px;border:none;border-radius:10px;background:#2196f3;color:#fff;cursor:pointer;">Fighting</button>
				<button onclick="PlayerAddSkill('RopeMastery', 1)" style="margin:2px 2px 2px 0;padding:10px 12px;border:none;border-radius:10px;background:#ff9800;color:#fff;cursor:pointer;">RopeMastery</button>
				<button onclick="PlayerAddSkill('Seduction', 1)" style="margin:2px 2px 2px 0;padding:10px 12px;border:none;border-radius:10px;background:#9c27b0;color:#fff;cursor:pointer;">Seduction</button>
				<button onclick="PlayerAddSkill('Sports', 1)" style="margin:2px 2px 2px 0;padding:10px 12px;border:none;border-radius:10px;background:#795548;color:#fff;cursor:pointer;">Sports</button>
			</div>
			<div style="background:#222;padding:14px;border-radius:12px;grid-column:span 2;">
				<h3 style="margin:0 0 12px;font-size:1.1rem;color:#fff;">Inventory</h3>
				<div style="display:grid;grid-template-columns:repeat(auto-fit,minmax(130px,1fr));gap:8px;">
					<button onclick="PlayerAddInventory('Armbinder', 1)" style="padding:10px 12px;border:none;border-radius:10px;background:#607d8b;color:#fff;cursor:pointer;">Armbinder</button>
					<button onclick="PlayerAddInventory('BallGag', 1)" style="padding:10px 12px;border:none;border-radius:10px;background:#607d8b;color:#fff;cursor:pointer;">BallGag</button>
					<button onclick="PlayerAddInventory('Blindfold', 1)" style="padding:10px 12px;border:none;border-radius:10px;background:#607d8b;color:#fff;cursor:pointer;">Blindfold</button>
					<button onclick="PlayerAddInventory('ButtPlug', 1)" style="padding:10px 12px;border:none;border-radius:10px;background:#607d8b;color:#fff;cursor:pointer;">ButtPlug</button>
					<button onclick="PlayerAddInventory('ChastityBelt', 1)" style="padding:10px 12px;border:none;border-radius:10px;background:#607d8b;color:#fff;cursor:pointer;">ChastityBelt</button>
					<button onclick="PlayerAddInventory('ClothGag', 1)" style="padding:10px 12px;border:none;border-radius:10px;background:#607d8b;color:#fff;cursor:pointer;">ClothGag</button>
					<button onclick="PlayerAddInventory('Collar', 1)" style="padding:10px 12px;border:none;border-radius:10px;background:#607d8b;color:#fff;cursor:pointer;">Collar</button>
					<button onclick="PlayerAddInventory('Crop', 1)" style="padding:10px 12px;border:none;border-radius:10px;background:#607d8b;color:#fff;cursor:pointer;">Crop</button>
					<button onclick="PlayerAddInventory('Cuffs', 1)" style="padding:10px 12px;border:none;border-radius:10px;background:#607d8b;color:#fff;cursor:pointer;">Cuffs</button>
					<button onclick="PlayerAddInventory('CuffsKey', 1)" style="padding:10px 12px;border:none;border-radius:10px;background:#607d8b;color:#fff;cursor:pointer;">CuffsKey</button>
					<button onclick="PlayerAddInventory('DoubleOpenGag', 1)" style="padding:10px 12px;border:none;border-radius:10px;background:#607d8b;color:#fff;cursor:pointer;">DoubleOpenGag</button>
					<button onclick="PlayerAddInventory('PantieGag', 1)" style="padding:10px 12px;border:none;border-radius:10px;background:#607d8b;color:#fff;cursor:pointer;">PantieGag</button>
					<button onclick="PlayerAddInventory('Rope', 1)" style="padding:10px 12px;border:none;border-radius:10px;background:#607d8b;color:#fff;cursor:pointer;">Rope</button>
					<button onclick="PlayerAddInventory('SleepingPill', 1)" style="padding:10px 12px;border:none;border-radius:10px;background:#607d8b;color:#fff;cursor:pointer;">SleepingPill</button>
					<button onclick="PlayerAddInventory('SockGag', 1)" style="padding:10px 12px;border:none;border-radius:10px;background:#607d8b;color:#fff;cursor:pointer;">SockGag</button>
					<button onclick="PlayerAddInventory('TapeGag', 1)" style="padding:10px 12px;border:none;border-radius:10px;background:#607d8b;color:#fff;cursor:pointer;">TapeGag</button>
					<button onclick="PlayerAddInventory('VibratingEgg', 1)" style="padding:10px 12px;border:none;border-radius:10px;background:#607d8b;color:#fff;cursor:pointer;">VibratingEgg</button>
				</div>
			</div>
			<div style="background:#222;padding:14px;border-radius:12px;grid-column:span 2;">
				<h3 style="margin:0 0 12px;font-size:1.1rem;color:#fff;">Lock Inventory</h3>
				<div style="display:grid;grid-template-columns:repeat(auto-fit,minmax(130px,1fr));gap:8px;">
					<button onclick="ToggleInventoryLock('Armbinder')" style="padding:10px 12px;border:none;border-radius:10px;background:#795548;color:#fff;cursor:pointer;">Armbinder</button>
					<button onclick="ToggleInventoryLock('BallGag')" style="padding:10px 12px;border:none;border-radius:10px;background:#795548;color:#fff;cursor:pointer;">BallGag</button>
					<button onclick="ToggleInventoryLock('Blindfold')" style="padding:10px 12px;border:none;border-radius:10px;background:#795548;color:#fff;cursor:pointer;">Blindfold</button>
					<button onclick="ToggleInventoryLock('ButtPlug')" style="padding:10px 12px;border:none;border-radius:10px;background:#795548;color:#fff;cursor:pointer;">ButtPlug</button>
					<button onclick="ToggleInventoryLock('ChastityBelt')" style="padding:10px 12px;border:none;border-radius:10px;background:#795548;color:#fff;cursor:pointer;">ChastityBelt</button>
					<button onclick="ToggleInventoryLock('ClothGag')" style="padding:10px 12px;border:none;border-radius:10px;background:#795548;color:#fff;cursor:pointer;">ClothGag</button>
					<button onclick="ToggleInventoryLock('Collar')" style="padding:10px 12px;border:none;border-radius:10px;background:#795548;color:#fff;cursor:pointer;">Collar</button>
					<button onclick="ToggleInventoryLock('Cuffs')" style="padding:10px 12px;border:none;border-radius:10px;background:#795548;color:#fff;cursor:pointer;">Cuffs</button>
					<button onclick="ToggleInventoryLock('DoubleOpenGag')" style="padding:10px 12px;border:none;border-radius:10px;background:#795548;color:#fff;cursor:pointer;">DoubleOpenGag</button>
					<button onclick="ToggleInventoryLock('PantieGag')" style="padding:10px 12px;border:none;border-radius:10px;background:#795548;color:#fff;cursor:pointer;">PantieGag</button>
					<button onclick="ToggleInventoryLock('Rope')" style="padding:10px 12px;border:none;border-radius:10px;background:#795548;color:#fff;cursor:pointer;">Rope</button>
					<button onclick="ToggleInventoryLock('SleepingPill')" style="padding:10px 12px;border:none;border-radius:10px;background:#795548;color:#fff;cursor:pointer;">SleepingPill</button>
					<button onclick="ToggleInventoryLock('SockGag')" style="padding:10px 12px;border:none;border-radius:10px;background:#795548;color:#fff;cursor:pointer;">SockGag</button>
					<button onclick="ToggleInventoryLock('TapeGag')" style="padding:10px 12px;border:none;border-radius:10px;background:#795548;color:#fff;cursor:pointer;">TapeGag</button>
					<button onclick="ToggleInventoryLock('VibratingEgg')" style="padding:10px 12px;border:none;border-radius:10px;background:#795548;color:#fff;cursor:pointer;">VibratingEgg</button>
				</div>
			</div>
		</div>
	</div>
</div>
<button id="cheat-toggle-button" style="position:fixed;z-index:999999;right:16px;bottom:16px;width:56px;height:56px;border-radius:50%;border:none;background:#e91e63;color:#fff;font-weight:bold;font-size:0.95rem;cursor:pointer;box-shadow:0 8px 18px rgba(0,0,0,0.35);">Cheat</button>
`;

function CheatKey() {

	// No cheats until the player has a name
	if (Common_PlayerName != "") {
		// In a fight or a race, the user can press * to win automatically
		if (!FightEnded && (FightTimer > 0)) { if (KeyPress == 42) FightEnd(true); return; }
		if (!DoubleFightEnded && (DoubleFightTimer > 0)) { if (KeyPress == 42) DoubleFightEnd(true); return; }
		if (!RaceEnded && (RaceTimer > 0)) { if (KeyPress == 42) { RaceProgress = RaceGoal; RaceEnd(true); } return; }
		if (!QuizEnded && (QuizTimer > 0) && (QuizBetweenQuestionTimer == 0) && (QuizAnswerText == "")) { if (KeyPress == 42) { QuizAnswerText = QuizQuestion[QuizProgressLeft + QuizProgressRight][QuizQuestionAnswer1]; QuizAnswerBy = "Left"; QuizProgressLeft++; QuizBetweenQuestionTimer = QuizTimer + QuizOtherQuestionTime; } return; }

		// If we must manipulate time using + and -
		if (KeyPress == 43) CheatTime(900000);
		if (KeyPress == 45) CheatTime(-900000);

		// Specific cheats by functions
		if (CurrentActor != "") CheatActor();
		if ((CurrentChapter == "C012_AfterClass") && (CurrentScreen == "Dorm")) CheatDorm();
		if(TranslationCheatAllow) CheatTranslation(); else CheatSkill(); // skill modifiyng keys 5 - 9 are reused for translation related functions
		CheatInventory();

	}

}

function CreateCheatUI() {
	if (document.getElementById("cheat-toggle-button")) return;
	const temp = document.createElement("div");
	temp.innerHTML = cheatHtml;
	while (temp.firstChild) document.body.appendChild(temp.firstChild);

	const toggle = document.getElementById("cheat-toggle-button");
	if (toggle) {
		toggle.addEventListener("click", toggleCheatMenu);
		toggle.addEventListener("touchstart", toggleCheatMenu);
	}

	const backdrop = document.getElementById("cheat-backdrop");
	if (backdrop) {
		backdrop.addEventListener("click", function (event) {
			if (event.target === backdrop) hideCheatMenu();
		});
	}
}

function OpenCheatMenu() {
	const cheat = document.getElementById("cheat-backdrop");
	if (cheat) cheat.style.display = "block";
}

function hideCheatMenu() {
	const cheat = document.getElementById("cheat-backdrop");
	if (cheat) cheat.style.display = "none";
}

function toggleCheatMenu(event) {
	if (event) {
		event.preventDefault();
		event.stopPropagation();
	}
	const cheat = document.getElementById("cheat-backdrop");
	if (!cheat) return;
	cheat.style.display = (cheat.style.display === "block") ? "none" : "block";
}

function AddActorLove() { if (CurrentActor != "") ActorChangeAttitude(1, 0); }
function AddActorHate() { if (CurrentActor != "") ActorChangeAttitude(-1, 0); }
function AddActorSubmission() { if (CurrentActor != "") ActorChangeAttitude(0, 1); }
function AddActorDominance() { if (CurrentActor != "") ActorChangeAttitude(0, -1); }
function WinFight() { if (!FightEnded && (FightTimer > 0)) FightEnd(true); }
function WinDoubleFight() { if (!DoubleFightEnded && (DoubleFightTimer > 0)) DoubleFightEnd(true); }
function FinishRace() { if (!RaceEnded && (RaceTimer > 0)) { RaceProgress = RaceGoal; RaceEnd(true); } }
function AutoAnswerQuiz() { if (!QuizEnded && (QuizTimer > 0) && (QuizBetweenQuestionTimer == 0) && (QuizAnswerText == "")) { QuizAnswerText = QuizQuestion[QuizProgressLeft + QuizProgressRight][QuizQuestionAnswer1]; QuizAnswerBy = "Left"; QuizProgressLeft++; QuizBetweenQuestionTimer = QuizTimer + QuizOtherQuestionTime; } }
function ReleaseDormBondage() { if ((CurrentChapter == "C012_AfterClass") && (CurrentScreen == "Dorm") && !GameLogQuery(CurrentChapter, "", "EventGrounded")) { PlayerReleaseBondage(); if (PlayerHasLockedInventory("ChastityBelt")) { PlayerUnlockInventory("ChastityBelt"); PlayerAddInventory("ChastityBelt", 1); } if (PlayerHasLockedInventory("VibratingEgg")) { PlayerUnlockInventory("VibratingEgg"); PlayerAddInventory("VibratingEgg", 1); } } }
function ToggleInventoryLock(item) { if (PlayerHasLockedInventory(item)) PlayerUnlockInventory(item); else PlayerLockInventory(item); }
function ToggleGameTimer() { if (RunTimer) StopTimer(CurrentTime); else StartTimer(LimitTimer, LimitChapter, LimitScreen); }
function JumpToNextEvent() { if (typeof LimitTimer !== 'undefined') CurrentTime = LimitTimer; }

// Cheats the clock by adding or removing time
function CheatTime(TimeChange) {

	if (RunTimer) {
		CurrentTime = CurrentTime + TimeChange;
		if (CurrentTime <= 0) CurrentTime = 1;
		for (var L = 0; L < GameLog.length; L++) {
			if (GameLog[L][GameLogTimer] > 0) {
				GameLog[L][GameLogTimer] = GameLog[L][GameLogTimer] + TimeChange;
				if (GameLog[L][GameLogTimer] <= 0) GameLog[L][GameLogTimer] = 1;
				if (GameLog[L][GameLogTimer] > 24 * 60 * 60 * 1000) GameLog[L][GameLogTimer] = 24 * 60 * 60 * 1000;
			}
		}
	}

}

function CheatActor() {
	if (KeyPress == 49) ActorChangeAttitude(1, 0);
	if (KeyPress == 50) ActorChangeAttitude(-1, 0);
	if (KeyPress == 51) ActorChangeAttitude(0, 1);
	if (KeyPress == 52) ActorChangeAttitude(0, -1);
}

function CheatSkill() {
	if (KeyPress == 53) PlayerAddSkill("Arts", 1);
	if (KeyPress == 54) PlayerAddSkill("Fighting", 1);
	if (KeyPress == 55) PlayerAddSkill("RopeMastery", 1);
	if (KeyPress == 56) PlayerAddSkill("Seduction", 1);
	if (KeyPress == 57) PlayerAddSkill("Sports", 1);
}

function CheatTranslation() {
	let stageTexts = CurrentStage;
	let texts = CurrentText;
	let screenPath = CurrentChapter + "_" + CurrentScreen;
	let displayedStageNumber;

	switch (KeyPress) {
		case 47:
			let language = GetWorkingLanguage();
			let fileTypes = ["Intro", "Stage", "Text"];
			for (var c in fileTypes) {
				var cachePath = CurrentChapter + "/" + CurrentScreen + "/" + fileTypes[c] + (language ? ("_" + language) : "") + ".csv";
				if (CSVCache[cachePath]) delete CSVCache[cachePath];
			}
			TranslationCacheCounter++;
			if (CurrentIntro !== null && CurrentStage !== null) {
				LoadInteractions();
			} else if (CurrentText !== null) {
				LoadText();
			}
			break;
		case 54:
		case 57:
			if (texts && texts.length > 1) {
				if (KeyPress === 57) TranslationCurrentText--; else TranslationCurrentText++;
				TranslationCurrentText = Math.min(texts.length - 1, Math.max(1, TranslationCurrentText));
				let displayText = texts[TranslationCurrentText][TextContent].trim();
				if (displayText !== "") OverridenIntroText = displayText; else OverridenIntroText = "** Text is empty";
			}
			break;
		case 53:
		case 56:
			if (!TranslationSavedStage || TranslationSavedStage.screen !== screenPath) {
				TranslationSavedStage = {
					stage: window[screenPath + "_CurrentStage"],
					screen: screenPath,
					overridenText: OverridenIntroText
				};
				TranslationCurrentStageFileLine = 1;
			}

			if (stageTexts && stageTexts.length > 1) {
				if (KeyPress === 56) TranslationCurrentStageFileLine--; else TranslationCurrentStageFileLine++;
				TranslationCurrentStageFileLine = Math.min(stageTexts.length - 1, Math.max(1, TranslationCurrentStageFileLine));
				let displayText = stageTexts[TranslationCurrentStageFileLine][StageInteractionResult].trim();
				displayedStageNumber = stageTexts[TranslationCurrentStageFileLine][StageNumber];
				if (displayText !== "") OverridenIntroText = displayText; else OverridenIntroText = "** Stage has empty interaction result";
				window[screenPath + "_CurrentStage"] = displayedStageNumber;
				console.log("Stage: " + displayedStageNumber + " Line: " + (TranslationCurrentStageFileLine + 1));
			}
			break;
		case 55:
			OverridenIntroText = "";
			break;
		case 61:
			if (TranslationSavedStage) {
				window[screenPath + "_CurrentStage"] = TranslationSavedStage.stage;
				OverridenIntroText = TranslationSavedStage.overridenText;
				TranslationSavedStage = undefined;
			}
			break;
		case 46:
			TranslationCurrentStageFileLine = Math.min(stageTexts.length - 1, Math.max(1, TranslationCurrentStageFileLine));
			displayedStageNumber = stageTexts[TranslationCurrentStageFileLine][StageNumber];
			if (typeof displayedStageNumber !== undefined) {
				var flipped = {};
				for (var i in stageTexts) {
					let prereqVarname = stageTexts[i][StageVarReq].trim();
					if (stageTexts[i][StageNumber] === displayedStageNumber && prereqVarname !== "") {
						let toFlip = "";
						if (prereqVarname.substring(0, 1) == "!") prereqVarname = prereqVarname.substring(1);
						if (prereqVarname.substring(0, 7) == "Common_") {
							toFlip = prereqVarname;
						} else {
							toFlip = screenPath + "_" + prereqVarname;
						}
						if (toFlip && !flipped[toFlip]) {
							window[toFlip] = !window[toFlip];
							flipped[toFlip] = true;
							console.log("Flipped " + toFlip);
						}
					}
				}
			}
			break;
	}
}

function CheatInventory() {
	if ((KeyPress == 65) || (KeyPress == 97)) PlayerAddInventory("Armbinder", 1);
	if ((KeyPress == 66) || (KeyPress == 98)) PlayerAddInventory("BallGag", 1);
	if ((KeyPress == 67) || (KeyPress == 99)) PlayerAddInventory("Cuffs", 1);
	if ((KeyPress == 70) || (KeyPress == 102)) PlayerAddInventory("ChastityBelt", 1);
	if ((KeyPress == 71) || (KeyPress == 103)) PlayerAddInventory("ClothGag", 1);
	if ((KeyPress == 75) || (KeyPress == 107)) PlayerAddInventory("CuffsKey", 1);
	if ((KeyPress == 76) || (KeyPress == 108)) PlayerAddInventory("Collar", 1);
	if ((KeyPress == 80) || (KeyPress == 112)) PlayerAddInventory("Crop", 1);
	if ((KeyPress == 82) || (KeyPress == 114)) PlayerAddInventory("Rope", 1);
	if ((KeyPress == 83) || (KeyPress == 115)) PlayerAddInventory("SleepingPill", 1);
	if ((KeyPress == 84) || (KeyPress == 116)) PlayerAddInventory("TapeGag", 1);
	if ((KeyPress == 86) || (KeyPress == 118)) PlayerAddInventory("VibratingEgg", 1);
}

function CheatDorm() {
	if ((KeyPress == 42) && !GameLogQuery(CurrentChapter, "", "EventGrounded")) {
		PlayerReleaseBondage();
		if (PlayerHasLockedInventory("ChastityBelt")) { PlayerUnlockInventory("ChastityBelt"); PlayerAddInventory("ChastityBelt", 1); }
		if (PlayerHasLockedInventory("VibratingEgg")) { PlayerUnlockInventory("VibratingEgg"); PlayerAddInventory("VibratingEgg", 1); }
	}
}

window.addEventListener("load", function() {
	CreateCheatUI();
});

if (document.readyState === "complete") {
	CreateCheatUI();
}

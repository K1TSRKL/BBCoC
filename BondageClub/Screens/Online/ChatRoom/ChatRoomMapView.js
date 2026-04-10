// @ts-strict-ignore
"use strict";

const ChatRoomMapViewName = "Map";
var ChatRoomMapViewWidth = 40;
var ChatRoomMapViewHeight = 40;
var ChatRoomMapViewPerceptionRange = 4;
var ChatRoomMapViewPerceptionRangeMin = 1;
var ChatRoomMapViewPerceptionRangeMax = 7;
var ChatRoomMapViewObjectStartID = 100;
var ChatRoomMapViewObjectEntryID = 110;
/** @type {"" |  "Tile" | "Object" | "TileType" | "ObjectType" | "Effect"} */
var ChatRoomMapViewEditMode = "";
/** @type {"" | ChatRoomMapTileType | ChatRoomMapObjectType} */
var ChatRoomMapViewEditSubMode = "";
var ChatRoomMapViewEditStarted = false;
/** @type {null | ChatRoomMapDoodad | ChatRoomMapEffect} */
var ChatRoomMapViewEditObject = null;
/** @type {number[]} */
var ChatRoomMapViewEditSelection = [];
var ChatRoomMapViewEditRange = 1;
/** @type {ServerChatRoomMapData[]} */
var ChatRoomMapViewEditBackup = [];
/** @type {null | number} */
var ChatRoomMapViewUpdateRoomNext = null;
/** @type {null | number} */
var ChatRoomMapViewUpdatePlayerNext = null;
/** @type {null | number} */
var ChatRoomMapViewUpdateLastMapDataNext = null;
/** @type {null | Character} */
var ChatRoomMapViewFocusedCharacter = null;
var ChatRoomMapViewFocusedCharacterX = 0;
var ChatRoomMapViewFocusedCharacterY = 0;
var ChatRoomMapViewSuperPowersActive = false;
// The base number of miliseconds required to reach a new tile
var ChatRoomMapViewBaseMovementSpeed = 200;
/** @type {null | ChatRoomMapMovement} */
var ChatRoomMapViewMovement = null;
/** @type {ChatRoomMapType[]} */
var ChatRoomMapViewTypeList = ["Never", "Hybrid", "Always"];
var ChatRoomMapViewUpdatePlayerTime = 500;
const ChatRoomMapViewPerceptionRaycastOffset = 0.4999;
const ChatRoomMapViewWhisperRange = 1;
const ChatRoomMapViewInteractionRange = 1;
const ChatRoomMapViewRemoteRange = ChatRoomMapViewPerceptionRangeMax;

/** @type {boolean[]} */
var ChatRoomMapViewVisibilityMask = [];
/** @type {boolean[]} */
var ChatRoomMapViewAudibilityMask = [];
/** @type {Uint16Array | null} */
var ChatRoomMapViewTileFog = null;
/** @type {Uint16Array | null} */
var ChatRoomMapViewObjectFog = null;
var ChatRoomMapViewKeysPressed = {
	u: false,
	d: false,
	l: false,
	r: false,
};
var ChatRoomMapViewStartOfKeyPress = 0;
/** @type {Record<number, ChatRoomMapTile | undefined>} */
var ChatRoomMapViewTileLookup = {};
/** @type {Record<number, ChatRoomMapObject | undefined>} */
var ChatRoomMapViewObjectLookup = {};
/** @type {Map<number, Character>} */
var ChatRoomMapViewCharacterMap = new Map();


document.addEventListener("blur", () => {
	if (ChatRoomMapViewIsActive()) ChatRoomMapViewBlur();
});

const ChatRoomMapViewEffectStartID = 10;

/**
 * A list of predefined lighting effects. May be replaced with a color picker in the future.
 * @type {ChatRoomMapEffect[]}
 * */
const ChatRoomMapViewEffectList = [
	{ ID: 10, Type: "StaticLighting", TypeId: 1, Color: [0, 0, 0, 0.0] }, // Blank

	{ ID: 11, Type: "StaticLighting", TypeId: 1, Color: [0, 0, 0, 0.2] }, // ShadowLight
	{ ID: 12, Type: "StaticLighting", TypeId: 1, Color: [0, 0, 0, 0.5] }, // ShadowMedium
	{ ID: 13, Type: "StaticLighting", TypeId: 1, Color: [0, 0, 0, 0.8] }, // ShadowDark
	{ ID: 14, Type: "StaticLighting", TypeId: 1, Color: [255, 0, 0, 0.3] }, // TintRed
	{ ID: 15, Type: "StaticLighting", TypeId: 1, Color: [0, 0, 255, 0.3] }, // TintBlue
	{ ID: 16, Type: "StaticLighting", TypeId: 1, Color: [0, 255, 0, 0.3] }, // TintGreen
	{ ID: 17, Type: "StaticLighting", TypeId: 1, Color: [255, 255, 0, 0.3] }, // GlowYellow
];

/** @type {ChatRoomMapTile[]} */
const ChatRoomMapViewTileList = [
	{ ID: 100, Type: "Floor", Style: "OakWood" },
	{ ID: 110, Type: "Floor", Style: "Stone" },
	{ ID: 115, Type: "Floor", Style: "Pavement" },
	{ ID: 120, Type: "Floor", Style: "Ceramic" },
	{ ID: 130, Type: "Floor", Style: "CarpetPink" },
	{ ID: 131, Type: "Floor", Style: "CarpetBlue" },
	{ ID: 132, Type: "Floor", Style: "CarpetRed" },
	{ ID: 140, Type: "Floor", Style: "Padded" },
	{ ID: 150, Type: "Floor", Style: "LatexFloor" },
	{ ID: 160, Type: "Floor", Style: "Tile" },

	{ ID: 200, Type: "FloorExterior", Style: "Dirt" },
	{ ID: 210, Type: "FloorExterior", Style: "Grass" },
	{ ID: 215, Type: "FloorExterior", Style: "LongGrass" },
	{ ID: 220, Type: "FloorExterior", Style: "Sand" },
	{ ID: 230, Type: "FloorExterior", Style: "Gravel" },
	{ ID: 235, Type: "FloorExterior", Style: "Asphalt" },
	{ ID: 240, Type: "FloorExterior", Style: "Snow" },
	{ ID: 250, Type: "FloorExterior", Style: "StoneSquareGray" },
	{ ID: 260, Type: "FloorExterior", Style: "ScatteredLeaves" },
	{ ID: 270, Type: "FloorExterior", Style: "ScatteredLeavesDirt" },
	{ ID: 280, Type: "FloorExterior", Style: "ScatteredLeavesThick" },

	{ ID: 1000, Type: "Wall", Style: "MixedWood", BlockVision: true, CanEnter: () => false, },
	{ ID: 1001, Type: "Wall", Style: "CedarWood", BlockVision: true, CanEnter: () => false, },
	{ ID: 1010, Type: "Wall", Style: "Log", BlockVision: true, CanEnter: () => false, },
	{ ID: 1020, Type: "Wall", Style: "Japanese", BlockVision: true, CanEnter: () => false, },
	{ ID: 1030, Type: "Wall", Style: "Stone", BlockVision: true, CanEnter: () => false, },
	{ ID: 1040, Type: "Wall", Style: "Brick", BlockVision: true, CanEnter: () => false, },
	{ ID: 1050, Type: "Wall", Style: "Dungeon", BlockVision: true, CanEnter: () => false, },
	{ ID: 1060, Type: "Wall", Style: "Square", BlockVision: true, BlockHearing: true, CanEnter: () => false, },
	{ ID: 1070, Type: "Wall", Style: "Steel", BlockVision: true, BlockHearing: true, CanEnter: () => false, },
	{ ID: 1080, Type: "Wall", Style: "Padded", BlockVision: true, BlockHearing: true, CanEnter: () => false, },
	{ ID: 1090, Type: "Wall", Style: "Tile", BlockVision: true, CanEnter: () => false, },
	{ ID: 1100, Type: "Wall", Style: "Lattice", BlockVision: true, CanEnter: () => false, },

	{ ID: 2000, Type: "Water", Style: "Pool", Transparency: 0.5, TransparencyCutoutHeight: 0.45 },
	{ ID: 2010, Type: "Water", Style: "Sea", Transparency: 0.5, TransparencyCutoutHeight: 0.45 },
	{ ID: 2020, Type: "Water", Style: "Ocean", Transparency: 0.5, TransparencyCutoutHeight: 0.3 },
	{ ID: 2025, Type: "Water", Style: "OceanCyan", Transparency: 0.5, TransparencyCutoutHeight: 0.3 },
	{ ID: 2030, Type: "Water", Style: "OceanCalm", Transparency: 0.3, TransparencyCutoutHeight: 0.5 },
	{ ID: 2040, Type: "Water", Style: "Swamp", Transparency: 0.9, TransparencyCutoutHeight: 0.5 },
	{ ID: 2050, Type: "Water", Style: "Waves", Transparency: 0.6, TransparencyCutoutHeight: 0.1 },
	{ ID: 2060, Type: "Water", Style: "Shallow", Transparency: 0.3, TransparencyCutoutHeight: 0.5 },
	{ ID: 2090, Type: "Water", Style: "Lava", Transparency: 0.9, TransparencyCutoutHeight: 0.3, CanEnter: () => Player.Title === "Dragon"},
];

/** @type {ChatRoomMapObject[]} */
const ChatRoomMapViewObjectList = [

	{ ID: 100, Type: "FloorDecoration", Style: "Blank" },
	{ ID: 110, Type: "FloorDecoration", Style: "EntryFlag", Top: -0.125, Exit: true, Unique: true },
	{ ID: 115, Type: "FloorDecoration", Style: "ExitFlag", Top: -0.125, Exit: true },
	{ ID: 120, Type: "FloorDecoration", Style: "BedTeal", Top: -0.25, AssetName: "Bed", AssetGroup: "ItemDevices"},
	{ ID: 130, Type: "FloorDecoration", Style: "PillowPink" },
	{ ID: 140, Type: "FloorDecoration", Style: "TableBrown" },
	{ ID: 151, Type: "FloorDecoration", Style: "ChairWood", Top: -0.5, Height: 1.5 },
	{ ID: 150, Type: "FloorDecoration", Style: "ThroneRed", Top: -1, Height: 2 },
	{ ID: 160, Type: "FloorDecoration", Style: "KeyBronze", OnEnter: function(){ Player.MapData.PrivateState.HasKeyBronze = true; }, IsVisible: function(){ return !Player.MapData.PrivateState.HasKeyBronze; } },
	{ ID: 162, Type: "FloorDecoration", Style: "KeySilver", OnEnter: function(){ Player.MapData.PrivateState.HasKeySilver = true; }, IsVisible: function(){ return !Player.MapData.PrivateState.HasKeySilver; } },
	{ ID: 164, Type: "FloorDecoration", Style: "KeyGold" , OnEnter: function(){ Player.MapData.PrivateState.HasKeyGold = true; }, IsVisible: function(){ return !Player.MapData.PrivateState.HasKeyGold; } },
	{ ID: 165, Type: "FloorDecoration", Style: "VikingChair" , Top: -0.5, Height: 2 },
	{ ID: 166, Type: "FloorDecoration", Style: "Bed" , Top: -0.82, Left: 0.05, Height: 1.8, Width: 0.90, AssetName: "Bed", AssetGroup: "ItemDevices" },
	{ ID: 170, Type: "FloorDecoration", Style: "Stairs" , Top: 0, Left: 0 },
	{ ID: 180, Type: "FloorDecoration", Style: "AirConditioner" , Top: 0, Left: 0 },


	{ ID: 200, Type: "FloorDecorationThemed", Style: "Blank" },
	{ ID: 210, Type: "FloorDecorationThemed", Style: "TeacherDesk", Top: -0.25 },
	{ ID: 220, Type: "FloorDecorationThemed", Style: "StudentDesk", Top: -0.1 },
	{ ID: 250, Type: "FloorDecorationThemed", Style: "SinkDishes", Top: -0.35 },
	{ ID: 260, Type: "FloorDecorationThemed", Style: "LaundryMachine", Top: -0.55, Height: 1.25 },
	{ ID: 270, Type: "FloorDecorationThemed", Style: "IroningBoard", Top: -0.35 },
	{ ID: 300, Type: "FloorDecorationThemed", Style: "ShibariFrame", Top: -1, Height: 2 },
	{ ID: 310, Type: "FloorDecorationThemed", Style: "JapaneseTable", Top: -0.1 },
	{ ID: 320, Type: "FloorDecorationThemed", Style: "BanzaiTree", Top: -0.1 },
	{ ID: 350, Type: "FloorDecorationThemed", Style: "MedicalDesk", Top: -0.15 },
	{ ID: 370, Type: "FloorDecorationThemed", Style: "Toilet", Top: -0.65, Left: 0.05, Height: 1.5, Width: 0.9 },

	{ ID: 500, Type: "FloorDecorationParty", Style: "Blank" },
	{ ID: 510, Type: "FloorDecorationParty", Style: "BalloonFiveColor", Top: -0.6, Height: 1.5 },
	{ ID: 511, Type: "FloorDecorationParty", Style: "BalloonTwoHeart", Top: -0.15 },
	{ ID: 520, Type: "FloorDecorationParty", Style: "WeddingCake", Top: -1, Height: 2 },
	{ ID: 521, Type: "FloorDecorationParty", Style: "WeddingArch", Top: -1, Height: 2 },
	{ ID: 530, Type: "FloorDecorationParty", Style: "FlowerVasePink", Top: -0.33 },
	{ ID: 560, Type: "FloorDecorationParty", Style: "BeachUmbrellaStripe", Top: -1.1, Height: 2 },
	{ ID: 570, Type: "FloorDecorationParty", Style: "BeachTowelStripe" },
	{ ID: 580, Type: "FloorDecorationParty", Style: "Speaker", Top: -1.2, Height: 1.85 },
	{ ID: 590, Type: "FloorDecorationParty", Style: "Presents", Top: 0.25, Height: 0.50 },

	{ ID: 600, Type: "FloorDecorationCamping", Style: "Blank" },
	{ ID: 610, Type: "FloorDecorationCamping", Style: "LogFire", Top: -0.35 },
	{
		ID: 611,
		Type: "FloorDecorationCamping",
		Style: "LogFireAnim0",
		Height: 1,
		Top: -0.5,
		BuildImageName: function(X, Y) {
			let Frame = (Math.floor(CurrentTime / 150) + X + Y * 3) % 10;
			return "LogFireAnim" + Frame.toString();
		}
	},
	{ ID: 620, Type: "FloorDecorationCamping", Style: "LogSingle", Top: -0.2 },
	{ ID: 630, Type: "FloorDecorationCamping", Style: "TentBlue", Top: -0.3 },
	{ ID: 640, Type: "FloorDecorationCamping", Style: "SleepingBagBlue" },
	{ ID: 650, Type: "FloorDecorationCamping", Style: "ChairRed", Top: -0.35 },
	{ ID: 660, Type: "FloorDecorationCamping", Style: "Hurdle1", CanEnter: () => !Player.HasEffect("Freeze") },
	{ ID: 670, Type: "FloorDecorationCamping", Style: "Hurdle2", CanEnter: () => !Player.HasEffect("Freeze") && !Player.HasEffect("Slow") },
	{ ID: 680, Type: "FloorDecorationCamping", Style: "Hurdle3" },

	{ ID: 700, Type: "FloorDecorationExpanding", Style: "Blank" },
	{
		ID: 710,
		Type: "FloorDecorationExpanding",
		Style: "CouchPinkPreview",
		BuildImageName: function(X, Y) {
			let LeftObject = ChatRoomMapViewGetObjectAtPos(X - 1, Y);
			let RightObject = ChatRoomMapViewGetObjectAtPos(X + 1, Y);
			if ((LeftObject != null) && (LeftObject.ID == this.ID) && ((RightObject != null) && (RightObject.ID == this.ID))) return "CouchPinkMiddle";
			if ((LeftObject != null) && (LeftObject.ID == this.ID)) return "CouchPinkRight";
			if ((RightObject != null) && (RightObject.ID == this.ID))return "CouchPinkLeft";
			return "CouckPinkSmall";
		},
		Top: -0.35
	},
	{
		ID: 720,
		Type: "FloorDecorationExpanding",
		Style: "BedBluePreview",
		BuildImageName: function(X, Y) {
			let LeftObject = ChatRoomMapViewGetObjectAtPos(X - 1, Y);
			let RightObject = ChatRoomMapViewGetObjectAtPos(X + 1, Y);
			if ((LeftObject != null) && (LeftObject.ID == this.ID) && ((RightObject != null) && (RightObject.ID == this.ID))) return "BedBlueMiddle";
			if ((LeftObject != null) && (LeftObject.ID == this.ID)) return "BedBlueRight";
			if ((RightObject != null) && (RightObject.ID == this.ID)) return "BedBlueLeft";
			return "BedBlueSmall";
		},
		Top: -1,
		Height: 2
	},
	{
		ID: 730,
		Type: "FloorDecorationExpanding",
		Style: "BallPitPreview",
		BuildImageName: function(X, Y) {
			let LeftObject = ChatRoomMapViewGetObjectAtPos(X - 1, Y);
			let RightObject = ChatRoomMapViewGetObjectAtPos(X + 1, Y);
			if ((LeftObject != null) && (LeftObject.ID == this.ID) && ((RightObject != null) && (RightObject.ID == this.ID))) return "BallPitMiddle";
			if ((LeftObject != null) && (LeftObject.ID == this.ID)) return "BallPitRight";
			if ((RightObject != null) && (RightObject.ID == this.ID)) return "BallPitLeft";
			return "BallPitSmall";
		},
		Top: -0.25,
		Height: 1.25,
		Transparency: 1,
		TransparencyCutoutHeight: 0.96
	},
	{
		ID: 740,
		Type: "FloorDecorationExpanding",
		Style: "VikingTablePreview",
		BuildImageName: function(X, Y) {
			let LeftObject = ChatRoomMapViewGetObjectAtPos(X - 1, Y);
			let RightObject = ChatRoomMapViewGetObjectAtPos(X + 1, Y);
			if ((LeftObject != null) && (LeftObject.ID == this.ID) && ((RightObject != null) && (RightObject.ID == this.ID))) return "VikingTableMiddle";
			if ((LeftObject != null) && (LeftObject.ID == this.ID)) return "VikingTableRight";
			if ((RightObject != null) && (RightObject.ID == this.ID)) return "VikingTableLeft";
			return "VikingTableSmall";
		},
		Top: -0.25,
		Height: 1.25,
		Transparency: 1,
		TransparencyCutoutHeight: 0.96
	},
	{
		ID: 750,
		Type: "FloorDecorationExpanding",
		Style: "RailroadPreview", // The image shown in the map editor palette
		BuildImageName: function(X, Y) {
			// Get the connections as True/False
			let directions = ChatRoomMapViewGetConnectivityDirections(X, Y, (tX, tY) => {
				const neighbor = ChatRoomMapViewGetObjectAtPos(tX, tY);
				// Connect if neighbor exists and has the exact same ID as this track
				return neighbor != null && neighbor.ID === this.ID;
			});

			// Build the suffix string in a strict order
			let Suffix = "";
			if (directions.North) Suffix += "North";
			if (directions.South) Suffix += "South";
			if (directions.East)  Suffix += "East";
			if (directions.West)  Suffix += "West";

			// Handle the "Single" case (no connections)
			if (Suffix === "") return "Railroad"; // Default to vertical if alone

			// Return the final image name
			return "Railroad" + Suffix;
		},
		Top: 0,
	},
	{ ID: 800, Type: "FloorDecorationAnimal", Style: "Blank" },
	{
		ID: 810,
		Type: "FloorDecorationAnimal",
		Style: "CatCaramelHappy",
		Top: -0.2,
		BuildImageName: function(X, Y) {
			let Frame = (Math.floor((CurrentTime + X * 331 + Y * 197) / 2500) + X * 331 + Y * 197) % 100;
			let Anim;
			if ((Frame >= 25) && (Frame <= 27)) Anim = "Stretch";
			else if ((Frame >= 28) && (Frame <= 30)) Anim = "Idle";
			else if ((Frame >= 31) && (Frame <= 33)) Anim = "Happy";
			else if ((Frame >= 34) && (Frame <= 35)) Anim = "Idle";
			else if ((Frame >= 36) && (Frame <= 38)) Anim = "Meow";
			else if ((Frame >= 39) && (Frame <= 40)) Anim = "Happy";
			else if ((Frame >= 41) && (Frame <= 42)) Anim = "Idle";
			else if ((Frame >= 43) && (Frame <= 44)) Anim = "Happy";
			else if ((Frame >= 45) && (Frame <= 49)) Anim = "Play";
			else if ((Frame >= 50) && (Frame <= 51)) Anim = "Meow";
			else if ((Frame >= 52) && (Frame <= 54)) Anim = "Idle";
			else if ((Frame >= 55) && (Frame <= 60)) Anim = "Sleep";
			else if ((Frame >= 61) && (Frame <= 62)) Anim = "Idle";
			else if ((Frame >= 63) && (Frame <= 65)) Anim = "Play";
			else if ((Frame >= 66) && (Frame <= 69)) Anim = "Stretch";
			else if ((Frame >= 70) && (Frame <= 72)) Anim = "Meow";
			else if ((Frame >= 73) && (Frame <= 74)) Anim = "Idle";
			else if ((Frame >= 75) && (Frame <= 75)) Anim = "Happy";
			else if ((Frame >= 76) && (Frame <= 76)) Anim = "Idle";
			else if ((Frame >= 77) && (Frame <= 79)) Anim = "Meow";
			else if ((Frame >= 80) && (Frame <= 81)) Anim = "Stretch";
			else if ((Frame >= 82) && (Frame <= 85)) Anim = "Play";
			else if ((Frame >= 86) && (Frame <= 87)) Anim = "Meow";
			else if ((Frame >= 88) && (Frame <= 90)) Anim = "Happy";
			else if ((Frame >= 91) && (Frame <= 94)) Anim = "Idle";
			else if ((Frame >= 95) && (Frame <= 96)) Anim = "Meow";
			else if ((Frame >= 97) && (Frame <= 100)) Anim = "Stretch";
			else Anim = "Sleep";
			return "CatCaramel" + Anim;
		}
	},
	{
		ID: 820,
		Type: "FloorDecorationAnimal",
		Style: "DogBrownHappy",
		Top: -0.4,
		BuildImageName: function(X, Y) {
			let Frame = (Math.floor((CurrentTime + X * 347 + Y * 179) / 2000) + X * 347 + Y * 179) % 100;
			let Anim;
			if ((Frame >= 20) && (Frame <= 22)) Anim = "Roll";
			else if ((Frame >= 23) && (Frame <= 24)) Anim = "Search";
			else if ((Frame >= 25) && (Frame <= 25)) Anim = "Howl";
			else if ((Frame >= 26) && (Frame <= 27)) Anim = "Crazy";
			else if ((Frame >= 28) && (Frame <= 30)) Anim = "Happy";
			else if ((Frame >= 31) && (Frame <= 31)) Anim = "Play";
			else if ((Frame >= 32) && (Frame <= 34)) Anim = "Scratch";
			else if ((Frame >= 35) && (Frame <= 36)) Anim = "Play";
			else if ((Frame >= 37) && (Frame <= 39)) Anim = "Ball";
			else if ((Frame >= 40) && (Frame <= 41)) Anim = "Crazy";
			else if ((Frame >= 42) && (Frame <= 44)) Anim = "Search";
			else if ((Frame >= 45) && (Frame <= 46)) Anim = "Howl";
			else if ((Frame >= 47) && (Frame <= 49)) Anim = "Roll";
			else if ((Frame >= 50) && (Frame <= 50)) Anim = "Search";
			else if ((Frame >= 51) && (Frame <= 52)) Anim = "Scratch";
			else if ((Frame >= 53) && (Frame <= 64)) Anim = "Happy";
			else if ((Frame >= 55) && (Frame <= 63)) Anim = "Sleep";
			else if ((Frame >= 64) && (Frame <= 67)) Anim = "Search";
			else if ((Frame >= 68) && (Frame <= 70)) Anim = "Ball";
			else if ((Frame >= 71) && (Frame <= 72)) Anim = "Crazy";
			else if ((Frame >= 73) && (Frame <= 73)) Anim = "Howl";
			else if ((Frame >= 74) && (Frame <= 74)) Anim = "Play";
			else if ((Frame >= 75) && (Frame <= 75)) Anim = "Howl";
			else if ((Frame >= 76) && (Frame <= 78)) Anim = "Scratch";
			else if ((Frame >= 79) && (Frame <= 82)) Anim = "Roll";
			else if ((Frame >= 83) && (Frame <= 84)) Anim = "Search";
			else if ((Frame >= 85) && (Frame <= 86)) Anim = "Ball";
			else if ((Frame >= 87) && (Frame <= 89)) Anim = "Crazy";
			else if ((Frame >= 90) && (Frame <= 91)) Anim = "Happy";
			else if ((Frame >= 92) && (Frame <= 92)) Anim = "Howl";
			else if ((Frame >= 93) && (Frame <= 94)) Anim = "Search";
			else if ((Frame >= 95) && (Frame <= 97)) Anim = "Scratch";
			else if ((Frame >= 98) && (Frame <= 100)) Anim = "Roll";
			else Anim = "Sleep";
			return "DogBrown" + Anim;
		}
	},

	{
		ID: 830,
		Type: "FloorDecorationAnimal",
		Style: "RabbitBrownStand",
		Top: -0.3,
		BuildImageName: function(X, Y) {
			let Frame = (Math.floor((CurrentTime + X * 349 + Y * 193) / 1700) + X * 347 + Y * 193) % 200;
			let Anim;
			let F = Frame % 100;
			if ((F >= 2) && (F <= 5)) Anim = "Idle";
			else if ((F >= 6) && (F <= 7)) Anim = "Watch";
			else if ((F >= 8) && (F <= 9)) Anim = "Idle";
			else if ((F >= 10) && (F <= 13)) Anim = "Wait";
			else if ((F >= 14) && (F <= 16)) Anim = "Cute";
			else if ((F >= 17) && (F <= 21)) Anim = "Stand";
			else if ((F >= 22) && (F <= 23)) Anim = "Cute";
			else if ((F >= 24) && (F <= 27)) Anim = "Wait";
			else if ((F >= 28) && (F <= 30)) Anim = "Watch";
			else if ((F >= 31) && (F <= 34)) Anim = "Idle";
			else if ((F >= 35) && (F <= 41)) Anim = "Relax";
			else if ((F >= 42) && (F <= 44)) Anim = "Wait";
			else if ((F >= 45) && (F <= 45)) Anim = "Idle";
			else if ((F >= 46) && (F <= 49)) Anim = "Wait";
			else if ((F >= 50) && (F <= 55)) Anim = "Cute";
			else if ((F >= 56) && (F <= 59)) Anim = "Stand";
			else if ((F >= 60) && (F <= 61)) Anim = "Cute";
			else if ((F >= 62) && (F <= 64)) Anim = "Relax";
			else if ((F >= 65) && (F <= 69)) Anim = "Watch";
			else if ((F >= 70) && (F <= 74)) Anim = "Wait";
			else if ((F >= 75) && (F <= 76)) Anim = "Idle";
			else if ((F >= 77) && (F <= 82)) Anim = "Relax";
			else if ((F >= 83) && (F <= 85)) Anim = "Wait";
			else if ((F >= 86) && (F <= 89)) Anim = "Watch";
			else if ((F >= 90) && (F <= 91)) Anim = "Idle";
			else if ((F >= 92) && (F <= 94)) Anim = "Relax";
			else if ((F >= 95) && (F <= 98)) Anim = "Cute";
			else Anim = "Stand";
			return "RabbitBrown" + Anim + ((Frame >= 100) ? "Right" : "");
		}
	},
	{
		ID: 840,
		Type: "FloorDecorationAnimal",
		Style: "ChickenBrownIdleLeft",
		Left: 0.25,
		Width: 0.5,
		Height: 0.5,
		BuildImageName: function(X, Y) {
			let Frame = (Math.floor((CurrentTime + X * 367 + Y * 173) / 1500) + X * 367 + Y * 173) % 100;
			let Anim;
			if ((Frame >= 14) && (Frame <= 16)) Anim = "IdleLeft";
			else if (Frame == 17) Anim = "EatLeft";
			else if (Frame == 18) Anim = "IdleLeft";
			else if (Frame == 19) Anim = "EatLeft";
			else if (Frame == 20) Anim = "IdleLeft";
			else if (Frame == 21) Anim = "EatLeft";
			else if ((Frame >= 22) && (Frame <= 24)) Anim = "IdleLeft";
			else if (Frame == 25) Anim = "WalkLeft";
			else if (Frame == 26) Anim = "WalkRight";
			else if (Frame == 27) Anim = "WalkLeft";
			else if (Frame == 28) Anim = "WalkRight";
			else if (Frame == 30) Anim = "WalkLeft";
			else if (Frame == 31) Anim = "WalkRight";
			else if ((Frame >= 32) && (Frame <= 34)) Anim = "IdleRight";
			else if ((Frame >= 35) && (Frame <= 39)) Anim = "EatRight";
			else if ((Frame >= 40) && (Frame <= 41)) Anim = "IdleRight";
			else if (Frame == 42) Anim = "WalkLeft";
			else if (Frame == 43) Anim = "WalkRight";
			else if (Frame == 44) Anim = "WalkLeft";
			else if (Frame == 45) Anim = "WalkRight";
			else if ((Frame >= 46) && (Frame <= 50)) Anim = "IdleRight";
			else if ((Frame >= 51) && (Frame <= 67)) Anim = "SleepRight";
			else if ((Frame >= 67) && (Frame <= 69)) Anim = "IdleRight";
			else if ((Frame >= 70) && (Frame <= 71)) Anim = "EatRight";
			else if (Frame == 72) Anim = "IdleRight";
			else if (Frame == 73) Anim = "EatRight";
			else if (Frame == 74) Anim = "IdleRight";
			else if (Frame == 75) Anim = "EatRight";
			else if ((Frame >= 76) && (Frame <= 84)) Anim = "IdleRight";
			else if (Frame == 85) Anim = "WalkRight";
			else if (Frame == 86) Anim = "WalkLeft";
			else if (Frame == 87) Anim = "WalkRight";
			else if (Frame == 88) Anim = "WalkLeft";
			else if (Frame == 89) Anim = "WalkRight";
			else if (Frame == 90) Anim = "WalkLeft";
			else if ((Frame >= 91) && (Frame <= 92)) Anim = "IdleLeft";
			else if ((Frame >= 93) && (Frame <= 97)) Anim = "EatLeft";
			else if ((Frame >= 98) && (Frame <= 100)) Anim = "IdleLeft";
			else Anim = "SleepLeft";
			return "ChickenBrown" + Anim;
		}
	},

	{ ID: 1000, Type: "FloorItem", Style: "Blank" },
	{ ID: 1010, Type: "FloorItem", Style: "Kennel", Top: -1, Height: 2, AssetName: "Kennel", AssetGroup: "ItemDevices" },
	{ ID: 1020, Type: "FloorItem", Style: "X-Cross", Top: -1, Height: 2, AssetName: "X-Cross", AssetGroup: "ItemDevices" },
	{ ID: 1030, Type: "FloorItem", Style: "BondageBench", Top: -1, Height: 2, AssetName: "BondageBench", AssetGroup: "ItemDevices" },
	{ ID: 1040, Type: "FloorItem", Style: "Trolley", Top: -1, Height: 2, AssetName: "Trolley", AssetGroup: "ItemDevices" },
	{ ID: 1050, Type: "FloorItem", Style: "Locker", Top: -1, Height: 2, AssetName: "Locker", AssetGroup: "ItemDevices" },
	{ ID: 1060, Type: "FloorItem", Style: "WoodenBox", Top: -1, Height: 2, AssetName: "WoodenBox", AssetGroup: "ItemDevices" },
	{ ID: 1070, Type: "FloorItem", Style: "Coffin", Top: -1.2, Height: 1.85, AssetName: "Coffin", AssetGroup: "ItemDevices" },
	{ ID: 1080, Type: "FloorItem", Style: "TheDisplayFrame", Top: -1, Height: 2, AssetName: "TheDisplayFrame", AssetGroup: "ItemDevices" },
	{ ID: 1090, Type: "FloorItem", Style: "Pole", Top: -0.85, Height: 1.8, AssetName: "Pole", AssetGroup: "ItemDevices" },
	{ ID: 1095, Type: "FloorItem", Style: "MedicalBed", Top: -0.82, Left: 0.05, Height: 1.8, Width: 0.90, AssetName: "MedicalBed", AssetGroup: "ItemDevices"},

	{ ID: 1100, Type: "FloorNumber", Style: "Blank" },
	{ ID: 1110, Type: "FloorNumber", Style: "Number0" },
	{ ID: 1111, Type: "FloorNumber", Style: "Number1" },
	{ ID: 1112, Type: "FloorNumber", Style: "Number2" },
	{ ID: 1113, Type: "FloorNumber", Style: "Number3" },
	{ ID: 1114, Type: "FloorNumber", Style: "Number4" },
	{ ID: 1115, Type: "FloorNumber", Style: "Number5" },
	{ ID: 1116, Type: "FloorNumber", Style: "Number6" },
	{ ID: 1117, Type: "FloorNumber", Style: "Number7" },
	{ ID: 1118, Type: "FloorNumber", Style: "Number8" },
	{ ID: 1119, Type: "FloorNumber", Style: "Number9" },

	{ ID: 1200, Type: "FloorLetter", Style: "Blank" },
	{ ID: 1201, Type: "FloorLetter", Style: "LetterA" },
	{ ID: 1202, Type: "FloorLetter", Style: "LetterB" },
	{ ID: 1203, Type: "FloorLetter", Style: "LetterC" },
	{ ID: 1204, Type: "FloorLetter", Style: "LetterD" },
	{ ID: 1205, Type: "FloorLetter", Style: "LetterE" },
	{ ID: 1206, Type: "FloorLetter", Style: "LetterF" },
	{ ID: 1207, Type: "FloorLetter", Style: "LetterG" },
	{ ID: 1208, Type: "FloorLetter", Style: "LetterH" },
	{ ID: 1209, Type: "FloorLetter", Style: "LetterI" },
	{ ID: 1210, Type: "FloorLetter", Style: "LetterJ" },
	{ ID: 1211, Type: "FloorLetter", Style: "LetterK" },
	{ ID: 1212, Type: "FloorLetter", Style: "LetterL" },
	{ ID: 1213, Type: "FloorLetter", Style: "LetterM" },
	{ ID: 1214, Type: "FloorLetter", Style: "LetterN" },
	{ ID: 1215, Type: "FloorLetter", Style: "LetterO" },
	{ ID: 1216, Type: "FloorLetter", Style: "LetterP" },
	{ ID: 1217, Type: "FloorLetter", Style: "LetterQ" },
	{ ID: 1218, Type: "FloorLetter", Style: "LetterR" },
	{ ID: 1219, Type: "FloorLetter", Style: "LetterS" },
	{ ID: 1220, Type: "FloorLetter", Style: "LetterT" },
	{ ID: 1221, Type: "FloorLetter", Style: "LetterU" },
	{ ID: 1222, Type: "FloorLetter", Style: "LetterV" },
	{ ID: 1223, Type: "FloorLetter", Style: "LetterW" },
	{ ID: 1224, Type: "FloorLetter", Style: "LetterX" },
	{ ID: 1225, Type: "FloorLetter", Style: "LetterY" },
	{ ID: 1226, Type: "FloorLetter", Style: "LetterZ" },

	{ ID: 1300, Type: "FloorIcon", Style: "Blank" },
	{ ID: 1301, Type: "FloorIcon", Style: "IconCircle" },
	{ ID: 1302, Type: "FloorIcon", Style: "IconSquare" },
	{ ID: 1303, Type: "FloorIcon", Style: "IconTriangle" },
	{ ID: 1304, Type: "FloorIcon", Style: "IconCross" },
	{ ID: 1305, Type: "FloorIcon", Style: "IconDiamond" },
	{ ID: 1306, Type: "FloorIcon", Style: "IconArrowUp" },
	{ ID: 1307, Type: "FloorIcon", Style: "IconArrowDown" },
	{ ID: 1308, Type: "FloorIcon", Style: "IconArrowLeft" },
	{ ID: 1309, Type: "FloorIcon", Style: "IconArrowRight" },

	{ ID: 2000, Type: "FloorObstacle", Style: "Blank", CanEnter: () => false, },
	{ ID: 2004, Type: "FloorObstacle", Style: "Stalagmite", Top: -0.125, Height: 1, CanEnter: () => false, },
	{ ID: 2005, Type: "FloorObstacle", Style: "Rocks", Top: -0.125, Height: 1.125, CanEnter: () => false, },
	{ ID: 2006, Type: "FloorObstacle", Style: "GoldStones", Top: 0.10, Left: 0.25, Height: 0.5, Width: 0.5, CanEnter: () => false, },
	{ ID: 2007, Type: "FloorObstacle", Style: "StonePile", Top: 0.10, Left: 0.25, Height: 0.5, Width: 0.5, CanEnter: () => false, },
	{ ID: 2010, Type: "FloorObstacle", Style: "Statue", Top: -1, Height: 2, CanEnter: () => false, },
	{ ID: 2011, Type: "FloorObstacle", Style: "Knight", Top: -1.25, Left: 0.05, Height: 1.65, Width: 0.75, CanEnter: () => false, },
	{ ID: 2012, Type: "FloorObstacle", Style: "Samurai", Top: -1.25, Left: 0.05, Height: 1.75, Width: 0.85, CanEnter: () => false, },
	{ ID: 2020, Type: "FloorObstacle", Style: "Barrel", Top: -0.5, Height: 1.5, CanEnter: () => false, },
	{ ID: 2025, Type: "FloorObstacle", Style: "Chest", Top: 0, Height: 1, CanEnter: () => false, },
	{ ID: 2030, Type: "FloorObstacle", Style: "IronBars", Top: -1, Height: 2, CanEnter: () => false, },
	{ ID: 2031, Type: "FloorObstacle", Style: "BarbFence", Top: -1, Height: 2, CanEnter: () => false, },
	{ ID: 2032, Type: "FloorObstacle", Style: "PicketFence", Top: -0.80, Height: 0.75, Width: 1, CanEnter: () => false, },
	{
		ID: 2033,
		Type: "FloorObstacle",
		Style: "VelourRopeBarrier",
		BuildImageName: function(x, y) {
			let LeftObject = ChatRoomMapViewGetObjectAtPos(x - 1, y);
			let RightObject = ChatRoomMapViewGetObjectAtPos(x + 1, y);
			if ((LeftObject != null) && (LeftObject.ID == this.ID) && ((RightObject != null) && (RightObject.ID == this.ID))) return "VelourRopeBarrierMiddle";
			if ((LeftObject != null) && (LeftObject.ID == this.ID)) return "VelourRopeBarrierRight";
			if ((RightObject != null) && (RightObject.ID == this.ID)) return "VelourRopeBarrierLeft";
			return "VelourRopeBarrier";
		},
		Top: -0.35
	},
	{ ID: 2035, Type: "FloorObstacle", Style: "Bush", Top: -0.25, Height: 1, CanEnter: () => false, },
	{ ID: 2040, Type: "FloorObstacle", Style: "OakTree", Left: -0.25, Top: -1.5, Width: 1.5, Height: 2.5, CanEnter: () => false, },
	{ ID: 2045, Type: "FloorObstacle", Style: "OakTree_Fall", Left: -0.25, Top: -1.5, Width: 1.5, Height: 2.5, CanEnter: () => false, },
	{ ID: 2048, Type: "FloorObstacle", Style: "LeaflessTree", Top: -1.25, Height: 2, CanEnter: () => false, },
	{ ID: 2050, Type: "FloorObstacle", Style: "PineTree", Top: -1, Height: 2, CanEnter: () => false, },
	{ ID: 2055, Type: "FloorObstacle", Style: "PalmTree", Left: -0.30, Top: -1.5, Width: 1.65, Height: 2.5, CanEnter: () => false, },
	{ ID: 2059, Type: "FloorObstacle", Style: "Sakura", Left: -0.30, Top: -1.5, Width: 1.3, Height: 2.0, CanEnter: () => false, },
	{ ID: 2057, Type: "FloorObstacle", Style: "Cactus", Left: -0.20, Top: -1.20, Width: 1.3, Height: 1.8, CanEnter: () => false, },
	{ ID: 2060, Type: "FloorObstacle", Style: "ChristmasTree", Top: -1, Height: 2, CanEnter: () => false, },
	{ ID: 2070, Type: "FloorObstacle", Style: "Window", Top: -0.5, Height: 1.5, CanEnter: () => false, },
	{ ID: 2080, Type: "FloorObstacle", Style: "TrashCan", Top: -0.25, Height: 0.75, Width: 0.75, CanEnter: () => false, },
	{ ID: 2085, Type: "FloorObstacle", Style: "RoadCone", Top: 0, Left: 0.13, Height: 0.75, Width: 0.75, CanEnter: () => false, },
	{ ID: 2090, Type: "FloorObstacle", Style: "LampPost", Top: -1.25, Height: 2, CanEnter: () => false, },
	{ ID: 2098, Type: "FloorObstacle", Style: "Pillar", Top: -1.25, Left: 0.16, Height: 2, Width: 0.70, CanEnter: () => false, },

	{ ID: 3000, Type: "WallDecoration", Style: "Blank" },
	{ ID: 3010, Type: "WallDecoration", Style: "Painting" },
	{ ID: 3020, Type: "WallDecoration", Style: "Mirror" },
	{
		ID: 3030,
		Type: "WallDecoration",
		Style: "Candelabra0",
		BuildImageName: function(X, Y) {
			let Frame = (Math.floor((CurrentTime + X * 349 + Y * 193) / 150) + X * 347 + Y * 193) % 17;
			if (Frame > 8) Frame = 16 - Frame;
			return "Candelabra" + Frame.toString();
		}
	},
	{ ID: 3040, Type: "WallDecoration", Style: "Whip" },
	{ ID: 3050, Type: "WallDecoration", Style: "Fireplace" },
	{ ID: 3060, Type: "WallDecoration", Style: "Stocking",Top: 0.35, Left: 0.25, Height: 0.5, Width: 0.5 },
	{ ID: 3070, Type: "WallDecoration", Style: "Moss", Top: 0.15, Height: 0.8 },
	{ ID: 3075, Type: "WallDecoration", Style: "Vines", Top: 0.15, Height: 0.8 },
	{ ID: 3076, Type: "WallDecoration", Style: "Vines2", Top: 0.15, Height: 0.8 },
	{ ID: 3100, Type: "WallDecoration", Style: "SilverShield" },
	{ ID: 3110, Type: "WallDecoration", Style: "CrossedSabers" },
	{ ID: 3120, Type: "WallDecoration", Style: "Window", Top: 0.2, Left: 0.1, Height: 0.80, Width: 0.80 },
	{ ID: 3121, Type: "WallDecoration", Style: "WindowNight", Top: 0.22, Left: 0.1, Height: 0.80, Width: 0.80 },
	{ ID: 3122, Type: "WallDecoration", Style: "StainedGlass", Top: 0.25, Left: 0.13, Height: 0.75, Width: 0.75 },
	{ ID: 3200, Type: "WallDecoration", Style: "SchoolBoard" },
	{ ID: 3250, Type: "WallDecoration", Style: "FirstAidKit" },
	{ ID: 3260, Type: "WallDecoration", Style: "EyeTest" },
	{ ID: 3261, Type: "WallDecoration", Style: "Scroll", Left: 0.2, Top: 0.3, Height: 0.6, Width: 0.60 },
	{ ID: 3262, Type: "WallDecoration", Style: "Wanted", Left: 0.2, Top: 0.25, Height: 0.7, Width: 0.6 },
	{ ID: 3270, Type: "WallDecoration", Style: "Bookshelf" },
	{ ID: 3275, Type: "WallDecoration", Style: "AirConditioner", Top: 0.27, Height: 0.8 },
	{ ID: 3280, Type: "WallDecoration", Style: "ShowerHead" },
	{ ID: 3290, Type: "WallDecoration", Style: "EnemaHead" },

	{ ID: 4000, Type: "WallPath", Style: "Blank", CanEnter: function() { return false; } },
	{ ID: 4010, Type: "WallPath", Style: "WoodOpen", Top: -1, Height: 2, CanEnter: function() { return true; } },
	{ ID: 4011, Type: "WallPath", Style: "WoodClosed", OccupiedStyle: "WoodOpen", Top: -1, Height: 2, CanEnter: function() { return Player.CanInteract(); } },
	{ ID: 4012, Type: "WallPath", Style: "WoodLocked", OccupiedStyle: "WoodOpen", Top: -1, Height: 2, CanEnter: function() { return Player.CanInteract() && ChatRoomPlayerIsAdmin(); } },
	{ ID: 4013, Type: "WallPath", Style: "WoodLockedBronze", OccupiedStyle: "WoodOpen", Top: -1, Height: 2, CanEnter: function() { return Player.MapData.PrivateState.HasKeyBronze == true; } },
	{ ID: 4014, Type: "WallPath", Style: "WoodLockedSilver", OccupiedStyle: "WoodOpen", Top: -1, Height: 2, CanEnter: function() { return Player.MapData.PrivateState.HasKeySilver == true; } },
	{ ID: 4015, Type: "WallPath", Style: "WoodLockedGold", OccupiedStyle: "WoodOpen", Top: -1, Height: 2, CanEnter: function() { return Player.MapData.PrivateState.HasKeyGold == true; } },
	{ ID: 4020, Type: "WallPath", Style: "Metal", OccupiedStyle: "MetalOpen", Top: -1, Height: 2, CanEnter: function() { return true; } },
	{ ID: 4021, Type: "WallPath", Style: "MetalUp", OccupiedStyle: "MetalOpen", Top: -1, Height: 2, CanEnter: function(Direction) { return Direction === "U" || Direction === "";  } },
	{ ID: 4022, Type: "WallPath", Style: "MetalDown", OccupiedStyle: "MetalOpen", Top: -1, Height: 2, CanEnter: function(Direction) { return Direction === "D" || Direction === ""; } },


	{ ID: 5010, Type: "Banners", Style: "Red", Top: 0.25, Left: 0.25, Height: 0.6, Width: 0.50, },
	{ ID: 5011, Type: "Banners", Style: "Blue", Top: 0.25, Left: 0.25, Height: 0.6, Width: 0.50, },
	{ ID: 5012, Type: "Banners", Style: "Green", Top: 0.25, Left: 0.25, Height: 0.6, Width: 0.50, },
	{ ID: 5013, Type: "Banners", Style: "Yellow", Top: 0.25, Left: 0.25, Height: 0.6, Width: 0.50, },
	{ ID: 5014, Type: "Banners", Style: "Black", Top: 0.25, Left: 0.25, Height: 0.6, Width: 0.50, },

];

//Build tile list lookup
ChatRoomMapViewTileLookup = {};
for (const tile of ChatRoomMapViewTileList) ChatRoomMapViewTileLookup[tile.ID] = tile;

//Build object list lookup
ChatRoomMapViewObjectLookup = {};
for (const obj of ChatRoomMapViewObjectList) ChatRoomMapViewObjectLookup[obj.ID] = obj;


/**
 * Returns TRUE if the player is an admin and activated her super powers on the map
 * @returns {boolean} - TRUE if super powers are active
 */
function ChatRoomMapViewHasSuperPowers() { return ChatRoomMapViewSuperPowersActive && ChatRoomPlayerIsAdmin(); }

/**
 * When the screen loses focus, we clear the keys pressed because we don't want movement to get stuck
 */
function ChatRoomMapViewBlur() {
	ChatRoomMapViewKeysPressed = {d: false, l: false, r: false, u: false};
}

/**
 * Initializes the map to its default blank state
 * @param {ChatRoomMapType} mode
 * @returns {ServerChatRoomMapData}
 */
function ChatRoomMapViewInitialize(mode) {
	const defaultMap = String.fromCharCode(ChatRoomMapViewObjectStartID).repeat(ChatRoomMapViewWidth * ChatRoomMapViewHeight);
	return {
		Type: mode,
		Tiles: defaultMap,
		Objects: defaultMap,
		Effects: undefined,
	};
}

/**
 * Initializes the player map data to its default blank state
 * @param {Character} C - The character to be initialized
 * @returns {ChatRoomMapData}
 */
function ChatRoomMapViewInitializeCharacter(C) {

	let MapData = C.MapData ? C.MapData : null;
	// Checks to see if we can load the previously saved position
	if (C.IsPlayer() && Player.ImmersionSettings?.ReturnToChatRoom && Player.LastChatRoom?.Name === ChatRoomData.Name && Player.LastMapData) {
		// Restores the saved position
		MapData = Player.LastMapData;
	}
	if (!MapData || !MapData.Pos || !MapData.PrivateState){
		// Sets position in the middle of the scren by default, or at the entry flag if possible
		let entryPosition = ChatRoomMapViewGetEntryFlagPosition();
		if (entryPosition == null) {
			entryPosition = {
				X: ChatRoomMapViewWidth / 2,
				Y: ChatRoomMapViewHeight / 2,
			};
		}

		MapData = { Pos: entryPosition, PrivateState: {} };
	}
	return MapData;
}

/**
 * Validate the passed chat room map positions.
 * @param {unknown} position
 * @returns {ChatRoomMapPos}
 */
function ChatRoomMapViewValidatePosition(position) {
	const ret = CommonIsObject(position) ? position : {};
	return {
		X: CommonIsInteger(ret.X, 0, ChatRoomMapViewWidth) ? ret.X : ChatRoomMapViewWidth / 2,
		Y: CommonIsInteger(ret.Y, 0, ChatRoomMapViewHeight) ? ret.Y : ChatRoomMapViewHeight / 2,
	};
}

/**
 * Checks if the coordinates are out of bounds relative to the map
 * @param {ChatRoomMapPos} position
 */
function ChatRoomMapViewIsOutOfBounds(position) {
	return position.X > ChatRoomMapViewWidth || 0 > position.X || position.Y > ChatRoomMapViewHeight || 0 > position.Y;
}

/**
 * Performs cleanup when leaving the chat room map
 * @returns {void} - Nothing
 */
function ChatRoomMapViewLeave() {
	ChatRoomActivateView(ChatRoomCharacterViewName);
	Player.MapData = null;
}

/**
 * Activates the chat room map
 * @returns {void} - Nothing
 */
function ChatRoomMapViewActivate() {

	// Make sure the player position is valid
	if (!Player.MapData || !Player.MapData.Pos|| Player.MapData.Pos.X == null || Player.MapData.Pos.X < 0 || Player.MapData.Pos.X >= ChatRoomMapViewWidth || Player.MapData.Pos.Y == null || Player.MapData.Pos.Y < 0 || Player.MapData.Pos.Y >= ChatRoomMapViewWidth) {
		Player.LastMapData = Player.MapData = ChatRoomMapViewInitializeCharacter(Player);
		// Update the change instantly so other players don't see this player on an invalid position
		ChatRoomMapViewUpdatePlayerFlag(-ChatRoomMapViewUpdatePlayerTime);

	}
	if (ChatRoomData.MapData?.Tiles?.length != ChatRoomMapViewWidth * ChatRoomMapViewHeight || ChatRoomData.MapData?.Objects?.length != ChatRoomMapViewWidth * ChatRoomMapViewHeight) {
		ChatRoomData.MapData = ChatRoomMapViewInitialize(ChatRoomData?.MapData?.Type ?? "Never");
	}
	ChatRoomMapManager.OnViewActivate();
	ChatRoomMapViewCalculatePerceptionMasks();
}

/**
 * Deactivates the chat room map
 * @returns {void} - Nothing
 */
function ChatRoomMapViewDeactivate() {
	document.removeEventListener("blur", ChatRoomMapViewBlur);
}

/**
 * Indicates if the chat room map view is active or not
 * @returns {boolean} - TRUE if the chat room character view is active, false if not
 */
function ChatRoomMapViewIsActive() {
	return ChatRoomIsViewActive(ChatRoomMapViewName);
}

/** @type {ScreenRunHandler} */
function ChatRoomMapViewRun(time) {

	// Syncs the room map data with the server if needed
	ChatRoomMapViewMovementProcess();
	ChatRoomMapViewLeash();
	ChatRoomMapViewUpdateRoomSync();
	ChatRoomMapViewUpdatePlayerSync();
	ChatRoomMapViewUpdateLastMapDataSync();
	if (ChatRoomMapViewKeysPressed.u) {
		ChatRoomMapViewMove("North");
	} else if (ChatRoomMapViewKeysPressed.d) {
		ChatRoomMapViewMove("South");
	} else if (ChatRoomMapViewKeysPressed.l) {
		ChatRoomMapViewMove("West");
	} else if (ChatRoomMapViewKeysPressed.r) {
		ChatRoomMapViewMove("East");
	}
}

/**
 * Returns TRUE if the player can leave from the map
 * @returns {boolean} - True if the player can leave
 */
function ChatRoomMapViewCanLeave() {

	// Out of map mode and if player hasn't checked the immersion option, we allow leaving
	if ((ChatRoomData == null) || (ChatRoomData.MapData == null) || (ChatRoomData.MapData.Type === "Never") || !ChatRoomMapViewIsActive()) return true;
	if ((Player.MapData == null) || (Player.MapData.Pos.X == null) || (Player.MapData.Pos.Y == null)) return true;
	if ((Player.ImmersionSettings == null) || !Player.ImmersionSettings.ChatRoomMapLeaveOnExit) return true;

	// Scan 2 tiles grid around the player, if there's an exit flag in it, we allow leaving
	for (let X = Player.MapData.Pos.X - 2; X <= Player.MapData.Pos.X + 2; X++)
		for (let Y = Player.MapData.Pos.Y - 2; Y <= Player.MapData.Pos.Y + 2; Y++) {
			let Obj = ChatRoomMapViewGetObjectAtPos(X, Y);
			if ((Obj != null) && Obj.Exit) return true;
		}

	// If there's no exit at all, we always allow leaving
	let ExitCount = 0;
	for (let Obj of ChatRoomMapViewObjectList)
		if ((Obj.Exit === true) && (ChatRoomData.MapData.Objects.indexOf(String.fromCharCode(Obj.ID)) >= 0))
			ExitCount++;
	if (ExitCount == 0) return true;

	// If nothing allows leaving
	return false;

}

/**
 * Take a screenshot of the current section of the map
 * @returns {void} - Nothing
 */
function ChatRoomMapViewScreenshot() {
	ChatRoomPhoto(0, 0, 1000, 1000, ChatRoomCharacter);
}

/**
 * Returns TRUE if the player can enter in whisper mode on the current view with the currently focused character
 * @param {Character} C - The character to evaluate
 * @returns {boolean} - TRUE is whipser can be started
 */
function ChatRoomMapViewCanStartWhisper(C) {
	return ChatRoomMapViewCharacterOnWhisperRange(C);
}

/**
 * Handles the reception of the room properties from the server.
 * @param {ServerChatRoomSyncMessage} data - Room object containing the updated chatroom properties.
 * @returns {void} - Nothing.
 */
function ChatRoomMapViewSyncRoomProperties(data) {
	// If the chat room map is visible, we need to update the perception map
	ChatRoomMapViewCalculatePerceptionMasks();
}

/**
 * Gets a index number for the tile and obejct lists and returns the corrosponting coordinates in X and Y
 * @param {number} index - Index number for the tile and object lists
 * @returns {{x: number, y: number}} - Object containing the resulting x and y coordinates.
 */
function ChatRoomMapViewIndexToCoordinates(index) {
	return { x: index % ChatRoomMapViewWidth, y: Math.floor(index / ChatRoomMapViewWidth) };
}

/**
 * Gets coordinates in X and Y and returns the corrosponding index number for the tile and object list
 * @param {number} x - X-coordinate to be translated
 * @param {number} y - Y-coordinate to be translated
 * @returns {number} - Index number for the tile and object lists
 */
function ChatRoomMapViewCoordinatesToIndex(x, y) {
	return (y * ChatRoomMapViewWidth) + x;
}

/**
 * Calculates the visibility mask and audibility mask for the map
 * @returns {void} - Nothing
 */
function ChatRoomMapViewCalculatePerceptionMasks() {

	// The player has never opened the map, ignore
	if (!Player.MapData) return;

	// When in edit mode or with active super powers, always show everything
	if (ChatRoomMapViewHasSuperPowers()) {
		ChatRoomMapViewVisibilityMask.fill(true);
		ChatRoomMapViewAudibilityMask.fill(true);
		return;
	}

	const mapLength = ChatRoomMapViewWidth * ChatRoomMapViewHeight;
	const sightRange = ChatRoomMapViewGetSightRange();
	const hearingRange = ChatRoomMapViewGetHearingRange();

	for(let i=0; i<mapLength; i++) {
		const posTile = ChatRoomMapViewIndexToCoordinates(i);
		// Calculate the view line between player as f(x) = slopeX * x + yIntercept and f(y) = slopeY * y + xIntercept
		let dirX = 0;
		if(Player.MapData.Pos.X < posTile.x) { dirX = 1; }
		else if(Player.MapData.Pos.X > posTile.x) { dirX = -1; }
		let dirY = 0;
		if(Player.MapData.Pos.Y < posTile.y) { dirY = 1; }
		else if(Player.MapData.Pos.Y > posTile.y) { dirY = -1; }

		const posTileCorner = { x: posTile.x + (dirX * ChatRoomMapViewPerceptionRaycastOffset), y: posTile.y - (dirY * ChatRoomMapViewPerceptionRaycastOffset) };
		const slopeX = (posTileCorner.y - Player.MapData.Pos.Y) / (posTileCorner.x - Player.MapData.Pos.X);
		const slopeY = (posTileCorner.x - Player.MapData.Pos.X) / (posTileCorner.y - Player.MapData.Pos.Y);
		const yIntercept = Player.MapData.Pos.Y - (slopeX * Player.MapData.Pos.X);
		const xIntercept = Player.MapData.Pos.X - (slopeY * Player.MapData.Pos.Y);

		// Initialize this entry of visibility and audibility map with sight and hearing range
		const distance = Math.max(Math.abs(Player.MapData.Pos.X - posTile.x), Math.abs(Player.MapData.Pos.Y - posTile.y));
		ChatRoomMapViewVisibilityMask[i] = sightRange >= distance;
		ChatRoomMapViewAudibilityMask[i] = hearingRange >= distance;

		// Calculate obstacles in horizontality if horizontal slope is not too steep
		if(slopeX != Infinity && dirX != 0)
		{
			// Iterate over every x-position between player and target tile
			for(let x=Player.MapData.Pos.X+dirX; x!=posTile.x && x!=posTile.x+dirX; x+=dirX) {
				// If both, visibility and audibility masks already are set to false for this tile, we don't need to continue
				if(ChatRoomMapViewVisibilityMask[i] == false && ChatRoomMapViewAudibilityMask[i] == false) {
					break;
				}

				// Calculate the y-position with the view line formular and get the tiles and objecs on the in-between position
				const y = Math.round(slopeX * x + yIntercept);
				let tileData = ChatRoomMapViewGetTileAtPos(x, y);
				let objectData = ChatRoomMapViewGetObjectAtPos(x, y);
				// If tile data exists, apply the blockvision and blockhearing flags to visibility and audibility map
				if(tileData != null) {
					ChatRoomMapViewVisibilityMask[i] &&= tileData.BlockVision ? false : true;
					ChatRoomMapViewAudibilityMask[i] &&= tileData.BlockHearing ? false : true;
				}
				// If object data exists, apply the blockvision and blockhearing flags to visibility and audibility map
				if(objectData != null) {
					ChatRoomMapViewVisibilityMask[i] &&= objectData.BlockVision ? false : true;
					ChatRoomMapViewAudibilityMask[i] &&= objectData.BlockHearing ? false : true;
				}

			}
		}
		// Calculate obstacles in verticality if vertical slope is not too steep
		if(slopeY != Infinity && dirY != 0)
		{
			// Iterate over every y-position between player and target tile
			for(let y=Player.MapData.Pos.Y+dirY; y!=posTile.y && y!=posTile.y+dirY; y+=dirY) {
				// If both, visibility and audibility masks already are set to false for this tile, we don't need to continue
				if(ChatRoomMapViewVisibilityMask[i] == false && ChatRoomMapViewAudibilityMask[i] == false) {
					break;
				}

				// Calculate the x-position with the view line formular and get the tiles and objecs on the in-between position
				const x = Math.round(slopeY * y + xIntercept);
				let tileData = ChatRoomMapViewGetTileAtPos(x, y);
				let objectData = ChatRoomMapViewGetObjectAtPos(x, y);
				// If tile data exists, apply the blockvision and blockhearing flags to visibility and audibility map
				if(tileData != null) {
					ChatRoomMapViewVisibilityMask[i] &&= tileData.BlockVision ? false : true;
					ChatRoomMapViewAudibilityMask[i] &&= tileData.BlockHearing ? false : true;
				}
				// If object data exists, apply the blockvision and blockhearing flags to visibility and audibility map
				if(objectData != null) {
					ChatRoomMapViewVisibilityMask[i] &&= objectData.BlockVision ? false : true;
					ChatRoomMapViewAudibilityMask[i] &&= objectData.BlockHearing ? false : true;
				}

			}
		}

	}
}

/**
 * Returns the sight range for the current player, based on the blindness level
 * @returns {number} - The number of visible tiles
 */
function ChatRoomMapViewGetSightRange() {
	if (ChatRoomMapViewHasSuperPowers()) return ChatRoomMapViewPerceptionRangeMax;
	return ChatRoomMapViewPerceptionRangeMax - Player.GetBlindLevel() * 2;
}

/**
 * Returns the hearing range for the current player, based on the deafness level
 * @returns {number} - The number of tiles
 */
function ChatRoomMapViewGetHearingRange() {
	return ChatRoomMapViewPerceptionRangeMax - Player.GetDeafLevel();
}

/**
 * Returns TRUE if the player can see a character at her sight range
 * @param {Character} C - The character to evaluate
 * @returns {boolean} - TRUE if visible
 */
function ChatRoomMapViewCharacterIsVisible(C) {
	if (!C?.MapData) return false;
	if (!Player?.MapData?.Pos) return false;
	const PlayerTileId = ChatRoomMapViewCoordinatesToIndex(C.MapData.Pos.X, C.MapData.Pos.Y);
	return ChatRoomMapViewVisibilityMask[PlayerTileId];
}

/**
 * Returns TRUE if the player can see hear a character at her hearing range
 * @param {Character} C - The character to evaluate
 * @returns {boolean} - TRUE if hearable
 */
function ChatRoomMapViewCharacterIsHearable(C) {
	if (!C?.MapData) return false;
	if (!Player?.MapData?.Pos) return false;
	const PlayerTileId = ChatRoomMapViewCoordinatesToIndex(C.MapData.Pos.X, C.MapData.Pos.Y);
	return ChatRoomMapViewAudibilityMask[PlayerTileId];
}

/**
 * Returns TRUE if the player is on whisper range to another character (1 tile)
 * @param {Character} C - The character to evaluate
 * @returns {boolean} - TRUE if on whisper range
 */
function ChatRoomMapViewCharacterOnWhisperRange(C) {
	if ((C == null) || (C.MapData == null) || (C.MapData.Pos == null) || (C.MapData.Pos.X == null) || (C.MapData.Pos.Y == null)) return false;
	if ((Player.MapData == null) || (Player.MapData.Pos.X == null) || (Player.MapData.Pos.Y == null)) return false;
	let Distance = Math.max(Math.abs(Player.MapData.Pos.X - C.MapData.Pos.X), Math.abs(Player.MapData.Pos.Y - C.MapData.Pos.Y));
	return (Distance <= ChatRoomMapViewWhisperRange);
}

/**
 * Returns TRUE if the player is within interaction range of another character
 * @param {Character} C - The character to evaluate
 * @returns {boolean} - TRUE if on interaction range
 */
function ChatRoomMapViewCharacterOnInteractionRange(C) {
	if ((C == null) || (C.MapData == null) || (C.MapData.Pos == null) || (C.MapData.Pos.X == null) || (C.MapData.Pos.Y == null)) return false;
	if ((Player.MapData == null) || (Player.MapData.Pos.X == null) || (Player.MapData.Pos.Y == null)) return false;
	let Distance = Math.max(Math.abs(Player.MapData.Pos.X - C.MapData.Pos.X), Math.abs(Player.MapData.Pos.Y - C.MapData.Pos.Y));
	return (Distance <= ChatRoomMapViewInteractionRange);
}

/**
 * Sets the correct wall tile based on it's surrounding (North-West, North-Center, etc.)
 * @param {boolean} CW - If Center West is a wall
 * @param {boolean} CE - If Center East is a wall
 * @param {boolean} SW - If South West is a wall
 * @param {boolean} SC - If South Center is a wall
 * @param {boolean} SE - If South East is a wall
 * @returns {number} - a number linked on the image to use
 */
function ChatRoomMapViewFindWallEffectTile(CW, CE, SW, SC, SE) {

	if (CW && CE && SW && SC && SE) return 0;
	if (!CW && !CE && !SC) return 1;
	if (!CW && CE && !SC) return 2;
	if (CW && !CE && !SC) return 3;
	if (CW && CE && !SC) return 4;

	if (!CW && !CE && SW && SC && SE) return 5;
	if (!CW && !CE && SW && SC && !SE) return 6;
	if (!CW && !CE && !SW && SC && SE) return 7;

	if (CW && CE && !SW && SC && !SE) return 8;
	if (!CW && CE && !SW && SC && !SE) return 9;
	if (CW && !CE && !SW && SC && !SE) return 10;

	if (!CW && !CE && !SE && SC && !SW) return 11;
	if (CW && !CE && !SE && SC && !SW) return 12;
	if (!CW && CE && !SE && SC && !SW) return 13;

	if (!CW && CE && SE && SC && SW) return 14;
	if (CW && !CE && SE && SC && SW) return 15;

	if (CW && !CE && SW && SC) return 16;
	if (!CW && CE && SC && SE) return 17;

	if (CW && CE && SW && SC && !SE) return 18;
	if (CW && CE && !SW && SC && SE) return 19;

	if (!CW && CE && SW && SC && !SE) return 20;
	if (CW && !CE && !SW && SC && SE) return 21;

	return -1;

}

/**
 * Returns TRUE if the X and Y coordinates is a wall tile, if out of bound we also return TRUE
 * @param {number} X - The X position on the map
 * @param {number} Y - The Y position on the map
 * @returns {boolean} - TRUE if it's a wall
 */
function ChatRoomMapViewIsWall(X, Y) {
	if ((X < 0) || (Y < 0) || (X >= ChatRoomMapViewWidth) || (Y >= ChatRoomMapViewHeight)) return true;
	let ID = ChatRoomData.MapData.Tiles.charCodeAt(X + Y * ChatRoomMapViewWidth);
	return ((ID >= 1000) && (ID < 2000));
}

/**
 * Checks for connectivity in 4 directions based on a provided validation function
 * @param {number} X - The X position on the map
 * @param {number} Y - The Y position on the map
 * @param {function(number, number): boolean} Condition - Function that returns true if the position is connected
 * @returns {{ North: boolean, South: boolean, East: boolean, West: boolean }} - The connectivity status
 */
function ChatRoomMapViewGetConnectivityDirections(X, Y, Condition) {
	return {
		North: Condition(X, Y - 1),
		South: Condition(X, Y + 1),
		East: Condition(X + 1, Y),
		West: Condition(X - 1, Y)
	};
}

/**
 * Returns the object located at a X and Y position on the map, or NULL if nothing
 * @param {number} X - The X position on the map
 * @param {number} Y - The Y position on the map
 * @returns {ChatRoomMapTile | undefined} - The object at the position
 */
function ChatRoomMapViewGetTileAtPos(X, Y) {
	if (ChatRoomData.MapData?.Tiles.length !== ChatRoomMapViewWidth * ChatRoomMapViewHeight) return null;
	if ((X < 0) || (Y < 0) || (X >= ChatRoomMapViewWidth) || (Y >= ChatRoomMapViewHeight)) return null;
	let ObjectID = ChatRoomData.MapData.Tiles.charCodeAt(ChatRoomMapViewCoordinatesToIndex(X, Y));
	return ChatRoomMapViewTileLookup[ObjectID] || undefined;
}

/**
 * Returns the object located at a X and Y position on the map, or NULL if nothing
 * @param {number} X - The X position on the map
 * @param {number} Y - The Y position on the map
 * @returns {ChatRoomMapObject | undefined} - The object at the position
 */
function ChatRoomMapViewGetObjectAtPos(X, Y) {
	if (ChatRoomData.MapData?.Objects.length !== ChatRoomMapViewWidth * ChatRoomMapViewHeight) return null;
	if ((X < 0) || (Y < 0) || (X >= ChatRoomMapViewWidth) || (Y >= ChatRoomMapViewHeight)) return null;
	let ObjectID = ChatRoomData.MapData.Objects.charCodeAt(ChatRoomMapViewCoordinatesToIndex(X, Y));
	return ChatRoomMapViewObjectLookup[ObjectID] || undefined;
}

/**
 * Returns TRUE if a given position cannot be entered
 * @param {number} X - The X position on the map
 * @param {number} Y - The Y position on the map
 * @returns {boolean} - TRUE if the position is blocked
 */
function ChatRoomMapViewPositionIsBlocked(X, Y) {
	if ((X < 0) || (Y < 0) || (X >= ChatRoomMapViewWidth) || (Y >= ChatRoomMapViewHeight)) return true;
	/** @type {ChatRoomMapDirection} */
	let dir = "";
	if (Player.MapData.Pos.X < X) dir = "R";
	else if (Player.MapData.Pos.X > X) dir = "L";
	else if (Player.MapData.Pos.Y < Y) dir = "D";
	else if (Player.MapData.Pos.Y > Y) dir = "U";
	// We do objects first, and always respect their `CanEnter` return;
	// this is so that an open door on a wall can let you pass
	const O = ChatRoomMapViewGetObjectAtPos(X, Y);
	if (O && O.CanEnter) {
		return !O.CanEnter(dir);
	}
	const T = ChatRoomMapViewGetTileAtPos(X, Y);
	if (T && T.CanEnter) {
		return !T.CanEnter(dir);
	}
	return false;
}

/**
 * Returns TRUE if the fog of war feature is currently activated on the map
 * @returns {boolean} - TRUE if fog of war is active
 */
function ChatRoomMapFogIsActive() {
	return ((ChatRoomData == null) || (ChatRoomData.MapData == null) || (ChatRoomData.MapData.Fog == null) || (ChatRoomData.MapData.Fog !== false));
}

/**
 * Returns TRUE if a tile is fully hidden from hide
 * @param {number} X - The X position on the map
 * @param {number} Y - The Y position on the map
 * @returns {boolean} - TRUE if the tile is hidden
 */
function ChatRoomMapViewTileIsHidden(X, Y) {
	return !ChatRoomMapViewVisibilityMask[ChatRoomMapViewCoordinatesToIndex(X, Y)] && (ChatRoomMapViewTileFog[X + Y * ChatRoomMapViewWidth] == 0);
}

/**
 * Apply a wall "3D" effect on the curent map
 * @param {number} X - The X position on the map
 * @param {number} Y - The Y position on the map
 * @param {number} ScreenX - The X position on the screen
 * @param {number} ScreenY - The Y position on the screen
 * @param {number} TileWidth - The visible width of a tile
 * @param {number} TileHeight - The visible height of a tile
 * @returns {void} - Nothing
 */
function ChatRoomMapViewWallEffect(X, Y, ScreenX, ScreenY, TileWidth, TileHeight) {

	// Find all other walls around the current tile
	let CW = ChatRoomMapViewIsWall(X - 1, Y) || ChatRoomMapViewTileIsHidden(X - 1, Y);
	let CE = ChatRoomMapViewIsWall(X + 1, Y) || ChatRoomMapViewTileIsHidden(X + 1, Y);
	let SW = ChatRoomMapViewIsWall(X - 1, Y + 1) || ChatRoomMapViewTileIsHidden(X - 1, Y + 1);
	let SC = ChatRoomMapViewIsWall(X, Y + 1) || ChatRoomMapViewTileIsHidden(X, Y + 1);
	let SE = ChatRoomMapViewIsWall(X + 1, Y + 1) || ChatRoomMapViewTileIsHidden(X + 1, Y + 1);

	// Finds the proper effect and draws it
	let Effect = ChatRoomMapViewFindWallEffectTile(CW, CE, SW, SC, SE);
	DrawImageResize("Screens/Online/ChatRoom/MapTile/WallEffect/" + Effect.toString() + ".png", Math.floor(ScreenX), Math.floor(ScreenY), Math.ceil(TileWidth), Math.ceil(TileHeight));

}

/**
 * Apply a wall "3D" effect on the curent map
 * @param {number} X - The X position on the map
 * @param {number} Y - The Y position on the map
 * @returns {number} - The effect number
 */
function ChatRoomMapViewFloorWallEffect(X, Y) {

	// No effect on the very last row
	if (Y >= ChatRoomMapViewHeight - 1) return -1;

	// Find the soutern wall positions
	let SW = ChatRoomMapViewIsWall(X - 1, Y + 1);
	let SC = ChatRoomMapViewIsWall(X, Y + 1);
	let SE = ChatRoomMapViewIsWall(X + 1, Y + 1);

	// Find the "3D" wall effect and returns it
	if (!SW && SC && !SE) return 50;
	if (!SW && SC && SE) return 51;
	if (SW && SC && !SE) return 52;
	if (SW && SC && SE) return 53;
	return -1;

}

/**
 * Manages collisions, moves the player if she's on a tile that cannot be entered
 * @returns {void} - Nothing
 */
function ChatRoomMapViewCollision() {

	// Exits right away if no player data or the tile is valid to stand there
	if ((Player.MapData == null) || ((Player.MapData.Pos.X == null)) || ((Player.MapData.Pos.Y == null))) return;
	if (ChatRoomMapViewCanEnterTile(Player.MapData.Pos.X, Player.MapData.Pos.Y) > 0) return;

	// Since there's a collision, we try to find good spots to move the player
	let Tiles = [];
	if (ChatRoomMapViewCanEnterTile(Player.MapData.Pos.X - 1, Player.MapData.Pos.Y) > 0) Tiles.push({ X: Player.MapData.Pos.X - 1, Y: Player.MapData.Pos.Y });
	if (ChatRoomMapViewCanEnterTile(Player.MapData.Pos.X + 1, Player.MapData.Pos.Y) > 0) Tiles.push({ X: Player.MapData.Pos.X + 1, Y: Player.MapData.Pos.Y });
	if (ChatRoomMapViewCanEnterTile(Player.MapData.Pos.X, Player.MapData.Pos.Y - 1) > 0) Tiles.push({ X: Player.MapData.Pos.X, Y: Player.MapData.Pos.Y - 1 });
	if (ChatRoomMapViewCanEnterTile(Player.MapData.Pos.X, Player.MapData.Pos.Y + 1) > 0) Tiles.push({ X: Player.MapData.Pos.X, Y: Player.MapData.Pos.Y + 1 });

	// If we found a tile next to the player
	if (Tiles.length > 0) {
		let Tile = CommonRandomItemFromList(null, Tiles);
		Player.MapData.Pos.X = Tile.X;
		Player.MapData.Pos.Y = Tile.Y;
		// Update the change instantly so other players don't see this player in a wall
		ChatRoomMapViewUpdatePlayerFlag(-ChatRoomMapViewUpdatePlayerTime);
		return;
	}

	// Tries the current tile corners next
	if (ChatRoomMapViewCanEnterTile(Player.MapData.Pos.X - 1, Player.MapData.Pos.Y - 1) > 0) Tiles.push({ X: Player.MapData.Pos.X - 1, Y: Player.MapData.Pos.Y - 1 });
	if (ChatRoomMapViewCanEnterTile(Player.MapData.Pos.X + 1, Player.MapData.Pos.Y - 1) > 0) Tiles.push({ X: Player.MapData.Pos.X + 1, Y: Player.MapData.Pos.Y - 1 });
	if (ChatRoomMapViewCanEnterTile(Player.MapData.Pos.X - 1, Player.MapData.Pos.Y + 1) > 0) Tiles.push({ X: Player.MapData.Pos.X - 1, Y: Player.MapData.Pos.Y + 1 });
	if (ChatRoomMapViewCanEnterTile(Player.MapData.Pos.X + 1, Player.MapData.Pos.Y + 1) > 0) Tiles.push({ X: Player.MapData.Pos.X + 1, Y: Player.MapData.Pos.Y + 1 });

	// If we found a tile in the corner of the player
	if (Tiles.length > 0) {
		let Tile = CommonRandomItemFromList(null, Tiles);
		Player.MapData.Pos.X = Tile.X;
		Player.MapData.Pos.Y = Tile.Y;
		// Update the change instantly so other players don't see this player in a wall
		ChatRoomMapViewUpdatePlayerFlag(-ChatRoomMapViewUpdatePlayerTime);
		return;
	}

	// Tries 2 tiles away next
	if (ChatRoomMapViewCanEnterTile(Player.MapData.Pos.X - 2, Player.MapData.Pos.Y) > 0) Tiles.push({ X: Player.MapData.Pos.X - 2, Y: Player.MapData.Pos.Y });
	if (ChatRoomMapViewCanEnterTile(Player.MapData.Pos.X + 2, Player.MapData.Pos.Y) > 0) Tiles.push({ X: Player.MapData.Pos.X + 2, Y: Player.MapData.Pos.Y });
	if (ChatRoomMapViewCanEnterTile(Player.MapData.Pos.X, Player.MapData.Pos.Y - 2) > 0) Tiles.push({ X: Player.MapData.Pos.X, Y: Player.MapData.Pos.Y - 2 });
	if (ChatRoomMapViewCanEnterTile(Player.MapData.Pos.X, Player.MapData.Pos.Y + 2) > 0) Tiles.push({ X: Player.MapData.Pos.X, Y: Player.MapData.Pos.Y + 2 });

	// If we found a tile next to the player
	if (Tiles.length > 0) {
		let Tile = CommonRandomItemFromList(null, Tiles);
		Player.MapData.Pos.X = Tile.X;
		Player.MapData.Pos.Y = Tile.Y;
		// Update the change instantly so other players don't see this player in a wall
		ChatRoomMapViewUpdatePlayerFlag(-ChatRoomMapViewUpdatePlayerTime);
		return;
	}

}

/**
 * Find the first {@link ChatRoomCharacter} members at the specified X & Y position
 * @param {number} X - The X position on the screen
 * @param {number} Y - The Y position on the screen
 * @returns {null | Character} A character at the specified X & Y position or, if none can be found, `null`
 */
function ChatRoomMapViewGetCharacterAtPos(X, Y) {
	if ((X < 0) || (Y < 0) || (X >= ChatRoomMapViewWidth) || (Y >= ChatRoomMapViewHeight)) return null;
	return ChatRoomMapViewCharacterMap.get(X + Y * ChatRoomMapViewWidth) ?? null;
}

/**
 * Returns a object that contains the entry flag's position with x and y parameters or null if no entry flag is set
 * @returns {ChatRoomMapPos|null}
 */
function ChatRoomMapViewGetEntryFlagPosition() {

	if (!ChatRoomData.MapData?.Objects) return null;

	const idx = ChatRoomData.MapData.Objects.indexOf(String.fromCharCode(ChatRoomMapViewObjectEntryID));
	if (idx < 0) return null;

	return {
		X: idx % ChatRoomMapViewWidth,
		Y: Math.floor(idx / ChatRoomMapViewWidth)
	};
}

/**
 * Draw the map grid and character on screen
 * @param {number} Left - The X position on the screen
 * @param {number} Top - The Y position on the screen
 * @param {number} Width - The width size of the drawn map
 * @param {number} Height - The height size of the drawn map
 * @returns {void} - Nothing
 */
function ChatRoomMapViewDrawGrid(Left, Top, Width, Height) {

	ChatRoomMapViewCharacterMap.clear();
	for(let C of ChatRoomCharacter) {
		if (!C.MapData?.Pos) continue;
		ChatRoomMapViewCharacterMap.set(C.MapData.Pos.X + C.MapData.Pos.Y * ChatRoomMapViewWidth, C);
	}

	// Make sure the player MapData is valid
	if (Player.MapData == null)
		Player.LastMapData = Player.MapData = ChatRoomMapViewInitializeCharacter(Player);

	// Manages collisions, moves the player if she's on a tile that cannot be entered
	ChatRoomMapViewCollision();

	// Defines the width and height of the visible tile
	let TileWidth = Width / ((ChatRoomMapViewPerceptionRange * 2) + 1);
	let TileHeight = Height / ((ChatRoomMapViewPerceptionRange * 2) + 1);
	let EditWidth = (ChatRoomMapViewEditRange - 1) * TileWidth;
	let EditHeight = (ChatRoomMapViewEditRange - 1) * TileHeight;
	let MaxVisibleRange = ChatRoomMapViewGetSightRange();
	if (MaxVisibleRange < 1) MaxVisibleRange = 1;
	let CharacterUnderCursor = null;
	let FogActive = ChatRoomMapFogIsActive();

	// Clears the tile and character selection
	ChatRoomMapViewEditSelection = [];
	ChatRoomMapViewFocusedCharacter = null;

	// Prepares the fog if needed
	if (!ChatRoomMapViewTileFog || ChatRoomMapViewTileFog.length != ChatRoomMapViewWidth * ChatRoomMapViewHeight) {
		ChatRoomMapViewTileFog = new Uint16Array(ChatRoomMapViewWidth * ChatRoomMapViewHeight);
	}
	if (!ChatRoomMapViewObjectFog || ChatRoomMapViewObjectFog.length != ChatRoomMapViewWidth * ChatRoomMapViewHeight) {
		ChatRoomMapViewObjectFog = new Uint16Array(ChatRoomMapViewWidth * ChatRoomMapViewHeight);
	}

	// For each tiles in the grid
	for (let Pos = 0; Pos < ChatRoomMapViewWidth * ChatRoomMapViewHeight; Pos++) {

		// Find the X & Y position of the grid
		let X = Pos % ChatRoomMapViewWidth;
		let Y = Math.floor(Pos / ChatRoomMapViewWidth);

		// Only process if the X & Y are within the visible sight range
		let MaxRange = Math.max(Math.abs(X - Player.MapData.Pos.X), Math.abs(Y - Player.MapData.Pos.Y));
		if (MaxRange > MaxVisibleRange) continue;

		// Defines the screen X and Y positions
		let ScreenX = (X - Player.MapData.Pos.X) * TileWidth + ChatRoomMapViewPerceptionRange * TileWidth;
		let ScreenY = (Y - Player.MapData.Pos.Y) * TileHeight + ChatRoomMapViewPerceptionRange * TileWidth;

		// If this tile's coordinates are out of the view range, we don't have to bother with it
		if ((ScreenX < 0) || (ScreenX >= Width) || (ScreenY < 0) || (ScreenY >= Height)) continue;

		// Drawing variables
		const TileCanvasX = Left + ScreenX;
		const TileCanvasY = Top + ScreenY;
		let FloorWallEffect = -1;
		let DrawSelectionRect = false;
		let TileID = ChatRoomData.MapData.Tiles.charCodeAt(Pos);
		let TileData = null;
		let TileImage = null;
		let ObjectData = null;
		let ObjectImage = null;

		// Out of sight, we draw the fog
		let Fog = false;
		if (FogActive && !ChatRoomMapViewVisibilityMask[Pos]) {
			if (ChatRoomMapViewTileFog[Pos] == 0) {
				DrawImageResize("Screens/Online/ChatRoom/MapTile/Fog/Full.png", Math.floor(TileCanvasX), Math.floor(TileCanvasY), Math.ceil(TileWidth), Math.ceil(TileHeight));
				continue;
			}
			TileID = ChatRoomMapViewTileFog[Pos];
			Fog = true;
		}

		// Finds the tile to draw and keeps it
		TileData = ChatRoomMapViewTileLookup[TileID];

		// Draw the tile on the grid
		if (TileData != null) {
			TileImage = DrawGetImage("Screens/Online/ChatRoom/MapTile/" + TileData.Type + "/" + TileData.Style + ".png");
			DrawImageResize(TileImage, Math.floor(TileCanvasX), Math.floor(TileCanvasY), Math.ceil(TileWidth), Math.ceil(TileHeight));
			if (TileData.Type == "Wall") ChatRoomMapViewWallEffect(X, Y, Left + ScreenX, Top + ScreenY, Math.ceil(TileWidth), Math.ceil(TileHeight));
			else FloorWallEffect = ChatRoomMapViewFloorWallEffect(X, Y);
		}

		// Finds the object and updates the fog data
		let ObjectID = Fog ? ChatRoomMapViewObjectFog[Pos] : ChatRoomData.MapData.Objects.charCodeAt(Pos);
		ChatRoomMapViewTileFog[Pos] = TileID;
		ChatRoomMapViewObjectFog[Pos] = ObjectID;

		// Draw the non blank object next
		if (ObjectID > ChatRoomMapViewObjectStartID) {
			for (let Obj of ChatRoomMapViewObjectList) {
				if (Obj.ID == ObjectID) {
					if (Obj.IsVisible && !ChatRoomMapViewHasSuperPowers() && !Obj.IsVisible()) break;
					if (Obj.Style === "Blank") break;
					if (Obj.Type == "WallDecoration" && ChatRoomMapViewTileIsHidden(X, Y + 1)) break;
					let ImageName = Obj.Style;
					if ((Obj.AssetName != null) || (Obj.OccupiedStyle != null)) {
						let Char = ChatRoomMapViewGetCharacterAtPos(X, Y);
						if ((Char != null) && (Obj.AssetName != null) && (Obj.AssetGroup != null) && InventoryIsWorn(Char, Obj.AssetGroup, Obj.AssetName)) break;
						if ((Char != null) && (Obj.OccupiedStyle != null)) ImageName = Obj.OccupiedStyle;
					} else {
						if (Obj.BuildImageName != null)
							ImageName = Obj.BuildImageName(X, Y);
					}
					ObjectData = Obj;
					ObjectImage = "Screens/Online/ChatRoom/MapObject/" + Obj.Type + "/" + ImageName + ".png";
					DrawImageResize(ObjectImage, Math.floor(Left + ScreenX + ((Obj.Left == null) ? 0 : TileWidth * Obj.Left)), Math.floor(Top + ScreenY + ((Obj.Top == null) ? 0 : TileHeight * Obj.Top)), Math.ceil(TileWidth * ((Obj.Width == null) ? 1 : Obj.Width)), Math.ceil(TileHeight * ((Obj.Height == null) ? 1 : Obj.Height)));
				}
			}
		}


		// Keeps the tile as selected if the mouse is within selection
		if (((ChatRoomMapViewEditMode == "Tile") || (ChatRoomMapViewEditMode == "Object") || (ChatRoomMapViewEditMode == "Effect")) && (Left + ScreenX - EditWidth <= MouseX) && (Left + ScreenX + TileWidth + EditWidth >= MouseX) && (Top + ScreenY - EditHeight <= MouseY) && (Top + ScreenY + TileHeight + EditHeight >= MouseY)) {
			ChatRoomMapViewEditSelection.push(Pos);
			DrawSelectionRect = true;
		}

		// For each characters in the chat room (don't draw when there's fog)
		if (!Fog) {
			let C = ChatRoomMapViewGetCharacterAtPos(X, Y);
			if (C) {

				// Draws the character on the grid
				DrawCharacter(C, Left + ScreenX + (TileWidth * 0.05), Top + ScreenY - (TileHeight * 0.85), TileHeight * 1.8 / 1000);
				DrawStatus(C, Left + ScreenX + (TileWidth * 0.05), Top + ScreenY - (TileHeight * 0.85), TileHeight * 1.8 / 1000);

				// Keeps the character under the cursor
				if ((MouseX >= Left + ScreenX + (TileWidth * 0.05)) && (MouseX <= Left + ScreenX + (TileWidth * 0.95)) && (MouseY >= Top + ScreenY - (TileHeight * 0.85)) && (MouseY <= Top + ScreenY + (TileHeight * 0.95))) {
					ChatRoomMapViewFocusedCharacter = C;
					ChatRoomMapViewFocusedCharacterX = Left + ScreenX + (TileWidth * 0.05);
					ChatRoomMapViewFocusedCharacterY = Top + ScreenY - (TileHeight * 0.85);
					CharacterUnderCursor = { Character: C, StatusBaseX: TileCanvasX + (TileWidth / 2), StatusBaseY: TileCanvasY + TileHeight - 20 };
				}

				// Draw the water effect if character stands in water
				if (TileImage != null && TileData != null && TileData.Type == "Water") {
					const Transparency = (TileData.Transparency) ? TileData.Transparency : 0.0;
					const TransparencyCutoutHeight = (TileData.TransparencyCutoutHeight) ? TileData.TransparencyCutoutHeight : 1.0;
					DrawImageEx(TileImage, MainCanvas, TileCanvasX, TileCanvasY, {Width: TileWidth, Height: TileHeight, Alpha: Transparency, AlphaMasks: [[TileCanvasX, TileCanvasY, TileImage.width, TileImage.height * TransparencyCutoutHeight]]});
				}

				// Draw the transparency effect for objects
				if ((ObjectImage != null) && (ObjectData != null) && (ObjectData.Transparency != null) && (ObjectData.TransparencyCutoutHeight != null)) {
					let ImgX = Math.floor(Left + ScreenX + ((ObjectData.Left == null) ? 0 : TileWidth * ObjectData.Left));
					let ImgY = Math.floor(Top + ScreenY + ((ObjectData.Top == null) ? 0 : TileHeight * ObjectData.Top));
					let W = Math.ceil(TileWidth * ((ObjectData.Width == null) ? 1 : ObjectData.Width));
					let H = Math.ceil(TileHeight * ((ObjectData.Height == null) ? 1 : ObjectData.Height));
					let WA = Math.ceil(TileImage.width * 2 * ((ObjectData.Width == null) ? 1 : ObjectData.Width));
					let HA = Math.ceil(TileImage.height * ObjectData.TransparencyCutoutHeight * ((ObjectData.Height == null) ? 1 : ObjectData.Height));
					DrawImageEx(ObjectImage, MainCanvas, ImgX, ImgY, {Width: W, Height: H, Alpha: ObjectData.Transparency, AlphaMasks: [[ImgX, ImgY, WA, HA]]});
				}

			}
		}

		// Draw the floor wall effect and rectancle if needed at the end
		if (FloorWallEffect != -1) DrawImageResize("Screens/Online/ChatRoom/MapTile/WallEffect/" + FloorWallEffect.toString() + ".png", Math.floor(ScreenX), Math.floor(ScreenY), Math.ceil(TileWidth), Math.ceil(TileHeight));
		if (DrawSelectionRect) DrawEmptyRect(Left + ScreenX, Top + ScreenY, TileWidth, TileHeight, "cyan", 3);

	}

	const PlayerX = Player.MapData.Pos.X;
	const PlayerY = Player.MapData.Pos.Y;

	for (let X = 0; X < ChatRoomMapViewWidth; X++) {
		for (let Y = 0; Y < ChatRoomMapViewHeight; Y++) {
			const tileEffects = ChatRoomMapManager.Map.getEffectsByXY(X, Y);
			let MaxRange = Math.max(
				Math.abs(X - PlayerX),
				Math.abs(Y - PlayerY),
			);
			if (MaxRange > MaxVisibleRange) continue;

			// Calculate Screen Positions
			let currentX =
				Left +
				(X - PlayerX) * TileWidth +
				ChatRoomMapViewPerceptionRange * TileWidth;
			let currentY =
				Top +
				(Y - PlayerY) * TileHeight +
				ChatRoomMapViewPerceptionRange * TileWidth;

			// Bounds Check
			if (
				currentX < 0 ||
				currentX >= Width ||
				currentY < 0 ||
				currentY >= Height
			)
				continue;

			// Pixel Snapping (Prevents gaps and borders)
			const nextX =
				Left +
				(X + 1 - PlayerX) * TileWidth +
				ChatRoomMapViewPerceptionRange * TileWidth;
			const nextY =
				Top +
				(Y + 1 - PlayerY) * TileHeight +
				ChatRoomMapViewPerceptionRange * TileWidth;

			const drawX = Math.floor(currentX);
			const drawY = Math.floor(currentY);
			const drawW = Math.floor(nextX) - drawX;
			const drawH = Math.floor(nextY) - drawY;
			/**
			 * @type {[number, number, number, number]}
			 */
			const drawRect = [drawX, drawY, drawW, drawH];

			// Currently we only have simple effects, so we can
			// draw all the effects as simple rects. In the future, we must
			// implement a special rendering function which would check the effect's Type
			// and draw it appropriately.
			for (const effect of tileEffects) {
				DrawRect(...drawRect, RgbaArrayToHTMLColor(effect.Color));
			}
		}
	}

	// For each tiles in the grid, we draw the fog
	if (FogActive && !ChatRoomMapViewHasSuperPowers())
		for (let Pos = 0; Pos < ChatRoomMapViewWidth * ChatRoomMapViewHeight; Pos++) {

			// Find the X & Y position of the grid
			let X = Pos % ChatRoomMapViewWidth;
			let Y = Math.floor(Pos / ChatRoomMapViewWidth);

			// Only process if the X & Y are within the visible sight range
			let MaxRange = Math.max(Math.abs(X - PlayerX), Math.abs(Y - PlayerY));
			if (MaxRange > MaxVisibleRange) continue;

			// Defines the screen X and Y positions
			let ScreenX = (X - PlayerX) * TileWidth + ChatRoomMapViewPerceptionRange * TileWidth;
			let ScreenY = (Y - PlayerY) * TileHeight + ChatRoomMapViewPerceptionRange * TileWidth;

			// If this tile's coordinates are out of the view range, we don't have to bother with it
			if ((ScreenX < 0) || (ScreenX >= Width) || (ScreenY < 0) || (ScreenY >= Height)) continue;

			// Out of sight and with known data, we draw the half fog effect
			if (!ChatRoomMapViewVisibilityMask[Pos])
				if (ChatRoomMapViewTileFog[Pos] > 0)
					DrawImageResize("Screens/Online/ChatRoom/MapTile/Fog/Half.png", Math.floor(ScreenX), Math.floor(ScreenY), Math.ceil(TileWidth), Math.ceil(TileHeight));
		}




	// If the user hovers the mouse over a tile occupied by a character
	if (CharacterUnderCursor) {
		DrawText(CharacterNickname(CharacterUnderCursor.Character), CharacterUnderCursor.StatusBaseX, CharacterUnderCursor.StatusBaseY, (CommonIsColor(CharacterUnderCursor.Character.LabelColor)) ? CharacterUnderCursor.Character.LabelColor : "White", "Black");
		ChatRoomDrawCharacterStatusIcons(CharacterUnderCursor.Character, CharacterUnderCursor.StatusBaseX - 125, CharacterUnderCursor.StatusBaseY - 40, 0.5);
	}

}

/**
 * Sets the next update flag for the room if it's not already set, the delay is 5 seconds
 * @returns {void} - Nothing
 */
function ChatRoomMapViewUpdateFlag() {

	// Clears the wrong objects on the map
	for (let Pos = 0; Pos < ChatRoomMapViewWidth * ChatRoomMapViewHeight; Pos++) {

		// If there's an object to check
		let ObjectID = ChatRoomData.MapData.Objects.charCodeAt(Pos);
		if (ObjectID >= ChatRoomMapViewObjectStartID) {

			// Fast lookup for objects
			let Obj = ChatRoomMapViewObjectLookup[ObjectID];

			let ClearObject = (!Obj || Obj.Style == "Blank");
			if (!ClearObject) {
				//
				// Gets the tile for that object
				let TileID = ChatRoomData.MapData.Tiles.charCodeAt(Pos);
				let Tile = ChatRoomMapViewTileLookup[TileID];


				// Invalid tiles and invalid objects for that tile must be cleared
				if (!Tile) {
					ClearObject = true;
				} else if ([
					"FloorDecoration",
					"FloorDecorationThemed",
					"FloorDecorationParty",
					"FloorDecorationCamping",
					"FloorDecorationExpanding",
					"FloorItem",
					"FloorObstacle"
				].includes(Obj.Type) && (Tile.Type != "Floor") && (Tile.Type != "FloorExterior")) {
					ClearObject = true;
				} else if ((Obj.Type == "WallDecoration" || Obj.Type == "Banners" || Obj.Type == "WallPath") && (Tile.Type != "Wall")) {
					ClearObject = true;
				} else if (Tile.Type == "Wall") {
					// Check if there's a wall below; if so, clear the decoration/banner
					let X = Pos % ChatRoomMapViewWidth;
					let Y = Math.floor(Pos / ChatRoomMapViewWidth);
					if (ChatRoomMapViewIsWall(X, Y + 1)) {
						ClearObject = true;
					}
				}
			}

			// Clears the object if needed
			if (ClearObject) {
				ChatRoomData.MapData.Objects = ChatRoomData.MapData.Objects.substring(0, Pos) + String.fromCharCode(ChatRoomMapViewObjectStartID) + ChatRoomData.MapData.Objects.substring(Pos + 1);
			}

		}

	}

	// Sets the flag
	if (ChatRoomMapViewUpdateRoomNext == null) ChatRoomMapViewUpdateRoomNext = CommonTime() + 5000;

}

/**
 * Sets the next update flags for the player if it's not already set, the delay is 1 seconds for live data and 10 seconds for last map data
 * @param {number} UpdateTimeOffset - A offset for the update time. This can be positive to increase the update time or negative to reduce it.
 * @returns {void} - Nothing
 */
function ChatRoomMapViewUpdatePlayerFlag(UpdateTimeOffset = 0) {
	if (ChatRoomMapViewUpdatePlayerNext == null)
		ChatRoomMapViewUpdatePlayerNext = CommonTime() + ChatRoomMapViewUpdatePlayerTime + UpdateTimeOffset;
	if (Player.ImmersionSettings && Player.ImmersionSettings.ReturnToChatRoom && (ChatRoomMapViewUpdateLastMapDataNext == null))
		ChatRoomMapViewUpdateLastMapDataNext = CommonTime() + 10000;
}

/**
 * Updates the room data if needed
 * @returns {void} - Nothing
 */
function ChatRoomMapViewUpdateRoomSync() {
	if ((ChatRoomMapViewUpdateRoomNext == null) || (ChatRoomMapViewUpdateRoomNext > CommonTime())) return;
	if (!ChatRoomPlayerIsAdmin()) return;
	ChatRoomMapViewUpdateRoomNext = null;
	ServerSend("ChatRoomAdmin", { MemberNumber: Player.ID, Room: ChatRoomGetSettings(ChatRoomData), Action: "Update" });
}

/**
 * Updates the player map data if needed
 * @returns {void} - Nothing
 */
function ChatRoomMapViewUpdatePlayerSync() {
	if ((ChatRoomMapViewUpdatePlayerNext == null) || (ChatRoomMapViewUpdatePlayerNext > CommonTime())) return;
	ChatRoomMapViewUpdatePlayerNext = null;
	ServerSend("ChatRoomCharacterMapDataUpdate", Player.MapData);
}

/**
 * Updates a character's map data
 * @param {ServerMapDataResponse} data - Data object containing the new character map data.
 * @returns {void} - Nothing.
 */
function ChatRoomMapViewSyncMapData(data) {
	// Exits if we're not in a room
	if (!ChatRoomData) return;

	// Exit if the packet is invalid
	if (!CommonIsObject(data) || typeof data.MemberNumber !== "number") return;

	const char = ChatRoomCharacter.find(c => c.MemberNumber === data.MemberNumber);
	if (!char || char.IsPlayer()) return;

	// Assigns the MapData to the chatroom character
	char.MapData = ServerAccountDataSyncedValidate.MapData(data.MapData, char);
}

/**
 * Updates the player last map data if needed
 * @returns {void} - Nothing
 */
function ChatRoomMapViewUpdateLastMapDataSync() {
	if ((ChatRoomMapViewUpdateLastMapDataNext == null) || (ChatRoomMapViewUpdateLastMapDataNext > CommonTime())) return;
	ChatRoomMapViewUpdateLastMapDataNext = null;
	ServerAccountUpdate.QueueData({ LastMapData: Player.MapData }, true);
}

/**
 * Processes the character movement when the timer has expired
 * @returns {void} - Nothing
 */
function ChatRoomMapViewMovementProcess() {
	if ((ChatRoomMapViewMovement == null) || (ChatRoomMapViewMovement.TimeEnd > CommonTime())) return;
	Player.MapData.Pos.X = ChatRoomMapViewMovement.X;
	Player.MapData.Pos.Y = ChatRoomMapViewMovement.Y;
	// Set the update flag and reduce the wait time by the time the player already waited
	ChatRoomMapViewUpdatePlayerFlag(ChatRoomMapViewMovement.TimeStart - ChatRoomMapViewMovement.TimeEnd);
	ChatRoomMapViewMovement = null;
	// After we moved, calculate the new perception masks
	ChatRoomMapViewCalculatePerceptionMasks();
	// Get the tile and object we entered
	const newTile = ChatRoomMapViewGetTileAtPos(Player.MapData.Pos.X, Player.MapData.Pos.Y);
	const newObject = ChatRoomMapViewGetObjectAtPos(Player.MapData.Pos.X, Player.MapData.Pos.Y);
	// If the current tile or object have OnEnter functions, execute them
	if(newTile && newTile.OnEnter) newTile.OnEnter();
	if(newObject && newObject.OnEnter) newObject.OnEnter();
}

/**
 * Checks if the player is leashed and if she should follow the leash holder
 * @returns {void} - Nothing
 */
function ChatRoomMapViewLeash() {

	// Finds the leash holder character
	if (ChatRoomLeashPlayer == null) return;
	for (let C of ChatRoomCharacter)
		if ((C.MemberNumber == ChatRoomLeashPlayer) && !C.IsPlayer()) {

			// Validates the data first
			if ((Player.MapData == null) || (Player.MapData.Pos.X == null) || (Player.MapData.Pos.Y == null)) return;
			if ((C.MapData?.Pos == null) || (C.MapData.Pos.X == null) || (C.MapData.Pos.Y == null)) return;

			// Leash range is 2 tiles
			let Distance = Math.max(Math.abs(Player.MapData.Pos.X - C.MapData.Pos.X), Math.abs(Player.MapData.Pos.Y - C.MapData.Pos.Y));
			if (Distance <= 2) return;

			// The X and Y variance tells us where to pull the character
			let VarX = Player.MapData.Pos.X - C.MapData.Pos.X;
			let VarY = Player.MapData.Pos.Y - C.MapData.Pos.Y;
			let TargetX = Player.MapData.Pos.X;
			let TargetY = Player.MapData.Pos.Y;
			if (VarX > 2) TargetX = C.MapData.Pos.X + 2;
			if (VarX < -2) TargetX = C.MapData.Pos.X - 2;
			if (VarY > 2) TargetY = C.MapData.Pos.Y + 2;
			if (VarY < -2) TargetY = C.MapData.Pos.Y - 2;

			// If the new target tile cannot be entered, we try another one nearby
			if (ChatRoomMapViewCanEnterTile(TargetX, TargetY) <= 0) {

				// Tries to bring the character one extra tile toward the leash holder on the invert axis (X instead of Y or vice versa)
				if ((Math.abs(VarX) > 2) && (Math.abs(VarX) > Math.abs(VarY)) && (VarY > 0)) TargetY--;
				if ((Math.abs(VarX) > 2) && (Math.abs(VarX) > Math.abs(VarY)) && (VarY < 0)) TargetY++;
				if ((Math.abs(VarY) > 2) && (Math.abs(VarX) < Math.abs(VarY)) && (VarX > 0)) TargetX--;
				if ((Math.abs(VarY) > 2) && (Math.abs(VarX) < Math.abs(VarY)) && (VarX < 0)) TargetX++;

				// If we still cannot move there
				if (ChatRoomMapViewCanEnterTile(TargetX, TargetY) <= 0) {

					// Bring the character 1 tile near the leash holder
					if (VarX > 1) TargetX = C.MapData.Pos.X + 1;
					if (VarX < -1) TargetX = C.MapData.Pos.X - 1;
					if (VarY > 1) TargetY = C.MapData.Pos.Y + 1;
					if (VarY < -1) TargetY = C.MapData.Pos.Y - 1;

					// If it still doesn't work, we give up
					if (ChatRoomMapViewCanEnterTile(TargetX, TargetY) <= 0) return;

				}

			}

			// Sends the movement packet
			Player.MapData.Pos.X = TargetX;
			Player.MapData.Pos.Y = TargetY;
			ChatRoomMapViewUpdatePlayerFlag();
			return;

		}

}


/**
 * Draws the map and characters of the chat room map on the left side of the screen
 * @returns {void} - Nothing
 */
function ChatRoomMapViewDraw() {
	ChatRoomMapViewDrawGrid(0, 0, 1000, 1000);
}

/**
 * Draws the buttons of the chat room map
 * @returns {void} - Nothing
 */
function ChatRoomMapViewDrawUi() {

	// Admins can grant themselves super powers (teleport, far hearing, etc.)
	if (ChatRoomPlayerIsAdmin())
		DrawButton(790, 860, 60, 60, "", "White", "Icons/Small/" + ((ChatRoomMapViewSuperPowersActive) ? "SuperPowersActive" : "SuperPowersInactive") + ".png");

	// Draw the movement buttons
	if (ChatRoomMapViewMovement == null) {
		DrawButton(860, 860, 60, 60, "", "White", "Icons/Small/North.png");
		DrawButton(790, 930, 60, 60, "", "White", "Icons/Small/West.png");
		DrawButton(860, 930, 60, 60, "", "White", "Icons/Small/South.png");
		DrawButton(930, 930, 60, 60, "", "White", "Icons/Small/East.png");
	} else {
		DrawButton(860, 860, 60, 60, "", (ChatRoomMapViewMovement.Direction !== "North") ? "White" : "#80FF80", "Icons/Small/North.png");
		DrawButton(930, 860, 60, 60, "", "White", "Icons/Small/Cancel.png");
		DrawButton(790, 930, 60, 60, "", (ChatRoomMapViewMovement.Direction !== "West") ? "White" : "#80FF80", "Icons/Small/West.png");
		DrawButton(860, 930, 60, 60, "", (ChatRoomMapViewMovement.Direction !== "South") ? "White" : "#80FF80", "Icons/Small/South.png");
		DrawButton(930, 930, 60, 60, "", (ChatRoomMapViewMovement.Direction !== "East") ? "White" : "#80FF80", "Icons/Small/East.png");
		let Progress = (CommonTime() - ChatRoomMapViewMovement.TimeStart) / (ChatRoomMapViewMovement.TimeEnd - ChatRoomMapViewMovement.TimeStart) * 100;
		DrawProgressBar(790, 992, 200, 8, Progress);
	}

	// Out of edit mode, we draws the basic buttons
	if (ChatRoomMapViewEditMode == "") {
		DrawButton(10, 10, 60, 60, "", "White", "Icons/Small/Plus.png");
		DrawButton(10, 80, 60, 60, "", "White", "Icons/Small/Minus.png");
		if (ChatRoomPlayerIsAdmin()) {
			DrawButton(10, 150, 60, 60, "", "White", "Icons/Small/EditTile.png");
			DrawButton(10, 220, 60, 60, "", "White", "Icons/Small/EditObject.png");
			DrawButton(10, 290, 60, 60, "", "White", "Icons/Small/Light.png");
			DrawButton(10, 360, 60, 60, "", "White", "Icons/Small/Undo.png");
			DrawButton(10, 430, 60, 60, "", "White", "Icons/Small/Fog" + (ChatRoomMapFogIsActive() ? "Active" : "Inactive") + ".png");
		}
	}

	// In tile type selection mode, the user can select a tile type (floor, wall, etc.)
	if (ChatRoomMapViewEditMode == "TileType") {
		DrawButton(10, 10, 60, 60, "", "White", "Icons/Small/MapView.png");
		DrawButton(10, 80, 60, 60, "", "White", "Icons/Small/EditObject.png");
		let X = 0;
		let Y = 0;
		let Type = "";
		let count = 2;
		for (let Tile of ChatRoomMapViewTileList)
			if (Type != Tile.Type) {
				Type = Tile.Type;
				Y = 10 + 70 * (count % 13);
				X = 10 + 70 * Math.floor(count / 13);
				DrawButton(X, Y, 60, 60, "", "White", "Screens/Online/ChatRoom/MapTile/Type/" + Type + ".png");
				count ++;
			}

	}

	// In tile edit mode, we show all tiles of a spectific tyle
	if (ChatRoomMapViewEditMode == "Tile") {
		DrawButton(10, 10, 60, 60, "", "White", "Icons/Small/Edit.png");
		DrawButton(10, 80, 60, 60, "", "White", "Screens/Online/ChatRoom/MapTile/Range/" + ChatRoomMapViewEditRange.toString() + ".png");
		let X = 0;
		let Y = 0;
		let count = 2;
		for (let Tile of ChatRoomMapViewTileList){
			if (ChatRoomMapViewEditSubMode == Tile.Type) {
				Y = 10 + 70 * (count % 13);
				X = 10 + 70 * Math.floor(count / 13);
				DrawButton(X, Y, 60, 60, "", "White");
				count++;
				if (Tile.ID == ChatRoomMapViewEditObject.ID) DrawRect(X + 2, Y + 2, 56, 56, "#00FF00");
				DrawImageResize("Screens/Online/ChatRoom/MapTile/" + Tile.Type + "/" + Tile.Style + ".png", X + 5, Y + 5, 50, 50);
			}
		}

	}

	// In object type selection mode, the user can select an object type (floor decoration, floor obstacle, wall decoration, etc.)
	if (ChatRoomMapViewEditMode == "ObjectType") {
		DrawButton(10, 10, 60, 60, "", "White", "Icons/Small/MapView.png");
		DrawButton(10, 80, 60, 60, "", "White", "Icons/Small/EditTile.png");
		let X = 0;
		let Y = 0;
		let Type = "";
		let count = 2;
		for (let Obj of ChatRoomMapViewObjectList){
			if (Type != Obj.Type) {
				Type = Obj.Type;
				Y = 10 + 70 * (count % 13);
				X = 10 + 70 * Math.floor(count / 13);
				DrawButton(X, Y, 60, 60, "", "White", "Screens/Online/ChatRoom/MapObject/Type/" + Type + ".png");
				count++;
			}
		}

	}

	// In object edit mode, we show all objects of a spectific tyle
	if (ChatRoomMapViewEditMode == "Object") {
		DrawButton(10, 10, 60, 60, "", "White", "Icons/Small/Edit.png");
		DrawButton(10, 80, 60, 60, "", "White", "Screens/Online/ChatRoom/MapTile/Range/" + ChatRoomMapViewEditRange.toString() + ".png");
		let X = 0;
		let Y = 0;
		let count = 2;
		for (let Obj of ChatRoomMapViewObjectList)
			if (ChatRoomMapViewEditSubMode == Obj.Type) {
				Y = 10 + 70 * (count % 13);
				X = 10 + 70 * Math.floor(count / 13);
				DrawButton(X, Y, 60, 60, "", ((Obj.AssetName == null) || (Obj.AssetGroup == null) || InventoryAvailable(Player, Obj.AssetName, Obj.AssetGroup)) ? "White" : "Pink");
				count++;
				if (Obj.ID == ChatRoomMapViewEditObject.ID) DrawRect(X + 2, Y + 2, 56, 56, "#00FF00");
				if (Obj.Style !== "Blank") DrawImageResize("Screens/Online/ChatRoom/MapObject/" + Obj.Type + "/" + Obj.Style + ".png", X + 5, Y + 5, 50, 50);
			}
	}

	if (ChatRoomMapViewEditMode == "Effect") {
		DrawButton(10, 10, 60, 60, "", "White", "Icons/Small/MapView.png"); // Exit button
		DrawButton(10, 80, 60, 60, "", "White", "Screens/Online/ChatRoom/MapTile/Range/" + ChatRoomMapViewEditRange.toString() + ".png"); // Draw range button

		let X = 0;
		let Y = 0;
		let count = 2; // Offset for buttons

		for (let Eff of ChatRoomMapViewEffectList) {
			 Y = 10 + 70 * (count % 13);
			 X = 10 + 70 * Math.floor(count / 13);

			 // Draw the selection button
			 DrawButton(X, Y, 60, 60, "", "White");

			 // Draw a sample of the color inside the button
			 DrawRect(X + 5, Y + 5, 50, 50, RgbaArrayToHTMLColor(Eff.Color));

			 // Highlight if selected
			 if (ChatRoomMapViewEditObject && ChatRoomMapViewEditObject.ID === Eff.ID) {
				 DrawEmptyRect(X, Y, 60, 60, "Cyan", 3);
			 }

			 count++;
		}
	}
}

/**
 * Change the key of charachter - sender
 * @param {Character} target
 * @param {("gold" | "silver" | "bronze")[]} keys
 */
function ChatRoomMapViewChangeKey(target, keys, boolean) {
	if (!ChatRoomPlayerIsAdmin()) return;

	const dictionary = new DictionaryBuilder().mapViewChangeKey(keys, boolean).build();
	ServerSend("ChatRoomChat", { Content: "ChatRoomMapViewChangeKey", Type: "Hidden", Dictionary: dictionary, Target: target?.MemberNumber });
}

/**
 * Change a key from a character from a hidden message - reciver
 * @param {Character} sender
 * @param {ServerChatRoomMessage} data
 */
function ChatRoomMapViewChangeKeyHiddenMessage(sender, data) {
	if (!ChatRoomCharacterIsAdmin(sender)) return;

	const mapViewChangeEntries = data.Dictionary;
	mapViewChangeEntries.map((entrie) => {
		if (!IsMapViewChangeKeyEventDictionaryEntry(entrie)) return;
		const HasKey = `HasKey${entrie.Key.charAt(0).toUpperCase() + entrie.Key.slice(1)}`;
		Player.MapData.PrivateState[HasKey] = entrie.Bool;
	});
}

/**
 * Teleport a character to a specific tile
 * @param {Character} target
 * @param {ChatRoomMapPos} position
 */
function ChatRoomMapViewTeleport(target, position) {
	if (!ChatRoomPlayerIsAdmin()) return;
	if (Player.MemberNumber === target.MemberNumber) Player.Position = position;

	const dictionary = new DictionaryBuilder().mapViewTeleport(position).build();
	ServerSend("ChatRoomChat", { Content: "ChatRoomMapViewTeleport", Type: "Hidden", Dictionary: dictionary, Target: target?.MemberNumber });
}

/**
 * Teleport a character to a specific tile from a hidden message
 * @param {Character} sender
 * @param {ServerChatRoomMessage} data
 */
function ChatRoomMapViewTeleportHiddenMessage(sender, data) {
	if (!ChatRoomCharacterIsAdmin(sender)) return;
	const mapViewTeleportEntry = data.Dictionary[0];
	if (!IsMapViewTeleportEventDictionaryEntry(mapViewTeleportEntry)) return;
	ChatRoomMapViewMovement = null;
	Player.Position = mapViewTeleportEntry.Position;
}

/**
 * Check if a tile on the map can be entered by a player, and return the number of milliseconds required to reach it
 * @param {number} X - The X position on the map
 * @param {number} Y - The Y position on the map
 * @returns {number} - The number of milliseconds
 */
function ChatRoomMapViewCanEnterTile(X, Y) {

	// Out of map bound or walls cannot enter, super powers skip everything
	if ((X < 0) || (Y < 0) || (X >= ChatRoomMapViewWidth) || (Y >= ChatRoomMapViewHeight)) return 0;
	if (ChatRoomMapViewHasSuperPowers()) {
		if (CommonTime() - ChatRoomMapViewStartOfKeyPress < 300) return ChatRoomMapViewBaseMovementSpeed;
		return ChatRoomMapViewBaseMovementSpeed / 10;
	}

	// Enclosed or suspended players cannot change tiles
	if (Player.IsEnclose() || Player.IsSuspended() || Player.IsMounted()) return 0;

	// The MapImmobile effect prevents players from moving
	if (Player.HasEffect("MapImmobile")) return 0;

	// Cannot enter a tile occupied by another player
	if (ChatRoomCharacter.some(c => !c.IsPlayer() && c.MapData?.Pos.X === X && c.MapData?.Pos.Y === Y)) return 0;

	if (ChatRoomMapViewPositionIsBlocked(X, Y)) return 0;

	// Base movement speed first, water tiles are slower
	let Speed = ChatRoomMapViewBaseMovementSpeed;

	const Tile = ChatRoomMapViewGetTileAtPos(X, Y);
	// Slowed down if not under the MapSwim effect
	if (Tile?.Type === "Water" && Tile?.Style !== "Lava" && !Player.HasEffect("MapSwim"))
		Speed = Speed * 2.5;

	// The hogtied/bound/slow/plugged modificator
	if (Player.Pose?.includes("Hogtied")) Speed = Speed * 12;
	else if (!Player.CanWalk()) Speed = Speed * 6;
	else if (Player.GetSlowLevel() > 0) Speed = Speed * Player.GetSlowLevel() * 2;
	else if (!Player.CanKneel()) Speed = Speed * 1.5;
	else if (Player.IsPlugged()) Speed = Speed * 1.2;

	// Returns the final calculated speed
	return Speed;

}

/**
 * Moves the player
 * @param {"West" | "East" | "North" | "South"} D - The direction being travelled (North, South, East, West)
 * @returns {void} - Nothing
 */
function ChatRoomMapViewMove(D) {

	// Nothing to do if that current move is in progress
	if ((Player.MapData == null) || (Player.MapData.Pos.X == null) || (Player.MapData.Pos.Y == null)) return;
	if ((ChatRoomMapViewMovement != null) && (ChatRoomMapViewMovement.Direction === D)) return;

	// Gets the new position
	let X = Player.MapData.Pos.X + ((D == "West") ? -1 : 0) + ((D == "East") ? 1 : 0);
	let Y = Player.MapData.Pos.Y + ((D == "North") ? -1 : 0) + ((D == "South") ? 1 : 0);
	let Time = ChatRoomMapViewCanEnterTile(X, Y);

	// If we can enter the tile
	if (Time > 0) {
		ChatRoomMapViewMovement = {
			X: X,
			Y: Y,
			Direction: D,
			TimeStart: CommonTime(),
			TimeEnd: CommonTime() + Time
		};
	}

}

/**
 * Undoes the changes made to the map, from the latest backup in the stack
 * @returns {void} - Nothing
 */
function ChatRoomMapViewUndo() {
	if (ChatRoomMapViewEditBackup.length > 0) {
		let LastMap = ChatRoomMapViewEditBackup.pop();
		ChatRoomData.MapData = CommonCloneDeep(LastMap);
		ChatRoomMapManager.Map.loadGlobalMapData();
		ChatRoomMapViewUpdateFlag();
		ChatRoomMapViewCalculatePerceptionMasks();
	}
}

/**
 * Handles keyboard keys in the chat room map screen
 * @type {KeyboardEventListener}
 */
function ChatRoomMapViewKeyDown(event) {

	// Nothing to do if a character dialog is open
	if (CurrentCharacter != null) return false;
	if (document.activeElement === ElementWrap("InputChat")) return false;

	const move = CommonKeyMove(event);
	if (!move) return false;

	const isDirectional = ['u', 'd', 'l', 'r'].includes(move);
	const noKeyPressed = !Object.values(ChatRoomMapViewKeysPressed).some(Boolean);

	if (noKeyPressed && isDirectional) {
		ChatRoomMapViewStartOfKeyPress = CommonTime();
	}

	ChatRoomMapViewKeysPressed = {
		u: move === 'u',
		d: move === 'd',
		l: move === 'l',
		r: move === 'r',
	};
	return true;
}

/**
 * Handles keyboard up keys in the chat room map screen
 * @type {KeyboardEventListener}
 */
function ChatRoomMapViewKeyUp(event) {
	switch (CommonKeyMove(event, true, false)) {
		case "u":
			ChatRoomMapViewKeysPressed.u = false;
			return true;
		case "l":
			ChatRoomMapViewKeysPressed.l = false;
			return true;
		case "d":
			ChatRoomMapViewKeysPressed.d = false;
			return true;
		case "r":
			ChatRoomMapViewKeysPressed.r = false;
			return true;
		default:
			return false;
	}
}

/**
 * Handles clicks the chatroom screen view.
 * @returns {void} - Nothing.
 */
function ChatRoomMapViewClick() {

	// Out of chatroom, exit right away
	if ((CurrentScreen != "ChatRoom") || !ChatRoomMapViewIsActive()) return;

	// Toggle the superpowers on and off
	if (ChatRoomPlayerIsAdmin() && MouseIn(790, 860, 60, 60)) {
		ChatRoomMapViewSuperPowersActive = !ChatRoomMapViewSuperPowersActive;
		ChatRoomMapViewCalculatePerceptionMasks();
		return;
	}

	// Regular movement buttons
	if ((ChatRoomMapViewMovement != null) && MouseIn(930, 860, 60, 60)) return ChatRoomMapViewMovement = null;
	if (MouseIn(860, 860, 60, 60)) return ChatRoomMapViewMove("North");
	if (MouseIn(790, 930, 60, 60)) return ChatRoomMapViewMove("West");
	if (MouseIn(860, 930, 60, 60)) return ChatRoomMapViewMove("South");
	if (MouseIn(930, 930, 60, 60)) return ChatRoomMapViewMove("East");

	// When clicking on a character
	if ((MouseX <= 1000) && (ChatRoomMapViewFocusedCharacter != null) && (ChatRoomMapViewEditMode != "Tile") && (ChatRoomMapViewEditMode != "Object") && !ChatRoomMapViewEditStarted) {

		// Checks if the arousal meter is showing
		let MeterShow = ChatRoomMapViewFocusedCharacter.IsPlayer();
		if (!ChatRoomMapViewFocusedCharacter.IsPlayer() && Player.ArousalSettings.ShowOtherMeter && ChatRoomMapViewFocusedCharacter.ArousalSettings) {
			if (ChatRoomMapViewFocusedCharacter.ArousalSettings.Visible === "Access") {
				MeterShow = ChatRoomMapViewFocusedCharacter.AllowItem;
			} else if (ChatRoomMapViewFocusedCharacter.ArousalSettings.Visible === "All") {
				MeterShow = true;
			}
		}

		// If we clicked on the thermometer, we zoom/unzoom it
		if (MeterShow) {

			// Defines the X, Y and zoom of the character
			let CharX = ChatRoomMapViewFocusedCharacterX;
			let CharY = ChatRoomMapViewFocusedCharacterY;
			let Zoom = (1 / ((ChatRoomMapViewPerceptionRange * 2) + 1)) * 1.8;

			// Zoom or unzoom
			if (MouseIn(CharX + 60 * Zoom, CharY + 400 * Zoom, 80 * Zoom, 100 * Zoom) && !ChatRoomMapViewFocusedCharacter.ArousalZoom) { ChatRoomMapViewFocusedCharacter.ArousalZoom = true; return; }
			if (MouseIn(CharX + 50 * Zoom, CharY + 615 * Zoom, 100 * Zoom, 85 * Zoom) && ChatRoomMapViewFocusedCharacter.ArousalZoom) { ChatRoomMapViewFocusedCharacter.ArousalZoom = false; return; }

			// If the player can manually control her arousal, we set the progress manual and change the facial expression, it can trigger an orgasm at 100%
			if (ChatRoomMapViewFocusedCharacter.IsPlayer() && MouseIn(CharX + 50 * Zoom, CharY + 200 * Zoom, 100 * Zoom, 500 * Zoom) && ChatRoomMapViewFocusedCharacter.ArousalZoom) {
				if (PreferenceArousalAtLeast(Player, "Manual") && !PreferenceArousalAtLeast(Player, "Automatic")) {
					var Arousal = Math.round((CharY + 625 * Zoom - MouseY) / (4 * Zoom));
					ActivitySetArousal(Player, Arousal);
					if (Player.ArousalSettings.AffectExpression) ActivityExpression(Player, Player.ArousalSettings.Progress);
					if (Player.ArousalSettings.Progress == 100) ActivityOrgasmPrepare(Player);
				}
				return;
			}

			// Don't do anything if the thermometer is clicked without access to it
			if (MouseIn(CharX + 50 * Zoom, CharY + 200 * Zoom, 100 * Zoom, 415 * Zoom) && ChatRoomMapViewFocusedCharacter.ArousalZoom) return;

		}

		// Focuses on the character
		ChatRoomFocusCharacter(ChatRoomMapViewFocusedCharacter);

	}

	// Out of edit mode, we allow the basic buttons
	if (ChatRoomMapViewEditMode == "") {
		if (MouseIn(10, 10, 60, 60) && (ChatRoomMapViewPerceptionRange > ChatRoomMapViewPerceptionRangeMin)) { ChatRoomMapViewPerceptionRange--; return; }
		if (MouseIn(10, 80, 60, 60) && (ChatRoomMapViewPerceptionRange < ChatRoomMapViewPerceptionRangeMax)) { ChatRoomMapViewPerceptionRange++; return; }
		if (ChatRoomPlayerIsAdmin() && MouseIn(10, 150, 60, 60)) {
			ChatRoomMapViewEditMode = "TileType";
			ChatRoomMapViewEditSubMode = "";
			return;
		}
		if (ChatRoomPlayerIsAdmin() && MouseIn(10, 220, 60, 60)) {
			ChatRoomMapViewEditMode = "ObjectType";
			ChatRoomMapViewEditSubMode = "";
			return;
		}
		if (ChatRoomPlayerIsAdmin() && MouseIn(10, 290, 60, 60)) {
			ChatRoomMapViewEditMode = "Effect";
			ChatRoomMapViewEditSubMode = "";
			ChatRoomMapViewEditObject = ChatRoomMapViewEffectList[1];
			return;
		}
		if (ChatRoomPlayerIsAdmin() && MouseIn(10, 360, 60, 60)) {
			ChatRoomMapViewUndo();
			return;
		}
		if (ChatRoomPlayerIsAdmin() && MouseIn(10, 430, 60, 60)) {
			if (ChatRoomMapFogIsActive()) ChatRoomData.MapData.Fog = false;
			else delete ChatRoomData.MapData.Fog;
			ChatRoomMapViewUpdateFlag();
			return;
		}

		// In tile type selection mode, the user can select a tile type (floor, wall, etc.)
	} else if (ChatRoomMapViewEditMode == "TileType") {
		if (MouseIn(10, 10, 60, 60)) { ChatRoomMapViewEditMode = ""; return; }
		if (MouseIn(10, 80, 60, 60)) { ChatRoomMapViewEditMode = "ObjectType"; return; }
		let X = 0;
		let Y = 0;
		let count = 2;
		let Type = "";
		for (let Tile of ChatRoomMapViewTileList)
			if (Type != Tile.Type) {
				Type = Tile.Type;
				Y = 10 + 70 * (count % 13);
				X = 10 + 70 * Math.floor(count / 13);
				if (MouseIn(X, Y, 60, 60)) {
					ChatRoomMapViewEditMode = "Tile";
					ChatRoomMapViewEditSubMode = Tile.Type;
					ChatRoomMapViewEditObject = CommonCloneDeep(Tile);
					return;
				}
				count++;
			}

	// In tile edit mode
	} else if ((ChatRoomMapViewEditMode == "Tile")) {
		// The first button returns to type selection
		if (MouseIn(10, 10, 60, 60)) {
			ChatRoomMapViewEditMode = "TileType";
			return;
		}

		// The second button allows changing the edit size from 1 to 5
		if (MouseIn(10, 80, 60, 60)) {
			ChatRoomMapViewEditRange++;
			if (ChatRoomMapViewEditRange > 5) ChatRoomMapViewEditRange = 1;
			return;
		}

		// The other buttons allows changing the edit tile
		let X = 0;
		let Y = 0;
		let count = 2;
		for (let Tile of ChatRoomMapViewTileList)
			if (ChatRoomMapViewEditSubMode == Tile.Type) {
				Y = 10 + 70 * (count % 13);
				X = 10 + 70 * Math.floor(count / 13);
				if (MouseIn(X, Y, 60, 60)) {
					ChatRoomMapViewEditObject = CommonCloneDeep(Tile);
					return;
				}
				count++;
			}

	// In object type selection mode, the user can select an object type (floor decoration, floor obstacle, wall decoration, etc.)
	} else if (ChatRoomMapViewEditMode == "ObjectType") {
		if (MouseIn(10, 10, 60, 60)) { ChatRoomMapViewEditMode = ""; return; }
		if (MouseIn(10, 80, 60, 60)) { ChatRoomMapViewEditMode = "TileType"; return; }
		let X = 0;
		let Y = 0;
		let count = 2;
		let Type = "";
		for (let Obj of ChatRoomMapViewObjectList)
			if (Type != Obj.Type) {
				Type = Obj.Type;
				Y = 10 + 70 * (count % 13);
				X = 10 + 70 * Math.floor(count / 13);
				if (MouseIn(X, Y, 60, 60)) {
					ChatRoomMapViewEditMode = "Object";
					ChatRoomMapViewEditSubMode = Obj.Type;
					ChatRoomMapViewEditObject = CommonCloneDeep(Obj);
					return;
				}
				count++;
			}

	// In object edit mode
	} else if ((ChatRoomMapViewEditMode == "Object")) {
		// The first button returns to type selection
		if (MouseIn(10, 10, 60, 60)) {
			ChatRoomMapViewEditMode = "ObjectType";
			return;
		}

		// The second button allows changing the edit size from 1 to 5
		if (MouseIn(10, 80, 60, 60)) {
			ChatRoomMapViewEditRange++;
			if (ChatRoomMapViewEditRange > 5) ChatRoomMapViewEditRange = 1;
			return;
		}

		// The other buttons allows changing the edit tile
		let X = 0;
		let Y = 0;
		let count = 2;
		for (let Obj of ChatRoomMapViewObjectList)
			if (ChatRoomMapViewEditSubMode == Obj.Type) {
				Y = 10 + 70 * (count % 13);
				X = 10 + 70 * Math.floor(count / 13);
				if (MouseIn(X, Y, 60, 60)) {
					// @ts-ignore
					if ((Obj.AssetName == null) || (Obj.AssetGroup == null) || InventoryAvailable(Player, Obj.AssetName, Obj.AssetGroup))
						ChatRoomMapViewEditObject = CommonCloneDeep(Obj);
					return;
				}
				count++;
			}

	} else if (ChatRoomMapViewEditMode === "Effect") {  // Set up Lighting Effect Menu
		// The "Exit" button (Top Left)
		if (MouseIn(10, 10, 60, 60)) { ChatRoomMapViewEditMode = ""; return; }  // Return to menu button
		if (MouseIn(10, 80, 60, 60)) {  // Change Edit scale from 1 to 5
			ChatRoomMapViewEditRange++;
			if (ChatRoomMapViewEditRange > 5) ChatRoomMapViewEditRange = 1;
			return;
		}

		// The Palette Selection Logic
		let X = 0, Y = 0, count = 2;
		for (let Eff of ChatRoomMapViewEffectList) {
			Y = 10 + 70 * (count % 13);
			X = 10 + 70 * Math.floor(count / 13);
			if (MouseIn(X, Y, 60, 60)) {
				ChatRoomMapViewEditObject = CommonCloneDeep(Eff);
				return;
			}
			count++;
		}
	}

}

/**
 * Mouse down event is used to draw on screen and handle the tiles buttons
 * @returns {void} - Nothing
 */
function ChatRoomMapViewMouseDown() {

	// The walk buttons in the bottom right of the map
	if ((CurrentScreen != "ChatRoom") || !ChatRoomMapViewIsActive()) return;

	// In tile edit mode
	else if ((ChatRoomMapViewEditMode == "Tile") && MouseIn(0, 0, 1000, 1000)) {
		if (MouseIn(10, 10, 60, 60)) { return; }
		if (MouseIn(10, 80, 60, 60)) { return; }

		// The other buttons allows changing the edit tile
		let X = 0;
		let Y = 0;
		let count = 2;
		for (let Tile of ChatRoomMapViewTileList)
			if (ChatRoomMapViewEditSubMode == Tile.Type) {
				Y = 10 + 70 * (count % 13);
				X = 10 + 70 * Math.floor(count / 13);
				if (MouseIn(X, Y, 60, 60)) {
					return;
				}
				count++;
			}

		// Enter the drawing mode
		ChatRoomMapViewEditStarted = true;
		ChatRoomMapViewMouseMove();
		return;

	// In object edit mode
	} else if ((ChatRoomMapViewEditMode == "Object") && MouseIn(0, 0, 1000, 1000)) {
		if (MouseIn(10, 10, 60, 60)) { return; }
		if (MouseIn(10, 80, 60, 60)) { return; }

		// The other buttons allows changing the edit tile
		let X = 0;
		let Y = 0;
		let count = 2;
		for (let Obj of ChatRoomMapViewObjectList)
			if (ChatRoomMapViewEditSubMode == Obj.Type) {
				Y = 10 + 70 * (count % 13);
				X = 10 + 70 * Math.floor(count / 13);
				if (MouseIn(X, Y, 60, 60)) {
					return;
				}
				count++;
			}

		// Enter the drawing mode
		ChatRoomMapViewEditStarted = true;
		ChatRoomMapViewMouseMove();
		return;

	} else if ((ChatRoomMapViewEditMode === "Effect") && MouseIn(0, 0, 1000, 1000)) {
		// Check if we are clicking a menu button (Exit button)
		if (MouseIn(10, 10, 60, 60)) { return; }

		// Check if we are clicking a palette color button
		let X = 0;
		let Y = 0;
		let count = 2;
		for (let _Eff of ChatRoomMapViewEffectList) {
			Y = 10 + 70 * (count % 13);
			X = 10 + 70 * Math.floor(count / 13);
			// If clicking a palette button, stop here (don't paint the map)
			if (MouseIn(X, Y, 60, 60)) {
				return;
			}
			count++;
		}

		// If we aren't clicking a button, we are painting the map!
		ChatRoomMapViewEditStarted = true;
		ChatRoomMapViewMouseMove();
		return;

	}

}

/**
 * Mouse move event is used to draw on screen
 * @returns {void} - Nothing
 */
function ChatRoomMapViewMouseMove() {

	// Only in edit mode
	if ((CurrentScreen != "ChatRoom") || !ChatRoomMapViewIsActive()) return;
	let Backup = CommonCloneDeep(ChatRoomData.MapData);

	// In tile edit mode
	if (ChatRoomMapViewEditStarted && (ChatRoomMapViewEditMode == "Tile") && (ChatRoomMapViewEditObject != null)) {
		for (let Pos of ChatRoomMapViewEditSelection)
			ChatRoomData.MapData.Tiles = ChatRoomData.MapData.Tiles.substring(0, Pos) + String.fromCharCode(ChatRoomMapViewEditObject.ID) + ChatRoomData.MapData.Tiles.substring(Pos + 1);
		ChatRoomMapViewUpdateFlag();
	}

	// In object edit mode, make sure unique items are not duplicated
	if (ChatRoomMapViewEditStarted && (ChatRoomMapViewEditMode == "Object") && (ChatRoomMapViewEditObject != null)) {
		if ("Unique" in ChatRoomMapViewEditObject && ChatRoomMapViewEditObject.Unique === true)
			for (let Pos = 0; Pos < ChatRoomData.MapData.Objects.length; Pos++)
				if (ChatRoomData.MapData.Objects.charCodeAt(Pos) === ChatRoomMapViewEditObject.ID)
					ChatRoomData.MapData.Objects = ChatRoomData.MapData.Objects.substring(0, Pos) + String.fromCharCode(ChatRoomMapViewObjectStartID) + ChatRoomData.MapData.Objects.substring(Pos + 1);
		for (let Pos of ChatRoomMapViewEditSelection) {
			ChatRoomData.MapData.Objects = ChatRoomData.MapData.Objects.substring(0, Pos) + String.fromCharCode(ChatRoomMapViewEditObject.ID) + ChatRoomData.MapData.Objects.substring(Pos + 1);
			if ("Unique" in ChatRoomMapViewEditObject && ChatRoomMapViewEditObject.Unique === true) break;
		}
		ChatRoomMapViewUpdateFlag();
	}

	// lighting effect painting
	if (ChatRoomMapViewEditStarted && (ChatRoomMapViewEditMode === "Effect") && (ChatRoomMapViewEditObject != null)) {
		const effect = ChatRoomMapViewEffectList.find(
			(e) => e.ID === ChatRoomMapViewEditObject.ID,
		);
		let tileEffects;
		if (effect === undefined || effect.ID === ChatRoomMapViewEffectStartID) {
			// Don't store the blank effect
			tileEffects = [];
		} else {
			// Single effect per tile for now
			tileEffects = [effect];
		}
		for (let Pos of ChatRoomMapViewEditSelection) {
			ChatRoomMapManager.Map.setEffectsByIndex(Pos, tileEffects);
		}
		// Encode the changed map and write it to the global ChatRoomData.MapData.
		// This is somewhat inefficient since we don't have to actually encode the string
		// before we need to send it to the server, but it would suffice for now.
		// See ChatRoomMapManager.Map.updateGlobalMapData documentation for more details.
		ChatRoomMapManager.Map.updateGlobalMapData();
		ChatRoomMapViewUpdateFlag();
	}

	// If the map was modified, we keep the previous version as backup so we can undo the changes
	if (JSON.stringify(Backup) != JSON.stringify(ChatRoomData.MapData)) {
		if (ChatRoomMapViewEditBackup.length > 100) ChatRoomMapViewEditBackup = ChatRoomMapViewEditBackup.slice(-100);
		ChatRoomMapViewEditBackup.push(Backup);
		// Update perception map after a change
		ChatRoomMapViewCalculatePerceptionMasks();
	}
}

/**
 * Mouse up event is used to stop drawing
 * @type {MouseEventListener}
 */
function ChatRoomMapViewMouseUp() {
	if ((CurrentScreen != "ChatRoom") || !ChatRoomMapViewIsActive()) return;
	ChatRoomMapViewEditStarted = false;
}

/**
 * Mouse wheel event is used to zoom the map
 * @type {MouseWheelEventListener}
 */
function ChatRoomMapViewMouseWheel(Event) {
	if ((CurrentScreen != "ChatRoom") || !ChatRoomMapViewIsActive()) return;
	if ((MouseX <= 1000) && (Event.deltaY < 0) && (ChatRoomMapViewPerceptionRange > ChatRoomMapViewPerceptionRangeMin)) ChatRoomMapViewPerceptionRange--;
	if ((MouseX <= 1000) && (Event.deltaY > 0) && (ChatRoomMapViewPerceptionRange < ChatRoomMapViewPerceptionRangeMax)) ChatRoomMapViewPerceptionRange++;
}

/**
 * Copies the current map in the clipboard.  Called from the chat field command "mapcopy"
 * @returns {void} - Nothing
 */
function ChatRoomMapViewCopy() {
	// Make sure there's a valid map to copy first
	if ((ChatRoomData == null) || (ChatRoomData.MapData == null) || (ChatRoomData.MapData.Type == null) || (ChatRoomData.MapData.Type === "Never")) {
		ChatRoomSendLocal(TextGet("MapCopyError"));
		return;
	}

	const mapString = ChatRoomMapManager.Map.exportString();
	if (mapString === undefined) {
		ChatRoomSendLocal(TextGet("MapCopyError"));
		return;
	}

	navigator.clipboard
		.writeText(mapString)
		.then(() => ChatRoomSendLocal(TextGet("MapCopyDone")))
		.catch((e) => {
			console.error("Map copy error:", e);
			ChatRoomSendLocal(TextGet("MapCopyError"));
		});
}

/**
 * Pastes the current map Param data to load it.  Called from the chat field command "mappaste"
 * @param {string} Param - The parameter that comes with the command
 * @returns {void} - Nothing
 */
function ChatRoomMapViewPaste(Param) {
	// Validates the data first
	if (typeof Param !== "string" || Param.length === 0) {
		ChatRoomSendLocal(TextGet("MapPasteError"));
		return;
	}

	// Only admins can paste/edit the map
	if (!ChatRoomPlayerIsAdmin()) {
		ChatRoomSendLocal(TextGet("MapPasteAdmin"));
		return;
	}

	if (!ChatRoomMapManager.Map.importString(Param)) {
		ChatRoomSendLocal(TextGet("MapPasteError"));
		return;
	}

	ChatRoomMapViewUpdateFlag();
	ChatRoomMapViewCalculatePerceptionMasks();
	ChatRoomSendLocal(TextGet("MapPasteDone"));
}

/**
 * Converts the color in R [0; 255], G [0; 255], B [0; 255], A [0.0; 1.0] format
 * to an HTML color function.
 * @param {[number, number, number, number]} rgba
 * @returns {string}
 */
function RgbaArrayToHTMLColor(rgba) {
	return `rgba(${rgba[0]}, ${rgba[1]}, ${rgba[2]}, ${rgba[3]})`;
}

/**
 * @namespace
 * @description
 * # Binary-encoded map data
 * This module implements the new way of encoding the map data.
 *
 * At its core lies the concept of a BitString: a stream of tightly-packed
 * numbers with arbitrary bit width. This allows us to store data way more efficiently
 * than using plain JSONs, even if they are packed with LZString.
 *
 * # Compatibility
 * Binary encoding, while efficient, requires a very careful architectural approach to ensure
 * maximum compatibility. Notable, we must ensure that:
 *
 * - Exported map strings from any older game version *always* remain compatible
 *   with the newer game versions. Players losing their old saved maps is an unacceptable
 *   outcome; we must ensure that we recover as much data as possible from those old saves.
 * - Map data synced between the players in a map-enabled room must be readable
 *   by the clients one version older than the current one. This is to ensure
 *   that during the beta period the main branch players could join and play
 *   the rooms created by beta players. This is not as strict of a requirement
 *   as the previous point, but is still important.
 * - Exported map strings from the newer version must be usable by the players
 *   using a game one version older. This ensures that the beta players can share
 *   map strings with non-beta ones, and is the least concern among others, since
 *   beta periods are quite short and *sharing* the map string doesn't happen too often.
 *   Still, it is good to at least make some effort to allow it.
 *
 * Binary encoding makes achieving those requirements non-trivial, because
 * to decode a given BitString the game must know exactly what were the bit widths
 * of the integers encoded into it, and also their meaning. If we just change
 * the code that encodes the map data, then we would no longer able to decode the old data.
 *
 * To solve this issue, we introduce the concept of codec versions. A version
 * is a number that we write into the bit stream before the actual data, which
 * would allow the game to understand which codec was used to encode the data,
 * and call it to decode the data.
 *
 * Whenever we need to sufficiently change the encoding scheme, we copy
 * the latest codec, increase its version and make the required changes.
 * Copying and pasting the code, while usually not advised, would be a better approach
 * in this specific case. This way, we ensure that the old codecs remain "frozen"
 * in time, so no matter how old the map data is, we always have an appropriate codec
 * for it.
 *
 * One issue which may arise in the future is the change in the schemas
 * of the objects we encode. In this case, we would need an additional "migrations" layer
 * which would take the old decoded data and convert it to the one we currently require.
 *
 * Solving the issue of letting the old clients to use the data from beta versions
 * is not that straightforward, and on the most occasions we would require ad-hoc solutions.
 * For example, during the beta period we may use two fields, `Data` and `DataOld`,
 * with the former containing the data encoded with the most recent codec,
 * and the latter having the data encoded with the previous codec.
 * Of course, depending on the nature of the required changes, it may be possible
 * to make a more space-efficient solution.
 *
 * # Future work
 * Currently, we only binary-encode the map effects, to remain in the scope of the original MR.
 * We do this by storing the encoded map effects in the {@link ChatRoomData.MapData.Effects}
 * global value, while {@link ChatRoomData.MapData.Tiles} and {@link ChatRoomData.MapData.Objects}
 * remain unchanged. Thus, we don't need to change much of the existing code, which
 * continues to use those latter fields.
 *
 * In future MRs we hope to unify the encoding of tiles, objects and effects, writing them all
 * into a single BitString. This would allow us to have much greater compression and save
 * a lot of traffic.
 *
 * Later, all map data would be stored in {@link ChatRoomMapManager.Map} global value
 * instead of {@link ChatRoomData.MapData}. This is because we're no longer storing
 * the map data as simple strings which we can trivially serialize and send to the server.
 * Ideally, the outside code would use {@link ChatRoomMapManager} methods to obtain
 * the encoded map data when needed (e.g. sending it to the server, or saving the map data
 * for room recreation, or exporting the room via a room code). Failing that,
 * we can continue the approach used in the initial version of this system: having the decoded
 * map data in {@link ChatRoomMapManager.Map} and maintain the encoded representation
 * of this map in {@link ChatRoomData.MapData}.
 *
 * After that we would have an avenue for encoding additional arbitrary data within each tile
 * while retaining the compact encoding. This, then, would allow us to have any sorts of "tile settings",
 * which would be a great addition to the map rooms in the Club.
 *
 * # Mod compatibility
 * This module is a work in progress and would change significantly in the future.
 * As such, only the minimum amount of public APIs is exposed as of now. Mod authors
 * are advised to not rely on its current behavior if at all possible.
 * We expect to expose more public APIs in the future as the module matures.
 *
 * # General design choices
 * While being public, {@link ChatRoomMapManager.Map} preferably should be only
 * accessed inside this file as it is an implementation detail of this module.
 * If the outside code requires to access something in this module, it's best
 * to provide a separate function in the {@link ChatRoomMapManager} namespace,
 * or a global one.
 *
 * # Codecs general overview
 * ## Version 0
 * The initial codecs version. Only encoding map effects. Only allows for a single
 * map effect per tile (the groundwork for having multiple effects per tile is laid,
 * but the rest of the code is not ready for it).
 *
 * Effects are encoded by their IDs, similar to the original Tiles and Objects encoding.
 * A simple RLE compression is applied to the "flat" effects array, with a small twist:
 * we use larger bit width for storing run-lengths of the blank effect sequences.
 * This allows us to more efficiently encode the typical maps where the most of
 * the tiles would have blank effects.
 *
 * Additionally, we modify the effect IDs in the following way:
 * 1. First, we subtract the lowest used effect ID
 *    ({@link ChatRoomMapViewEffectStartID} in the most cases) from them, getting
 *    what we call "shifted" IDs which begin from zero.
 * 2. Next, we create the list of all used "shifted" IDs and write them in the stream.
 *    The usage of "shifted" IDs ensures this array is very compact no matter what
 *    our {@link ChatRoomMapViewEffectStartID} is.
 * 3. Finally, when writing the effect IDs, we instead use the indexes in the list
 *    from the previous step, and call them the "remapped" IDs.
 *
 * This allows us to write the least possible amount of data per effect ID: for example,
 * if only one effect - besides the blank - is used in a map, then each mention of that ID
 * would only require a single bit of data, no matter what the actual value of this effect is.
 *
 * This scheme results in a sufficiently efficient compression rate in practice.
 * - For maps without effects we will be sending 24 additional bytes (after base64 encoding).
 * - Maps with a few patches of effects require around 0.5-1 bits per tile (after base64 encoding).
 * - Moderately sophisticated maps with a lot of different effects require somewhere around 1.5-3 bits per tile.
 * - In the worst case scenario (a map fully filled with all possible effects without repetitions),
 *   we would require slightly above 5.3 bits per tile after base64 encoding.
 */
const ChatRoomMapManager = (function () {
	/**
	 * The class storing the game map data. Currently only stores the lighting effects.
	 */
	class MapData {
		/**
		 * @param {ChatRoomMapEffect[][]=} effects
		 */
		constructor(effects) {
			const tilesLen = ChatRoomMapViewWidth * ChatRoomMapViewHeight;
			/**
			 * @type {ChatRoomMapEffect[][]}
			 */
			this.effects = effects ?? Array.from({ length: tilesLen }, () => []);
		}

		/**
		 * Removes all effects from the map.
		 */
		removeAllEffects() {
			const len = this.effects.length;
			this.effects = Array.from({ length: len }, () => []);
		}
	}

	/**
	 * @type {Record<number, ChatRoomMapManager.EffectsCodec>}
	 */
	const MapEffectsCodecs = {
		0: (function () {
			/**
			 * @type {ChatRoomMapManager.MapEffectsCodecs_v0.ConstSettings}
			 */
			const constSettings = (function () {
				const rleBitsEmpty = 8; // up to 257 repetitions
				const rleMaxEmpty = BitStringHelper.maxUnsignedInBits(rleBitsEmpty) + 2;
				const rleBitsFilled = 4; // up to 18 repetitions
				const rleMaxFilled =
					BitStringHelper.maxUnsignedInBits(rleBitsFilled) + 2;
				return {
					rleBitsEmpty,
					rleMaxEmpty,
					rleBitsFilled,
					rleMaxFilled,
					bitLenBits: 6, // [0; 32] bits
					arrayLenInBytesBits: 2, // up to 4 bytes == 2^32 elements, which is a JS limit
				};
			})();

			/**
			 * @param {ChatRoomMapEffect[]} effectsFlat
			 * @returns {ChatRoomMapManager.MapEffectsCodecs_v0.DynamicSettings}
			 */
			function buildDynamicSettings(effectsFlat) {
				const effectIds = [...new Set(effectsFlat.map((eff) => eff.ID))].sort();
				const effectIdMin = effectIds[0] ?? 0;
				const effectIdMax = effectIds[effectIds.length - 1] ?? 0;
				const effectIdShiftedMax = effectIdMax - effectIdMin;

				/**
				 * @type {Map<number, number>}
				 */
				const effectIdShiftedToRemapId = new Map();
				/**
				 * @type {Map<number, number>}
				 */
				const remapIdToEffectIdShifted = new Map();
				for (const [remapId, effectId] of effectIds.entries()) {
					effectIdShiftedToRemapId.set(effectId - effectIdMin, remapId);
					remapIdToEffectIdShifted.set(remapId, effectId - effectIdMin);
				}
				const baseIdBits = BitStringHelper.getBitsCountForUnsigned(effectIdMin);
				const shiftedIdBits =
					BitStringHelper.getBitsCountForUnsigned(effectIdShiftedMax);
				const remappedIdBits = BitStringHelper.getBitsCountForUnsigned(
					effectIds.length - 1,
				);

				/**
				 * @type {number[]}
				 */
				const effectIdsShifted = effectIds.map(
					(effectId) => effectId - effectIdMin,
				);

				return {
					baseIdBits,
					shiftedIdBits,
					remappedIdBits,
					effectIdMin,
					effectsLength: effectsFlat.length,
					effectIdsShifted,
					effectIdShiftedToRemapId,
					remapIdToEffectIdShifted,
				};
			}

			/**
			 * Calculates the remapped effect ID from the raw, non-shifted effect ID.
			 * No error checks are done.
			 * @param {number} effectId
			 * @param {ChatRoomMapManager.MapEffectsCodecs_v0.DynamicSettings} settings
			 * @returns {number}
			 */
			function getRemappedId(effectId, settings) {
				return (
					settings.effectIdShiftedToRemapId.get(
						effectId - settings.effectIdMin,
					) ?? 0
				);
			}

			/**
			 * Calculates the full effect ID from the remapped ID.
			 * No error checks are done.
			 * @param {number} remappedId
			 * @param {ChatRoomMapManager.MapEffectsCodecs_v0.DynamicSettings} settings
			 * @returns {number}
			 */
			function getEffectId(remappedId, settings) {
				return (
					(settings.remapIdToEffectIdShifted.get(remappedId) ?? 0) +
					settings.effectIdMin
				);
			}

			/**
			 * Writes the array length {@link length}. The byte size of the length is written
			 * in the first two bits, followed by `byte size` * 8 bits of the actual length.
			 * This enables a more efficient length encoding of small arrays while preserving the ability
			 * to encode any array length JavaScript supports (up to 2^32 - 1).
			 * @param {number} length the length of an array. Must be less than 2^32.
			 * @param {BitStringWriter} writer
			 * @returns {void}
			 */
			function writeArrayLength(length, writer) {
				const lenBytes =
					Math.ceil(BitStringHelper.getBitsCountForUnsigned(length) / 8) | 0;
				const lenBits = lenBytes * 8;
				writer.writeUnsigned(lenBytes, constSettings.arrayLenInBytesBits);
				writer.writeUnsigned(length, lenBits);
			}

			/**
			 * Reads the array length written with the {@link writeArrayLength} function.
			 * @param {BitStringReader} reader
			 * @returns {number}
			 */
			function readArrayLength(reader) {
				const lenBytes = reader.readUnsigned(constSettings.arrayLenInBytesBits);
				const lenBits = lenBytes * 8;
				return reader.readUnsigned(lenBits);
			}

			/**
			 * Writes an array of unsigned integers {@link array} to the writer {@link writer}.
			 * Each element in the array *must* fit in {@link elementBits} bits.
			 * @param {number[]} array
			 * @param {number} elementBits
			 * @param {BitStringWriter} writer
			 * @returns {void}
			 */
			function writeArray(array, elementBits, writer) {
				writeArrayLength(array.length, writer);
				for (const value of array) {
					writer.writeUnsigned(value, elementBits);
				}
			}

			/**
			 * Reads an array of unsigned integers with element size {@link elementBits}
			 * from {@link reader}.
			 * @param {number} elementBits
			 * @param {BitStringReader} reader
			 * @param {number} maxLen
			 * @returns {number[]}
			 * @throws {Error} when the array is too long (> {@link maxLen}) or when
			 * there is not enough data available in {@link reader}.
			 */
			function readArray(elementBits, reader, maxLen) {
				const len = readArrayLength(reader);
				if (len > maxLen) {
					throw new Error(
						`Invalid length while decoding an array: ${len} while the maximum is ${maxLen}`,
					);
				}
				const res = [];
				for (let i = 0; i < len; i++) {
					res.push(reader.readUnsigned(elementBits));
				}
				return res;
			}

			/**
			 * @param {ChatRoomMapManager.MapEffectsCodecs_v0.DynamicSettings} settings
			 * @param {BitStringWriter} writer
			 * @returns {void}
			 */
			function writeDynamicSettings(settings, writer) {
				writer.writeUnsigned(settings.baseIdBits, constSettings.bitLenBits);
				writer.writeUnsigned(settings.shiftedIdBits, constSettings.bitLenBits);
				writer.writeUnsigned(settings.remappedIdBits, constSettings.bitLenBits);
				writer.writeUnsigned(settings.effectIdMin, settings.baseIdBits);
				writeArray(settings.effectIdsShifted, settings.shiftedIdBits, writer);
				writeArrayLength(settings.effectsLength, writer);
			}

			/**
			 * @param {BitStringReader} reader
			 * @returns {ChatRoomMapManager.MapEffectsCodecs_v0.DynamicSettings}
			 */
			function readDynamicSettings(reader) {
				const baseIdBits = reader.readUnsigned(constSettings.bitLenBits);
				const shiftedIdBits = reader.readUnsigned(constSettings.bitLenBits);
				const remappedIdBits = reader.readUnsigned(constSettings.bitLenBits);
				const effectIdMin = reader.readUnsigned(baseIdBits);
				const effectIdsShifted = readArray(shiftedIdBits, reader, ChatRoomMapViewEffectList.length);
				const effectsLength = readArrayLength(reader);
				/**
				 * @type {Map<number, number>}
				 */
				const effectIdShiftedToRemapId = new Map();
				/**
				 * @type {Map<number, number>}
				 */
				const remapIdToEffectIdShifted = new Map();
				for (const [remapId, effectIdShifted] of effectIdsShifted.entries()) {
					effectIdShiftedToRemapId.set(effectIdShifted, remapId);
					remapIdToEffectIdShifted.set(remapId, effectIdShifted);
				}
				return {
					baseIdBits,
					shiftedIdBits,
					remappedIdBits,
					effectIdMin,
					effectsLength,
					effectIdsShifted,
					effectIdShiftedToRemapId,
					remapIdToEffectIdShifted,
				};
			}

			/**
			 * Calculates the maximum length of the same effects sequence in {@link effectsFlat},
			 * starting with index {@link i}.
			 * @param {number} i
			 * @param {ChatRoomMapEffect[]} effectsFlat
			 * @returns {number} same effect sequence len, >= 1, since effectsFlat[i] is counted too.
			 */
			function getRunLength(i, effectsFlat) {
				const origEffect = effectsFlat[i];
				let idx = i + 1;
				while (
					idx < effectsFlat.length &&
					effectsFlat[idx].ID === origEffect.ID
				) {
					idx++;
				}
				return idx - i;
			}

			/**
			 * @param {number} effectId
			 * @returns {{maxRun: number, rleCountBits: number}}
			 */
			function getRleSettings(effectId) {
				if (effectId === ChatRoomMapViewEffectStartID) {
					return {
						maxRun: constSettings.rleMaxEmpty,
						rleCountBits: BitStringHelper.getBitsCountForUnsigned(
							constSettings.rleMaxEmpty,
						),
					};
				} else {
					return {
						maxRun: constSettings.rleMaxFilled,
						rleCountBits: BitStringHelper.getBitsCountForUnsigned(
							constSettings.rleMaxFilled,
						),
					};
				}
			}

			/**
			 * Writes the encoded effects from {@link effectsFlat} into the writer.
			 * NOTE: this function can only encode single effect per tile.
			 * @param {ChatRoomMapEffect[][]} effectsFlat - a flat 2D array of effects at each tile.
			 * In this version of the codec each tile must contain either 0 or 1 effect.
			 * @param {BitStringWriter} writer
			 * @returns {boolean} `true` if the write operation was successful, `false` otherwise.
			 */
			function write(effectsFlat, writer) {
				// Default to the blank effect in case of zero-elements list
				const effectsFlatSingle = effectsFlat.map(
					(x) => x[0] ?? ChatRoomMapViewEffectList[0],
				);

				const settings = buildDynamicSettings(effectsFlatSingle);
				writeDynamicSettings(settings, writer);

				let i = 0;
				while (i < effectsFlatSingle.length) {
					const curEffect = effectsFlatSingle[i];

					// 1. Write the current effect ID.
					const remappedId = getRemappedId(curEffect.ID, settings);
					writer.writeUnsigned(remappedId, settings.remappedIdBits);

					// 2. Attempt to RLE-encode the current sequence of effects,
					// if it contains at least 2 items.
					const { maxRun, rleCountBits } = getRleSettings(curEffect.ID);
					let runLen = Math.min(getRunLength(i, effectsFlatSingle), maxRun);
					if (runLen >= 2) {
						writer.writeBool(true);
						// Encoded run-len is counted from 2, since it doesn't make sense to encode 0 or 1 run lengths.
						writer.writeUnsigned(runLen - 2, rleCountBits);
						i += runLen;
					} else {
						writer.writeBool(false);
						i++;
					}
				}

				return true;
			}

			/**
			 * Reads the encoded effects from {@link reader}.
			 * Does not throw.
			 * @param {BitStringReader} reader
			 * @param {number | undefined} requiredTilesCount required amount of tiles.
			 * If not `undefined`, the function returns `undefined` if the amount of tiles encoded
			 * in the reader is different from the required amount.
			 * @returns {ChatRoomMapEffect[][] | undefined}
			 * The flat list of map effects, or `undefined` if {@link reader}
			 * contains invalid data.
			 */
			function read(reader, requiredTilesCount) {
				let readLen = 0;

				/**
				 * @type ChatRoomMapEffect[][]
				 */
				let res = [];
				/**
				 * @type {Map<number, ChatRoomMapEffect>}
				 */
				let effectsCache = new Map();

				try {
					const settings = readDynamicSettings(reader);
					if (
						requiredTilesCount !== undefined &&
						settings.effectsLength !== requiredTilesCount
					) {
						return undefined;
					}

					while (readLen < settings.effectsLength) {
						// 1. Read the current effect ID.
						const remappedId = reader.readUnsigned(settings.remappedIdBits);
						const effectId = getEffectId(remappedId, settings);

						// rww: speeding up effects lookup via a cache until we have a more
						// efficient and generic lookup for effects/tiles/objects.
						/**
						 * @type {ChatRoomMapEffect | undefined}
						 */
						let effect;
						let cachedEffect = effectsCache.get(effectId);
						if (cachedEffect !== undefined) {
							effect = cachedEffect;
						} else {
							if (effectId === ChatRoomMapViewEffectStartID) {
								effect = undefined;
							} else {
								effect = ChatRoomMapViewEffectList.find(
									(e) => e.ID === effectId,
								);
							}
							effectsCache.set(effectId, effect);
						}

						// 2. Read the encoded run-len and calculate the effective on.
						// For non-RLE encoded tile, simply set it to 1.
						const isRle = reader.readBool();
						let runLen;
						if (isRle) {
							const { maxRun: _, rleCountBits } = getRleSettings(effectId);
							runLen = reader.readUnsigned(rleCountBits) + 2; // encoded run-len is counted from 2
						} else {
							runLen = 1;
						}

						// 3. Emit the required amount of tiles.
						for (let i = 0; i < runLen; i++) {
							res.push(effect === undefined ? [] : [effect]);
						}

						readLen += runLen;
					}
				} catch (e) {
					console.warn("Attempt to decode invalid map data:", e);
					return undefined;
				}

				return res;
			}

			return {
				write,
				read,
			};
		})(),
	};

	/**
	 * @type {Record<number, ChatRoomMapManager.MapCodec<MapData>>}
	 */
	const MapDataCodecs = {
		0: (function () {
			const EFFECTS_CODEC_VERSION = 0;

			/**
			 * @param {MapData} map
			 * @param {BitStringWriter} writer
			 * @returns {boolean}
			 */
			function write(map, writer) {
				const effectsCodec = MapEffectsCodecs[EFFECTS_CODEC_VERSION];
				if (effectsCodec === undefined) {
					return false;
				}

				return effectsCodec.write(map.effects, writer);
			}

			/**
			 * @param {BitStringReader} reader
			 * @param {number | undefined} requiredTilesCount
			 * @returns {MapData | undefined}
			 */
			function read(reader, requiredTilesCount) {
				const effectsCodec = MapEffectsCodecs[EFFECTS_CODEC_VERSION];
				if (effectsCodec === undefined) {
					return undefined;
				}
				const effects = effectsCodec.read(reader, requiredTilesCount);
				return new MapData(effects);
			}

			return {
				write,
				read,
			};
		})(),
	};

	const MAP_EXPORT_VERSION_TAG = "@";
	const MAP_SYNC_VERSION_BIT_SIZE = 8;
	const MAP_SYNC_CURRENT_VERSION = 0;
	const CURRENT_EFFECTS_CODEC_VERSION = 0;

	/**
	 * Decodes the string that was generated with the `/mapcopy` command.
	 * Should support every map that was generated on any prior version.
	 * @param {string} s
	 * @returns {{LegacyMapData: ServerChatRoomMapData | undefined, MapData: MapData | undefined}} the decoded map data.
	 * Both `LegacyMapData` and `Map` fields being `undefined` indicates a decoding failure.
	 */
	function DecodeExportedMap(s) {
		const versionTagIdx = s.indexOf(MAP_EXPORT_VERSION_TAG);

		if (versionTagIdx < 0) {
			// Legacy exported map without effects.
			return decodeLegacyExportedMap(s);
		}

		if (versionTagIdx > 0) {
			// Combined exported map, both tiles/objects and effects in one string,
			// with the former encoded in the legacy way.
			return decodeCombinedExportedMap(s, versionTagIdx);
		}

		if (versionTagIdx === 0) {
			// Fully BitString-encoded map data. Currently not implemented.
			return decodeModernExportedMap(s);
		}

		console.warn("Impossible exported map string value");
		return {
			LegacyMapData: undefined,
			MapData: undefined,
		};
	}

	/**
	 * Decodes the exported map string made by clients prior to the Effects update.
	 * @param {string} s
	 * @returns {{LegacyMapData: ServerChatRoomMapData | undefined, MapData: undefined}} the decoded map data.
	 */
	function decodeLegacyExportedMap(s) {
		/**
		 * @param {unknown} type
		 * @returns {type is ChatRoomMapType}
		 */
		function isMapType(type) {
			return type === "Always" || type === "Hybrid" || type === "Never";
		}

		// Try to decompress the data
		let DecompressedData = null;
		try {
			DecompressedData = LZString.decompressFromBase64(s);
		} catch {
			DecompressedData = null;
		}

		const err = {
			LegacyMapData: undefined,
			MapData: undefined,
		};

		// If we failed to decompress
		if (DecompressedData === null) {
			return err;
		}

		// Tries to get the map data object
		/** @type {ServerChatRoomMapData} */
		let mapData = null;
		try {
			const data = JSON.parse(DecompressedData);
			if (
				!CommonIsObject(data) ||
				!("Tiles" in data) ||
				typeof data.Tiles !== "string" ||
				!("Type" in data) ||
				!isMapType(data.Type)
			) {
				return err;
			}
			mapData = /** @type {ServerChatRoomMapData} */ (data);
		} catch {
			return err;
		}

		return {
			LegacyMapData: mapData,
			MapData: undefined,
		};
	}

	/**
	 * Decodes the exported map string with both legacy and effects data.
	 * The legacy and effects parts are delimited with the version tag character (@).
	 * Due to how `LZString` library works, it doesn't read the base64-like string it
	 * consumes as the input past the end of compressed data, which means it completely
	 * ignores anything we append to the result of `LZString.compressToBase64`.
	 * Base64 alphabet doesn't contain the version tag character (@), so we won't have any
	 * 'false positives' either.
	 *
	 * This means we can just append the encoded effects and their version after the version tag,
	 * allowing the old versions to read the map data exported in new ones.
	 * @param {string} s
	 * @param {number} versionTagIdx the index of version tag character (@) in {@link s}.
	 * @returns {{LegacyMapData: ServerChatRoomMapData | undefined, MapData: MapData | undefined}} the decoded map data.
	 */
	function decodeCombinedExportedMap(s, versionTagIdx) {
		const legacyPart = s.slice(0, versionTagIdx);
		const effectsPart = s.slice(versionTagIdx);

		const legacyMap = decodeLegacyExportedMap(legacyPart);
		if (legacyMap.LegacyMapData === undefined) {
			// The legacy map data is invalid, so we don't need to bother decoding the
			// effects either. We won't get a proper map anyway.
			return legacyMap;
		}

		const modernMap = decodeModernExportedMap(effectsPart);
		return {
			LegacyMapData: legacyMap.LegacyMapData,
			MapData: modernMap.MapData,
		};
	}

	/**
	 * Decodes the base64-encoded {@link MapData}.
	 * @param {string} s the exported map string. Must start with the version tag character (@).
	 * @returns {{LegacyMapData: ServerChatRoomMapData | undefined, MapData: MapData | undefined}} the decoded map data.
	 */
	function decodeModernExportedMap(s) {
		const err = {
			LegacyMapData: undefined,
			MapData: undefined,
		};

		if (s[0] !== MAP_EXPORT_VERSION_TAG) {
			console.warn(
				"Invalid modern exported map: missing MAP_EXPORT_VERSION_TAG in the beginning.",
			);
			return err;
		}

		try {
			const reader = BitStringReader.fromBase64(s.slice(1)); // skipping @
			if (reader === undefined) {
				console.error(
					"Error decoding modern exported map; invalid encoded string",
				);
				return err;
			}
			const version = reader.readUnsigned(MAP_SYNC_VERSION_BIT_SIZE);
			const codec = MapDataCodecs[version];
			if (codec === undefined) {
				console.error(
					"Error decoding modern exported map; unknown version",
					version,
				);
				return err;
			}

			const tilesCount = ChatRoomMapViewWidth * ChatRoomMapViewHeight;
			const map = codec.read(reader, tilesCount);
			return {
				LegacyMapData: undefined,
				MapData: map,
			};
		} catch (e) {
			console.warn("Error decoding modern exported map:", e);
			return err;
		}
	}

	/**
	 * Exports the current map data into a string the player can save.
	 * Currently, the function requires both the legacy map data and the MapData instance
	 * holding the effects.
	 * @param {{LegacyMapData: ServerChatRoomMapData | undefined, MapData: MapData | undefined}} mapData
	 * @returns {string | undefined}
	 */
	function ExportMap(mapData) {
		const { LegacyMapData: legacyMap, MapData: map } = mapData;

		let legacyEncoded;
		if (legacyMap !== undefined) {
			// Remove the effects from the legacy map data. They would be encoded later to avoid
			// compressing/encoding them multiple times since they're already encoded in the ServerChatRoomMapData
			// object.
			const { Effects: _, ...legacyMapFiltered } = legacyMap;
			legacyEncoded = LZString.compressToBase64(
				JSON.stringify(legacyMapFiltered),
			);
		} else {
			legacyEncoded = "";
		}

		if (map !== undefined) {
			const codec = MapDataCodecs[MAP_SYNC_CURRENT_VERSION];
			const writer = new BitStringWriter();
			writer.writeUnsigned(
				MAP_SYNC_CURRENT_VERSION,
				MAP_SYNC_VERSION_BIT_SIZE,
			);
			if (!codec.write(map, writer)) {
				console.warn("Failed to encode MapData into the BitString");
				return undefined;
			}

			return `${legacyEncoded}${MAP_EXPORT_VERSION_TAG}${writer.toBase64()}`;
		} else {
			// No MapData, simply return the legacy encoded string
			return legacyEncoded;
		}
	}

	/**
	 * Flags indicating which parts of the current map data are dirty and
	 * need to be synchronized with the server.
	 */
	const DirtyFlags = Object.freeze({
		EFFECTS: 1 << 1,
		TILES: 1 << 2,
		OBJECTS: 1 << 3,

		/**
		 * @param {number} n
		 * @param {number} flag
		 * @return {boolean}
		 */
		hasFlag(n, flag) {
			return (n & flag) === flag;
		},

		/**
		 * @param {number} n
		 * @param {number} flag
		 * @return {number}
		 */
		setFlag(n, flag) {
			return n | flag;
		},

		/**
		 * @param {number} n
		 * @param {number} flag
		 * @return {number}
		 */
		clearFlag(n, flag) {
			return n & ~flag;
		},

		/**
		 * Returns a number with all valid dirty flags enabled.
		 * @return {number}
		 */
		all() {
			return DirtyFlags.EFFECTS | DirtyFlags.OBJECTS | DirtyFlags.TILES;
		},
	});

	/**
	 * The class holding the map data and responsible for keeping it synchronized with the outside
	 * global state, notably, ChatRoomData.MapData.
	 */
	class MapManager {
		/**
		 * @param {MapData} mapData
		 */
		constructor(mapData) {
			/**
			 * @type {MapData}
			 * @private
			 */
			this._mapData = mapData;
			/**
			 * @type {number}
			 * @private
			 */
			this._dirtyFlags = 0;
		}

		/**
		 * Get the current active effects array at a given coordinates.
		 * @param {number} x
		 * @param {number} y
		 * @returns {ChatRoomMapEffect[]}
		 */
		getEffectsByXY(x, y) {
			return this.getEffectsByIndex(ChatRoomMapViewCoordinatesToIndex(x, y));
		}

		/**
		 * Get the current active effects array at a given tile index.
		 * @param {number} tileIndex the index of a map tile, as returned by ChatRoomMapViewCoordinatesToIndex.
		 * @returns {ChatRoomMapEffect[]}
		 */
		getEffectsByIndex(tileIndex) {
			return this._mapData.effects[tileIndex];
		}

		/**
		 * Sets the list of active effects at given coordinates.
		 * @param {number} x
		 * @param {number} y
		 * @param {ChatRoomMapEffect[]} effects
		 * @returns {void}
		 */
		setEffectsByXY(x, y, effects) {
			this.markDirtyEffects();
			this.setEffectsByIndex(ChatRoomMapViewCoordinatesToIndex(x, y), effects);
		}

		/**
		 * Sets the list of active effects at a given tile index.
		 * @param {number} tileIndex
		 * @param {ChatRoomMapEffect[]} effects
		 * @returns {void}
		 */
		setEffectsByIndex(tileIndex, effects) {
			this.markDirtyEffects();
			this._mapData.effects[tileIndex] = [...effects];
		}

		/**
		 * Clears the list of active effects at given coordinates.
		 * @param {number} x
		 * @param {number} y
		 * @returns {void}
		 */
		clearEffectsByXY(x, y) {
			this.markDirtyEffects();
			this.setEffectsByXY(x, y, []);
		}

		/**
		 * Clears the list of active effects at a given tile index.
		 * @param {number} tileIndex
		 * @returns {void}
		 */
		clearEffectsByIndex(tileIndex) {
			this.markDirtyEffects();
			this.setEffectsByIndex(tileIndex, []);
		}

		/**
		 * Returns the effects list for each tile in the map, one array element per tile.
		 * Currently for efficiency does not copy the underlying array.
		 * The users must not modify the returned array directly.
		 * @return {ChatRoomMapEffect[][]}
		 */
		getAllEffects() {
			return this._mapData.effects;
		}

		/**
		 * Replaces all current effects with the parsed effects array.
		 * For efficiency does not copy the passed effects.
		 * The users must not modify the passed effects array afterward.
		 * @param {ChatRoomMapEffect[][]} effectsList
		 * @returns {void}
		 */
		replaceAllEffects(effectsList) {
			this.markDirtyEffects();
			this._mapData.effects = effectsList;
		}

		/**
		 * Removes all effects from the map.
		 * @returns {void}
		 */
		removeAllEffects() {
			this._mapData.removeAllEffects();
		}

		/**
		 * Mark a specific part of the map data as dirty, that is, changed and not yet synchronized with the server.
		 * @param {number} flag
		 * @private
		 */
		_markDirty(flag) {
			this._dirtyFlags = DirtyFlags.setFlag(this._dirtyFlags, flag);
		}

		/**
		 * Marks a specific part of the map data as clean, that is, synchronized with the server.
		 * @returns {void}
		 */
		_markClean(flag) {
			this._dirtyFlags = DirtyFlags.clearFlag(this._dirtyFlags, flag);
		}

		/**
		 * Marks the current effects data as dirty, that is, changed and not yet synchronized with the server.
		 * @returns {void}
		 */
		markDirtyEffects() {
			this._markDirty(DirtyFlags.EFFECTS);
		}

		/**
		 * Marks the current effects data as clean, that is, synchronized with the server.
		 * @returns {void}
		 */
		markCleanEffects() {
			this._markClean(DirtyFlags.EFFECTS);
		}

		/**
		 * Checks whether the current effects data is dirty, that is, whether it needs
		 * to be synchronized with the server.
		 * @returns {boolean}
		 */
		isDirtyEffects() {
			return DirtyFlags.hasFlag(this._dirtyFlags, DirtyFlags.EFFECTS);
		}

		/**
		 * Marks the current tiles data as dirty, that is, changed and not yet synchronized with the server.
		 * @returns {void}
		 */
		markDirtyTiles() {
			this._markDirty(DirtyFlags.TILES);
		}

		/**
		 * Marks the current tiles data as clean, that is, synchronized with the server.
		 * @returns {void}
		 */
		markCleanTiles() {
			this._markClean(DirtyFlags.TILES);
		}

		/**
		 * Checks whether the current tiles data is dirty, that is, whether it needs
		 * to be synchronized with the server.
		 * @returns {boolean}
		 */
		isDirtyTiles() {
			return DirtyFlags.hasFlag(this._dirtyFlags, DirtyFlags.TILES);
		}

		/**
		 * Marks the current objects data as dirty, that is, changed and not yet synchronized with the server.
		 * @returns {void}
		 */
		markDirtyObjects() {
			this._markDirty(DirtyFlags.OBJECTS);
		}

		/**
		 * Marks the current objects data as clean, that is, synchronized with the server.
		 * @returns {void}
		 */
		markCleanObjects() {
			this._markClean(DirtyFlags.OBJECTS);
		}

		/**
		 * Checks whether the current objects data is dirty, that is, whether it needs
		 * to be synchronized with the server.
		 * @returns {boolean}
		 */
		isDirtyObjects() {
			return DirtyFlags.hasFlag(this._dirtyFlags, DirtyFlags.OBJECTS);
		}

		/**
		 * Mark all data in the current map as clean.
		 * @returns {void}
		 */
		markCleanAll() {
			this._dirtyFlags = 0;
		}

		/**
		 * Exports the current map data, including the tiles/objects,
		 * as a string that could be copied and stored by the players.
		 * @returns {string | undefined} the exported string, or `undefined`
		 * if there was an error while exporting the map.
		 */
		exportString() {
			return ExportMap({
				LegacyMapData: ChatRoomData.MapData,
				MapData: this._mapData,
			});
		}

		/**
		 * Imports the map string that was exported earlier with {@link MapManager.exportString}
		 * method.
		 *
		 * This method must be as much compatible as possible, recovering as much information
		 * as possible from the exported map strings from any previous version of the game
		 * to prevent the players losing their stored maps.
		 *
		 * This method modifies the state of the current map and returns `true` in case of a successful import.
		 * If the string is malformed and cannot be parsed, the method returns `false` and doesn't modify
		 * any state.
		 * @param {string} mapString
		 * @returns {boolean} `true` if the string was successfully parsed and the current map data is updated,
		 * `false` otherwise
		 */
		importString(mapString) {
			const mapData = DecodeExportedMap(mapString);
			// No data was decoded
			if (
				mapData.LegacyMapData === undefined &&
				mapData.MapData === undefined
			) {
				return false;
			}

			if (mapData.LegacyMapData !== undefined) {
				ChatRoomData.MapData = mapData.LegacyMapData;
				this.markDirtyTiles();
				this.markDirtyObjects();
			}

			if (mapData.MapData !== undefined) {
				this._mapData = mapData.MapData;
				this.updateGlobalMapData();  // Write the modern map data to global object
				this.markDirtyEffects();
			}

			return true;
		}

		/**
		 * Encodes the current map data and updates the global {@link ChatRoomData.MapData} value.
		 * This function must be called after the map was changed and before it is sent to the server.
		 * Ideally we want to have a single function to build the encoded map data only
		 * when required, but it would require a significant API change of the outside code.
		 *
		 * For places where the synchronization happens, see {@link ChatRoomGetSettings} usages.
		 *
		 * This function is not supposed to fail; if it indicates an error by returning `false`,
		 * this means we have a bug in our code.
		 * @return {boolean} `true` if we successfully encoded the map data; `false` if
		 * there was an error and the global state remains unchanged.
		 */
		updateGlobalMapData() {
			const newEffects = this._encodeEffects();
			if (newEffects === undefined) {
				return false;
			}
			if (newEffects === ChatRoomData.MapData.Effects) {
				return true;
			}
			ChatRoomData.MapData.Effects = newEffects;
			this.markDirtyEffects(); // The effects have changed
			return true;
		}

		/**
		 * Loads the data from {@link ChatRoomData.MapData} and replaces the current map data with the one
		 * stored in it.
		 * @return {boolean} `true` if the global map data was parsed successfully. `false` if
		 * the global map data is invalid, no data is changed in this case.
		 */
		loadGlobalMapData() {
			if (ChatRoomData.MapData.Effects === undefined) {
				this.removeAllEffects();
				this.markCleanAll();
				return true;
			}
			const newEffects = this._decodeEffects(ChatRoomData.MapData.Effects);
			if (newEffects === undefined) {
				return false;
			}
			this.replaceAllEffects(newEffects);
			this.markCleanAll();
			return true;
		}

		/**
		 * @returns {string | undefined}
		 * @private
		 */
		_encodeEffects() {
			const codec = MapEffectsCodecs[CURRENT_EFFECTS_CODEC_VERSION];
			const writer = new BitStringWriter();

			writer.writeUnsigned(
				CURRENT_EFFECTS_CODEC_VERSION,
				MAP_SYNC_VERSION_BIT_SIZE,
			);
			if (!codec.write(this.getAllEffects(), writer)) {
				console.error(
					"MapManager._encodeEffects(): failed to encode map effects: write failed.",
				);
				return undefined;
			}

			return writer.toBase64();
		}

		/**
		 * @param {string | undefined} str
		 * @returns {ChatRoomMapEffect[][] | undefined}
		 * @private
		 */
		_decodeEffects(str) {
			if (str === undefined) {
				return undefined;
			}

			const reader = BitStringReader.fromBase64(str);
			if (reader === undefined) {
				console.error(
					"MapManager._decodeEffects(): failed to decode map effects: invalid encoded string",
				);
				return undefined;
			}

			try {
				const version = reader.readUnsigned(MAP_SYNC_VERSION_BIT_SIZE);
				const codec = MapEffectsCodecs[version];
				if (codec === undefined) {
					console.error(
						`MapManager._decodeEffects(): failed to decode map effects: unknown effects version ${version}`,
					);
					return undefined;
				}

				const tilesCount = ChatRoomMapViewWidth * ChatRoomMapViewHeight;
				const effects = codec.read(reader, tilesCount);
				if (effects === undefined) {
					console.error(
						`MapManager._decodeEffects(): failed to decode map effects (v. ${version}): failed to read effects.`,
					);
					return undefined;
				}
				return effects;
			} catch (e) {
				console.error(
					`MapManager._decodeEffects(): failed to decode map effects: decoding error: ${e}`,
				);
				return undefined;
			}
		}
	}

	let initialized = false;

	return {
		Map: new MapManager(new MapData()),

		/**
		 * This function should be called each time the external code updates {@link ChatRoomData.MapData}.
		 *
		 * This function decodes the updated map data and replaces
		 * the data stored in ${@link ChatRoomMapManager.Map} with the decoded map.
		 * @returns {void}
		 */
		OnMapDataUpdated() {
			ChatRoomMapManager.Map.loadGlobalMapData();
		},

		/**
		 * Initializes the map with the current global data if needed.
		 * Must be called in {@link ChatRoomMapViewActivate}.
		 * @returns {void}
		 */
		OnViewActivate() {
			if (!initialized) {
				ChatRoomMapManager.Map.loadGlobalMapData();
				initialized = true;
			}
		},
	};
})();

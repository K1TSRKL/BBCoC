// @ts-strict-ignore
/**
 * This file lists contains Kinky Dungeon defines for things
 * that are unavailable when running inside BC.
 */

declare function GetHardpointLoc(C: Character, i: number, dont: number, know: number, location: string);
declare function KDExecuteMods(): void;
declare function getFileInput(): void;
declare function KDDrawMods(): void;
declare var KDModsLoaded: boolean;
declare function AppearanceCleanup(C: Character): void;
declare function RefreshTempPoses(C: Character, smth: boolean): void;
declare function KDGetPoseOfType(C: Character, group: string): string;

declare var KDModelDresses: Record<string,KinkyDungeonDress>;

declare var ModelDefs: any[];
declare var MODELWIDTH: number;
declare var MODELHEIGHT: number;

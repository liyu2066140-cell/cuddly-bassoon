// ============ 数值表（对应策划案 v1.0）============
export const CFG = {
  farmer:  { hp:60,  atk:3,  as:1.0, rng:24,  spd:60, pop:1 },
  archer:  { hp:100, atk:10, as:0.8, rng:150, spd:70, pop:1 },
  hero:    { hp:500, atk:25, as:0.8, rng:30,  spd:90, pop:0 },
  wolf:    { hp:80,  atk:5,  as:1.0, rng:26,  spd:80 },
  cultist: { hp:90,  atk:8,  as:1.0, rng:26,  spd:55 },
  cultist_elite: { hp:252, atk:12, as:1.2, rng:26, spd:45 },
  tower:   { hp:800, atk:15, as:1.2, rng:180 },
  wall:    { hp:900 },
  cost: { farmer:{food:50}, house:{wood:80}, barracks:{wood:150}, archer:{wood:45,gold:40}, tower:{stone:150}, wall:{stone:30} },
  buildTime: { farmer:6, house:10, barracks:15, archer:9, tower:20, wall:4 },
  gatherTrip: 4, gatherAmt: 12,
  whirlR: 100, whirlDmg: 120, whirlCD: 12,
};

export const W=960, H=640;

export const WW=1536, WH=1024, GS=64, GW=24, GH=16;

export const RIVER_X=14, BRIDGE_ROWS=[7,8];

export const MOUNTAINS=[[16,3],[17,3],[16,4],[17,4],[16,11],[17,11],[16,12],[17,12],[4,12],[5,12],[4,13],[3,2],[4,2]];

// 全局状态仓（所有可变状态集中管理）
export const G = {
  res: { wood: 0, food: 0, stone: 0, gold: 0 }, popCap: 10,
  units: [], buildings: [], nodes: [], enemies: [], buildQ: [], projs: [], floats: [],
  slashFx: [], parts: [], sparkles: [], moveMarks: [],
  selList: [], heroCd: 0, mouse: { x: 0, y: 0 }, killed: 0, t0: 0,
  gameOver: false, winFlag: false,
  level: 1, waveIdx: 0, waveT: 0, rescueT: 0, heroRevT: 0,
  selectedQ: null, placing: null, shakeT: 0, shakeAmp: 0,
  cam: { x: 0, y: 0 }, keys: {}, grid: [], roadSet: new Set(),
  settings: { sound: true, floats: true, bars: 'all', tutor: true, speed: 1 },
  lastRes: {}, tutorStep: 1, tutorHold: 0,
};

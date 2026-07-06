const STIMULATION = Object.freeze({ LOW: 'low', MEDIUM: 'medium', HIGH: 'high' });

const CREAM_BACKGROUND = ['#FFF9E6', '#FFEFD3', '#FFF4DD'];

export const MODE_CATALOG = Object.freeze([
  {
    id: 1,
    name: '慢悠悠毛线球',
    targetKind: 'yarn',
    toyLabel: '毛线球',
    stimulation: STIMULATION.LOW,
    targetCount: 2,
    palette: ['#FFC878', '#FFDCA8', '#F8CFA1', '#FFF1C8'],
    accent: '#E69A54',
    background: CREAM_BACKGROUND,
    motion: { baseSpeed: 42, turnEveryMs: 2600, pauseChance: 0.1, drift: 0.48 },
    sound: { frequency: 360, type: 'triangle' },
  },
  {
    id: 2,
    name: '布艺小老鼠',
    targetKind: 'mouse',
    toyLabel: '小老鼠',
    stimulation: STIMULATION.MEDIUM,
    targetCount: 2,
    palette: ['#F8D7C8', '#F2C7B7', '#FFE5D7', '#F7E6D1'],
    accent: '#B9856A',
    background: CREAM_BACKGROUND,
    motion: { baseSpeed: 50, turnEveryMs: 2300, pauseChance: 0.08, drift: 0.54 },
    sound: { frequency: 420, type: 'sine' },
  },
  {
    id: 3,
    name: '绒布小鱼',
    targetKind: 'fish',
    toyLabel: '小鱼',
    stimulation: STIMULATION.MEDIUM,
    targetCount: 2,
    palette: ['#BFE9D5', '#C7F0E8', '#BFDFF4', '#FFE1A8'],
    accent: '#75B99F',
    background: CREAM_BACKGROUND,
    motion: { baseSpeed: 48, turnEveryMs: 2500, pauseChance: 0.07, drift: 0.52 },
    sound: { frequency: 390, type: 'sine' },
  },
  {
    id: 4,
    name: '羽毛逗猫棒',
    targetKind: 'feather',
    toyLabel: '羽毛绒球',
    stimulation: STIMULATION.LOW,
    targetCount: 1,
    palette: ['#FFE7F0', '#F8CFE2', '#FFF4C9', '#D6F4D8'],
    accent: '#E8A9BE',
    background: CREAM_BACKGROUND,
    motion: { baseSpeed: 45, turnEveryMs: 2700, pauseChance: 0.12, drift: 0.45 },
    sound: { frequency: 330, type: 'triangle' },
  },
  {
    id: 5,
    name: '薄荷绒球铃铛',
    targetKind: 'pom',
    toyLabel: '绒球',
    stimulation: STIMULATION.MEDIUM,
    targetCount: 2,
    palette: ['#D5F4D2', '#CFEFE6', '#FFF2BF', '#FFD3AA'],
    accent: '#92CFAE',
    background: CREAM_BACKGROUND,
    motion: { baseSpeed: 46, turnEveryMs: 2400, pauseChance: 0.09, drift: 0.5 },
    sound: { frequency: 510, type: 'sine' },
  },
  {
    id: 6,
    name: '奶白小云朵',
    targetKind: 'cloud',
    toyLabel: '软云朵',
    stimulation: STIMULATION.LOW,
    targetCount: 3,
    palette: ['#FFF5D5', '#FFFFFF', '#FFE8BD', '#FFE0CB'],
    accent: '#EBC48A',
    background: CREAM_BACKGROUND,
    motion: { baseSpeed: 38, turnEveryMs: 3000, pauseChance: 0.14, drift: 0.38 },
    sound: { frequency: 300, type: 'triangle' },
  },
]);

export { STIMULATION };

export function getModeById(id) {
  return MODE_CATALOG.find((mode) => mode.id === Number(id)) || MODE_CATALOG[0];
}

export function modesByStimulation(strategy) {
  if (strategy === 'calmOnly') return MODE_CATALOG.filter((mode) => mode.stimulation === STIMULATION.LOW);
  if (strategy === 'highStimShort') return MODE_CATALOG.filter((mode) => mode.stimulation === STIMULATION.MEDIUM);
  return MODE_CATALOG;
}

import { existsSync, readFileSync } from 'node:fs';

const required = [
  'index.html',
  'src/main.js',
  'src/core/GameMain.js',
  'src/core/modeCatalog.js',
  'src/gameplay/AnimalSpawner.js',
  'src/gameplay/TouchCollider.js',
  'src/services/AdManager.js',
  'src/services/AuthService.js',
  'src/data/GameData.js',
];

const missing = required.filter((path) => !existsSync(path));
if (missing.length) {
  console.error('Missing required files:', missing.join(', '));
  process.exit(1);
}
const indexHtml = readFileSync('index.html', 'utf8');
const css = readFileSync('src/styles.css', 'utf8');
const requiredMarkup = [
  '<canvas id="gameCanvas"',
  '<script type="module" src="./src/main.js"',
  'id="homePage"',
  '开启逗猫',
  'id="pausePanel"',
  '继续玩耍',
  'id="summaryPage"',
  '本次触碰次数',
  'id="settingsPanel"',
  '玩具移动快慢',
  '背景音效音量',
  'id="historyPage"',
  'id="restPrompt"',
  '分数',
  '触碰次数',
  '连击',
  '帧率',
  '下一关',
];
const missingMarkup = requiredMarkup.filter((marker) => !indexHtml.includes(marker));
if (missingMarkup.length) {
  console.error('Missing required markup:', missingMarkup.join(', '));
  process.exit(1);
}
if (!css.includes('#fff9e6') && !css.includes('#FFF9E6')) {
  console.error('Missing warm cream background token.');
  process.exit(1);
}
console.log('Smoke check passed. Soft cat game pages and Chinese markers exist.');

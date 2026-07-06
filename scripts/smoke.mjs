import { existsSync, readFileSync } from 'node:fs';

const required = [
  'index.html',
  'src/main.js',
  'src/core/GameMain.js',
  'src/core/modeCatalog.js',
  'src/gameplay/AnimalSpawner.js',
  'src/services/AdManager.js',
  'src/data/GameData.js',
];

const missing = required.filter((path) => !existsSync(path));
if (missing.length) {
  console.error('Missing required files:', missing.join(', '));
  process.exit(1);
}
const indexHtml = readFileSync('index.html', 'utf8');
const requiredMarkup = [
  '<canvas id="gameCanvas"',
  '<script type="module" src="./src/main.js"',
  'id="settingsPanel"',
  'id="restPrompt"',
];
const missingMarkup = requiredMarkup.filter((marker) => !indexHtml.includes(marker));
if (missingMarkup.length) {
  console.error('Missing required markup:', missingMarkup.join(', '));
  process.exit(1);
}
console.log('Smoke check passed. Required game files and markup exist.');

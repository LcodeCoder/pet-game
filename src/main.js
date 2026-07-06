import { GameMain } from './core/GameMain.js';

window.addEventListener('DOMContentLoaded', async () => {
  const canvas = document.getElementById('gameCanvas');
  const game = new GameMain({ canvas });
  await game.init();
  window.__rongrongGame = game;
});

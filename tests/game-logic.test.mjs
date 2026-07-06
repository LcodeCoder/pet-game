import test from 'node:test';
import assert from 'node:assert/strict';

import { MODE_CATALOG } from '../src/core/modeCatalog.js';
import { RotationDirector } from '../src/core/RotationDirector.js';
import { sanitizeSettings, sanitizeSession, summarizeHistory } from '../src/data/GameData.js';
import { AttractionDirector } from '../src/gameplay/AttractionDirector.js';
import { CAT_PAW_HIT_MULTIPLIER, TouchCollider } from '../src/gameplay/TouchCollider.js';
import { AdManager } from '../src/services/AdManager.js';
import { AuthService } from '../src/services/AuthService.js';


test('mode catalog is soft plush toy focused', () => {
  assert.ok(MODE_CATALOG.length >= 6);
  assert.equal(new Set(MODE_CATALOG.map((mode) => mode.id)).size, MODE_CATALOG.length);
  assert.ok(MODE_CATALOG.every((mode) => ['yarn', 'mouse', 'fish', 'feather', 'pom', 'cloud'].includes(mode.targetKind)));
});

test('rotation director avoids current and recent modes when possible', () => {
  const rotation = new RotationDirector({ recentModes: [1, 2, 3], preferences: {} });
  for (let index = 0; index < 20; index += 1) {
    const next = rotation.chooseNextMode({ rotationStrategy: 'auto', stimulation: 'standard' }, 1);
    assert.notEqual(next.id, 1);
    assert.ok(![2, 3].includes(next.id));
  }
});

test('sanitizeSettings keeps only two visible setting controls and safe defaults', () => {
  const settings = sanitizeSettings({
    speedLevel: 99,
    targetSize: 'giant',
    stimulation: 'chaos',
    soundLevel: 'loud',
    rotationStrategy: 'spam',
    muted: 1,
  });
  assert.deepEqual(settings, {
    speedLevel: 2,
    targetSize: 'large',
    stimulation: 'standard',
    soundLevel: 'soft',
    rotationStrategy: 'auto',
    muted: true,
  });
});

test('attraction director records hits and merges preference score', () => {
  const director = new AttractionDirector();
  director.resetForMode({ id: 2 });
  const stats = director.recordHit({ radius: 40 }, performance.now());
  assert.equal(stats.hits, 1);
  assert.ok(stats.score > 0);
  const preferences = director.mergePreference(2, director.metrics());
  assert.equal(preferences['2'].plays, 1);
  assert.ok(preferences['2'].score > 0);
});

test('touch hit test uses 2x expanded cat-paw radius', () => {
  assert.equal(CAT_PAW_HIT_MULTIPLIER, 2);
  const target = { x: 100, y: 100, radius: 20, visible: true, hitCooldownMs: 0 };
  assert.equal(TouchCollider.hitTest({ x: 140, y: 100 }, [target]), target);
  assert.equal(TouchCollider.hitTest({ x: 141, y: 100 }, [target]), undefined);
});

test('history sessions sanitize and summarize play records', () => {
  const first = sanitizeSession({ touches: 8, score: 120, durationMs: 65000, endedAt: '2026-07-06T00:00:00.000Z' });
  const second = sanitizeSession({ touchCount: 3, score: 50, durationMs: 35000 });
  assert.equal(first.touches, 8);
  assert.equal(second.touches, 3);
  assert.deepEqual(summarizeHistory([first, second]), { bestTouches: 8, totalDurationMs: 100000, rounds: 2 });
});

test('ad and auth placeholders never block core play', async () => {
  const ads = new AdManager();
  assert.deepEqual(await ads.preload(), { rewarded: false, interstitial: false, banner: false });
  assert.equal((await ads.showRewardedVideo('test')).shown, false);
  assert.equal((await ads.maybeShowInterstitial('test')).shown, false);
  const auth = new AuthService();
  assert.deepEqual(await auth.loginMock(), { ok: true, mock: true, provider: 'douyin', nickname: '小猫游客' });
});

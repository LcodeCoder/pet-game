# 绒绒乐园

A runnable cat-first mini-game prototype for the `pet-game` repository.

This pass focuses on getting the game playable locally first. The Douyin `tt` SDK and Cocos Creator scene export are intentionally left as TODO integration points so the core gameplay can be tested immediately.

## Run locally

```bash
npm run dev
```

Then open:

```text
http://localhost:5173
```

## Validate

```bash
npm test
npm run smoke
```

## Implemented now

- Full-screen responsive HTML5 Canvas game.
- High-contrast moving targets designed for cat attention.
- 8 representative modes: laser dot, tiny bug, pond fish, feather drift, mouse holes, edge feather sweep, roach escape, and window shadows.
- Anti-repeat mode rotation with preference weighting.
- Pointer/touch input with expanded cat-paw hit area.
- Hit feedback rings and soft procedural WebAudio cues.
- Settings for speed, target size, stimulation level, sound level, mute, and rotation strategy.
- Local persistence via `localStorage`.
- Rest/calm recommendation logic after long play.
- No external dependencies.

## Controls

- Click/touch moving targets to score.
- `Next` switches mode immediately.
- `Settings` opens the settings panel.
- Long-press empty gameplay space for 2 seconds to open settings.

## Douyin SDK TODO

Integration placeholders are already isolated in:

- `src/services/AdManager.js`
- `src/services/StorageService.js`

Later work should replace local placeholders with:

- `tt.createRewardedVideoAd`
- `tt.createInterstitialAd`
- `tt.createBannerAd`
- `tt.getStorage`
- `tt.setStorage`

Core gameplay must remain free and playable even if ads fail to load.

## Cocos Creator TODO

The current version is a browser implementation to quickly validate gameplay. Future Cocos Creator 3.8 work can port the same module boundaries:

- `GameMain`
- `RotationDirector`
- `AnimalSpawner`
- `TouchCollider`
- `AttractionDirector`
- `GameData`
- `AdManager`
- `AudioManager`


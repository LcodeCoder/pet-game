# Frontend Quality Guidelines

## Product-Specific Quality Bar

The game is designed for real cats first, not only for human viewers. Every frontend change should preserve the requirements from `task`:

- high-contrast targets with clear edges;
- red, yellow, light-blue, and black silhouette target language;
- low-saturation backgrounds with minimal occlusion and little text;
- randomized movement with pauses, acceleration, direction changes, fake-outs, and brief disappearance;
- soft audio and no harsh/stinging sounds;
- no excessive flashing or visually overwhelming effects;
- automatic rest/calm recommendations after long high-stimulation play.

## Visual and Interaction Checks

- Landscape 1280x720 design works on common phone and tablet aspect ratios.
- Safe-area/capsule/notch regions do not hide controls or gameplay targets.
- Target hit area is about 1.5x visible size for cat paws.
- Multi-touch works and does not crash when several paws touch at once.
- Settings opens only through intentional long-press on empty area.
- Exit requires confirmation to avoid accidental cat-triggered exits.

## Performance Checks

- Keep target movement smooth on low-end Android devices.
- Avoid per-frame allocations in movement/touch paths.
- Pool or recycle targets and feedback effects.
- Preload active-mode sounds and particle effects.
- Validate package constraints: main package <=4MB; total package <=20MB.

## Ads and Compliance Checks

- Basic gameplay is free and not locked behind ads.
- Rewarded ads only grant optional unlocks/enhancements after completed view.
- Interstitials appear only during mode switching, at low probability, and never too frequently.
- Ads provide close controls according to Douyin requirements.
- Avoid prohibited monetization/content terms such as cash, withdrawals, red packets, recharge, or paid in-app purchase.

## Testing Expectations

- Unit-test pure functions for mode rotation, anti-repeat, settings validation, movement parameter generation, and preference scoring.
- Use Cocos Creator 3.8/Jest where available for script tests.
- Test manually in Douyin developer tools for platform APIs and ads.
- Test on real devices across low/mid/high Android and iOS where available.
- Include cat-behavior manual checks when possible: attraction, no-touch response, rest recommendation, and sound comfort.


## Browser Prototype Smoke Validation

For the HTML5 runnable prototype, smoke validation should prove more than file existence. Check that `index.html` still wires the minimum playable shell:

- `#gameCanvas` exists for the canvas renderer.
- `src/main.js` is loaded as a module.
- `#settingsPanel` exists for persisted settings control.
- `#restPrompt` exists for calm/rest recommendations.

This prevents accidental markup regressions where pure logic tests pass but the browser cannot start the playable loop.

## Done Criteria for Frontend Work

- [ ] The change follows component boundaries.
- [ ] Touch, visual, and audio feedback are responsive and safe.
- [ ] Randomness avoids mechanical repeated loops.
- [ ] Settings and persistence are validated.
- [ ] Package/performance impact is acceptable.
- [ ] Douyin compliance constraints are preserved.


## Soft-Cat Rebuild Acceptance Gate

For any change to the cat-facing browser prototype, verify these concrete points before commit:

- Visual shell uses warm cream background (`#FFF9E6` family), translucent cream cards, warm-brown text, and no large black/dark-gray panels.
- All visible gameplay UI strings are Simplified Chinese; no `Start Playing`, `Next`, `Settings`, `Score`, `Hits`, `Combo`, `FPS`, or debug wording remains in the shell.
- Main pages exist: `#homePage`, `#pausePanel`, `#summaryPage`, `#settingsPanel`, `#historyPage`, and `#restPrompt`.
- Toy targets are soft plush procedural drawings, not black silhouettes or hard-edged geometric placeholders.
- Movement remains slow and smooth; no strobe, rapid vanish, or high-speed dash behavior is added.
- Audio uses low-volume rustle/bell-like cues only and is unlocked from user interaction.
- Run `npm test`, `npm run smoke`, JavaScript syntax checks for edited modules, an encoding/mojibake check, and an HTTP preview marker check.

# Component Guidelines

## Component Boundaries

Use Cocos Creator TypeScript components for scene-attached behavior, and keep each component's responsibility narrow.

Intended components from `task`:

- `GameMain.ts`: top-level game controller, mode switching, global timers, rest timers, recommendation entry points.
- `AnimalSpawner.ts`: target creation, recycling, movement, and target-level feedback.
- `RotationDirector.ts`: mode rotation, recent-three history, smart rotation challenge, stimulation categories.
- `TouchCollider.ts`: enlarged collision area, multi-touch handling, touch feedback latency optimization.
- `AttractionDirector.ts`: random events, dynamic difficulty, anti-repeat, attention wake-up, anti-boredom.
- `SettingPanel.ts`: long-press settings panel, defaults, save, exit confirmation.
- `ScreenAdapter.ts`: landscape/fullscreen resolution adaptation.

## Lifecycle Rules

- Use Cocos lifecycle methods (`onLoad`, `onEnable`, `start`, `update`, `onDisable`, `onDestroy`) consistently.
- Register input/listeners in `onEnable` and remove them in `onDisable`/`onDestroy`.
- Avoid expensive setup in touch callbacks; preload before mode start.
- Keep `update()` work small and deterministic. Movement and timers are fine; storage, ad calls, and heavy allocation are not.

## Gameplay Target Rules

Targets must follow the cat-attraction requirements:

- high contrast and clear edges;
- adjustable size;
- random pauses, acceleration, direction changes, fake-outs, and brief disappearance;
- no mechanical uniform looping;
- at least two stimulation sources per round, but no excessive flashing, harsh audio, or visual clutter.

Example movement interface:

```ts
export interface TargetMovementParams {
  speedLevel: 1 | 2 | 3;
  canPause: boolean;
  canFakeOut: boolean;
  pathKind: 'bezier' | 'edgeRun' | 'crawl' | 'float' | 'shadow';
}
```

## Touch Rules

- Enable multi-touch for cat paw interaction.
- Expand hit areas to about 1.5x the visible target size.
- Keep feedback immediate: visual response and preloaded soft sound should happen within the latency budget.
- Long-press settings must only trigger on empty/background areas to avoid cat mis-touches.

## Anti-Patterns

- A single giant `GameMain` that owns target spawning, ads, storage, audio, and UI details.
- Direct `tt` storage/ad calls inside Cocos components.
- Repeating mode logic by copy-pasting 30 component classes with only constants changed.
- Fast strobe effects or loud/harsh feedback sounds.
- Creating/destroying many nodes on every touch instead of pooling/recycling targets and feedback.

## Current Component Contracts

### `GameMain`

Owns the game lifecycle and cross-module orchestration.

Required constructor shape in the browser prototype:

```js
new GameMain({ canvas, documentRef = document, windowRef = window })
```

Responsibilities:

- load settings/preferences through `GameData`;
- choose modes through `RotationDirector`;
- delegate target movement/rendering to `AnimalSpawner`;
- delegate hit detection to `TouchCollider`;
- delegate HUD mutations to `Hud`;
- keep ad/storage/audio behind services.

### `AnimalSpawner`

Owns procedural target state and canvas drawing. It must expose:

```js
reset(mode, settings)
update(deltaMs, settings)
draw(ctx, timeMs)
hitTarget(target, point)
```

### `TouchCollider`

Owns pointer event normalization and cat-paw hit detection. `hitTest(point, targets)` uses an expanded radius of `target.radius * 1.5`.

### Wrong vs Correct

Wrong: component directly writes localStorage or later `tt` storage from a touch event.

Correct: component reports a hit to `GameMain`, which updates metrics and persists aggregate preference data through `GameData`.



## Browser Soft-Cat UI and Touch Contracts

### Scope / Trigger
The browser prototype is now the source-of-truth for the soft-cat UI before a Cocos port. Component boundaries must keep page state, canvas toys, touch collision, audio, storage, and auth placeholders separate.

### Signatures
```js
Hud.bindHandlers({
  onStart, onPlayAgain, onNextMode, onOpenSettings, onCloseSettings,
  onSaveSettings, onOpenHistory, onCloseHistory, onPause, onResume,
  onBackHome, onSummaryHome, onGoHome, onDismissRest, onLoginMock,
})

TouchCollider.hitTest(point, targets) // uses CAT_PAW_HIT_MULTIPLIER === 2
AnimalSpawner.reset(mode, settings)
AnimalSpawner.update(deltaMs, settings)
AnimalSpawner.draw(ctx, timeMs)
```

### Contracts
- `Hud` owns DOM lookup, Chinese label updates, overlays, summary rendering, and history rendering only.
- `GameMain` owns the state machine: `home`, `playing`, `paused`, `summary`; it must enable touch only while playing.
- `AnimalSpawner` draws procedural plush toys only: yarn ball, fabric mouse, plush fish, feather pom, pom ball, or cloud-like soft toy. Do not reintroduce black silhouette or sharp geometry targets.
- `TouchCollider` must support multiple pointer IDs and use a 2x visual-radius hit area for cat paws.
- Settings and auth services stay outside canvas/gameplay components.

### Validation & Error Matrix
| Case | Expected behavior |
|---|---|
| Pointer move from a real touch pointer | Accepted as an active cat-paw swipe. |
| Mouse move with no pressed button | Ignored to avoid accidental desktop scoring. |
| Target is hidden or on hit cooldown | Not scored. |
| Pause panel opens | Animation loop stops, touch disables, current frame remains visible. |
| Resume | Touch and loop restart without resetting score. |

### Good / Base / Bad Cases
- Good: giant rounded controls have enlarged CSS hit areas while staying visually compact in corners.
- Base: right-bottom HUD remains translucent and low-priority.
- Bad: adding large always-on menus or dark overlays over the central play area.

### Tests Required
- Unit test `CAT_PAW_HIT_MULTIPLIER === 2` and boundary hit distance.
- Unit/smoke tests assert all page IDs and Chinese markers exist.
- Manual preview must verify canvas does not freeze after resize/start/pause/resume.

### Wrong vs Correct
Wrong: `distance <= target.radius * 1.5` and single-pointer-only handling.

Correct: `distance <= target.radius * 2` with pointer ID tracking and passive-disabled pointer listeners.

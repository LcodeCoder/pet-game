# State Management Guidelines

## State Categories

Keep state split by lifetime and owner.

| State | Owner | Persistence |
|-------|-------|-------------|
| Current mode, timers, active target nodes | `GameMain`, `AnimalSpawner`, `RotationDirector` | Runtime only |
| Recent mode history and anti-repeat window | `RotationDirector` + `GameData` | Persist recent IDs if needed |
| Settings: speed, target size, stimulation, sound, rotation strategy, mute | `SettingPanel` + `GameData` | `tt.setStorage` |
| Cat type and preference scores | `PetProfile` / `AttractionDirector` | `tt.setStorage` |
| Ad readiness/cooldowns | `AdManager` | Runtime; persisted only if product later requires |
| Resource cache | `ResourceManager` | Runtime only |

## Data Flow

- UI changes settings through `SettingPanel`, which validates and saves through `GameData`.
- Gameplay reads validated settings from an in-memory settings object, not from storage on every frame.
- `AttractionDirector` records reaction metrics and sends aggregated session results to `PetProfile`/`GameData`.
- `RotationDirector` chooses the next mode from mode metadata, recent history, stimulation strategy, and preference scores.
- Ads may unlock optional enhancements, but basic gameplay remains free.

## Mode Rotation Rules

The requirements define these invariants:

- Avoid consecutive repeats of the same play mode.
- Track at least the last three mode IDs.
- Change routes, spawn points, speed rhythm, background light motion, and ambient sound when a mode is repeated later.
- High-stimulation modes must be short-session and should lead to calm/rest recommendations after continuous play.

Represent modes with typed metadata rather than scattered literals.

```ts
export interface ModeConfig {
  id: ModeId;
  name: string;
  category: 'insect' | 'aquatic' | 'feather' | 'shadow' | 'smartRotation' | 'calm';
  stimulation: 'low' | 'medium' | 'high' | 'smart';
  defaultUnlocked: boolean;
}
```

## Persistence Rules

- Load settings once at startup and keep an in-memory copy.
- Save settings after explicit user changes, not continuously during gameplay.
- Aggregate reaction data by mode/session before saving.
- Use defaults when storage is missing or invalid.

## Anti-Patterns

- A single global mutable object imported everywhere.
- Reading `tt.getStorage` inside `update()` or raw touch handlers.
- Letting ad state decide core mode availability beyond optional enhancements.
- Mixing UI panel state with gameplay target state.

## Current Browser Prototype State Contract

### Settings Signature

```js
{
  speedLevel: 1 | 2 | 3,
  targetSize: 'small' | 'medium' | 'large',
  stimulation: 'calm' | 'standard' | 'active',
  soundLevel: 'off' | 'soft' | 'standard' | 'active',
  rotationStrategy: 'auto' | 'calmOnly' | 'highStimShort' | 'mixed',
  muted: boolean
}
```

### Validation & Error Matrix

| Condition | Behavior |
|---|---|
| Missing settings | Use `DEFAULT_SETTINGS` |
| Invalid numeric speed | Reset to `2` |
| Invalid enum field | Reset that field to default |
| Storage unavailable | Use in-memory fallback and keep the session playable |
| No-touch for 90 seconds | Increase target size, lower stimulation |
| Continuous play exceeds rest threshold | Show rest prompt and bias toward calm stimulation |

### Tests Required

- `sanitizeSettings` rejects invalid persisted values.
- Mode rotation avoids the current and recent modes when possible.
- Preference scoring records hits and merges per-mode score.



## Browser Soft-Cat Page State and History Contracts

### Scope / Trigger
The HTML5 runnable prototype now has a cat-facing full-page flow, not only a single canvas demo. Future browser/Cocos ports must preserve the same minimal state model and persisted session-history contract.

### Signatures
```js
sanitizeSettings(input?: object): {
  speedLevel: 1 | 2 | 3,
  targetSize: 'small' | 'medium' | 'large',
  stimulation: 'calm' | 'standard' | 'active',
  soundLevel: 'off' | 'soft' | 'standard',
  rotationStrategy: 'auto' | 'calmOnly' | 'highStimShort' | 'mixed',
  muted: boolean,
}

sanitizeSession(input?: object): {
  touches: number,
  score: number,
  durationMs: number,
  endedAt: string,
}

summarizeHistory(history?: object[]): {
  bestTouches: number,
  totalDurationMs: number,
  rounds: number,
}

GameData.loadHistory(): Promise<Session[]>
GameData.addSession(session: object): Promise<Session[]>
GameData.historySummary(): Promise<HistorySummary>
```

### Contracts
- Visible settings UI exposes only `speedLevel` and `soundLevel`; hidden/backward-compatible fields are sanitized but not shown as extra debug controls.
- `history` storage value is an array of recent sessions, newest first, capped at 30 entries.
- A session is saved when a playing/paused round ends; home/history navigation must not duplicate-save an already saved session.
- `summaryPage` displays current round touches plus history-derived best touches and cumulative duration.
- `AuthService.loginMock()` is a non-blocking Douyin placeholder and must not gate gameplay.

### Validation & Error Matrix
| Input / event | Expected behavior |
|---|---|
| Invalid `speedLevel`, `soundLevel`, or legacy fields | Fall back to `DEFAULT_SETTINGS`; never throw during boot. |
| Missing or malformed history storage | Treat as empty history. |
| Session with negative/non-numeric values | Clamp `touches`, `score`, and `durationMs` to non-negative integers. |
| End round called twice | Return summary from stored history without adding a duplicate record. |
| Mock login failure/future SDK unavailable | Gameplay still starts and continues. |

### Good / Base / Bad Cases
- Good: pause -> return from pause -> save one session -> show summary -> return home.
- Base: open history before any play -> empty-state copy is shown.
- Bad: adding every settings/debug field to UI; this violates the two-control cat-owner settings contract.

### Tests Required
- `sanitizeSettings` rejects invalid persisted values and preserves safe defaults.
- `sanitizeSession` and `summarizeHistory` assert touches, score, duration, best touch, and total duration behavior.
- Smoke test asserts `homePage`, `pausePanel`, `summaryPage`, `settingsPanel`, and `historyPage` markers exist with Chinese labels.
- Placeholder auth test asserts `loginMock()` resolves and does not block core play.

### Wrong vs Correct
Wrong: store summary-only counters directly from the HUD and derive history UI from DOM text.

Correct: save normalized session objects through `GameData.addSession()` and render summary/history from sanitized persisted data.

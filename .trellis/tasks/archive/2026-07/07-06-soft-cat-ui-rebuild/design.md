# Design: Soft Cat UI Rebuild

## Product Direction
??????????? Demo ???????????????????????????????????????????????????????

## Visual System
- Background: cream gradient from `#FFF9E6` to warm peach/vanilla tints.
- Surfaces: semi-transparent cream cards, 24-30px radius, subtle warm border.
- Text: warm brown, Chinese labels, rounded system font stack.
- Buttons: cream-orange gradients, large pill/radius, soft plush border.
- Shadows: light warm ambient shadows only; no heavy black shadows.
- Patterns: paw/yarn pseudo-elements or CSS radial patterns at < 10% opacity.

## Screen Model
Use a single-page state machine in `GameMain`/`Hud`:
- `home`: landing/home overlay with cat illustration and ??????.
- `playing`: canvas active, score card bottom-right, actions top-right.
- `paused`: toy movement frozen, pause modal with continue/back.
- `settings`: simple modal with speed + audio volume.
- `history`: simple record list.
- `summary`: end-of-round summary.

## Data Model
Extend `GameData` persistence:
- settings: `speedLevel`, `soundLevel`, `muted` only in UI; keep sanitizer backward compatible.
- session history: list of recent sessions with `touches`, `score`, `durationMs`, `endedAt`.
- best score / best touches derived from history.

## Gameplay / Toy Rendering
`AnimalSpawner` remains canvas renderer but target styles change:
- toy kind drives custom drawing functions: yarn ball, plush mouse, plush fish, feather pom.
- all shapes are rounded; use soft fills, texture strokes, fur hairs, low-alpha glow.
- movement profiles are dampened globally for cat comfort.
- visible target radius plus hit radius multiplier = 2x for cat paws.

## Platform Boundary
- Add Douyin login mock UI and `AuthService` placeholder with TODO comments for future `tt.login` / auth flow.
- Do not block play on auth.
- Existing `AdManager` / `StorageService` placeholders remain non-blocking.

## Validation Strategy
- Unit tests for history persistence, settings sanitizer, ad/auth placeholders, enlarged hit radius.
- Smoke checks for Chinese shell markers and required pages.
- Local dev server HTTP 200 and HTML marker check.

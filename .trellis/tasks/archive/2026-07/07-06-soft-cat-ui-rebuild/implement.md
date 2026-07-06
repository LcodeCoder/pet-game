# Implementation Plan

1. Create/update product design context (`PRODUCT.md`, `DESIGN.md`) for the warm cat-game direction.
2. Read Trellis frontend/backend specs before editing.
3. Replace HTML shell with Chinese complete page structure: home, HUD, action buttons, login mock, pause/settings/history/summary overlays.
4. Rewrite CSS visual system to cream background, soft cards/buttons, no dark UI blocks.
5. Simplify HUD/settings bindings in `Hud.js`, add screen/modal methods and Chinese fields.
6. Extend `GameData.js` for session history and best/cumulative stats.
7. Add `AuthService.js` Douyin login mock placeholder.
8. Fix `GameMain` start flow, pause/resume/end/home/history state handling, save session records.
9. Rework `AnimalSpawner.js` rendering and movement into soft plush toys, slower movement.
10. Increase `TouchCollider` cat-paw hit multiplier to 2x and support multi-pointer flow.
11. Add softer background / hit sounds in `AudioManager` with low volume.
12. Update tests and smoke checks.
13. Run `npm test`, `npm run smoke`, module import check, dev server HTTP preview.
14. If quality passes, update specs if new contracts are worth preserving, then commit.

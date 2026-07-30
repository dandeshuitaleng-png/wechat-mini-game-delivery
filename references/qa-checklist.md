# Mini Game QA Checklist

## Gameplay

- The first action is understandable without documentation.
- Every level has at least one completion path.
- Failure feedback explains what happened and clears predictably.
- Hints help progressively without finishing the level.
- Cultural familiarity is not required for basic progress.
- Knowledge feedback is readable long enough to understand.
- Difficulty curve is smooth; no sudden spikes.
- Tutorial can be skipped after first completion.

## Touch

- Buttons use at least 44×44 hit regions.
- Expanded grid targets choose the nearest cell in overlap zones.
- Fast movement samples the segment between touch events.
- Backtracking removes the immediately previous cell.
- Cancelled touches and app hide clear active paths.
- Modal overlays cannot trigger controls behind them.
- Multi-touch gestures (pinch, rotate) work if implemented.
- Touch feedback is immediate (< 100ms).

## Header and safe areas

- Back action remains outside the notch and safe area.
- Title is centered in available space.
- Header actions do not overlap the WeChat capsule.
- Header title and action do not read as one sentence.
- Safe area insets are respected on all screens.

## Layout states

- Test 320×568 (iPhone SE), 375×667 (iPhone 8), 414×896 (iPhone 11), and tablet-sized window.
- Verify tutorial, game, hint, error, success, pause, result, collection, settings, and data-error states.
- All dialog buttons remain inside their card.
- Bottom actions remain above the home indicator.
- Long text wraps without colliding with actions.
- Landscape and portrait orientations both work (if supported).

## Data

General:
- Save data persists correctly across sessions.
- Game data lives in one canonical source and validates at startup.

Word puzzle games only (see `game-types/word-puzzle.md`):
- Grid cells are single nonempty characters.
- No `null`, holes, or multi-character cells.
- Direction rules match the product requirement.
- Each target route is valid and has the intended occurrence count.
- Every knowledge card needed by gameplay is nonempty.
- Level data validates with `scripts/audit-word-levels.js`.

## Performance

- Game maintains 60 FPS during normal gameplay.
- No frame drops during animations or transitions.
- Memory usage stays below 100MB.
- Load time from launch to playable < 3 seconds.
- Package size under 4MB main package, subpackages under 20MB total.
- Images optimized (WebP where supported, compressed PNG/JPEG).
- Audio files under 200KB each.

## Audio

- Background music plays and loops correctly.
- Sound effects trigger at appropriate times.
- Audio can be muted in settings.
- Audio stops when app goes to background.
- No audio distortion or clipping.

## Network

- Graceful handling of offline mode.
- Loading indicators for network requests.
- Retry logic for failed requests.
- Warning before large downloads on cellular.
- Cloud save syncs correctly (if implemented).

## Evidence

- Static tests do not replace Developer Tools compilation.
- Compilation does not replace simulator startup.
- Simulator startup does not replace real interaction.
- Historical screenshots do not prove the current build.
- Performance metrics measured on real devices, not just simulator.

## WeChat-Specific

- WeChat capsule does not overlap game UI.
- Share functionality works correctly.
- Customer service button accessible (if required).
- Privacy policy link works (if collecting data).
- Age rating appropriate for content.
- No policy violations (gambling, inappropriate content, etc.).

## Accessibility

- Color is not the only indicator for important information.
- Text has sufficient contrast (4.5:1 for normal text).
- Touch targets are large enough for users with motor impairments.
- Game can be played with one hand.
- No flashing content that could trigger seizures.

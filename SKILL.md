---
name: wechat-mini-game-delivery
description: Turn a raw game idea into a validated plan, then build, debug, optimize, and publish native WeChat mini games of any type. Use when Codex receives a game idea or rough proposal to refine and implement, must create a new WeChat mini-game project, implement gameplay features, diagnose Developer Tools errors, optimize performance, or prepare for release. Supports all game genres including puzzle, action, casual, and cultural-content games.
agent_created: true
---

# WeChat Mini Game Delivery

Deliver a playable, performant, and publishable native WeChat mini game. This skill covers the complete lifecycle from a raw idea to release: refine the idea into a validated plan, then build, verify, and ship it. Applicable to all game types.

## Route the task

Choose the narrowest mode:

- **Ideate**: refine a raw idea or rough proposal into a validated, scoped plan (read `references/idea-refinement.md`), then proceed to Build once confirmed.
- **Plan**: analyze requirements and produce a technical design, scope, and acceptance criteria.
- **Build**: create or modify a project and implement the requested features.
- **Debug**: reproduce, diagnose, and fix runtime or build errors.
- **Optimize**: improve performance, reduce package size, or enhance user experience.
- **Publish**: prepare for release, validate requirements, and generate release checklist.
- **QA**: inspect and report issues without making changes (unless authorized).

When the user gives an idea or a rough proposal rather than a confirmed spec, always start at Ideate. When they hand over a confirmed plan or an existing project, skip straight to the matching mode.

For game-type-specific guidance, read the appropriate file in `references/game-types/`:
- `word-puzzle.md` for word search, crossword, and text-based puzzle games
- `action.md` for real-time action, arcade, and reflex games
- `casual.md` for match-3, bubble shooter, and casual puzzle games
- `puzzle.md` for logic, physics, and brain teaser games

For proven design baselines from 50 top-grossing games (gameplay loops, interaction patterns, UI layouts, color palettes, animation parameters, 3D approaches), read `references/top-games/README.md` for the index, then the matching category file:
- `classic-casual.md` for hyper-casual, single-finger, physics/reaction games
- `idle-rpg.md` for idle, chest-opening, card, and management RPGs
- `action-survival.md` for survivor-like, tower defense, roguelike, and shooter games
- `match-sim-io.md` for match-3, simulation, IO battle, and runner games
- `puzzle-party-3d.md` for puzzle, board, party, and 3D games

## Execute the delivery loop

### Phase 0: Idea Refinement (skip when the input is already a confirmed spec)

Read `references/idea-refinement.md` and run its four steps: restate with assumptions, score on five dimensions (hook / platform fit / feasibility / edge / monetization), repair weak spots using proven skeletons from `references/top-games/`, then emit the plan in the template it defines.

- Present the plan and get the user's confirmation before writing code.
- Carry the plan's acceptance criteria into Phase 5 verbatim.
- If the idea changes mid-build, re-score the delta before touching code.

### Phase 1: Discovery and Planning

When arriving from Phase 0, the confirmed plan already covers the benchmarks, observable criteria, and tech outline below — verify them against project reality instead of redoing them.

1. Inspect project-local `AGENTS.md`, README/specs, project config, Git status, source data, tests, and similar implementations.
2. State the objective, non-goals, target devices, core gameplay loop, content boundary, and evidence still needed.
3. Convert vague goals into observable criteria: frame rate, load time, completion rate, user retention.
4. Define the data schema and validation rules before implementing gameplay.
5. Identify the game type and read the corresponding guide in `references/game-types/`.
6. Find the closest 2-3 benchmark titles in `references/top-games/` and extract their reusable parameters (color palette, UI proportions, animation timing, core loop) as the design baseline.

### Phase 2: Project Setup

1. Create the project structure using `scripts/init-project.js` (invoke it by absolute path from this skill's directory, or copy it into the workspace first):
   ```bash
   node scripts/init-project.js <project-name> [--template basic|canvas2d|subpackage]
   ```
   The script refuses to overwrite an existing directory; for an existing project, verify the structure manually against the steps below.

2. Verify `project.config.json` has correct `appid` and `projectname`.
3. Ensure `game.json` specifies a valid `deviceOrientation` (`portrait` or `landscape`). Mini games render fullscreen and have no `window`/navigation-bar config — that belongs to mini programs. Get screen metrics at runtime via `wx.getWindowInfo()`.
4. Set up local storage namespace unique to this game.
5. Configure subpackages if the game has more than 3-5 levels or scenes.

### Phase 3: Implementation

1. Implement in small vertical slices: core loop first, rendering second, polish third.
2. For UI layout, color palette, animation, and effects decisions, read `references/design-patterns/ui-ux.md` and `references/design-patterns/visual-effects.md`.
3. Add deterministic guards for every reproduced bug.
4. Run checks proportionate to risk and commit only task-owned files.
5. Open or refresh WeChat Developer Tools only when runtime or visual evidence is required.
6. Test on real devices early and often; simulator behavior differs from real devices.

### Phase 4: Optimization

Read `references/performance.md` for detailed optimization guide.

Run `scripts/check-performance.js <project-dir>` to audit package size, image/audio limits, and missing config files before and after optimizing:

```bash
node scripts/check-performance.js <project-dir>
```

Key metrics:
- **Frame rate**: Maintain 60 FPS during gameplay
- **Load time**: < 3 seconds from launch to playable
- **Memory**: < 100MB peak usage
- **Package size**: < 4MB main package, < 20MB total with subpackages

Common optimizations:
- Use object pooling for frequently created/destroyed objects
- Batch draw calls and minimize state changes
- Compress images (WebP where supported) and audio (< 200KB per file)
- Lazy-load non-critical resources
- Use `requestAnimationFrame` instead of `setInterval`

### Phase 5: Verification

1. Report what is confirmed and what remains unverified.
2. Run the full QA checklist (see `references/qa-checklist.md`).
3. Verify performance metrics on real devices.
4. Test all game states: tutorial, gameplay, pause, game over, settings.

### Phase 6: Publishing

Read `references/publishing.md` for complete release guide.

Pre-release checklist:
- [ ] All levels/content validated
- [ ] No console errors in Developer Tools
- [ ] Tested on at least one iOS and one Android device
- [ ] Performance metrics meet targets
- [ ] Package size within limits
- [ ] Privacy policy and user agreement added (if collecting data)
- [ ] Version number updated
- [ ] Release notes prepared

## Build native projects safely

- Read `references/external-resources.md` for official platform rules (package limits, sharing, ads), engine selection (Cocos/LayaAir/Unity/three.js), vetted open-source projects, and CC0 asset sites. Reference open-source projects by URL; never copy third-party code into this skill directory.
- Import the project root containing `project.config.json`, not an inner source folder.
- Prefer simple CommonJS modules and Canvas2D for small dependency-free games.
- Keep game data in one canonical source and validate it at startup and in tests.
- Do not assume Node module behavior equals WeChat runtime behavior. JSON `require()` may be rewritten as `.json.js`. Use `wx.getFileSystemManager().readFileSync()` and `JSON.parse()` for packaged data.
- Treat `project.private.config.json` and Developer Tools rewrites as local/user-owned.
- Use a unique local-storage namespace for each independent game.

## Manage game resources

### Images

- Load images through `wx.createImage()`; do not use HTML Image constructor.
- Preload critical images during loading screen; lazy-load level-specific assets.
- Use texture atlases for small icons to reduce draw calls.
- Provide fallback for WebP on older devices.
- Validate image sizes with `scripts/validate-assets.js`.

### Audio

- Use `wx.createInnerAudioContext()` for sound effects and background music.
- Set `autoplay = false` and `loop = true` for BGM; control playback manually.
- Release audio contexts when leaving scenes to free memory.
- Keep individual audio files under 200KB; use compression.
- Stop all audio when app goes to background.

### Fonts

- Use system fonts by default; custom fonts increase package size significantly.
- If custom fonts required, load via `wx.loadFontFace()` and provide fallback.
- Test font rendering on actual devices, not just simulator.

## Handle network and storage

### Network Requests

- Wrap `wx.request()` in a Promise-based utility with timeout and retry logic.
- Handle `fail` callback for network errors; do not assume connectivity.
- Use `wx.downloadFile()` for large assets; show progress to user.
- Respect user's network type; warn before large downloads on cellular.

### Local Storage

- Wrap `wx.setStorageSync()`/`wx.getStorageSync()` with try-catch; storage can fail.
- Use a versioned storage schema to handle migrations.
- Clear old save data when schema version changes.
- Provide cloud save option via `wx.cloud` if user authenticated.

## Design touch interaction

- Read `wx.getMenuButtonBoundingClientRect()` and keep custom header actions outside the WeChat capsule.
- Center titles within the usable region between navigation and actions, not blindly at screen center.
- Give actions at least a 44×44 logical-pixel hit region.
- When expanded hit regions overlap, select the element nearest the touch point.
- Handle `touchstart`, `touchmove`, `touchend`, `touchcancel`, hide, and show. Clear interrupted states.
- Reset hit regions before drawing a modal so overlays own input.
- Keep visual feedback independent of vibration and color.

## Adapt to different screens

- Use `wx.getWindowInfo()` (or fall back to the deprecated `wx.getSystemInfoSync()` on old base libraries) for screen dimensions, `pixelRatio`, and `safeArea` insets.
- Design at the official baseline of 750×1334 logical pixels and scale proportionally to other sizes.
- Calculate layout in logical pixels; multiply by `pixelRatio` for canvas rendering.
- Test on 320×568 (iPhone SE), 375×667 (iPhone 8), 414×896 (iPhone 11), and tablet sizes.
- Handle notch and home indicator on iPhone X and later.
- Provide landscape and portrait layouts if game supports both orientations.

## Debug Developer Tools

Read `references/runtime-pitfalls.md` when Developer Tools, CLI ports, compilation, or runtime loading fails.

Never call a project "running" merely because:
- the CLI command was issued,
- Node tests passed,
- the process exists, or
- the project imported.

Require observable Developer Tools output, simulator content, console state, or user-provided screenshots for runtime claims.

## Perform visual QA

Read `references/qa-checklist.md` for screenshot and interaction review.

Use screenshots to inspect:
- safe areas, notch and capsule collisions,
- clipped dialogs or buttons outside cards,
- labels that merge visually,
- touch targets smaller than their visual affordance,
- long text at narrow widths,
- all game states (tutorial, gameplay, pause, game over, settings).

After each screenshot finding, fix the owning layout or state rule, add a testable invariant where possible, and request one fresh screenshot for the affected state.

## Evidence and handoff

Report these separately:

- **Static**: source, config, data, syntax, and validation.
- **Build**: Developer Tools compilation or automation output.
- **Runtime**: simulator/game starts without blocking console errors.
- **Interaction**: real taps, swipes, gestures, pause, resume, error recovery.
- **Visual**: current screenshots at target resolutions.
- **Performance**: FPS, memory usage, load time on real devices.

Include the exact project root, modified files or commits, tests executed, untouched scope, blockers, and the next manual check. Never substitute one evidence layer for another.

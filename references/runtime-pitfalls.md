# Runtime and Developer Tools Pitfalls

## JSON module loading

Symptom:

```text
module 'data/levels.json.js' is not defined
```

Cause: WeChat runtime or its bundler rewrites a JSON `require()` as a JavaScript module.

Preferred response:

1. Preserve the console screenshot or exact error.
2. Confirm the JSON file exists and parses in Node.
3. Load packaged JSON through `wx.getFileSystemManager().readFileSync(path, 'utf8')`.
4. Parse with `JSON.parse()`.
5. Mock the filesystem call in Node UI tests.
6. Recompile in Developer Tools; Node success alone is insufficient.

## Stale IDE port

Symptoms:

```text
IDE may already started at port N, trying to connect
wait IDE port timeout
```

Procedure:

1. Check actual Developer Tools processes and listeners.
2. Attempt normal CLI close/quit first.
3. If a confirmed hung process remains, terminate only its exact PID.
4. Locate the profile `Default/.ide` port file.
5. Verify that no process listens on that port.
6. Move the stale file to a timestamped backup; do not delete broad profile data.
7. Start with an explicit CLI `--port` outside restrictive sandboxes when local binding is required.
8. Verify the new listener, visible window, project, console, and simulator independently.

## Process exists but no window

- Activate the application and capture the current screen.
- A menu bar or background process is not proof of a project window.
- Ask the user to foreground the window when macOS automation cannot observe it.
- Continue from a user screenshot rather than claiming success.

## Local config ownership

- `project.config.json` may be rewritten after selecting an AppID.
- `project.private.config.json` is normally local.
- Inspect Git diff before staging.
- Commit only files owned by the requested change unless the user explicitly asks to include configuration.

## Canvas rendering issues

### Blank canvas or black screen

Symptoms:

```text
Canvas is created but nothing renders
```

Common causes:

1. Canvas context not obtained correctly. Use `canvas.getContext('2d')`, not `wx.createCanvasContext()` (deprecated).
2. Canvas size not set. Must set `canvas.width` and `canvas.height` explicitly.
3. Pixel ratio not handled. Multiply logical coordinates by `wx.getWindowInfo().pixelRatio` (`wx.getSystemInfoSync()` is deprecated).
4. Drawing outside visible bounds. Check safe area insets.

Solution:

```javascript
// wx.getWindowInfo() replaces the deprecated wx.getSystemInfoSync() (base library 2.20.1+)
const systemInfo = wx.getWindowInfo ? wx.getWindowInfo() : wx.getSystemInfoSync()
const canvas = wx.createCanvas()
const ctx = canvas.getContext('2d')

// Set canvas size to match screen
canvas.width = systemInfo.windowWidth * systemInfo.pixelRatio
canvas.height = systemInfo.windowHeight * systemInfo.pixelRatio

// Scale context to use logical pixels
ctx.scale(systemInfo.pixelRatio, systemInfo.pixelRatio)
```

### Touch events not firing

Symptoms:

```text
Touch handlers registered but not called
```

Common causes:

1. Touch events registered on wrong object. Use `wx.onTouchStart()`, not canvas element events.
2. Modal overlay blocking touches. Reset hit regions when showing modals.
3. Touch event consumed by parent. Call `event.preventDefault()` if needed.

Solution:

```javascript
// Register global touch handlers
wx.onTouchStart(handleTouchStart)
wx.onTouchMove(handleTouchMove)
wx.onTouchEnd(handleTouchEnd)
wx.onTouchCancel(handleTouchCancel)

// In handlers, convert to logical coordinates
function handleTouchStart(event) {
  const touch = event.touches[0]
  const x = touch.clientX
  const y = touch.clientY
  // Process touch...
}
```

## Audio playback issues

### Audio not playing

Symptoms:

```text
No sound when expected
```

Common causes:

1. Audio context not created. Must use `wx.createInnerAudioContext()`.
2. Autoplay policy. User interaction required before first play.
3. Audio file path incorrect. Use absolute path from project root.
4. Audio format not supported. Use MP3 or AAC; avoid WAV for large files.

Solution:

```javascript
const audio = wx.createInnerAudioContext()
audio.src = '/audio/click.mp3'
audio.autoplay = false

// Play after user interaction
function onUserTap() {
  audio.play()
}

// Clean up when done
audio.onEnded(() => {
  audio.destroy()
})
```

## Storage issues

### Data not persisting

Symptoms:

```text
Save data lost after restart
```

Common causes:

1. Storage key collision. Use unique namespace per game.
2. Storage quota exceeded. WeChat limits to 10MB per game.
3. Async/sync confusion. Use `wx.setStorageSync()` for critical saves.
4. Storage cleared by user or system.

Solution:

```javascript
const STORAGE_KEY = 'mygame_save_v1'

function saveGame(data) {
  try {
    wx.setStorageSync(STORAGE_KEY, JSON.stringify(data))
  } catch (error) {
    console.error('Save failed:', error)
    // Handle quota exceeded or other errors
  }
}

function loadGame() {
  try {
    const data = wx.getStorageSync(STORAGE_KEY)
    return data ? JSON.parse(data) : null
  } catch (error) {
    console.error('Load failed:', error)
    return null
  }
}
```

## Performance issues

### Low FPS or stuttering

Symptoms:

```text
Game runs below 60 FPS
Frame drops during gameplay
```

Common causes:

1. Too many draw calls. Batch rendering where possible.
2. Large images not optimized. Compress and resize assets.
3. Memory leaks. Check for unreleased textures and audio contexts.
4. Complex calculations in render loop. Move to update loop or use web workers.

Solution:

Use the object pool and batched-rendering implementations from `references/performance.md` (single canonical versions live there). Keep the render loop free of per-frame allocations and move heavy computation out of `render()`.

## Network request failures

### Requests timing out or failing

Symptoms:

```text
wx.request() calls fail or timeout
```

Common causes:

1. No network connectivity. Check `wx.getNetworkType()` first.
2. Request timeout too short. Increase for large downloads.
3. Server not responding. Implement retry logic.
4. HTTPS required. WeChat requires HTTPS for all requests.

Solution:

```javascript
function requestWithRetry(options, maxRetries = 3) {
  return new Promise((resolve, reject) => {
    let retries = 0
    
    function attempt() {
      wx.request({
        ...options,
        timeout: 10000, // 10 seconds
        success: resolve,
        fail: (error) => {
          retries++
          if (retries < maxRetries) {
            setTimeout(attempt, 1000 * retries) // Linear backoff: 1s, 2s, ... (use 2 ** retries * 500 for exponential)
          } else {
            reject(error)
          }
        }
      })
    }
    
    attempt()
  })
}
```

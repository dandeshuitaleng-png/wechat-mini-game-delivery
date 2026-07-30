# Performance Optimization Guide

Comprehensive guide to optimizing WeChat mini game performance.

## Performance Targets

- **Frame rate**: 60 FPS (minimum 55 FPS)
- **Load time**: < 3 seconds from launch to playable
- **Memory**: < 100MB peak usage
- **Package size**: < 4MB main package, < 20MB total
- **Input latency**: < 50ms from touch to visual feedback

## Rendering Optimization

### Batch Draw Calls

Minimize state changes and batch similar draw operations:

```javascript
// Bad: Multiple state changes
objects.forEach(obj => {
  ctx.fillStyle = obj.color
  ctx.fillRect(obj.x, obj.y, obj.w, obj.h)
})

// Good: Group by color
const byColor = {}
objects.forEach(obj => {
  if (!byColor[obj.color]) byColor[obj.color] = []
  byColor[obj.color].push(obj)
})

Object.entries(byColor).forEach(([color, objs]) => {
  ctx.fillStyle = color
  objs.forEach(obj => ctx.fillRect(obj.x, obj.y, obj.w, obj.h))
})
```

### Use Offscreen Canvas

Pre-render static content to an offscreen canvas:

```javascript
// WARNING: the FIRST wx.createCanvas() call in a mini game returns the
// on-screen canvas. Make sure the main canvas is created before this class
// is instantiated, otherwise this "offscreen" canvas is actually the screen.
class StaticBackground {
  constructor(width, height) {
    this.canvas = wx.createCanvas()
    this.canvas.width = width
    this.canvas.height = height
    this.ctx = this.canvas.getContext('2d')
    this.rendered = false
  }
  
  render() {
    if (this.rendered) return
    
    // Render static content once
    this.ctx.fillStyle = '#f0f0f0'
    this.ctx.fillRect(0, 0, this.canvas.width, this.canvas.height)
    
    // Draw decorations, patterns, etc.
    
    this.rendered = true
  }
  
  draw(mainCtx, x, y) {
    this.render()
    mainCtx.drawImage(this.canvas, x, y)
  }
}
```

### Minimize Canvas Operations

Avoid unnecessary canvas operations:

```javascript
// Bad: Clear entire canvas every frame
function render() {
  ctx.clearRect(0, 0, width, height)
  // Draw everything
}

// Good: Only clear changed regions
function render() {
  dirtyRegions.forEach(region => {
    ctx.clearRect(region.x, region.y, region.w, region.h)
    // Redraw only objects in this region
  })
}
```

## Memory Optimization

### Object Pooling

Reuse objects instead of creating new ones:

```javascript
class ObjectPool {
  constructor(createFn, resetFn, initialSize = 20) {
    this.createFn = createFn
    this.resetFn = resetFn
    this.pool = []
    this.active = new Set()
    
    for (let i = 0; i < initialSize; i++) {
      this.pool.push(this.createFn())
    }
  }
  
  acquire() {
    const obj = this.pool.pop() || this.createFn()
    this.active.add(obj)
    return obj
  }
  
  release(obj) {
    this.active.delete(obj)
    this.resetFn(obj)
    this.pool.push(obj)
  }
}
```

### Release Resources

Always release resources when done:

```javascript
class AudioManager {
  constructor() {
    this.sounds = {}
  }
  
  load(name, src) {
    const audio = wx.createInnerAudioContext()
    audio.src = src
    this.sounds[name] = audio
  }
  
  play(name) {
    if (this.sounds[name]) {
      this.sounds[name].play()
    }
  }
  
  release(name) {
    if (this.sounds[name]) {
      this.sounds[name].destroy()
      delete this.sounds[name]
    }
  }
  
  releaseAll() {
    Object.keys(this.sounds).forEach(name => this.release(name))
  }
}
```

## Asset Optimization

### Image Compression

Use appropriate formats and compression:

```bash
# Convert PNG to WebP (where supported)
cwebp -q 80 input.png -o output.webp

# Compress JPEG
jpegoptim --size=200k input.jpg

# Create sprite sheets
texturepacker --format pixijs --data sprites.json --sheet sprites.png *.png
```

### Audio Compression

Keep audio files small:

```bash
# Convert to AAC with lower bitrate
ffmpeg -i input.wav -c:a aac -b:a 96k output.aac

# Trim silence
ffmpeg -i input.mp3 -af silenceremove=1:0:-50dB output.mp3
```

## Code Optimization

### Avoid Premature Optimization

Profile first, optimize second:

```javascript
// Use performance.now() to measure
const start = performance.now()
expensiveOperation()
const end = performance.now()
console.log(`Operation took ${end - start}ms`)
```

### Use RequestAnimationFrame

Always use `requestAnimationFrame` for animations:

```javascript
// Bad
setInterval(() => {
  update()
  render()
}, 16)

// Good
function loop() {
  update()
  render()
  requestAnimationFrame(loop)
}
requestAnimationFrame(loop)
```

### Debounce Expensive Operations

Limit how often expensive operations run:

```javascript
function debounce(fn, delay) {
  let timeoutId
  return function (...args) {
    clearTimeout(timeoutId)
    timeoutId = setTimeout(() => fn.apply(this, args), delay)
  }
}

// Usage
const expensiveUpdate = debounce(() => {
  // Expensive operation
}, 100)
```

## Loading Optimization

### Lazy Loading

Load resources only when needed:

```javascript
class ResourceLoader {
  constructor() {
    this.loaded = {}
    this.loading = {}
  }
  
  async load(name, loadFn) {
    if (this.loaded[name]) {
      return this.loaded[name]
    }
    
    if (this.loading[name]) {
      return this.loading[name]
    }
    
    this.loading[name] = loadFn().then(resource => {
      this.loaded[name] = resource
      delete this.loading[name]
      return resource
    })
    
    return this.loading[name]
  }
}
```

### Subpackages

Split large games into subpackages:

```javascript
// game.json
{
  "subpackages": [
    {
      "root": "levels/1-10",
      "name": "levels-1-10"
    },
    {
      "root": "levels/11-20",
      "name": "levels-11-20"
    }
  ]
}

// Load subpackage
wx.loadSubpackage({
  name: 'levels-1-10',
  success: () => {
    // Subpackage loaded
  }
})
```

## Monitoring

### FPS Counter

Display FPS during development:

```javascript
class FPSCounter {
  constructor() {
    this.frames = 0
    this.lastTime = Date.now()
    this.fps = 0
  }
  
  update() {
    this.frames++
    const now = Date.now()
    
    if (now >= this.lastTime + 1000) {
      this.fps = this.frames
      this.frames = 0
      this.lastTime = now
    }
  }
  
  render(ctx) {
    ctx.fillStyle = '#00ff00'
    ctx.font = '16px monospace'
    ctx.fillText(`FPS: ${this.fps}`, 10, 20)
  }
}
```

### Memory Monitor

Track memory usage:

```javascript
function logMemory() {
  if (wx.getPerformance) {
    const performance = wx.getPerformance()
    const memory = performance.memory
    
    if (memory) {
      console.log(`Memory: ${(memory.usedJSHeapSize / 1048576).toFixed(2)} MB`)
    }
  }
}

// Log every 5 seconds
setInterval(logMemory, 5000)
```

## Checklist

- [ ] 60 FPS during gameplay
- [ ] Load time < 3 seconds
- [ ] Memory usage < 100MB
- [ ] Package size < 4MB main, < 20MB total
- [ ] Images optimized (WebP, compressed)
- [ ] Audio files < 200KB each
- [ ] Object pooling for frequently created objects
- [ ] Resources released when not needed
- [ ] Lazy loading for non-critical resources
- [ ] Subpackages for large games

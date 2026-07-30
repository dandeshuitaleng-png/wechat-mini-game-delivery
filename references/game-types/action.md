# Action Games

Specific guidance for real-time action, arcade, and reflex games.

## Performance Requirements

Action games are performance-critical. Target metrics:
- **Frame rate**: Consistent 60 FPS (drops below 55 FPS are noticeable)
- **Input latency**: < 50ms from touch to visual feedback
- **Memory**: < 80MB peak (lower than other genres due to real-time requirements)

## Game Loop

Use `requestAnimationFrame` for the game loop, not `setInterval`:

```javascript
let lastTime = 0
let animationId = null

function gameLoop(timestamp) {
  const deltaTime = timestamp - lastTime
  lastTime = timestamp
  
  update(deltaTime)
  render()
  
  animationId = requestAnimationFrame(gameLoop)
}

// Start loop
animationId = requestAnimationFrame(gameLoop)

// Stop loop when pausing
function pause() {
  if (animationId) {
    cancelAnimationFrame(animationId)
    animationId = null
  }
}
```

## Object Pooling

Reuse objects instead of creating/destroying frequently:

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
  
  releaseAll() {
    this.active.forEach(obj => {
      this.resetFn(obj)
      this.pool.push(obj)
    })
    this.active.clear()
  }
}

// Usage
const bulletPool = new ObjectPool(
  () => ({ x: 0, y: 0, vx: 0, vy: 0, active: false }),
  (bullet) => { bullet.active = false },
  50
)
```

## Collision Detection

Use spatial partitioning for large numbers of objects:

```javascript
class SpatialGrid {
  constructor(width, height, cellSize) {
    this.cellSize = cellSize
    this.cols = Math.ceil(width / cellSize)
    this.rows = Math.ceil(height / cellSize)
    this.grid = new Array(this.cols * this.rows).fill(null).map(() => [])
  }
  
  clear() {
    this.grid.forEach(cell => cell.length = 0)
  }
  
  insert(obj) {
    const cellIndex = this.getCellIndex(obj.x, obj.y)
    this.grid[cellIndex].push(obj)
  }
  
  getCellIndex(x, y) {
    const col = Math.floor(x / this.cellSize)
    const row = Math.floor(y / this.cellSize)
    return row * this.cols + col
  }
  
  getNearby(x, y, radius) {
    const nearby = []
    const cellRadius = Math.ceil(radius / this.cellSize)
    const centerCol = Math.floor(x / this.cellSize)
    const centerRow = Math.floor(y / this.cellSize)
    
    for (let row = centerRow - cellRadius; row <= centerRow + cellRadius; row++) {
      for (let col = centerCol - cellRadius; col <= centerCol + cellRadius; col++) {
        if (row >= 0 && row < this.rows && col >= 0 && col < this.cols) {
          nearby.push(...this.grid[row * this.cols + col])
        }
      }
    }
    
    return nearby
  }
}
```

## Touch Input

Sample touch moves for fast swipes:

```javascript
let activeTouch = null
let touchPath = []

wx.onTouchStart((event) => {
  const touch = event.touches[0]
  activeTouch = {
    id: touch.identifier,
    startX: touch.clientX,
    startY: touch.clientY,
    currentX: touch.clientX,
    currentY: touch.clientY
  }
  touchPath = [{ x: touch.clientX, y: touch.clientY, time: Date.now() }]
})

wx.onTouchMove((event) => {
  if (!activeTouch) return
  
  const touch = Array.from(event.touches).find(t => t.identifier === activeTouch.id)
  if (!touch) return
  
  activeTouch.currentX = touch.clientX
  activeTouch.currentY = touch.clientY
  
  // Sample path for fast movement
  touchPath.push({ x: touch.clientX, y: touch.clientY, time: Date.now() })
  
  // Keep only recent samples (last 100ms)
  const cutoff = Date.now() - 100
  touchPath = touchPath.filter(p => p.time > cutoff)
})
```

## Particle Systems

Limit particle count and use object pooling:

```javascript
class ParticleSystem {
  constructor(maxParticles = 100) {
    this.pool = new ObjectPool(
      () => ({
        x: 0, y: 0,
        vx: 0, vy: 0,
        life: 0, maxLife: 1000,
        size: 1, color: '#fff'
      }),
      (p) => { p.life = 0 },
      maxParticles
    )
  }
  
  emit(x, y, count = 10) {
    for (let i = 0; i < count; i++) {
      const particle = this.pool.acquire()
      particle.x = x
      particle.y = y
      particle.vx = (Math.random() - 0.5) * 5
      particle.vy = (Math.random() - 0.5) * 5
      particle.life = particle.maxLife
      particle.size = Math.random() * 3 + 1
    }
  }
  
  update(deltaTime) {
    this.pool.active.forEach(particle => {
      particle.x += particle.vx
      particle.y += particle.vy
      particle.life -= deltaTime
      
      if (particle.life <= 0) {
        this.pool.release(particle)
      }
    })
  }
  
  render(ctx) {
    this.pool.active.forEach(particle => {
      const alpha = particle.life / particle.maxLife
      ctx.globalAlpha = alpha
      ctx.fillStyle = particle.color
      ctx.fillRect(particle.x, particle.y, particle.size, particle.size)
    })
    ctx.globalAlpha = 1
  }
}
```

## Testing Checklist

- [ ] Maintains 60 FPS during intense gameplay
- [ ] No input lag or delayed response
- [ ] Collision detection is accurate
- [ ] Object pooling prevents memory spikes
- [ ] Particle effects don't cause frame drops
- [ ] Touch input feels responsive
- [ ] Game pauses correctly when app goes to background

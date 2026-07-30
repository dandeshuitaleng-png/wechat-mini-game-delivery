# Visual Effects and Animation Guide

Guide to creating engaging visual effects and animations for WeChat mini games.

## Animation Principles

### Timing and Easing

**Fast-paced games (action, casual):**
```javascript
// Quick, snappy animations (0.2-0.3s)
const ANIMATION_DURATION = 250

function easeOutCubic(t) {
  return 1 - Math.pow(1 - t, 3)
}

function easeOutBack(t) {
  const c1 = 1.70158
  const c3 = c1 + 1
  return 1 + c3 * Math.pow(t - 1, 3) + c1 * Math.pow(t - 1, 2)
}
```

**Relaxed games (puzzle, strategy):**
```javascript
// Smooth, gentle animations (0.3-0.5s)
const ANIMATION_DURATION = 400

function easeInOutQuad(t) {
  return t < 0.5 ? 2 * t * t : -1 + (4 - 2 * t) * t
}

function easeInOutCubic(t) {
  return t < 0.5 ? 4 * t * t * t : 1 - Math.pow(-2 * t + 2, 3) / 2
}
```

### Particle Effects

**Simple particle system:**
```javascript
class Particle {
  constructor(x, y, options = {}) {
    this.x = x
    this.y = y
    this.vx = options.vx || (Math.random() - 0.5) * 5
    this.vy = options.vy || (Math.random() - 0.5) * 5
    this.life = options.life || 1000
    this.maxLife = this.life
    this.size = options.size || Math.random() * 3 + 1
    this.color = options.color || '#ffffff'
    this.gravity = options.gravity || 0.1
  }
  
  update(deltaTime) {
    this.x += this.vx
    this.y += this.vy
    this.vy += this.gravity
    this.life -= deltaTime
  }
  
  render(ctx) {
    const alpha = this.life / this.maxLife
    ctx.globalAlpha = alpha
    ctx.fillStyle = this.color
    ctx.fillRect(this.x, this.y, this.size, this.size)
    ctx.globalAlpha = 1
  }
  
  isDead() {
    return this.life <= 0
  }
}

class ParticleEmitter {
  constructor() {
    this.particles = []
  }
  
  emit(x, y, count = 10, options = {}) {
    for (let i = 0; i < count; i++) {
      this.particles.push(new Particle(x, y, options))
    }
  }
  
  update(deltaTime) {
    this.particles = this.particles.filter(p => {
      p.update(deltaTime)
      return !p.isDead()
    })
  }
  
  render(ctx) {
    this.particles.forEach(p => p.render(ctx))
  }
}

// Usage: Celebration effect
function onLevelComplete(x, y) {
  emitter.emit(x, y, 50, {
    color: '#ffd700',
    life: 1500,
    gravity: 0.2
  })
}
```

## Common Visual Effects

### Screen Shake

Use sparingly for impact moments:

```javascript
class ScreenShake {
  constructor() {
    this.intensity = 0
    this.duration = 0
    this.elapsed = 0
  }
  
  shake(intensity = 10, duration = 300) {
    this.intensity = intensity
    this.duration = duration
    this.elapsed = 0
  }
  
  update(deltaTime) {
    if (this.elapsed < this.duration) {
      this.elapsed += deltaTime
      const progress = this.elapsed / this.duration
      return {
        x: (Math.random() - 0.5) * this.intensity * (1 - progress),
        y: (Math.random() - 0.5) * this.intensity * (1 - progress)
      }
    }
    return { x: 0, y: 0 }
  }
}

// Usage
const screenShake = new ScreenShake()

function onExplosion() {
  screenShake.shake(15, 400)
}

function render() {
  const offset = screenShake.update(deltaTime)
  ctx.save()
  ctx.translate(offset.x, offset.y)
  // Render game
  ctx.restore()
}
```

### Flash Effect

Highlight important moments:

```javascript
class FlashEffect {
  constructor() {
    this.alpha = 0
    this.color = '#ffffff'
    this.duration = 0
    this.elapsed = 0
  }
  
  flash(color = '#ffffff', duration = 200) {
    this.color = color
    this.duration = duration
    this.elapsed = 0
  }
  
  update(deltaTime) {
    if (this.elapsed < this.duration) {
      this.elapsed += deltaTime
      const progress = this.elapsed / this.duration
      this.alpha = 1 - progress
    } else {
      this.alpha = 0
    }
  }
  
  render(ctx, width, height) {
    if (this.alpha > 0) {
      ctx.globalAlpha = this.alpha
      ctx.fillStyle = this.color
      ctx.fillRect(0, 0, width, height)
      ctx.globalAlpha = 1
    }
  }
}

// Usage
const flashEffect = new FlashEffect()

function onPowerUp() {
  flashEffect.flash('#ffff00', 300)
}
```

### Glow Effect

Make elements stand out:

```javascript
function drawGlow(ctx, x, y, radius, color, intensity = 1) {
  const gradient = ctx.createRadialGradient(x, y, 0, x, y, radius)
  gradient.addColorStop(0, color)
  gradient.addColorStop(1, 'transparent')
  
  ctx.globalAlpha = intensity
  ctx.fillStyle = gradient
  ctx.fillRect(x - radius, y - radius, radius * 2, radius * 2)
  ctx.globalAlpha = 1
}

// Usage: Highlight selected item
function renderSelectedItem(item) {
  drawGlow(ctx, item.x, item.y, 50, '#00ff00', 0.5)
  drawItem(item)
}
```

### Trail Effect

Show movement paths:

```javascript
class Trail {
  constructor(maxPoints = 20) {
    this.points = []
    this.maxPoints = maxPoints
  }
  
  addPoint(x, y) {
    this.points.push({ x, y, life: 1 })
    
    if (this.points.length > this.maxPoints) {
      this.points.shift()
    }
  }
  
  update(deltaTime) {
    this.points.forEach(p => {
      p.life -= deltaTime / 500  // Fade over 500ms
    })
    
    this.points = this.points.filter(p => p.life > 0)
  }
  
  render(ctx, color = '#ffffff', width = 2) {
    if (this.points.length < 2) return
    
    ctx.strokeStyle = color
    ctx.lineWidth = width
    ctx.lineCap = 'round'
    ctx.lineJoin = 'round'
    
    for (let i = 0; i < this.points.length - 1; i++) {
      const p1 = this.points[i]
      const p2 = this.points[i + 1]
      
      ctx.globalAlpha = p1.life
      ctx.beginPath()
      ctx.moveTo(p1.x, p1.y)
      ctx.lineTo(p2.x, p2.y)
      ctx.stroke()
    }
    
    ctx.globalAlpha = 1
  }
}

// Usage: Show swipe trail
const trail = new Trail()

wx.onTouchMove((event) => {
  const touch = event.touches[0]
  trail.addPoint(touch.clientX, touch.clientY)
})
```

## Transition Effects

### Fade Transition

Smooth scene transitions:

```javascript
class FadeTransition {
  constructor() {
    this.alpha = 0
    this.duration = 500
    this.elapsed = 0
    this.fading = false
    this.callback = null
  }
  
  fadeOut(callback) {
    this.fading = 'out'
    this.elapsed = 0
    this.callback = callback
  }
  
  fadeIn() {
    this.fading = 'in'
    this.elapsed = 0
  }
  
  update(deltaTime) {
    if (!this.fading) return
    
    this.elapsed += deltaTime
    const progress = Math.min(this.elapsed / this.duration, 1)
    
    if (this.fading === 'out') {
      this.alpha = progress
      
      if (progress >= 1 && this.callback) {
        this.callback()
        this.callback = null
        this.fadeIn()
      }
    } else {
      this.alpha = 1 - progress
      
      if (progress >= 1) {
        this.fading = false
      }
    }
  }
  
  render(ctx, width, height) {
    if (this.alpha > 0) {
      ctx.fillStyle = `rgba(0, 0, 0, ${this.alpha})`
      ctx.fillRect(0, 0, width, height)
    }
  }
}

// Usage
const transition = new FadeTransition()

function changeScene(newScene) {
  transition.fadeOut(() => {
    loadScene(newScene)
  })
}
```

### Slide Transition

Slide between screens:

```javascript
class SlideTransition {
  constructor() {
    this.progress = 0
    this.duration = 300
    this.elapsed = 0
    this.direction = null
    this.callback = null
  }
  
  slide(direction, callback) {
    this.direction = direction  // 'left', 'right', 'up', 'down'
    this.elapsed = 0
    this.callback = callback
  }
  
  update(deltaTime) {
    if (!this.direction) return
    
    this.elapsed += deltaTime
    this.progress = Math.min(this.elapsed / this.duration, 1)
    
    if (this.progress >= 1 && this.callback) {
      this.callback()
      this.callback = null
      this.direction = null
    }
  }
  
  getOffset(width, height) {
    const eased = easeOutCubic(this.progress)
    
    switch (this.direction) {
      case 'left':
        return { x: -width * eased, y: 0 }
      case 'right':
        return { x: width * eased, y: 0 }
      case 'up':
        return { x: 0, y: -height * eased }
      case 'down':
        return { x: 0, y: height * eased }
      default:
        return { x: 0, y: 0 }
    }
  }
}
```

## Performance Tips

### Limit Particle Count

```javascript
class ParticleEmitter {
  constructor(maxParticles = 100) {
    this.particles = []
    this.maxParticles = maxParticles
  }
  
  emit(x, y, count = 10, options = {}) {
    // Remove oldest particles if at limit
    while (this.particles.length + count > this.maxParticles) {
      this.particles.shift()
    }
    
    for (let i = 0; i < count; i++) {
      this.particles.push(new Particle(x, y, options))
    }
  }
}
```

### Use Object Pooling

```javascript
class ParticlePool {
  constructor(size = 100) {
    this.pool = []
    this.active = []
    
    for (let i = 0; i < size; i++) {
      this.pool.push(new Particle(0, 0))
    }
  }
  
  acquire(x, y, options) {
    const particle = this.pool.pop()
    if (!particle) return null
    
    particle.x = x
    particle.y = y
    Object.assign(particle, options)
    
    this.active.push(particle)
    return particle
  }
  
  release(particle) {
    const index = this.active.indexOf(particle)
    if (index > -1) {
      this.active.splice(index, 1)
      this.pool.push(particle)
    }
  }
  
  update(deltaTime) {
    for (let i = this.active.length - 1; i >= 0; i--) {
      const particle = this.active[i]
      particle.update(deltaTime)
      
      if (particle.isDead()) {
        this.release(particle)
      }
    }
  }
}
```

## Testing Checklist

- [ ] All animations run at 60 FPS
- [ ] Particle effects don't cause frame drops
- [ ] Transitions are smooth and don't block input
- [ ] Effects enhance gameplay, don't distract
- [ ] Screen shake is used sparingly
- [ ] Flash effects don't trigger seizures
- [ ] Trail effects fade naturally
- [ ] Glow effects don't obscure important information

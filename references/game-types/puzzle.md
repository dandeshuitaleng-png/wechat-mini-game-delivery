# Puzzle Games

Specific guidance for logic, physics, and brain teaser games.

## Physics Engine Integration

For physics-based puzzles, use a lightweight physics engine or implement simple physics:

```javascript
class Vector2 {
  constructor(x = 0, y = 0) {
    this.x = x
    this.y = y
  }
  
  add(v) {
    this.x += v.x
    this.y += v.y
    return this
  }
  
  multiply(scalar) {
    this.x *= scalar
    this.y *= scalar
    return this
  }
  
  magnitude() {
    return Math.sqrt(this.x * this.x + this.y * this.y)
  }
  
  normalize() {
    const mag = this.magnitude()
    if (mag > 0) {
      this.x /= mag
      this.y /= mag
    }
    return this
  }
}

class PhysicsBody {
  constructor(x, y, mass = 1) {
    this.position = new Vector2(x, y)
    this.velocity = new Vector2()
    this.acceleration = new Vector2()
    this.mass = mass
    this.restitution = 0.8  // Bounciness
    this.friction = 0.99    // Air resistance
  }
  
  applyForce(force) {
    this.acceleration.add(force.multiply(1 / this.mass))
  }
  
  update(deltaTime) {
    this.velocity.add(this.acceleration.multiply(deltaTime))
    this.velocity.multiply(this.friction)
    this.position.add(this.velocity.multiply(deltaTime))
    this.acceleration.multiply(0)  // Reset acceleration
  }
  
  checkCollision(other) {
    const dx = this.position.x - other.position.x
    const dy = this.position.y - other.position.y
    const distance = Math.sqrt(dx * dx + dy * dy)
    const minDistance = this.radius + other.radius
    
    return distance < minDistance
  }
  
  resolveCollision(other) {
    const dx = other.position.x - this.position.x
    const dy = other.position.y - this.position.y
    const distance = Math.sqrt(dx * dx + dy * dy)
    
    const nx = dx / distance
    const ny = dy / distance
    
    const relativeVelocityX = other.velocity.x - this.velocity.x
    const relativeVelocityY = other.velocity.y - this.velocity.y
    
    const velocityAlongNormal = relativeVelocityX * nx + relativeVelocityY * ny
    
    if (velocityAlongNormal > 0) return  // Objects moving apart
    
    const restitution = Math.min(this.restitution, other.restitution)
    const impulse = -(1 + restitution) * velocityAlongNormal
    const impulseX = impulse * nx
    const impulseY = impulse * ny
    
    this.velocity.x -= impulseX / this.mass
    this.velocity.y -= impulseY / this.mass
    other.velocity.x += impulseX / other.mass
    other.velocity.y += impulseY / other.mass
  }
}
```

## Level Design

Use a data-driven approach for level definitions:

```javascript
const levels = [
  {
    id: 1,
    name: "Introduction",
    objects: [
      { type: 'ball', x: 100, y: 100, radius: 20 },
      { type: 'box', x: 300, y: 200, width: 50, height: 50, static: true },
      { type: 'goal', x: 500, y: 400, radius: 30 }
    ],
    constraints: {
      maxMoves: 5,
      timeLimit: 60
    }
  },
  // ...
]

function loadLevel(levelData) {
  const objects = levelData.objects.map(obj => {
    switch (obj.type) {
      case 'ball':
        return new Ball(obj.x, obj.y, obj.radius)
      case 'box':
        return new Box(obj.x, obj.y, obj.width, obj.height, obj.static)
      case 'goal':
        return new Goal(obj.x, obj.y, obj.radius)
      default:
        console.warn(`Unknown object type: ${obj.type}`)
        return null
    }
  }).filter(Boolean)
  
  return {
    objects,
    constraints: levelData.constraints
  }
}
```

## State Machine

Use a state machine for game flow:

```javascript
class GameStateMachine {
  constructor() {
    this.states = {}
    this.currentState = null
  }
  
  addState(name, state) {
    this.states[name] = state
  }
  
  setState(name, ...args) {
    if (this.currentState && this.currentState.exit) {
      this.currentState.exit()
    }
    
    this.currentState = this.states[name]
    
    if (this.currentState && this.currentState.enter) {
      this.currentState.enter(...args)
    }
  }
  
  update(deltaTime) {
    if (this.currentState && this.currentState.update) {
      this.currentState.update(deltaTime)
    }
  }
  
  render(ctx) {
    if (this.currentState && this.currentState.render) {
      this.currentState.render(ctx)
    }
  }
}

// Usage
const gameState = new GameStateMachine()

gameState.addState('menu', {
  enter() { console.log('Entering menu') },
  update(dt) { /* Menu logic */ },
  render(ctx) { /* Draw menu */ },
  exit() { console.log('Exiting menu') }
})

gameState.addState('playing', {
  enter(level) { console.log('Starting level', level) },
  update(dt) { /* Game logic */ },
  render(ctx) { /* Draw game */ },
  exit() { console.log('Leaving game') }
})

gameState.setState('menu')
```

## Undo System

Allow players to undo moves:

```javascript
class UndoSystem {
  constructor(maxHistory = 50) {
    this.history = []
    this.maxHistory = maxHistory
  }
  
  saveState(state) {
    this.history.push(JSON.parse(JSON.stringify(state)))
    
    if (this.history.length > this.maxHistory) {
      this.history.shift()
    }
  }
  
  undo() {
    if (this.history.length > 1) {
      this.history.pop()  // Remove current state
      return this.history[this.history.length - 1]
    }
    return null
  }
  
  canUndo() {
    return this.history.length > 1
  }
  
  clear() {
    this.history = []
  }
}
```

## Hint System

Provide contextual hints:

```javascript
class HintSystem {
  constructor() {
    this.hintsUsed = 0
    this.maxHints = 3
  }
  
  getHint(gameState) {
    if (this.hintsUsed >= this.maxHints) {
      return { type: 'none', message: 'No more hints available' }
    }
    
    // Analyze game state and provide appropriate hint
    const hint = this.analyzeState(gameState)
    this.hintsUsed++
    
    return hint
  }
  
  analyzeState(gameState) {
    // Implement game-specific hint logic
    // Return { type: 'move'|'direction'|'concept', message: string, data?: any }
  }
  
  reset() {
    this.hintsUsed = 0
  }
}
```

## Testing Checklist

- [ ] Physics simulation is stable and accurate
- [ ] Collision detection works correctly
- [ ] Level completion conditions are clear
- [ ] Undo system works reliably
- [ ] Hint system provides useful guidance
- [ ] State transitions are smooth
- [ ] No physics glitches or tunneling

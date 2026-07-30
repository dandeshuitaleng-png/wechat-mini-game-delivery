# Casual Games

Specific guidance for match-3, bubble shooter, and casual puzzle games.

## Match-3 Mechanics

### Grid Representation

Use a 2D array for the game board:

```javascript
class Match3Board {
  constructor(rows, cols, tileTypes) {
    this.rows = rows
    this.cols = cols
    this.tileTypes = tileTypes
    this.grid = []
    
    for (let row = 0; row < rows; row++) {
      this.grid[row] = []
      for (let col = 0; col < cols; col++) {
        this.grid[row][col] = this.randomTile()
      }
    }
  }
  
  randomTile() {
    return Math.floor(Math.random() * this.tileTypes)
  }
  
  swap(row1, col1, row2, col2) {
    const temp = this.grid[row1][col1]
    this.grid[row1][col1] = this.grid[row2][col2]
    this.grid[row2][col2] = temp
  }
  
  findMatches() {
    const matches = []
    
    // Check horizontal matches
    for (let row = 0; row < this.rows; row++) {
      for (let col = 0; col < this.cols - 2; col++) {
        if (this.grid[row][col] === this.grid[row][col + 1] &&
            this.grid[row][col] === this.grid[row][col + 2]) {
          matches.push({ row, col, length: 3, direction: 'horizontal' })
        }
      }
    }
    
    // Check vertical matches
    for (let col = 0; col < this.cols; col++) {
      for (let row = 0; row < this.rows - 2; row++) {
        if (this.grid[row][col] === this.grid[row + 1][col] &&
            this.grid[row][col] === this.grid[row + 2][col]) {
          matches.push({ row, col, length: 3, direction: 'vertical' })
        }
      }
    }
    
    return matches
  }
  
  removeMatches(matches) {
    matches.forEach(match => {
      for (let i = 0; i < match.length; i++) {
        if (match.direction === 'horizontal') {
          this.grid[match.row][match.col + i] = null
        } else {
          this.grid[match.row + i][match.col] = null
        }
      }
    })
  }
  
  dropTiles() {
    for (let col = 0; col < this.cols; col++) {
      let writeRow = this.rows - 1
      
      for (let row = this.rows - 1; row >= 0; row--) {
        if (this.grid[row][col] !== null) {
          this.grid[writeRow][col] = this.grid[row][col]
          if (writeRow !== row) {
            this.grid[row][col] = null
          }
          writeRow--
        }
      }
      
      // Fill empty spaces with new tiles
      for (let row = writeRow; row >= 0; row--) {
        this.grid[row][col] = this.randomTile()
      }
    }
  }
}
```

## Animation

Use easing functions for smooth animations:

```javascript
function easeOutCubic(t) {
  return 1 - Math.pow(1 - t, 3)
}

function easeInOutQuad(t) {
  return t < 0.5 ? 2 * t * t : -1 + (4 - 2 * t) * t
}

class TileAnimation {
  constructor(tile, targetX, targetY, duration = 300) {
    this.tile = tile
    this.startX = tile.x
    this.startY = tile.y
    this.targetX = targetX
    this.targetY = targetY
    this.duration = duration
    this.elapsed = 0
  }
  
  update(deltaTime) {
    this.elapsed += deltaTime
    const t = Math.min(this.elapsed / this.duration, 1)
    const eased = easeOutCubic(t)
    
    this.tile.x = this.startX + (this.targetX - this.startX) * eased
    this.tile.y = this.startY + (this.targetY - this.startY) * eased
    
    return t >= 1  // Animation complete
  }
}
```

## Combo System

Reward consecutive matches:

```javascript
class ComboSystem {
  constructor() {
    this.combo = 0
    this.comboTimer = 0
    this.comboTimeout = 2000  // 2 seconds
  }
  
  addMatch(matchSize) {
    this.combo++
    this.comboTimer = this.comboTimeout
    
    const baseScore = matchSize * 10
    const comboMultiplier = 1 + (this.combo - 1) * 0.5
    
    return Math.floor(baseScore * comboMultiplier)
  }
  
  update(deltaTime) {
    if (this.comboTimer > 0) {
      this.comboTimer -= deltaTime
      if (this.comboTimer <= 0) {
        this.combo = 0
      }
    }
  }
  
  reset() {
    this.combo = 0
    this.comboTimer = 0
  }
}
```

## Level Progression

Gradually introduce new mechanics:

```javascript
const levelConfig = [
  { level: 1, tileTypes: 4, targetScore: 1000, moves: 20 },
  { level: 2, tileTypes: 4, targetScore: 1500, moves: 20 },
  { level: 3, tileTypes: 5, targetScore: 2000, moves: 18 },  // New tile type
  { level: 4, tileTypes: 5, targetScore: 2500, moves: 18 },
  { level: 5, tileTypes: 5, targetScore: 3000, moves: 15, obstacles: true },  // New mechanic
  // ...
]
```

## Testing Checklist

- [ ] Matches are detected correctly
- [ ] Tiles drop smoothly after matches
- [ ] Combo system rewards consecutive matches
- [ ] Level difficulty increases gradually
- [ ] Special tiles (if any) work as expected
- [ ] Score calculation is accurate
- [ ] Game over conditions are clear

# Word Puzzle Games

Specific guidance for word search, crossword, and text-based puzzle games.

## Level Data Validation

Use `scripts/audit-word-levels.js` to validate level data:

```bash
node scripts/audit-word-levels.js data/levels.json --directions 4 --expected-levels 30
```

### Direction Policy

- **4-direction (orthogonal)**: Manhattan distance = 1 (up, down, left, right only)
- **8-direction**: Chebyshev distance = 1 (includes diagonals)

Make the direction policy explicit in your game design and validate accordingly.

### Grid Validation

- Verify grid size matches letters array length (size × size)
- Check all cells contain exactly one character
- Ensure no null, undefined, or empty cells
- Validate all target paths are in-bounds and non-repeating

### Path Validation

- Verify path spells the target word exactly
- Check path adjacency follows direction policy
- Enumerate all possible paths and verify occurrence count
- When a short word is a prefix of a long word, allow deliberate path sharing

## Cultural Content Balance

- Do not make prior cultural knowledge a prerequisite for basic play
- Prefer "first character + separate slots" (e.g., `清□`) over full answers
- Use progressive help: knowledge clue → first character → direction
- Never auto-complete by default
- Reward success with a short knowledge fact
- Redact the answer from pre-answer knowledge clues
- Keep early levels forgiving and introduce modifiers gradually

## Common Patterns

### Sparse Array Handling

Fill sparse arrays with an indexed loop; `Array.prototype.forEach()` skips holes:

```javascript
// Bad: skips holes
const letters = new Array(9)
letters.forEach((_, i) => letters[i] = 'x')  // Doesn't work

// Good: indexed loop
const letters = new Array(9)
for (let i = 0; i < letters.length; i++) {
  letters[i] = 'x'
}
```

### Touch Grid Selection

When expanded grid hit regions overlap, select the cell nearest the touch point:

```javascript
function findNearestCell(touchX, touchY, cells) {
  let nearest = null
  let minDistance = Infinity
  
  cells.forEach(cell => {
    const dx = touchX - cell.centerX
    const dy = touchY - cell.centerY
    const distance = dx * dx + dy * dy
    
    if (distance < minDistance) {
      minDistance = distance
      nearest = cell
    }
  })
  
  return nearest
}
```

## Testing Checklist

- [ ] All levels validate with `audit-word-levels.js`
- [ ] Direction policy matches game design
- [ ] All target words are findable in the grid
- [ ] Hint system provides progressive help
- [ ] Knowledge cards are informative but don't spoil answers
- [ ] Difficulty curve is smooth across levels

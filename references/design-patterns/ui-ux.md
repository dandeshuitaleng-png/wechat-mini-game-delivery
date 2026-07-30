# UI/UX Design Patterns for WeChat Mini Games

Design patterns extracted from successful WeChat mini games like 跳一跳, 合成大西瓜, 羊了个羊, and others.

## First Impression: 3-Second Rule

Users decide whether to stay within 3 seconds of opening your game.

### Homepage Design

**DO:**
- Keep only core buttons (Start Game, Leaderboard)
- Use dynamic background effects (falling elements, floating clouds)
- Focus attention on the primary action
- Use high contrast for the main CTA button

**DON'T:**
- Clutter the homepage with too many options
- Use static, boring backgrounds
- Hide the start button below the fold
- Require login/registration before playing

**Example (羊了个羊):**
```
┌─────────────────────┐
│                     │
│   [Animated Logo]   │
│                     │
│  ┌───────────────┐  │
│  │  START GAME   │  │  ← Large, centered, high contrast
│  └───────────────┘  │
│                     │
│  [Leaderboard]      │  ← Secondary, smaller
│                     │
└─────────────────────┘
```

## Visual Design

### Color Palette

**Recommended: Macaron/Pastel Colors**
- Soft, gentle on the eyes for long sessions
- Examples: 薄荷绿 (#B5E8D4), 珊瑚粉 (#FFB6C1), 奶油白 (#FFF8E7)
- Lower saturation, higher brightness
- Avoid harsh, saturated colors that cause eye fatigue

**Popular Styles:**
1. **Q版国风** (Cute Chinese Style)
   - Soft colors, rounded shapes
   - Traditional elements with modern simplification
   - Example: 城主别慌张

2. **萌系** (Cute/Moe Style)
   - Big eyes, small bodies, exaggerated expressions
   - Bright, cheerful colors
   - Example: 套住那只羊

3. **像素风** (Pixel Art)
   - Retro, nostalgic feel
   - Limited color palette (8-bit or 16-bit)
   - Clear, readable at small sizes
   - Example: Various indie games

4. **剪纸风** (Paper Cut Style)
   - Chinese traditional paper cutting art
   - Flat, layered design
   - Bold outlines, solid colors
   - Example: 遗弃之地

### Layout Principles

**Icon Design:**
- Limit to < 10 icons on main screen
- Use flat design with subtle shadows
- Rounded corners (8-12px radius)
- Consistent size (64×64 or 96×96 logical pixels)
- Clear visual hierarchy

**Spacing:**
- Generous whitespace (minimum 16px between elements)
- Consistent padding (16px or 24px)
- Avoid cramped layouts

**Typography:**
- System fonts by default (PingFang SC on iOS, Noto Sans on Android)
- Large, readable sizes (minimum 14px for body text)
- High contrast ratios (4.5:1 for normal text, 3:1 for large text)

## Interaction Design

### Immediate Feedback

Every user action must have immediate visual/audio feedback:

```javascript
// Button press feedback
function onButtonPress(button) {
  // Visual feedback
  button.scale = 0.95
  button.alpha = 0.8
  
  // Audio feedback
  playSound('click.mp3')
  
  // Haptic feedback (if supported)
  wx.vibrateShort({ type: 'light' })
  
  // Reset after animation
  setTimeout(() => {
    button.scale = 1.0
    button.alpha = 1.0
  }, 100)
}
```

### Animation Timing

**Fast-paced games (action, casual):**
- Animation duration: 0.2-0.3 seconds
- Use ease-out for most animations
- Avoid long, slow animations that block gameplay

**Relaxed games (puzzle, strategy):**
- Animation duration: 0.3-0.5 seconds
- Use ease-in-out for smoother feel
- Allow players to skip animations

**Example easing functions:**
```javascript
// Fast, snappy (good for casual games)
function easeOutCubic(t) {
  return 1 - Math.pow(1 - t, 3)
}

// Smooth, gentle (good for puzzle games)
function easeInOutQuad(t) {
  return t < 0.5 ? 2 * t * t : -1 + (4 - 2 * t) * t
}
```

### Progress Visualization

Always show players their progress:

**Progress Bars:**
```javascript
// Level progress
const progress = currentLevel / totalLevels
drawProgressBar(x, y, width, height, progress)

// Score progress
const scoreProgress = currentScore / targetScore
drawCircularProgress(centerX, centerY, radius, scoreProgress)
```

**Achievement Popups:**
```javascript
// Show achievement every 5 minutes (not too frequent)
if (shouldShowAchievement()) {
  showAchievementPopup({
    title: '连续消除 10 次!',
    description: '获得 "快手达人" 称号',
    icon: 'achievement_icon.png',
    duration: 2000  // Auto-dismiss after 2 seconds
  })
}
```

## Onboarding

### Lightweight Tutorial

**DO:**
- Use semi-transparent overlay to guide first action
- Show one hint at a time
- Allow skipping after first completion
- Use visual cues (arrows, highlights) instead of text

**DON'T:**
- Force long, unskippable tutorials
- Show all features at once
- Use walls of text
- Block gameplay for extended periods

**Example:**
```javascript
class TutorialOverlay {
  constructor() {
    this.steps = [
      { target: 'startButton', hint: 'Tap to start', arrow: 'down' },
      { target: 'gameArea', hint: 'Swipe to move', arrow: 'left' },
      { target: 'pauseButton', hint: 'Pause anytime', arrow: 'up' }
    ]
    this.currentStep = 0
  }
  
  show() {
    const step = this.steps[this.currentStep]
    
    // Semi-transparent dark overlay
    ctx.fillStyle = 'rgba(0, 0, 0, 0.7)'
    ctx.fillRect(0, 0, width, height)
    
    // Highlight target area
    ctx.globalCompositeOperation = 'destination-out'
    ctx.fillRect(step.target.x, step.target.y, step.target.w, step.target.h)
    ctx.globalCompositeOperation = 'source-over'
    
    // Draw hint text and arrow
    this.drawHint(step)
  }
  
  next() {
    this.currentStep++
    if (this.currentStep >= this.steps.length) {
      this.hide()
    } else {
      this.show()
    }
  }
}
```

## Difficulty Curve

### Progressive Difficulty

**Early levels (1-10):**
- Very easy, high success rate
- Introduce one mechanic at a time
- Generous hints and forgiveness
- Build confidence

**Mid levels (11-30):**
- Gradually increase difficulty
- Combine previously learned mechanics
- Introduce new challenges
- Maintain 60-70% success rate

**Late levels (31+):**
- Challenging but fair
- Require mastery of all mechanics
- Introduce modifiers and variations
- Maintain 40-50% success rate

### "Almost There" Psychology

Keep players engaged with near-misses:

```javascript
// Show progress when player fails
function onGameOver(score, target) {
  const progress = score / target
  
  if (progress > 0.8) {
    showMessage('差一点就成功了!', '再试一次吧!')
  } else if (progress > 0.5) {
    showMessage('已经过半了!', '继续加油!')
  } else {
    showMessage('别灰心!', '再试一次!')
  }
  
  // Show visual progress
  drawProgressCircle(progress)
}
```

## Social Features

### Leaderboards

**Friend Leaderboard:**
- Show only friends by default (more engaging)
- Update in real-time
- Show "You passed 小明!" notifications
- Allow taunting/encouraging friends

**Regional Leaderboard:**
- Group by province/city (羊了个羊 style)
- Create sense of collective honor
- Encourage competition between regions

### Share Mechanics

**Effective share triggers:**
1. **Achievement**: "I just reached level 50!"
2. **Competition**: "I beat 小明's score!"
3. **Help**: "Help me unlock the next level!"
4. **Revival**: "Watch ad to revive and continue!"

**Example:**
```javascript
function shareToFriend(type) {
  const shareContent = {
    achievement: {
      title: `我在${gameName}达到了${level}关!`,
      imageUrl: 'share_achievement.png'
    },
    competition: {
      title: `我在${gameName}超过了${friendName}!`,
      imageUrl: 'share_competition.png'
    },
    help: {
      title: `帮帮我,解锁${gameName}下一关!`,
      imageUrl: 'share_help.png'
    }
  }
  
  wx.shareAppMessage({
    title: shareContent[type].title,
    imageUrl: shareContent[type].imageUrl,
    success: () => {
      // Reward player for sharing
      giveReward('share_reward')
    }
  })
}
```

## Monetization UX

### Ad Placement

**DO:**
- Only show ads at natural breakpoints (level complete, game over)
- Offer clear value (revive, extra moves, hints)
- Allow skipping after 5 seconds
- Limit frequency (max 1 ad per 3-5 minutes)

**DON'T:**
- Interrupt gameplay with ads
- Force ads without reward
- Show ads too frequently
- Make ads difficult to close

**Example:**
```javascript
function showRewardedAd(reward) {
  wx.showModal({
    title: '观看广告',
    content: `观看广告获得${reward.description}`,
    confirmText: '观看',
    cancelText: '不了',
    success: (res) => {
      if (res.confirm) {
        wx.showRewardedVideoAd({
          adUnitId: 'your-ad-unit-id',
          success: () => {
            giveReward(reward)
          },
          fail: () => {
            showMessage('广告加载失败', '请稍后再试')
          }
        })
      }
    }
  })
}
```

## Accessibility

### Color Blindness

- Don't rely solely on color to convey information
- Use icons, patterns, or text labels in addition to color
- Test with color blindness simulators

### Motor Impairments

- Large touch targets (minimum 44×44 logical pixels)
- Avoid requiring precise gestures
- Allow one-handed play
- Provide alternative input methods

### Visual Impairments

- High contrast mode option
- Adjustable text size
- Screen reader support (where possible)
- Avoid flashing content (seizure risk)

## Testing Checklist

- [ ] Homepage loads in < 3 seconds
- [ ] Main CTA is immediately visible
- [ ] All buttons have press feedback
- [ ] Animations are smooth (60 FPS)
- [ ] Tutorial is skippable
- [ ] Progress is always visible
- [ ] Difficulty curve feels fair
- [ ] Social features encourage sharing
- [ ] Ads don't disrupt gameplay
- [ ] Game is playable with one hand
- [ ] Colors are distinguishable for colorblind users

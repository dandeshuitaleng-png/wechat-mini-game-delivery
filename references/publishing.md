# Publishing Guide

Complete guide to preparing and publishing a WeChat mini game.

## Pre-Release Checklist

### Code Quality

- [ ] No console errors or warnings in Developer Tools
- [ ] All TODO comments resolved or documented
- [ ] Code follows project style guide
- [ ] No hardcoded debug values (test AppIDs, debug flags, etc.)
- [ ] All commented-out code removed or documented

### Testing

- [ ] All levels/content validated
- [ ] Tested on at least one iOS device (iPhone 8 or newer)
- [ ] Tested on at least one Android device (mid-range or better)
- [ ] All game states tested (tutorial, gameplay, pause, game over, settings)
- [ ] Edge cases tested (low memory, poor network, interruptions)
- [ ] Performance targets met (60 FPS, < 3s load time, < 100MB memory)

### Assets

- [ ] All images optimized (WebP where supported, compressed PNG/JPEG)
- [ ] All audio files < 200KB each
- [ ] No unused assets in project
- [ ] All assets properly licensed or original
- [ ] Package size < 4MB main package, < 20MB total

### Content

- [ ] All text proofread for typos and grammar
- [ ] All cultural content fact-checked and appropriate
- [ ] No copyrighted material used without permission
- [ ] Age-appropriate content rating selected
- [ ] Privacy policy and user agreement added (if collecting data)

### Configuration

- [ ] Correct AppID in `project.config.json`
- [ ] Version number updated
- [ ] Game name and description finalized
- [ ] Icon and splash screen prepared
- [ ] Category and tags selected in MP platform

## WeChat-Specific Requirements

### Account Setup

1. Register as a WeChat mini game developer at [mp.weixin.qq.com](https://mp.weixin.qq.com)
2. Complete developer verification (requires business license for companies)
3. Create a new mini game project
4. Configure game information (name, icon, description, category)

### Required Information

- **Game name**: 4-30 characters, no special symbols
- **Game icon**: 144×144px PNG, < 2MB
- **Game description**: 10-120 characters
- **Category**: Select appropriate category (puzzle, action, casual, etc.)
- **Age rating**: Select appropriate rating (everyone, teen, mature)

### Privacy and Permissions

If your game collects user data:

1. Create a privacy policy page
2. Link to privacy policy in game settings
3. Declare data collection in MP platform
4. Request user consent before collecting data

Mini games have no `app.json` — that is mini-program config, and `permission` declarations there do not apply. Request sensitive scopes at runtime instead:

```javascript
// Ask only after a user gesture, and degrade gracefully on denial
wx.authorize({
  scope: 'scope.userInfo',
  fail: () => { /* user denied; continue without the data */ }
})
```

Declare the collected data types in the MP platform's privacy section, and link the privacy policy in-game.

### Content Review

WeChat reviews all mini games before publication. Common rejection reasons:

- **Inappropriate content**: Violence, gambling, adult content
- **Copyright infringement**: Using copyrighted assets without permission
- **Misleading information**: False claims or deceptive practices
- **Poor quality**: Broken features, frequent crashes, poor performance
- **Policy violations**: Violating WeChat mini game policies

Review typically takes 1-7 days.

## Release Process

### Step 1: Prepare Release Build

1. Update version number in `project.config.json`
2. Remove all debug code and console.log statements
3. Enable code minification in Developer Tools
4. Test release build thoroughly

### Step 2: Upload to MP Platform

1. Open WeChat Developer Tools
2. Click "Upload" button
3. Enter version number and release notes
4. Upload to MP platform

### Step 3: Submit for Review

1. Log in to [mp.weixin.qq.com](https://mp.weixin.qq.com)
2. Go to "Version Management"
3. Select uploaded version
4. Click "Submit for Review"
5. Fill in review information:
   - Update description
   - Test account (if needed)
   - Special instructions

### Step 4: Monitor Review Status

1. Check review status in MP platform
2. Respond to any review feedback
3. Fix issues and resubmit if rejected

### Step 5: Release

1. Once approved, click "Release"
2. Choose release strategy:
   - **Full release**: Available to all users immediately
   - **Gradual release**: Roll out to percentage of users over time
   - **Gray release**: Release to specific user groups first

## Post-Release

### Monitor Performance

Track key metrics:

- **DAU/MAU**: Daily/monthly active users
- **Retention**: Day 1, Day 7, Day 30 retention rates
- **Crash rate**: Percentage of sessions with crashes
- **Load time**: Average time from launch to playable
- **User feedback**: Reviews and ratings

### Update Strategy

Plan regular updates:

- **Bug fixes**: Release as soon as possible
- **Content updates**: New levels, features, events
- **Performance improvements**: Optimize based on user data
- **Seasonal content**: Holiday themes, special events

### User Support

Provide support channels:

- **In-game feedback**: Allow users to report issues
- **Customer service**: Respond to user inquiries
- **FAQ**: Common questions and answers
- **Community**: WeChat group or forum for players

## Common Issues and Solutions

### Issue: Review Rejected for "Poor Quality"

**Solution**: Improve performance, fix bugs, enhance UI/UX, add more content.

### Issue: Review Rejected for "Copyright Infringement"

**Solution**: Remove copyrighted assets, use original or licensed content.

### Issue: Low User Retention

**Solution**: Improve onboarding, add tutorial, balance difficulty, add social features.

### Issue: High Crash Rate

**Solution**: Add error handling, test on more devices, fix memory leaks.

### Issue: Slow Load Time

**Solution**: Optimize assets, use subpackages, implement lazy loading.

## Resources

- [WeChat Mini Game Documentation](https://developers.weixin.qq.com/minigame/dev/guide/)
- [WeChat Mini Game Design Guidelines](https://developers.weixin.qq.com/minigame/design/)
- [WeChat Mini Game Platform Operation Rules (审核依据的运营规范)](https://developers.weixin.qq.com/minigame/product/)
- [MP Platform](https://mp.weixin.qq.com)

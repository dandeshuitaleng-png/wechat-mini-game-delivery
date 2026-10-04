const { Quiz, questions } = require('./model')
const resources = require('./resources')
const quiz = new Quiz()
const canvas = wx.createCanvas()
const ctx = canvas.getContext('2d')
const storageKey = 'book-quiz-demo:v1:best'
let width, height, top, bottom, targets = [], pressed = null
const images = {}
let muted = false
let correctSound = null
function layout() {
  const info = wx.getWindowInfo ? wx.getWindowInfo() : wx.getSystemInfoSync()
  width = info.windowWidth; height = info.windowHeight
  const ratio = info.pixelRatio || 1
  canvas.width = width * ratio; canvas.height = height * ratio
  ctx.setTransform(ratio, 0, 0, ratio, 0, 0)
  let capsule = null
  try { capsule = wx.getMenuButtonBoundingClientRect() } catch (_) {}
  top = Math.max(68, (info.safeArea ? info.safeArea.top : 0) + 20, capsule ? capsule.bottom + 16 : 0)
  bottom = height - (info.safeArea ? height - info.safeArea.bottom : 0) - 16
}
function text(value, x, y, size = 18, color = '#233f35', align = 'left') {
  ctx.fillStyle = color; ctx.font = size + 'px sans-serif'; ctx.textAlign = align
  ctx.fillText(value, x, y)
}
function lines(value, x, y, maxWidth, size = 19) {
  ctx.font = size + 'px sans-serif'
  let line = '', row = 0
  for (const char of value) {
    if (ctx.measureText(line + char).width > maxWidth && line) { text(line, x, y + row * (size + 10), size); row++; line = '' }
    line += char
  }
  text(line, x, y + row * (size + 10), size)
  return y + (row + 1) * (size + 10)
}
function button(label, y, action, variant = 'green') {
  const x = 24, w = width - 48, h = 52
  ctx.fillStyle = variant === 'green' ? '#255d49' : '#e0ebdf'
  ctx.fillRect(x, y, w, h)
  text(label, width / 2, y + 33, 17, variant === 'green' ? '#ffffff' : '#233f35', 'center')
  targets.push({ x, y, w, h, action })
}
function mascot(y) {
  if (images.mascot) { ctx.drawImage(images.mascot, width / 2 - 40, y, 80, 80); return }
  ctx.fillStyle = '#dce8ba'; ctx.fillRect(width / 2 - 40, y, 80, 64)
  text('•  •', width / 2, y + 28, 22, '#233f35', 'center')
  text('⌣', width / 2, y + 48, 22, '#233f35', 'center')
}
function render() {
  targets = []; pressed = null
  ctx.fillStyle = '#f6f2e7'; ctx.fillRect(0, 0, width, height)
  // Background must leave enough contrast behind the opaque content area.
  if (images['menu-background'] && quiz.state === 'menu') {
    const background = images['menu-background']
    const scale = Math.max(width / background.width, height / background.height)
    const w = background.width * scale, h = background.height * scale
    ctx.drawImage(background, (width - w) / 2, (height - h) / 2, w, h)
    ctx.fillStyle = '#f6f2e7'; ctx.fillRect(16, top - 20, width - 32, bottom - top + 20)
  }
  text('书屋小闯关', 24, top, 22)
  if (quiz.state === 'menu') {
    text('每天学一点，阅读更有趣', 24, top + 38, 16)
    mascot(top + 68)
    lines('五道小题，选出你的答案。答错也可以学习后继续。', 24, top + 175, width - 48, 18)
    text('最高答对 ' + quiz.best + ' / 5', 24, bottom - 145, 16)
    button(muted ? '声音：关闭' : '声音：开启', bottom - 116, () => { muted = !muted; if (correctSound) correctSound.stop() }, 'light')
    button('开始闯关', bottom - 52, () => quiz.start())
  } else if (quiz.state === 'pause') {
    text('已暂停', 24, top + 66, 26)
    lines('回到游戏后，点击继续。', 24, top + 110, width - 48)
    button('继续游戏', bottom - 52, () => quiz.resume())
  } else if (quiz.state === 'result') {
    text('本次答对 ' + quiz.score + ' / 5', 24, top + 70, 27)
    mascot(top + 100)
    lines('谢谢你爱护书屋！再玩一次，看看还能记住多少。', 24, top + 210, width - 48)
    button('再玩一次', bottom - 116, () => quiz.start())
    button('返回首页', bottom - 52, () => { quiz.state = 'menu' }, 'light')
  } else {
    text('第 ' + (quiz.index + 1) + ' / 5 题', 24, top + 36, 16)
    const q = questions[quiz.index]
    const end = lines(q.text, 24, top + 78, width - 48)
    if (quiz.state === 'question') {
      q.options.forEach((option, i) => button(option, end + 12 + i * 64, () => {
        if (quiz.answer(i) && quiz.correct && correctSound && !muted) { correctSound.stop(); correctSound.play() }
      }, 'light'))
      button('暂停', bottom - 52, () => quiz.pause())
    } else {
      text(quiz.correct ? '答对了！' : '一起记住正确答案', 24, end + 30, 21)
      lines(q.explanation, 24, end + 72, width - 48, 18)
      button(quiz.index === 4 ? '查看结果' : '下一题', bottom - 52, () => {
        quiz.next()
        if (quiz.state === 'result') { try { wx.setStorageSync(storageKey, quiz.best) } catch (_) {} }
      })
    }
  }
}
function targetAt(touch) { return targets.find(t => touch.clientX >= t.x && touch.clientX <= t.x + t.w && touch.clientY >= t.y && touch.clientY <= t.y + t.h) }
wx.onTouchStart(event => { pressed = event.touches.length === 1 ? targetAt(event.touches[0]) : null })
wx.onTouchEnd(event => {
  const start = pressed; pressed = null
  const end = event.changedTouches.length === 1 ? targetAt(event.changedTouches[0]) : null
  if (start && start === end) { start.action(); render() }
})
wx.onTouchCancel(() => { pressed = null })
wx.onHide(() => { pressed = null; quiz.pause(); if (correctSound) correctSound.stop() })
wx.onShow(() => { layout(); render() })
if (wx.onWindowResize) wx.onWindowResize(() => { layout(); render() })
try { const best = wx.getStorageSync(storageKey); if (Number.isInteger(best) && best >= 0 && best <= 5) quiz.best = best } catch (_) {}
layout(); render()
for (const [id, asset] of Object.entries(resources)) {
  if (asset.kind !== 'image') continue
  const image = wx.createImage()
  image.onload = () => { images[id] = image; render() }
  image.onerror = () => { delete images[id]; render() }
  image.src = asset.path
}

if (resources['correct-sfx'] && resources['correct-sfx'].kind === 'audio') {
  correctSound = wx.createInnerAudioContext()
  correctSound.autoplay = false
  correctSound.loop = false
  correctSound.onError(() => { correctSound.destroy(); correctSound = null })
  correctSound.src = resources['correct-sfx'].path
}

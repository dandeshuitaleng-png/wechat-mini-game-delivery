const assert = require('node:assert/strict')
const fs = require('node:fs')
const path = require('node:path')
const vm = require('node:vm')
const { Quiz, questions } = require('../examples/book-quiz/model')
const quiz = new Quiz()
quiz.start()
for (const question of questions) {
  assert.equal(quiz.answer(question.answer), true)
  assert.equal(quiz.answer(question.answer), false)
  quiz.pause(); quiz.resume(); assert.equal(quiz.state, 'feedback')
  quiz.next()
}
assert.equal(quiz.state, 'result'); assert.equal(quiz.score, 5); assert.equal(quiz.best, 5)
quiz.start(); assert.equal(quiz.score, 0); assert.equal(quiz.best, 5)
assert.equal(quiz.answer(-1), false)
for (const question of questions) { quiz.answer(1 - question.answer); quiz.next() }
assert.equal(quiz.score, 0)
for (const [width, height] of [[320, 568], [375, 667], [414, 896]]) {
  const events = {}, texts = [], buttons = []
  let imageDraws = 0, plays = 0, stops = 0, soundError
  const resources = { mascot: { kind: 'image', path: 'ai-assets/v1/images/mascot.png' }, 'menu-background': { kind: 'image', path: 'ai-assets/v1/images/menu-background.png' }, 'correct-sfx': { kind: 'audio', path: 'ai-assets/v1/audio/correct.mp3' } }
  const context = {
    setTransform() {}, fillText(value) { texts.push(value) }, measureText: s => ({ width: s.length * 19 }),
    drawImage() { imageDraws++ }, fillRect(x, y, w, h) {
      if (h === 52) { assert.ok(y >= 0 && y + h <= height, 'button within window'); buttons.push({ x, y, w, h }) }
    }
  }
  const wx = {
    createCanvas: () => ({ getContext: () => context }),
    createImage: () => ({ width: 750, height: 1334, set src(value) { this.onload() } }),
    createInnerAudioContext: () => ({ onError(fn) { soundError = fn }, play() { plays++ }, stop() { stops++ }, destroy() {} }),
    getWindowInfo: () => ({ windowWidth: width, windowHeight: height, pixelRatio: 2, safeArea: { top: 24, bottom: height - 20 } }),
    getMenuButtonBoundingClientRect: () => ({ bottom: 60 }),
    getStorageSync: () => 0, setStorageSync() {},
    onTouchStart: f => { events.start = f }, onTouchEnd: f => { events.end = f }, onTouchCancel: f => { events.cancel = f },
    onHide: f => { events.hide = f }, onShow: f => { events.show = f }
  }
  vm.runInNewContext(fs.readFileSync(path.resolve(__dirname, '../examples/book-quiz/game.js'), 'utf8'), { wx, require: name => name === './resources' ? resources : require(path.resolve(__dirname, '../examples/book-quiz', name)) })
  assert.ok(imageDraws > 0, 'Imported images render through mock loader')
  function tap(index) {
    const target = buttons[index], point = { clientX: target.x + 10, clientY: target.y + 10 }
    buttons.length = 0; texts.length = 0
    events.start({ touches: [point] }); events.end({ changedTouches: [point] })
  }
  tap(1)
  assert.ok(texts.includes('第 1 / 5 题'))
  const before = texts.length
  events.start({ touches: [{ clientX: buttons[0].x + 10, clientY: buttons[0].y + 10 }] })
  events.cancel(); events.end({ changedTouches: [{ clientX: buttons[0].x + 10, clientY: buttons[0].y + 10 }] })
  assert.equal(texts.length, before, 'Cancel prevents action')
  buttons.length = 0; events.hide(); events.show()
  assert.ok(texts.includes('已暂停')); tap(0)
  for (const question of questions) { tap(question.answer); tap(0) }
  assert.ok(texts.includes('本次答对 5 / 5'))
  assert.equal(plays, 5, 'Correct answers play imported audio')
  assert.ok(stops > 0, 'Background event stops sound')
  soundError()
  tap(0); assert.ok(texts.includes('第 1 / 5 题'))
}
console.log('Passed: score, duplicate submission, pause/resume, replay, touch cancellation and simulated full quiz at three sizes. Visual/device review remains pending.')

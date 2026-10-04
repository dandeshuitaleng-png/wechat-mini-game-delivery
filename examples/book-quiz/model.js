const questions = [
  { text: '读书时光线太暗，应该怎么做？', options: ['开灯或换到明亮的位置', '把书贴到眼前'], answer: 0, explanation: '光线充足，才能更舒适地阅读。' },
  { text: '借来的书读完后，应该怎么做？', options: ['随意放在路边', '按约定及时归还'], answer: 1, explanation: '及时归还，下一位读者也能借到。' },
  { text: '找不到想读的书，可以问谁？', options: ['书屋管理员', '不用找，直接离开'], answer: 0, explanation: '管理员可以帮助你找到合适的书。' },
  { text: '看到书页破损，应该怎么做？', options: ['撕掉这一页', '告诉管理员'], answer: 1, explanation: '交给管理员处理，可以避免继续损坏。' },
  { text: '在书屋里讨论内容，应该怎样？', options: ['轻声交流', '大声喊叫'], answer: 0, explanation: '轻声交流，给大家保留安静的阅读环境。' }
]
class Quiz {
  constructor() { this.state = 'menu'; this.best = 0; this.reset() }
  reset() { this.index = 0; this.score = 0; this.selected = null; this.correct = null }
  start() { this.reset(); this.state = 'question' }
  answer(index) {
    if (this.state !== 'question' || !Number.isInteger(index) || index < 0 || index >= questions[this.index].options.length) return false
    this.selected = index; this.correct = index === questions[this.index].answer
    if (this.correct) this.score++
    this.state = 'feedback'; return true
  }
  next() {
    if (this.state !== 'feedback') return
    this.index++; this.selected = null
    if (this.index === questions.length) { this.state = 'result'; this.best = Math.max(this.best, this.score) }
    else this.state = 'question'
  }
  pause() { if (['question', 'feedback'].includes(this.state)) { this.resumeState = this.state; this.state = 'pause' } }
  resume() { if (this.state === 'pause') this.state = this.resumeState }
}
module.exports = { Quiz, questions }

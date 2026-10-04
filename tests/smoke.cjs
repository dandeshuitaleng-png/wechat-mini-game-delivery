const assert = require('node:assert/strict')
const fs = require('node:fs')
const os = require('node:os')
const path = require('node:path')
const vm = require('node:vm')
const { spawnSync } = require('node:child_process')
const root = path.resolve(__dirname, '..')
const temp = fs.mkdtempSync(path.join(os.tmpdir(), 'wechat-skill-'))
function run(script, args) {
  return spawnSync(process.execPath, [path.join(root, 'scripts', script), ...args], { cwd: temp, encoding: 'utf8' })
}
try {
  assert.notEqual(run('init-project.js', ['invalid', '--template', 'unknown']).status, 0)
  assert.equal(fs.existsSync(path.join(temp, 'invalid')), false)
  for (const template of ['basic', 'canvas2d', 'subpackage']) {
    assert.equal(run('init-project.js', [template, '--template', template]).status, 0)
    const dir = path.join(temp, template)
    assert.equal(JSON.parse(fs.readFileSync(path.join(dir, 'project.config.json'))).projectname, template)
    assert.equal(run('validate-assets.js', [dir]).status, 0)
    assert.equal(run('init-project.js', [template]).status, 1)
  }
  const dir = path.join(temp, 'canvas2d')
  let draws = 0
  const frames = new Map()
  let frameId = 0
  let hide, show
  const ctx = { scale() {}, fillRect() {}, fillText() { draws++ } }
  const sandbox = vm.createContext({
    wx: {
      createCanvas: () => ({ getContext: () => ctx }),
      getWindowInfo: () => ({ windowWidth: 375, windowHeight: 667, pixelRatio: 2 }),
      onHide: fn => { hide = fn }, onShow: fn => { show = fn }
    },
    Date, requestAnimationFrame: fn => { const id = frameId++; frames.set(id, fn); return id },
    cancelAnimationFrame: id => frames.delete(id)
  })
  function load(file) {
    const module = { exports: {} }
    const wrapper = vm.runInContext('(function(require,module,exports){' + fs.readFileSync(file, 'utf8') + '\n})', sandbox)
    wrapper(name => load(path.resolve(path.dirname(file), name + '.js')), module, module.exports)
    return module.exports
  }
  load(path.join(dir, 'game.js'))
  assert.equal(draws, 1, 'Menu must render on startup')
  show(); show()
  assert.equal(frames.size, 1, 'Repeated foreground events must not duplicate loops, including frame ID zero')
  hide(); assert.equal(frames.size, 0)
  show(); assert.equal(frames.size, 1)
  const { SceneManager } = load(path.join(dir, 'js/scene-manager.js'))
  assert.throws(() => new SceneManager({}).loadScene('missing'), /Unknown scene/)
  fs.writeFileSync(path.join(dir, 'levels.json'), Buffer.alloc(5 * 1024 * 1024, ' '))
  const oversized = run('check-performance.js', [dir])
  assert.equal(oversized.status, 1, 'JSON must count toward package budget')
  assert.match(oversized.stdout, /exceeds 4MB budget/)
  fs.unlinkSync(path.join(dir, 'levels.json'))
  fs.mkdirSync(path.join(dir, '.git'))
  fs.writeFileSync(path.join(dir, '.git', 'large.js'), Buffer.alloc(5 * 1024 * 1024))
  assert.equal(run('check-performance.js', [dir]).status, 0, 'Git metadata must not count')
  fs.writeFileSync(path.join(dir, 'game.json'), '{')
  assert.equal(run('check-performance.js', [dir]).status, 1, 'Invalid config must fail')
  console.log('Passed: template creation, overwrite guard, scene rendering, lifecycle, package accounting and invalid config.')
} finally {
  fs.rmSync(temp, { recursive: true, force: true })
}

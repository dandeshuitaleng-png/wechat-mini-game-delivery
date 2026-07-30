#!/usr/bin/env node

/**
 * WeChat Mini Game Project Initializer
 * 
 * Creates a new WeChat mini game project with the specified template.
 * 
 * Usage:
 *   node init-project.js <project-name> [--template basic|canvas2d|subpackage]
 * 
 * Examples:
 *   node init-project.js my-game
 *   node init-project.js my-game --template canvas2d
 */

const fs = require('fs')
const path = require('path')

const TEMPLATES = {
  basic: {
    'game.js': `// Game entry point
const { Game } = require('./js/game')

// Create the instance once at startup. wx.onShow fires on every foreground
// switch, so constructing inside it would stack duplicate instances.
const game = new Game()
game.start()

wx.onShow(() => {
  game.render()
})
`,
    'game.json': JSON.stringify({
      deviceOrientation: 'portrait',
      showStatusBar: false
    }, null, 2),
    'project.config.json': JSON.stringify({
      appid: 'your-appid-here',
      projectname: 'my-game',
      setting: {
        es6: true,
        minified: true,
        postcss: true
      },
      compileType: 'game'
    }, null, 2),
    'js/game.js': `class Game {
  constructor() {
    this.canvas = wx.createCanvas()
    this.ctx = this.canvas.getContext('2d')
    // wx.getWindowInfo() replaces the deprecated wx.getSystemInfoSync() (base library 2.20.1+)
    this.systemInfo = wx.getWindowInfo ? wx.getWindowInfo() : wx.getSystemInfoSync()
    
    this.canvas.width = this.systemInfo.windowWidth * this.systemInfo.pixelRatio
    this.canvas.height = this.systemInfo.windowHeight * this.systemInfo.pixelRatio
    this.ctx.scale(this.systemInfo.pixelRatio, this.systemInfo.pixelRatio)
  }
  
  start() {
    this.render()
  }
  
  render() {
    this.ctx.fillStyle = '#ffffff'
    this.ctx.fillRect(0, 0, this.systemInfo.windowWidth, this.systemInfo.windowHeight)
    
    this.ctx.fillStyle = '#000000'
    this.ctx.font = '20px sans-serif'
    this.ctx.textAlign = 'center'
    this.ctx.fillText('Hello, WeChat Mini Game!', 
      this.systemInfo.windowWidth / 2, 
      this.systemInfo.windowHeight / 2)
  }
}

module.exports = { Game }
`
  },
  
  canvas2d: {
    'game.js': `// Game entry point with Canvas2D
const { Game } = require('./js/game')
const { SceneManager } = require('./js/scene-manager')

// Create instances once at startup; wx.onShow fires on every foreground switch.
const game = new Game()
const sceneManager = new SceneManager(game)

sceneManager.loadScene('menu')
game.start()

wx.onHide(() => {
  game.stop() // Pause the loop when backgrounded
})

wx.onShow(() => {
  game.start() // start() is idempotent; resumes the loop
})
`,
    'game.json': JSON.stringify({
      deviceOrientation: 'portrait',
      showStatusBar: false
    }, null, 2),
    'project.config.json': JSON.stringify({
      appid: 'your-appid-here',
      projectname: 'my-game',
      setting: {
        es6: true,
        minified: true,
        postcss: true
      },
      compileType: 'game'
    }, null, 2),
    'js/game.js': `class Game {
  constructor() {
    this.canvas = wx.createCanvas()
    this.ctx = this.canvas.getContext('2d')
    // wx.getWindowInfo() replaces the deprecated wx.getSystemInfoSync() (base library 2.20.1+)
    this.systemInfo = wx.getWindowInfo ? wx.getWindowInfo() : wx.getSystemInfoSync()
    
    this.canvas.width = this.systemInfo.windowWidth * this.systemInfo.pixelRatio
    this.canvas.height = this.systemInfo.windowHeight * this.systemInfo.pixelRatio
    this.ctx.scale(this.systemInfo.pixelRatio, this.systemInfo.pixelRatio)
    
    this.lastTime = 0
    this.animationId = null
  }
  
  start() {
    if (this.animationId) return // already running
    this.lastTime = Date.now()
    this.loop()
  }
  
  loop() {
    const now = Date.now()
    const deltaTime = now - this.lastTime
    this.lastTime = now
    
    this.update(deltaTime)
    this.render()
    
    this.animationId = requestAnimationFrame(() => this.loop())
  }
  
  update(deltaTime) {
    // Update game logic
  }
  
  render() {
    this.ctx.fillStyle = '#ffffff'
    this.ctx.fillRect(0, 0, this.systemInfo.windowWidth, this.systemInfo.windowHeight)
  }
  
  stop() {
    if (this.animationId) {
      cancelAnimationFrame(this.animationId)
      this.animationId = null
    }
  }
}

module.exports = { Game }
`,
    'js/scene-manager.js': `class SceneManager {
  constructor(game) {
    this.game = game
    this.scenes = {}
    this.currentScene = null
  }
  
  registerScene(name, scene) {
    this.scenes[name] = scene
  }
  
  loadScene(name, ...args) {
    if (this.currentScene && this.currentScene.exit) {
      this.currentScene.exit()
    }
    
    this.currentScene = this.scenes[name]
    
    if (this.currentScene && this.currentScene.enter) {
      this.currentScene.enter(...args)
    }
  }
  
  update(deltaTime) {
    if (this.currentScene && this.currentScene.update) {
      this.currentScene.update(deltaTime)
    }
  }
  
  render(ctx) {
    if (this.currentScene && this.currentScene.render) {
      this.currentScene.render(ctx)
    }
  }
}

module.exports = { SceneManager }
`
  },
  
  subpackage: {
    'game.js': `// Game entry point with subpackage support
const { Game } = require('./js/game')

// Create the instance once; start() is guarded so repeat calls only re-render.
const game = new Game()
game.start()

wx.onShow(() => {
  game.start()
})
`,
    'game.json': JSON.stringify({
      deviceOrientation: 'portrait',
      showStatusBar: false,
      subpackages: [
        {
          root: 'levels',
          name: 'levels',
          pages: []
        }
      ]
    }, null, 2),
    'project.config.json': JSON.stringify({
      appid: 'your-appid-here',
      projectname: 'my-game',
      setting: {
        es6: true,
        minified: true,
        postcss: true
      },
      compileType: 'game'
    }, null, 2),
    'js/game.js': `class Game {
  constructor() {
    this.canvas = wx.createCanvas()
    this.ctx = this.canvas.getContext('2d')
    // wx.getWindowInfo() replaces the deprecated wx.getSystemInfoSync() (base library 2.20.1+)
    this.systemInfo = wx.getWindowInfo ? wx.getWindowInfo() : wx.getSystemInfoSync()
    
    this.canvas.width = this.systemInfo.windowWidth * this.systemInfo.pixelRatio
    this.canvas.height = this.systemInfo.windowHeight * this.systemInfo.pixelRatio
    this.ctx.scale(this.systemInfo.pixelRatio, this.systemInfo.pixelRatio)
  }
  
  start() {
    if (this._started) {
      this.render()
      return
    }
    this._started = true
    this.loadSubpackage('levels').then(() => {
      this.render()
    })
  }
  
  loadSubpackage(name) {
    return new Promise((resolve, reject) => {
      wx.loadSubpackage({
        name,
        success: resolve,
        fail: reject
      })
    })
  }
  
  render() {
    this.ctx.fillStyle = '#ffffff'
    this.ctx.fillRect(0, 0, this.systemInfo.windowWidth, this.systemInfo.windowHeight)
  }
}

module.exports = { Game }
`
  }
}

function initProject(projectName, template = 'basic') {
  const projectDir = path.resolve(process.cwd(), projectName)
  
  if (fs.existsSync(projectDir)) {
    console.error(`Error: Directory ${projectName} already exists`)
    process.exit(1)
  }
  
  console.log(`Creating project ${projectName} with template ${template}...`)
  
  // Create project directory
  fs.mkdirSync(projectDir, { recursive: true })
  
  // Create template files
  const templateFiles = TEMPLATES[template]
  if (!templateFiles) {
    console.error(`Error: Unknown template ${template}`)
    console.error(`Available templates: ${Object.keys(TEMPLATES).join(', ')}`)
    process.exit(1)
  }
  
  Object.entries(templateFiles).forEach(([filePath, content]) => {
    const fullPath = path.join(projectDir, filePath)
    const dir = path.dirname(fullPath)
    
    if (!fs.existsSync(dir)) {
      fs.mkdirSync(dir, { recursive: true })
    }
    
    fs.writeFileSync(fullPath, content)
    console.log(`  Created ${filePath}`)
  })
  
  // Create additional directories
  const dirs = ['images', 'audio', 'js/scenes', 'js/ui', 'js/utils', 'js/data']
  dirs.forEach(dir => {
    const fullPath = path.join(projectDir, dir)
    if (!fs.existsSync(fullPath)) {
      fs.mkdirSync(fullPath, { recursive: true })
      console.log(`  Created ${dir}/`)
    }
  })
  
  console.log(`\nProject ${projectName} created successfully!`)
  console.log(`\nNext steps:`)
  console.log(`  1. cd ${projectName}`)
  console.log(`  2. Update project.config.json with your AppID`)
  console.log(`  3. Open in WeChat Developer Tools`)
  console.log(`  4. Start building your game!`)
}

// Parse arguments
const args = process.argv.slice(2)
if (args.length === 0) {
  console.error('Usage: node init-project.js <project-name> [--template basic|canvas2d|subpackage]')
  process.exit(1)
}

const projectName = args[0]
let template = 'basic'

for (let i = 1; i < args.length; i++) {
  if (args[i] === '--template' && i + 1 < args.length) {
    template = args[i + 1]
    i++
  }
}

initProject(projectName, template)

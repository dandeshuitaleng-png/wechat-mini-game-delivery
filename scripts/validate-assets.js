#!/usr/bin/env node

/**
 * WeChat Mini Game Asset Validator
 * 
 * Validates game assets (images, audio, data files) for common issues.
 * 
 * Usage:
 *   node validate-assets.js <project-dir>
 * 
 * Example:
 *   node validate-assets.js /path/to/my-game
 */

const fs = require('fs')
const path = require('path')

function validateAssets(projectDir) {
  console.log('WeChat Mini Game Asset Validator')
  console.log('='.repeat(60))
  console.log(`Project: ${projectDir}\n`)
  
  const issues = []
  const warnings = []
  
  // Check required directories
  console.log('Checking directory structure...')
  const requiredDirs = ['images', 'audio', 'js']
  requiredDirs.forEach(dir => {
    const dirPath = path.join(projectDir, dir)
    if (!fs.existsSync(dirPath)) {
      warnings.push(`Missing recommended directory: ${dir}/`)
    }
  })
  
  // Check required files
  console.log('Checking required files...')
  const requiredFiles = ['game.js', 'game.json', 'project.config.json']
  requiredFiles.forEach(file => {
    const filePath = path.join(projectDir, file)
    if (!fs.existsSync(filePath)) {
      issues.push(`Missing required file: ${file}`)
    }
  })
  
  // Validate game.json
  const gameJsonPath = path.join(projectDir, 'game.json')
  if (fs.existsSync(gameJsonPath)) {
    try {
      const gameJson = JSON.parse(fs.readFileSync(gameJsonPath, 'utf8'))
      
      if (!gameJson.deviceOrientation) {
        warnings.push('game.json: deviceOrientation not specified')
      } else if (!['portrait', 'landscape'].includes(gameJson.deviceOrientation)) {
        warnings.push(`game.json: unexpected deviceOrientation "${gameJson.deviceOrientation}" (expect portrait or landscape)`)
      }

      // Mini games render fullscreen; a `window` block is mini-program config and is ignored here
      if (gameJson.window) {
        warnings.push('game.json: "window" is mini-program config and has no effect in mini games - remove it')
      }
    } catch (err) {
      issues.push(`game.json: Invalid JSON - ${err.message}`)
    }
  }
  
  // Validate project.config.json
  const projectConfigPath = path.join(projectDir, 'project.config.json')
  if (fs.existsSync(projectConfigPath)) {
    try {
      const projectConfig = JSON.parse(fs.readFileSync(projectConfigPath, 'utf8'))
      
      if (!projectConfig.appid || projectConfig.appid === 'your-appid-here') {
        warnings.push('project.config.json: AppID not configured')
      }
      
      if (!projectConfig.projectname) {
        warnings.push('project.config.json: projectname not specified')
      }
    } catch (err) {
      issues.push(`project.config.json: Invalid JSON - ${err.message}`)
    }
  }
  
  // Check for large files
  console.log('Checking for large files...')
  const largeFiles = []
  
  function scanDir(dir) {
    const entries = fs.readdirSync(dir, { withFileTypes: true })
    
    entries.forEach(entry => {
      // node_modules is dev-only and never shipped in the game package
      if (entry.name === 'node_modules') return

      const fullPath = path.join(dir, entry.name)
      
      if (entry.isDirectory()) {
        scanDir(fullPath)
      } else {
        const size = fs.statSync(fullPath).size
        if (size > 1024 * 1024) {  // > 1MB
          largeFiles.push({ path: fullPath, size })
        }
      }
    })
  }
  
  scanDir(projectDir)
  
  if (largeFiles.length > 0) {
    console.log(`  Found ${largeFiles.length} files larger than 1MB`)
    largeFiles.forEach(file => {
      const relativePath = path.relative(projectDir, file.path)
      const sizeMB = (file.size / (1024 * 1024)).toFixed(2)
      warnings.push(`Large file: ${relativePath} (${sizeMB} MB)`)
    })
  }
  
  // Report results
  console.log('\n' + '='.repeat(60))
  console.log('RESULTS')
  console.log('='.repeat(60))
  
  if (issues.length > 0) {
    console.log('\n❌ ISSUES:')
    issues.forEach(issue => console.log(`  - ${issue}`))
  }
  
  if (warnings.length > 0) {
    console.log('\n⚠️  WARNINGS:')
    warnings.forEach(warning => console.log(`  - ${warning}`))
  }
  
  if (issues.length === 0 && warnings.length === 0) {
    console.log('\n✅ All checks passed!')
  }
  
  console.log('\n' + '='.repeat(60))
  
  return issues.length === 0
}

// Parse arguments
const args = process.argv.slice(2)
if (args.length === 0) {
  console.error('Usage: node validate-assets.js <project-dir>')
  process.exit(1)
}

const projectDir = path.resolve(args[0])
if (!fs.existsSync(projectDir)) {
  console.error(`Error: Directory ${projectDir} does not exist`)
  process.exit(1)
}

const success = validateAssets(projectDir)
process.exit(success ? 0 : 1)

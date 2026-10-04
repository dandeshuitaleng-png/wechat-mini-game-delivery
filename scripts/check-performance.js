#!/usr/bin/env node

/**
 * WeChat Mini Game Performance Checker
 * 
 * Analyzes project files and reports performance metrics and potential issues.
 * 
 * Usage:
 *   node check-performance.js <project-dir>
 * 
 * Example:
 *   node check-performance.js /path/to/my-game
 */

const fs = require('fs')
const path = require('path')

const LIMITS = {
  mainPackageSize: 4 * 1024 * 1024,      // 4MB
  totalPackageSize: 20 * 1024 * 1024,    // 20MB
  imageSize: 500 * 1024,                  // 500KB per image
  audioSize: 200 * 1024,                  // 200KB per audio file
  jsFileSize: 100 * 1024                  // 100KB per JS file
}

function formatSize(bytes) {
  if (bytes < 1024) return bytes + ' B'
  if (bytes < 1024 * 1024) return (bytes / 1024).toFixed(2) + ' KB'
  return (bytes / (1024 * 1024)).toFixed(2) + ' MB'
}

function getFileSize(filePath) {
  try {
    return fs.statSync(filePath).size
  } catch (err) {
    return 0
  }
}

function scanDirectory(dir, extensions) {
  const files = []
  
  function scan(currentDir) {
    const entries = fs.readdirSync(currentDir, { withFileTypes: true })
    
    entries.forEach(entry => {
      // node_modules is dev-only and never shipped in the game package
      if (['node_modules', '.git'].includes(entry.name)) return

      const fullPath = path.join(currentDir, entry.name)
      
      if (entry.isDirectory()) {
        scan(fullPath)
      } else if (entry.isFile() && (!extensions || extensions.some(ext => entry.name.toLowerCase().endsWith(ext)))) {
        files.push(fullPath)
      }
    })
  }
  
  scan(dir)
  return files
}

function checkPerformance(projectDir) {
  console.log('WeChat Mini Game Performance Checker')
  console.log('='.repeat(60))
  console.log(`Project: ${projectDir}\n`)
  console.log('Source estimate only: verify final package sizes in Developer Tools. Pack exclusions and build transformations are not applied; FPS, memory and load time are not measured.')
  
  const issues = []
  const warnings = []

  // Identify subpackage roots: their files count toward the total limit,
  // not toward the 4MB main-package limit
  let subpackageRoots = []
  const gameJsonPath = path.join(projectDir, 'game.json')
  try {
    const gameJson = JSON.parse(fs.readFileSync(gameJsonPath, 'utf8'))
    if (Array.isArray(gameJson.subpackages)) {
      subpackageRoots = gameJson.subpackages
        .map(sp => (sp.root || '').replace(/\/+$/, ''))
        .filter(Boolean)
    }
  } catch (err) {
    issues.push('Cannot read game.json: ' + err.message)
  }
  // Check images
  console.log('Checking images...')
  const imageFiles = scanDirectory(projectDir, ['.png', '.jpg', '.jpeg', '.webp', '.gif'])
  let totalImageSize = 0
  
  imageFiles.forEach(file => {
    const size = getFileSize(file)
    totalImageSize += size
    
    if (size > LIMITS.imageSize) {
      issues.push(`Large image: ${path.relative(projectDir, file)} (${formatSize(size)})`)
    }
  })
  
  console.log(`  Found ${imageFiles.length} images, total size: ${formatSize(totalImageSize)}`)
  
  // Check audio
  console.log('\nChecking audio...')
  const audioFiles = scanDirectory(projectDir, ['.mp3', '.aac', '.wav', '.ogg'])
  let totalAudioSize = 0
  
  audioFiles.forEach(file => {
    const size = getFileSize(file)
    totalAudioSize += size
    
    if (size > LIMITS.audioSize) {
      issues.push(`Large audio: ${path.relative(projectDir, file)} (${formatSize(size)})`)
    }
  })
  
  console.log(`  Found ${audioFiles.length} audio files, total size: ${formatSize(totalAudioSize)}`)
  
  // Check JavaScript files
  console.log('\nChecking JavaScript files...')
  const jsFiles = scanDirectory(projectDir, ['.js'])
  let totalJsSize = 0
  
  jsFiles.forEach(file => {
    const size = getFileSize(file)
    totalJsSize += size
    
    if (size > LIMITS.jsFileSize) {
      warnings.push(`Large JS file: ${path.relative(projectDir, file)} (${formatSize(size)})`)
    }
  })
  
  console.log(`  Found ${jsFiles.length} JS files, total size: ${formatSize(totalJsSize)}`)
  
  // Split main package vs subpackage sizes. Files under a subpackage root
  // count toward the total limit, not the 4MB main-package limit.
  const allAssetFiles = scanDirectory(projectDir)
    .filter(file => !['project.config.json', 'project.private.config.json'].includes(path.relative(projectDir, file)))
  const isInSubpackage = (file) => {
    const rel = path.relative(projectDir, file)
    return subpackageRoots.some(root => rel === root || rel.startsWith(root + path.sep))
  }
  const mainPackageSize = allAssetFiles
    .filter(f => !isInSubpackage(f))
    .reduce((sum, f) => sum + getFileSize(f), 0)
  const totalSize = allAssetFiles.reduce((sum, file) => sum + getFileSize(file), 0)
  console.log(`\nEstimated main package source size: ${formatSize(mainPackageSize)}`)
  console.log(`Estimated total source size (main + subpackages): ${formatSize(totalSize)}`)

  if (mainPackageSize > LIMITS.mainPackageSize) {
    issues.push(`Main package exceeds 4MB budget: ${formatSize(mainPackageSize)}`)
    warnings.push('Consider moving levels/assets into subpackages')
  }
  if (totalSize > LIMITS.totalPackageSize) {
    issues.push(`Total package exceeds 20MB target: ${formatSize(totalSize)}`)
  }
  
  // Check for common issues
  console.log('\nChecking for common issues...')
  
  // Check if game.json exists
  if (!fs.existsSync(gameJsonPath)) {
    issues.push('Missing game.json')
  }
  
  // Check if project.config.json exists
  const projectConfigPath = path.join(projectDir, 'project.config.json')
  if (!fs.existsSync(projectConfigPath)) {
    issues.push('Missing project.config.json')
  }
  
  // Check for uncompressed images
  const pngFiles = imageFiles.filter(f => f.endsWith('.png'))
  if (pngFiles.length > 10) {
    warnings.push(`Many PNG files (${pngFiles.length}). Consider using WebP or sprite sheets.`)
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
  console.error('Usage: node check-performance.js <project-dir>')
  process.exit(1)
}

const projectDir = path.resolve(args[0])
if (!fs.existsSync(projectDir)) {
  console.error(`Error: Directory ${projectDir} does not exist`)
  process.exit(1)
}

const success = checkPerformance(projectDir)
process.exit(success ? 0 : 1)

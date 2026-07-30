#!/usr/bin/env node

/**
 * WeChat Mini Game Level Data Auditor
 * 
 * Validates word puzzle level data for WeChat mini games.
 * Checks grid integrity, path validity, word matching, and occurrence counts.
 * 
 * Usage:
 *   node audit-word-levels.js <levels.json> [options]
 * 
 * Options:
 *   --directions 4|8          Movement directions (default: 4)
 *   --expected-levels N       Expected number of levels
 *   --expected-targets N      Expected total number of targets
 *   --strict                  Enable strict mode (warnings become errors)
 *   --verbose                 Show detailed progress information
 *   --fix                     Attempt to auto-fix common issues (experimental)
 * 
 * Examples:
 *   node audit-word-levels.js data/levels.json
 *   node audit-word-levels.js data/levels.json --directions 8 --expected-levels 30
 *   node audit-word-levels.js data/levels.json --strict --verbose
 */

const fs = require('fs')
const path = require('path')

// Configuration
const config = {
  directions: 4,
  expectedLevels: null,
  expectedTargets: null,
  strict: false,
  verbose: false,
  fix: false
}

// Statistics
const stats = {
  levelsChecked: 0,
  targetsChecked: 0,
  errors: [],
  warnings: [],
  fixed: []
}

/**
 * Parse command line arguments
 */
function parseArgs() {
  const args = process.argv.slice(2)
  
  if (args.length === 0 || args[0].startsWith('--')) {
    usage()
  }
  
  config.input = path.resolve(args[0])
  
  for (let i = 1; i < args.length; i++) {
    const arg = args[i]
    
    switch (arg) {
      case '--directions':
        config.directions = parseInt(args[++i], 10)
        if (![4, 8].includes(config.directions)) {
          error(`Invalid directions: ${config.directions}. Must be 4 or 8.`)
          usage()
        }
        break
        
      case '--expected-levels':
        config.expectedLevels = parseInt(args[++i], 10)
        if (!Number.isInteger(config.expectedLevels) || config.expectedLevels < 1) {
          error(`Invalid expected-levels: ${args[i]}`)
          usage()
        }
        break
        
      case '--expected-targets':
        config.expectedTargets = parseInt(args[++i], 10)
        if (!Number.isInteger(config.expectedTargets) || config.expectedTargets < 1) {
          error(`Invalid expected-targets: ${args[i]}`)
          usage()
        }
        break
        
      case '--strict':
        config.strict = true
        break
        
      case '--verbose':
        config.verbose = true
        break
        
      case '--fix':
        config.fix = true
        break
        
      default:
        error(`Unknown option: ${arg}`)
        usage()
    }
  }
}

/**
 * Print usage information and exit
 */
function usage() {
  console.error(`
Usage: node audit-word-levels.js <levels.json> [options]

Options:
  --directions 4|8          Movement directions (default: 4)
  --expected-levels N       Expected number of levels
  --expected-targets N      Expected total number of targets
  --strict                  Enable strict mode (warnings become errors)
  --verbose                 Show detailed progress information
  --fix                     Attempt to auto-fix common issues (experimental)

Examples:
  node audit-word-levels.js data/levels.json
  node audit-word-levels.js data/levels.json --directions 8 --expected-levels 30
  node audit-word-levels.js data/levels.json --strict --verbose
`)
  process.exit(2)
}

/**
 * Log an error message
 */
function error(message) {
  stats.errors.push(message)
  if (config.verbose) {
    console.error(`ERROR: ${message}`)
  }
}

/**
 * Log a warning message
 */
function warning(message) {
  stats.warnings.push(message)
  if (config.verbose) {
    console.warn(`WARNING: ${message}`)
  }
}

/**
 * Log an info message
 */
function info(message) {
  if (config.verbose) {
    console.log(`INFO: ${message}`)
  }
}

/**
 * Check if two cells are adjacent based on direction policy
 */
function isAdjacent(first, second, size) {
  const rowDistance = Math.abs(Math.floor(first / size) - Math.floor(second / size))
  const columnDistance = Math.abs((first % size) - (second % size))
  
  return config.directions === 4
    ? rowDistance + columnDistance === 1  // Manhattan distance = 1
    : Math.max(rowDistance, columnDistance) === 1  // Chebyshev distance = 1
}

/**
 * Enumerate all possible paths for a word in the grid
 */
function enumeratePaths(letters, word, size) {
  const routes = []
  const wordChars = Array.from(word)
  
  function walk(route) {
    if (route.length === wordChars.length) {
      routes.push([...route])
      return
    }
    
    const last = route[route.length - 1]
    const nextChar = wordChars[route.length]
    
    letters.forEach((letter, index) => {
      if (
        letter === nextChar &&
        !route.includes(index) &&
        isAdjacent(last, index, size)
      ) {
        walk([...route, index])
      }
    })
  }
  
  // Start from each cell matching the first character
  letters.forEach((letter, index) => {
    if (letter === wordChars[0]) {
      walk([index])
    }
  })
  
  return routes
}

/**
 * Validate a single level
 */
function validateLevel(level, levelIndex) {
  const label = `Level ${level.levelId ?? levelIndex + 1}`
  const errors = []
  const warnings = []
  
  info(`Validating ${label}...`)
  
  // Check grid size
  const size = Number(level.gridSize || Math.sqrt((level.letters || []).length))
  if (!Number.isInteger(size) || size < 2) {
    errors.push(`${label}: Invalid gridSize (${level.gridSize}). Must be an integer >= 2.`)
    return { errors, warnings }
  }
  
  // Check letters array
  const letters = level.letters
  if (!Array.isArray(letters)) {
    errors.push(`${label}: letters must be an array`)
    return { errors, warnings }
  }
  
  if (letters.length !== size * size) {
    errors.push(`${label}: Expected ${size * size} cells, found ${letters.length}`)
  }
  
  // Check for null, undefined, or multi-character cells
  letters.forEach((letter, index) => {
    if (letter === null || letter === undefined) {
      errors.push(`${label}: Cell ${index} is ${letter === null ? 'null' : 'undefined'}`)
    } else if (typeof letter !== 'string') {
      errors.push(`${label}: Cell ${index} is not a string (type: ${typeof letter})`)
    } else if (Array.from(letter).length !== 1) {
      errors.push(`${label}: Cell ${index} must contain exactly one character (found: "${letter}")`)
    } else if (letter.trim() === '') {
      errors.push(`${label}: Cell ${index} is empty or whitespace`)
    }
  })
  
  // Check targets
  const targets = level.targets
  if (!Array.isArray(targets)) {
    errors.push(`${label}: targets must be an array`)
    return { errors, warnings }
  }
  
  if (targets.length === 0) {
    warnings.push(`${label}: No targets defined`)
  }
  
  // Validate each target
  targets.forEach((target, targetIndex) => {
    const targetLabel = `${label} Target "${target.word || targetIndex + 1}"`
    
    // Check required fields
    if (!target.word) {
      errors.push(`${targetLabel}: Missing word`)
      return
    }
    
    if (!Array.isArray(target.path)) {
      errors.push(`${targetLabel}: Missing or invalid path`)
      return
    }
    
    const route = target.path
    const wordChars = Array.from(target.word)
    
    // Check path length matches word length
    if (route.length !== wordChars.length) {
      errors.push(`${targetLabel}: Path length (${route.length}) does not match word length (${wordChars.length})`)
    }
    
    // Check for duplicate cells in path
    if (new Set(route).size !== route.length) {
      errors.push(`${targetLabel}: Path reuses a cell`)
    }
    
    // Check path bounds
    if (route.some(index => !Number.isInteger(index) || index < 0 || index >= letters.length)) {
      errors.push(`${targetLabel}: Path contains out-of-range cell index`)
      return
    }
    
    // Check path spells the word
    const routedWord = route.map(index => letters[index]).join('')
    if (routedWord !== target.word) {
      errors.push(`${targetLabel}: Path spells "${routedWord}", expected "${target.word}"`)
    }
    
    // Check path adjacency
    for (let i = 1; i < route.length; i++) {
      if (!isAdjacent(route[i - 1], route[i], size)) {
        errors.push(`${targetLabel}: Path contains disallowed move from cell ${route[i - 1]} to ${route[i]}`)
        break
      }
    }
    
    // Check occurrence count
    const allPaths = enumeratePaths(letters, target.word, size)
    const expectedOccurrences = Number(target.routeOccurrenceCount || 1)
    
    if (allPaths.length !== expectedOccurrences) {
      errors.push(`${targetLabel}: Expected ${expectedOccurrences} route(s), found ${allPaths.length}`)
    }
    
    // Check knowledge card
    if ('knowledgeCard' in target) {
      if (!target.knowledgeCard || !String(target.knowledgeCard).trim()) {
        errors.push(`${targetLabel}: knowledgeCard is empty`)
      } else if (String(target.knowledgeCard).includes(target.word)) {
        warnings.push(`${targetLabel}: knowledgeCard contains the answer word`)
      }
    }
    
    // Check hint
    if ('hint' in target && target.hint && String(target.hint).includes(target.word)) {
      warnings.push(`${targetLabel}: hint contains the answer word`)
    }
    
    stats.targetsChecked++
  })
  
  stats.levelsChecked++
  return { errors, warnings }
}

/**
 * Main validation function
 */
function validate() {
  info(`Reading ${config.input}...`)
  
  // Read and parse JSON
  let payload
  try {
    const content = fs.readFileSync(config.input, 'utf8')
    payload = JSON.parse(content)
  } catch (err) {
    error(`Failed to read or parse ${config.input}: ${err.message}`)
    return false
  }
  
  // Extract levels array
  const levels = Array.isArray(payload) ? payload : payload.levels
  if (!Array.isArray(levels)) {
    error('Expected a JSON array or an object with levels[]')
    return false
  }
  
  info(`Found ${levels.length} levels`)
  
  // Validate each level
  const allErrors = []
  const allWarnings = []
  
  levels.forEach((level, index) => {
    const { errors, warnings } = validateLevel(level, index)
    allErrors.push(...errors)
    allWarnings.push(...warnings)
  })
  
  // Check expected counts
  if (config.expectedLevels !== null && levels.length !== config.expectedLevels) {
    allErrors.push(`Expected ${config.expectedLevels} levels, found ${levels.length}`)
  }
  
  if (config.expectedTargets !== null && stats.targetsChecked !== config.expectedTargets) {
    allErrors.push(`Expected ${config.expectedTargets} targets, found ${stats.targetsChecked}`)
  }
  
  // Report results
  console.log('\n' + '='.repeat(60))
  console.log('VALIDATION RESULTS')
  console.log('='.repeat(60))
  console.log(`Levels checked: ${stats.levelsChecked}`)
  console.log(`Targets checked: ${stats.targetsChecked}`)
  console.log(`Direction policy: ${config.directions}-direction`)
  console.log('')
  
  if (allWarnings.length > 0) {
    console.log(`WARNINGS (${allWarnings.length}):`)
    allWarnings.forEach(w => console.log(`  ⚠ ${w}`))
    console.log('')
  }
  
  if (allErrors.length > 0) {
    console.log(`ERRORS (${allErrors.length}):`)
    allErrors.slice(0, 100).forEach(e => console.log(`  ✗ ${e}`))
    if (allErrors.length > 100) {
      console.log(`  ... and ${allErrors.length - 100} more errors`)
    }
    console.log('')
    console.log('VALIDATION FAILED')
    return false
  }
  
  if (config.strict && allWarnings.length > 0) {
    console.log('VALIDATION FAILED (strict mode: warnings treated as errors)')
    return false
  }
  
  console.log('✓ VALIDATION PASSED')
  return true
}

// Run validation
parseArgs()
const success = validate()
process.exit(success ? 0 : 1)

#!/usr/bin/env node
const fs = require('node:fs')
const path = require('node:path')
const crypto = require('node:crypto')
function audit(report, root) {
  const errors = []
  const text = value => typeof value === 'string' && value.trim().length > 0
  if (report.schemaVersion !== 1 || !text(report.project) || !text(report.version)) errors.push('Missing report identity/version')
  const evidence = new Map()
  const checks = new Set()
  if (!Array.isArray(report.evidence) || !Array.isArray(report.checks) || !report.checks.length || !Array.isArray(report.issues)) throw new Error('Report arrays are required')
  for (const item of report.evidence) {
    if (!text(item.id) || evidence.has(item.id)) { errors.push('Invalid/duplicate evidence ID'); continue }
    evidence.set(item.id, item)
    if (item.version !== report.version) errors.push(item.id + ': evidence version mismatch')
    if (!['asset', 'design', 'wechat-simulator', 'device', 'browser-preview', 'mock'].includes(item.source) || !text(item.description)) errors.push(item.id + ': missing source/description')
    try {
      if (!text(item.path) || path.isAbsolute(item.path) || item.path.includes('\\') || item.path.split('/').some(p => !p || p === '.' || p === '..')) throw new Error('Invalid evidence path')
      const realRoot = fs.realpathSync(root)
      const realFile = fs.realpathSync(path.resolve(realRoot, item.path))
      if (!realFile.startsWith(realRoot + path.sep) || !fs.statSync(realFile).isFile()) throw new Error('Evidence escapes root or is not a file')
      const bytes = fs.readFileSync(realFile)
      if (!bytes.length) throw new Error('Empty evidence')
      const hash = crypto.createHash('sha256').update(bytes).digest('hex')
      if (hash !== item.sha256) throw new Error('Evidence hash mismatch')
    } catch (error) { errors.push(item.id + ': ' + error.message) }
  }
  for (const item of report.checks) {
    if (!text(item.id) || checks.has(item.id)) errors.push('Invalid/duplicate check ID')
    checks.add(item.id)
    if (!['style', 'asset', 'scene'].includes(item.stage) || !text(item.scope)) errors.push(item.id + ': missing stage/scope')
    if (!['pass', 'not-applicable'].includes(item.status)) errors.push(item.id + ': review incomplete or failed')
    if (!text(item.reviewer) || !text(item.notes)) errors.push(item.id + ': reviewer/notes required')
    if (!Array.isArray(item.evidence)) { errors.push(item.id + ': evidence array required'); continue }
    if (item.status !== 'not-applicable' && !item.evidence.length) errors.push(item.id + ': evidence required')
    for (const id of item.evidence) if (!evidence.has(id)) errors.push(item.id + ': unknown evidence ' + id)
  }
  for (const stage of ['style', 'asset', 'scene']) if (!report.checks.some(c => c.stage === stage)) errors.push('Missing review stage: ' + stage)
  const issueIds = new Set()
  for (const issue of report.issues) {
    if (!text(issue.id) || issueIds.has(issue.id)) errors.push('Invalid/duplicate issue ID')
    issueIds.add(issue.id)
    if (!checks.has(issue.check) || !text(issue.location) || !text(issue.description) || !['blocker', 'preference'].includes(issue.severity)) errors.push(issue.id + ': invalid issue details')
    if (!['fixed', 'accepted'].includes(issue.status)) errors.push(issue.id + ': unresolved issue')
    if (issue.severity === 'blocker' && issue.status === 'accepted') errors.push(issue.id + ': blocker cannot be accepted')
    if (!text(issue.reviewer) || !text(issue.resolution)) errors.push(issue.id + ': resolution/reviewer required')
    if (issue.status === 'fixed' && (!Array.isArray(issue.evidence) || !issue.evidence.length || issue.evidence.some(id => !evidence.has(id)))) errors.push(issue.id + ': fix evidence required')
  }
  return { passed: !errors.length, version: report.version, scope: report.checks.map(c => ({ id: c.id, stage: c.stage, scope: c.scope, status: c.status })), errors, limitation: 'Validates declared review completeness and file hashes only; does not judge visual quality, verify runtime, or prove reviewer statements.' }
}
if (require.main === module) {
  try {
    const [file, root, ...extra] = process.argv.slice(2)
    if (!file || !root || extra.length) throw new Error('Usage: node check-visual-review.js <report.json> <evidence-root>')
    const result = audit(JSON.parse(fs.readFileSync(file, 'utf8')), root)
    console.log(JSON.stringify(result, null, 2))
    if (!result.passed) process.exitCode = 1
  } catch (error) { console.error(error.message); process.exitCode = 1 }
}
module.exports = { audit }

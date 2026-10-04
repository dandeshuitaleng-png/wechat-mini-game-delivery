const assert = require('node:assert/strict')
const fs = require('node:fs')
const path = require('node:path')
const os = require('node:os')
const crypto = require('node:crypto')
const { audit } = require('../scripts/check-visual-review')
const root = fs.mkdtempSync(path.join(os.tmpdir(), 'visual-review-'))
try {
  assert.equal(audit(require('../references/visual-review-template.json'), root).passed, false)
  // Mock evidence verifies report mechanics only, never visual appearance.
  fs.writeFileSync(path.join(root, 'mock.txt'), 'mock evidence')
  const hash = crypto.createHash('sha256').update('mock evidence').digest('hex')
  const report = { schemaVersion: 1, project: 'test', version: 'v1', evidence: [{ id: 'e1', path: 'mock.txt', sha256: hash, version: 'v1', source: 'mock', description: 'Report checker fixture' }], checks: ['style', 'asset', 'scene'].map(stage => ({ id: stage, stage, scope: 'test scope', status: 'pass', reviewer: 'test', notes: 'Fixture only', evidence: ['e1'] })), issues: [] }
  assert.equal(audit(report, root).passed, true)
  report.issues = [{ id: 'i1', check: 'scene', severity: 'blocker', location: 'button', description: 'clipped', status: 'open', reviewer: '', resolution: '' }]
  assert.equal(audit(report, root).passed, false)
  Object.assign(report.issues[0], { status: 'accepted', reviewer: 'test', resolution: 'accepted' })
  assert.equal(audit(report, root).passed, false, 'Blockers cannot be accepted')
  Object.assign(report.issues[0], { status: 'fixed', evidence: ['e1'] })
  assert.equal(audit(report, root).passed, true)
  fs.writeFileSync(path.join(root, 'mock.txt'), 'changed')
  assert.equal(audit(report, root).passed, false, 'Stale evidence must fail')
  report.evidence[0].path = '../outside.txt'
  assert.equal(audit(report, root).passed, false)
  report.evidence[0].version = 'old'
  assert.equal(audit(report, root).passed, false)
  console.log('Passed: pending review, complete report, unresolved blockers, fix evidence, stale hashes and evidence confinement.')
} finally { fs.rmSync(root, { recursive: true, force: true }) }

#!/usr/bin/env node
// Offline handoff tooling. Import creates a new version bundle; never calls providers.
const fs = require('node:fs')
const path = require('node:path')
const crypto = require('node:crypto')
function fail(message) { throw new Error(message) }
function confined(root, relative) {
  if (typeof relative !== 'string' || !relative || relative.includes('\\') || path.isAbsolute(relative)) fail('Asset path must be a relative POSIX path')
  if (relative.split('/').some(part => !part || part === '.' || part === '..')) fail('Asset path must be canonical')
  const resolved = path.resolve(root, relative)
  if (!resolved.startsWith(path.resolve(root) + path.sep)) fail('Asset path escapes root: ' + relative)
  return resolved
}
function validateSpec(spec) {
  if (spec.schemaVersion !== 1) fail('schemaVersion must be 1')
  for (const field of ['title', 'coreLoop', 'style']) if (typeof spec[field] !== 'string' || !spec[field].trim()) fail('Missing ' + field)
  if (!Array.isArray(spec.acceptance) || !spec.acceptance.length || spec.acceptance.some(x => typeof x !== 'string' || !x.trim())) fail('acceptance must contain observable criteria')
  if (!Array.isArray(spec.assets) || !spec.assets.length) fail('assets must be a non-empty array')
  const ids = new Set(), paths = new Set()
  for (const asset of spec.assets) {
    if (typeof asset.id !== 'string' || !/^[a-z0-9-]+$/.test(asset.id) || ids.has(asset.id)) fail('Invalid or duplicate asset ID')
    ids.add(asset.id)
    confined('/handoff-root', asset.path)
    if (paths.has(asset.path)) fail('Duplicate asset path')
    paths.add(asset.path)
    if (!['image', 'audio', 'model'].includes(asset.kind)) fail('Invalid asset kind')
    if (typeof asset.prompt !== 'string' || !asset.prompt.trim()) fail('Missing asset prompt')
    if (!Number.isSafeInteger(asset.maxBytes) || asset.maxBytes <= 0) fail('maxBytes must be positive')
    if (asset.kind === 'image') {
      if (path.extname(asset.path).toLowerCase() !== '.png') fail('Image checks currently support PNG only')
      if (![asset.width, asset.height].every(x => Number.isSafeInteger(x) && x > 0)) fail('Image dimensions must be positive integers')
    }
  }
  return spec
}
function initialize(specFile, output) {
  const spec = validateSpec(JSON.parse(fs.readFileSync(specFile, 'utf8')))
  if (fs.existsSync(output)) fail('Output already exists; choose a new version directory')
  fs.mkdirSync(output, { recursive: true })
  const manifest = { ...spec, assets: spec.assets.map(a => ({ ...a, source: '', sourceReference: '', usageTerms: '', revision: 1, reviewed: false })) }
  fs.writeFileSync(path.join(output, 'manifest.json'), JSON.stringify(manifest, null, 2) + '\n')
  fs.writeFileSync(path.join(output, 'brief.md'), `# ${spec.title}\n\n核心循环：${spec.coreLoop}\n\n统一风格：${spec.style}\n\n## 验收条件\n\n${spec.acceptance.map(x => '- ' + x).join('\n')}\n\n先用占位素材做出可玩原型；外部 AI 输出作为待审素材。\n`)
  fs.writeFileSync(path.join(output, 'prompts.md'), '# 外部 AI 素材任务\n\n' + spec.assets.map(a => `## ${a.id}\n\n统一风格：${spec.style}\n\n${a.prompt}\n\n交付路径：${a.path}\n规格：${a.kind === 'image' ? `${a.width}×${a.height} PNG；` : ''}最多 ${a.maxBytes} 字节。\n\n沿用同一参考样板；界面文字由游戏绘制。生成后填写 manifest 中的来源、任务链接或编号、使用条款记录；人工检查后设置 reviewed。\n`).join('\n'))
  console.log('Created handoff package: ' + output)
}
function inspect(manifestFile, assetsRoot) {
  const manifest = validateSpec(JSON.parse(fs.readFileSync(manifestFile, 'utf8')))
  const realRoot = fs.realpathSync(assetsRoot)
  const results = manifest.assets.map(a => {
    const issues = []
    let bytes = null, sha256 = null
    try {
      const file = confined(realRoot, a.path)
      const realFile = fs.realpathSync(file)
      if (!realFile.startsWith(realRoot + path.sep)) fail('Symlink escapes asset root')
      if (!fs.statSync(realFile).isFile()) fail('Asset is not a regular file')
      const buffer = fs.readFileSync(realFile)
      bytes = buffer.length
      sha256 = crypto.createHash('sha256').update(buffer).digest('hex')
      if (!bytes) issues.push('Empty asset')
      if (bytes > a.maxBytes) issues.push('Exceeds byte budget')
      if (a.kind === 'image') {
        if (buffer.length < 33 || !buffer.subarray(0, 8).equals(Buffer.from([137,80,78,71,13,10,26,10])) || buffer.toString('ascii', 12, 16) !== 'IHDR') issues.push('Invalid PNG header')
        else if (buffer.readUInt32BE(16) !== a.width || buffer.readUInt32BE(20) !== a.height) issues.push('PNG dimensions mismatch')
      }
    } catch (error) { issues.push(error.message) }
    for (const field of ['source', 'sourceReference', 'usageTerms']) if (typeof a[field] !== 'string' || !a[field].trim()) issues.push('Missing ' + field)
    if (!Number.isSafeInteger(a.revision) || a.revision < 1) issues.push('Invalid revision')
    if (a.reviewed !== true) issues.push('Human review pending')
    if (a.reviewedSha256 !== undefined && a.reviewedSha256 !== sha256) issues.push('Asset changed since review')
    return { id: a.id, path: a.path, bytes, sha256, issues }
  })
  const passed = results.every(r => r.issues.length === 0)
  return { passed, evidence: 'File metadata and declared review only; PNG decoding/transparency, audio duration, model suitability, legal rights and game runtime remain unverified.', results }
}
function check(manifestFile, assetsRoot) {
  const report = inspect(manifestFile, assetsRoot)
  console.log(JSON.stringify(report, null, 2))
  if (!report.passed) process.exitCode = 1
}

function importAssets(manifestFile, assetsRoot, projectRoot, version, apply) {
  if (!version || !/^[a-z0-9][a-z0-9-]{0,63}$/.test(version)) fail('Version must be lowercase letters, digits or hyphens (1-64 characters)')
  const manifest = validateSpec(JSON.parse(fs.readFileSync(manifestFile, 'utf8')))
  const report = inspect(manifestFile, assetsRoot)
  if (!report.passed) fail('Asset checks failed: ' + JSON.stringify(report.results.filter(r => r.issues.length)))
  for (const a of manifest.assets) {
    const result = report.results.find(r => r.id === a.id)
    if (a.reviewedSha256 !== result.sha256) fail('Bind human review to current reviewedSha256 for ' + a.id)
    if (a.path === 'index.js' || a.path === 'receipt.json') fail('Reserved bundle filename: ' + a.path)
  }
  const project = fs.realpathSync(projectRoot)
  const config = JSON.parse(fs.readFileSync(path.join(project, 'project.config.json'), 'utf8'))
  if (config.compileType !== 'game') fail('Target must be a mini-game project (compileType: game)')
  if (config.miniprogramRoot && !['.', './'].includes(config.miniprogramRoot)) fail('Pass the game source root with its own project config; nested miniprogramRoot is not supported')
  const parent = path.join(project, 'ai-assets')
  if (fs.existsSync(parent) && fs.realpathSync(parent) !== parent) fail('ai-assets must not be a symlink')
  const destination = path.join(parent, version)
  if (fs.existsSync(destination)) fail('Version already exists; choose a new version')
  const plan = { mode: apply ? 'import' : 'dry-run', destination, resources: report.results.map(r => ({ id: r.id, path: 'ai-assets/' + version + '/' + r.path, sha256: r.sha256 })) }
  if (!apply) { console.log(JSON.stringify(plan, null, 2)); return }
  fs.mkdirSync(parent, { recursive: true })
  const staging = fs.mkdtempSync(path.join(parent, '.staging-'))
  try {
    // Snapshot checked bytes before publishing the bundle.
    for (const result of report.results) {
      const source = fs.realpathSync(confined(assetsRoot, result.path))
      const realRoot = fs.realpathSync(assetsRoot)
      if (!source.startsWith(realRoot + path.sep)) fail('Source escapes asset root')
      const buffer = fs.readFileSync(source)
      if (crypto.createHash('sha256').update(buffer).digest('hex') !== result.sha256) fail('Source changed during import')
      const target = confined(staging, result.path)
      fs.mkdirSync(path.dirname(target), { recursive: true })
      fs.writeFileSync(target, buffer, { flag: 'wx' })
    }
    const entries = manifest.assets.map(a => {
      const result = plan.resources.find(r => r.id === a.id)
      return [a.id, { path: result.path, kind: a.kind, revision: a.revision }]
    })
    fs.writeFileSync(path.join(staging, 'index.js'), '// Generated resource paths relative to game root.\nmodule.exports = ' + JSON.stringify(Object.fromEntries(entries), null, 2) + '\n', { flag: 'wx' })
    fs.writeFileSync(path.join(staging, 'receipt.json'), JSON.stringify({ schemaVersion: 1, importedAt: new Date().toISOString(), title: manifest.title, version, assets: manifest.assets.map(a => ({ ...a, sha256: report.results.find(r => r.id === a.id).sha256 })) }, null, 2) + '\n', { flag: 'wx' })
    if (fs.existsSync(destination)) fail('Destination appeared during import')
    fs.renameSync(staging, destination)
  } finally { fs.rmSync(staging, { recursive: true, force: true }) }
  console.log(JSON.stringify(plan, null, 2))
}
try {
  const [command, input, output, ...extra] = process.argv.slice(2)
  const usage = 'Usage: node ai-handoff.js init <spec.json> <new-output-dir> | check <manifest.json> <assets-root> | import <manifest.json> <assets-root> <project-root> <version> [--apply]'
  if (!input || !output || !['init', 'check', 'import'].includes(command)) fail(usage)
  if (command === 'import') {
    if (extra.length < 2 || extra.length > 3 || (extra.length === 3 && extra[2] !== '--apply')) fail(usage)
    importAssets(input, path.resolve(output), path.resolve(extra[0]), extra[1], extra[2] === '--apply')
  } else {
    if (extra.length) fail(usage)
    if (command === 'init') initialize(input, path.resolve(output))
    else check(input, path.resolve(output))
  }
} catch (error) { console.error(error.message); process.exitCode = 1 }

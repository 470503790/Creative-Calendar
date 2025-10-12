#!/usr/bin/env node
import { promises as fs, constants as fsConstants } from 'fs'
import path from 'path'
import { fileURLToPath } from 'url'

const __filename = fileURLToPath(import.meta.url)
const __dirname = path.dirname(__filename)
const projectRoot = path.resolve(__dirname, '..')
const pagesJsonPath = path.join(projectRoot, 'pages.json')
const pagesDir = path.join(projectRoot, 'pages')
const reportsDir = path.join(projectRoot, 'reports')
const reportPath = path.join(reportsDir, 'route-audit.json')
const backupPath = path.join(projectRoot, 'pages.backup.json')

const shouldFix = process.argv.includes('--fix')

function normalizePath(rawPath) {
  if (!rawPath)
    return ''
  let value = rawPath.trim()
  value = value.replace(/\\+/g, '/')
  value = value.replace(/\/\/+/g, '/')
  value = value.replace(/^\.\//, '')
  value = value.replace(/^\//, '')
  if (value.endsWith('.vue'))
    value = value.slice(0, -4)
  if (!value.startsWith('pages/'))
    value = `pages/${value}`
  return value
}

function guessTitle(pagePath) {
  const segments = pagePath.split('/')
  let base = segments[segments.length - 1] || ''
  if (base === 'index' && segments.length > 1)
    base = segments[segments.length - 2]
  if (!base)
    return 'Page'
  return base
    .replace(/[-_]+/g, ' ')
    .split(' ')
    .filter(Boolean)
    .map(word => word.charAt(0).toUpperCase() + word.slice(1))
    .join(' ') || 'Page'
}

async function safeReadJson(filePath) {
  try {
    const content = await fs.readFile(filePath, 'utf8')
    return JSON.parse(content)
  }
  catch (error) {
    console.error(`读取 ${filePath} 失败：`, error)
    process.exitCode = 1
    throw error
  }
}

async function collectActualPages(rootDir) {
  const results = []
  async function walk(currentDir) {
    const entries = await fs.readdir(currentDir, { withFileTypes: true })
    for (const entry of entries) {
      const absolutePath = path.join(currentDir, entry.name)
      if (entry.isDirectory()) {
        await walk(absolutePath)
        continue
      }
      if (entry.isFile() && entry.name.endsWith('.vue')) {
        const relative = path.relative(projectRoot, absolutePath).replace(/\\+/g, '/')
        results.push(relative.slice(0, -4))
      }
    }
  }

  try {
    await walk(rootDir)
  }
  catch (error) {
    if (error.code === 'ENOENT')
      return []
    throw error
  }

  return results
}

function analyseRegisteredPages(pagesConfig) {
  const registered = []
  const pagesArray = Array.isArray(pagesConfig?.pages) ? pagesConfig.pages : []
  pagesArray.forEach((page, index) => {
    const originalPath = typeof page.path === 'string' ? page.path : ''
    const normalizedPath = normalizePath(originalPath)
    registered.push({ index, originalPath, normalizedPath })
  })
  return registered
}

function detectDuplicates(registered) {
  const duplicates = []
  const conflicts = []
  const lowerCaseMap = new Map()

  for (const entry of registered) {
    const lower = entry.normalizedPath.toLowerCase()
    if (!lowerCaseMap.has(lower))
      lowerCaseMap.set(lower, [])
    lowerCaseMap.get(lower).push(entry)
  }

  for (const [_, entries] of lowerCaseMap) {
    const uniquePaths = new Set(entries.map(item => item.originalPath))
    if (uniquePaths.size > 1) {
      conflicts.push({
        normalizedPath: entries[0].normalizedPath,
        paths: entries.map(item => item.originalPath),
      })
    }
    else if (entries.length > 1) {
      duplicates.push({
        normalizedPath: entries[0].normalizedPath,
        count: entries.length,
      })
    }
  }

  return { duplicates, conflicts }
}

function buildReport({ registered, actualPages, missingPages, unregisteredPages, duplicates, conflicts }) {
  return {
    generatedAt: new Date().toISOString(),
    stats: {
      registered: registered.length,
      actual: actualPages.length,
    },
    issues: {
      unregistered: unregisteredPages,
      missing: missingPages,
      duplicates,
      conflicts,
    },
  }
}

async function ensureReportDirectory() {
  await fs.mkdir(reportsDir, { recursive: true })
}

async function backupPagesJson() {
  try {
    await fs.access(backupPath, fsConstants.F_OK)
  }
  catch {
    await fs.copyFile(pagesJsonPath, backupPath)
    return true
  }
  await fs.copyFile(pagesJsonPath, backupPath)
  return true
}

async function writePagesJson(data) {
  const json = `${JSON.stringify(data, null, 2)}\n`
  await fs.writeFile(pagesJsonPath, json, 'utf8')
}

async function main() {
  const pagesConfig = await safeReadJson(pagesJsonPath)
  const registered = analyseRegisteredPages(pagesConfig)
  const actualPages = await collectActualPages(pagesDir)

  const actualSet = new Set(actualPages.map(normalizePath))
  const registeredSet = new Set(registered.map(item => item.normalizedPath))

  const missingPages = registered
    .filter(item => !actualSet.has(item.normalizedPath))
    .map(item => ({ path: item.normalizedPath, originalPath: item.originalPath, index: item.index }))

  const unregisteredPages = actualPages
    .map(normalizePath)
    .filter(pathItem => !registeredSet.has(pathItem))
    .sort()

  const { duplicates, conflicts } = detectDuplicates(registered)

  const report = buildReport({ registered, actualPages, missingPages, unregisteredPages, duplicates, conflicts })

  console.log('📄 Route audit summary:')
  console.log(`  • Registered pages: ${registered.length}`)
  console.log(`  • Actual pages:     ${actualPages.length}`)
  console.log(`  • Unregistered:     ${unregisteredPages.length}`)
  console.log(`  • Missing files:    ${missingPages.length}`)
  console.log(`  • Duplicates:       ${duplicates.length}`)
  console.log(`  • Conflicts:        ${conflicts.length}`)

  if (shouldFix)
    await applyFixes({ pagesConfig, missingPages, unregisteredPages, report })

  await ensureReportDirectory()
  await fs.writeFile(reportPath, `${JSON.stringify(report, null, 2)}\n`, 'utf8')
  console.log(`✅ 报告已生成：${path.relative(projectRoot, reportPath)}`)

  if (!shouldFix)
    console.log('提示：使用 `--fix` 可自动修复路由配置。')
}

async function applyFixes({ pagesConfig, missingPages, unregisteredPages, report }) {
  console.log('\n🛠  正在应用自动修复...')
  await backupPagesJson()

  const pagesArray = Array.isArray(pagesConfig?.pages) ? [...pagesConfig.pages] : []
  const actions = { added: [], removed: [], normalized: [] }

  if (missingPages.length > 0) {
    const sortedMissing = [...missingPages].sort((a, b) => b.index - a.index)
    for (const missing of sortedMissing) {
      const removed = pagesArray[missing.index]
      if (removed) {
        actions.removed.push({ path: missing.originalPath, normalizedPath: missing.path })
        pagesArray.splice(missing.index, 1)
      }
    }
  }

  const seen = new Set()
  for (const [index, page] of pagesArray.entries()) {
    const originalPath = typeof page.path === 'string' ? page.path : ''
    const normalized = normalizePath(originalPath)
    if (page.path !== normalized) {
      actions.normalized.push({ from: page.path, to: normalized })
      page.path = normalized
    }
    if (seen.has(normalized))
      continue
    seen.add(normalized)
  }

  for (const pagePath of unregisteredPages) {
    if (seen.has(pagePath))
      continue
    const title = guessTitle(pagePath)
    const entry = {
      path: pagePath,
      style: {
        navigationBarTitleText: title,
      },
    }
    pagesArray.push(entry)
    actions.added.push({ path: pagePath, style: entry.style })
    seen.add(pagePath)
  }

  pagesConfig.pages = pagesArray
  await writePagesJson(pagesConfig)

  report.fix = {
    backup: path.relative(projectRoot, backupPath),
    actions,
  }

  console.log('  • 新增页面：', actions.added.length)
  console.log('  • 移除页面：', actions.removed.length)
  console.log('  • 规范路径：', actions.normalized.length)
  console.log('✅ `pages.json` 已更新，原文件备份至 pages.backup.json')
}

main().catch((error) => {
  console.error('路由审计脚本执行失败：', error)
  process.exitCode = 1
})

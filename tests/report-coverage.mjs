import { readdirSync, readFileSync } from 'fs'
import { join, resolve } from 'path'
import { fileURLToPath } from 'url'

const __filename = fileURLToPath(import.meta.url)
const __dirname = resolve(__filename, '..')
const coverageDir = resolve(__dirname, '..', 'coverage')

const files = readdirSync(coverageDir).filter((file) => file.endsWith('.json'))

const rangeCoverage = new Map()

for (const file of files) {
  const data = JSON.parse(readFileSync(join(coverageDir, file), 'utf8'))
  for (const entry of data.result ?? []) {
    const normalizedUrl = typeof entry.url === 'string' ? entry.url.split('?')[0] : ''
    if (!normalizedUrl.endsWith('apps/miniapp/stores/projects.ts')) continue
    for (const func of entry.functions ?? []) {
      for (const range of func.ranges ?? []) {
        const length = Math.max(0, (range.endOffset ?? 0) - (range.startOffset ?? 0))
        if (length === 0) continue
        const key = `${range.startOffset}:${range.endOffset}`
        const previous = rangeCoverage.get(key)
        const count = Math.max(previous?.count ?? 0, range.count ?? 0)
        rangeCoverage.set(key, { length, count })
      }
    }
  }
}

let totalBytes = 0
let coveredBytes = 0

for (const { length, count } of rangeCoverage.values()) {
  totalBytes += length
  if (count > 0) {
    coveredBytes += length
  }
}

if (totalBytes === 0) {
  throw new Error('No coverage data collected for projects store')
}

const coverageRatio = coveredBytes / totalBytes
const percentage = Math.round(coverageRatio * 10000) / 100

console.log(`Coverage for projects store: ${percentage}%`)

if (coverageRatio < 0.8) {
  throw new Error(`Coverage below threshold: ${percentage}% < 80%`)
}

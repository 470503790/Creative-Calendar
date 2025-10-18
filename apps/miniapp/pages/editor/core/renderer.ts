import type {
  CalendarLayer,
  LayerBase,
  Rect,
  Scene,
  ShapeLayer,
  TextLayer
} from './scene'
import {
  flattenLayers,
  findLayerById,
  isCalendarLayer,
  isShapeLayer,
  isTextLayer
} from './scene'
import {
  expandRect,
  getRotatedBounds,
  rectContainsPoint,
  rectIntersects,
  screenToWorld,
  unionRects,
} from '../utils/geometry'
import { generateMonth, resolveCalendarProps } from './calendar'

export type Viewport = { scale: number; tx: number; ty: number; dpr: number }
export type AlignGuide = { orientation: 'horizontal' | 'vertical'; position: number }
export type DragOverlay = { layerId: string; frame: Rect }

const HANDLE_SIZE = 12
const ROTATE_HANDLE_OFFSET = 48
const GUIDELINE_COLOR = 'rgba(112, 100, 255, 0.65)'
const SELECTION_COLOR = 'rgba(112, 100, 255, 1)'
const SELECTION_FILL = 'rgba(112, 100, 255, 0.16)'
class TextMetricsCache {
  private cache = new Map<string, number>()
  constructor(private max = 512) {}
  measure(font: string, size: number, text: string, compute: () => number) {
    const key = `${font}|${size}|${text}`
    if (this.cache.has(key)) {
      const value = this.cache.get(key)!
      this.cache.delete(key)
      this.cache.set(key, value)
      return value
    }
    const value = compute()
    this.cache.set(key, value)
    if (this.cache.size > this.max) {
      const oldest = this.cache.keys().next().value
      if (oldest !== undefined) this.cache.delete(oldest)
    }
    return value
  }
  clear() {
    this.cache.clear()
  }
}
type CalendarGridCacheEntry = {
  width: number
  height: number
  weekCount: number
  columnCount: number
  contentLeft: number
  daysTop: number
  contentWidth: number
  cellWidth: number
  lines: { x1: number; y1: number; x2: number; y2: number }[]
}
const DEFAULT_PAGE_WIDTH = 750
const DEFAULT_PAGE_HEIGHT = 1334

function drawRoundedRectPath(ctx: CanvasRenderingContext2D, x: number, y: number, w: number, h: number, radius: number) {
  const r = Math.max(0, Math.min(radius, Math.min(w, h) / 2))
  const right = x + w
  const bottom = y + h
  ctx.beginPath()
  ctx.moveTo(x + r, y)
  ctx.lineTo(right - r, y)
  ctx.quadraticCurveTo(right, y, right, y + r)
  ctx.lineTo(right, bottom - r)
  ctx.quadraticCurveTo(right, bottom, right - r, bottom)
  ctx.lineTo(x + r, bottom)
  ctx.quadraticCurveTo(x, bottom, x, bottom - r)
  ctx.lineTo(x, y + r)
  ctx.quadraticCurveTo(x, y, x + r, y)
  ctx.closePath()
}

function createHandlePath(ctx: CanvasRenderingContext2D, size: number) {
  const half = size / 2
  drawRoundedRectPath(ctx, -half, -half, size, size, Math.min(4, half))
}

function pixelRatioLineWidth(viewport: Viewport) {
  const base = 1 / Math.max(0.0001, viewport.scale)
  return Math.max(base, 1 / viewport.dpr)
}

function isFiniteNumber(value: unknown): value is number {
  return typeof value === 'number' && Number.isFinite(value)
}

function clampNumber(value: number, min: number, max: number) {
  if (value < min) return min
  if (value > max) return max
  return value
}

function cloneRect(rect: Rect): Rect {
  return { x: rect.x, y: rect.y, w: rect.w, h: rect.h }
}

const globalTarget: any =
  typeof globalThis !== 'undefined'
    ? globalThis
    : typeof window !== 'undefined'
    ? window
    : typeof global !== 'undefined'
    ? global
    : {}

const requestFrame: (callback: FrameRequestCallback) => number =
  typeof globalTarget.requestAnimationFrame === 'function'
    ? globalTarget.requestAnimationFrame.bind(globalTarget)
    : (callback: FrameRequestCallback) => setTimeout(() => callback(Date.now()), 16) as unknown as number

function applyAlpha(color: string, alpha: number) {
  if (typeof color !== 'string') return color
  const match = color.trim().match(/^#([0-9a-f]{3}|[0-9a-f]{6})$/i)
  if (!match) return color
  const raw = match[1]
  const hex = raw.length === 3 ? raw.split('').map((c) => c + c).join('') : raw
  const r = parseInt(hex.slice(0, 2), 16)
  const g = parseInt(hex.slice(2, 4), 16)
  const b = parseInt(hex.slice(4, 6), 16)
  const a = Math.max(0, Math.min(1, alpha))
  return `rgba(${r}, ${g}, ${b}, ${a})`
}

const ISO_DATE_PATTERN = /^\d{4}-\d{2}-\d{2}$/

export class Renderer {
  private scene: Scene | null = null
  private viewport: Viewport = { scale: 1, tx: 0, ty: 0, dpr: 1 }
  private ctx: CanvasRenderingContext2D | null = null
  private dirtyRects: Rect[] = []
  private rafId: number | null = null
  private readonly fullRect: Rect = { x: 0, y: 0, w: 0, h: 0 }
  private lastBboxMap = new Map<string, Rect>()
  private calendarGridCache = new Map<string, CalendarGridCacheEntry>()
  private textMetricsCache = new TextMetricsCache(512)
  private selection: string[] = []
  private guides: AlignGuide[] = []
  private dragOverlay: DragOverlay | null = null

  attach(ctx: CanvasRenderingContext2D) {
    this.ctx = ctx
    this.requestRender()
  }

  setScene(scene: Scene) {
    this.scene = scene
    this.textMetricsCache.clear()
    this.requestRender()
  }

  setViewport(v: Partial<Viewport>) {
    this.viewport = { ...this.viewport, ...v }
    this.requestRender()
  }

  getViewport(): Viewport {
    return this.viewport
  }

  setSelection(ids: string[]) {
    const next = ids.slice().sort()
    const current = this.selection.slice().sort()
    if (next.length === current.length && next.every((id, index) => id === current[index])) return
    this.selection = ids.slice()
    this.invalidateSelectionOverlay()
  }

  setGuides(guides: AlignGuide[]) {
    this.guides = guides.slice()
    this.invalidateGuidesOverlay()
  }

  setDragOverlay(overlay: DragOverlay | null) {
    this.dragOverlay = overlay ? { layerId: overlay.layerId, frame: { ...overlay.frame } } : null
    this.invalidateSelectionOverlay()
  }

  requestRender(rect?: Rect, key?: string, nextBounds?: Rect | null) {
    this.sanitizeScene()
    let target: Rect | null = rect ? cloneRect(rect) : null
    if (key) {
      const previous = this.lastBboxMap.get(key)
      if (previous) {
        target = target ? unionRects([previous, target]) ?? target : cloneRect(previous)
      }
      if (typeof nextBounds === 'undefined') {
        if (rect) this.lastBboxMap.set(key, cloneRect(rect))
        else this.lastBboxMap.delete(key)
      } else if (nextBounds) {
        this.lastBboxMap.set(key, cloneRect(nextBounds))
      } else {
        this.lastBboxMap.delete(key)
      }
    }
    if (target) this.invalidate(target)
    else this.invalidate()
  }

  render() {
    if (!this.ctx || !this.scene) return
    this.sanitizeScene()
    const { ctx } = this
    const { dpr, scale, tx, ty } = this.viewport
    const page = this.scene.project.pages[this.scene.activePageIndex]
    const canvas = ctx.canvas
    const targetW = Math.max(1, Math.floor(((canvas as any).clientWidth ?? canvas.width) * dpr))
    const targetH = Math.max(1, Math.floor(((canvas as any).clientHeight ?? canvas.height) * dpr))
    if (canvas.width !== targetW) canvas.width = targetW
    if (canvas.height !== targetH) canvas.height = targetH

    const dirty = this.dirtyRects.length ? [...this.dirtyRects] : [this.getPageBounds()]
    this.dirtyRects = []

    ctx.save()
    ctx.setTransform(dpr * scale, 0, 0, dpr * scale, dpr * tx, dpr * ty)

    for (const rect of dirty) {
      const expanded = expandRect(rect, 4)
      ctx.save()
      ctx.beginPath()
      ctx.rect(expanded.x, expanded.y, expanded.w, expanded.h)
      ctx.clip()
      ctx.clearRect(expanded.x - 2, expanded.y - 2, expanded.w + 4, expanded.h + 4)
      this.drawPage(ctx, page)
      ctx.restore()
    }
    ctx.restore()
    const layerKeys = new Set<string>()
    page.layers.forEach((layer) => {
      const bounds = getRotatedBounds(layer.frame, layer.rotate || 0)
      layerKeys.add(layer.id)
      this.lastBboxMap.set(layer.id, bounds)
    })
    Array.from(this.lastBboxMap.keys()).forEach((key) => {
      if (key.startsWith('overlay:')) return
      if (!layerKeys.has(key)) this.lastBboxMap.delete(key)
    })
    Array.from(this.calendarGridCache.keys()).forEach((key) => {
      if (!layerKeys.has(key)) this.calendarGridCache.delete(key)
    })
  }

  private drawPage(ctx: CanvasRenderingContext2D, page: Scene['project']['pages'][number]) {
    ctx.save()
    ctx.fillStyle = '#ffffff'
    ctx.fillRect(0, 0, page.width, page.height)
    for (const layer of page.layers) {
      this.drawLayer(ctx, layer as LayerBase, page)
    }
    this.drawSelection(ctx, page)
    this.drawGuides(ctx, page)
    ctx.restore()
  }

  private invalidateSelectionOverlay() {
    if (!this.scene) return
    const page = this.scene.project.pages[this.scene.activePageIndex]
    const key = 'overlay:selection'
    const rect = this.getSelectionOverlayRect(page)
    if (rect) this.requestRender(rect, key, rect)
    else if (this.lastBboxMap.has(key)) this.requestRender(undefined, key, null)
  }

  private invalidateGuidesOverlay() {
    if (!this.scene) return
    const page = this.scene.project.pages[this.scene.activePageIndex]
    const key = 'overlay:guides'
    const rect = this.getGuidesOverlayRect(page)
    if (rect) this.requestRender(rect, key, rect)
    else if (this.lastBboxMap.has(key)) this.requestRender(undefined, key, null)
  }

  private getSelectionOverlayRect(page: Scene['project']['pages'][number]): Rect | null {
    const rects: Rect[] = []
    const padding = HANDLE_SIZE
    const rotatePadding = ROTATE_HANDLE_OFFSET + HANDLE_SIZE
    const expand = (bounds: Rect) => ({
      x: bounds.x - padding,
      y: bounds.y - padding - rotatePadding,
      w: bounds.w + padding * 2,
      h: bounds.h + padding * 2 + rotatePadding,
    })
    this.selection.forEach((id) => {
      const layer = findLayerById(page, id)
      if (!layer) return
      const bounds = getRotatedBounds(layer.frame, layer.rotate || 0)
      rects.push(expand(bounds))
    })
    if (this.dragOverlay) {
      const base = findLayerById(page, this.dragOverlay.layerId)
      const rotate = base?.rotate || 0
      const bounds = getRotatedBounds(this.dragOverlay.frame, rotate)
      rects.push(expand(bounds))
    }
    return rects.length ? unionRects(rects) : null
  }

  private getGuidesOverlayRect(page: Scene['project']['pages'][number]): Rect | null {
    if (!this.guides.length) return null
    const thickness = Math.max(4, HANDLE_SIZE / 2)
    const rects = this.guides.map((guide) =>
      guide.orientation === 'vertical'
        ? { x: guide.position - thickness / 2, y: 0, w: thickness, h: page.height }
        : { x: 0, y: guide.position - thickness / 2, w: page.width, h: thickness }
    )
    return unionRects(rects)
  }

  private drawLayer(
    ctx: CanvasRenderingContext2D,
    layer: LayerBase,
    page: Scene['project']['pages'][number]
  ) {
    if (layer.hidden) return
    const frame = this.normalizeBox(layer, page)
    layer.frame = frame
    const { x, y, w, h } = frame
    ctx.save()
    ctx.translate(x + w / 2, y + h / 2)
    ctx.rotate(((layer.rotate || 0) * Math.PI) / 180)

    if (isTextLayer(layer)) this.drawTextLayer(ctx, layer)
    else if (isShapeLayer(layer)) this.drawShapeLayer(ctx, layer)
    else if (isCalendarLayer(layer)) this.drawCalendarLayer(ctx, layer)
    else if (layer.type === 'calendar-block') this.drawCalendarGrid(ctx, w, h, layer)
    else this.drawFallbackLayer(ctx, layer)

    ctx.restore()
  }

  private drawCalendarGrid(ctx: CanvasRenderingContext2D, w: number, h: number, layer: LayerBase) {
    const background = layer.props?.background || '#ffffff'
    const stroke = layer.props?.gridColor || 'rgba(31, 35, 48, 0.12)'
    const textColor = layer.props?.textColor || '#1F2330'
    const weekStart = Number.isFinite(layer.props?.weekStart)
      ? Number(layer.props?.weekStart) % 7
      : 1
    const weekdayLabels = ['日', '一', '二', '三', '四', '五', '六']
    const orderedWeekdays = weekdayLabels
      .slice(weekStart)
      .concat(weekdayLabels.slice(0, weekStart))
    const headerHeight = Math.min(Math.max(h * 0.18, 48), h * 0.28)
    const gridHeight = Math.max(0, h - headerHeight)
    const cellWidth = w / 7
    const cellHeight = gridHeight / 6

    ctx.save()
    ctx.fillStyle = background
    ctx.fillRect(-w / 2, -h / 2, w, h)

    // Weekday labels
    ctx.fillStyle = textColor
    ctx.textAlign = 'center'
    ctx.textBaseline = 'middle'
    ctx.font = `500 ${Math.max(12, Math.min(22, headerHeight * 0.35))}px 'PingFang SC'`
    orderedWeekdays.forEach((label, index) => {
      const centerX = -w / 2 + cellWidth * index + cellWidth / 2
      const centerY = -h / 2 + headerHeight / 2
      ctx.fillText(label, centerX, centerY)
    })

    // Grid lines
    ctx.strokeStyle = stroke
    ctx.lineWidth = Math.max(1, Math.min(2, Math.min(w, h) * 0.0025))
    ctx.beginPath()
    for (let row = 0; row <= 6; row++) {
      const y = -h / 2 + headerHeight + row * cellHeight
      ctx.moveTo(-w / 2, y)
      ctx.lineTo(w / 2, y)
    }
    for (let col = 0; col <= 7; col++) {
      const x = -w / 2 + col * cellWidth
      ctx.moveTo(x, -h / 2 + headerHeight)
      ctx.lineTo(x, -h / 2 + headerHeight + 6 * cellHeight)
    }
    ctx.stroke()

    // Date placeholders
    ctx.fillStyle = textColor
    ctx.font = `400 ${Math.max(10, Math.min(20, cellHeight * 0.35))}px 'PingFang SC'`
    let day = 1
    for (let row = 0; row < 6; row++) {
      for (let col = 0; col < 7; col++) {
        const centerX = -w / 2 + col * cellWidth + cellWidth / 2
        const centerY = -h / 2 + headerHeight + row * cellHeight + cellHeight / 2
        ctx.fillText(String(day), centerX, centerY)
        day += 1
      }
    }
    ctx.restore()
  }

  private drawTextLayer(ctx: CanvasRenderingContext2D, layer: TextLayer) {
    const props = layer.props || {
      text: '',
      fontFamily: 'PingFang SC',
      fontSize: 24,
      fontWeight: '400',
      lineHeight: 1.4,
      letterSpacing: 0,
      align: 'left' as CanvasTextAlign,
      color: '#1F2330',
    }
    const text = props.text ?? ''
    const lines = text.split(/\n/g)
    const fontSize = props.fontSize ?? 24
    const lineHeight = Math.max(1, props.lineHeight ?? 1.4) * fontSize
    ctx.fillStyle = props.color || '#1F2330'
    ctx.textBaseline = 'top'
    ctx.textAlign = props.align || 'left'
    ctx.font = `${props.fontWeight || '400'} ${fontSize}px ${props.fontFamily || 'PingFang SC'}`

    const horizontal = ctx.textAlign === 'center' ? 0 : ctx.textAlign === 'right' ? layer.frame.w / 2 : -layer.frame.w / 2
    let cursorY = -layer.frame.h / 2

    for (const line of lines) {
      if (!line) {
        cursorY += lineHeight
        continue
      }
      if (props.letterSpacing && props.letterSpacing !== 0) {
        let offsetX = horizontal
        const spacing = props.letterSpacing
        for (const char of line) {
          ctx.fillText(char, offsetX, cursorY)
          const charWidth = this.textMetricsCache.measure(
            ctx.font,
            fontSize,
            char,
            () => ctx.measureText(char).width
          )
          offsetX += charWidth + spacing
        }
      } else {
        ctx.fillText(line, horizontal, cursorY)
      }
      cursorY += lineHeight
    }
  }

  private drawShapeLayer(ctx: CanvasRenderingContext2D, layer: ShapeLayer) {
    const props = layer.props || {
      fill: '#F0F0F0',
      stroke: '#CCCCCC',
      strokeWidth: 2,
      radius: 12,
    }
    const { w, h } = layer.frame
    const radius = props.radius ?? 0
    drawRoundedRectPath(ctx, -w / 2, -h / 2, w, h, radius)
    ctx.fillStyle = props.fill || '#F0F0F0'
    ctx.fill()
    if (props.stroke && props.strokeWidth) {
      ctx.lineWidth = props.strokeWidth
      ctx.strokeStyle = props.stroke
      ctx.stroke()
    }
  }

  private drawCalendarLayer(ctx: CanvasRenderingContext2D, layer: CalendarLayer) {
    const props = resolveCalendarProps(layer.props)
    const { w, h } = layer.frame
    const { theme } = props

    const monthData = generateMonth(props.year, props.month, props.weekStart)

    drawRoundedRectPath(ctx, -w / 2, -h / 2, w, h, props.radius)
    ctx.fillStyle = theme.background
    ctx.fill()

    const headerHeight = Math.min(Math.max(h * 0.18, 80), h * 0.35)
    ctx.save()
    ctx.beginPath()
    const radius = Math.min(props.radius, Math.min(w, h) / 2)
    ctx.moveTo(-w / 2 + radius, -h / 2)
    ctx.lineTo(w / 2 - radius, -h / 2)
    ctx.quadraticCurveTo(w / 2, -h / 2, w / 2, -h / 2 + radius)
    ctx.lineTo(w / 2, -h / 2 + headerHeight)
    ctx.lineTo(-w / 2, -h / 2 + headerHeight)
    ctx.lineTo(-w / 2, -h / 2 + radius)
    ctx.quadraticCurveTo(-w / 2, -h / 2, -w / 2 + radius, -h / 2)
    ctx.closePath()
    ctx.fillStyle = theme.headerBackground
    ctx.fill()
    ctx.restore()

    ctx.fillStyle = theme.headerText
    ctx.textBaseline = 'middle'
    ctx.textAlign = 'left'
    const titleFontSize = Math.min(56, Math.max(32, h * 0.08))
    ctx.font = `600 ${titleFontSize}px 'PingFang SC'`
    const paddingX = props.padding
    ctx.fillText(`${props.year} 年 ${props.month} 月`, -w / 2 + paddingX, -h / 2 + headerHeight / 2)

    const captionFontSize = Math.min(28, Math.max(20, h * 0.04))
    ctx.font = `400 ${captionFontSize}px 'PingFang SC'`
    ctx.fillStyle = theme.secondaryText
    const caption = `共 ${monthData.weeks.length} 周`
    ctx.fillText(caption, -w / 2 + paddingX, -h / 2 + headerHeight / 2 + captionFontSize)

    const contentTop = -h / 2 + headerHeight + props.padding * 0.5
    const contentLeft = -w / 2 + props.padding
    const contentWidth = w - props.padding * 2
    const weekLabelHeight = Math.min(48, Math.max(32, h * 0.055))
    const daysTop = contentTop + weekLabelHeight + props.padding * 0.15
    const availableHeight = h / 2 - props.padding - daysTop
    const weekCount = monthData.weeks.length
    const columnCount = props.showWeekNumber ? 8 : 7
    const dayColumnOffset = props.showWeekNumber ? 1 : 0
    const cellHeight = availableHeight / Math.max(1, weekCount)
    const cellWidth = contentWidth / Math.max(1, columnCount)

    ctx.save()
    ctx.fillStyle = theme.secondaryText
    ctx.font = `500 ${captionFontSize}px 'PingFang SC'`
    ctx.textAlign = 'center'
    ctx.textBaseline = 'middle'
    if (props.showWeekNumber) {
      const labelX = contentLeft + cellWidth / 2
      ctx.fillStyle = theme.secondaryText
      ctx.fillText('周', labelX, contentTop + weekLabelHeight / 2)
    }

    monthData.weekdays.forEach((weekday, index) => {
      const x = contentLeft + cellWidth * (index + dayColumnOffset) + cellWidth / 2
      const isWeekend = weekday.index === 0 || weekday.index === 6
      ctx.fillStyle = isWeekend ? theme.weekendText : theme.secondaryText
      ctx.fillText(weekday.label, x, contentTop + weekLabelHeight / 2)
    })
    ctx.restore()

    const cacheKey = layer.id
    const cached = this.calendarGridCache.get(cacheKey)
    const matches =
      cached &&
      cached.width === w &&
      cached.height === h &&
      cached.weekCount === weekCount &&
      cached.columnCount === columnCount &&
      cached.contentLeft === contentLeft &&
      cached.daysTop === daysTop &&
      cached.contentWidth === contentWidth &&
      cached.cellWidth === cellWidth
    let lines = cached?.lines
    if (!matches || !lines) {
      lines = []
      for (let row = 0; row <= weekCount; row++) {
        const y = daysTop + row * cellHeight
        lines.push({ x1: contentLeft, y1: y, x2: contentLeft + contentWidth, y2: y })
      }
      const gridHeight = cellHeight * weekCount
      for (let col = 0; col <= columnCount; col++) {
        const x = contentLeft + col * cellWidth
        lines.push({ x1: x, y1: daysTop, x2: x, y2: daysTop + gridHeight })
      }
      this.calendarGridCache.set(cacheKey, {
        width: w,
        height: h,
        weekCount,
        columnCount,
        contentLeft,
        daysTop,
        contentWidth,
        cellWidth,
        lines,
      })
    }
    ctx.save()
    ctx.lineWidth = Math.max(1, 1 / this.viewport.scale)
    ctx.strokeStyle = theme.grid
    lines.forEach((line) => {
      ctx.beginPath()
      ctx.moveTo(line.x1, line.y1)
      ctx.lineTo(line.x2, line.y2)
      ctx.stroke()
    })
    ctx.restore()

    const holidaySet = new Set(props.holidays || [])
    const showHolidayBadge = props.showHolidays !== false
    const highlightWeekend = props.highlightWeekend !== false
    const highlightToday = props.highlightToday !== false
    const highlightHolidays = props.highlightHolidays !== false
    const highlightTokens = props.highlightExpression
      ? props.highlightExpression
          .split(',')
          .map((token) => token.trim())
          .filter(Boolean)
      : []

    monthData.weeks.forEach((week, rowIndex) => {
      let weekNumber = week[0]?.isoWeek ?? 0
      if (props.showWeekNumber) {
        const reference = week.find((day) => day.monthOffset === 0) ?? week[0]
        weekNumber = reference?.isoWeek ?? weekNumber
        ctx.save()
        ctx.textAlign = 'center'
        ctx.textBaseline = 'middle'
        ctx.font = `500 ${Math.max(20, cellHeight * 0.32)}px 'DIN Alternate'`
        ctx.fillStyle = theme.secondaryText
        ctx.fillText(String(weekNumber).padStart(2, '0'), contentLeft + cellWidth / 2, daysTop + rowIndex * cellHeight + cellHeight / 2)
        ctx.restore()
      }

      week.forEach((day, columnIndex) => {
        const cellX = contentLeft + (columnIndex + dayColumnOffset) * cellWidth
        const cellY = daysTop + rowIndex * cellHeight
        const textX = cellX + cellWidth / 2
        const numberY = cellY + cellHeight * (props.showLunar || props.showSolarTerm || props.showFestivals ? 0.38 : 0.5)
        const labelY = cellY + cellHeight * 0.72
        const isHoliday = holidaySet.has(day.isoDate)

        if (highlightWeekend && day.isWeekend && day.monthOffset === 0) {
          const inset = Math.min(cellWidth, cellHeight) * 0.12
          ctx.save()
          drawRoundedRectPath(ctx, cellX + inset, cellY + inset, cellWidth - inset * 2, cellHeight - inset * 2, Math.min(12, (cellHeight - inset * 2) / 2))
          ctx.fillStyle = applyAlpha(theme.weekendText, 0.12)
          ctx.fill()
          ctx.restore()
        }

        const matchesCustom = highlightTokens.some((token) => {
          if (!token) return false
          if (token.toLowerCase() === 'weekend') return day.isWeekend
          if (token.toLowerCase() === 'today') return day.isToday
          if (token.startsWith('weekday=')) {
            const value = Number(token.slice(8))
            if (Number.isFinite(value)) return day.weekday === ((value % 7) + 7) % 7
          }
          if (token.startsWith('lunar=')) {
            const name = token.slice(6)
            return name ? day.lunar.lunarDayName === name || day.lunar.lunarMonthName === name : false
          }
          if (token.startsWith('festival=')) {
            const name = token.slice(9)
            return name ? day.festivals.includes(name) : false
          }
          if (ISO_DATE_PATTERN.test(token)) return day.isoDate === token
          return false
        })

        if (highlightToday && day.isToday && day.monthOffset === 0) {
          const inset = Math.min(cellWidth, cellHeight) * 0.2
          const radius = Math.min(18, inset)
          ctx.save()
          drawRoundedRectPath(
            ctx,
            cellX + inset / 2,
            cellY + inset / 2,
            cellWidth - inset,
            cellHeight - inset,
            radius
          )
          ctx.fillStyle = theme.todayBackground
          ctx.fill()
          ctx.restore()
        }

        if (highlightHolidays && isHoliday && day.monthOffset === 0) {
          const inset = Math.min(cellWidth, cellHeight) * 0.08
          ctx.save()
          drawRoundedRectPath(
            ctx,
            cellX + inset,
            cellY + inset,
            cellWidth - inset * 2,
            cellHeight - inset * 2,
            Math.min(12, (cellHeight - inset * 2) / 2)
          )
          ctx.lineWidth = Math.max(1, 2 / this.viewport.scale)
          ctx.strokeStyle = applyAlpha(theme.holidayBadgeBackground, 0.9)
          ctx.stroke()
          ctx.restore()
        }

        if (matchesCustom) {
          const inset = Math.min(cellWidth, cellHeight) * 0.12
          ctx.save()
          drawRoundedRectPath(
            ctx,
            cellX + inset,
            cellY + inset,
            cellWidth - inset * 2,
            cellHeight - inset * 2,
            Math.min(14, (cellHeight - inset * 2) / 2)
          )
          ctx.setLineDash([6, 6])
          ctx.lineWidth = Math.max(1, 1 / this.viewport.scale)
          ctx.strokeStyle = applyAlpha(theme.todayBackground, 0.5)
          ctx.stroke()
          ctx.restore()
        }

        ctx.save()
        ctx.font = `600 ${Math.min(48, Math.max(28, cellHeight * 0.42))}px 'DIN Alternate'`
        ctx.textAlign = 'center'
        ctx.textBaseline = 'middle'
        if (day.monthOffset === 0) ctx.fillStyle = day.isWeekend ? theme.weekendText : theme.text
        else ctx.fillStyle = `${theme.secondaryText}CC`
        ctx.fillText(String(day.display), textX, numberY)
        ctx.restore()

        let secondaryLabel = ''
        if (props.showFestivals && day.festivals.length) secondaryLabel = day.festivals[0]
        else if (props.showSolarTerm && day.solarTerm) secondaryLabel = day.solarTerm
        else if (props.showLunar) {
          secondaryLabel = day.lunar.lunarDay === 1
            ? `${day.lunar.isLeapMonth ? '闰' : ''}${day.lunar.lunarMonthName}`
            : day.lunar.lunarDayName
        }

        if (secondaryLabel) {
          ctx.save()
          ctx.font = `400 ${Math.min(26, Math.max(18, cellHeight * 0.28))}px 'PingFang SC'`
          ctx.textAlign = 'center'
          ctx.textBaseline = 'middle'
          if (day.monthOffset === 0) ctx.fillStyle = theme.secondaryText
          else ctx.fillStyle = applyAlpha(theme.secondaryText, 0.6)
          ctx.fillText(secondaryLabel, textX, labelY)
          ctx.restore()
        }

        if (showHolidayBadge && isHoliday) {
          ctx.save()
          ctx.fillStyle = theme.holidayBadgeBackground
          const badgeWidth = Math.min(36, cellWidth * 0.3)
          const badgeHeight = Math.min(20, cellHeight * 0.22)
          const badgeX = cellX + cellWidth - badgeWidth - 6
          const badgeY = cellY + 6
          drawRoundedRectPath(ctx, badgeX, badgeY, badgeWidth, badgeHeight, 6)
          ctx.fill()
          ctx.fillStyle = theme.holidayBadgeText
          ctx.font = `500 ${Math.max(16, badgeHeight * 0.7)}px 'PingFang SC'`
          ctx.textAlign = 'center'
          ctx.textBaseline = 'middle'
          ctx.fillText('假', badgeX + badgeWidth / 2, badgeY + badgeHeight / 2)
          ctx.restore()
        }
      })
    })
  }

  private drawFallbackLayer(ctx: CanvasRenderingContext2D, layer: LayerBase) {
    const { w, h } = layer.frame
    ctx.fillStyle = '#E7E9F2'
    ctx.fillRect(-w / 2, -h / 2, w, h)
    ctx.fillStyle = '#9599B0'
    ctx.textAlign = 'center'
    ctx.textBaseline = 'middle'
    ctx.font = '500 24px "PingFang SC"'
    ctx.fillText(layer.type, 0, 0)
  }

  private drawSelection(ctx: CanvasRenderingContext2D, page: Scene['project']['pages'][number]) {
    if (!this.selection.length && !this.dragOverlay) return
    const layers = flattenLayers(page.layers)
    const targets: LayerBase[] = []

    this.selection.forEach((id) => {
      const layer = layers.find((item) => item.id === id)
      if (layer) targets.push(layer)
    })

    if (this.dragOverlay) {
      const layer = findLayerById(page, this.dragOverlay.layerId)
      if (layer) {
        const ghost = { ...layer, frame: { ...this.dragOverlay.frame } } as LayerBase
        targets.push(ghost)
      }
    }

    if (!targets.length) return

    const lw = pixelRatioLineWidth(this.viewport)

    targets.forEach((layer) => {
      const { w, h } = layer.frame
      const angle = (layer.rotate || 0) * (Math.PI / 180)
      ctx.save()
      ctx.translate(layer.frame.x + w / 2, layer.frame.y + h / 2)
      ctx.rotate(angle)

      ctx.lineWidth = lw
      ctx.strokeStyle = SELECTION_COLOR
      ctx.fillStyle = SELECTION_FILL
      ctx.beginPath()
      ctx.rect(-w / 2, -h / 2, w, h)
      ctx.fill()
      ctx.stroke()

      const handles: { x: number; y: number }[] = [
        { x: -w / 2, y: -h / 2 },
        { x: 0, y: -h / 2 },
        { x: w / 2, y: -h / 2 },
        { x: -w / 2, y: 0 },
        { x: w / 2, y: 0 },
        { x: -w / 2, y: h / 2 },
        { x: 0, y: h / 2 },
        { x: w / 2, y: h / 2 },
      ]

      ctx.fillStyle = '#ffffff'
      ctx.strokeStyle = SELECTION_COLOR
      handles.forEach((point) => {
        ctx.save()
        ctx.translate(point.x, point.y)
        ctx.beginPath()
        createHandlePath(ctx, HANDLE_SIZE)
        ctx.fill()
        ctx.stroke()
        ctx.restore()
      })

      // rotation handle placeholder
      ctx.beginPath()
      ctx.moveTo(0, -h / 2)
      ctx.lineTo(0, -h / 2 - ROTATE_HANDLE_OFFSET + HANDLE_SIZE / 2)
      ctx.stroke()
      ctx.save()
      ctx.translate(0, -h / 2 - ROTATE_HANDLE_OFFSET)
      ctx.beginPath()
      ctx.arc(0, 0, HANDLE_SIZE / 2 + 2, 0, Math.PI * 2)
      ctx.fill()
      ctx.stroke()
      ctx.restore()

      ctx.restore()
    })
  }

  private drawGuides(ctx: CanvasRenderingContext2D, page: Scene['project']['pages'][number]) {
    if (!this.guides.length) return
    const lw = pixelRatioLineWidth(this.viewport)
    ctx.save()
    ctx.lineWidth = lw
    ctx.strokeStyle = GUIDELINE_COLOR
    ctx.setLineDash([12, 12])
    const width = page.width
    const height = page.height
    this.guides.forEach((guide) => {
      ctx.beginPath()
      if (guide.orientation === 'vertical') {
        ctx.moveTo(guide.position, 0)
        ctx.lineTo(guide.position, height)
      } else {
        ctx.moveTo(0, guide.position)
        ctx.lineTo(width, guide.position)
      }
      ctx.stroke()
    })
    ctx.restore()
  }

  hitTest(sx: number, sy: number): string | null {
    if (!this.scene || !this.ctx) return null
    const page = this.scene.project.pages[this.scene.activePageIndex]
    const { x, y } = screenToWorld(sx, sy, this.viewport)
    for (let i = page.layers.length - 1; i >= 0; i--) {
      const layer = page.layers[i]
      if (layer.hidden || layer.locked) continue
      const bounds = getRotatedBounds(layer.frame, layer.rotate || 0)
      if (rectContainsPoint(bounds, x, y)) return layer.id
    }
    return null
  }

  invalidate(rect?: Rect) {
    if (!rect) {
      this.dirtyRects = [this.getPageBounds()]
    } else {
      const existingIndex = this.dirtyRects.findIndex((item) => rectIntersects(item, rect))
      if (existingIndex >= 0) {
        const merged = unionRects([this.dirtyRects[existingIndex], rect])
        if (merged) this.dirtyRects[existingIndex] = merged
      } else {
        this.dirtyRects.push(rect)
      }
    }
    if (this.rafId != null) return
    const cb = (timestamp?: number) => {
      this.rafId = null
      this.render()
    }
    this.rafId = requestFrame(cb)
  }

  getPageBounds(): Rect {
    if (!this.scene) return { ...this.fullRect }
    const page = this.scene.project.pages[this.scene.activePageIndex]
    return { x: 0, y: 0, w: page.width, h: page.height }
  }

  getLayerBounds(layerId: string): Rect | null {
    if (!this.scene) return null
    const page = this.scene.project.pages[this.scene.activePageIndex]
    const layer = page.layers.find((item) => item.id === layerId)
    if (!layer) return null
    return getRotatedBounds(layer.frame, layer.rotate || 0)
  }

  private sanitizeScene() {
    if (!this.scene) return
    const project = this.scene.project
    const pages = Array.isArray(project.pages) ? project.pages : []
    if (!pages.length) return
    let activeIndex = this.scene.activePageIndex
    if (!Number.isInteger(activeIndex) || activeIndex < 0 || activeIndex >= pages.length) {
      activeIndex = clampNumber(Math.floor(activeIndex) || 0, 0, pages.length - 1)
      this.scene.activePageIndex = activeIndex
    }
    const page = pages[activeIndex]
    if (!page) return
    const safeWidth = isFiniteNumber(page.width) && page.width > 0 ? page.width : DEFAULT_PAGE_WIDTH
    const safeHeight = isFiniteNumber(page.height) && page.height > 0 ? page.height : DEFAULT_PAGE_HEIGHT
    if (page.width !== safeWidth) page.width = safeWidth
    if (page.height !== safeHeight) page.height = safeHeight
    page.layers.forEach((layer) => {
      const normalized = this.normalizeBox(layer, page)
      layer.frame = normalized
    })
    this.fullRect = { x: 0, y: 0, w: page.width, h: page.height }
  }

  private normalizeBox(layer: LayerBase, page: Scene['project']['pages'][number]): Rect {
    const frame = layer.frame ?? { x: 0, y: 0, w: 0, h: 0 }
    const pageWidth = isFiniteNumber(page.width) && page.width > 0 ? page.width : DEFAULT_PAGE_WIDTH
    const pageHeight = isFiniteNumber(page.height) && page.height > 0 ? page.height : DEFAULT_PAGE_HEIGHT
    const defaultFrame = {
      x: pageWidth * 0.05,
      y: pageHeight * 0.06,
      w: clampNumber(pageWidth * 0.9, 1, pageWidth),
      h: clampNumber(pageHeight * 0.62, 1, pageHeight),
    }
    const widthCandidate = isFiniteNumber(frame.w) && frame.w > 0 ? frame.w : defaultFrame.w
    const heightCandidate = isFiniteNumber(frame.h) && frame.h > 0 ? frame.h : defaultFrame.h
    const width = clampNumber(widthCandidate, 1, pageWidth)
    const height = clampNumber(heightCandidate, 1, pageHeight)
    const maxX = Math.max(0, pageWidth - width)
    const maxY = Math.max(0, pageHeight - height)
    const rawX = isFiniteNumber(frame.x) ? frame.x : defaultFrame.x
    const rawY = isFiniteNumber(frame.y) ? frame.y : defaultFrame.y
    const x = clampNumber(rawX, 0, maxX)
    const y = clampNumber(rawY, 0, maxY)
    return { x, y, w: width, h: height }
  }
}

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
import { expandRect, getRotatedBounds, rectContainsPoint, rectIntersects, screenToWorld, unionRects } from '../utils/geometry'
import { generateMonth, resolveCalendarProps } from './calendar'

export type Viewport = { scale: number; tx: number; ty: number; dpr: number }
export type AlignGuide = { orientation: 'horizontal' | 'vertical'; position: number }
export type DragOverlay = { layerId: string; frame: Rect }

const HANDLE_SIZE = 12
const ROTATE_HANDLE_OFFSET = 48
const GUIDELINE_COLOR = 'rgba(112, 100, 255, 0.65)'
const SELECTION_COLOR = 'rgba(112, 100, 255, 1)'
const SELECTION_FILL = 'rgba(112, 100, 255, 0.16)'

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

export class Renderer {
  private scene: Scene | null = null
  private viewport: Viewport = { scale: 1, tx: 0, ty: 0, dpr: 1 }
  private ctx: CanvasRenderingContext2D | null = null
  private dirtyRects: Rect[] = []
  private rafId: number | null = null
  private readonly fullRect: Rect = { x: 0, y: 0, w: 0, h: 0 }
  private selection: string[] = []
  private guides: AlignGuide[] = []
  private dragOverlay: DragOverlay | null = null

  attach(ctx: CanvasRenderingContext2D) {
    this.ctx = ctx
  }

  setScene(scene: Scene) {
    this.scene = scene
  }

  setViewport(v: Partial<Viewport>) {
    this.viewport = { ...this.viewport, ...v }
  }

  getViewport(): Viewport {
    return this.viewport
  }

  setSelection(ids: string[]) {
    const next = ids.slice().sort()
    const current = this.selection.slice().sort()
    if (next.length === current.length && next.every((id, index) => id === current[index])) return
    this.selection = ids.slice()
    this.invalidate()
  }

  setGuides(guides: AlignGuide[]) {
    this.guides = guides.slice()
    this.invalidate()
  }

  setDragOverlay(overlay: DragOverlay | null) {
    this.dragOverlay = overlay ? { layerId: overlay.layerId, frame: { ...overlay.frame } } : null
    this.invalidate()
  }

  render() {
    if (!this.ctx || !this.scene) return
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
  }

  private drawPage(ctx: CanvasRenderingContext2D, page: Scene['project']['pages'][number]) {
    ctx.save()
    ctx.fillStyle = '#ffffff'
    ctx.fillRect(0, 0, page.width, page.height)
    for (const layer of page.layers) {
      this.drawLayer(ctx, layer as LayerBase)
    }
    this.drawSelection(ctx, page)
    this.drawGuides(ctx, page)
    ctx.restore()
  }

  private drawLayer(ctx: CanvasRenderingContext2D, layer: LayerBase) {
    if (layer.hidden) return
    const { x, y, w, h } = layer.frame
    ctx.save()
    ctx.translate(x + w / 2, y + h / 2)
    ctx.rotate(((layer.rotate || 0) * Math.PI) / 180)

    if (isTextLayer(layer)) this.drawTextLayer(ctx, layer)
    else if (isShapeLayer(layer)) this.drawShapeLayer(ctx, layer)
    else if (isCalendarLayer(layer)) this.drawCalendarLayer(ctx, layer)
    else this.drawFallbackLayer(ctx, layer)

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
          offsetX += ctx.measureText(char).width + spacing
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
    const caption = `第 ${monthData.weeks.length} 周`
    ctx.fillText(caption, -w / 2 + paddingX, -h / 2 + headerHeight / 2 + captionFontSize)

    const contentTop = -h / 2 + headerHeight + props.padding * 0.5
    const contentLeft = -w / 2 + props.padding
    const contentWidth = w - props.padding * 2
    const weekLabelHeight = Math.min(48, Math.max(32, h * 0.055))
    const daysTop = contentTop + weekLabelHeight + props.padding * 0.15
    const availableHeight = h / 2 - props.padding - daysTop
    const weekCount = monthData.weeks.length
    const cellHeight = availableHeight / Math.max(1, weekCount)
    const cellWidth = contentWidth / 7

    ctx.save()
    ctx.fillStyle = theme.secondaryText
    ctx.font = `500 ${captionFontSize}px 'PingFang SC'`
    ctx.textAlign = 'center'
    ctx.textBaseline = 'middle'
    monthData.weekdays.forEach((weekday, index) => {
      const x = contentLeft + cellWidth * index + cellWidth / 2
      const isWeekend = weekday.index === 0 || weekday.index === 6
      ctx.fillStyle = isWeekend ? theme.weekendText : theme.secondaryText
      ctx.fillText(weekday.label, x, contentTop + weekLabelHeight / 2)
    })
    ctx.restore()

    ctx.save()
    ctx.lineWidth = Math.max(1, 1 / this.viewport.scale)
    ctx.strokeStyle = theme.grid
    for (let row = 0; row <= weekCount; row++) {
      const y = daysTop + row * cellHeight
      ctx.beginPath()
      ctx.moveTo(contentLeft, y)
      ctx.lineTo(contentLeft + contentWidth, y)
      ctx.stroke()
    }
    for (let col = 0; col <= 7; col++) {
      const x = contentLeft + col * cellWidth
      ctx.beginPath()
      ctx.moveTo(x, daysTop)
      ctx.lineTo(x, daysTop + cellHeight * weekCount)
      ctx.stroke()
    }
    ctx.restore()

    const holidaySet = new Set(props.holidays || [])

    monthData.weeks.forEach((week, rowIndex) => {
      week.forEach((day, columnIndex) => {
        const cellX = contentLeft + columnIndex * cellWidth
        const cellY = daysTop + rowIndex * cellHeight
        const textX = cellX + cellWidth / 2
        const textY = cellY + cellHeight / 2

        if (day.isToday && day.monthOffset === 0) {
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

        ctx.save()
        ctx.font = `600 ${Math.min(48, Math.max(28, cellHeight * 0.42))}px 'DIN Alternate'`
        ctx.textAlign = 'center'
        ctx.textBaseline = 'middle'
        if (day.monthOffset === 0) ctx.fillStyle = day.isWeekend ? theme.weekendText : theme.text
        else ctx.fillStyle = `${theme.secondaryText}CC`
        ctx.fillText(String(day.display), textX, textY)
        ctx.restore()

        if (holidaySet.has(day.isoDate)) {
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
    const cb = () => {
      this.rafId = null
      this.render()
    }
    this.rafId = typeof requestAnimationFrame === 'function' ? requestAnimationFrame(cb) : (setTimeout(cb, 16) as unknown as number)
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
}

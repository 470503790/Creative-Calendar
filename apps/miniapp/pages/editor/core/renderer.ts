import type { Scene, LayerBase, Rect } from './scene'
import {
  expandRect,
  getRotatedBounds,
  rectContainsPoint,
  rectIntersects,
  screenToWorld,
  unionRects
} from '../utils/geometry'

export type Viewport = { scale: number; tx: number; ty: number; dpr: number }

export class Renderer {
  private scene: Scene | null = null
  private viewport: Viewport = { scale: 1, tx: 0, ty: 0, dpr: 1 }
  private ctx: CanvasRenderingContext2D | null = null
  private dirtyRects: Rect[] = []
  private rafId: number | null = null
  private readonly fullRect: Rect = { x: 0, y: 0, w: 0, h: 0 }

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

  render() {
    if (!this.ctx || !this.scene) return
    const { ctx } = this
    const { dpr, scale, tx, ty } = this.viewport
    const page = this.scene.project.pages[this.scene.activePageIndex]
    const canvas = ctx.canvas
    const targetW = Math.max(1, Math.floor((canvas as any).clientWidth * dpr))
    const targetH = Math.max(1, Math.floor((canvas as any).clientHeight * dpr))
    if (canvas.width !== targetW) canvas.width = targetW
    if (canvas.height !== targetH) canvas.height = targetH

    const dirty = this.dirtyRects.length ? [...this.dirtyRects] : [this.getPageBounds()]
    this.dirtyRects = []

    ctx.save()
    ctx.setTransform(dpr * scale, 0, 0, dpr * scale, dpr * tx, dpr * ty)

    for (const rect of dirty) {
      const expanded = expandRect(rect, 2)
      ctx.save()
      ctx.beginPath()
      ctx.rect(expanded.x, expanded.y, expanded.w, expanded.h)
      ctx.clip()
      ctx.clearRect(expanded.x, expanded.y, expanded.w, expanded.h)
      this.drawPage(ctx, page)
      ctx.restore()
    }
    ctx.restore()
  }

  private drawPage(ctx: CanvasRenderingContext2D, page: Scene['project']['pages'][number]) {
    ctx.save()
    ctx.fillStyle = '#fff'
    ctx.fillRect(0, 0, page.width, page.height)
    for (const layer of page.layers) this.drawLayer(ctx, layer)
    ctx.restore()
  }

  private drawLayer(ctx: CanvasRenderingContext2D, layer: LayerBase) {
    if (layer.hidden) return
    const { x, y, w, h } = layer.frame
    ctx.save()
    ctx.translate(x + w/2, y + h/2)
    ctx.rotate(((layer.rotate || 0) * Math.PI) / 180)
    switch (layer.type) {
      case 'text':
        ctx.fillStyle = '#111'
        ctx.textAlign = 'center'
        ctx.textBaseline = 'middle'
        ctx.font = '24px sans-serif'
        ctx.fillText(layer.props?.text || 'Text', 0, 0, w)
        break
      case 'shape':
        ctx.fillStyle = layer.props?.fill || '#F0F0F0'
        ctx.strokeStyle = layer.props?.stroke || '#CCC'
        ctx.lineWidth = 1
        ctx.beginPath()
        ctx.rect(-w/2, -h/2, w, h)
        ctx.fill(); ctx.stroke()
        break
      case 'calendar':
        ctx.strokeStyle = '#DDD'
        for (let i=0;i<7;i++){
          for (let j=0;j<5;j++){
            ctx.strokeRect(-w/2 + i*w/7, -h/2 + j*h/5, w/7, h/5)
          }
        }
        break
      default:
        ctx.fillStyle = '#EEE'
        ctx.fillRect(-w/2, -h/2, w, h)
    }
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
    this.rafId = typeof requestAnimationFrame === 'function'
      ? requestAnimationFrame(cb)
      : (setTimeout(cb, 16) as unknown as number)
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

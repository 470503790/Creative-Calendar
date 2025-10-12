import type { Scene, LayerBase } from './scene'
import { worldToScreen, screenToWorld } from '../utils/geometry'

export type Viewport = { scale: number; tx: number; ty: number; dpr: number }

export class Renderer {
  private scene: Scene | null = null
  private viewport: Viewport = { scale: 1, tx: 0, ty: 0, dpr: 1 }
  private ctx: CanvasRenderingContext2D | null = null

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
    const targetW = Math.floor(canvas.clientWidth * dpr)
    const targetH = Math.floor(canvas.clientHeight * dpr)
    if (canvas.width !== targetW) canvas.width = targetW
    if (canvas.height !== targetH) canvas.height = targetH

    ctx.save()
    ctx.setTransform(dpr * scale, 0, 0, dpr * scale, dpr * ty + 0) // fallback translateX handled below
    ctx.clearRect(0, 0, canvas.width, canvas.height)
    ctx.setTransform(dpr * scale, 0, 0, dpr * scale, dpr * tx, dpr * ty)

    // page background
    ctx.fillStyle = '#ffffff'
    ctx.fillRect(0, 0, page.width, page.height)

    // layers
    for (const layer of page.layers) {
      this.drawLayer(ctx, layer)
    }

    ctx.restore()
  }

  private drawLayer(ctx: CanvasRenderingContext2D, layer: LayerBase) {
    if (layer.hidden) return
    const { x, y, w, h } = layer.frame
    ctx.save()
    ctx.translate(x + w/2, y + h/2)
    ctx.rotate((layer.rotate || 0) * Math.PI/180)
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
      const l = page.layers[i]
      const { x: lx, y: ly, w, h } = l.frame
      if (x >= lx && x <= lx + w && y >= ly && y <= ly + h) {
        return l.id
      }
    }
    return null
  }
}

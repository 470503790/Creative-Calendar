import { CommandBus, type Command } from './commands'
import {
  createEmptyScene,
  cloneLayer,
  findLayerById,
  flattenLayers,
  removeLayerById,
  type LayerBase,
  type Page,
  type Scene
} from './scene'
import { Renderer, type Viewport, type AlignGuide, type DragOverlay } from './renderer'
import { getLayerType } from './register'
import { getRotatedBounds, rectIntersects, unionRects } from '../utils/geometry'

type EditorEvent =
  | { type: 'scene:change'; scene: Scene }
  | { type: 'selection:change'; selection: string[] }
  | { type: 'history:change'; canUndo: boolean; canRedo: boolean }
  | { type: 'viewport:change'; viewport: Viewport }

type AlignmentMode =
  | 'left'
  | 'right'
  | 'top'
  | 'bottom'
  | 'centerX'
  | 'centerY'

type DistributionAxis = 'horizontal' | 'vertical'

function ensurePage(scene: Scene): Page {
  const page = scene.project.pages[scene.activePageIndex]
  if (!page) throw new Error('Active page is missing')
  return page
}

function generateLayerId() {
  return `ly_${Math.random().toString(36).slice(2, 10)}`
}

function cloneScene(scene: Scene): Scene {
  return JSON.parse(JSON.stringify(scene))
}

export class EditorEngine {
  private scene: Scene
  private readonly renderer = new Renderer()
  private readonly history = new CommandBus(100)
  private readonly selection = new Set<string>()
  private readonly listeners = new Set<(event: EditorEvent) => void>()

  constructor(scene: Scene = createEmptyScene()) {
    this.scene = scene
    this.renderer.setScene(this.scene)
    this.renderer.setSelection([])
  }

  attachContext(ctx: CanvasRenderingContext2D) {
    this.renderer.attach(ctx)
    this.renderer.requestRender()
  }

  setScene(scene: Scene) {
    this.scene = scene
    this.renderer.setScene(scene)
    this.renderer.setSelection(this.getSelection())
    this.renderer.setGuides([])
    this.renderer.setDragOverlay(null)
    this.emitScene()
  }

  getScene() {
    return this.scene
  }

  getRenderer() {
    return this.renderer
  }

  getActivePage(): Page {
    return ensurePage(this.scene)
  }

  setActivePageIndex(index: number) {
    if (index < 0 || index >= this.scene.project.pages.length) return
    if (this.scene.activePageIndex === index) return
    this.scene.activePageIndex = index
    this.clearSelection()
    this.emitScene()
  }

  on(listener: (event: EditorEvent) => void) {
    this.listeners.add(listener)
    return () => this.listeners.delete(listener)
  }

  private emit(event: EditorEvent) {
    this.listeners.forEach((listener) => listener(event))
  }

  private emitScene() {
    this.emit({ type: 'scene:change', scene: this.scene })
  }

  private pruneSelection() {
    const page = this.getActivePage()
    const available = new Set(flattenLayers(page.layers).map((layer) => layer.id))
    let changed = false
    for (const id of Array.from(this.selection)) {
      if (!available.has(id)) {
        this.selection.delete(id)
        changed = true
      }
    }
    if (changed) this.emitSelection()
  }

  private emitHistory() {
    this.emit({
      type: 'history:change',
      canUndo: this.history.canUndo(),
      canRedo: this.history.canRedo(),
    })
  }

  private emitSelection() {
    const selection = this.getSelection()
    this.renderer.setSelection(selection)
    this.emit({ type: 'selection:change', selection })
  }

  private run(cmd: Command) {
    this.history.execute(cmd)
    this.emitScene()
    this.emitHistory()
  }

  select(id: string, additive = false) {
    if (!additive) this.selection.clear()
    if (!this.selection.has(id)) {
      this.selection.add(id)
      this.emitSelection()
    }
  }

  selectMany(ids: string[], additive = false) {
    if (!additive) this.selection.clear()
    let changed = false
    ids.forEach((id) => {
      if (!this.selection.has(id)) {
        this.selection.add(id)
        changed = true
      }
    })
    if (changed) this.emitSelection()
  }

  toggleSelection(id: string) {
    if (this.selection.has(id)) this.selection.delete(id)
    else this.selection.add(id)
    this.emitSelection()
  }

  clearSelection() {
    if (!this.selection.size) return
    this.selection.clear()
    this.emitSelection()
  }

  getSelection(): string[] {
    return Array.from(this.selection)
  }

  selectByRect(rect: { x: number; y: number; w: number; h: number }, additive = false) {
    const page = this.getActivePage()
    const hits: string[] = []
    flattenLayers(page.layers).forEach((layer) => {
      if (layer.locked || layer.hidden) return
      const bounds = getRotatedBounds(layer.frame, layer.rotate || 0)
      if (rectIntersects(bounds, rect)) hits.push(layer.id)
    })
    this.selectMany(hits, additive)
  }

  addLayer(type: string, props: Partial<LayerBase['props']> = {}, frame?: Partial<LayerBase['frame']>) {
    const page = this.getActivePage()
    const registry = getLayerType(type) ?? { type }
    const defaultSize = { w: 200, h: 200 }
    const baseFrame = {
      x: (page.width - defaultSize.w) / 2,
      y: (page.height - defaultSize.h) / 2,
      ...defaultSize,
    }
    const resolvedFrame = { ...baseFrame, ...frame }
    const layer: LayerBase = {
      id: generateLayerId(),
      type,
      name: `${registry.type ?? type} ${page.layers.length + 1}`,
      frame: resolvedFrame,
      rotate: 0,
      hidden: false,
      locked: false,
      props: { ...registry.defaults, ...props },
    }

    const cmd: Command = {
      name: 'addLayer',
      do: () => {
        page.layers.push(layer)
        this.select(layer.id)
        const bounds = getRotatedBounds(layer.frame, layer.rotate || 0)
        this.renderer.requestRender(bounds, layer.id, bounds)
      },
      undo: () => {
        const bounds = getRotatedBounds(layer.frame, layer.rotate || 0)
        removeLayerById(page, layer.id)
        this.clearSelection()
        this.renderer.requestRender(bounds, layer.id, null)
      },
    }

    this.run(cmd)
    return layer
  }

  removeLayer(id: string) {
    const page = this.getActivePage()
    const layer = findLayerById(page, id)
    if (!layer) return false
    const snapshot = cloneLayer(layer)
    const index = page.layers.findIndex((item) => item.id === id)
    const cmd: Command = {
      name: 'removeLayer',
      do: () => {
        const bounds = getRotatedBounds(layer.frame, layer.rotate || 0)
        removeLayerById(page, id)
        this.selection.delete(id)
        this.emitSelection()
        this.renderer.requestRender(bounds, id, null)
      },
      undo: () => {
        const insert = index >= 0 ? index : page.layers.length
        page.layers.splice(insert, 0, snapshot)
        const bounds = getRotatedBounds(snapshot.frame, snapshot.rotate || 0)
        this.renderer.requestRender(bounds, snapshot.id, bounds)
        this.pruneSelection()
      },
    }

    this.run(cmd)
    return true
  }

  updateLayerFrame(id: string, frame: Partial<LayerBase['frame']>) {
    const page = this.getActivePage()
    const layer = findLayerById(page, id)
    if (!layer) return false
    const before = { ...layer.frame }
    const after = { ...before, ...frame }
    const beforeBounds = getRotatedBounds(before, layer.rotate || 0)
    const afterBounds = getRotatedBounds(after, layer.rotate || 0)
    const dirty = unionRects([beforeBounds, afterBounds])

    const cmd: Command = {
      name: 'updateLayerFrame',
      do: () => {
        layer.frame = after
        if (dirty) this.renderer.requestRender(dirty, layer.id, afterBounds)
        else this.renderer.requestRender(afterBounds, layer.id, afterBounds)
      },
      undo: () => {
        layer.frame = before
        if (dirty) this.renderer.requestRender(dirty, layer.id, beforeBounds)
        else this.renderer.requestRender(beforeBounds, layer.id, beforeBounds)
      },
    }

    this.run(cmd)
    return true
  }

  updateLayerProps(id: string, patch: Record<string, any>) {
    const page = this.getActivePage()
    const layer = findLayerById(page, id)
    if (!layer) return false
    const before = { ...(layer.props || {}) }
    const after = { ...before, ...patch }

    const cmd: Command = {
      name: 'updateLayerProps',
      do: () => {
        layer.props = after
        const bounds = getRotatedBounds(layer.frame, layer.rotate || 0)
        this.renderer.requestRender(bounds, layer.id, bounds)
      },
      undo: () => {
        layer.props = before
        const bounds = getRotatedBounds(layer.frame, layer.rotate || 0)
        this.renderer.requestRender(bounds, layer.id, bounds)
      },
    }

    this.run(cmd)
    return true
  }

  rotateLayer(id: string, angle: number) {
    const page = this.getActivePage()
    const layer = findLayerById(page, id)
    if (!layer) return false
    const before = layer.rotate || 0
    const after = angle
    const beforeBounds = getRotatedBounds(layer.frame, before)
    const afterBounds = getRotatedBounds(layer.frame, after)
    const dirty = unionRects([beforeBounds, afterBounds])

    const cmd: Command = {
      name: 'rotateLayer',
      do: () => {
        layer.rotate = after
        if (dirty) this.renderer.requestRender(dirty, layer.id, afterBounds)
        else this.renderer.requestRender(afterBounds, layer.id, afterBounds)
      },
      undo: () => {
        layer.rotate = before
        if (dirty) this.renderer.requestRender(dirty, layer.id, beforeBounds)
        else this.renderer.requestRender(beforeBounds, layer.id, beforeBounds)
      },
    }

    this.run(cmd)
    return true
  }

  reorderLayer(id: string, targetIndex: number) {
    const page = this.getActivePage()
    const before = page.layers.slice()
    const index = before.findIndex((layer) => layer.id === id)
    if (index === -1) return false
    const after = before.slice()
    const [layer] = after.splice(index, 1)
    const nextIndex = Math.max(0, Math.min(targetIndex, after.length))
    after.splice(nextIndex, 0, layer)

    const cmd: Command = {
      name: 'reorderLayer',
      do: () => {
        page.layers = after.slice()
        this.renderer.requestRender()
        this.pruneSelection()
      },
      undo: () => {
        page.layers = before.slice()
        this.renderer.requestRender()
        this.pruneSelection()
      },
    }

    this.run(cmd)
    return true
  }

  alignSelection(mode: AlignmentMode) {
    const page = this.getActivePage()
    const layers = flattenLayers(page.layers).filter((layer) => this.selection.has(layer.id))
    if (layers.length < 2) return false
    const bounds = layers.map((layer) => getRotatedBounds(layer.frame, layer.rotate || 0))
    const union = unionRects(bounds)
    if (!union) return false

    const before = layers.map((layer) => ({ id: layer.id, frame: { ...layer.frame } }))

    const apply = () => {
      layers.forEach((layer) => {
        const next = { ...layer.frame }
        switch (mode) {
          case 'left':
            next.x = union.x
            break
          case 'right':
            next.x = union.x + union.w - next.w
            break
          case 'top':
            next.y = union.y
            break
          case 'bottom':
            next.y = union.y + union.h - next.h
            break
          case 'centerX':
            next.x = union.x + union.w / 2 - next.w / 2
            break
          case 'centerY':
            next.y = union.y + union.h / 2 - next.h / 2
            break
        }
        layer.frame = next
      })
      this.renderer.requestRender(union)
    }

    const undo = () => {
      before.forEach((snap) => {
        const target = findLayerById(page, snap.id)
        if (target) target.frame = snap.frame
      })
      this.renderer.requestRender(union)
    }

    this.run({ name: `align:${mode}`, do: apply, undo })
    return true
  }

  distributeSelection(axis: DistributionAxis) {
    const page = this.getActivePage()
    const layers = flattenLayers(page.layers).filter((layer) => this.selection.has(layer.id))
    if (layers.length <= 2) return false
    const sorted = [...layers].sort((a, b) =>
      axis === 'horizontal' ? a.frame.x - b.frame.x : a.frame.y - b.frame.y
    )
    const first = sorted[0]
    const last = sorted[sorted.length - 1]
    const span = axis === 'horizontal' ? last.frame.x - first.frame.x : last.frame.y - first.frame.y
    if (span === 0) return false
    const step = span / (sorted.length - 1)
    const before = sorted.map((layer) => ({ id: layer.id, frame: { ...layer.frame } }))

    const apply = () => {
      sorted.forEach((layer, index) => {
        if (axis === 'horizontal') layer.frame.x = first.frame.x + step * index
        else layer.frame.y = first.frame.y + step * index
      })
      const union = unionRects(sorted.map((layer) => getRotatedBounds(layer.frame, layer.rotate || 0)))
      if (union) this.renderer.requestRender(union)
    }

    const undo = () => {
      before.forEach((snap) => {
        const target = findLayerById(page, snap.id)
        if (target) target.frame = snap.frame
      })
      const union = unionRects(sorted.map((layer) => getRotatedBounds(layer.frame, layer.rotate || 0)))
      if (union) this.renderer.requestRender(union)
    }

    this.run({ name: `distribute:${axis}`, do: apply, undo })
    return true
  }

  toggleLock(id: string) {
    const page = this.getActivePage()
    const layer = findLayerById(page, id)
    if (!layer) return false
    const before = !!layer.locked
    const after = !before

    this.run({
      name: 'toggleLock',
      do: () => {
        layer.locked = after
      },
      undo: () => {
        layer.locked = before
      },
    })
    return true
  }

  toggleVisibility(id: string) {
    const page = this.getActivePage()
    const layer = findLayerById(page, id)
    if (!layer) return false
    const before = !!layer.hidden
    const after = !before

    this.run({
      name: 'toggleVisibility',
      do: () => {
        layer.hidden = after
        const bounds = getRotatedBounds(layer.frame, layer.rotate || 0)
        this.renderer.requestRender(bounds, layer.id, bounds)
      },
      undo: () => {
        layer.hidden = before
        const bounds = getRotatedBounds(layer.frame, layer.rotate || 0)
        this.renderer.requestRender(bounds, layer.id, bounds)
      },
    })
    return true
  }

  undo() {
    const done = this.history.undo()
    if (!done) return false
    this.emitScene()
    this.emitHistory()
    this.renderer.requestRender()
    this.pruneSelection()
    return true
  }

  redo() {
    const done = this.history.redo()
    if (!done) return false
    this.emitScene()
    this.emitHistory()
    this.renderer.requestRender()
    this.pruneSelection()
    return true
  }

  canUndo() {
    return this.history.canUndo()
  }

  canRedo() {
    return this.history.canRedo()
  }

  getViewport(): Viewport {
    return this.renderer.getViewport()
  }

  updateViewport(viewport: Partial<Viewport>) {
    this.renderer.setViewport(viewport)
    this.emit({ type: 'viewport:change', viewport: this.renderer.getViewport() })
    this.renderer.requestRender()
  }

  setGuides(guides: AlignGuide[]) {
    this.renderer.setGuides(guides)
  }

  clearGuides() {
    this.renderer.setGuides([])
  }

  setDragOverlay(overlay: DragOverlay | null) {
    this.renderer.setDragOverlay(overlay)
  }

  serialize(): Scene {
    return cloneScene(this.scene)
  }

  restore(scene: Scene) {
    this.setScene(cloneScene(scene))
  }
}

export type { AlignmentMode, DistributionAxis }

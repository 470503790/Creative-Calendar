export type Vec2 = { x: number; y: number }
export type Rect = { x: number; y: number; w: number; h: number }

export type CalendarTheme = {
  background: string
  headerBackground: string
  headerText: string
  grid: string
  text: string
  secondaryText: string
  weekendText: string
  todayBackground: string
  todayText: string
  holidayBadgeBackground: string
  holidayBadgeText: string
}

export type CalendarLayerProps = {
  year: number
  month: number
  weekStart: number
  radius: number
  padding: number
  showWeekNumber: boolean
  showLunar: boolean
  showSolarTerm: boolean
  showFestivals: boolean
  showHolidays: boolean
  highlightToday: boolean
  highlightWeekend: boolean
  highlightHolidays: boolean
  highlightExpression: string
  holidays: string[]
  theme: CalendarTheme
}

export type TextLayerProps = {
  text: string
  fontFamily: string
  fontSize: number
  fontWeight: '300' | '400' | '500' | '600' | '700'
  lineHeight: number
  letterSpacing: number
  align: CanvasTextAlign
  color: string
}

export type ShapeLayerProps = {
  fill: string
  stroke: string
  strokeWidth: number
  radius: number
}

export type LayerType =
  | 'calendar'
  | 'text'
  | 'shape'
  | 'image'
  | 'sticker'
  | 'countdown'
  | 'habitwall'
  | 'group'
  | string

export type LayerBase = {
  id: string
  type: LayerType
  name?: string
  locked?: boolean
  hidden?: boolean
  rotate?: number
  frame: Rect
  props?: Record<string, any>
  children?: LayerBase[]
}

export interface CalendarLayer extends LayerBase {
  type: 'calendar'
  props: CalendarLayerProps
}

export interface TextLayer extends LayerBase {
  type: 'text'
  props: TextLayerProps
}

export interface ShapeLayer extends LayerBase {
  type: 'shape'
  props: ShapeLayerProps
}

export type SceneLayer = LayerBase | CalendarLayer | TextLayer | ShapeLayer

export type Page = {
  id: string
  name?: string
  width: number
  height: number
  layers: LayerBase[]
}

export type Project = {
  id: string
  title: string
  pages: Page[]
  createdAt: number
  updatedAt: number
}

export type Scene = {
  project: Project
  activePageIndex: number
}

export function createEmptyScene(width = 1242, height = 2208): Scene {
  return {
    project: {
      id: 'p_' + Math.random().toString(36).slice(2),
      title: 'Untitled',
      pages: [{
        id: 'pg_' + Math.random().toString(36).slice(2),
        name: '页面 1',
        width, height, layers: []
      }],
      createdAt: Date.now(),
      updatedAt: Date.now()
    },
    activePageIndex: 0
  }
}

export function cloneLayer<T extends LayerBase>(layer: T): T {
  return JSON.parse(JSON.stringify(layer))
}

export function isCalendarLayer(layer: LayerBase): layer is CalendarLayer {
  return layer.type === 'calendar'
}

export function isTextLayer(layer: LayerBase): layer is TextLayer {
  return layer.type === 'text'
}

export function isShapeLayer(layer: LayerBase): layer is ShapeLayer {
  return layer.type === 'shape'
}

export function isGroupLayer(layer: LayerBase): boolean {
  return layer.type === 'group'
}

export function flattenLayers(layers: LayerBase[]): LayerBase[] {
  const result: LayerBase[] = []
  for (const layer of layers) {
    result.push(layer)
    if (layer.children?.length) {
      result.push(...flattenLayers(layer.children))
    }
  }
  return result
}

export function findLayerById(page: Page, id: string): LayerBase | null {
  const stack: LayerBase[] = [...page.layers]
  while (stack.length) {
    const current = stack.pop()!
    if (current.id === id) return current
    if (current.children?.length) stack.push(...current.children)
  }
  return null
}

export function removeLayerById(page: Page, id: string): boolean {
  const stack: { parent: LayerBase | null; list: LayerBase[] }[] = [
    { parent: null, list: page.layers }
  ]
  while (stack.length) {
    const { list } = stack.pop()!
    const index = list.findIndex((item) => item.id === id)
    if (index >= 0) {
      list.splice(index, 1)
      return true
    }
    for (const layer of list) {
      if (layer.children?.length) {
        stack.push({ parent: layer, list: layer.children })
      }
    }
  }
  return false
}

export function walkLayers(
  page: Page,
  iterator: (layer: LayerBase, parent: LayerBase | null) => void
) {
  const visit = (layers: LayerBase[], parent: LayerBase | null) => {
    for (const layer of layers) {
      iterator(layer, parent)
      if (layer.children?.length) visit(layer.children, layer)
    }
  }
  visit(page.layers, null)
}

export function ensurePageBounds(page: Page, width: number, height: number) {
  page.width = width
  page.height = height
}

export function reorderLayer(page: Page, id: string, targetIndex: number): boolean {
  const list = page.layers
  const index = list.findIndex((layer) => layer.id === id)
  if (index === -1) return false
  const [layer] = list.splice(index, 1)
  const nextIndex = Math.max(0, Math.min(targetIndex, list.length))
  list.splice(nextIndex, 0, layer)
  return true
}

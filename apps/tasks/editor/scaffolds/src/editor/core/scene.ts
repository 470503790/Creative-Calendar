export type Vec2 = { x: number; y: number }
export type Rect = { x: number; y: number; w: number; h: number }

export type LayerBase = {
  id: string
  type: 'calendar' | 'text' | 'shape' | 'image' | 'sticker' | string
  name?: string
  locked?: boolean
  hidden?: boolean
  rotate?: number
  frame: Rect
  props?: Record<string, any>
}

export type Page = {
  id: string
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
        width, height, layers: []
      }],
      createdAt: Date.now(),
      updatedAt: Date.now()
    },
    activePageIndex: 0
  }
}

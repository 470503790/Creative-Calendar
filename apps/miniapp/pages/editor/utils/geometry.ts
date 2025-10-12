import type { Viewport } from '../core/renderer'
import type { Rect } from '../core/scene'

export function worldToScreen(x: number, y: number, v: Viewport) {
  return { x: (x + v.tx) * v.scale * v.dpr, y: (y + v.ty) * v.scale * v.dpr }
}

export function screenToWorld(sx: number, sy: number, v: Viewport) {
  const inv = 1 / (v.scale * v.dpr)
  return { x: sx * inv - v.tx, y: sy * inv - v.ty }
}

export function clamp(n: number, a: number, b: number) {
  return Math.max(a, Math.min(b, n))
}

export function rotatePoint(px: number, py: number, angleDeg: number) {
  const angle = (angleDeg * Math.PI) / 180
  const cos = Math.cos(angle)
  const sin = Math.sin(angle)
  return { x: px * cos - py * sin, y: px * sin + py * cos }
}

export function getRotatedBounds(rect: Rect, angleDeg = 0): Rect {
  if (!angleDeg) return { ...rect }
  const cx = rect.x + rect.w / 2
  const cy = rect.y + rect.h / 2
  const corners = [
    { x: rect.x - cx, y: rect.y - cy },
    { x: rect.x + rect.w - cx, y: rect.y - cy },
    { x: rect.x + rect.w - cx, y: rect.y + rect.h - cy },
    { x: rect.x - cx, y: rect.y + rect.h - cy }
  ].map((corner) => rotatePoint(corner.x, corner.y, angleDeg))
  const xs = corners.map((p) => p.x)
  const ys = corners.map((p) => p.y)
  const minX = Math.min(...xs) + cx
  const maxX = Math.max(...xs) + cx
  const minY = Math.min(...ys) + cy
  const maxY = Math.max(...ys) + cy
  return { x: minX, y: minY, w: maxX - minX, h: maxY - minY }
}

export function rectContainsPoint(rect: Rect, x: number, y: number) {
  return x >= rect.x && x <= rect.x + rect.w && y >= rect.y && y <= rect.y + rect.h
}

export function rectIntersects(a: Rect, b: Rect) {
  return !(
    a.x + a.w < b.x ||
    b.x + b.w < a.x ||
    a.y + a.h < b.y ||
    b.y + b.h < a.y
  )
}

export function expandRect(rect: Rect, padding: number): Rect {
  return { x: rect.x - padding, y: rect.y - padding, w: rect.w + padding * 2, h: rect.h + padding * 2 }
}

export function unionRects(rects: Rect[]): Rect | null {
  if (!rects.length) return null
  const xs = rects.flatMap((r) => [r.x, r.x + r.w])
  const ys = rects.flatMap((r) => [r.y, r.y + r.h])
  const minX = Math.min(...xs)
  const maxX = Math.max(...xs)
  const minY = Math.min(...ys)
  const maxY = Math.max(...ys)
  return { x: minX, y: minY, w: maxX - minX, h: maxY - minY }
}

export function snap(value: number, grid: number) {
  if (grid <= 0) return value
  return Math.round(value / grid) * grid
}

export function distance(ax: number, ay: number, bx: number, by: number) {
  const dx = ax - bx
  const dy = ay - by
  return Math.sqrt(dx * dx + dy * dy)
}

export function lerp(a: number, b: number, t: number) {
  return a + (b - a) * t
}

export function normalizeAngle(angle: number) {
  const normalized = angle % 360
  return normalized < 0 ? normalized + 360 : normalized
}

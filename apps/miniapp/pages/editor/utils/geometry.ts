import type { Viewport } from '../core/renderer'

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

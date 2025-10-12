export type LayerRegistryEntry = {
  type: string
  defaults?: Record<string, any>
}
const registry = new Map<string, LayerRegistryEntry>()

export function registerLayerType(entry: LayerRegistryEntry) {
  registry.set(entry.type, entry)
}
export function getLayerType(type: string) {
  return registry.get(type)
}
export function listLayerTypes() {
  return Array.from(registry.keys())
}

registerLayerType({ type: 'text', defaults: { text: 'Text' } })
registerLayerType({ type: 'shape', defaults: { fill: '#F0F0F0' } })
registerLayerType({ type: 'calendar', defaults: { view: 'month' } })

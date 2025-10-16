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

registerLayerType({
  type: 'text',
  defaults: {
    text: '双击编辑',
    fontFamily: 'PingFang SC',
    fontSize: 28,
    fontWeight: '500',
    lineHeight: 1.4,
    letterSpacing: 0,
    align: 'center',
    color: '#1F2330',
  },
})
registerLayerType({
  type: 'shape',
  defaults: {
    fill: '#F7F8FF',
    stroke: '#7064FF',
    strokeWidth: 4,
    radius: 16,
  },
})
registerLayerType({
  type: 'calendar',
  defaults: {
    year: new Date().getFullYear(),
    month: new Date().getMonth() + 1,
    weekStart: 1,
    radius: 36,
    padding: 48,
    showWeekNumber: false,
    holidays: [],
  },
})
registerLayerType({ type: 'material', defaults: { tone: '柔和' } })

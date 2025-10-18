interface UniSafeAreaInfo {
  windowWidth: number
  windowHeight: number
  safeTop: number
  safeBottom: number
}

const DEFAULT_SAFE_AREA: UniSafeAreaInfo = {
  windowWidth: 0,
  windowHeight: 0,
  safeTop: 0,
  safeBottom: 0,
}

function getSystemSafeArea(): UniSafeAreaInfo {
  try {
    const info = uni.getSystemInfoSync() as {
      windowWidth?: number
      windowHeight?: number
      safeAreaInsets?: { top?: number; bottom?: number }
    }
    const safe = info?.safeAreaInsets ?? {}
    return {
      windowWidth: info?.windowWidth ?? 0,
      windowHeight: info?.windowHeight ?? 0,
      safeTop: safe.top ?? 0,
      safeBottom: safe.bottom ?? 0,
    }
  } catch (error) {
    return { ...DEFAULT_SAFE_AREA }
  }
}

export function useSafeArea(): UniSafeAreaInfo {
  return getSystemSafeArea()
}

export function rpx2px(rpx: number) {
  const { windowWidth } = useSafeArea()
  const width = windowWidth || 750
  return (rpx * width) / 750
}

export function calcCanvasHeight(toolsRpx: number, topPx: number) {
  const { windowHeight, safeBottom } = useSafeArea()
  const toolsPx = rpx2px(toolsRpx)
  const height = Math.floor(windowHeight - topPx - toolsPx - safeBottom)
  return Math.max(200, height)
}

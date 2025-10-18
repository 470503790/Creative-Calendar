interface SafeAreaInsets {
  top: number
  bottom: number
  left?: number
  right?: number
}

interface SystemInfo {
  windowHeight: number
  windowWidth: number
  safeAreaInsets?: SafeAreaInsets
}

const DEFAULT_SAFE_AREA: SafeAreaInsets = { top: 0, bottom: 0 }

function getSystemInfo(): SystemInfo {
  try {
    return uni.getSystemInfoSync()
  } catch (error) {
    return { windowHeight: 0, windowWidth: 0, safeAreaInsets: DEFAULT_SAFE_AREA }
  }
}

export function useSafeArea() {
  const systemInfo = getSystemInfo()
  const safeAreaInsets = systemInfo.safeAreaInsets ?? DEFAULT_SAFE_AREA

  function rpx2px(rpx: number) {
    return (rpx * systemInfo.windowWidth) / 750
  }

  function calcCanvasHeight(toolsPx: number, topPx: number) {
    const bottomInset = safeAreaInsets?.bottom ?? 0
    const height = systemInfo.windowHeight - toolsPx - topPx - bottomInset
    return height > 0 ? height : 0
  }

  return {
    windowHeight: systemInfo.windowHeight,
    windowWidth: systemInfo.windowWidth,
    safeAreaInsets,
    rpx2px,
    calcCanvasHeight,
  }
}

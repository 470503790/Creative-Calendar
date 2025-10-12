export type MockScenario = 'default' | 'empty' | 'error' | 'offline'

type MaybeFactory<T> = T | (() => T)

type MockErrorCode = 'MOCK_ERROR' | 'MOCK_OFFLINE'

const STORAGE_PREFIX = 'creative-calendar:mock:scenario:'

function resolveFactory<T>(factory: MaybeFactory<T>): T {
  return typeof factory === 'function' ? (factory as () => T)() : factory
}

export function wait(delay: number) {
  if (!delay || delay <= 0) return Promise.resolve()
  return new Promise<void>((resolve) => {
    setTimeout(resolve, delay)
  })
}

export function getMockScenario(key: string): MockScenario {
  try {
    if (typeof uni !== 'undefined' && typeof uni.getStorageSync === 'function') {
      const raw = uni.getStorageSync(`${STORAGE_PREFIX}${key}`)
      if (typeof raw === 'string') {
        if (raw === 'empty' || raw === 'error' || raw === 'offline' || raw === 'default') {
          return raw
        }
      }
    }
  } catch (error) {
    console.warn('[mock] failed to read scenario', key, error)
  }
  return 'default'
}

export function createMockError(type: 'error' | 'offline') {
  const error = new Error(type === 'offline' ? 'Network unavailable' : 'Mock request failed') as Error & {
    code: MockErrorCode
  }
  error.code = type === 'offline' ? 'MOCK_OFFLINE' : 'MOCK_ERROR'
  return error
}

export function isOfflineError(error: unknown) {
  const code = (error as { code?: string })?.code
  return code === 'MOCK_OFFLINE'
}

export async function resolveMockRequest<T>(
  key: string,
  handlers: {
    normal: MaybeFactory<T>
    empty?: MaybeFactory<T>
    delay?: number
  }
): Promise<T> {
  const scenario = getMockScenario(key)
  const delay = typeof handlers.delay === 'number' ? handlers.delay : 360
  await wait(delay)
  if (scenario === 'offline') throw createMockError('offline')
  if (scenario === 'error') throw createMockError('error')
  if (scenario === 'empty' && handlers.empty !== undefined) {
    return resolveFactory(handlers.empty)
  }
  return resolveFactory(handlers.normal)
}

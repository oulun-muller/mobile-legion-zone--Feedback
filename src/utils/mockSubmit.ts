export type MockSubmitMode = 'off' | 'fail'

const MOCK_KEY = 'mockSubmit'

/** Hash 路由下参数常在 #/path?key= 里，需同时读 search 与 hash query */
function readQueryParam(key: string): string | null {
  if (typeof window === 'undefined') return null
  const fromSearch = new URLSearchParams(window.location.search).get(key)
  if (fromSearch != null) return fromSearch
  const hash = window.location.hash
  const q = hash.indexOf('?')
  if (q === -1) return null
  return new URLSearchParams(hash.slice(q + 1)).get(key)
}

export function getMockSubmitMode(): MockSubmitMode {
  return readQueryParam(MOCK_KEY) === 'fail' ? 'fail' : 'off'
}

export function buildMockSubmitUrl(mode: MockSubmitMode) {
  const url = new URL(window.location.href)
  const rawHash = url.hash.startsWith('#') ? url.hash.slice(1) : url.hash || '/'
  const [hashPath, hashQuery = ''] = rawHash.split('?')
  const params = new URLSearchParams(hashQuery || url.search)
  url.search = ''
  if (mode === 'off') params.delete(MOCK_KEY)
  else params.set(MOCK_KEY, mode)
  const q = params.toString()
  url.hash = q ? `#${hashPath}?${q}` : `#${hashPath}`
  return url.pathname + url.search + url.hash
}

function sleep(ms: number) {
  return new Promise<void>((resolve) => setTimeout(resolve, ms))
}

/** 模拟表单提交 / 对话发送：fail 时返回 false */
export async function simulateSubmit(): Promise<boolean> {
  if (getMockSubmitMode() === 'fail') {
    await sleep(600)
    return false
  }
  await sleep(300)
  return true
}

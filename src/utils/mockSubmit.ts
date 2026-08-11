export type MockSubmitMode = 'off' | 'fail'

const MOCK_KEY = 'mockSubmit'

export function getMockSubmitMode(): MockSubmitMode {
  if (typeof window === 'undefined') return 'off'
  const q = new URLSearchParams(window.location.search).get(MOCK_KEY)
  return q === 'fail' ? 'fail' : 'off'
}

export function buildMockSubmitUrl(mode: MockSubmitMode) {
  const url = new URL(window.location.href)
  if (mode === 'off') url.searchParams.delete(MOCK_KEY)
  else url.searchParams.set(MOCK_KEY, mode)
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

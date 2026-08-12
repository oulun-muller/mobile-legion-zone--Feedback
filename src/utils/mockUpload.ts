export type UploadStatus = 'uploading' | 'done' | 'error'

export interface LocalImage {
  id: string
  url: string
  status: UploadStatus
  /** 原始文件大小（字节），用于校验已选图片的总大小 */
  size: number
}

export type MockUploadMode = 'off' | 'loading' | 'error' | 'slow'

const MOCK_KEY = 'mockUpload'

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

export function getMockUploadMode(): MockUploadMode {
  const q = readQueryParam(MOCK_KEY)
  if (q === 'loading' || q === 'error' || q === 'slow') return q
  return 'off'
}

export function buildMockUploadUrl(mode: MockUploadMode) {
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

/**
 * 模拟上传：用于验收 loading / 失败 UI。
 * - off：立即成功
 * - loading：一直转圈
 * - error：约 1.2s 后失败
 * - slow：约 3s 后成功
 */
export async function simulateUpload(
  onStatus: (status: UploadStatus) => void,
): Promise<UploadStatus> {
  const mode = getMockUploadMode()
  if (mode === 'off') {
    onStatus('done')
    return 'done'
  }

  onStatus('uploading')

  if (mode === 'loading') {
    return 'uploading'
  }

  await sleep(mode === 'slow' ? 3000 : 1200)
  const next: UploadStatus = mode === 'error' ? 'error' : 'done'
  onStatus(next)
  return next
}

export function createLocalImage(file: File): LocalImage {
  return {
    id: `${Date.now()}-${Math.random().toString(36).slice(2, 8)}`,
    url: URL.createObjectURL(file),
    status: getMockUploadMode() === 'off' ? 'done' : 'uploading',
    size: file.size,
  }
}

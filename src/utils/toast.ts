import { reactive } from 'vue'

export type ToastHandler = (message: string) => void
export type ToastVariant = 'default' | 'success' | 'error'

declare global {
  interface Window {
    /** 宿主优先注入的 toast；存在则不再走 H5 兜底 */
    __LZ_TOAST__?: ToastHandler
    legionNative?: {
      toast?: ToastHandler
      showToast?: ToastHandler
    }
  }
}

const h5ToastState = reactive({
  visible: false,
  message: '',
  variant: 'default' as ToastVariant,
})

let hideTimer: ReturnType<typeof setTimeout> | null = null

export function getH5ToastState() {
  return h5ToastState
}

function resolveHostToast(): ToastHandler | null {
  if (typeof window === 'undefined') return null

  if (typeof window.__LZ_TOAST__ === 'function') {
    return window.__LZ_TOAST__.bind(window)
  }

  const native = window.legionNative
  if (native && typeof native.toast === 'function') {
    return native.toast.bind(native)
  }
  if (native && typeof native.showToast === 'function') {
    return native.showToast.bind(native)
  }

  return null
}

function showH5Toast(message: string, variant: ToastVariant = 'default', duration = 2000) {
  if (hideTimer) clearTimeout(hideTimer)
  h5ToastState.message = message
  h5ToastState.variant = variant
  h5ToastState.visible = true
  hideTimer = setTimeout(() => {
    h5ToastState.visible = false
    hideTimer = null
  }, duration)
}

/**
 * 系统优先 toast：宿主有能力则调宿主，否则走 H5 兜底样式。
 */
export function toast(message: string, variant: ToastVariant = 'default') {
  const text = message.trim()
  if (!text) return

  const host = resolveHostToast()
  if (host) {
    try {
      host(text)
      return
    } catch {
      // 宿主调用失败时降级 H5
    }
  }

  showH5Toast(text, variant)
}

export function toastSuccess(message: string) {
  toast(message, 'success')
}

export function toastError(message: string) {
  toast(message, 'error')
}

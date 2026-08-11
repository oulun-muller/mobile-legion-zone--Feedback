import { onMounted, onUnmounted, ref } from 'vue'

type VirtualKeyboard = {
  overlaysContent: boolean
  boundingRect: DOMRect
  addEventListener: (type: 'geometrychange', listener: () => void) => void
  removeEventListener: (type: 'geometrychange', listener: () => void) => void
}

/** 压缩高度超过该值才判定为「键盘弹出」，而非地址栏收放等噪声 */
const KEYBOARD_MIN_SHRINK = 48
/** 失焦后轮询视口高度是否已稳定的间隔与最大重试次数（慢机型键盘收起动画兜底） */
const BLUR_SETTLE_INTERVAL_MS = 60
const BLUR_SETTLE_MAX_ATTEMPTS = 5

/**
 * 计算软键盘占用高度（仅对话页底部固定输入区使用）。
 *
 * 兼容三种常见行为：
 * 1. overlays-content：layout 不变，visualViewport 变矮 → 用 inset 顶起
 * 2. resizes-content / Pad 直接压矮 layout：fixed bottom:0 已够 → inset=0
 * 3. VirtualKeyboard API（部分 Chromium Pad）：读 boundingRect.height
 *
 * 仅在应用内输入框实际聚焦时才计算非 0 inset：地址栏收放等视口变化
 * 不应该顶起输入区，也避免和是否聚焦无关的噪声触发误判。
 */
export function useKeyboardInset() {
  const inset = ref(0)
  /** 键盘收起时的可视高度基线，只升不降（避免被键盘态污染） */
  let baseline = 0
  let rafId = 0
  let vk: VirtualKeyboard | null = null
  let hasFocus = false
  let blurTimers: ReturnType<typeof setTimeout>[] = []

  function clearBlurTimers() {
    blurTimers.forEach((id) => clearTimeout(id))
    blurTimers = []
  }

  function readBaselineCandidate() {
    const vv = window.visualViewport
    return Math.round(Math.max(window.innerHeight, vv?.height ?? 0))
  }

  function ensureBaseline(force = false) {
    const candidate = readBaselineCandidate()
    if (force || candidate > baseline) baseline = candidate
  }

  function readInset() {
    // 未聚焦时不可能是键盘引起的视口变化（地址栏收放等），直接判 0
    if (!hasFocus) return 0

    // 优先 VirtualKeyboard：部分 Pad WebView 不改 visualViewport
    if (vk) {
      const h = Math.round(vk.boundingRect?.height ?? 0)
      if (h > KEYBOARD_MIN_SHRINK) return h
    }

    const vv = window.visualViewport
    if (!vv) return 0

    ensureBaseline()

    const layoutH = Math.round(window.innerHeight)
    const visualH = Math.round(vv.height + vv.offsetTop)
    const layoutShrink = baseline - layoutH
    const visualShrink = baseline - visualH

    // layout 已被浏览器整体压矮：fixed 已贴键盘，无需再补偿
    if (layoutShrink > KEYBOARD_MIN_SHRINK) return 0

    // layout 不变、仅可见区域变矮：用 inset 顶起输入区
    return visualShrink > KEYBOARD_MIN_SHRINK ? visualShrink : 0
  }

  function update() {
    rafId = 0
    const next = readInset()
    if (next !== inset.value) inset.value = next
  }

  function schedule() {
    if (rafId) return
    rafId = requestAnimationFrame(update)
  }

  /**
   * 等视口高度连续两次读数一致（或超过重试上限）再判定「键盘已收起」，
   * 避免慢机型键盘收起动画未播完就把中间态强制定为基线，污染后续计算。
   */
  function waitForStableHeight(cb: () => void, attempt = 0) {
    const before = readBaselineCandidate()
    const timer = window.setTimeout(() => {
      const after = readBaselineCandidate()
      if (after === before || attempt >= BLUR_SETTLE_MAX_ATTEMPTS) {
        cb()
        return
      }
      waitForStableHeight(cb, attempt + 1)
    }, BLUR_SETTLE_INTERVAL_MS)
    blurTimers.push(timer)
  }

  function onFocusIn(event: FocusEvent) {
    const target = event.target
    if (!(target instanceof HTMLInputElement) && !(target instanceof HTMLTextAreaElement)) return
    // 重新聚焦（如相册选图后回焦）时，作废上一次失焦触发的稳定性探测，避免竞态
    clearBlurTimers()
    hasFocus = true
    schedule()
  }

  function onFocusOut() {
    clearBlurTimers()
    waitForStableHeight(() => {
      hasFocus = false
      ensureBaseline(true)
      update()
    })
  }

  onMounted(() => {
    const nav = navigator as Navigator & { virtualKeyboard?: VirtualKeyboard }
    if (nav.virtualKeyboard) {
      vk = nav.virtualKeyboard
      try {
        vk.overlaysContent = true
      } catch {
        // 部分实现只读
      }
      vk.addEventListener('geometrychange', schedule)
    }

    ensureBaseline(true)
    update()
    const vv = window.visualViewport
    vv?.addEventListener('resize', schedule)
    vv?.addEventListener('scroll', schedule)
    window.addEventListener('resize', schedule)
    window.addEventListener('orientationchange', schedule)
    window.addEventListener('focusin', onFocusIn)
    window.addEventListener('focusout', onFocusOut)
  })

  onUnmounted(() => {
    vk?.removeEventListener('geometrychange', schedule)
    const vv = window.visualViewport
    vv?.removeEventListener('resize', schedule)
    vv?.removeEventListener('scroll', schedule)
    window.removeEventListener('resize', schedule)
    window.removeEventListener('orientationchange', schedule)
    window.removeEventListener('focusin', onFocusIn)
    window.removeEventListener('focusout', onFocusOut)
    clearBlurTimers()
    if (rafId) cancelAnimationFrame(rafId)
  })

  return { inset, sync: update }
}

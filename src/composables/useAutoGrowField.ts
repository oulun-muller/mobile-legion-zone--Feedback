import { nextTick, reactive, type Ref } from 'vue'

export interface AutoGrowFieldOptions {
  minHeight: number
  maxHeight: number
  scrollThumbMin?: number
  /** 内容高度之外，需要额外预留的空间（例如带图片附件时的间距），默认 0 */
  extraPadding?: () => number
}

/**
 * 「文本域随内容自增高 + 自绘滚动条」的公共逻辑。
 *
 * 抽出原因：反馈表单（问题描述）与对话详情（追加回复）两处输入框的
 * 自适应高度 / 自绘滚动条实现完全一致，只是最小高度、最大高度、
 * 额外 padding 不同。抽成一处，避免两边各改一份、后续容易改漏。
 *
 * fieldRef / textareaRef 由调用方创建并传入（而不是这里创建再返回），
 * 这样它们仍然是调用方组件里通过 `ref()` 直接声明的模板 ref，
 * 便于 vue-tsc 正确识别其在模板 `ref="xxx"` 中的使用。
 */
export function useAutoGrowField(
  fieldRef: Ref<HTMLElement | null>,
  textareaRef: Ref<HTMLTextAreaElement | null>,
  options: AutoGrowFieldOptions,
) {
  const { minHeight, maxHeight, scrollThumbMin = 36, extraPadding } = options

  const scrollbar = reactive({
    visible: false,
    thumbH: scrollThumbMin,
    thumbTop: 4,
  })

  function updateScrollbar() {
    const field = fieldRef.value
    if (!field) {
      scrollbar.visible = false
      return
    }

    const { clientHeight, scrollHeight, scrollTop } = field
    const overflow = scrollHeight - clientHeight
    if (overflow <= 1) {
      scrollbar.visible = false
      return
    }

    const track = Math.max(8, clientHeight - 8)
    const thumbH = Math.max(scrollThumbMin, Math.round((clientHeight / scrollHeight) * track))
    const maxTop = track - thumbH
    const thumbTop = 4 + Math.round((scrollTop / overflow) * maxTop)

    scrollbar.visible = true
    scrollbar.thumbH = thumbH
    scrollbar.thumbTop = thumbTop
  }

  function resize() {
    const field = fieldRef.value
    const el = textareaRef.value
    if (!field || !el) return

    el.style.height = '0px'
    const contentH = el.scrollHeight
    el.style.height = `${contentH}px`

    const pad = extraPadding?.() ?? 0
    const nextField = Math.min(maxHeight, Math.max(minHeight, contentH + pad))
    field.style.height = `${nextField}px`
    // 高度写完后再量一次，避免和布局同帧抢状态
    nextTick(updateScrollbar)
  }

  return {
    scrollbar,
    resize,
    updateScrollbar,
  }
}

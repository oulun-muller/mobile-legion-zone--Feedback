import { toast } from '@/utils/toast'

/**
 * 文本域触达最大字数时的 toast 提醒（反馈表单「问题描述」与对话页「追加回复」共用）。
 *
 * 原生 `maxlength` 只会默默拦截超出的输入，光靠它用户容易以为"打字没反应"。
 * 这里补两路提示：
 * - `onInput`：本次输入（含粘贴超长文本被截断）后刚好落在上限，说明这次操作触到了上限；
 * - `onBeforeInput`：已经在上限、且没有选中文本可替换时还在尝试插入内容，
 *   此时原生行为会直接吞掉按键、不会触发 `input` 事件，需要在这里单独兜底提示。
 */
export function useMaxLengthToast(maxLength: number, message = `最多可输入${maxLength}字`) {
  function isInsertEvent(event: Event): event is InputEvent {
    return event instanceof InputEvent && Boolean(event.inputType?.startsWith('insert'))
  }

  function onBeforeInput(event: Event, currentValue: string) {
    if (!isInsertEvent(event)) return
    const target = event.target as HTMLTextAreaElement | null
    const hasSelection = Boolean(target) && target!.selectionStart !== target!.selectionEnd
    if (!hasSelection && currentValue.length >= maxLength) {
      toast(message)
    }
  }

  function onInput(event: Event) {
    if (!isInsertEvent(event)) return
    const target = event.target as HTMLTextAreaElement
    if (target.value.length === maxLength) {
      toast(message)
    }
  }

  return { onBeforeInput, onInput }
}

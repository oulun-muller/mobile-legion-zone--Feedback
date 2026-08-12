<script setup lang="ts">
import { computed, nextTick, onMounted, onUnmounted, ref, watch } from 'vue'
import { useRoute, useRouter } from 'vue-router'
import AppNavBar from '@/components/AppNavBar.vue'
import PhotoThumb from '@/components/PhotoThumb.vue'
import { useAutoGrowField } from '@/composables/useAutoGrowField'
import { useKeyboardInset } from '@/composables/useKeyboardInset'
import { useLocalImages } from '@/composables/useLocalImages'
import { useMaxLengthToast } from '@/composables/useMaxLengthToast'
import { useFeedbackStore } from '@/stores/feedback'
import { historyLocation, leaveToHistory, parseHelpTab } from '@/utils/helpTab'
import { simulateSubmit } from '@/utils/mockSubmit'
import { toast, toastError } from '@/utils/toast'
import iconAddPicture from '@/assets/icons/icon-add-picture.svg'
import iconSendActive from '@/assets/icons/icon-send-active.svg'
import iconSendInactive from '@/assets/icons/icon-send-inactive.svg'

/** 稿面文本区外框：含 padding，最小 72 / 最大 144（对话页专用，与反馈表单无关） */
const FIELD_MIN = 72
const FIELD_MAX = 144
const FIELD_PAD_Y = 24
/** 追加回复字数上限，与反馈表单「问题描述」保持一致 */
const DRAFT_MAX_LENGTH = 500

const route = useRoute()
const router = useRouter()
const store = useFeedbackStore()
const { inset: keyboardInset, sync: syncKeyboard } = useKeyboardInset()

const draft = ref('')
const sending = ref(false)
const listRef = ref<HTMLElement | null>(null)
const composerRef = ref<HTMLElement | null>(null)
const fieldRef = ref<HTMLElement | null>(null)
const textareaRef = ref<HTMLTextAreaElement | null>(null)
const fileInputRef = ref<HTMLInputElement | null>(null)
const composerHeight = ref(0)
/** 输入区是否处于焦点（比临时看 activeElement 更稳，相册关闭后仍可判断） */
const composerFocused = ref(false)

const {
  images,
  allowMultiple,
  remainCount,
  onPickImages,
  removeImage,
  retryImage,
  clearImages,
  getReadyUrls,
  assertReadyToSubmit,
} = useLocalImages()

const {
  scrollbar,
  resize: resizeComposerField,
  updateScrollbar,
} = useAutoGrowField(fieldRef, textareaRef, {
  minHeight: FIELD_MIN,
  maxHeight: FIELD_MAX,
  extraPadding: () => (images.value.length > 0 ? 12 : FIELD_PAD_Y),
})

const { onBeforeInput: onDraftBeforeInput, onInput: onDraftLimitInput } =
  useMaxLengthToast(DRAFT_MAX_LENGTH)

const ticket = computed(() => store.getTicket(String(route.params.id)))
const canSend = computed(
  () =>
    !sending.value &&
    (draft.value.trim().length > 0 || images.value.length > 0),
)

/** 输入区钉在视口底部，用键盘 inset 上移；聊天列表只留出等高空间。
 * JS inset 优先；为 0 时再回退 CSS env（避免两者同时生效导致顶过头）。 */
const composerStyle = computed(() => ({
  bottom:
    keyboardInset.value > 0
      ? `${keyboardInset.value}px`
      : 'env(keyboard-inset-bottom, 0px)',
}))

const chatStyle = computed(() => ({
  paddingBottom: `${Math.max(0, composerHeight.value - 16)}px`,
}))

let settleTimer: ReturnType<typeof setTimeout> | null = null
let composerObserver: ResizeObserver | null = null

function leaveDetail() {
  leaveToHistory(route, router)
}

function measureComposer() {
  composerHeight.value = composerRef.value?.offsetHeight ?? 0
}

onMounted(() => {
  if (!ticket.value) {
    router.replace(historyLocation(parseHelpTab(route.query.fromTab)))
    return
  }
  store.markRead(ticket.value.id)
  resizeComposer()
  measureComposer()
  scrollBottom()

  if (composerRef.value && typeof ResizeObserver !== 'undefined') {
    composerObserver = new ResizeObserver(() => {
      measureComposer()
    })
    composerObserver.observe(composerRef.value)
  }
})

onUnmounted(() => {
  if (settleTimer) clearTimeout(settleTimer)
  composerObserver?.disconnect()
  composerObserver = null
})

watch(
  () => ticket.value?.messages.length,
  () => scrollBottom(),
)

watch(draft, () => {
  nextTick(resizeComposer)
})

watch(images, () => {
  nextTick(() => {
    resizeComposer()
    measureComposer()
  })
})

// 键盘 inset 变化会同步改一次 composer__panel--keyboard 的 class（影响输入区高度），
// 这里主动等 DOM 应用完这次 class 变化后立刻重新测量，不完全依赖 ResizeObserver 的异步回调，
// 避免 .chat 的 padding-bottom 有短暂滞后、导致底部滑动短暂被固定输入区"抢"走。
watch(keyboardInset, () => {
  nextTick(measureComposer)

  // 键盘动画结束后再滚消息到底，避免动画中反复 scrollTop
  if (settleTimer) clearTimeout(settleTimer)
  settleTimer = setTimeout(() => {
    scrollBottom()
  }, 120)
})

async function scrollBottom() {
  await nextTick()
  if (listRef.value) {
    listRef.value.scrollTop = listRef.value.scrollHeight
  }
}

function resizeComposer() {
  resizeComposerField()
  measureComposer()
}

function onDraftInput(event: Event) {
  resizeComposer()
  onDraftLimitInput(event)
}

/** 对话页回车即发送（对齐微信/QQ 等 IM 习惯），Shift+回车仍可换行；
 * 输入法候选词确认时的回车（isComposing / keyCode 229）不触发发送。 */
function onDraftKeydown(event: KeyboardEvent) {
  if (event.key !== 'Enter' || event.shiftKey) return
  if (event.isComposing || (event as unknown as { keyCode?: number }).keyCode === 229) return
  event.preventDefault()
  send()
}

/**
 * 相册关闭后把焦点还给输入框。
 *
 * 注意：这里只能保证 DOM 层面重新拿到 focus，不保证系统软键盘一定弹出——
 * 后者取决于 Android WebView 原生层此时是否已经把窗口焦点还给 WebView、
 * 以及宿主 App 有没有在相册 Activity 返回后主动调用 InputMethodManager.showSoftInput()，
 * 这些都在纯前端代码触达范围之外，加更多猜时间的重试也无法弥补。
 * 所以只做「立即 + 下一帧」这两次几乎零成本的尝试；如果宿主没跟上，
 * 用户再点一下输入框即可唤出键盘，这也是微信等 IM 产品的实际做法。
 */
function focusComposer() {
  const el = textareaRef.value
  if (!el) return
  const run = () => {
    el.focus({ preventScroll: true })
    syncKeyboard()
  }
  run()
  requestAnimationFrame(run)
}

function onComposerFocus() {
  composerFocused.value = true
  syncKeyboard()
  // 阻止浏览器为聚焦输入框整体滚动页面，输入区由 fixed + inset 自己贴键盘
  nextTick(() => {
    window.scrollTo(0, 0)
    syncKeyboard()
  })
}

function onComposerBlur() {
  // 延迟判断：点附加照片会先 blur 再出系统相册，此时仍视为「需要回焦」
  window.setTimeout(() => {
    if (document.activeElement !== textareaRef.value) {
      composerFocused.value = false
    }
  }, 0)
}

function onRemoveImage(index: number) {
  // 仅在输入框本来就有焦点时恢复，避免收起态误拉键盘
  const keepFocus = composerFocused.value || document.activeElement === textareaRef.value
  removeImage(index)
  if (keepFocus) focusComposer()
}

function onRetryImage(index: number) {
  // 重试只更新图片状态，不抢焦点、不拉起键盘
  retryImage(index)
}

function onAttachClick() {
  if (!fileInputRef.value) return
  if (remainCount.value <= 0) {
    toast('最多支持3张图片')
    return
  }
  // 用户手势内先记回焦意图并点开相册（手机端相册回来后靠延迟 focus）
  composerFocused.value = true
  fileInputRef.value.click()
}

function onComposerPickImages(event: Event) {
  const input = event.target as HTMLInputElement
  const hasFiles = Boolean(input.files?.length)
  onPickImages(event)
  // 对话页选图成功后保持输入焦点；取消选图不拉键盘
  if (hasFiles) focusComposer()
  else composerFocused.value = document.activeElement === textareaRef.value
}

async function send() {
  if (!ticket.value || !canSend.value || sending.value) return
  if (!assertReadyToSubmit()) return

  const text = draft.value
  const urls = getReadyUrls()

  sending.value = true
  const ok = await simulateSubmit()
  sending.value = false

  if (!ok) {
    toastError('发送失败，请重试')
    return
  }

  store.appendReply(ticket.value.id, text, urls)
  draft.value = ''
  clearImages()
  nextTick(resizeComposer)
}
</script>

<template>
  <div v-if="ticket" class="page detail-page">
    <AppNavBar :title="ticket.title" manual-back @back="leaveDetail" />

    <main ref="listRef" class="chat page__body--scroll" :style="chatStyle">
      <div class="chat__inner">
        <div
          v-for="msg in ticket.messages"
          :key="msg.id"
          class="msg"
          :class="msg.role === 'user' ? 'msg--user' : 'msg--ops'"
        >
          <div class="msg__meta">
            <template v-if="msg.role === 'user'">
              <span class="msg__time">{{ msg.time }}</span>
              <span class="msg__name">{{ msg.name }}</span>
            </template>
            <template v-else>
              <span class="msg__name">{{ msg.name }}</span>
              <span class="msg__time">{{ msg.time }}</span>
            </template>
          </div>
          <div v-if="msg.images?.length" class="msg__images">
            <PhotoThumb
              v-for="(img, index) in msg.images"
              :key="`${msg.id}-${index}`"
              :src="img"
              :size="80"
              variant="message"
            />
          </div>
          <div v-if="msg.text" class="msg__bubble">
            <p>{{ msg.text }}</p>
          </div>
        </div>
      </div>
    </main>

    <footer ref="composerRef" class="composer" :style="composerStyle">
      <div class="composer__fade" />
      <div
        class="composer__panel"
        :class="{ 'composer__panel--keyboard': keyboardInset > 0 }"
      >
        <div class="composer__box">
          <div v-if="images.length" class="composer__photos">
            <PhotoThumb
              v-for="(img, index) in images"
              :key="img.id"
              :src="img.url"
              :size="56"
              :status="img.status"
              deletable
              @remove="onRemoveImage(index)"
              @retry="onRetryImage(index)"
            />
          </div>

          <div class="composer__field-wrap">
            <div
              ref="fieldRef"
              class="composer__field"
              @scroll="updateScrollbar"
            >
              <textarea
                ref="textareaRef"
                v-model="draft"
                rows="1"
                :maxlength="DRAFT_MAX_LENGTH"
                enterkeyhint="send"
                placeholder="你可以在此，追加反馈..."
                @input="onDraftInput"
                @beforeinput="onDraftBeforeInput($event, draft)"
                @keydown="onDraftKeydown"
                @focus="onComposerFocus"
                @blur="onComposerBlur"
              />
            </div>
            <div
              v-show="scrollbar.visible"
              class="composer__scrollbar"
              aria-hidden="true"
            >
              <div
                class="composer__scrollbar-thumb"
                :style="{
                  height: `${scrollbar.thumbH}px`,
                  transform: `translateY(${scrollbar.thumbTop}px)`,
                }"
              />
            </div>
          </div>

          <div class="composer__toolbar">
            <button type="button" class="attach" @click="onAttachClick">
              <input
                ref="fileInputRef"
                type="file"
                accept="image/*"
                :multiple="allowMultiple"
                hidden
                @change="onComposerPickImages"
              />
              <img class="attach__icon" :src="iconAddPicture" width="16" height="16" alt="" />
              <span>附加照片</span>
              <span>{{ images.length }}/3</span>
            </button>
            <div class="composer__meta">
              <p class="composer__count">{{ draft.length }}/{{ DRAFT_MAX_LENGTH }}</p>
              <button
                type="button"
                class="send"
                :disabled="!canSend || sending"
                aria-label="发送"
                @click="send"
              >
                <img
                  class="send__icon"
                  :src="canSend ? iconSendActive : iconSendInactive"
                  width="24"
                  height="24"
                  alt=""
                />
              </button>
            </div>
          </div>
        </div>
      </div>
    </footer>
  </div>
</template>

<style scoped>
.detail-page {
  height: 100%;
  max-height: 100dvh;
  overflow: hidden;
  /* 输入区 fixed 脱离文档流，页面本身只负责导航 + 聊天滚动 */
  position: relative;
}

.chat {
  flex: 1;
  overflow: auto;
  -webkit-overflow-scrolling: touch;
  width: 100%;
  min-height: 0;
}

.chat__inner {
  width: 100%;
  max-width: var(--content-max);
  margin: 0 auto;
  padding: 16px;
  padding-bottom: 32px;
  display: flex;
  flex-direction: column;
  gap: 32px;
}

.msg {
  display: flex;
  flex-direction: column;
  gap: 8px;
  width: 100%;
}

.msg--user {
  align-items: flex-end;
}

.msg--ops {
  align-items: flex-start;
}

.msg__meta {
  display: flex;
  align-items: center;
  gap: 10px;
  font-size: 12px;
  width: 100%;
}

.msg--user .msg__meta {
  justify-content: flex-end;
}

.msg__time {
  color: var(--text-tertiary);
  white-space: pre;
}

.msg__name {
  color: var(--text-secondary);
}

.msg__images {
  display: flex;
  flex-wrap: wrap;
  gap: 10px;
  justify-content: flex-end;
  max-width: 100%;
}

.msg--ops .msg__images {
  justify-content: flex-start;
}

.msg__bubble {
  max-width: min(380px, calc(100% - 32px));
  padding: 8px 12px;
  border-radius: 4px;
}

.msg--user .msg__bubble {
  background: var(--action-primary);
}

.msg--ops .msg__bubble {
  background: var(--surface-deep);
}

.msg__bubble p {
  font-size: 16px;
  line-height: 1.9;
  color: var(--text-primary);
  word-break: break-word;
}

.msg--ops .msg__bubble p {
  color: var(--text-secondary);
}

/* 对话页输入区：固定贴视口底，不随聊天列表滚动；键盘用 bottom inset 顶起 */
.composer {
  position: fixed;
  left: 0;
  right: 0;
  bottom: 0;
  z-index: 20;
  width: 100%;
  pointer-events: none;
}

.composer__fade {
  height: 16px;
  background: linear-gradient(to bottom, rgba(18, 18, 18, 0), var(--bg-page));
  pointer-events: none;
}

.composer__panel {
  pointer-events: auto;
  background: var(--bg-page);
  padding: 0 16px calc(16px + var(--safe-bottom));
}

.composer__panel--keyboard {
  /* 键盘已顶起时不再叠加底部安全区，避免悬空一截 */
  padding-bottom: 16px;
}

.composer__box {
  width: 100%;
  max-width: var(--content-max);
  margin: 0 auto;
  display: flex;
  flex-direction: column;
  align-items: stretch;
  border-radius: 8px;
  background: var(--surface-default);
  border: 0.5px solid var(--border-strong);
  overflow: visible;
}

.composer__photos {
  display: flex;
  flex-wrap: wrap;
  align-items: center;
  gap: 8px;
  padding: 8px 8px 12px;
  flex-shrink: 0;
}

.composer__field-wrap {
  position: relative;
  width: 100%;
}

.composer__field {
  width: 100%;
  min-height: 72px;
  max-height: 144px;
  height: 72px;
  padding: 12px;
  overflow-x: hidden;
  overflow-y: auto;
  overscroll-behavior: contain;
  scrollbar-width: none;
  -ms-overflow-style: none;
}

.composer__field::-webkit-scrollbar {
  display: none;
  width: 0;
  height: 0;
}

.composer__box:has(.composer__photos) .composer__field {
  padding-top: 0;
}

.composer__scrollbar {
  position: absolute;
  top: 0;
  right: 0;
  bottom: 0;
  width: 12px;
  pointer-events: none;
  display: flex;
  justify-content: center;
  align-items: flex-start;
}

.composer__scrollbar-thumb {
  width: 3px;
  border-radius: 18px;
  background: rgba(255, 255, 255, 0.12);
  flex-shrink: 0;
  will-change: transform;
}

.composer__field textarea {
  display: block;
  width: 100%;
  min-height: 24px;
  padding: 0;
  border: 0;
  outline: none;
  resize: none;
  overflow: hidden;
  background: transparent;
  color: var(--text-primary);
  font-size: 16px;
  line-height: normal;
  word-break: break-word;
}

.composer__field textarea::placeholder {
  color: var(--text-tertiary);
}

.composer__toolbar {
  display: flex;
  align-items: center;
  gap: 16px;
  flex-shrink: 0;
  padding: 8px;
}

.composer__meta {
  display: flex;
  align-items: center;
  gap: 16px;
  flex: 1;
  min-width: 0;
}

.composer__count {
  flex: 1;
  min-width: 0;
  margin: 0;
  font-size: 14px;
  color: var(--text-disabled);
  text-align: right;
  white-space: nowrap;
}

.attach {
  display: inline-flex;
  align-items: center;
  justify-content: center;
  gap: 4px;
  height: 28px;
  padding: 0 6px;
  border-radius: 2px;
  border: 0.5px dashed var(--border-strong);
  background: var(--brand-accent-muted);
  opacity: 0.8;
  font-size: 12px;
  color: var(--text-secondary);
  white-space: nowrap;
}

.attach__icon {
  width: 16px;
  height: 16px;
  flex-shrink: 0;
}

.send {
  width: 28px;
  height: 28px;
  display: flex;
  align-items: center;
  justify-content: center;
  flex-shrink: 0;
}

.send:disabled {
  cursor: default;
}

.send__icon {
  width: 24px;
  height: 24px;
  display: block;
}
</style>

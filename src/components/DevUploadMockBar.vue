<script setup lang="ts">
import { computed, onMounted, onUnmounted, reactive, ref } from 'vue'
import {
  buildMockSubmitUrl,
  getMockSubmitMode,
  type MockSubmitMode,
} from '@/utils/mockSubmit'
import {
  buildMockUploadUrl,
  getMockUploadMode,
  type MockUploadMode,
} from '@/utils/mockUpload'

const STORAGE_KEY = 'lz-upload-mock-panel'
const DRAG_THRESHOLD = 10

const visible = ref(false)
const expanded = ref(false)
const mode = ref<MockUploadMode>('off')
const submitMode = ref<MockSubmitMode>('off')
const panel = reactive({
  x: 12,
  y: 120,
})

const dragging = ref(false)
let startX = 0
let startY = 0
let originX = 0
let originY = 0
let moved = false
let pointerIdActive: number | null = null

const modes: { key: MockUploadMode; label: string }[] = [
  { key: 'off', label: '正常' },
  { key: 'loading', label: '一直加载' },
  { key: 'error', label: '失败' },
  { key: 'slow', label: '慢成功' },
]

const submitModes: { key: MockSubmitMode; label: string }[] = [
  { key: 'off', label: '正常' },
  { key: 'fail', label: '失败' },
]

const modeLabel = computed(
  () => modes.find((item) => item.key === mode.value)?.label ?? '正常',
)

const submitModeLabel = computed(
  () => submitModes.find((item) => item.key === submitMode.value)?.label ?? '正常',
)

const tip = computed(() => {
  switch (mode.value) {
    case 'loading':
      return '选图后会一直转圈'
    case 'error':
      return '约 1.2s 后失败，点感叹号可重试'
    case 'slow':
      return '约 3s 后成功'
    default:
      return '即时成功'
  }
})

const submitTip = computed(() =>
  submitMode.value === 'fail'
    ? '表单提交 / 对话发送约 0.6s 后失败'
    : '表单提交 / 对话发送约 0.3s 后成功',
)

function clampPosition(x: number, y: number) {
  const w = expanded.value ? 220 : 72
  const maxX = Math.max(8, window.innerWidth - w - 8)
  const maxY = Math.max(8, window.innerHeight - 56)
  return {
    x: Math.min(Math.max(8, x), maxX),
    y: Math.min(Math.max(8, y), maxY),
  }
}

function restorePanel() {
  try {
    const raw = localStorage.getItem(STORAGE_KEY)
    if (!raw) return
    const data = JSON.parse(raw) as { x?: number; y?: number; expanded?: boolean }
    if (typeof data.x === 'number' && typeof data.y === 'number') {
      const next = clampPosition(data.x, data.y)
      panel.x = next.x
      panel.y = next.y
    }
    if (typeof data.expanded === 'boolean') expanded.value = data.expanded
  } catch {
    // ignore
  }
}

function persistPanel() {
  localStorage.setItem(
    STORAGE_KEY,
    JSON.stringify({ x: panel.x, y: panel.y, expanded: expanded.value }),
  )
}

function onPointerDown(event: PointerEvent) {
  if (event.button !== 0 && event.pointerType === 'mouse') return
  const target = event.target as HTMLElement
  // 模式切换按钮不进入拖拽，避免误触
  if (target.closest('.mock-panel__btn')) return

  dragging.value = true
  moved = false
  pointerIdActive = event.pointerId
  startX = event.clientX
  startY = event.clientY
  originX = panel.x
  originY = panel.y
  ;(event.currentTarget as HTMLElement).setPointerCapture(event.pointerId)
}

function onPointerMove(event: PointerEvent) {
  if (!dragging.value || pointerIdActive !== event.pointerId) return
  const dx = event.clientX - startX
  const dy = event.clientY - startY
  if (Math.abs(dx) > DRAG_THRESHOLD || Math.abs(dy) > DRAG_THRESHOLD) {
    moved = true
  }
  if (!moved) return
  const next = clampPosition(originX + dx, originY + dy)
  panel.x = next.x
  panel.y = next.y
}

function onPointerUp(event: PointerEvent) {
  if (!dragging.value || pointerIdActive !== event.pointerId) return
  dragging.value = false
  pointerIdActive = null
  try {
    ;(event.currentTarget as HTMLElement).releasePointerCapture(event.pointerId)
  } catch {
    // ignore
  }

  // 用 pointerup 判定点击：触摸端 click 常被轻微位移吞掉
  if (!moved) {
    expanded.value = !expanded.value
    const next = clampPosition(panel.x, panel.y)
    panel.x = next.x
    panel.y = next.y
  }
  persistPanel()
  moved = false
}

function onKeyToggle() {
  expanded.value = !expanded.value
  persistPanel()
}

function switchMode(next: MockUploadMode) {
  window.location.assign(buildMockUploadUrl(next))
}

function switchSubmitMode(next: MockSubmitMode) {
  window.location.assign(buildMockSubmitUrl(next))
}

function onResize() {
  const next = clampPosition(panel.x, panel.y)
  panel.x = next.x
  panel.y = next.y
}

onMounted(() => {
  if (!import.meta.env.DEV) return
  mode.value = getMockUploadMode()
  submitMode.value = getMockSubmitMode()
  restorePanel()
  visible.value = true
  window.addEventListener('resize', onResize)
})

onUnmounted(() => {
  window.removeEventListener('resize', onResize)
})
</script>

<template>
  <div
    v-if="visible"
    class="mock-panel"
    :class="{
      'mock-panel--expanded': expanded,
      'mock-panel--dragging': dragging,
    }"
    :style="{ left: `${panel.x}px`, top: `${panel.y}px` }"
    @pointerdown="onPointerDown"
    @pointermove="onPointerMove"
    @pointerup="onPointerUp"
    @pointercancel="onPointerUp"
  >
    <div
      class="mock-panel__handle"
      role="button"
      tabindex="0"
      :aria-expanded="expanded"
      aria-label="展开或收起上传 Mock"
      @keydown.enter.prevent="onKeyToggle"
      @keydown.space.prevent="onKeyToggle"
    >
      <span class="mock-panel__dot" />
      <span class="mock-panel__label">Mock</span>
      <span class="mock-panel__mode">{{ modeLabel }}</span>
      <span class="mock-panel__chevron" :class="{ 'mock-panel__chevron--up': expanded }">▾</span>
    </div>

    <div v-if="expanded" class="mock-panel__body">
      <p class="mock-panel__section-title">上传</p>
      <p class="mock-panel__tip">{{ tip }}</p>
      <div class="mock-panel__modes">
        <button
          v-for="item in modes"
          :key="item.key"
          type="button"
          class="mock-panel__btn"
          @pointerdown.stop
          @click="switchMode(item.key)"
          :class="{ 'mock-panel__btn--active': mode === item.key }"
        >
          {{ item.label }}
        </button>
      </div>

      <p class="mock-panel__section-title">提交 / 发送</p>
      <p class="mock-panel__tip">{{ submitTip }}</p>
      <div class="mock-panel__modes">
        <button
          v-for="item in submitModes"
          :key="item.key"
          type="button"
          class="mock-panel__btn"
          @pointerdown.stop
          @click="switchSubmitMode(item.key)"
          :class="{ 'mock-panel__btn--active': submitMode === item.key }"
        >
          {{ item.label }}
        </button>
      </div>
      <p class="mock-panel__hint">当前：{{ submitModeLabel }} · 按住拖动；轻点标题收起</p>
    </div>
  </div>
</template>

<style scoped>
.mock-panel {
  position: fixed;
  z-index: 10000;
  width: 72px;
  max-width: calc(100vw - 16px);
  border-radius: 12px;
  background: rgba(30, 36, 43, 0.96);
  border: 0.5px solid rgba(234, 247, 255, 0.12);
  color: #eaf7ff;
  font-size: 12px;
  box-shadow: 0 4px 16px rgba(0, 0, 0, 0.35);
  touch-action: none;
  user-select: none;
  overflow: hidden;
  -webkit-tap-highlight-color: transparent;
}

.mock-panel--expanded {
  width: 220px;
}

.mock-panel--dragging {
  opacity: 0.92;
}

.mock-panel__handle {
  display: flex;
  align-items: center;
  gap: 6px;
  width: 100%;
  min-height: 44px;
  padding: 8px 10px;
  color: inherit;
  cursor: grab;
}

.mock-panel--dragging .mock-panel__handle {
  cursor: grabbing;
}

.mock-panel__dot {
  width: 8px;
  height: 8px;
  border-radius: 50%;
  background: #507ffe;
  flex-shrink: 0;
}

.mock-panel__label {
  font-weight: 600;
}

.mock-panel__mode {
  margin-left: auto;
  color: rgba(245, 245, 247, 0.56);
  max-width: 72px;
  overflow: hidden;
  text-overflow: ellipsis;
  white-space: nowrap;
}

.mock-panel:not(.mock-panel--expanded) .mock-panel__mode,
.mock-panel:not(.mock-panel--expanded) .mock-panel__chevron {
  display: none;
}

.mock-panel:not(.mock-panel--expanded) {
  width: 72px;
  border-radius: 22px;
}

.mock-panel:not(.mock-panel--expanded) .mock-panel__handle {
  justify-content: center;
  padding: 10px 12px;
}

.mock-panel__chevron {
  color: rgba(245, 245, 247, 0.56);
  transition: transform 0.15s ease;
}

.mock-panel__chevron--up {
  transform: rotate(180deg);
}

.mock-panel__body {
  padding: 0 10px 10px;
  display: flex;
  flex-direction: column;
  gap: 8px;
}

.mock-panel__section-title {
  margin: 0;
  font-weight: 600;
  color: rgba(245, 245, 247, 0.88);
}

.mock-panel__tip {
  margin: 0;
  color: rgba(245, 245, 247, 0.72);
  line-height: 1.4;
}

.mock-panel__modes {
  display: flex;
  flex-wrap: wrap;
  gap: 6px;
}

.mock-panel__btn {
  height: 28px;
  padding: 0 8px;
  border-radius: 4px;
  border: 0.5px solid rgba(255, 255, 255, 0.2);
  color: rgba(245, 245, 247, 0.72);
  background: transparent;
}

.mock-panel__btn--active {
  color: #121212;
  background: #eaf7ff;
  border-color: #eaf7ff;
}

.mock-panel__hint {
  margin: 0;
  color: rgba(245, 245, 247, 0.4);
  line-height: 1.4;
}
</style>

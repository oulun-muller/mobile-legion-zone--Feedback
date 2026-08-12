<script setup lang="ts">
import { computed } from 'vue'
import { getH5ToastState } from '@/utils/toast'
import iconCaution from '@/assets/icons/icon-toast-caution.svg'
import iconError from '@/assets/icons/icon-toast-error.svg'
import iconSuccess from '@/assets/icons/icon-toast-success.svg'

const state = getH5ToastState()

const icon = computed(() => {
  if (state.variant === 'success') return iconSuccess
  if (state.variant === 'error') return iconError
  return iconCaution
})
</script>

<template>
  <Teleport to="body">
    <div v-if="state.visible" class="toast-root" role="status" aria-live="polite">
      <div class="toast">
        <img class="toast__icon" :src="icon" width="18" height="18" alt="" />
        <div class="toast__text-wrap">
          <p class="toast__text">{{ state.message }}</p>
        </div>
      </div>
    </div>
  </Teleport>
</template>

<style scoped>
.toast-root {
  position: fixed;
  inset: 0;
  z-index: 9999;
  display: flex;
  align-items: center;
  justify-content: center;
  pointer-events: none;
  padding: 16px;
}

.toast {
  display: flex;
  align-items: center;
  max-width: min(100%, 360px);
  padding: 7px 16px;
  background: #1e242b;
  border: 1px solid rgba(234, 247, 255, 0.1);
  box-shadow:
    0 2px 3px 0 #0d0d0d,
    0 4px 8px 0 rgba(13, 13, 13, 0.32),
    0 6px 16px 0 rgba(13, 13, 13, 0.2);
}

.toast__icon {
  width: 18px;
  height: 18px;
  flex-shrink: 0;
}

.toast__text-wrap {
  display: flex;
  align-items: center;
  justify-content: center;
  padding: 0 8px;
  min-width: 0;
}

.toast__text {
  margin: 0;
  font-size: 14px;
  line-height: normal;
  color: #eaf7ff;
  text-align: center;
  word-break: break-word;
}
</style>

<script setup lang="ts">
import { getH5ToastState } from '@/utils/toast'
import iconCaution from '@/assets/icons/icon-toast-caution.svg'
import iconErrorGlow from '@/assets/icons/icon-toast-error-glow.svg'
import iconErrorRing from '@/assets/icons/icon-toast-error-ring.svg'
import iconErrorX from '@/assets/icons/icon-toast-error-x.svg'
import iconSuccessCheck from '@/assets/icons/icon-toast-success-check.svg'
import iconSuccessRing from '@/assets/icons/icon-toast-success-ring.svg'

const state = getH5ToastState()
</script>

<template>
  <Teleport to="body">
    <div v-if="state.visible" class="toast-root" role="status" aria-live="polite">
      <div class="toast">
        <span v-if="state.variant === 'success'" class="toast__icon-wrap" aria-hidden="true">
          <img class="toast__icon toast__icon--layer" :src="iconSuccessRing" width="18" height="18" alt="" />
          <img class="toast__icon toast__icon--check" :src="iconSuccessCheck" width="8" height="6" alt="" />
        </span>
        <span v-else-if="state.variant === 'error'" class="toast__icon-wrap" aria-hidden="true">
          <img class="toast__icon toast__icon--layer" :src="iconErrorGlow" width="18" height="18" alt="" />
          <img class="toast__icon toast__icon--layer" :src="iconErrorRing" width="18" height="18" alt="" />
          <img class="toast__icon toast__icon--x" :src="iconErrorX" width="8" height="8" alt="" />
        </span>
        <img
          v-else
          class="toast__icon"
          :src="iconCaution"
          width="18"
          height="18"
          alt=""
        />
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
  padding: 7px 24px;
  background: #1e242b;
  border: 1px solid rgba(234, 247, 255, 0.1);
  box-shadow:
    0 2px 3px 0 #0d0d0d,
    0 4px 8px 0 rgba(13, 13, 13, 0.32),
    0 6px 16px 0 rgba(13, 13, 13, 0.2);
}

.toast__icon-wrap {
  position: relative;
  width: 18px;
  height: 18px;
  flex-shrink: 0;
}

.toast__icon {
  width: 18px;
  height: 18px;
  flex-shrink: 0;
}

.toast__icon--layer {
  position: absolute;
  inset: 0;
}

.toast__icon--check {
  position: absolute;
  left: 5px;
  top: 6px;
  width: 8px;
  height: 6px;
}

.toast__icon--x {
  position: absolute;
  left: 5px;
  top: 5px;
  width: 8px;
  height: 8px;
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

<script setup lang="ts">
import { useRouter } from 'vue-router'
import iconBack from '@/assets/icons/icon-back.svg'

const props = withDefaults(
  defineProps<{
    title?: string
    showBack?: boolean
    backTo?: string
    /** 为 true 时仅触发 back 事件，不执行默认路由返回 */
    manualBack?: boolean
  }>(),
  {
    title: '',
    showBack: true,
    manualBack: false,
  },
)

const emit = defineEmits<{
  back: []
}>()

const router = useRouter()

function onBack() {
  emit('back')
  if (props.manualBack) return
  if (props.backTo) {
    router.push(props.backTo)
    return
  }
  if (window.history.length > 1) {
    router.back()
  } else {
    router.push('/')
  }
}
</script>

<template>
  <header class="nav">
    <button
      v-if="showBack"
      class="nav__side nav__back"
      type="button"
      aria-label="返回"
      @click="onBack"
    >
      <span class="nav__icon-wrap">
        <img class="nav__back-icon" :src="iconBack" width="9" height="18" alt="" />
      </span>
    </button>
    <div v-else class="nav__side" />

    <div class="nav__center">
      <slot name="center">
        <h1 v-if="title" class="nav__title">{{ title }}</h1>
      </slot>
    </div>

    <div class="nav__side nav__right">
      <slot name="right" />
    </div>
  </header>
</template>

<style scoped>
.nav {
  display: flex;
  align-items: center;
  height: var(--nav-height);
  flex-shrink: 0;
  background: var(--bg-page);
  border-bottom: 0.5px solid var(--border-subtle);
}

.nav__side {
  width: 56px;
  height: 56px;
  flex-shrink: 0;
  display: flex;
  align-items: center;
  justify-content: center;
}

.nav__right {
  width: auto;
  min-width: 56px;
  padding: 0 16px;
  justify-content: flex-end;
}

.nav__center {
  flex: 1;
  min-width: 0;
  display: flex;
  align-items: center;
  justify-content: center;
  height: 100%;
}

.nav__title {
  margin: 0;
  max-width: 100%;
  overflow: hidden;
  text-overflow: ellipsis;
  white-space: nowrap;
  font-size: 18px;
  font-weight: 500;
  line-height: 29px;
  color: var(--text-primary);
  text-align: center;
}

.nav__icon-wrap {
  display: flex;
  align-items: center;
  justify-content: center;
  width: 24px;
  height: 24px;
}

.nav__back-icon {
  width: 9px;
  height: 18px;
}
</style>

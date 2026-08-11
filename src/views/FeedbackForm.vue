<script setup lang="ts">
import { computed, nextTick, onMounted, ref, watch } from 'vue'
import { useRoute, useRouter } from 'vue-router'
import AppNavBar from '@/components/AppNavBar.vue'
import PhotoThumb from '@/components/PhotoThumb.vue'
import { useAutoGrowField } from '@/composables/useAutoGrowField'
import { useLocalImages } from '@/composables/useLocalImages'
import { FEEDBACK_TYPES } from '@/data/mock'
import { useFeedbackStore } from '@/stores/feedback'
import { simulateSubmit } from '@/utils/mockSubmit'
import { leaveToHelpCenter } from '@/utils/helpTab'
import { toast, toastError, toastSuccess } from '@/utils/toast'
import iconAddPicture from '@/assets/icons/icon-add-picture.svg'
import iconBell from '@/assets/icons/icon-bell.svg'
import iconCheck from '@/assets/icons/icon-check.svg'

/** 稿面问题描述区：min 48 / max 228 */
const DESC_FIELD_MIN = 48
const DESC_FIELD_MAX = 228
/** 中国大陆手机号：1 开头，第二位 3-9，共 11 位 */
const PHONE_REGEX = /^1[3-9]\d{9}$/
/** QQ 号：5-11 位纯数字，首位不为 0 */
const QQ_REGEX = /^[1-9]\d{4,10}$/

const router = useRouter()
const route = useRoute()
const store = useFeedbackStore()

function leaveForm() {
  leaveToHelpCenter(route, router)
}

const selectedType = ref<string>('')
const description = ref('')
const qq = ref('')
const phone = ref('')
const phoneTouched = ref(false)
const qqTouched = ref(false)
const submitting = ref(false)
const descFieldRef = ref<HTMLElement | null>(null)
const descTextareaRef = ref<HTMLTextAreaElement | null>(null)
const {
  scrollbar: descScrollbar,
  resize: resizeDescField,
  updateScrollbar: updateDescScrollbar,
} = useAutoGrowField(descFieldRef, descTextareaRef, {
  minHeight: DESC_FIELD_MIN,
  maxHeight: DESC_FIELD_MAX,
})
const {
  images,
  allowMultiple,
  onPickImages,
  removeImage,
  retryImage,
  getReadyUrls,
  assertReadyToSubmit,
} = useLocalImages()

/** 仅「反馈类型」「问题描述」必填；附加图片、联系方式均为选填 */
const canSubmit = computed(
  () => Boolean(selectedType.value) && description.value.trim().length > 0,
)

const phoneError = computed(() => {
  // 选填：未填写不校验；仅填写了才校验格式
  if (!phoneTouched.value || !phone.value.trim()) return ''
  return PHONE_REGEX.test(phone.value.trim()) ? '' : '请输入正确手机号码'
})

const qqError = computed(() => {
  if (!qqTouched.value || !qq.value.trim()) return ''
  return QQ_REGEX.test(qq.value.trim()) ? '' : '请输入正确QQ号码'
})

const contactHint = computed(() =>
  phoneError.value || qqError.value || '请提供联系方式，以便我们能与您取得联系',
)

onMounted(() => {
  nextTick(resizeDescField)
})

watch(description, () => {
  nextTick(resizeDescField)
})

async function submit() {
  if (!canSubmit.value || submitting.value) return
  if (!assertReadyToSubmit()) return

  // 联系方式选填：有填写才做格式校验
  if (qq.value.trim()) {
    qqTouched.value = true
    if (!QQ_REGEX.test(qq.value.trim())) {
      toast('请输入正确QQ号码')
      return
    }
  }

  if (phone.value.trim()) {
    phoneTouched.value = true
    if (!PHONE_REGEX.test(phone.value.trim())) {
      toast('请输入正确手机号码')
      return
    }
  }

  submitting.value = true
  const ok = await simulateSubmit()
  submitting.value = false

  if (!ok) {
    toastError('提交失败，请重试')
    return
  }

  store.submitTicket({
    title: description.value.trim(),
    images: getReadyUrls(),
  })
  toastSuccess('提交成功')
  leaveForm()
}
</script>

<template>
  <div class="page form-page">
    <AppNavBar title="我要反馈" manual-back @back="leaveForm">
      <template #right>
        <button
          type="button"
          class="submit"
          :class="{ 'submit--ready': canSubmit }"
          :disabled="!canSubmit || submitting"
          @click="submit"
        >
          提交
        </button>
      </template>
    </AppNavBar>

    <main class="page__body--scroll">
      <div class="page__body form">
      <section class="block">
        <p class="label">
          反馈类型 <span class="req">*</span>
        </p>
        <div class="types">
          <button
            v-for="type in FEEDBACK_TYPES"
            :key="type"
            type="button"
            class="type"
            :class="{ 'type--active': selectedType === type }"
            @click="selectedType = type"
          >
            <span>{{ type }}</span>
            <img
              v-if="selectedType === type"
              class="type__check"
              :src="iconCheck"
              width="20"
              height="20"
              alt=""
            />
          </button>
        </div>
      </section>

      <section class="block">
        <p class="label">
          问题描述 <span class="req">*</span>
        </p>
        <div class="surface-card desc">
          <div class="desc__text">
            <div class="desc__field-wrap">
              <div
                ref="descFieldRef"
                class="desc__field"
                @scroll="updateDescScrollbar"
              >
                <textarea
                  ref="descTextareaRef"
                  v-model="description"
                  maxlength="500"
                  rows="1"
                  placeholder="期待你的建议，帮助我们做的更好～"
                  @input="resizeDescField"
                />
              </div>
              <div
                v-show="descScrollbar.visible"
                class="desc__scrollbar"
                aria-hidden="true"
              >
                <div
                  class="desc__scrollbar-thumb"
                  :style="{
                    height: `${descScrollbar.thumbH}px`,
                    transform: `translateY(${descScrollbar.thumbTop}px)`,
                  }"
                />
              </div>
            </div>
            <p class="desc__count">{{ description.length }}/500</p>
          </div>
          <div class="divider tight" />
          <div class="desc__photos">
            <PhotoThumb
              v-for="(img, index) in images"
              :key="img.id"
              :src="img.url"
              :size="88"
              :status="img.status"
              deletable
              @remove="removeImage(index)"
              @retry="retryImage(index)"
            />
            <label v-if="images.length < 3" class="uploader">
              <input
                type="file"
                accept="image/*"
                :multiple="allowMultiple"
                hidden
                @change="onPickImages"
              />
              <span class="uploader__icon-wrap">
                <img class="uploader__icon" :src="iconAddPicture" width="24" height="24" alt="" />
              </span>
              <span class="uploader__text">
                <span>附加照片</span>
                <span>{{ images.length }}/3</span>
              </span>
            </label>
          </div>
        </div>
      </section>

      <section class="block">
        <div class="contact-head">
          <p class="label plain">联系方式</p>
          <p
            class="contact-hint"
            :class="{ 'contact-hint--error': phoneError || qqError }"
          >
            {{ contactHint }}
          </p>
        </div>
        <div class="surface-card contact">
          <label class="field">
            <span>QQ号码</span>
            <input
              v-model="qq"
              type="text"
              inputmode="numeric"
              placeholder="点击输入QQ号码"
              @blur="qqTouched = true"
            />
          </label>
          <div class="divider" />
          <label class="field">
            <span>手机号码</span>
            <input
              v-model="phone"
              type="tel"
              inputmode="numeric"
              placeholder="点击输入手机号码"
              @blur="phoneTouched = true"
            />
          </label>
        </div>
      </section>

      <div class="qq-tip">
        <img class="qq-tip__icon" :src="iconBell" width="16" height="16" alt="" />
        <p>加入官方QQ群：xxxxxxxx 更快解决您的问题！</p>
      </div>
      </div>
    </main>
  </div>
</template>

<style scoped>
.form-page {
  height: 100%;
  max-height: 100dvh;
  overflow: hidden;
}

.submit {
  font-size: 16px;
  color: var(--brand-mid);
  opacity: 0.4;
  white-space: nowrap;
}

.submit--ready {
  opacity: 1;
}

.form {
  display: flex;
  flex-direction: column;
  gap: 16px;
}

.block {
  display: flex;
  flex-direction: column;
  gap: 8px;
  width: 100%;
}

.label {
  margin: 0;
  font-size: 16px;
  color: var(--text-tertiary);
}

.label.plain {
  color: var(--text-tertiary);
}

.req {
  color: var(--danger);
}

.types {
  display: grid;
  grid-template-columns: repeat(3, minmax(0, 1fr));
  gap: 8px;
}

.type {
  position: relative;
  height: 36px;
  display: flex;
  align-items: center;
  justify-content: center;
  padding: 0 8px;
  border-radius: 4px;
  background: var(--surface-deep);
  border: 0.5px solid var(--border-subtle);
  font-size: 14px;
  color: var(--text-primary);
  overflow: hidden;
}

.type--active {
  border-color: var(--brand-link);
}

.type__check {
  position: absolute;
  right: -0.5px;
  bottom: -0.5px;
  width: 20px;
  height: 20px;
}

.desc__text {
  display: flex;
  flex-direction: column;
  gap: 8px;
  padding: 16px;
}

.desc__field-wrap {
  position: relative;
  width: 100%;
}

.desc__field {
  width: 100%;
  min-height: 48px;
  max-height: 228px;
  height: 48px;
  /* 右侧固定留出滚动条轨道，避免显隐 padding 导致「有溢出 ↔ 无溢出」抖动把自绘条关掉 */
  padding-right: 12px;
  overflow-x: hidden;
  overflow-y: auto;
  overscroll-behavior: contain;
  scrollbar-width: none;
  -ms-overflow-style: none;
}

.desc__field::-webkit-scrollbar {
  display: none;
  width: 0;
  height: 0;
}

.desc__scrollbar {
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

.desc__scrollbar-thumb {
  width: 3px;
  border-radius: 18px;
  background: rgba(255, 255, 255, 0.12);
  flex-shrink: 0;
  will-change: transform;
}

.desc__field textarea {
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

.desc__field textarea::placeholder {
  color: var(--text-tertiary);
}

.desc__count {
  text-align: right;
  font-size: 14px;
  color: var(--text-disabled);
}

.divider.tight {
  margin: 0 8px;
}

.desc__photos {
  display: flex;
  flex-wrap: wrap;
  gap: 8px;
  padding: 8px;
}

.uploader {
  width: 88px;
  height: 88px;
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  gap: 4px;
  padding: 8px;
  border-radius: 2px;
  border: 0.5px dashed var(--border-strong);
  background: var(--brand-accent-muted);
  opacity: 0.8;
}

.uploader__icon-wrap {
  display: flex;
  align-items: center;
  justify-content: center;
  width: 40px;
  height: 40px;
}

.uploader__icon {
  width: 24px;
  height: 24px;
}

.uploader__text {
  display: flex;
  gap: 2px;
  font-size: 12px;
  color: var(--text-secondary);
  white-space: nowrap;
}

.contact-head {
  display: flex;
  align-items: center;
  justify-content: space-between;
  gap: 8px;
}

.contact-hint {
  margin: 0;
  font-size: 14px;
  color: var(--text-disabled);
  white-space: nowrap;
}

.contact-hint--error {
  color: var(--danger);
}

.field {
  display: flex;
  align-items: center;
  gap: 8px;
  height: 56px;
  padding: 16px;
  font-size: 16px;
}

.field span {
  flex-shrink: 0;
  color: var(--text-primary);
  white-space: nowrap;
}

.field input {
  flex: 1;
  min-width: 0;
  border: 0;
  outline: none;
  background: transparent;
  text-align: right;
  color: var(--text-primary);
}

.field input::placeholder {
  color: var(--text-disabled);
}

.qq-tip {
  display: flex;
  align-items: center;
  justify-content: center;
  gap: 10px;
  min-height: 48px;
  padding: 8px 16px;
}

.qq-tip__icon {
  width: 16px;
  height: 16px;
  flex-shrink: 0;
}

.qq-tip p {
  font-size: 14px;
  color: var(--brand-mid);
  white-space: nowrap;
}
</style>

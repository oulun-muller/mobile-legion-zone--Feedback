import { computed, ref } from 'vue'
import {
  createLocalImage,
  simulateUpload,
  type LocalImage,
} from '@/utils/mockUpload'
import { toast } from '@/utils/toast'

export const MAX_IMAGES = 3
/** 单张图片大小上限 50MB */
export const MAX_IMAGE_BYTES = 50 * 1024 * 1024
/** 已选图片总大小上限 120MB，避免移动端一次性读入过多 Blob 导致卡顿/崩溃 */
export const MAX_TOTAL_IMAGE_BYTES = 120 * 1024 * 1024

export function useLocalImages() {
  const images = ref<LocalImage[]>([])

  const remainCount = computed(() => Math.max(0, MAX_IMAGES - images.value.length))
  /** 只剩 1 个名额时改为单选，系统相册不会允许多选 */
  const allowMultiple = computed(() => remainCount.value > 1)

  async function runUpload(item: LocalImage) {
    await simulateUpload((status) => {
      const target = images.value.find((img) => img.id === item.id)
      if (target) target.status = status
    })
  }

  function onPickImages(event: Event) {
    const input = event.target as HTMLInputElement
    const files = Array.from(input.files || [])
    input.value = ''

    const remain = remainCount.value
    if (remain <= 0) {
      toast('最多支持3张图片')
      return
    }

    const picked = files.slice(0, remain)
    if (files.length > remain) {
      toast('最多支持3张图片')
    }

    // 逐个校验并过滤：一批里有不合规的文件时，合规的仍然正常添加，
    // 不合规的单独跳过（而不是整批作废）。
    let runningTotal = images.value.reduce((sum, img) => sum + img.size, 0)
    const valid: File[] = []
    let hasInvalidType = false
    let hasOverSize = false
    let hasOverTotal = false

    for (const file of picked) {
      if (!file.type.startsWith('image/')) {
        hasInvalidType = true
        continue
      }
      if (file.size > MAX_IMAGE_BYTES) {
        hasOverSize = true
        continue
      }
      if (runningTotal + file.size > MAX_TOTAL_IMAGE_BYTES) {
        hasOverTotal = true
        continue
      }
      runningTotal += file.size
      valid.push(file)
    }

    if (hasInvalidType) toast('请选择图片文件')
    else if (hasOverSize) toast('请选择50M以内图片')
    else if (hasOverTotal) toast('图片总大小超出限制')

    valid.forEach((file) => {
      const item = createLocalImage(file)
      images.value.push(item)
      void runUpload(item)
    })
  }

  function openPicker(input: HTMLInputElement | null) {
    if (!input) return
    if (remainCount.value <= 0) {
      toast('最多支持3张图片')
      return
    }
    input.click()
  }

  function removeImage(index: number) {
    const [removed] = images.value.splice(index, 1)
    if (removed?.url.startsWith('blob:')) URL.revokeObjectURL(removed.url)
  }

  function retryImage(index: number) {
    const item = images.value[index]
    if (!item) return
    item.status = 'uploading'
    void runUpload(item)
  }

  function clearImages() {
    images.value.forEach((img) => {
      if (img.url.startsWith('blob:')) URL.revokeObjectURL(img.url)
    })
    images.value = []
  }

  function getReadyUrls() {
    return images.value.filter((img) => img.status === 'done').map((img) => img.url)
  }

  function assertReadyToSubmit() {
    if (images.value.some((img) => img.status === 'uploading')) {
      toast('图片上传中，请稍候')
      return false
    }
    if (images.value.some((img) => img.status === 'error')) {
      toast('有图片上传失败，请删除或重试')
      return false
    }
    return true
  }

  return {
    images,
    remainCount,
    allowMultiple,
    onPickImages,
    openPicker,
    removeImage,
    retryImage,
    clearImages,
    getReadyUrls,
    assertReadyToSubmit,
  }
}

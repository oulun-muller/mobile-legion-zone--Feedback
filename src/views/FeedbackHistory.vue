<script setup lang="ts">
import { useRoute, useRouter } from 'vue-router'
import AppNavBar from '@/components/AppNavBar.vue'
import { useFeedbackStore } from '@/stores/feedback'
import { leaveToHelpCenter } from '@/utils/helpTab'
import iconChevron from '@/assets/icons/icon-chevron.svg'

const router = useRouter()
const route = useRoute()
const store = useFeedbackStore()

function leaveHistory() {
  leaveToHelpCenter(route, router)
}

function openDetail(id: string) {
  router.push({
    path: `/detail/${id}`,
    query: route.query.fromTab ? { fromTab: route.query.fromTab } : undefined,
  })
}
</script>

<template>
  <div class="page history-page">
    <AppNavBar title="历史反馈" manual-back @back="leaveHistory" />

    <main class="page__body--scroll">
      <div class="page__body history">
        <button
          v-for="ticket in store.tickets"
          :key="ticket.id"
          type="button"
          class="surface-card item"
          @click="openDetail(ticket.id)"
        >
          <div class="item__top">
            <p class="item__title">{{ ticket.title }}</p>
            <div class="item__meta-right">
              <span v-if="ticket.unread > 0" class="badge">{{ ticket.unread }}</span>
              <span class="item__chevron-wrap">
                <img class="item__chevron" :src="iconChevron" width="6" height="12" alt="" />
              </span>
            </div>
          </div>
          <div class="divider" />
          <div class="item__bottom">
            <span class="item__time">{{ ticket.time }}</span>
            <span
              class="item__status"
              :class="{ 'item__status--pending': ticket.status === 'pending' }"
            >
              {{ ticket.status === 'replied' ? '已回复' : '待回复' }}
            </span>
          </div>
        </button>
      </div>
    </main>
  </div>
</template>

<style scoped>
.history-page {
  height: 100%;
  max-height: 100dvh;
  overflow: hidden;
}

.history {
  display: flex;
  flex-direction: column;
  gap: 16px;
}

.item {
  width: 100%;
  text-align: left;
  overflow: hidden;
}

.item__top {
  display: flex;
  align-items: center;
  gap: 8px;
  padding: 16px;
}

.item__title {
  flex: 1;
  min-width: 0;
  overflow: hidden;
  text-overflow: ellipsis;
  white-space: nowrap;
  font-size: 16px;
  color: var(--text-primary);
}

.item__meta-right {
  display: flex;
  align-items: center;
  gap: 4px;
  flex-shrink: 0;
}

.item__chevron-wrap {
  display: flex;
  align-items: center;
  justify-content: center;
  width: 24px;
  height: 24px;
  /* 左箭头图标旋转为向右，表示进入详情 */
  transform: rotate(180deg);
}

.item__chevron {
  width: 6px;
  height: 12px;
}

.item__bottom {
  display: flex;
  align-items: center;
  gap: 10px;
  padding: 10px 16px;
}

.item__time {
  font-size: 12px;
  color: var(--text-tertiary);
  white-space: pre;
}

.item__status {
  flex: 1;
  min-width: 0;
  text-align: right;
  font-size: 14px;
  color: var(--text-tertiary);
}

/* 稿面：已回复 tertiary 灰；待回复 warning 黄 */
.item__status--pending {
  color: var(--warning-default);
}
</style>

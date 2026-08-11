<script setup lang="ts">
import { computed, ref } from 'vue'
import { useRoute, useRouter } from 'vue-router'
import AppNavBar from '@/components/AppNavBar.vue'
import { FAQ_ITEMS, HELP_TABS, type HelpTab } from '@/data/mock'
import { useFeedbackStore } from '@/stores/feedback'
import { parseHelpTab } from '@/utils/helpTab'
import iconChevron from '@/assets/icons/icon-chevron.svg'
import iconFeedback from '@/assets/icons/icon-feedback.svg'
import iconHistory from '@/assets/icons/icon-history.svg'

const router = useRouter()
const route = useRoute()
const store = useFeedbackStore()

const activeTab = computed({
  get: () => parseHelpTab(route.query.tab),
  set: (tab: HelpTab) => {
    const query = { ...route.query }
    if (tab === 'hot') delete query.tab
    else query.tab = tab
    router.replace({ query })
  },
})
const expandedId = ref<string>('f2')

const faqs = computed(() => FAQ_ITEMS.filter((item) => item.tab === activeTab.value))

function toggle(id: string) {
  expandedId.value = expandedId.value === id ? '' : id
}

function goFeedback() {
  router.push({
    path: '/feedback',
    query: { fromTab: activeTab.value },
  })
}

function goHistory() {
  router.push({
    path: '/history',
    query: { fromTab: activeTab.value },
  })
}
</script>

<template>
  <div class="page help">
    <AppNavBar class="help__nav">
      <template #center>
        <div class="tabs tabs--mobile">
          <button
            v-for="tab in HELP_TABS"
            :key="tab.key"
            type="button"
            class="tabs__item"
            :class="{ 'tabs__item--active': activeTab === tab.key }"
            @click="activeTab = tab.key"
          >
            {{ tab.label }}
          </button>
        </div>
        <h1 class="help__title">帮助与反馈</h1>
      </template>
      <template #right>
        <div class="nav-actions">
          <button type="button" class="nav-actions__btn nav-actions__btn--history" @click="goHistory">
            <img class="nav-actions__icon" :src="iconHistory" width="18" height="18" alt="" />
            <span>历史反馈</span>
            <span v-if="store.unreadTotal > 0" class="badge nav-actions__badge">
              {{ store.unreadTotal }}
            </span>
          </button>
          <div class="nav-actions__sep" />
          <button type="button" class="nav-actions__btn" @click="goFeedback">
            <img class="nav-actions__icon" :src="iconFeedback" width="18" height="18" alt="" />
            <span>我要反馈</span>
          </button>
        </div>
      </template>
    </AppNavBar>

    <div class="help__body">
      <aside class="sidebar" aria-label="问题分类">
        <button
          v-for="tab in HELP_TABS"
          :key="tab.key"
          type="button"
          class="sidebar__item"
          :class="{ 'sidebar__item--active': activeTab === tab.key }"
          @click="activeTab = tab.key"
        >
          {{ tab.label }}
        </button>
      </aside>

      <main class="page__body--scroll help__list">
        <div class="help__list-inner">
          <article
            v-for="item in faqs"
            :key="item.id"
            class="surface-card faq"
            :class="{ 'faq--open': expandedId === item.id }"
          >
            <button type="button" class="faq__head" @click="toggle(item.id)">
              <span class="faq__q">{{ item.question }}</span>
              <span
                class="faq__chevron-wrap"
                :class="{ 'faq__chevron-wrap--up': expandedId === item.id }"
              >
                <img class="faq__chevron" :src="iconChevron" width="6" height="12" alt="" />
              </span>
            </button>
            <template v-if="expandedId === item.id">
              <div class="divider" />
              <div class="faq__body">
                <p>{{ item.answer }}</p>
              </div>
            </template>
          </article>
        </div>
      </main>
    </div>

    <footer class="help__footer">
      <button type="button" class="help__action" @click="goFeedback">
        <img class="help__action-icon" :src="iconFeedback" width="18" height="18" alt="" />
        <span>我要反馈</span>
      </button>
      <div class="help__sep" />
      <button type="button" class="help__action help__action--history" @click="goHistory">
        <img class="help__action-icon" :src="iconHistory" width="18" height="18" alt="" />
        <span>历史反馈</span>
        <span v-if="store.unreadTotal > 0" class="badge help__badge">{{ store.unreadTotal }}</span>
      </button>
    </footer>
  </div>
</template>

<style scoped>
.help {
  height: 100%;
  max-height: 100dvh;
  overflow: hidden;
}

.help__title {
  display: none;
  margin: 0;
  font-size: 18px;
  font-weight: 500;
  line-height: 29px;
  color: var(--text-primary);
}

.tabs {
  display: flex;
  width: 100%;
  height: 100%;
}

.tabs__item {
  flex: 1;
  height: 100%;
  display: flex;
  align-items: center;
  justify-content: center;
  padding: 4px 12px;
  font-size: 16px;
  color: var(--text-secondary);
  border-bottom: 1px solid transparent;
}

.tabs__item--active {
  font-size: 18px;
  font-weight: 500;
  color: var(--brand-mid);
  border-bottom-color: var(--brand-mid);
}

.nav-actions {
  display: none;
  align-items: center;
  gap: 4px;
}

.nav-actions__btn {
  position: relative;
  display: flex;
  align-items: center;
  gap: 8px;
  height: 56px;
  padding: 0 16px;
  color: var(--brand-mid);
  font-size: 18px;
  white-space: nowrap;
}

.nav-actions__btn--history {
  gap: 10px;
}

.nav-actions__icon {
  width: 18px;
  height: 18px;
  flex-shrink: 0;
}

.nav-actions__sep {
  width: 0.5px;
  height: 16px;
  background: var(--border-subtle);
  flex-shrink: 0;
}

.nav-actions__badge {
  position: absolute;
  top: 4px;
  left: 110px;
}

.help__body {
  flex: 1;
  min-height: 0;
  display: flex;
  width: 100%;
}

.sidebar {
  display: none;
  width: var(--sidebar-width);
  flex-shrink: 0;
  flex-direction: column;
  padding: 16px 0;
  background: var(--bg-elevated);
  border-right: 0.5px solid var(--border-subtle);
}

.sidebar__item {
  display: flex;
  align-items: center;
  width: 100%;
  height: 56px;
  padding: 16px 24px;
  font-size: 16px;
  color: var(--text-secondary);
  text-align: left;
  border-right: 1px solid transparent;
}

.sidebar__item--active {
  background: var(--surface-default);
  color: var(--brand-mid);
  font-size: 18px;
  font-weight: 500;
  border-right-color: var(--brand-mid);
}

.help__list {
  flex: 1;
  min-width: 0;
  width: 100%;
  overflow: auto;
  -webkit-overflow-scrolling: touch;
}

.help__list-inner {
  display: flex;
  flex-direction: column;
  gap: 16px;
  width: 100%;
  max-width: var(--content-max);
  margin: 0 auto;
  padding: 16px;
}

.faq__head {
  display: flex;
  gap: 8px;
  align-items: flex-start;
  width: 100%;
  padding: 16px;
  text-align: left;
}

.faq__q {
  flex: 1;
  min-width: 0;
  font-size: 16px;
  color: var(--text-primary);
  line-height: normal;
}

.faq__chevron-wrap {
  display: flex;
  align-items: center;
  justify-content: center;
  width: 24px;
  height: 24px;
  flex-shrink: 0;
  transform: rotate(-90deg);
}

.faq__chevron-wrap--up {
  transform: rotate(90deg);
}

.faq__chevron {
  width: 6px;
  height: 12px;
}

.faq__body {
  padding: 16px;
}

.faq__body p {
  font-size: 16px;
  line-height: 2;
  color: var(--text-secondary);
}

.help__footer {
  display: flex;
  align-items: center;
  gap: 8px;
  height: 72px;
  padding: 0 8px;
  flex-shrink: 0;
  background: var(--bg-page);
  border-top: 0.5px solid var(--border-subtle);
}

.help__action {
  position: relative;
  flex: 1;
  height: 48px;
  display: flex;
  align-items: center;
  justify-content: center;
  gap: 8px;
  color: var(--brand-mid);
  font-size: 16px;
}

.help__action--history {
  gap: 10px;
}

.help__action-icon {
  width: 18px;
  height: 18px;
  flex-shrink: 0;
}

.help__sep {
  width: 0.5px;
  height: 16px;
  background: var(--border-subtle);
  flex-shrink: 0;
}

.help__badge {
  position: absolute;
  top: 0;
  right: calc(50% - 68px);
}

@media (min-width: 840px) {
  .tabs--mobile {
    display: none;
  }

  .help__title {
    display: block;
  }

  .nav-actions {
    display: flex;
  }

  .help__footer {
    display: none;
  }

  .sidebar {
    display: flex;
  }

  .help__nav :deep(.nav__side) {
    flex: 1;
    width: auto;
    min-width: 0;
    justify-content: flex-start;
  }

  .help__nav :deep(.nav__right) {
    justify-content: flex-end;
    padding: 0;
  }

  .help__nav :deep(.nav__center) {
    flex: 1;
  }
}
</style>

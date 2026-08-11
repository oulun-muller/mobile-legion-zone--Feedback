import { createRouter, createWebHistory } from 'vue-router'

const router = createRouter({
  history: createWebHistory(),
  routes: [
    {
      path: '/',
      name: 'help',
      component: () => import('@/views/HelpCenter.vue'),
      meta: { title: '帮助与反馈' },
    },
    {
      path: '/feedback',
      name: 'feedback',
      component: () => import('@/views/FeedbackForm.vue'),
      meta: { title: '我要反馈' },
    },
    {
      path: '/history',
      name: 'history',
      component: () => import('@/views/FeedbackHistory.vue'),
      meta: { title: '历史反馈' },
    },
    {
      path: '/detail/:id',
      name: 'detail',
      component: () => import('@/views/FeedbackDetail.vue'),
      meta: { title: '反馈详情' },
    },
    {
      path: '/:pathMatch(.*)*',
      redirect: '/',
    },
  ],
  scrollBehavior() {
    return { top: 0 }
  },
})

router.afterEach((to) => {
  const title = (to.meta.title as string) || '帮助与反馈'
  document.title = title
})

export default router

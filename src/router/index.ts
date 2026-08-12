import { createRouter, createWebHashHistory } from 'vue-router'
import HelpCenter from '@/views/HelpCenter.vue'
import FeedbackForm from '@/views/FeedbackForm.vue'
import FeedbackHistory from '@/views/FeedbackHistory.vue'
import FeedbackDetail from '@/views/FeedbackDetail.vue'

const router = createRouter({
  // Hash 模式：支持双击 dist/index.html（file://）打开
  history: createWebHashHistory(),
  routes: [
    {
      path: '/',
      name: 'help',
      // 同步引入：避免 file:// 下动态 import 分片被浏览器拦截
      component: HelpCenter,
      meta: { title: '帮助与反馈' },
    },
    {
      path: '/feedback',
      name: 'feedback',
      component: FeedbackForm,
      meta: { title: '我要反馈' },
    },
    {
      path: '/history',
      name: 'history',
      component: FeedbackHistory,
      meta: { title: '历史反馈' },
    },
    {
      path: '/detail/:id',
      name: 'detail',
      component: FeedbackDetail,
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

import type { RouteLocationNormalizedLoaded, Router } from 'vue-router'
import type { HelpTab } from '@/data/mock'

const HELP_TABS: HelpTab[] = ['hot', 'install', 'account']

export function parseHelpTab(value: unknown): HelpTab {
  if (typeof value === 'string' && HELP_TABS.includes(value as HelpTab)) {
    return value as HelpTab
  }
  return 'hot'
}

export function helpCenterLocation(tab: HelpTab = 'hot') {
  return tab === 'hot' ? { path: '/' } : { path: '/', query: { tab } }
}

export function historyLocation(fromTab?: HelpTab) {
  return fromTab && fromTab !== 'hot'
    ? { path: '/history', query: { fromTab } }
    : { path: '/history' }
}

/** 返回帮助页，优先 history.back 以保留 tab 等上一页状态 */
export function leaveToHelpCenter(
  route: RouteLocationNormalizedLoaded,
  router: Router,
) {
  if (window.history.length > 1) {
    router.back()
    return
  }
  router.push(helpCenterLocation(parseHelpTab(route.query.fromTab)))
}

/** 返回历史反馈列表，优先 history.back，避免 push 造成详情 ↔ 历史循环 */
export function leaveToHistory(
  route: RouteLocationNormalizedLoaded,
  router: Router,
) {
  if (window.history.length > 1) {
    router.back()
    return
  }
  router.push(historyLocation(parseHelpTab(route.query.fromTab)))
}

import { defineStore } from 'pinia'
import { computed, ref } from 'vue'
import {
  type FeedbackTicket,
  INITIAL_TICKETS,
} from '@/data/mock'

function nowLabel() {
  const d = new Date()
  return `${d.getFullYear()}-${d.getMonth() + 1}-${d.getDate()}  ${String(d.getHours()).padStart(2, '0')}:${String(d.getMinutes()).padStart(2, '0')}`
}

/**
 * 生成不会碰撞的自增 id：单纯用 `Date.now()` 拼接在同一毫秒内两次调用
 * 会产生重复 id，导致 `:key` 冲突 / 数据查找错位。
 * 不用 crypto.randomUUID()：真机联调常通过 http://局域网IP 访问（非安全上下文），
 * 该 API 在非 https / 非 localhost 环境下不可用。
 */
function createIdFactory(prefix: string) {
  let seq = 0
  return () => {
    seq += 1
    return `${prefix}${Date.now()}-${seq}`
  }
}

const nextTicketId = createIdFactory('t')
const nextMessageId = createIdFactory('m')

export const useFeedbackStore = defineStore('feedback', () => {
  const ticketList = ref<FeedbackTicket[]>(
    structuredClone(INITIAL_TICKETS).map((t) => ({
      ...t,
      messages: t.messages.map((m) => ({ ...m })),
    })),
  )

  /** 历史列表：按最近更新时间倒序 */
  const tickets = computed(() =>
    [...ticketList.value].sort((a, b) => b.updatedAt - a.updatedAt),
  )

  const unreadTotal = computed(() =>
    ticketList.value.reduce((sum, t) => sum + t.unread, 0),
  )

  function getTicket(id: string) {
    return ticketList.value.find((t) => t.id === id)
  }

  function markRead(id: string) {
    const ticket = getTicket(id)
    if (ticket) ticket.unread = 0
  }

  function submitTicket(payload: {
    title: string
    images: string[]
  }) {
    const id = nextTicketId()
    const now = Date.now()
    ticketList.value.push({
      id,
      title: payload.title,
      time: nowLabel(),
      updatedAt: now,
      status: 'pending',
      unread: 0,
      messages: [
        {
          id: nextMessageId(),
          role: 'user',
          name: '我',
          time: nowLabel(),
          text: payload.title,
          images: payload.images.length ? [...payload.images] : undefined,
        },
      ],
    })
    return id
  }

  function appendReply(id: string, text: string, images: string[]) {
    const ticket = getTicket(id)
    if (!ticket || (!text.trim() && images.length === 0)) return

    const now = Date.now()
    ticket.messages.push({
      id: nextMessageId(),
      role: 'user',
      name: '我',
      time: nowLabel(),
      text: text.trim() || undefined,
      images: images.length ? [...images] : undefined,
    })
    ticket.status = 'pending'
    ticket.time = nowLabel()
    ticket.updatedAt = now
  }

  return {
    tickets,
    unreadTotal,
    getTicket,
    markRead,
    submitTicket,
    appendReply,
  }
})

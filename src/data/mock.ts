import chatThumb from '@/assets/icons/chat-thumb.png'

export type HelpTab = 'hot' | 'install' | 'account'

export interface FaqItem {
  id: string
  tab: HelpTab
  question: string
  answer: string
}

export type FeedbackStatus = 'replied' | 'pending'

export interface ChatMessage {
  id: string
  role: 'user' | 'ops'
  name: string
  time: string
  text?: string
  images?: string[]
}

export interface FeedbackTicket {
  id: string
  title: string
  /** 列表展示用时间文案 */
  time: string
  /** 最近更新时间戳，用于历史列表倒序 */
  updatedAt: number
  status: FeedbackStatus
  unread: number
  messages: ChatMessage[]
}

export const FEEDBACK_TYPES = [
  '性能卡顿',
  'Legion社区',
  '我的游戏',
  '设备管理',
  '程序bug',
  '其他',
] as const

export const HELP_TABS: { key: HelpTab; label: string }[] = [
  { key: 'hot', label: '热门问题' },
  { key: 'install', label: '安装升级' },
  { key: 'account', label: '联想账号' },
]

export const FAQ_ITEMS: FaqItem[] = [
  {
    id: 'f1',
    tab: 'hot',
    question: '如何关闭 AI 游戏伙伴智能体悬浮球',
    answer:
      '您可以在 Legion Zone 左侧边栏我的游戏 --AI 游戏助手 -- 游戏自定义设置 -- 游戏伙伴，找到 “游戏伙伴” 开关，或打开单个游戏时，打开左侧边栏我的游戏 -- 对应游戏 -- 设置中心 -- 使用全局配置 -- 游戏自定义设置 -- 开局伙伴，找到 “开局” 开关，设置关闭即可。',
  },
  {
    id: 'f2',
    tab: 'hot',
    question: '如何取消 AI 游戏伙伴智能体快捷键',
    answer:
      '您可以在 Legion Zone 左侧边栏我的游戏 --AI 游戏助手 -- 游戏自定义设置 -- 游戏伙伴，找到 “游戏伙伴” 开关，或打开单个游戏时，打开左侧边栏我的游戏 -- 对应游戏 -- 设置中心 -- 使用全局配置 -- 游戏自定义设置 -- 开局伙伴，找到 “开局” 开关，设置关闭即可。',
  },
  {
    id: 'f3',
    tab: 'hot',
    question: '升级到 2.0.22 版本后，为什么启动游戏会弹出 AI 游戏助手界面？',
    answer:
      '2.0.22 版本默认开启了 AI 游戏助手开局引导。可在 Legion Zone > 我的游戏 > AI 游戏助手 > 游戏自定义设置中关闭相关开关。',
  },
  {
    id: 'f4',
    tab: 'hot',
    question: '加速器时长消失怎么办？',
    answer:
      '请先确认账号登录状态与加速器权益是否到期。若仍异常，可尝试退出登录后重新登录，或在设置中检查网络与系统时间。',
  },
  {
    id: 'f5',
    tab: 'hot',
    question: '加速器加速失败或无法加速怎么办？',
    answer:
      '您可以在 Legion Zone 左侧边栏我的游戏 --AI 游戏助手 -- 游戏自定义设置 -- 游戏伙伴，找到 “游戏伙伴” 开关，或打开单个游戏时，打开左侧边栏我的游戏 -- 对应游戏 -- 设置中心 -- 使用全局配置 -- 游戏自定义设置 -- 开局伙伴，找到 “开局” 开关，设置关闭即可。',
  },
  {
    id: 'i1',
    tab: 'install',
    question: '如何升级到最新版本？',
    answer: '打开 Legion Zone，进入设置或软件内升级入口，检查并安装最新版本即可。',
  },
  {
    id: 'i2',
    tab: 'install',
    question: '安装失败提示权限不足怎么办？',
    answer: '请以管理员身份运行安装程序，并确认杀毒软件未拦截安装进程。',
  },
  {
    id: 'a1',
    tab: 'account',
    question: '联想账号无法登录怎么办？',
    answer: '请检查账号密码、网络环境，或通过联想账号官网进行找回与验证。',
  },
  {
    id: 'a2',
    tab: 'account',
    question: '如何换绑手机号？',
    answer: '登录联想账号后，在账号安全设置中按提示完成手机号换绑。',
  },
]

export const INITIAL_TICKETS: FeedbackTicket[] = [
  {
    id: 't1',
    title: '如何关闭 AI 游戏伙伴智能体悬浮球',
    time: '2026-8-6  11:18',
    updatedAt: Date.UTC(2026, 7, 6, 11, 18, 0),
    status: 'replied',
    unread: 1,
    messages: [
      {
        id: 'm1',
        role: 'user',
        name: '我',
        time: '2026-8-6  11:18',
        text: '加速器加速失败或无法加速怎么办？',
        images: [chatThumb],
      },
      {
        id: 'm2',
        role: 'ops',
        name: '联想运营小于',
        time: '2026-8-6  11:18',
        text: '您可以在 Legion Zone 左侧边栏我的游戏 --AI 游戏助手 -- 游戏自定义设置 -- 游戏伙伴，找到 “游戏伙伴” 开关，或打开单个游戏时，打开左侧边栏我的游戏 -- 对应游戏 -- 设置中心 -- 使用全局配置 -- 游戏自定义设置 -- 开局伙伴，找到 “开局” 开关，设置关闭即可。',
      },
    ],
  },
  {
    id: 't2',
    title: '如何关闭 AI 游戏伙伴智能体悬浮球',
    time: '2026-8-6  11:18',
    updatedAt: Date.UTC(2026, 7, 6, 11, 18, 0) - 1000,
    status: 'pending',
    unread: 0,
    messages: [
      {
        id: 'm3',
        role: 'user',
        name: '我',
        time: '2026-8-6  11:18',
        text: '如何关闭 AI 游戏伙伴智能体悬浮球',
      },
    ],
  },
]

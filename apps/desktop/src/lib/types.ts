// ===== 页面类型 =====
export type PageType =
  | "quest"
  | "terminal"
  | "launch"
  | "alert"
  | "postcard"
  | "report"

export type TemplateId =
  | "QUEST_SCROLL"
  | "TERMINAL_STATUS"
  | "LAUNCH_PANEL"
  | "SYSTEM_ALERT"
  | "POSTCARD"
  | "RELEASE_NEWS"

export type Priority = 0 | 1 | 2 | 3 | 4 | 5
export type Urgency = "critical" | "important" | "normal" | "low"
export type PageStatus = "draft" | "ready" | "pushed" | "archived" | "failed"
export type DeviceStatus = "online" | "offline" | "error"

// ===== 页面 =====
export interface Page {
  id: string
  type: PageType
  templateId: TemplateId
  priority: Priority
  urgency: Urgency
  interruptible: boolean
  expiresAt: string | null
  displayDuration: number | null
  emotion: string
  triggerSource: string
  reason: string
  payload: Record<string, unknown>
  imagePath: string | null
  status: PageStatus
  createdAt: string
  pushedAt: string | null
}

// ===== 设备 =====
export interface Device {
  id: string
  name: string
  ip: string
  model: string
  firmwareVersion: string
  lastSeen: string | null
  status: DeviceStatus
}

// ===== 显示日志 =====
export interface DisplayLog {
  id: number
  pageId: string
  deviceId: string
  pushedAt: string
  result: "success" | "device_unreachable" | "timeout"
  errorMessage: string | null
}

// ===== AI 推荐 =====
export interface Recommendation {
  pageType: PageType
  templateId: TemplateId
  priority: Priority
  reason: string
  candidatePages: Page[]
}

// ===== 时间线事件 =====
export interface TimelineEvent {
  id: string
  type: "quest" | "commit" | "alert" | "message" | "launch" | "system"
  message: string
  timestamp: string
}

// ===== 任务 =====
export interface QuestPayload {
  mainQuest: string
  sideQuests: string[]
  bossName: string
  bossWeakness: string
  ban: string
  reward: string
  declaration: string
}

export type QuestPersona = "commander" | "guild" | "instructor" | "pet"

// ===== 系统模式 =====
export type SystemMode = "full" | "no_ai" | "no_device" | "offline" | "safe_mode"

export const SYSTEM_MODE_LABELS: Record<SystemMode, string> = {
  full: "全部系统正常",
  no_ai: "AI 引擎离线",
  no_device: "设备未连接",
  offline: "离线模式",
  safe_mode: "安全模式",
}

// ===== 导航频道 =====
export type Channel =
  | "bridge"
  | "quest"
  | "launch"
  | "terminal"
  | "watcher"
  | "signals"
  | "studio"
  | "device"

export interface ChannelDef {
  id: Channel
  label: string
  shortcut: string
}

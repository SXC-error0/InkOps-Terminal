/**
 * Ink Engine HTTP API 客户端
 * 对接 Python FastAPI 后端 (127.0.0.1:8700)
 */
import type {
  Page,
  Device,
  Recommendation,
  QuestPayload,
  SystemMode,
} from "#/lib/types"

const BASE = "http://127.0.0.1:8700/api"

// ============ 工具函数 ============

function toCamel(s: string): string {
  return s.replace(/_([a-z])/g, (_, c: string) => c.toUpperCase())
}

function mapKeys<T>(obj: Record<string, unknown>): T {
  const result: Record<string, unknown> = {}
  for (const key of Object.keys(obj)) {
    const camelKey = toCamel(key)
    const val = obj[key]
    result[camelKey] =
      val && typeof val === "object" && !Array.isArray(val)
        ? mapKeys(val as Record<string, unknown>)
        : val
  }
  return result as T
}

async function get<T>(path: string): Promise<T> {
  const res = await fetch(`${BASE}${path}`)
  if (!res.ok) {
    const err = await res.json().catch(() => ({ detail: res.statusText }))
    throw new Error((err as { detail?: string }).detail ?? res.statusText)
  }
  return res.json()
}

async function post<T>(path: string, body?: unknown): Promise<T> {
  const res = await fetch(`${BASE}${path}`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: body ? JSON.stringify(body) : undefined,
  })
  if (!res.ok) {
    const err = await res.json().catch(() => ({ detail: res.statusText }))
    throw new Error((err as { detail?: string }).detail ?? res.statusText)
  }
  return res.json()
}

// ============ 页面管理 ============

export async function getCurrentPage(): Promise<Page | null> {
  const data = await get<{ current: Record<string, unknown> | null }>("/pages/current")
  return data.current ? mapKeys<Page>(data.current) : null
}

export async function getPageHistory(limit?: number): Promise<Page[]> {
  const params = limit ? `?limit=${limit}` : ""
  const data = await get<{ pages: Record<string, unknown>[] }>(`/pages/history${params}`)
  return data.pages.map((p) => mapKeys<Page>(p))
}

export async function getCandidatePages(): Promise<Page[]> {
  const data = await get<{ candidates: Record<string, unknown>[] }>("/pages/current")
  return data.candidates.map((c) => mapKeys<Page>(c))
}

export async function createPage(input: {
  type: string
  template_id: string
  priority?: number
  urgency?: string
  interruptible?: boolean
  display_duration?: number
  emotion?: string
  trigger_source?: string
  reason?: string
  payload: Record<string, unknown>
}): Promise<Page> {
  const data = await post<Record<string, unknown>>("/pages", input)
  return mapKeys<Page>(data)
}

export async function pushPageToDevice(
  pageId: string,
  deviceId: string,
): Promise<{ id: number; pageId: string; deviceId: string; pushedAt: string; result: string }> {
  const data = await post<Record<string, unknown>>(`/pages/${pageId}/push`, {
    device_id: deviceId,
  })
  return mapKeys(data) as { id: number; pageId: string; deviceId: string; pushedAt: string; result: string }
}

export async function updatePageStatus(
  pageId: string,
  status: string,
): Promise<void> {
  await post(`/pages/${pageId}/status`, { status })
}

// ============ 设备管理 ============

export async function getDevice(): Promise<Device | null> {
  const devices = await discoverDevices()
  return devices.length > 0 ? devices[0] : null
}

export async function discoverDevices(): Promise<Device[]> {
  const data = await get<Record<string, unknown>[]>("/devices")
  return data.map((d) => mapKeys<Device>(d))
}

export async function bindDevice(input: {
  name: string
  ip: string
}): Promise<Device> {
  const data = await post<Record<string, unknown>>("/devices", input)
  return mapKeys<Device>(data)
}

export async function getDeviceLogs(
  _deviceId: string,
  _limit?: number,
): Promise<unknown[]> {
  return [] // 后续实现
}

// ============ 监控 ============

export async function getMonitors(): Promise<unknown[]> {
  return get<unknown[]>("/monitors")
}

export async function createMonitor(input: {
  name: string
  target_type: string
  endpoint: string
}): Promise<unknown> {
  return post<unknown>("/monitors", input)
}

export async function runHealthCheck(monitorId: string): Promise<unknown> {
  return post<unknown>(`/monitors/${monitorId}/check`)
}

export async function getActiveIncidents(): Promise<unknown[]> {
  return get<unknown[]>("/incidents/active")
}

// ============ AI / 任务 ============

export async function generateQuest(input: {
  text: string
  persona?: string
}): Promise<QuestPayload & { taskId: string; pageId: string; imagePath: string }> {
  const data = await post<{
    task_id: string
    page_id: string
    payload: Record<string, unknown>
    image_path: string
  }>("/quest/generate", {
    raw_text: input.text,
    persona: input.persona ?? "guild",
  })

  return {
    mainQuest: data.payload.main_quest as string,
    sideQuests: data.payload.side_quests as string[],
    bossName: data.payload.boss_name as string,
    bossWeakness: data.payload.boss_weakness as string,
    ban: data.payload.ban as string,
    reward: data.payload.reward as string,
    declaration: data.payload.declaration as string,
    taskId: data.task_id,
    pageId: data.page_id,
    imagePath: data.image_path,
  }
}

export async function getDisplayRecommendation(): Promise<Recommendation> {
  const data = await get<{
    recommended: Record<string, unknown> | null
    reason: string
    candidate_count: number
    candidates: Record<string, unknown>[]
  }>("/director/recommendation")
  const rec = data.recommended
  return {
    pageType: (rec?.type as "quest") ?? "quest",
    templateId: (rec?.template_id as "QUEST_SCROLL") ?? "QUEST_SCROLL",
    priority: (rec?.priority as 2) ?? 2,
    reason: data.reason ?? "等待页面生成...",
    candidatePages: data.candidates?.map((c) => mapKeys<Page>(c as Record<string, unknown>)) ?? [],
  }
}

// ============ 终端状态 ============

export async function getTerminalSummary(): Promise<{
  activeProject: string
  githubStreak: number
  todayCommits: number
  serverStatus: string
  mvpProgress: number
  currentFocus: string
}> {
  return get<{
    activeProject: string
    githubStreak: number
    todayCommits: number
    serverStatus: string
    mvpProgress: number
    currentFocus: string
  }>("/terminal/summary")
}

// ============ 事件流 ============

export async function getEvents(
  limit?: number,
): Promise<{ id: string; type: string; message: string; timestamp: string }[]> {
  const params = limit ? `?limit=${limit}` : ""
  const data = await get<{ id: string; type: string; message: string; timestamp: string }[]>(
    `/system/events${params}`,
  )
  return data
}

// ============ 系统 ============

export async function detectSystemMode(): Promise<{
  mode: SystemMode
  label: string
}> {
  return get<{ mode: SystemMode; label: string }>("/system/mode")
}

export async function getSetting(_key: string): Promise<string | null> {
  return null
}

export async function setSetting(_key: string, _value: string): Promise<void> {
  // 本地存储
}

// ============ 留言 ============

export async function generateQrCode(): Promise<{ key: string; qrData: string; qrImagePath: string }> {
  return get<{ key: string; qr_data: string; qr_image_path: string }>("/signals/qr").then((d) => ({
    key: d.key,
    qrData: d.qr_data,
    qrImagePath: d.qr_image_path,
  }))
}

export async function submitMessage(input: {
  sender_name?: string
  text: string
}): Promise<{ approved: boolean; message: Record<string, unknown>; page_id?: string; reason?: string }> {
  return post<{ approved: boolean; message: Record<string, unknown>; page_id?: string; reason?: string }>(
    "/signals/message",
    input,
  )
}

export async function getMessages(limit?: number): Promise<unknown[]> {
  const params = limit ? `?limit=${limit}` : ""
  return get<unknown[]>(`/signals/messages${params}`)
}

// ============ 发布管理 ============

export async function createProject(name: string): Promise<unknown> {
  return post<unknown>("/launch/projects", { name })
}

export async function getProjectBriefing(projectId: string): Promise<unknown> {
  return post<unknown>(`/launch/${projectId}/briefing`)
}

// ============ Studio / 渲染 ============

export function getPageImageUrl(pageId: string): string {
  return `${BASE}/pages/${pageId}/image`
}

export async function reRenderPage(pageId: string): Promise<Page> {
  const data = await post<Record<string, unknown>>(`/pages/${pageId}/re-render`)
  return mapKeys<Page>(data)
}

export async function exportPageImage(pageId: string): Promise<string> {
  return getPageImageUrl(pageId)
}

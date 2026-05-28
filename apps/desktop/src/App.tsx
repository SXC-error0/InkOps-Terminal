import { useEffect } from "react"
import { QueryClient, QueryClientProvider } from "@tanstack/react-query"
import { AppShell } from "#/components/layout/AppShell"
import { useAppStore } from "#/stores/appStore"
import { useDeviceStore } from "#/stores/deviceStore"
import { useEventStore } from "#/stores/eventStore"
import { usePageStore } from "#/stores/pageStore"
import * as api from "#/lib/api"
import type { Channel } from "#/lib/types"

const queryClient = new QueryClient({
  defaultOptions: {
    queries: {
      staleTime: 30_000,
      retry: 1,
    },
  },
})

const channelKeys: Record<string, Channel> = {
  "1": "bridge",
  "2": "quest",
  "3": "launch",
  "4": "terminal",
  "5": "watcher",
  "6": "signals",
  "7": "studio",
  "8": "device",
}

function App() {
  const setActiveChannel = useAppStore((s) => s.setActiveChannel)
  const setSystemMode = useAppStore((s) => s.setSystemMode)
  const setBackendOnline = useAppStore((s) => s.setBackendOnline)
  const addEvent = useEventStore((s) => s.addEvent)
  const setDevice = useDeviceStore((s) => s.setDevice)
  const setOnline = useDeviceStore((s) => s.setOnline)
  const setCurrentPage = usePageStore((s) => s.setCurrentPage)
  const setCandidates = usePageStore((s) => s.setCandidates)
  const setRecommendation = usePageStore((s) => s.setRecommendation)

  // 键盘快捷键切换频道
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.ctrlKey && channelKeys[e.key]) {
        e.preventDefault()
        setActiveChannel(channelKeys[e.key])
      }
    }

    window.addEventListener("keydown", handleKeyDown)
    return () => window.removeEventListener("keydown", handleKeyDown)
  }, [setActiveChannel])

  // 后端健康轮询 (每 10 秒)
  useEffect(() => {
    const check = async () => {
      try {
        const res = await fetch("http://127.0.0.1:8700/api/health")
        if (res.ok) setBackendOnline(true)
      } catch {
        setBackendOnline(false)
      }
    }
    check()
    const id = setInterval(check, 10000)
    return () => clearInterval(id)
  }, [setBackendOnline])

  // 启动时从后端加载数据
  useEffect(() => {
    async function init() {
      addEvent({ type: "system", message: "InkOps Command 启动完成" })

      // 1. 检测系统模式
      try {
        const mode = await api.detectSystemMode()
        setSystemMode(mode.mode)
        addEvent({ type: "system", message: `系统模式: ${mode.label}` })
      } catch {
        addEvent({ type: "system", message: "系统模式检测失败，使用默认模式" })
      }

      // 2. 发现设备
      try {
        addEvent({ type: "system", message: "正在扫描设备..." })
        const devices = await api.discoverDevices()
        if (devices.length > 0) {
          setDevice(devices[0])
          setOnline(devices[0].status === "online")
          addEvent({ type: "system", message: `发现设备: ${devices[0].name}` })
        } else {
          addEvent({ type: "system", message: "未发现设备" })
        }
      } catch {
        addEvent({ type: "system", message: "设备扫描失败" })
      }

      // 3. 加载当前页面
      try {
        const page = await api.getCurrentPage()
        if (page) {
          setCurrentPage(page)
          addEvent({ type: "system", message: `当前页面: ${page.templateId}` })
        }
      } catch {
        // 首次启动无页面是正常的
      }

      // 4. 加载候选页面和推荐
      try {
        const [candidates, recommendation] = await Promise.all([
          api.getCandidatePages(),
          api.getDisplayRecommendation(),
        ])
        setCandidates(candidates)
        setRecommendation(recommendation)
      } catch {
        // 模拟数据已在后端处理
      }

      // 5. 加载事件流
      try {
        const events = await api.getEvents(20)
        for (const evt of events) {
          addEvent({
            type: (evt.type as "quest" | "commit" | "alert" | "message" | "launch" | "system") ?? "system",
            message: evt.message,
          })
        }
      } catch {
        // 允许空事件
      }
    }

    init()
  }, []) // eslint-disable-line react-hooks/exhaustive-deps

  return (
    <QueryClientProvider client={queryClient}>
      <AppShell />
    </QueryClientProvider>
  )
}

export default App

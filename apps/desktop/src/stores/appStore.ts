import { create } from "zustand"
import type { Channel, SystemMode } from "#/lib/types"

export interface AppToast {
  id: string
  message: string
  type: "success" | "error" | "info"
}

interface AppState {
  activeChannel: Channel
  setActiveChannel: (ch: Channel) => void
  systemMode: SystemMode
  setSystemMode: (mode: SystemMode) => void
  isSidebarCollapsed: boolean
  toggleSidebar: () => void
  isPreviewPanelOpen: boolean
  togglePreviewPanel: () => void
  backendOnline: boolean
  setBackendOnline: (online: boolean) => void
  toasts: AppToast[]
  showToast: (message: string, type?: "success" | "error" | "info") => void
  dismissToast: (id: string) => void
}

export const useAppStore = create<AppState>((set) => ({
  activeChannel: "bridge",
  setActiveChannel: (ch) => set({ activeChannel: ch }),
  systemMode: "full",
  setSystemMode: (mode) => set({ systemMode: mode }),
  isSidebarCollapsed: false,
  toggleSidebar: () => set((s) => ({ isSidebarCollapsed: !s.isSidebarCollapsed })),
  isPreviewPanelOpen: false,
  togglePreviewPanel: () => set((s) => ({ isPreviewPanelOpen: !s.isPreviewPanelOpen })),
  backendOnline: false,
  setBackendOnline: (online) => set({ backendOnline: online }),
  toasts: [],
  showToast: (message, type = "info") =>
    set((s) => ({
      toasts: [
        ...s.toasts,
        { id: `${Date.now()}-${Math.random()}`, message, type },
      ].slice(-4),
    })),
  dismissToast: (id) => set((s) => ({ toasts: s.toasts.filter((t) => t.id !== id) })),
}))

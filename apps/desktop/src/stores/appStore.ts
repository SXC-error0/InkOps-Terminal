import { create } from "zustand"
import type { Channel, SystemMode } from "#/lib/types"

interface AppState {
  activeChannel: Channel
  setActiveChannel: (ch: Channel) => void
  systemMode: SystemMode
  setSystemMode: (mode: SystemMode) => void
  isSidebarCollapsed: boolean
  toggleSidebar: () => void
  backendOnline: boolean
  setBackendOnline: (online: boolean) => void
}

export const useAppStore = create<AppState>((set) => ({
  activeChannel: "bridge",
  setActiveChannel: (ch) => set({ activeChannel: ch }),
  systemMode: "full",
  setSystemMode: (mode) => set({ systemMode: mode }),
  isSidebarCollapsed: false,
  toggleSidebar: () => set((s) => ({ isSidebarCollapsed: !s.isSidebarCollapsed })),
  backendOnline: false,
  setBackendOnline: (online) => set({ backendOnline: online }),
}))

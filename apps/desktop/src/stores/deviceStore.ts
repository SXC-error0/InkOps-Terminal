import { create } from "zustand"
import type { Device, DisplayLog } from "#/lib/types"

interface DeviceState {
  device: Device | null
  isOnline: boolean
  lastRefreshAt: Date | null
  refreshHistory: DisplayLog[]
  setDevice: (d: Device | null) => void
  setOnline: (v: boolean) => void
  setLastRefresh: (d: Date) => void
  addLog: (log: DisplayLog) => void
}

export const useDeviceStore = create<DeviceState>((set) => ({
  device: null,
  isOnline: false,
  lastRefreshAt: null,
  refreshHistory: [],
  setDevice: (d) => set({ device: d }),
  setOnline: (v) => set({ isOnline: v }),
  setLastRefresh: (d) => set({ lastRefreshAt: d }),
  addLog: (log) =>
    set((s) => ({ refreshHistory: [log, ...s.refreshHistory].slice(0, 50) })),
}))

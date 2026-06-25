import { useAppStore } from "#/stores/appStore"
import { Sidebar } from "./Sidebar"
import { TopBar } from "./TopBar"
import { StatusBar } from "./StatusBar"
import { DevicePanel } from "./DevicePanel"
import { ToastContainer } from "#/components/ui/Toast"
import { BridgePage } from "#/pages/Bridge/BridgePage"
import { QuestPage } from "#/pages/Quest/QuestPage"
import { LaunchPage } from "#/pages/Launch/LaunchPage"
import { TerminalPage } from "#/pages/Terminal/TerminalPage"
import { WatcherPage } from "#/pages/Watcher/WatcherPage"
import { SignalsPage } from "#/pages/Signals/SignalsPage"
import { StudioPage } from "#/pages/Studio/StudioPage"
import { DevicePage } from "#/pages/Device/DevicePage"

import { motion, AnimatePresence } from "framer-motion"

const pages = {
  bridge: BridgePage,
  quest: QuestPage,
  launch: LaunchPage,
  terminal: TerminalPage,
  watcher: WatcherPage,
  signals: SignalsPage,
  studio: StudioPage,
  device: DevicePage,
}

export function AppShell() {
  const ch = useAppStore((s) => s.activeChannel)
  const isPreviewPanelOpen = useAppStore((s) => s.isPreviewPanelOpen)
  const Page = pages[ch]

  return (
    <div className="flex h-full w-full bg-background text-on-surface overflow-hidden">
      <Sidebar />
      <div className="flex flex-1 flex-col min-w-0 h-full overflow-hidden">
        <StatusBar />
        <TopBar />
        <div className="flex flex-1 min-w-0 overflow-hidden relative">
          <main className="flex-1 overflow-hidden relative">
            <AnimatePresence mode="wait">
              <motion.div
                key={ch}
                initial={{ opacity: 0, y: 6 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, y: -6 }}
                transition={{ duration: 0.15, ease: "easeInOut" }}
                className="absolute inset-0"
              >
                <Page />
              </motion.div>
            </AnimatePresence>
          </main>

          <AnimatePresence>
            {isPreviewPanelOpen && (
              <motion.div
                initial={{ width: 0, opacity: 0 }}
                animate={{ width: 440, opacity: 1 }}
                exit={{ width: 0, opacity: 0 }}
                transition={{ duration: 0.2, ease: "easeInOut" }}
                className="overflow-hidden h-full flex shrink-0"
              >
                <DevicePanel />
              </motion.div>
            )}
          </AnimatePresence>
        </div>
      </div>
      <ToastContainer />
    </div>
  )
}

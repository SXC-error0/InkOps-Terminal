import { useAppStore } from "#/stores/appStore"
import { Sidebar } from "./Sidebar"
import { StatusBar } from "./StatusBar"
import { BridgePage } from "#/pages/Bridge/BridgePage"
import { QuestPage } from "#/pages/Quest/QuestPage"
import { LaunchPage } from "#/pages/Launch/LaunchPage"
import { TerminalPage } from "#/pages/Terminal/TerminalPage"
import { WatcherPage } from "#/pages/Watcher/WatcherPage"
import { SignalsPage } from "#/pages/Signals/SignalsPage"
import { StudioPage } from "#/pages/Studio/StudioPage"
import { DevicePage } from "#/pages/Device/DevicePage"

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
  const activeChannel = useAppStore((s) => s.activeChannel)
  const ActivePage = pages[activeChannel]

  return (
    <div className="flex h-full w-full" style={{ background: "var(--color-bg)" }}>
      <Sidebar />
      <div className="flex flex-1 flex-col min-w-0">
        <StatusBar />
        <main className="flex-1 overflow-hidden">
          <ActivePage />
        </main>
      </div>
    </div>
  )
}

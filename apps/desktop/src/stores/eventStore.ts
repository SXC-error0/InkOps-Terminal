import { create } from "zustand"
import type { TimelineEvent } from "#/lib/types"

interface EventState {
  events: TimelineEvent[]
  addEvent: (event: Omit<TimelineEvent, "id" | "timestamp">) => void
  clearEvents: () => void
}

let eventIdCounter = 0

export const useEventStore = create<EventState>((set) => ({
  events: [],
  addEvent: (event) =>
    set((s) => ({
      events: [
        {
          ...event,
          id: `evt-${++eventIdCounter}`,
          timestamp: new Date().toISOString(),
        },
        ...s.events,
      ].slice(0, 200),
    })),
  clearEvents: () => set({ events: [] }),
}))

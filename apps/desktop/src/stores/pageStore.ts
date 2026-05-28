import { create } from "zustand"
import type { Page, Recommendation } from "#/lib/types"

interface PageState {
  currentPage: Page | null
  candidatePages: Page[]
  pageHistory: Page[]
  aiRecommendation: Recommendation | null
  setCurrentPage: (p: Page | null) => void
  setCandidates: (pages: Page[]) => void
  setHistory: (pages: Page[]) => void
  setRecommendation: (r: Recommendation | null) => void
  addToHistory: (p: Page) => void
}

export const usePageStore = create<PageState>((set) => ({
  currentPage: null,
  candidatePages: [],
  pageHistory: [],
  aiRecommendation: null,
  setCurrentPage: (p) => set({ currentPage: p }),
  setCandidates: (pages) => set({ candidatePages: pages }),
  setHistory: (pages) => set({ pageHistory: pages }),
  setRecommendation: (r) => set({ aiRecommendation: r }),
  addToHistory: (p) =>
    set((s) => ({ pageHistory: [p, ...s.pageHistory].slice(0, 100) })),
}))

import { useEffect } from "react"
import { motion, AnimatePresence } from "framer-motion"
import { useAppStore } from "#/stores/appStore"
import type { AppToast } from "#/stores/appStore"

function ToastItem({ toast }: { toast: AppToast }) {
  const dismiss = useAppStore((s) => s.dismissToast)

  useEffect(() => {
    const t = setTimeout(() => dismiss(toast.id), 3500)
    return () => clearTimeout(t)
  }, [toast.id, dismiss])

  const icon =
    toast.type === "success" ? "check_circle" : toast.type === "error" ? "error" : "info"
  const cls =
    toast.type === "success"
      ? "border-secondary bg-secondary-container text-on-secondary-container"
      : toast.type === "error"
      ? "border-error bg-error-container text-on-error-container"
      : "border-outline-variant bg-surface-container-high text-on-surface"

  return (
    <motion.div
      initial={{ opacity: 0, y: 10, scale: 0.96 }}
      animate={{ opacity: 1, y: 0, scale: 1 }}
      exit={{ opacity: 0, y: 6, scale: 0.95 }}
      transition={{ duration: 0.16 }}
      className={`flex items-center gap-3 px-4 py-3 border shadow-lg font-mono text-[13px] min-w-[240px] max-w-[360px] ${cls}`}
    >
      <span className="material-symbols-outlined shrink-0" style={{ fontSize: 18 }}>{icon}</span>
      <span className="flex-1 leading-snug">{toast.message}</span>
      <button
        onClick={() => dismiss(toast.id)}
        className="opacity-50 hover:opacity-100 transition-opacity shrink-0"
      >
        <span className="material-symbols-outlined" style={{ fontSize: 16 }}>close</span>
      </button>
    </motion.div>
  )
}

export function ToastContainer() {
  const toasts = useAppStore((s) => s.toasts)

  return (
    <div className="fixed bottom-14 right-5 z-[9999] flex flex-col gap-2 pointer-events-none">
      <AnimatePresence mode="popLayout">
        {toasts.map((t) => (
          <div key={t.id} className="pointer-events-auto">
            <ToastItem toast={t} />
          </div>
        ))}
      </AnimatePresence>
    </div>
  )
}

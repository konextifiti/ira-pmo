"use client"

import { useEffect, useState, useCallback, useRef } from "react"
import { Bell } from "lucide-react"
import { useRouter } from "next/navigation"
import { usePermissions } from "@/lib/permissions/usePermissions"
import { createSupabaseBrowserClient } from "@/lib/supabase/client"

const POLL_INTERVAL = 60_000

interface NotificationItem {
  id: number
  site_code: string
  approval_status: string
  pending_changes: Record<string, unknown> | null
  rejection_reason: string | null
  approved_at: string | null
  submitted_at: string | null
}

export default function NotificationBell() {
  const router = useRouter()
  const supabase = createSupabaseBrowserClient()
  const { user, loading, permissions } = usePermissions()
  const [count, setCount] = useState(0)
  const [notifications, setNotifications] = useState<NotificationItem[]>([])
  const [isOpen, setIsOpen] = useState(false)
  const [dataReady, setDataReady] = useState(false)
  const dropdownRef = useRef<HTMLDivElement>(null)
  const buttonRef = useRef<HTMLButtonElement>(null)

  const tier = permissions?.tier

  const fetchData = useCallback(async () => {
    if (!user || !tier) return

    if (tier === "PMO" || tier === "ADMIN" || tier === "SUPERADMIN") {
      const { data: pending } = await supabase
        .from("project_sites")
        .select("id")
        .eq("approval_status", "pending")

      const { data: approvedWithChanges } = await supabase
        .from("project_sites")
        .select("id")
        .eq("approval_status", "approved")
        .not("pending_changes", "is", null)

      setCount((pending?.length ?? 0) + (approvedWithChanges?.length ?? 0))
    } else if (tier === "CONTRIBUTOR") {
      const { data: myItems } = await supabase
        .from("project_sites")
        .select("id")
        .eq("submitted_by", user.userId)
        .not("pending_changes", "is", null)

      setCount(myItems?.length ?? 0)

      const { data: items } = await supabase
        .from("project_sites")
        .select(
          "id, site_code, approval_status, pending_changes, rejection_reason, approved_at, submitted_at"
        )
        .eq("submitted_by", user.userId)
        .order("submitted_at", { ascending: false })
        .limit(5)

      setNotifications(items ?? [])
    }

    setDataReady(true)
  }, [user, tier, supabase])

  useEffect(() => {
    if (!loading) fetchData()
  }, [loading, fetchData])

  useEffect(() => {
    if (loading || !dataReady) return
    const id = setInterval(fetchData, POLL_INTERVAL)
    return () => clearInterval(id)
  }, [loading, dataReady, fetchData])

  useEffect(() => {
    if (loading || !dataReady) return
    function onFocus() {
      fetchData()
    }
    window.addEventListener("focus", onFocus)
    return () => window.removeEventListener("focus", onFocus)
  }, [loading, dataReady, fetchData])

  useEffect(() => {
    if (!isOpen) return
    function handleClick(e: MouseEvent) {
      if (
        dropdownRef.current &&
        !dropdownRef.current.contains(e.target as Node) &&
        buttonRef.current &&
        !buttonRef.current.contains(e.target as Node)
      ) {
        setIsOpen(false)
      }
    }
    document.addEventListener("mousedown", handleClick)
    return () => document.removeEventListener("mousedown", handleClick)
  }, [isOpen])

  if (!loading && tier === "EXTERNAL_VIEWER") return null

  const isPmo = tier === "PMO" || tier === "ADMIN" || tier === "SUPERADMIN"

  function handleBellClick() {
    if (isPmo) {
      router.push("/approvals")
    } else {
      setIsOpen((prev) => !prev)
    }
  }

  function formatDate(dateStr: string | null): string {
    if (!dateStr) return ""
    try {
      return new Date(dateStr).toLocaleDateString("id-ID", {
        day: "numeric",
        month: "short",
        year: "numeric",
      })
    } catch {
      return ""
    }
  }

  function getStatusText(item: NotificationItem): string {
    if (item.rejection_reason) return `Ditolak: ${item.rejection_reason}`
    if (!item.pending_changes && item.approved_at) {
      return `Disetujui ${formatDate(item.approved_at)}`
    }
    return "Menunggu approval"
  }

  return (
    <div className="relative">
      <button
        ref={buttonRef}
        type="button"
        onClick={handleBellClick}
        className="relative flex items-center justify-center w-8 h-8 rounded-md hover:bg-[#1E3A5F]/50 transition-colors"
      >
        <Bell className="w-4 h-4 text-[#64748B]" />
        {dataReady && count > 0 && (
          <span className="absolute -top-0.5 -right-0.5 h-4 min-w-4 flex items-center justify-center rounded-full bg-[#F59E0B] text-[10px] font-bold text-white px-1">
            {count > 99 ? "99+" : count}
          </span>
        )}
      </button>

      {!isPmo && isOpen && (
        <div
          ref={dropdownRef}
          className="absolute right-0 top-full mt-2 w-80 rounded-md border border-[#1E3A5F] bg-[#0A1628] shadow-lg z-50"
        >
          <div className="px-3 py-2 border-b border-[#1E3A5F]">
            <span className="text-xs font-semibold text-[#94A3B8] uppercase tracking-wider">
              Notifikasi
            </span>
          </div>
          <div className="max-h-[320px] overflow-y-auto">
            {notifications.length === 0 ? (
              <div className="px-3 py-6 text-center text-xs text-[#64748B]">
                Tidak ada notifikasi
              </div>
            ) : (
              notifications.map((item) => (
                <button
                  key={item.id}
                  type="button"
                  onClick={() => {
                    setIsOpen(false)
                    router.push(`/sites/${item.site_code}`)
                  }}
                  className="w-full px-3 py-2.5 text-left hover:bg-[#1E3A5F]/30 transition-colors border-b border-[#1E3A5F]/50 last:border-b-0"
                >
                  <div className="text-xs font-medium text-white">
                    {item.site_code}
                  </div>
                  <div className="text-[11px] text-[#94A3B8] mt-0.5">
                    {getStatusText(item)}
                  </div>
                </button>
              ))
            )}
          </div>
        </div>
      )}
    </div>
  )
}

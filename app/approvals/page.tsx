"use client"

import { useEffect, useState } from "react"
import { supabase } from "@/lib/supabase"
import { Loader2, Check, X, Clock } from "lucide-react"

interface QueueItem {
  id: number
  site_code: string
  name: string
  region: string
  status: string
  approval_status: string
  pending_changes: Record<string, any> | null
  submitted_by: string | null
  submitted_at: string | null
  users: { name: string } | { name: string }[] | null
}

export default function ApprovalsPage() {
  const [items, setItems] = useState<QueueItem[]>([])
  const [loading, setLoading] = useState(true)
  const [actionLoading, setActionLoading] = useState<number | null>(null)
  const [rejectModal, setRejectModal] = useState<QueueItem | null>(null)
  const [rejectReason, setRejectReason] = useState("")
  const [rejectError, setRejectError] = useState("")

  useEffect(() => {
    fetchQueue()
  }, [])

  async function fetchQueue() {
    setLoading(true)
    const { data } = await supabase
      .from("project_sites")
      .select("id, site_code, name, region, status, approval_status, pending_changes, submitted_by, submitted_at, users!submitted_by(name)")
      .or("approval_status.eq.pending,pending_changes.not.isnull")
      .order("submitted_at", { ascending: false, nullsFirst: false })

    if (data) {
      setItems(data as QueueItem[])
    }
    setLoading(false)
  }

  function submittedByName(item: QueueItem): string {
    if (!item.users) return "—"
    if (Array.isArray(item.users)) {
      return item.users[0]?.name || "—"
    }
    return (item.users as { name: string }).name || "—"
  }

  function formatDateTime(ts: string | null): string {
    if (!ts) return "—"
    const d = new Date(ts)
    return d.toLocaleString("id-ID", {
      year: "numeric",
      month: "short",
      day: "numeric",
      hour: "2-digit",
      minute: "2-digit",
    })
  }

  function changeSummary(item: QueueItem): string {
    if (item.approval_status === "pending") return "—"
    if (!item.pending_changes) return "—"
    return Object.entries(item.pending_changes)
      .map(([key, val]) => `${key}: ${val}`)
      .join(", ")
  }

  async function handleApprove(item: QueueItem) {
    setActionLoading(item.id)
    try {
      const res = await fetch("/api/approvals/approve", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ id: item.id }),
      })
      if (!res.ok) {
        const err = await res.json()
        throw new Error(err.error || "Approve failed")
      }
      await fetchQueue()
    } catch (err: any) {
      alert(err.message)
    } finally {
      setActionLoading(null)
    }
  }

  function openRejectModal(item: QueueItem) {
    setRejectModal(item)
    setRejectReason("")
    setRejectError("")
  }

  async function handleReject() {
    if (!rejectModal || !rejectReason.trim()) {
      setRejectError("Alasan penolakan wajib diisi")
      return
    }

    setActionLoading(rejectModal.id)
    try {
      const res = await fetch("/api/approvals/reject", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ id: rejectModal.id, rejectionReason: rejectReason.trim() }),
      })
      if (!res.ok) {
        const err = await res.json()
        throw new Error(err.error || "Reject failed")
      }
      setRejectModal(null)
      await fetchQueue()
    } catch (err: any) {
      setRejectError(err.message)
    } finally {
      setActionLoading(null)
    }
  }

  if (loading) {
    return (
      <div className="p-6">
        <div className="flex items-center gap-3 text-[#64748B]">
          <Loader2 className="w-4 h-4 animate-spin" />
          <span className="text-sm">Loading approval queue...</span>
        </div>
      </div>
    )
  }

  return (
    <div className="p-6 space-y-4">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-base font-semibold text-white">Approval Queue</h1>
          <p className="text-xs text-[#64748B] mt-0.5">
            {items.length} item{items.length !== 1 ? "s" : ""} pending review
          </p>
        </div>
        <button
          type="button"
          onClick={fetchQueue}
          className="h-8 rounded-md border border-[#1E3A5F] bg-[#0A1628] px-3 text-xs font-medium text-[#94A3B8] hover:bg-[#1E3A5F]/50 transition-colors"
        >
          Refresh
        </button>
      </div>

      {items.length === 0 ? (
        <div className="rounded-lg border border-[#1E3A5F] bg-[#0A1628] p-8 text-center">
          <Clock className="w-8 h-8 text-[#64748B] mx-auto mb-2" />
          <p className="text-sm text-[#64748B]">No items pending approval</p>
        </div>
      ) : (
        <div className="overflow-x-auto rounded-lg border border-[#1E3A5F] bg-[#0A1628]">
          <table className="w-full text-sm">
            <thead>
              <tr className="border-b border-[#1E3A5F] text-xs text-[#64748B] uppercase">
                <th className="text-left px-4 py-3 font-medium">Site Code</th>
                <th className="text-left px-4 py-3 font-medium">Name</th>
                <th className="text-left px-4 py-3 font-medium">Type</th>
                <th className="text-left px-4 py-3 font-medium">Requested Change</th>
                <th className="text-left px-4 py-3 font-medium">Submitted By</th>
                <th className="text-left px-4 py-3 font-medium">Submitted At</th>
                <th className="text-right px-4 py-3 font-medium">Actions</th>
              </tr>
            </thead>
            <tbody>
              {items.map((item) => {
                const isNew = item.approval_status === "pending"
                return (
                  <tr
                    key={item.id}
                    className="border-b border-[#1E3A5F]/50 last:border-0 hover:bg-[#1E3A5F]/20"
                  >
                    <td className="px-4 py-3 font-mono text-sm text-[#00D4D4]">
                      {item.site_code}
                    </td>
                    <td className="px-4 py-3 text-[#E2E8F0]">
                      {item.name || "—"}
                    </td>
                    <td className="px-4 py-3">
                      <span
                        className={`inline-flex h-5 items-center rounded px-1.5 text-[10px] font-medium ${
                          isNew
                            ? "bg-[#1E3A5F] text-[#60A5FA]"
                            : "bg-[#451A03] text-[#FBBF24]"
                        }`}
                      >
                        {isNew ? "New Site" : "Change Request"}
                      </span>
                    </td>
                    <td className="px-4 py-3 text-[#94A3B8] text-xs max-w-[200px] truncate">
                      {changeSummary(item)}
                    </td>
                    <td className="px-4 py-3 text-[#94A3B8]">
                      {submittedByName(item)}
                    </td>
                    <td className="px-4 py-3 text-[#94A3B8] text-xs">
                      {formatDateTime(item.submitted_at)}
                    </td>
                    <td className="px-4 py-3 text-right">
                      <div className="flex items-center justify-end gap-1.5">
                        <button
                          type="button"
                          onClick={() => handleApprove(item)}
                          disabled={actionLoading === item.id}
                          className="inline-flex h-7 items-center gap-1 rounded px-2 text-[10px] font-medium bg-[#064E3B] text-[#10B981] hover:bg-[#064E3B]/80 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
                        >
                          {actionLoading === item.id ? (
                            <Loader2 className="w-3 h-3 animate-spin" />
                          ) : (
                            <Check className="w-3 h-3" />
                          )}
                          Approve
                        </button>
                        <button
                          type="button"
                          onClick={() => openRejectModal(item)}
                          disabled={actionLoading === item.id}
                          className="inline-flex h-7 items-center gap-1 rounded px-2 text-[10px] font-medium bg-[#450A0A] text-[#F87171] hover:bg-[#450A0A]/80 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
                        >
                          <X className="w-3 h-3" />
                          Reject
                        </button>
                      </div>
                    </td>
                  </tr>
                )
              })}
            </tbody>
          </table>
        </div>
      )}

      {/* Reject Modal */}
      {rejectModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60">
          <div className="w-full max-w-md rounded-lg border border-[#1E3A5F] bg-[#0D1B2A] p-6">
            <div className="flex items-center justify-between mb-4">
              <h2 className="text-sm font-semibold text-white">
                Reject — {rejectModal.site_code}
              </h2>
              <button
                type="button"
                onClick={() => setRejectModal(null)}
                className="text-[#64748B] hover:text-white transition-colors"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            <p className="text-xs text-[#64748B] mb-4">
              {rejectModal.approval_status === "pending"
                ? "This will reject the new site submission."
                : "This will reject the proposed changes but keep the site approved."}
            </p>

            <div className="space-y-3">
              <div>
                <label className="block text-xs font-medium text-[#94A3B8] mb-1.5">
                  Rejection Reason <span className="text-[#F87171]">*</span>
                </label>
                <textarea
                  value={rejectReason}
                  onChange={(e) => setRejectReason(e.target.value)}
                  rows={3}
                  placeholder="Explain why this is being rejected..."
                  className="w-full rounded-md border border-[#1E3A5F] bg-[#0A1628] px-3 py-2 text-sm text-white placeholder:text-[#64748B] outline-none focus:border-[#00D4D4] resize-none"
                />
              </div>

              {rejectError && (
                <div className="rounded border border-[#F87171] bg-[#450A0A] px-3 py-2 text-xs text-[#F87171]">
                  {rejectError}
                </div>
              )}

              <div className="flex gap-2 pt-2">
                <button
                  type="button"
                  onClick={() => setRejectModal(null)}
                  className="flex-1 h-9 rounded-md border border-[#1E3A5F] bg-[#0A1628] text-xs font-medium text-[#94A3B8] hover:bg-[#1E3A5F]/50 transition-colors"
                >
                  Cancel
                </button>
                <button
                  type="button"
                  onClick={handleReject}
                  disabled={actionLoading === rejectModal.id}
                  className="flex-1 h-9 rounded-md bg-[#F87171] text-xs font-medium text-white hover:bg-[#F87171]/80 transition-colors disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center gap-1.5"
                >
                  {actionLoading === rejectModal.id && (
                    <Loader2 className="w-3.5 h-3.5 animate-spin" />
                  )}
                  {actionLoading === rejectModal.id ? "Rejecting..." : "Confirm Reject"}
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}

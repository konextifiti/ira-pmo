"use client"

import { useState } from "react"
import { X, Loader2 } from "lucide-react"

const validStatuses = [
  "On Air",
  "Integration Done",
  "Integration Ongoing",
  "Pre-Test Pass",
  "Pre-Test Ongoing",
  "MOP Approved",
  "MOP Submitted",
  "Transport Ordered",
  "Transport Survey",
  "Design Planning",
  "Not Started",
  "Blocked",
]

interface ProposeChangeButtonProps {
  siteId: number
  siteCode: string
  currentStatus: string
  hasPendingChanges: boolean
}

export default function ProposeChangeButton({
  siteId,
  siteCode,
  currentStatus,
  hasPendingChanges,
}: ProposeChangeButtonProps) {
  const [open, setOpen] = useState(false)
  const [status, setStatus] = useState(currentStatus)
  const [notes, setNotes] = useState("")
  const [submitting, setSubmitting] = useState(false)
  const [error, setError] = useState("")
  const [success, setSuccess] = useState(false)

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault()
    setError("")
    setSuccess(false)
    setSubmitting(true)

    try {
      const payload = { siteId, status, notes }
      const res = await fetch("/api/sites/propose-change", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(payload),
      })

      if (!res.ok) {
        const err = await res.json()
        throw new Error(err.error || "Failed to submit change proposal")
      }

      setSuccess(true)
      setTimeout(() => {
        setOpen(false)
        window.location.reload()
      }, 1500)
    } catch (err: any) {
      setError(err.message)
    } finally {
      setSubmitting(false)
    }
  }

  return (
    <>
      <button
        type="button"
        onClick={() => setOpen(true)}
        disabled={hasPendingChanges}
        className="h-8 rounded-md border border-[#FBBF24] bg-[#451A03] px-3 text-xs font-medium text-[#FBBF24] hover:bg-[#451A03]/80 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
      >
        {hasPendingChanges ? "Change Pending" : "Propose Change"}
      </button>

      {open && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60">
          <div className="w-full max-w-md rounded-lg border border-[#1E3A5F] bg-[#0D1B2A] p-6">
            <div className="flex items-center justify-between mb-4">
              <h2 className="text-sm font-semibold text-white">
                Propose Change — {siteCode}
              </h2>
              <button
                type="button"
                onClick={() => setOpen(false)}
                className="text-[#64748B] hover:text-white transition-colors"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            {success ? (
              <div className="rounded-lg border border-[#10B981] bg-[#064E3B] p-4 text-center">
                <p className="text-sm font-medium text-[#10B981]">
                  Change proposal submitted successfully!
                </p>
                <p className="text-xs text-[#34D399] mt-1">
                  Waiting for PMO approval...
                </p>
              </div>
            ) : (
              <form onSubmit={handleSubmit} className="space-y-4">
                <div>
                  <label className="block text-xs font-medium text-[#94A3B8] mb-1.5">
                    New Status
                  </label>
                  <select
                    value={status}
                    onChange={(e) => setStatus(e.target.value)}
                    className="w-full h-9 rounded-md border border-[#1E3A5F] bg-[#0A1628] px-3 text-sm text-white outline-none focus:border-[#00D4D4]"
                  >
                    {validStatuses.map((s) => (
                      <option key={s} value={s}>
                        {s}
                      </option>
                    ))}
                  </select>
                </div>

                <div>
                  <label className="block text-xs font-medium text-[#94A3B8] mb-1.5">
                    Notes <span className="text-[#64748B]">(optional)</span>
                  </label>
                  <textarea
                    value={notes}
                    onChange={(e) => setNotes(e.target.value)}
                    rows={3}
                    placeholder="Reason for change..."
                    className="w-full rounded-md border border-[#1E3A5F] bg-[#0A1628] px-3 py-2 text-sm text-white placeholder:text-[#64748B] outline-none focus:border-[#00D4D4] resize-none"
                  />
                </div>

                {error && (
                  <div className="rounded border border-[#F87171] bg-[#450A0A] px-3 py-2 text-xs text-[#F87171]">
                    {error}
                  </div>
                )}

                <div className="flex gap-2 pt-2">
                  <button
                    type="button"
                    onClick={() => setOpen(false)}
                    className="flex-1 h-9 rounded-md border border-[#1E3A5F] bg-[#0A1628] text-xs font-medium text-[#94A3B8] hover:bg-[#1E3A5F]/50 transition-colors"
                  >
                    Cancel
                  </button>
                  <button
                    type="submit"
                    disabled={submitting}
                    className="flex-1 h-9 rounded-md bg-[#FBBF24] text-xs font-medium text-[#0D1B2A] hover:bg-[#FBBF24]/80 transition-colors disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center gap-1.5"
                  >
                    {submitting && <Loader2 className="w-3.5 h-3.5 animate-spin" />}
                    {submitting ? "Submitting..." : "Submit Proposal"}
                  </button>
                </div>
              </form>
            )}
          </div>
        </div>
      )}
    </>
  )
}

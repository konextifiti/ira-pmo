"use client"

import { useEffect, useState } from "react"
import Link from "next/link"
import { Search, LayoutGrid, Table2 } from "lucide-react"
import { supabase } from "@/lib/supabase"
import StatusBadge from "@/components/ui/StatusBadge"
import { usePermissions } from "@/lib/permissions/usePermissions"
import { filterSitesByOwnedIds, shouldHideRawData, getDataVisibility } from "@/lib/permissions/dataGate"

interface Site {
  id: number
  site_code: string
  name: string
  region: string
  status: string
  metadata: Record<string, any>
  kpi_reports: { go_no_go: string }[]
}

const gridColors: Record<string, { bg: string; border: string }> = {
  "On Air": { bg: "#064E3B", border: "#10B981" },
  "Integration Done": { bg: "#065F46", border: "#34D399" },
  "Integration Ongoing": { bg: "#0F2B45", border: "#60A5FA" },
  "Pre-Test Pass": { bg: "#2E1065", border: "#818CF8" },
  "Pre-Test Ongoing": { bg: "#3B0764", border: "#A78BFA" },
  "MOP Approved": { bg: "#451A03", border: "#FBBF24" },
  "MOP Submitted": { bg: "#451A03", border: "#FBBF24" },
  "Transport Ordered": { bg: "#431407", border: "#FB923C" },
  "Transport Survey": { bg: "#431407", border: "#FB923C" },
  "Design Planning": { bg: "#1E293B", border: "#94A3B8" },
  "Not Started": { bg: "#0F172A", border: "#475569" },
  Blocked: { bg: "#450A0A", border: "#F87171" },
}

export default function TrackerPage() {
  const [sites, setSites] = useState<Site[]>([])
  const [search, setSearch] = useState("")
  const [statusFilter, setStatusFilter] = useState("All")
  const [view, setView] = useState<"table" | "grid">("table")
  const [dataLoading, setDataLoading] = useState(true)
  const { getVisibility, ownedSiteIds, loading: permLoading } = usePermissions()

  const visibility = getVisibility("bts_tracker")
  const { showAggregateOnly, domainFilter } = getDataVisibility(visibility, "bts_tracker")

  useEffect(() => {
    if (permLoading) return
    setDataLoading(true)
    supabase
      .from("project_sites")
      .select("id, site_code, name, region, status, metadata, kpi_reports(go_no_go)")
      .order("site_code")
      .then(({ data }) => {
        if (data) {
          let result = data as Site[]
          if (domainFilter) {
            result = filterSitesByOwnedIds(result, ownedSiteIds)
          }
          setSites(result)
        }
        setDataLoading(false)
      })
  }, [domainFilter, ownedSiteIds, permLoading])

  const statuses = ["All", ...new Set(sites.map((s) => s.status))]

  const filtered = sites.filter((s) => {
    const q = search.toLowerCase()
    const matchesSearch =
      !q ||
      s.site_code.toLowerCase().includes(q) ||
      s.name?.toLowerCase().includes(q)
    const matchesStatus = statusFilter === "All" || s.status === statusFilter
    return matchesSearch && matchesStatus
  })

  const goLabel = (s: Site) => {
    const kr = s.kpi_reports?.[0]
    return kr?.go_no_go || "—"
  }

  if (permLoading || dataLoading) {
    return (
      <div className="p-6 space-y-4">
        <div className="flex items-center gap-4 flex-wrap">
          <div className="h-9 w-64 rounded-md bg-[#1E3A5F] animate-pulse" />
          <div className="h-7 w-20 rounded-md bg-[#1E3A5F] animate-pulse" />
          <div className="h-7 w-20 rounded-md bg-[#1E3A5F] animate-pulse" />
          <div className="h-7 w-20 rounded-md bg-[#1E3A5F] animate-pulse ml-auto" />
        </div>
        <div className="rounded-lg border border-[#1E3A5F] bg-[#0A1628] p-6">
          <div className="space-y-3">
            {Array.from({ length: 8 }).map((_, i) => (
              <div key={i} className="flex gap-4">
                <div className="h-4 w-24 rounded bg-[#1E3A5F] animate-pulse" />
                <div className="h-4 w-32 rounded bg-[#1E3A5F] animate-pulse" />
                <div className="h-4 w-20 rounded bg-[#1E3A5F] animate-pulse" />
                <div className="h-4 w-28 rounded bg-[#1E3A5F] animate-pulse" />
                <div className="h-4 w-16 rounded bg-[#1E3A5F] animate-pulse" />
                <div className="h-4 w-20 rounded bg-[#1E3A5F] animate-pulse" />
                <div className="h-4 w-16 rounded bg-[#1E3A5F] animate-pulse" />
                <div className="h-4 w-12 rounded bg-[#1E3A5F] animate-pulse ml-auto" />
              </div>
            ))}
          </div>
        </div>
      </div>
    )
  }

  if (showAggregateOnly) {
    const byStatus: Record<string, number> = {}
    sites.forEach((s) => {
      byStatus[s.status] = (byStatus[s.status] || 0) + 1
    })
    const total = sites.length

    return (
      <div className="p-6 space-y-4">
        <h2 className="text-sm font-semibold text-white mb-2">
          BTS Tracker — Summary
        </h2>
        <p className="text-xs text-[#64748B] mb-4">
          Aggregate view only · {total} site{total !== 1 ? "s" : ""}
        </p>
        <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 gap-3">
          {Object.entries(byStatus)
            .sort((a, b) => b[1] - a[1])
            .map(([status, count]) => {
              const gc = gridColors[status] || { bg: "#1E293B", border: "#475569" }
              return (
                <div
                  key={status}
                  className="rounded-lg border p-4"
                  style={{ backgroundColor: gc.bg, borderColor: gc.border }}
                >
                  <div
                    className="text-2xl font-bold"
                    style={{ color: gc.border }}
                  >
                    {count}
                  </div>
                  <div className="text-xs text-[#94A3B8] mt-1">{status}</div>
                </div>
              )
            })}
        </div>
      </div>
    )
  }

  return (
    <div className="p-6 space-y-4">
      {/* Toolbar */}
      <div className="flex items-center gap-4 flex-wrap">
        <div className="relative flex-1 max-w-sm">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-[#64748B]" />
          <input
            type="text"
            placeholder="Search BTS ID or name..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="w-full h-9 rounded-md border border-[#1E3A5F] bg-[#0A1628] pl-9 pr-3 text-sm text-white placeholder:text-[#64748B] outline-none focus:border-[#00D4D4]"
          />
        </div>

        <div className="flex flex-wrap gap-2">
          {statuses.map((st) => (
            <button
              key={st}
              onClick={() => setStatusFilter(st)}
              className={`h-7 rounded-md px-3 text-xs font-medium transition-colors ${
                statusFilter === st
                  ? "bg-[#00D4D4] text-[#0D1B2A]"
                  : "bg-[#1E3A5F] text-[#94A3B8] hover:bg-[#1E3A5F]/70"
              }`}
            >
              {st}
            </button>
          ))}
        </div>

        <div className="flex items-center rounded-md border border-[#1E3A5F] overflow-hidden ml-auto">
          <button
            onClick={() => setView("table")}
            className={`p-2 ${
              view === "table"
                ? "bg-[#1E3A5F] text-white"
                : "bg-transparent text-[#64748B]"
            }`}
          >
            <Table2 className="w-4 h-4" />
          </button>
          <button
            onClick={() => setView("grid")}
            className={`p-2 ${
              view === "grid"
                ? "bg-[#1E3A5F] text-white"
                : "bg-transparent text-[#64748B]"
            }`}
          >
            <LayoutGrid className="w-4 h-4" />
          </button>
        </div>
      </div>

      {/* Table view */}
      {view === "table" && (
        <div className="overflow-x-auto rounded-lg border border-[#1E3A5F] bg-[#0A1628]">
          <table className="w-full text-sm">
            <thead>
              <tr className="border-b border-[#1E3A5F] text-xs text-[#64748B] uppercase">
                <th className="text-left px-4 py-3 font-medium">BTS ID</th>
                <th className="text-left px-4 py-3 font-medium">City</th>
                <th className="text-left px-4 py-3 font-medium">Region</th>
                <th className="text-left px-4 py-3 font-medium">Status</th>
                <th className="text-left px-4 py-3 font-medium">TP Vendor</th>
                <th className="text-left px-4 py-3 font-medium">RBS Vendor</th>
                <th className="text-left px-4 py-3 font-medium">GO/NO-GO</th>
                <th className="text-right px-4 py-3 font-medium">Detail</th>
              </tr>
            </thead>
            <tbody>
              {filtered.map((s) => (
                <tr
                  key={s.id}
                  className="border-b border-[#1E3A5F]/50 last:border-0 hover:bg-[#1E3A5F]/20"
                >
                  <td className="px-4 py-3">
                    <Link
                      href={`/sites/${s.site_code}`}
                      className="font-mono text-sm text-[#00D4D4] hover:underline"
                    >
                      {s.site_code}
                    </Link>
                  </td>
                  <td className="px-4 py-3 text-[#E2E8F0]">
                    {s.metadata?.city || "—"}
                  </td>
                  <td className="px-4 py-3 text-[#94A3B8]">{s.region || "—"}</td>
                  <td className="px-4 py-3">
                    <StatusBadge status={s.status} />
                  </td>
                  <td className="px-4 py-3 text-[#94A3B8]">
                    {s.metadata?.tp_vendor || "—"}
                  </td>
                  <td className="px-4 py-3 text-[#94A3B8]">
                    {s.metadata?.rbs_vendor || "—"}
                  </td>
                  <td className="px-4 py-3">
                    <span
                      className={`text-xs font-medium ${
                        goLabel(s) === "GO"
                          ? "text-[#10B981]"
                          : goLabel(s) === "NO-GO"
                            ? "text-[#F87171]"
                            : "text-[#64748B]"
                      }`}
                    >
                      {goLabel(s)}
                    </span>
                  </td>
                  <td className="px-4 py-3 text-right">
                    <Link
                      href={`/sites/${s.site_code}`}
                      className="inline-flex h-7 items-center rounded px-2.5 text-xs font-medium bg-[#1E3A5F] text-[#94A3B8] hover:bg-[#1E3A5F]/70 hover:text-white transition-colors"
                    >
                      Detail
                    </Link>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}

      {/* Grid view */}
      {view === "grid" && (
        <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-5 gap-2">
          {filtered.map((s) => {
            const gc = gridColors[s.status] || {
              bg: "#1E293B",
              border: "#475569",
            }
            return (
              <Link
                key={s.id}
                href={`/sites/${s.site_code}`}
                className="rounded-lg border p-2 flex flex-col gap-1 text-[10px] transition-colors hover:opacity-80"
                style={{ backgroundColor: gc.bg, borderColor: gc.border }}
              >
                <span className="font-mono text-[#00D4D4] font-medium truncate">
                  {s.site_code}
                </span>
                <span className="text-[#94A3B8] truncate">
                  {s.metadata?.city || "—"}
                </span>
                <div className="flex items-center justify-between mt-auto pt-1">
                  <StatusBadge status={s.status} />
                  <span
                    className={`text-[10px] font-medium ${
                      goLabel(s) === "GO"
                        ? "text-[#10B981]"
                        : goLabel(s) === "NO-GO"
                          ? "text-[#F87171]"
                          : "text-[#64748B]"
                    }`}
                  >
                    {goLabel(s)}
                  </span>
                </div>
              </Link>
            )
          })}
        </div>
      )}
    </div>
  )
}

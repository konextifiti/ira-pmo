import { supabase } from "@/lib/supabase"
import { getUserPermissions, getModuleVisibility } from "@/lib/permissions/permissions"
import { shouldHideRawData } from "@/lib/permissions/dataGate"

const weeks = [
  { label: "W22", value: 12 },
  { label: "W23", value: 18 },
  { label: "W24", value: 24 },
  { label: "W25", value: 32 },
  { label: "W26", value: 40 },
]

const maxVal = Math.max(...weeks.map((w) => w.value))

export default async function ReportsPage() {
  const userPerms = await getUserPermissions()
  const perms = userPerms?.permissions
  const visibility = perms ? getModuleVisibility("reports", perms) : "all"
  const hideRaw = shouldHideRawData(visibility)

  const [{ data: sites }, { data: kpis }, { data: verdicts }] =
    await Promise.all([
      supabase.from("project_sites_approved").select("status, region"),
      supabase.from("kpi_reports").select("go_no_go"),
      supabase.from("spv_verdicts").select("verdict"),
    ])

  const siteList = (sites as any[]) || []
  const kpiList = (kpis as any[]) || []
  const verdictList = (verdicts as any[]) || []

  const total = siteList.length
  const onAir = siteList.filter((s: any) => s.status === "On Air").length
  const integration =
    siteList.filter(
      (s: any) =>
        s.status === "Integration Done" || s.status === "Integration Ongoing"
    ).length
  const blocked = siteList.filter((s: any) => s.status === "Blocked").length

  const goCount = kpiList.filter((k: any) => k.go_no_go === "GO").length
  const goRate = kpiList.length
    ? Math.round((goCount / kpiList.length) * 100)
    : 0

  const approvedVerdicts = verdictList.filter(
    (v: any) => v.verdict === "APPROVED"
  ).length
  const spvApprovalRate = verdictList.length
    ? Math.round((approvedVerdicts / verdictList.length) * 100)
    : 0

  const onAirPct = total ? Math.round((onAir / total) * 100) : 0
  const integrationPct = total ? Math.round((integration / total) * 100) : 0
  const blockedPct = total ? Math.round((blocked / total) * 100) : 0

  return (
    <div className="p-6 space-y-6">
      {hideRaw && (
        <div className="rounded-lg border border-[#F59E0B] bg-[#451A03] px-4 py-2 text-xs text-[#FBBF24]">
          Summary view — detailed evidence and communication logs are hidden per
          your access level.
        </div>
      )}

      {/* Header + Export */}
      <div className="flex items-center justify-between">
        <h1 className="text-base font-semibold text-white">Reports</h1>
        <div className="flex gap-2">
          <button
            type="button"
            className="h-8 rounded-md border border-[#1E3A5F] bg-[#0A1628] px-3 text-xs font-medium text-[#94A3B8] hover:bg-[#1E3A5F]/50 transition-colors"
          >
            Export PDF
          </button>
          <button
            type="button"
            className="h-8 rounded-md border border-[#1E3A5F] bg-[#0A1628] px-3 text-xs font-medium text-[#94A3B8] hover:bg-[#1E3A5F]/50 transition-colors"
          >
            Export Excel
          </button>
        </div>
      </div>

      {/* Weekly Progress Bar Chart */}
      <div className="rounded-lg border border-[#1E3A5F] bg-[#0A1628] p-4">
        <h3 className="text-sm font-semibold text-white mb-4">
          Weekly Active Sites (W22-W26)
        </h3>
        <div className="flex items-end gap-3 h-40">
          {weeks.map((w) => {
            const h = (w.value / maxVal) * 100
            return (
              <div
                key={w.label}
                className="flex-1 flex flex-col items-center gap-1"
              >
                <span className="text-xs text-[#64748B] font-medium">
                  {w.value}
                </span>
                <div className="w-full rounded-t bg-gradient-to-t from-[#7c3aed] to-[#00D4D4] transition-all"
                  style={{ height: `${h}%`, minHeight: "4px" }}
                />
                <span className="text-xs text-[#64748B]">{w.label}</span>
              </div>
            )
          })}
        </div>
      </div>

      {/* KPI Summary Panels */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-4">
        {[
          { label: "GO Rate", value: goRate, color: "#10B981" },
          { label: "On Air", value: onAirPct, color: "#34D399" },
          { label: "Integration", value: integrationPct, color: "#60A5FA" },
          { label: "Blocked", value: blockedPct, color: "#F87171" },
          {
            label: "SPV Approval",
            value: spvApprovalRate,
            color: "#7c3aed",
          },
        ].map((kpi) => (
          <div
            key={kpi.label}
            className="rounded-lg border border-[#1E3A5F] bg-[#0A1628] p-4"
          >
            <div className="text-2xl font-bold" style={{ color: kpi.color }}>
              {kpi.value}%
            </div>
            <div className="text-xs text-[#64748B] mt-1 mb-2">
              {kpi.label}
            </div>
            <div className="h-1.5 rounded-full bg-[#1E3A5F] overflow-hidden">
              <div
                className="h-full rounded-full transition-all"
                style={{
                  width: `${kpi.value}%`,
                  backgroundColor: kpi.color,
                }}
              />
            </div>
          </div>
        ))}
      </div>

      {/* PMO Report Card - only show raw data sections if visibility allows */}
      {!hideRaw && (
        <div className="rounded-lg border border-[#1E3A5F] bg-[#0A1628] p-5">
          <h3 className="text-sm font-semibold text-white mb-4">
            PMO Report — Project IRA
          </h3>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            <div>
              <h4 className="text-xs font-semibold text-[#00D4D4] mb-2 uppercase tracking-wider">
                Executive Summary
              </h4>
              <p className="text-xs text-[#94A3B8] leading-relaxed">
                Project IRA (Nokia 5G SA) has achieved 40% overall completion
                across 100 sites in 7 regions. On Air delivery stands at 32% with
                strong momentum in Jawa and DKI Jakarta. Integration pipeline
                remains healthy at 24%, while 8 sites are currently blocked
                awaiting transport clearance. SPV approval rate is at 78%,
                indicating consistent quality across agent outputs. The project is
                on track to meet the Q3 milestone target of 60% completion.
              </p>
            </div>
            <div>
              <h4 className="text-xs font-semibold text-[#F59E0B] mb-2 uppercase tracking-wider">
                Risk Register
              </h4>
              <ul className="space-y-2">
                {[
                  "Transport delivery delays in Sumatera and Kalimantan regions affecting 12 sites",
                  "RBS vendor procurement backlog — 5 sites awaiting equipment allocation",
                  "SPV queue bottleneck: 22 evaluations pending review, avg wait 3.2 days",
                  "Agent A4 (Config Auditor) showing 15% lower throughput vs target SLA",
                ].map((r, i) => (
                  <li
                    key={i}
                    className="flex items-start gap-2 text-xs text-[#94A3B8]"
                  >
                    <span className="text-[#F87171] mt-0.5 shrink-0">•</span>
                    <span>{r}</span>
                  </li>
                ))}
              </ul>
            </div>
            <div>
              <h4 className="text-xs font-semibold text-[#10B981] mb-2 uppercase tracking-wider">
                Next Week Targets
              </h4>
              <ul className="space-y-2">
                {[
                  "On Air: 8 sites in Jawa and DKI Jakarta",
                  "Integration: Complete 12 sites across Banten and Sumatera",
                  "SPV: Clear 15 pending evaluations from current queue",
                  "Agent A4: Reprovision config auditor for improved throughput",
                  "Transport: Resolve delivery blockers for 5 Sumatera sites",
                ].map((t, i) => (
                  <li
                    key={i}
                    className="flex items-start gap-2 text-xs text-[#94A3B8]"
                  >
                    <span className="text-[#10B981] mt-0.5 shrink-0">→</span>
                    <span>{t}</span>
                  </li>
                ))}
              </ul>
            </div>
          </div>
        </div>
      )}

      {hideRaw && (
        <div className="rounded-lg border border-[#1E3A5F] bg-[#0A1628] p-5">
          <h3 className="text-sm font-semibold text-white mb-2">
            PMO Report — Summary
          </h3>
          <p className="text-xs text-[#94A3B8]">
            Detailed report sections are hidden per your access level. Contact
            your PMO for the full report.
          </p>
        </div>
      )}
    </div>
  )
}

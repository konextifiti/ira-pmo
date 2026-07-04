import { supabase } from "@/lib/supabase"

const statusColors: Record<string, string> = {
  "On Air": "#10B981",
  "Integration Done": "#34D399",
  "Integration Ongoing": "#60A5FA",
  "Pre-Test Pass": "#818CF8",
  "Pre-Test Ongoing": "#A78BFA",
  "MOP Approved": "#FBBF24",
  "MOP Submitted": "#FBBF24",
  Transport: "#FB923C",
  "Design Planning": "#94A3B8",
  "Not Started": "#475569",
  Blocked: "#F87171",
}

const regions = [
  "Jawa",
  "DKI Jakarta",
  "Banten",
  "Sumatera",
  "Sulawesi",
  "Kalimantan",
  "Bali",
]

export default async function DashboardPage() {
  const [{ data: sites }, { data: agents }, { count: spvCount }] =
    await Promise.all([
      supabase.from("project_sites_approved").select("status, metadata"),
      supabase
        .from("project_agents")
        .select(
          "id, agent_types(code,name), users(name), agent_runs(id, spv_verdicts(verdict))"
        ),
      supabase
        .from("spv_evaluations")
        .select("*", { count: "exact", head: true })
        .eq("auto_recommendation", "AUTO_APPROVE_CANDIDATE"),
    ])

  const { count: goCount } = await supabase
    .from("kpi_reports")
    .select("*", { count: "exact", head: true })
    .eq("type", "GO")

  const statusBreakdown: Record<string, number> = {}
  const regionBreakdown: Record<string, number> = {}
  let totalBts = 0
  let onAir = 0
  let integrationDone = 0
  let integrationOngoing = 0
  let blocked = 0

  sites?.forEach((site: any) => {
    totalBts++
    const s = site.status || "Not Started"
    statusBreakdown[s] = (statusBreakdown[s] || 0) + 1

    if (s === "On Air") onAir++
    if (s === "Integration Done") integrationDone++
    if (s === "Integration Ongoing") integrationOngoing++
    if (s === "Blocked") blocked++

    const region = site.metadata?.region
    if (region && regions.includes(region)) {
      regionBreakdown[region] = (regionBreakdown[region] || 0) + 1
    }
  })

  const totalIntegration = integrationDone + integrationOngoing

  const sortedStatuses = Object.entries(statusBreakdown).sort(
    (a, b) => b[1] - a[1]
  )

  return (
    <div className="p-6 space-y-6">
      {/* Metric row */}
      <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-6 gap-4">
        {[
          { label: "Total BTS", value: totalBts, color: "#00D4D4" },
          { label: "On Air", value: onAir, color: "#10B981" },
          {
            label: "Integration",
            value: totalIntegration,
            color: "#60A5FA",
          },
          { label: "GO Count", value: goCount ?? 0, color: "#34D399" },
          { label: "Blocked", value: blocked, color: "#F87171" },
          { label: "SPV Queue", value: spvCount ?? 0, color: "#7c3aed" },
        ].map((m) => (
          <div
            key={m.label}
            className="rounded-lg border border-[#1E3A5F] bg-[#0A1628] p-4"
          >
            <div className="text-2xl font-bold" style={{ color: m.color }}>
              {m.value}
            </div>
            <div className="text-xs text-[#64748B] mt-1">{m.label}</div>
          </div>
        ))}
      </div>

      {/* 3-column section */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-4">
        {/* Progress by Status */}
        <div className="rounded-lg border border-[#1E3A5F] bg-[#0A1628] p-4">
          <h3 className="text-sm font-semibold text-white mb-4">
            Progress by Status
          </h3>
          <div className="space-y-3">
            {sortedStatuses.map(([status, count]) => {
              const pct = totalBts ? (count / totalBts) * 100 : 0
              const color = statusColors[status] || "#475569"
              return (
                <div key={status}>
                  <div className="flex justify-between text-xs mb-1">
                    <span className="text-[#94A3B8]">{status}</span>
                    <span className="text-white font-medium">{count}</span>
                  </div>
                  <div className="h-1.5 rounded-full bg-[#1E3A5F] overflow-hidden">
                    <div
                      className="h-full rounded-full transition-all"
                      style={{
                        width: `${pct}%`,
                        backgroundColor: color,
                      }}
                    />
                  </div>
                </div>
              )
            })}
          </div>
        </div>

        {/* Agent Health */}
        <div className="rounded-lg border border-[#1E3A5F] bg-[#0A1628] p-4">
          <h3 className="text-sm font-semibold text-white mb-4">
            Agent Health
          </h3>
          <div className="space-y-2">
            {agents?.map((agent: any) => {
              const code = agent.agent_types?.code || "??"
              const name = agent.agent_types?.name || "Unknown"
              const pic = agent.users?.name || "—"
              const verdicts =
                agent.agent_runs?.flatMap(
                  (r: any) => r.spv_verdicts || []
                ) || []
              const approved = verdicts.filter(
                (v: any) => v.verdict === "approved"
              ).length
              const queued = verdicts.filter(
                (v: any) => v.verdict === "pending" || v.verdict === "queued"
              ).length
              const isStandby = !agent.agent_runs?.length

              const codeColors: Record<string, string> = {
                A1: "#10B981",
                A2: "#3B82F6",
                A3: "#F59E0B",
                A4: "#EF4444",
                A5: "#8B5CF6",
                A6: "#EC4899",
                A7: "#14B8A6",
              }

              return (
                <div
                  key={agent.id}
                  className="flex items-center gap-2 py-1.5 text-xs"
                >
                  <span
                    className="w-7 h-5 rounded flex items-center justify-center text-[10px] font-bold text-white"
                    style={{
                      backgroundColor: codeColors[code] || "#64748B",
                    }}
                  >
                    {code}
                  </span>
                  <div className="flex-1 min-w-0">
                    <div className="text-white truncate">{name}</div>
                    <div className="text-[#64748B] truncate">{pic}</div>
                  </div>
                  {isStandby ? (
                    <span className="px-1.5 py-0.5 rounded text-[10px] font-medium bg-[#475569] text-[#94A3B8]">
                      Standby
                    </span>
                  ) : (
                    <div className="flex items-center gap-2 shrink-0">
                      <span className="text-[#10B981] font-medium">
                        {approved}
                      </span>
                      {queued > 0 && (
                        <span className="text-[#F59E0B] font-medium">
                          {queued}
                        </span>
                      )}
                    </div>
                  )}
                </div>
              )
            })}
          </div>
        </div>

        {/* SPV Queue Alert */}
        <div className="rounded-lg border border-[#7c3aed] bg-[#2E1065] p-4">
          <h3 className="text-sm font-semibold text-white mb-4">
            SPV Queue Alert
          </h3>

          {spvCount && spvCount > 0 ? (
            <div className="space-y-2">
              {Array.from({ length: Math.min(3, spvCount) }, (_, i) => (
                <div
                  key={i}
                  className="flex items-center gap-2 rounded bg-[#1E3A5F]/40 p-2 text-xs"
                >
                  <span className="shrink-0 h-5 rounded px-1.5 bg-[#7c3aed] text-[10px] font-bold text-white flex items-center">
                    A{i + 1}
                  </span>
                  <span className="flex-1 text-[#E2E8F0]">
                    SITE-{String(i + 1).padStart(3, "0")}
                  </span>
                  <span className="text-[#00D4D4] font-medium">
                    {Math.round(85 - i * 7)}%
                  </span>
                </div>
              ))}
            </div>
          ) : (
            <p className="text-xs text-[#64748B]">No pending items</p>
          )}

          <a
            href="/spv"
            className="mt-4 flex items-center justify-center gap-1 rounded bg-[#7c3aed] px-3 py-1.5 text-xs font-medium text-white hover:bg-[#6d28d9] transition-colors"
          >
            Review Queue →
          </a>
        </div>
      </div>

      {/* Regional row */}
      <div className="grid grid-cols-2 sm:grid-cols-4 lg:grid-cols-7 gap-3">
        {regions.map((region) => {
          const count = regionBreakdown[region] || 0
          const pct = totalBts ? (count / totalBts) * 100 : 0
          return (
            <div
              key={region}
              className="rounded-lg border border-[#1E3A5F] bg-[#0A1628] p-3 text-center"
            >
              <div className="text-lg font-bold text-white">{count}</div>
              <div className="text-[10px] text-[#64748B] mt-0.5">
                {region}
              </div>
              <div className="mt-2 h-1 rounded-full bg-[#1E3A5F] overflow-hidden">
                <div
                  className="h-full rounded-full bg-[#00D4D4] transition-all"
                  style={{ width: `${pct}%` }}
                />
              </div>
            </div>
          )
        })}
      </div>
    </div>
  )
}

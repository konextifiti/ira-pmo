import { supabase } from "@/lib/supabase"

const AGENT_COLORS: Record<string, string> = {
  A1: "#1A3A5C", A2: "#7D3C98", A3: "#148F77", A4: "#BA7517",
  A5: "#1A5276", A6: "#E67E22", A7: "#C0392B",
}

export default async function AgentsPage() {
  const { data } = await supabase
    .from("project_agents")
    .select(
      `id, is_active, agent_types(code,name,domain), users(name),
       agent_runs(id, spv_verdicts(verdict))`
    )

  const agents = (data as any[]) || []

  return (
    <div className="p-6 space-y-6">
      <h1 className="text-base font-semibold text-white">Agent Monitor</h1>
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4">
        {agents.map((agent: any) => {
          const at = agent.agent_types
          const code = at?.code || "??"
          const color = AGENT_COLORS[code] || "#1E293B"
          const label = at?.name || "Unknown"
          const domain = at?.domain || "—"
          const pic = agent.users?.name || "—"
          const runs = agent.agent_runs || []
          const verdicts = runs.flatMap(
            (r: any) => r.spv_verdicts || []
          )
          const totalRuns = runs.length
          const approved = verdicts.filter(
            (v: any) => v.verdict === "APPROVED"
          ).length
          const queued = totalRuns - verdicts.length
          const hasActivity = totalRuns > 0
          const approvalRate = totalRuns
            ? Math.round((approved / totalRuns) * 100)
            : 0

          return (
            <div
              key={agent.id}
              className="rounded-lg border border-[#1E3A5F] bg-[#0A1628] p-4"
            >
              {/* Header */}
              <div className="flex items-center gap-3 mb-3">
                <span
                  className="h-7 min-w-7 rounded flex items-center justify-center text-xs font-bold text-white"
                  style={{ backgroundColor: color }}
                >
                  {code}
                </span>
                <div className="flex-1 min-w-0">
                  <div className="text-sm font-medium text-white truncate">
                    {label}
                  </div>
                  <div className="text-[10px] text-[#64748B] truncate">
                    {domain}
                  </div>
                </div>
                <span className="relative flex h-2.5 w-2.5 shrink-0">
                  {hasActivity && (
                    <span className="absolute inline-flex h-full w-full animate-ping rounded-full bg-[#10B981] opacity-75" />
                  )}
                  <span
                    className={`relative inline-flex h-2.5 w-2.5 rounded-full ${
                      hasActivity ? "bg-[#10B981]" : "bg-[#64748B]"
                    }`}
                  />
                </span>
              </div>

              {/* PIC */}
              <div className="text-xs text-[#64748B] mb-3">
                PIC: <span className="text-[#E2E8F0]">{pic}</span>
              </div>

              {/* Metrics */}
              <div className="grid grid-cols-3 gap-2 mb-3">
                <div className="rounded bg-[#1E3A5F]/40 p-2 text-center">
                  <div className="text-sm font-bold text-[#00D4D4]">
                    {totalRuns}
                  </div>
                  <div className="text-[10px] text-[#64748B]">Runs</div>
                </div>
                <div className="rounded bg-[#1E3A5F]/40 p-2 text-center">
                  <div className="text-sm font-bold text-[#10B981]">
                    {approved}
                  </div>
                  <div className="text-[10px] text-[#64748B]">Approved</div>
                </div>
                <div className="rounded bg-[#1E3A5F]/40 p-2 text-center">
                  <div className="text-sm font-bold text-[#F59E0B]">
                    {queued}
                  </div>
                  <div className="text-[10px] text-[#64748B]">Queue</div>
                </div>
              </div>

              {/* Approval Rate */}
              <div className="mb-3">
                <div className="flex justify-between text-xs mb-1">
                  <span className="text-[#64748B]">Approval Rate</span>
                  <span className="text-white font-medium">
                    {approvalRate}%
                  </span>
                </div>
                <div className="h-1.5 rounded-full bg-[#1E3A5F] overflow-hidden">
                  <div
                    className="h-full rounded-full transition-all"
                    style={{
                      width: `${approvalRate}%`,
                      backgroundColor: color,
                    }}
                  />
                </div>
              </div>

              {/* View Runs */}
              <button
                type="button"
                className="w-full h-8 rounded-md border border-[#1E3A5F] text-xs font-medium text-[#94A3B8] hover:bg-[#1E3A5F]/50 transition-colors"
              >
                View Runs
              </button>
            </div>
          )
        })}
      </div>
    </div>
  )
}

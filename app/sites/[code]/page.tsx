import { supabase } from "@/lib/supabase"
import { notFound } from "next/navigation"
import StatusBadge from "@/components/ui/StatusBadge"
import { Tabs, TabsList, TabsTrigger, TabsContent } from "@/components/ui/tabs"
import { getUserPermissions, getModuleVisibility, getEffectiveDomains, getUserOwnedSiteIds } from "@/lib/permissions/permissions"
import { shouldHideRawData } from "@/lib/permissions/dataGate"

const agentSteps = [
  { code: "A2", label: "Design" },
  { code: "A3", label: "Verify" },
  { code: "A6", label: "Survey" },
  { code: "A5", label: "KPI" },
  { code: "A1", label: "GO" },
]

const dimLabels = ["Coverage", "Capacity", "Latency", "Reliability", "Throughput"]

interface PageProps {
  params: Promise<{ code: string }>
}

export default async function SitePage({ params }: PageProps) {
  const { code } = await params

  const userPerms = await getUserPermissions()
  const perms = userPerms?.permissions
  const siteVisibility = perms ? getModuleVisibility("site_detail", perms) : "all"
  const hideRaw = shouldHideRawData(siteVisibility)
  const domains = perms ? getEffectiveDomains(perms) : ["all"]
  const ownedSiteIds = await getUserOwnedSiteIds()

  const { data: site, error } = await supabase
    .from("project_sites")
    .select("*")
    .eq("site_code", code)
    .single()

  if (error || !site) notFound()

  const restricted =
    (siteVisibility === "own_scope" || siteVisibility === "domain_scope") &&
    !ownedSiteIds.includes(site.id)

  if (restricted) {
    return (
      <div className="p-6">
        <div className="rounded-lg border border-[#1E3A5F] bg-[#0A1628] p-6 text-center">
          <h2 className="text-sm font-semibold text-white mb-2">
            Site Not in Your Scope
          </h2>
          <p className="text-xs text-[#64748B]">
            This site is outside your assigned domain. Contact your PMO if you
            need access.
          </p>
        </div>
      </div>
    )
  }

  const { data: runs } = await supabase
    .from("agent_runs")
    .select(
      `id, msg_id, status, project_agents(agent_types(code,name)), spv_evaluations(*), spv_verdicts(verdict,revision_notes), lld_documents(*), verify_evidence(*), field_surveys(*), kpi_reports(*)`
    )
    .eq("site_id", site.id)

  const m = site.metadata || {}
  const goReport = runs?.find((r: any) => (r.project_agents as any)?.agent_types?.code === "A1")
  const goVerdict = goReport?.spv_verdicts?.[0]
  const isGo = goVerdict?.verdict === "APPROVED"

  const stepDone = (code: string) =>
    runs?.some(
      (r: any) =>
        (r.project_agents as any)?.agent_types?.code === code &&
        r.spv_verdicts?.some((v: any) => v.verdict === "APPROVED")
    )

  const runForAgent = (code: string) =>
    runs?.find((r: any) => (r.project_agents as any)?.agent_types?.code === code)

  const tabs = hideRaw
    ? [{ value: "overview", label: "Overview" }]
    : [
        { value: "overview", label: "Overview" },
        { value: "a2", label: "A2 Design" },
        { value: "a3", label: "A3 Verify" },
        { value: "a6", label: "A6 Survey" },
        { value: "a5", label: "A5 KPI" },
      ]

  return (
    <div className="p-6 space-y-6">
      {hideRaw && (
        <div className="rounded-lg border border-[#F59E0B] bg-[#451A03] px-4 py-2 text-xs text-[#FBBF24]">
          Summary view — raw evidence and communication logs are hidden per your
          access level.
        </div>
      )}

      {/* Site Header */}
      <div className="flex items-start justify-between">
        <div>
          <div className="flex items-center gap-3">
            <h1 className="font-mono text-2xl font-bold text-[#00D4D4]">
              {site.site_code}
            </h1>
            <StatusBadge status={site.status} />
            {goReport && (
              <span
                className={`inline-flex h-5 items-center rounded px-1.5 text-[10px] font-medium ${
                  isGo
                    ? "bg-[#064E3B] text-[#10B981]"
                    : "bg-[#450A0A] text-[#F87171]"
                }`}
              >
                {isGo ? "GO" : "NO-GO"}
              </span>
            )}
          </div>
          <p className="text-sm text-[#64748B] mt-1">
            {m.city || "—"} · {site.region || "—"} · {m.rbs_vendor || "—"} ·{" "}
            {m.tp_vendor || "—"}
          </p>
        </div>
        <div className="flex gap-2">
          <button
            type="button"
            className="h-8 rounded-md border border-[#1E3A5F] bg-[#0A1628] px-3 text-xs font-medium text-[#94A3B8] hover:bg-[#1E3A5F]/50 transition-colors"
          >
            Export
          </button>
          <button
            type="button"
            className="h-8 rounded-md bg-[#00D4D4] px-3 text-xs font-medium text-[#0D1B2A] hover:bg-[#00D4D4]/80 transition-colors"
          >
            Run Agent
          </button>
        </div>
      </div>

      {/* Pipeline Bar */}
      <div className="flex items-center gap-0 overflow-x-auto">
        {agentSteps.map((step, i) => {
          const done = stepDone(step.code)
          return (
            <div
              key={step.code}
              className="flex items-center flex-1"
            >
              <div
                className={`flex items-center gap-1.5 h-8 rounded-md px-3 text-xs font-medium ${
                  done
                    ? "bg-[#064E3B] text-[#10B981]"
                    : "bg-[#1E3A5F] text-[#64748B]"
                }`}
              >
                {done && <span className="text-[#10B981]">✓</span>}
                <span>
                  {step.code} {step.label}
                </span>
              </div>
              {i < agentSteps.length - 1 && (
                <div className="flex-1 h-px bg-[#1E3A5F] mx-2" />
              )}
            </div>
          )
        })}
      </div>

      {/* Tabs */}
      <Tabs defaultValue="overview">
        <TabsList variant="line">
          {tabs.map((t) => (
            <TabsTrigger key={t.value} value={t.value}>
              {t.label}
            </TabsTrigger>
          ))}
        </TabsList>

        {/* Overview */}
        <TabsContent value="overview">
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
            {/* Site Config */}
            <div className="rounded-lg border border-[#1E3A5F] bg-[#0A1628] p-4">
              <h3 className="text-sm font-semibold text-white mb-3">
                Site Configuration
              </h3>
              <table className="w-full text-xs">
                <tbody>
                  {[
                    ["IP BTS", m.ip_bts],
                    ["IP GW", m.ip_gw],
                    ["VLAN ID", m.vlan_id],
                    ["SFP Type", m.sfp_type],
                    ["MIMO Config", m.mimo_config],
                    ["Sync Source", m.sync_source],
                    ["Clock Type", m.clock_type],
                  ].map(([label, value]) => (
                    <tr key={label as string}>
                      <td className="py-1.5 pr-4 text-[#64748B] whitespace-nowrap">
                        {label}
                      </td>
                      <td className="py-1.5 text-[#E2E8F0] font-mono">
                        {(value as string) || "—"}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>

            {/* Agent Run Summary + GO/NO-GO */}
            <div className="space-y-4">
              <div className="rounded-lg border border-[#1E3A5F] bg-[#0A1628] p-4">
                <h3 className="text-sm font-semibold text-white mb-3">
                  Agent Run Summary
                </h3>
                <div className="space-y-2">
                  {["A2", "A3", "A6", "A5"]
                    .map((code) => {
                      const run = runForAgent(code)
                      const at = (run?.project_agents as any)?.agent_types
                      const spvVerdict = run?.spv_verdicts?.[0]
                      const score = run?.spv_evaluations?.[0]
                      const dims = score
                        ? [
                            score.score_dim1,
                            score.score_dim2,
                            score.score_dim3,
                            score.score_dim4,
                            score.score_dim5,
                          ]
                        : []
                      const total = dims.reduce(
                        (a: number, b: number) => a + (b || 0),
                        0
                      )
                      const pct = total ? Math.round((total / 50) * 100) : 0
                      return (
                        <div
                          key={code}
                          className="flex items-center gap-3 py-1.5 text-xs"
                        >
                          <span className="w-7 h-5 rounded flex items-center justify-center text-[10px] font-bold text-white bg-[#1E3A5F]">
                            {code}
                          </span>
                          <span className="flex-1 text-[#E2E8F0]">
                            {at?.name || "—"}
                          </span>
                          {spvVerdict?.verdict === "APPROVED" ? (
                            <span className="text-[#10B981] font-medium">
                              APPROVED
                            </span>
                          ) : (
                            <span className="text-[#64748B]">Pending</span>
                          )}
                          {total > 0 && (
                            <span className="text-[#00D4D4] font-mono w-10 text-right">
                              {pct}%
                            </span>
                          )}
                        </div>
                      )
                    })}
                </div>
              </div>

              {/* GO/NO-GO Result */}
              <div className="rounded-lg border border-[#10B981] bg-[#064E3B] p-4 flex items-center gap-3">
                <div className="w-10 h-10 rounded-full bg-[#10B981] flex items-center justify-center shrink-0">
                  <span className="text-white text-lg font-bold">
                    {isGo ? "✓" : "✗"}
                  </span>
                </div>
                <div>
                  <div className="text-base font-bold text-[#10B981]">
                    {isGo ? "GO" : "NO-GO"}
                  </div>
                  <div className="text-xs text-[#34D399]">
                    {isGo
                      ? "Site passed all agent validations"
                      : "Site requires attention"}
                  </div>
                </div>
              </div>
            </div>
          </div>
        </TabsContent>

        {/* A2 Design */}
        {!hideRaw && (
          <TabsContent value="a2">
            <SiteTabContent
              leftConfig={[
                ["IP BTS", m.ip_bts],
                ["IP GW", m.ip_gw],
                ["VLAN ID", m.vlan_id],
                ["SFP Type", m.sfp_type],
                ["MIMO Config", m.mimo_config],
                ["Sync Source", m.sync_source],
                ["Clock Type", m.clock_type],
              ]}
              leftTitle="LLD Configuration"
              run={runForAgent("A2")}
            />
          </TabsContent>
        )}

        {/* A3 Verify */}
        {!hideRaw && (
          <TabsContent value="a3">
            <SiteTabContent
              leftConfig={[
                ["Radio Type", m.radio_type],
                ["TMA Type", m.tma_type],
                ["Retrofit", m.retrofit],
                ["Cable Length", m.cable_length],
                ["Antenna Type", m.antenna_type],
                ["Mechanical Tilt", m.mechanical_tilt],
                ["Electrical Tilt", m.electrical_tilt],
              ]}
              leftTitle="Verify Evidence"
              run={runForAgent("A3")}
            />
          </TabsContent>
        )}

        {/* A6 Survey */}
        {!hideRaw && (
          <TabsContent value="a6">
            <SiteTabContent
              leftConfig={[
                ["Survey Date", m.survey_date],
                ["Surveyor", m.surveyor],
                ["Tower Height", m.tower_height],
                ["Tower Type", m.tower_type],
                ["Access Road", m.access_road],
                ["Power Source", m.power_source],
                ["Fence Condition", m.fence_condition],
              ]}
              leftTitle="Field Survey"
              run={runForAgent("A6")}
            />
          </TabsContent>
        )}

        {/* A5 KPI */}
        {!hideRaw && (
          <TabsContent value="a5">
            <SiteTabContent
              leftConfig={
                (() => {
                  const kpi = runForAgent("A5")?.kpi_reports?.[0]
                  return kpi
                    ? [
                        ["RSRP", kpi.rsrp],
                        ["RSRQ", kpi.rsrq],
                        ["SINR", kpi.sinr],
                        ["CQI", kpi.cqi],
                        ["Throughput DL", kpi.throughput_dl],
                        ["Throughput UL", kpi.throughput_ul],
                        ["Latency", kpi.latency],
                        ["Availability", kpi.availability],
                      ]
                    : []
                })()
              }
              leftTitle="KPI Report"
              run={runForAgent("A5")}
            />
          </TabsContent>
        )}
      </Tabs>
    </div>
  )
}

function SiteTabContent({
  leftConfig,
  leftTitle,
  run,
}: {
  leftConfig: [string, any][]
  leftTitle: string
  run: any
}) {
  const gate = spvGateFn(run)

  return (
    <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
      <div className="rounded-lg border border-[#1E3A5F] bg-[#0A1628] p-4">
        <h3 className="text-sm font-semibold text-white mb-3">{leftTitle}</h3>
        {leftConfig.length > 0 ? (
          <table className="w-full text-xs">
            <tbody>
              {leftConfig.map(([label, value]) => (
                <tr key={label}>
                  <td className="py-1.5 pr-4 text-[#64748B] whitespace-nowrap">
                    {label}
                  </td>
                  <td className="py-1.5 text-[#E2E8F0] font-mono">
                    {value ?? "—"}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        ) : (
          <p className="text-xs text-[#64748B]">No data available</p>
        )}
      </div>

      {gate ? (
        <SpvGateCard gate={gate} />
      ) : (
        <div className="rounded-lg border border-[#1E3A5F] bg-[#0A1628] p-4 flex items-center justify-center">
          <p className="text-xs text-[#64748B]">
            No SPV evaluation found for this agent
          </p>
        </div>
      )}
    </div>
  )
}

function spvGateFn(run: any) {
  const eval_ = run?.spv_evaluations?.[0]
  if (!eval_) return null
  const dims = [
    eval_.score_dim1,
    eval_.score_dim2,
    eval_.score_dim3,
    eval_.score_dim4,
    eval_.score_dim5,
  ]
  const total = dims.reduce((a: number, b: number) => a + (b || 0), 0)
  return { dims, total, verdict: eval_.verdict, reviewer: eval_.reviewer_name }
}

function SpvGateCard({ gate }: { gate: { dims: number[]; total: number; verdict: string; reviewer: string } }) {
  const pct = Math.round((gate.total / 50) * 100)
  return (
    <div className="rounded-lg border border-[#7c3aed] bg-[#2E1065] p-4">
      <h3 className="text-sm font-semibold text-white mb-4">SPV Gate</h3>

      <div className="grid grid-cols-5 gap-2 mb-4">
        {gate.dims.map((score, i) => (
          <div
            key={i}
            className="rounded border border-[#7c3aed] bg-[#1E3A5F]/40 p-2 text-center"
          >
            <div className="text-lg font-bold text-[#00D4D4]">
              {score ?? 0}
            </div>
            <div className="text-[10px] text-[#64748B] mt-0.5">/10</div>
            <div className="text-[9px] text-[#94A3B8] mt-1 leading-tight">
              {dimLabels[i]}
            </div>
          </div>
        ))}
      </div>

      <div className="flex items-center justify-between text-xs mb-2">
        <span className="text-[#94A3B8]">Total Score</span>
        <span className="text-white font-bold font-mono">
          {gate.total} / 50
        </span>
      </div>

      <div className="h-2 rounded-full bg-[#1E3A5F] overflow-hidden mb-4">
        <div
          className="h-full rounded-full bg-gradient-to-r from-[#7c3aed] to-[#00D4D4] transition-all"
          style={{ width: `${pct}%` }}
        />
      </div>

      <div className="flex items-center justify-between text-xs">
        <div>
          <span className="text-[#64748B]">Verdict: </span>
          <span
            className={`font-medium ${
              gate.verdict === "APPROVED"
                ? "text-[#10B981]"
                : gate.verdict === "REJECTED"
                  ? "text-[#F87171]"
                  : "text-[#F59E0B]"
            }`}
          >
            {gate.verdict || "—"}
          </span>
        </div>
        <span className="text-[#64748B]">
          Reviewer:{" "}
          <span className="text-[#E2E8F0]">{gate.reviewer || "—"}</span>
        </span>
      </div>
    </div>
  )
}

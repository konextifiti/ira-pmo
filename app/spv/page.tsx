"use client"

import { useEffect, useState } from "react"
import { supabase } from "@/lib/supabase"
import { CheckCircle2, AlertTriangle, XCircle, Clock } from "lucide-react"

interface Eval {
  id: number
  auto_recommendation: string
  total_score: number
  score_input_quality: number
  score_process_logic: number
  score_output_completeness: number
  score_standard_compliance: number
  score_risk_flags: number
  created_at: string
  agent_runs: {
    id: number
    msg_id: string
    ai_output: any
    project_agents: { agent_types: { code: string } }
    project_sites: { site_code: string; name: string }
  }
}

const dims = [
  { key: "score_input_quality", label: "Input Quality" },
  { key: "score_process_logic", label: "Process Logic" },
  { key: "score_output_completeness", label: "Output Compl." },
  { key: "score_standard_compliance", label: "Std Compliance" },
  { key: "score_risk_flags", label: "Risk Flags" },
]

export default function SpvPage() {
  const [items, setItems] = useState<Eval[]>([])
  const [selected, setSelected] = useState<number | null>(null)

  useEffect(() => {
    supabase
      .from("spv_evaluations")
      .select(
        `id, auto_recommendation, total_score, score_input_quality, score_process_logic, score_output_completeness, score_standard_compliance, score_risk_flags, created_at,
         agent_runs(id, msg_id, ai_output, project_agents(agent_types(code)), project_sites(site_code, name))`
      )
      .order("created_at", { ascending: false })
      .limit(50)
      .then(({ data }) => {
        if (data) {
          setItems(data as any)
          if (data.length > 0) setSelected(data[0].id)
        }
      })
  }, [])

  const current = items.find((e) => e.id === selected)

  const scorePct = (e: Eval) =>
    e.total_score != null ? Math.round((e.total_score / 50) * 100) : 0

  const dimScore = (e: Eval, key: string) => (e as any)[key] ?? 0

  const dimColor = (v: number) =>
    v >= 8 ? "text-[#10B981]" : v >= 6 ? "text-[#F59E0B]" : "text-[#F87171]"

  const dimBg = (v: number) =>
    v >= 8 ? "bg-[#064E3B]" : v >= 6 ? "bg-[#451A03]" : "bg-[#450A0A]"

  return (
    <div className="flex flex-col lg:flex-row h-full">
      {/* Left panel */}
      <div className="w-full lg:w-[280px] shrink-0 border-r border-[#1E3A5F] overflow-y-auto bg-[#0A1628]">
        <div className="p-3 border-b border-[#1E3A5F]">
          <h2 className="text-sm font-semibold text-white">SPV Queue</h2>
          <p className="text-xs text-[#64748B] mt-0.5">
            {items.length} evaluations
          </p>
        </div>
        {items.map((e) => {
          const pct = scorePct(e)
          const run = e.agent_runs
          const code = run?.project_agents?.agent_types?.code || "??"
          const siteCode = run?.project_sites?.site_code || "—"
          const isSelected = selected === e.id
          return (
            <button
              key={e.id}
              onClick={() => setSelected(e.id)}
              className={`w-full text-left p-3 border-b border-[#1E3A5F]/50 transition-colors ${
                isSelected
                  ? "border-l-2 border-[#7c3aed] bg-[#1E3A5F]/40"
                  : "hover:bg-[#1E3A5F]/20"
              }`}
            >
              <div className="flex items-center gap-2 mb-1">
                <span className="h-5 rounded px-1.5 bg-[#7c3aed] text-[10px] font-bold text-white flex items-center">
                  {code}
                </span>
                <span className="font-mono text-xs text-[#00D4D4] truncate">
                  {siteCode}
                </span>
              </div>
              <div className="flex items-center justify-between">
                <span
                  className={`text-xs font-medium ${
                    pct >= 80 ? "text-[#10B981]" : "text-[#F59E0B]"
                  }`}
                >
                  {pct}%
                </span>
                {e.auto_recommendation === "AUTO_APPROVE" ? (
                  <span className="text-[10px] text-[#10B981] flex items-center gap-0.5">
                    <CheckCircle2 className="w-3 h-3" /> AUTO
                  </span>
                ) : e.auto_recommendation === "AUTO_REVIEW" ? (
                  <span className="text-[10px] text-[#F59E0B] flex items-center gap-0.5">
                    <AlertTriangle className="w-3 h-3" /> REVIEW
                  </span>
                ) : (
                  <span className="text-[10px] text-[#64748B] flex items-center gap-0.5">
                    <Clock className="w-3 h-3" /> Pending
                  </span>
                )}
              </div>
            </button>
          )
        })}
      </div>

      {/* Right panel */}
      <div className="flex-1 overflow-y-auto p-6">
        {current ? (
          <div className="space-y-6 max-w-3xl">
            {/* Header */}
            <div className="flex items-center gap-3 flex-wrap">
              <span className="h-6 rounded px-2 bg-[#7c3aed] text-xs font-bold text-white flex items-center">
                {current.agent_runs?.project_agents?.agent_types?.code || "??"}
              </span>
              <span className="font-mono text-base font-bold text-[#00D4D4]">
                {current.agent_runs?.project_sites?.site_code || "—"}
              </span>
              <span className="text-xs text-[#64748B] font-mono">
                {current.agent_runs?.msg_id || "—"}
              </span>
              <span className="text-xs text-[#64748B]">
                {current.created_at
                  ? new Date(current.created_at).toLocaleString()
                  : "—"}
              </span>
            </div>

            {/* Score Card */}
            <div className="rounded-lg border border-[#7c3aed] bg-[#2E1065] p-5">
              <h3 className="text-sm font-semibold text-white mb-4">
                Evaluation Scores
              </h3>
              <div className="grid grid-cols-5 gap-3 mb-4">
                {dims.map((d) => {
                  const v = dimScore(current, d.key)
                  return (
                    <div
                      key={d.key}
                      className={`rounded border border-[#7c3aed] p-3 text-center ${dimBg(v)}`}
                    >
                      <div
                        className={`text-xl font-bold ${dimColor(v)}`}
                      >
                        {v}
                      </div>
                      <div className="text-[10px] text-[#94A3B8]">/10</div>
                      <div className="text-[9px] text-[#64748B] mt-1 leading-tight">
                        {d.label}
                      </div>
                    </div>
                  )
                })}
              </div>

              {/* Total */}
              <div className="flex items-center justify-between text-sm mb-2">
                <span className="text-[#94A3B8]">Total Score</span>
                <span className="text-white font-bold font-mono text-lg">
                  {current.total_score ?? 0} / 50
                </span>
              </div>

              {/* Progress */}
              <div className="h-2.5 rounded-full bg-[#1E3A5F] overflow-hidden">
                <div
                  className="h-full rounded-full bg-gradient-to-r from-[#7c3aed] to-[#00D4D4] transition-all"
                  style={{ width: `${scorePct(current)}%` }}
                />
              </div>
              <div className="text-right text-xs text-[#64748B] mt-1">
                {scorePct(current)}%
              </div>
            </div>

            {/* AI Output */}
            <div className="rounded-lg border border-[#1E3A5F] bg-[#0A1628] p-4">
              <h3 className="text-sm font-semibold text-white mb-3">
                AI Output
              </h3>
              {current.agent_runs?.ai_output ? (
                <pre className="text-xs text-[#94A3B8] font-mono whitespace-pre-wrap overflow-x-auto max-h-96">
                  {typeof current.agent_runs.ai_output === "object"
                    ? JSON.stringify(current.agent_runs.ai_output, null, 2)
                    : String(current.agent_runs.ai_output)}
                </pre>
              ) : (
                <p className="text-xs text-[#64748B]">No AI output available</p>
              )}
            </div>

            {/* Actions */}
            <div className="space-y-3">
              <div className="flex gap-3">
                <button
                  type="button"
                  className="flex-1 h-10 rounded-md bg-[#10B981] text-sm font-semibold text-white hover:bg-[#059669] transition-colors flex items-center justify-center gap-2"
                >
                  <CheckCircle2 className="w-4 h-4" /> APPROVE
                </button>
                <button
                  type="button"
                  className="flex-1 h-10 rounded-md bg-[#F59E0B] text-sm font-semibold text-white hover:bg-[#D97706] transition-colors flex items-center justify-center gap-2"
                >
                  <AlertTriangle className="w-4 h-4" /> REVISE
                </button>
                <button
                  type="button"
                  className="flex-1 h-10 rounded-md bg-[#F87171] text-sm font-semibold text-white hover:bg-[#EF4444] transition-colors flex items-center justify-center gap-2"
                >
                  <XCircle className="w-4 h-4" /> REJECT
                </button>
              </div>
              <textarea
                placeholder="Revision notes..."
                rows={3}
                className="w-full rounded-md border border-[#1E3A5F] bg-[#0A1628] p-3 text-sm text-white placeholder:text-[#64748B] outline-none focus:border-[#7c3aed] resize-none"
              />
            </div>
          </div>
        ) : (
          <div className="flex items-center justify-center h-full">
            <p className="text-sm text-[#64748B]">No evaluations found</p>
          </div>
        )}
      </div>
    </div>
  )
}

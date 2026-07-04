"use client"

import { useEffect, useState } from "react"
import { useParams } from "next/navigation"
import Link from "next/link"
import { supabase } from "@/lib/supabase"
import { usePermissions } from "@/lib/permissions/usePermissions"
import {
  ArrowLeft,
  CheckCircle2,
  AlertTriangle,
  XCircle,
  Clock,
  ExternalLink,
  ShieldCheck,
} from "lucide-react"

interface EvalDetail {
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
    status: string
    created_at: string
    ai_output: any
    project_agents: {
      agent_types: { code: string; name: string }
    }
    project_sites: {
      site_code: string
      name: string
    }
    spv_verdicts: {
      id: number
      verdict: string
      revision_notes: string
      notes: string
      created_at: string
    }[]
    verify_evidence: {
      id: number
      file_url: string
      file_type: string
      notes: string
      created_at: string
    }[]
  }
}

const dims = [
  { key: "score_input_quality", label: "Input Quality", desc: "Quality of input data provided to the agent" },
  { key: "score_process_logic", label: "Process Logic", desc: "Correctness of the agent's reasoning process" },
  { key: "score_output_completeness", label: "Output Compl.", desc: "Completeness of the generated output" },
  { key: "score_standard_compliance", label: "Std Compliance", desc: "Adherence to defined standards" },
  { key: "score_risk_flags", label: "Risk Flags", desc: "Detection of potential risks and anomalies" },
]

function dimColor(v: number) {
  return v >= 8 ? "text-[#10B981]" : v >= 6 ? "text-[#F59E0B]" : "text-[#F87171]"
}

function dimBg(v: number) {
  return v >= 8 ? "bg-[#064E3B]" : v >= 6 ? "bg-[#451A03]" : "bg-[#450A0A]"
}

function barColor(v: number) {
  return v >= 8 ? "bg-[#10B981]" : v >= 6 ? "bg-[#F59E0B]" : "bg-[#F87171]"
}

function Skeleton({ className = "" }: { className?: string }) {
  return (
    <div
      className={`animate-pulse rounded bg-[#1E3A5F] ${className}`}
    />
  )
}

export default function SpvDetailPage() {
  const { id } = useParams<{ id: string }>()
  const { loading: permLoading, canAccess } = usePermissions()
  const [data, setData] = useState<EvalDetail | null>(null)
  const [fetching, setFetching] = useState(true)
  const [error, setError] = useState<string | null>(null)

  useEffect(() => {
    if (permLoading) return
    if (!canAccess("spv_queue")) {
      setError("You do not have access to the SPV Queue module.")
      setFetching(false)
      return
    }

    supabase
      .from("spv_evaluations")
      .select(
        `id, auto_recommendation, total_score, score_input_quality, score_process_logic, score_output_completeness, score_standard_compliance, score_risk_flags, created_at,
         agent_runs(
           id, msg_id, status, created_at, ai_output,
           project_agents(agent_types(code, name)),
           project_sites(site_code, name),
           spv_verdicts(id, verdict, revision_notes, notes, created_at),
           verify_evidence(id, file_url, file_type, notes, created_at)
         )`
      )
      .eq("id", id)
      .single()
      .then(({ data: record, error: err }) => {
        if (err) {
          setError(err.message === "No rows found" ? "Evaluation not found" : err.message)
        } else {
          setData(record as any)
        }
        setFetching(false)
      })
  }, [id, permLoading, canAccess])

  const isLoading = permLoading || fetching
  const eval_ = data
  const run = eval_?.agent_runs
  const agentType = run?.project_agents?.agent_types
  const site = run?.project_sites
  const verdicts = run?.spv_verdicts || []
  const evidence = run?.verify_evidence || []
  const latestVerdict = verdicts[verdicts.length - 1]
  const scorePct = eval_?.total_score != null ? Math.round((eval_.total_score / 50) * 100) : 0

  if (isLoading) {
    return (
      <div className="p-6 space-y-5 max-w-3xl">
        <Skeleton className="h-5 w-32" />
        <Skeleton className="h-24 w-full" />
        <Skeleton className="h-40 w-full" />
        <Skeleton className="h-20 w-full" />
        <Skeleton className="h-32 w-full" />
      </div>
    )
  }

  if (error || !eval_) {
    return (
      <div className="p-6">
        <div className="rounded-lg border border-[#1E3A5F] bg-[#0A1628] p-6 text-center">
          <h2 className="text-sm font-semibold text-white mb-2">
            {error || "Evaluation not found"}
          </h2>
          <Link
            href="/spv"
            className="inline-flex items-center gap-1.5 text-xs text-[#00D4D4] hover:underline mt-2"
          >
            <ArrowLeft className="w-3.5 h-3.5" /> Back to SPV Queue
          </Link>
        </div>
      </div>
    )
  }

  return (
    <div className="p-6 space-y-6 max-w-3xl">
      {/* Back */}
      <Link
        href="/spv"
        className="inline-flex items-center gap-1.5 text-xs text-[#64748B] hover:text-[#00D4D4] transition-colors"
      >
        <ArrowLeft className="w-3.5 h-3.5" /> Back to SPV Queue
      </Link>

      {/* Eval Info */}
      <div className="rounded-lg border border-[#1E3A5F] bg-[#0A1628] p-5">
        <div className="flex items-center justify-between mb-4">
          <div className="flex items-center gap-3">
            <ShieldCheck className="w-5 h-5 text-[#7c3aed]" />
            <h1 className="text-base font-semibold text-white">
              Evaluation <span className="font-mono text-[#00D4D4]">#{eval_.id}</span>
            </h1>
          </div>
          <span
            className={`inline-flex h-6 items-center rounded px-2 text-[10px] font-bold ${
              eval_.auto_recommendation === "AUTO_APPROVE"
                ? "bg-[#064E3B] text-[#10B981]"
                : eval_.auto_recommendation === "AUTO_REVIEW"
                  ? "bg-[#451A03] text-[#F59E0B]"
                  : "bg-[#1E3A5F] text-[#64748B]"
            }`}
          >
            {eval_.auto_recommendation || "PENDING"}
          </span>
        </div>
        <div className="grid grid-cols-2 gap-4 text-xs">
          <div>
            <span className="text-[#64748B]">Created</span>
            <p className="text-[#E2E8F0] font-mono mt-0.5">
              {eval_.created_at ? new Date(eval_.created_at).toLocaleString() : "—"}
            </p>
          </div>
          <div>
            <span className="text-[#64748B]">Total Score</span>
            <p className="text-white font-bold font-mono text-lg mt-0.5">
              {eval_.total_score ?? 0} <span className="text-[#64748B] text-xs font-normal">/ 50</span>
            </p>
          </div>
        </div>
      </div>

      {/* Score Breakdown */}
      <div className="rounded-lg border border-[#7c3aed] bg-[#2E1065] p-5">
        <h2 className="text-sm font-semibold text-white mb-4">Score Breakdown</h2>
        <div className="space-y-3 mb-4">
          {dims.map((d) => {
            const v = (eval_ as any)[d.key] ?? 0
            const pct = Math.round((v / 10) * 100)
            return (
              <div key={d.key}>
                <div className="flex items-center justify-between text-xs mb-1">
                  <span className="text-[#94A3B8]">{d.label}</span>
                  <span className={`font-mono font-bold ${dimColor(v)}`}>
                    {v} / 10
                  </span>
                </div>
                <div className="h-2 rounded-full bg-[#1E3A5F] overflow-hidden">
                  <div
                    className={`h-full rounded-full ${barColor(v)} transition-all`}
                    style={{ width: `${pct}%` }}
                  />
                </div>
              </div>
            )
          })}
        </div>
        <div className="border-t border-[#7c3aed]/40 pt-3">
          <div className="flex items-center justify-between text-sm mb-2">
            <span className="text-[#94A3B8]">Total Score</span>
            <span className="text-white font-bold font-mono text-lg">
              {eval_.total_score ?? 0} / 50
            </span>
          </div>
          <div className="h-2.5 rounded-full bg-[#1E3A5F] overflow-hidden">
            <div
              className="h-full rounded-full bg-gradient-to-r from-[#7c3aed] to-[#00D4D4] transition-all"
              style={{ width: `${scorePct}%` }}
            />
          </div>
          <div className="text-right text-xs text-[#64748B] mt-1">{scorePct}%</div>
        </div>
      </div>

      {/* Verdict */}
      {latestVerdict ? (
        <div className="rounded-lg border border-[#1E3A5F] bg-[#0A1628] p-5">
          <h2 className="text-sm font-semibold text-white mb-4">Verdict</h2>
          <div className="flex items-center gap-3 mb-3">
            <span
              className={`inline-flex h-7 items-center rounded px-2.5 text-xs font-bold ${
                latestVerdict.verdict === "APPROVED"
                  ? "bg-[#064E3B] text-[#10B981]"
                  : latestVerdict.verdict === "REJECTED"
                    ? "bg-[#450A0A] text-[#F87171]"
                    : "bg-[#451A03] text-[#F59E0B]"
              }`}
            >
              {latestVerdict.verdict === "APPROVED" ? (
                <CheckCircle2 className="w-3.5 h-3.5 mr-1" />
              ) : latestVerdict.verdict === "REJECTED" ? (
                <XCircle className="w-3.5 h-3.5 mr-1" />
              ) : (
                <AlertTriangle className="w-3.5 h-3.5 mr-1" />
              )}
              {latestVerdict.verdict || "PENDING"}
            </span>
            {latestVerdict.created_at && (
              <span className="text-xs text-[#64748B] font-mono">
                {new Date(latestVerdict.created_at).toLocaleString()}
              </span>
            )}
          </div>
          {(latestVerdict.notes || latestVerdict.revision_notes) && (
            <div className="rounded bg-[#1E3A5F]/40 p-3 text-xs text-[#94A3B8] leading-relaxed">
              {latestVerdict.notes || latestVerdict.revision_notes}
            </div>
          )}
        </div>
      ) : (
        <div className="rounded-lg border border-[#1E3A5F] bg-[#0A1628] p-5">
          <h2 className="text-sm font-semibold text-white mb-2">Verdict</h2>
          <p className="text-xs text-[#64748B]">No verdict has been recorded yet.</p>
        </div>
      )}

      {/* Agent Run Context */}
      <div className="rounded-lg border border-[#1E3A5F] bg-[#0A1628] p-5">
        <h2 className="text-sm font-semibold text-white mb-4">Agent Run Context</h2>
        <div className="grid grid-cols-2 gap-4 text-xs">
          <div>
            <span className="text-[#64748B]">Agent</span>
            <div className="flex items-center gap-2 mt-1">
              <span className="h-5 rounded px-1.5 bg-[#7c3aed] text-[10px] font-bold text-white flex items-center">
                {agentType?.code || "??"}
              </span>
              <span className="text-[#E2E8F0]">{agentType?.name || "—"}</span>
            </div>
          </div>
          <div>
            <span className="text-[#64748B]">Site</span>
            <Link
              href={`/sites/${site?.site_code || ""}`}
              className="flex items-center gap-1.5 mt-1 text-[#00D4D4] hover:underline group"
            >
              <span className="font-mono text-xs font-bold">
                {site?.site_code || "—"}
              </span>
              {site?.name && (
                <span className="text-[#94A3B8]">· {site.name}</span>
              )}
              <ExternalLink className="w-3 h-3 text-[#64748B] group-hover:text-[#00D4D4]" />
            </Link>
          </div>
          <div>
            <span className="text-[#64748B]">Run ID</span>
            <p className="text-[#E2E8F0] font-mono mt-0.5">{run?.msg_id || "—"}</p>
          </div>
          <div>
            <span className="text-[#64748B]">Run Date</span>
            <p className="text-[#E2E8F0] font-mono mt-0.5">
              {run?.created_at ? new Date(run.created_at).toLocaleString() : "—"}
            </p>
          </div>
          {run?.status && (
            <div>
              <span className="text-[#64748B]">Status</span>
              <p className="text-[#E2E8F0] font-mono mt-0.5 capitalize">{run.status}</p>
            </div>
          )}
        </div>
        {run?.ai_output != null && (
          <details className="mt-4">
            <summary className="text-xs text-[#64748B] cursor-pointer hover:text-[#94A3B8] transition-colors">
              AI Output
            </summary>
            <pre className="mt-2 text-xs text-[#94A3B8] font-mono whitespace-pre-wrap overflow-x-auto max-h-96 rounded bg-[#1E3A5F]/40 p-3">
              {typeof run.ai_output === "object"
                ? JSON.stringify(run.ai_output, null, 2)
                : String(run.ai_output)}
            </pre>
          </details>
        )}
      </div>

      {/* Evidence */}
      {evidence.length > 0 ? (
        <div className="rounded-lg border border-[#1E3A5F] bg-[#0A1628] p-5">
          <h2 className="text-sm font-semibold text-white mb-4">
            Evidence ({evidence.length})
          </h2>
          <div className="space-y-2">
            {evidence.map((ev) => (
              <div
                key={ev.id}
                className="flex items-center justify-between rounded bg-[#1E3A5F]/40 p-3 text-xs"
              >
                <div className="flex items-center gap-2 min-w-0">
                  <span className="h-5 rounded px-1.5 bg-[#00D4D4]/20 text-[10px] font-bold text-[#00D4D4] flex items-center shrink-0">
                    {ev.file_type || "FILE"}
                  </span>
                  <span className="text-[#94A3B8] truncate">
                    {ev.notes || ev.file_url || "—"}
                  </span>
                </div>
                {ev.file_url && (
                  <a
                    href={ev.file_url}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="text-[#00D4D4] hover:underline shrink-0 ml-2"
                  >
                    View
                  </a>
                )}
              </div>
            ))}
          </div>
        </div>
      ) : null}

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
  )
}

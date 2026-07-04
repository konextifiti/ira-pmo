"use client"

import { useEffect, useState } from "react"
import Link from "next/link"
import { supabase } from "@/lib/supabase"
import { CheckCircle2, AlertTriangle, Clock, ChevronRight } from "lucide-react"

interface Eval {
  id: number
  auto_recommendation: string
  total_score: number
  created_at: string
  agent_runs: {
    id: number
    msg_id: string
    project_agents: { agent_types: { code: string } }
    project_sites: { site_code: string; name: string }
  }
}

export default function SpvPage() {
  const [items, setItems] = useState<Eval[]>([])

  useEffect(() => {
    supabase
      .from("spv_evaluations")
      .select(
        `id, auto_recommendation, total_score, created_at,
         agent_runs(id, msg_id, project_agents(agent_types(code)), project_sites(site_code, name))`
      )
      .order("created_at", { ascending: false })
      .limit(50)
      .then(({ data }) => {
        if (data) setItems(data as any)
      })
  }, [])

  const scorePct = (e: Eval) =>
    e.total_score != null ? Math.round((e.total_score / 50) * 100) : 0

  return (
    <div className="p-4">
      <div className="mb-4 flex items-center justify-between">
        <div>
          <h2 className="text-sm font-semibold text-white">SPV Queue</h2>
          <p className="text-xs text-[#64748B] mt-0.5">
            {items.length} evaluation{items.length !== 1 ? "s" : ""}
          </p>
        </div>
      </div>

      {items.length === 0 ? (
        <div className="flex items-center justify-center h-48">
          <p className="text-sm text-[#64748B]">No evaluations found</p>
        </div>
      ) : (
        <div className="space-y-1">
          {items.map((e) => {
            const pct = scorePct(e)
            const run = e.agent_runs
            const code = run?.project_agents?.agent_types?.code || "??"
            const siteCode = run?.project_sites?.site_code || "—"
            return (
              <Link
                key={e.id}
                href={`/spv/${e.id}`}
                className="flex items-center gap-3 p-3 rounded-lg border border-transparent hover:border-[#1E3A5F] hover:bg-[#1E3A5F]/20 transition-all group cursor-pointer"
              >
                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-2 mb-1">
                    <span className="h-5 rounded px-1.5 bg-[#7c3aed] text-[10px] font-bold text-white flex items-center">
                      {code}
                    </span>
                    <span className="font-mono text-xs text-[#00D4D4] truncate">
                      {siteCode}
                    </span>
                    <span className="text-[10px] text-[#64748B] font-mono truncate hidden sm:inline">
                      #{e.id}
                    </span>
                  </div>
                  <div className="flex items-center gap-3">
                    <span
                      className={`text-xs font-medium ${
                        pct >= 80 ? "text-[#10B981]" : "text-[#F59E0B]"
                      }`}
                    >
                      {pct}%
                    </span>
                    <div className="h-1.5 w-24 rounded-full bg-[#1E3A5F] overflow-hidden">
                      <div
                        className={`h-full rounded-full ${
                          pct >= 80
                            ? "bg-[#10B981]"
                            : pct >= 60
                              ? "bg-[#F59E0B]"
                              : "bg-[#F87171]"
                        }`}
                        style={{ width: `${pct}%` }}
                      />
                    </div>
                  </div>
                </div>
                <div className="flex items-center gap-2 shrink-0">
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
                      <Clock className="w-3 h-3" />
                    </span>
                  )}
                  <ChevronRight className="w-4 h-4 text-[#64748B] group-hover:text-[#00D4D4] transition-colors" />
                </div>
              </Link>
            )
          })}
        </div>
      )}
    </div>
  )
}

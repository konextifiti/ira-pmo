"use client"

import { createContext, useEffect, useState, type ReactNode } from "react"
import { createSupabaseBrowserClient } from "@/lib/supabase/client"
import type { PermissionJson } from "./moduleRegistry"

export interface UserPermission {
  userId: string
  email: string
  name: string
  userGroupId: string
  groupName: string
  permissions: PermissionJson
  ownedSiteIds: number[]
}

interface PermissionsContextValue {
  user: UserPermission | null
  loading: boolean
}

const PermissionsContext = createContext<PermissionsContextValue>({
  user: null,
  loading: true,
})

function PermissionsProvider({ children }: { children: ReactNode }) {
  const [value, setValue] = useState<PermissionsContextValue>({
    user: null,
    loading: true,
  })

  useEffect(() => {
    const supabase = createSupabaseBrowserClient()

    async function resolveUser() {
      const {
        data: { user },
      } = await supabase.auth.getUser()

      if (!user?.email) {
        setValue({ user: null, loading: false })
        return
      }

      const { data: userData } = await supabase
        .from("users")
        .select(`id, name, email, user_group_id, user_groups!inner(name, permissions)`)
        .eq("email", user.email)
        .single()

      if (!userData) {
        setValue({ user: null, loading: false })
        return
      }

      const record = userData as Record<string, unknown>
      const groups = record.user_groups
      if (!groups) {
        setValue({ user: null, loading: false })
        return
      }

      const group = (Array.isArray(groups)
        ? groups[0]
        : groups) as { name: string; permissions: PermissionJson }

      // resolve owned site ids via project_agents → agent_runs
      let ownedSiteIds: number[] = []
      const { data: projectAgents } = await supabase
        .from("project_agents")
        .select("id")
        .eq("pic_user_id", record.id)

      if (projectAgents && projectAgents.length > 0) {
        const agentIds = projectAgents.map((pa: { id: number }) => pa.id)
        const { data: agentRuns } = await supabase
          .from("agent_runs")
          .select("site_id")
          .in("project_agent_id", agentIds)

        if (agentRuns) {
          ownedSiteIds = [...new Set(agentRuns.map((ar: { site_id: number }) => ar.site_id))]
        }
      }

      setValue({
        user: {
          userId: String(record.id),
          email: String(record.email ?? ""),
          name: String(record.name ?? ""),
          userGroupId: String(record.user_group_id ?? ""),
          groupName: group.name,
          permissions: group.permissions,
          ownedSiteIds,
        },
        loading: false,
      })
    }

    resolveUser()

    const {
      data: { subscription },
    } = supabase.auth.onAuthStateChange((event) => {
      if (event === "SIGNED_IN" || event === "SIGNED_OUT") {
        setValue({ user: null, loading: true })
        resolveUser()
      }
    })

    return () => {
      subscription.unsubscribe()
    }
  }, [])

  return (
    <PermissionsContext.Provider value={value}>
      {children}
    </PermissionsContext.Provider>
  )
}

export { PermissionsContext, PermissionsProvider }

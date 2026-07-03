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

    supabase.auth.getUser().then(({ data: { user } }) => {
      if (!user?.email) {
        setValue({ user: null, loading: false })
        return
      }

      supabase
        .from("users")
        .select(`id, name, email, user_group_id, user_groups!inner(name, permissions)`)
        .eq("email", user.email)
        .single()
        .then(({ data }) => {
          if (!data) {
            setValue({ user: null, loading: false })
            return
          }

          const record = data as Record<string, unknown>
          const groups = record.user_groups
          if (!groups) {
            setValue({ user: null, loading: false })
            return
          }

          const group = (Array.isArray(groups)
            ? groups[0]
            : groups) as { name: string; permissions: PermissionJson }

          setValue({
            user: {
              userId: String(record.id),
              email: String(record.email ?? ""),
              name: String(record.name ?? ""),
              userGroupId: String(record.user_group_id ?? ""),
              groupName: group.name,
              permissions: group.permissions,
            },
            loading: false,
          })
        })
    })
  }, [])

  return (
    <PermissionsContext.Provider value={value}>
      {children}
    </PermissionsContext.Provider>
  )
}

export { PermissionsContext, PermissionsProvider }

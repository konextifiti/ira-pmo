"use client"

import { useContext, useMemo } from "react"
import { PermissionsContext, type UserPermission } from "./context"
import { MODULE_MAP, type ModuleVisibility, type PermissionJson } from "./moduleRegistry"

interface UsePermissionsReturn {
  user: UserPermission | null
  loading: boolean
  canAccess: (moduleKey: string) => boolean
  getVisibility: (moduleKey: string) => ModuleVisibility
  canAccessRoute: (route: string) => boolean
  domains: string[]
  isTier: (tier: string) => boolean
  permissions: PermissionJson | null
}

function usePermissions(): UsePermissionsReturn {
  const { user, loading } = useContext(PermissionsContext)

  return useMemo(() => {
    const perms = user?.permissions ?? null

    return {
      user,
      loading,
      canAccess: (moduleKey: string) =>
        perms?.modules[moduleKey]?.access === true,
      getVisibility: (moduleKey: string): ModuleVisibility =>
        perms?.modules[moduleKey]?.visibility ?? "all",
      canAccessRoute: (route: string) => {
        if (!perms) return true
        for (const [key, config] of Object.entries(perms.modules)) {
          const meta = MODULE_MAP.get(key)
          if (meta && route.startsWith(meta.route)) {
            return config.access === true
          }
        }
        return true
      },
      domains: perms?.domains ?? [],
      isTier: (tier: string) => perms?.tier === tier,
      permissions: perms,
    }
  }, [user, loading])
}

export { usePermissions }

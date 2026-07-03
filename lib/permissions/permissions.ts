import { createSupabaseServerClient } from "@/lib/supabase/server"
import { MODULE_MAP } from "./moduleRegistry"
import type { ModuleConfig, ModuleVisibility, PermissionJson } from "./moduleRegistry"

export interface UserPermission {
  userId: string
  email: string
  name: string
  userGroupId: string
  groupName: string
  permissions: PermissionJson
}

async function getUserPermissions(): Promise<UserPermission | null> {
  const supabase = await createSupabaseServerClient()
  const {
    data: { user },
  } = await supabase.auth.getUser()

  if (!user) return null

  const { data: userData } = await supabase
    .from("users")
    .select(`id, name, email, user_group_id, user_groups!inner(name, permissions)`)
    .eq("id", user.id)
    .single()

  if (!userData) return null

  const record = userData as Record<string, unknown>
  const groups = record.user_groups
  if (!groups) return null

  const group = (Array.isArray(groups) ? groups[0] : groups) as { name: string; permissions: PermissionJson }
  const perms = group.permissions

  return {
    userId: String(record.id),
    email: String(record.email ?? ""),
    name: String(record.name ?? ""),
    userGroupId: String(record.user_group_id ?? ""),
    groupName: group.name,
    permissions: perms,
  }
}

function getModuleConfig(
  moduleKey: string,
  permissions: PermissionJson
): ModuleConfig | null {
  return permissions.modules[moduleKey] ?? null
}

function canAccessModule(moduleKey: string, permissions: PermissionJson): boolean {
  return getModuleConfig(moduleKey, permissions)?.access === true
}

function getModuleVisibility(
  moduleKey: string,
  permissions: PermissionJson
): ModuleVisibility {
  return getModuleConfig(moduleKey, permissions)?.visibility ?? "all"
}

function canAccessRoute(route: string, permissions: PermissionJson): boolean {
  for (const [key, config] of Object.entries(permissions.modules)) {
    const meta = MODULE_MAP.get(key)
    if (meta && route.startsWith(meta.route)) {
      return config.access === true
    }
  }
  return false
}

function getEffectiveDomains(permissions: PermissionJson): string[] {
  return permissions.domains
}

export {
  getUserPermissions,
  getModuleConfig,
  canAccessModule,
  getModuleVisibility,
  canAccessRoute,
  getEffectiveDomains,
}

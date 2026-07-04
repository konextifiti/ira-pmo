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

  if (!user?.email) return null

  const { data: userData } = await supabase
    .from("users")
    .select(`id, name, email, user_group_id, user_groups!inner(name, permissions)`)
    .eq("email", user.email)
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

async function getUserOwnedSiteIds(): Promise<number[]> {
  const supabase = await createSupabaseServerClient()
  const {
    data: { user },
  } = await supabase.auth.getUser()

  if (!user?.email) return []

  const { data: userData } = await supabase
    .from("users")
    .select("id")
    .eq("email", user.email)
    .single()

  if (!userData) return []

  const { data: projectAgents } = await supabase
    .from("project_agents")
    .select("id")
    .eq("pic_user_id", userData.id)

  if (!projectAgents || projectAgents.length === 0) return []

  const agentIds = projectAgents.map((pa) => pa.id)

  const { data: agentRuns } = await supabase
    .from("agent_runs")
    .select("site_id")
    .in("project_agent_id", agentIds)

  if (!agentRuns) return []

  return [...new Set(agentRuns.map((ar) => ar.site_id))]
}

export {
  getUserPermissions,
  getModuleConfig,
  canAccessModule,
  getModuleVisibility,
  canAccessRoute,
  getEffectiveDomains,
  getUserOwnedSiteIds,
}

type ModuleVisibility = "all" | "own_scope" | "domain_scope" | "summary_only"

interface ModuleConfig {
  access: boolean
  visibility?: ModuleVisibility
}

interface PermissionJson {
  tier: string
  domains: string[]
  modules: Record<string, ModuleConfig>
}

interface ModuleMeta {
  key: string
  label: string
  route: string
  domainTags: string[]
}

const MODULE_REGISTRY: ModuleMeta[] = [
  {
    key: "dashboard",
    label: "Dashboard",
    route: "/dashboard",
    domainTags: ["all"],
  },
  {
    key: "bts_tracker",
    label: "BTS Tracker",
    route: "/tracker",
    domainTags: ["design", "verify", "vendor", "integration"],
  },
  {
    key: "site_detail",
    label: "Site Detail",
    route: "/sites",
    domainTags: ["design", "verify", "vendor", "field", "integration"],
  },
  {
    key: "spv_queue",
    label: "SPV Queue",
    route: "/spv",
    domainTags: ["all"],
  },
  {
    key: "agent_monitor",
    label: "Agent Monitor",
    route: "/agents",
    domainTags: ["all"],
  },
  {
    key: "reports",
    label: "Reports",
    route: "/reports",
    domainTags: ["all"],
  },
  {
    key: "approval_queue",
    label: "Approval Queue",
    route: "/approvals",
    domainTags: ["all"],
  },
]

const MODULE_MAP = new Map<string, ModuleMeta>(
  MODULE_REGISTRY.map((m) => [m.key, m])
)

function findModuleByRoute(route: string): ModuleMeta | undefined {
  return MODULE_REGISTRY.find((m) => route.startsWith(m.route))
}

export type { ModuleConfig, ModuleVisibility, PermissionJson, ModuleMeta }
export { MODULE_REGISTRY, MODULE_MAP, findModuleByRoute }

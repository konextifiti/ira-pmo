import type { ModuleVisibility } from "./moduleRegistry"

function filterSitesByOwnedIds<T extends { id: number }>(
  sites: T[],
  ownedSiteIds: number[]
): T[] {
  if (ownedSiteIds.length === 0) return []
  const set = new Set(ownedSiteIds)
  return sites.filter((s) => set.has(s.id))
}

function shouldHideRawData(visibility: ModuleVisibility): boolean {
  return visibility === "summary_only"
}

function getDataVisibility(
  visibility: ModuleVisibility,
  moduleKey: string
): {
  showRawData: boolean
  showAggregateOnly: boolean
  domainFilter: boolean
} {
  return {
    showRawData: visibility === "all",
    showAggregateOnly: visibility === "summary_only",
    domainFilter: visibility === "own_scope" || visibility === "domain_scope",
  }
}

export { filterSitesByOwnedIds, shouldHideRawData, getDataVisibility }

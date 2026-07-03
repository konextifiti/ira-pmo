import type { ModuleVisibility } from "./moduleRegistry"

function domainMatch(siteRegion: string | undefined, userDomains: string[]): boolean {
  if (userDomains.length === 0) return false
  if (userDomains.includes("all")) return true
  const tag = (siteRegion ?? "").toLowerCase()
  return userDomains.some((d) => tag.includes(d) || d.includes(tag))
}

function filterSitesByDomain<T extends { region?: string }>(
  sites: T[],
  domains: string[]
): T[] {
  if (domains.includes("all")) return sites
  return sites.filter((s) => domainMatch(s.region, domains))
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

export { domainMatch, filterSitesByDomain, shouldHideRawData, getDataVisibility }

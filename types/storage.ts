export interface TrackerInfo {
  domain: string | null
}

export interface MauticData {
  author: string
  domain: string
  trackingInfo: TrackerInfo[]
  timestamp: number
}

export interface PageEntry {
  url: string
  title: string
  timestamp: number
}

export interface DomainPages {
  [domain: string]: PageEntry[]
}

export interface CurrentPageDomains {
  [url: string]: {
    domains: string[]
    timestamp: number
  }
}

export interface StorageStructure {
  mauticData: { [url: string]: MauticData }
  domainPages: DomainPages
  currentPageDomains: CurrentPageDomains
}

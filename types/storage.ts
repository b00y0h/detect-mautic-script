export interface TrackerInfo {
  domain: string | null
  statusCode?: number // Add status code information
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

export interface DomainStatus {
  url: string
  status: number
}

export interface CurrentPageDomains {
  [url: string]: {
    domains: DomainStatus[]
    timestamp: number
  }
}

export interface StorageStructure {
  mauticData: { [url: string]: MauticData }
  domainPages: DomainPages
  currentPageDomains: CurrentPageDomains
}

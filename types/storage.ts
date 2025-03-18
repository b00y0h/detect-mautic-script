export interface PageEntry {
  url: string
  timestamp: number
}

export interface DomainPages {
  [domain: string]: PageEntry[]
}

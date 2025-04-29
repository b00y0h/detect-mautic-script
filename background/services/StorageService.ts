import { Storage } from "@plasmohq/storage"

import type {
  CurrentPageDomains,
  DomainPages,
  DomainStatus,
  MauticData,
  PageEntry,
  StorageStructure
} from "~types/storage"

export class StorageService {
  private storage: Storage
  private static readonly STORAGE_KEYS = {
    mauticData: "mauticData",
    domainPages: "domainPages",
    currentPageDomains: "currentPageDomains",
    domain: "domain",
    author: "author"
  }

  constructor() {
    // console.debug("Initializing StorageService")
    this.storage = new Storage({
      area: "local"
    })
    // Initialize storage immediately
    this.initializeStorage()
  }

  public async initializeStorage() {
    // console.debug("Initializing storage keys...")
    // Initialize all storage keys at once
    const currentValues = await Promise.all([
      this.storage.get(StorageService.STORAGE_KEYS.mauticData),
      this.storage.get(StorageService.STORAGE_KEYS.domainPages),
      this.storage.get(StorageService.STORAGE_KEYS.currentPageDomains),
      this.storage.get(StorageService.STORAGE_KEYS.domain),
      this.storage.get(StorageService.STORAGE_KEYS.author)
    ])
    // console.debug("Current storage values:", currentValues)

    try {
      // Set default values for any undefined keys
      if (!currentValues[0]) {
        await this.storage.set(StorageService.STORAGE_KEYS.mauticData, {})
        // console.debug("Initialized mauticData")
      }
      if (!currentValues[1]) {
        await this.storage.set(StorageService.STORAGE_KEYS.domainPages, {})
        // console.debug("Initialized domainPages")
      }
      if (!currentValues[2]) {
        await this.storage.set(
          StorageService.STORAGE_KEYS.currentPageDomains,
          {}
        )
        // console.debug("Initialized currentPageDomains")
      }
      if (currentValues[3] === undefined) {
        await this.storage.set(StorageService.STORAGE_KEYS.domain, "")
        // console.debug("Initialized domain")
      }
      if (currentValues[4] === undefined) {
        await this.storage.set(StorageService.STORAGE_KEYS.author, "")
        // console.debug("Initialized author")
      }
    } catch (error) {
      // console.error("Error initializing storage:", error)
    }
  }

  private normalizeUrl(url: string): string {
    try {
      const urlObj = new URL(url)
      return urlObj.origin + urlObj.pathname.replace(/\/+$/, "") + urlObj.search
    } catch (e) {
      // console.error("Error normalizing URL:", e)
      return url
    }
  }

  async clearStorage() {
    // console.debug("Clearing storage")
    try {
      await this.storage.clear()
      await this.initializeStorage()
      // console.debug("Storage cleared and reinitialized")
    } catch (error) {
      // console.error("Error clearing storage:", error)
    }
  }

  async saveMauticData(url: string, data: Omit<MauticData, "timestamp">) {
    // console.debug("Saving Mautic data for URL:", url, data)
    const normalizedUrl = this.normalizeUrl(url)
    try {
      const mauticData =
        (await this.storage.get(StorageService.STORAGE_KEYS.mauticData)) || {}
      // console.debug("Existing mauticData:", mauticData)

      mauticData[normalizedUrl] = {
        ...data,
        timestamp: Date.now()
      }

      await this.storage.set(StorageService.STORAGE_KEYS.mauticData, mauticData)
      // console.debug("Successfully saved Mautic data:", {
      //   url: normalizedUrl,
      //   data: mauticData[normalizedUrl]
      // })

      // Verify the save
      const savedData = await this.storage.get(
        StorageService.STORAGE_KEYS.mauticData
      )
      // console.debug("Verified saved data:", savedData)
    } catch (error) {
      // console.error("Error saving Mautic data:", error)
    }
  }

  async getMauticData(url: string): Promise<MauticData | null> {
    // console.debug("Getting Mautic data for URL:", url)
    const normalizedUrl = this.normalizeUrl(url)
    try {
      const mauticData = await this.storage.get(
        StorageService.STORAGE_KEYS.mauticData
      )
      const data = mauticData?.[normalizedUrl] || null
      // console.debug("Retrieved Mautic data:", { url: normalizedUrl, data })
      return data
    } catch (error) {
      // console.error("Error getting Mautic data:", error)
      return null
    }
  }

  async getCurrentPageDomains(url: string): Promise<DomainStatus[]> {
    const normalizedUrl = this.normalizeUrl(url)
    const currentPageDomains = await this.storage.get<CurrentPageDomains>(
      StorageService.STORAGE_KEYS.currentPageDomains
    )
    return currentPageDomains?.[normalizedUrl]?.domains || []
  }

  async saveInjectionResults(
    domain: string,
    author: string,
    currentUrl: string,
    trackingInfo: MauticData["trackingInfo"],
    pageTitle: string
  ) {
    // console.log("💾 Saving injection results:", {
    //   domain,
    //   author,
    //   currentUrl,
    //   trackingInfo,
    //   pageTitle
    // })

    const normalizedUrl = this.normalizeUrl(currentUrl)

    try {
      // Convert tracking info to domain statuses
      const domains: DomainStatus[] = trackingInfo
        .filter((tracker): tracker is { domain: string; statusCode?: number } =>
          Boolean(tracker?.domain)
        )
        .map((tracker) => ({
          url: tracker.domain,
          status: tracker.statusCode || 200 // Default to 200 if no status code
        }))

      // console.log("💾 Domains to save:", domains)

      // Update currentPageDomains
      const currentPageDomains =
        (await this.storage.get<CurrentPageDomains>(
          StorageService.STORAGE_KEYS.currentPageDomains
        )) || {}

      currentPageDomains[normalizedUrl] = {
        domains,
        timestamp: Date.now()
      }

      await this.storage.set(
        StorageService.STORAGE_KEYS.currentPageDomains,
        currentPageDomains
      )

      // Update domainPages
      const existingDomainPages =
        (await this.storage.get<DomainPages>(
          StorageService.STORAGE_KEYS.domainPages
        )) || {}

      const pageEntry: PageEntry = {
        url: normalizedUrl,
        title: pageTitle || normalizedUrl,
        timestamp: Date.now()
      }

      // Create new domainPages object with updated entries
      const updatedDomainPages: DomainPages = {}

      // First, add current domains being processed
      for (const domainInfo of domains) {
        const trackerDomain = domainInfo.url
        const existingPages = existingDomainPages[trackerDomain] || []

        // Remove any existing entry for current URL
        const filteredPages = existingPages.filter(
          (entry) => entry.url !== normalizedUrl
        )

        // Add new entry at the beginning
        updatedDomainPages[trackerDomain] = [pageEntry, ...filteredPages]
      }

      // Add remaining domains from existing storage
      for (const [key, pages] of Object.entries(existingDomainPages)) {
        if (!updatedDomainPages[key]) {
          updatedDomainPages[key] = pages
        }
      }

      // Sort domains by their most recent page timestamp
      const sortedDomainEntries = Object.entries(updatedDomainPages).sort(
        ([, a], [, b]) => {
          const latestA = Math.max(...a.map((page) => page.timestamp))
          const latestB = Math.max(...b.map((page) => page.timestamp))
          return latestB - latestA
        }
      )

      // Create final sorted object
      const sortedDomainPages: DomainPages = {}
      for (const [domain, pages] of sortedDomainEntries) {
        sortedDomainPages[domain] = pages
      }

      await this.storage.set(
        StorageService.STORAGE_KEYS.domainPages,
        sortedDomainPages
      )

      // Save Mautic data last (not critical for display)
      await this.saveMauticData(currentUrl, {
        domain,
        author,
        trackingInfo
      })

      // console.log("💾 Successfully saved all data:", {
      //   currentPageDomains,
      //   domainPages: sortedDomainPages
      // })

      return { currentPageDomains, domainPages: sortedDomainPages }
    } catch (error) {
      // console.error("Error saving injection results:", error)
      throw error
    }
  }

  async getStorageState() {
    // console.debug("Getting storage state...")
    try {
      const state = {
        mauticData: await this.storage.get(
          StorageService.STORAGE_KEYS.mauticData
        ),
        domainPages: await this.storage.get(
          StorageService.STORAGE_KEYS.domainPages
        ),
        currentPageDomains: await this.storage.get(
          StorageService.STORAGE_KEYS.currentPageDomains
        ),
        domain: await this.storage.get(StorageService.STORAGE_KEYS.domain),
        author: await this.storage.get(StorageService.STORAGE_KEYS.author)
      }
      // console.debug("Current storage state:", state)
      return state
    } catch (error) {
      // console.error("Error getting storage state:", error)
      return {}
    }
  }
}

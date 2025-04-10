import { Storage } from "@plasmohq/storage"

import type {
  CurrentPageDomains,
  DomainPages,
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
    console.debug("Initializing StorageService")
    this.storage = new Storage({
      area: "local"
    })
    // Initialize storage immediately
    this.initializeStorage()
  }

  public async initializeStorage() {
    console.debug("Initializing storage keys...")
    // Initialize all storage keys at once
    const currentValues = await Promise.all([
      this.storage.get(StorageService.STORAGE_KEYS.mauticData),
      this.storage.get(StorageService.STORAGE_KEYS.domainPages),
      this.storage.get(StorageService.STORAGE_KEYS.currentPageDomains),
      this.storage.get(StorageService.STORAGE_KEYS.domain),
      this.storage.get(StorageService.STORAGE_KEYS.author)
    ])
    console.debug("Current storage values:", currentValues)

    try {
      // Set default values for any undefined keys
      if (!currentValues[0]) {
        await this.storage.set(StorageService.STORAGE_KEYS.mauticData, {})
        console.debug("Initialized mauticData")
      }
      if (!currentValues[1]) {
        await this.storage.set(StorageService.STORAGE_KEYS.domainPages, {})
        console.debug("Initialized domainPages")
      }
      if (!currentValues[2]) {
        await this.storage.set(
          StorageService.STORAGE_KEYS.currentPageDomains,
          {}
        )
        console.debug("Initialized currentPageDomains")
      }
      if (currentValues[3] === undefined) {
        await this.storage.set(StorageService.STORAGE_KEYS.domain, "")
        console.debug("Initialized domain")
      }
      if (currentValues[4] === undefined) {
        await this.storage.set(StorageService.STORAGE_KEYS.author, "")
        console.debug("Initialized author")
      }
    } catch (error) {
      console.error("Error initializing storage:", error)
    }
  }

  private normalizeUrl(url: string): string {
    try {
      const urlObj = new URL(url)
      return urlObj.origin + urlObj.pathname.replace(/\/+$/, "") + urlObj.search
    } catch (e) {
      console.error("Error normalizing URL:", e)
      return url
    }
  }

  async clearStorage() {
    console.debug("Clearing storage")
    try {
      await this.storage.clear()
      await this.initializeStorage()
      console.debug("Storage cleared and reinitialized")
    } catch (error) {
      console.error("Error clearing storage:", error)
    }
  }

  async saveMauticData(url: string, data: Omit<MauticData, "timestamp">) {
    console.debug("Saving Mautic data for URL:", url, data)
    const normalizedUrl = this.normalizeUrl(url)
    try {
      const mauticData =
        (await this.storage.get(StorageService.STORAGE_KEYS.mauticData)) || {}
      console.debug("Existing mauticData:", mauticData)

      mauticData[normalizedUrl] = {
        ...data,
        timestamp: Date.now()
      }

      await this.storage.set(StorageService.STORAGE_KEYS.mauticData, mauticData)
      console.debug("Successfully saved Mautic data:", {
        url: normalizedUrl,
        data: mauticData[normalizedUrl]
      })

      // Verify the save
      const savedData = await this.storage.get(
        StorageService.STORAGE_KEYS.mauticData
      )
      console.debug("Verified saved data:", savedData)
    } catch (error) {
      console.error("Error saving Mautic data:", error)
    }
  }

  async getMauticData(url: string): Promise<MauticData | null> {
    console.debug("Getting Mautic data for URL:", url)
    const normalizedUrl = this.normalizeUrl(url)
    try {
      const mauticData = await this.storage.get(
        StorageService.STORAGE_KEYS.mauticData
      )
      const data = mauticData?.[normalizedUrl] || null
      console.debug("Retrieved Mautic data:", { url: normalizedUrl, data })
      return data
    } catch (error) {
      console.error("Error getting Mautic data:", error)
      return null
    }
  }

  async getCurrentPageDomains(url: string): Promise<string[]> {
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
    console.debug("Saving injection results:", {
      domain,
      author,
      currentUrl,
      trackingInfo,
      pageTitle
    })

    const normalizedUrl = this.normalizeUrl(currentUrl)

    try {
      // Save Mautic data
      await this.saveMauticData(currentUrl, {
        domain,
        author,
        trackingInfo
      })

      // Save current page domains - store only the current page
      const domains = trackingInfo
        .map((tracker) => tracker.domain)
        .filter((domain): domain is string => domain !== null)

      const currentPageDomains = {
        [normalizedUrl]: {
          domains,
          timestamp: Date.now()
        }
      }

      await this.storage.set(
        StorageService.STORAGE_KEYS.currentPageDomains,
        currentPageDomains
      )

      // Save domain pages data for each domain
      const domainPages =
        (await this.storage.get<DomainPages>(
          StorageService.STORAGE_KEYS.domainPages
        )) || {}

      const pageEntry: PageEntry = {
        url: normalizedUrl,
        title: pageTitle,
        timestamp: Date.now()
      }

      // Update entries for each detected domain
      for (const trackerDomain of domains) {
        if (!domainPages[trackerDomain]) {
          domainPages[trackerDomain] = []
        }

        // Add new page entry and keep only unique URLs
        domainPages[trackerDomain] = [
          pageEntry,
          ...domainPages[trackerDomain].filter(
            (entry) => entry.url !== normalizedUrl
          )
        ]
      }

      await this.storage.set(
        StorageService.STORAGE_KEYS.domainPages,
        domainPages
      )

      console.debug("Successfully saved domain pages:", domainPages)
    } catch (error) {
      console.error("Error saving injection results:", error)
    }
  }

  async getStorageState() {
    console.debug("Getting storage state...")
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
      console.debug("Current storage state:", state)
      return state
    } catch (error) {
      console.error("Error getting storage state:", error)
      return {}
    }
  }
}

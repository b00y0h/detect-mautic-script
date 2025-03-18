import { Storage } from "@plasmohq/storage"

import type { DomainPages, PageEntry } from "~types/storage"

export class StorageService {
  private storage: Storage

  constructor() {
    this.storage = new Storage({
      // Add persistent storage option
      area: "local"
    })
    // Initialize storage with empty pages object if not exists
    this.initializeStorage()
  }

  private async initializeStorage() {
    const pages = await this.storage.get("eab.pages")
    if (!pages) {
      await this.storage.set("eab.pages", {})
    }
  }

  async clearStorage() {
    await this.storage.clear()
  }

  async initializeEmptyValues() {
    const domain = await this.storage.get("eab.domain")
    const author = await this.storage.get("eab.author")

    if (domain === undefined) {
      await this.storage.set("eab.domain", "")
    }
    if (author === undefined) {
      await this.storage.set("eab.author", "")
    }
  }

  async saveInjectionResults(
    domain: string,
    author: string,
    currentUrl: string
  ) {
    // console.log("Saving injection results for:", { domain, currentUrl })

    await this.storage.set("eab.domain", domain)
    await this.storage.set("eab.author", author)

    const pages = await this.getDomainPages()
    // console.log("Current pages before update:", pages)

    const entry: PageEntry = {
      url: currentUrl,
      timestamp: Date.now()
    }

    // Check if URL already exists for this domain
    const existingPages = pages[domain] || []
    const urlExists = existingPages.some((page) => page.url === currentUrl)

    if (!urlExists) {
      const updatedPages = {
        ...pages,
        [domain]: [...existingPages, entry]
      }
      await this.storage.set("eab.pages", updatedPages)
      // console.log("Stored pages after update:", await this.getDomainPages())
    } else {
      // console.log("URL already exists for this domain, skipping...")
    }
  }

  // Add a debug method to check storage state
  async getStorageState() {
    return {
      domain: await this.storage.get("eab.domain"),
      author: await this.storage.get("eab.author"),
      pages: await this.getDomainPages()
    }
  }

  async getDomainPages(): Promise<DomainPages> {
    const pages = await this.storage.get<DomainPages>("eab.pages")
    return pages || {} // Simply return empty object if null, don't reinitialize
  }
}

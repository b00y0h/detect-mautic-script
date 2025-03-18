import windowChanger from "../injected-helper"
import { BadgeService } from "./BadgeService"
import { StorageService } from "./StorageService"

export class InjectionService {
  private storageService: StorageService
  private badgeService: BadgeService

  constructor() {
    this.storageService = new StorageService()
    this.badgeService = new BadgeService()
  }

  async inject(tabId: number) {
    await this.storageService.initializeEmptyValues()

    const tab = await chrome.tabs.get(tabId)
    const currentUrl = tab.url || ""

    chrome.scripting.executeScript(
      {
        target: { tabId },
        world: "MAIN",
        func: windowChanger
      },
      async (injectionResults) => {
        if (chrome.runtime.lastError) {
          this.badgeService.setError(tabId)
          return
        }

        const result = injectionResults?.[0]?.result
        if (result?.domain) {
          this.badgeService.setSuccess(tabId, result.domain)
          await this.storageService.saveInjectionResults(
            result.domain,
            result.author,
            currentUrl
          )
        } else {
          this.badgeService.setNotFound(tabId)
        }
      }
    )
  }
}

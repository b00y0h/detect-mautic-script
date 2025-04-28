import windowChanger from "../injected-helper"
import { BadgeService } from "./BadgeService"
import { StorageService } from "./StorageService"

export class InjectionService {
  private storageService: StorageService
  private badgeService: BadgeService

  constructor() {
    console.debug("Initializing InjectionService")
    this.storageService = new StorageService()
    this.badgeService = new BadgeService()
  }

  async inject(tabId: number) {
    console.debug("Starting injection for tab:", tabId)
    await this.storageService.initializeStorage()

    const tab = await chrome.tabs.get(tabId)
    const currentUrl = tab.url || ""
    console.debug("Injecting into URL:", currentUrl)

    chrome.scripting.executeScript(
      {
        target: { tabId },
        world: "MAIN",
        func: windowChanger
      },
      async (injectionResults) => {
        if (chrome.runtime.lastError) {
          console.error("Injection error:", chrome.runtime.lastError)
          this.badgeService.setError(tabId)
          return
        }

        try {
          const promiseResult = await injectionResults?.[0]?.result
          const result = await promiseResult
          console.debug("Injection results:", result)

          if (result?.trackingInfo?.length > 0) {
            // Use first tracker's domain for the badge
            const firstTracker = result.trackingInfo[0]
            const mainDomain = firstTracker?.domain || "unknown"
            console.debug("Detected Mautic domains:", result.trackingInfo)

            this.badgeService.setSuccess(tabId, mainDomain)

            // Save all results at once
            try {
              await this.storageService.saveInjectionResults(
                mainDomain,
                result.author,
                currentUrl,
                result.trackingInfo,
                result.title || "Untitled Page"
              )
            } catch (error) {
              console.error("Error saving injection results:", error)
            }
          } else {
            console.debug("No Mautic trackers found")
            this.badgeService.setNotFound(tabId)
          }
        } catch (error) {
          console.error("Error processing injection results:", error)
          this.badgeService.setError(tabId)
        }
      }
    )
  }
}

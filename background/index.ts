import { InjectionService } from "./services/InjectionService"
import { StorageService } from "./services/StorageService"

// Initialize services
const injectionService = new InjectionService()
const storageService = new StorageService()

// Configure side panel to open when clicking the extension icon
chrome.sidePanel.setPanelBehavior({ openPanelOnActionClick: true })

// Store detected domains and their status codes
const domainStatusMap = new Map<string, number>()

// Listen for URL changes
chrome.tabs.onUpdated.addListener((tabId, changeInfo, tab) => {
  if (changeInfo.status === "complete" && tab.url?.startsWith("http")) {
    // Clear previous status for this tab
    domainStatusMap.clear()
    injectionService.inject(tabId)
  }
})

// Set up mtc.js network request detection
chrome.webRequest.onBeforeRequest.addListener(
  function (details) {
    if (details.url.includes("/mtc.js")) {
      const domain = new URL(details.url).origin
      // console.log("🔍 Detected mtc.js request:", domain)
      domainStatusMap.set(domain, -1) // Mark as pending
    }
    return // Must return for the listener
  },
  { urls: ["<all_urls>"] }
)

// Listen for completed requests to capture status codes
chrome.webRequest.onCompleted.addListener(
  async function (details) {
    if (details.url.includes("/mtc.js")) {
      const domain = new URL(details.url).origin
      const statusCode = details.statusCode
      // console.log("✅ mtc.js request completed:", domain, statusCode)
      domainStatusMap.set(domain, statusCode)

      try {
        // Get the tab info
        if (!details.tabId || details.tabId < 0) {
          // console.debug("Invalid tab ID:", details.tabId)
          return
        }

        const tab = await chrome.tabs.get(details.tabId)
        if (!tab?.url) {
          // console.debug("No URL found for tab:", details.tabId)
          return
        }

        // Get existing tracking info
        const existingData = await storageService.getMauticData(tab.url)
        const existingTrackingInfo = existingData?.trackingInfo || []

        // Update tracking info with status code
        const updatedTrackingInfo = [...existingTrackingInfo]
        const existingIndex = updatedTrackingInfo.findIndex(
          (t) => t.domain === domain
        )

        if (existingIndex !== -1) {
          updatedTrackingInfo[existingIndex] = {
            ...updatedTrackingInfo[existingIndex],
            statusCode
          }
        } else {
          updatedTrackingInfo.push({ domain, statusCode })
        }

        // Save the updated data
        await storageService.saveInjectionResults(
          domain,
          existingData?.author || "Bob Smith",
          tab.url,
          updatedTrackingInfo,
          tab.title || "Untitled Page"
        )

        // Force refresh injection results to update UI
        await injectionService.inject(details.tabId)
      } catch (err) {
        // console.error("Error handling completed request:", err)
      }
    }
  },
  { urls: ["<all_urls>"] }
)

// Handle redirects
chrome.webRequest.onBeforeRedirect.addListener(
  async function (details) {
    if (details.url.includes("/mtc.js")) {
      const domain = new URL(details.url).origin
      const statusCode = details.statusCode
      // console.log(
      //   "↪️ mtc.js redirect:",
      //   domain,
      //   statusCode,
      //   "->",
      //   details.redirectUrl
      // )

      // Update status in map
      domainStatusMap.set(domain, statusCode)

      // If we have a tab ID, update the stored data
      if (details.tabId && details.tabId > 0) {
        try {
          const tab = await chrome.tabs.get(details.tabId)
          if (tab?.url) {
            const existingData = await storageService.getMauticData(tab.url)
            if (existingData) {
              const updatedTrackingInfo = existingData.trackingInfo.map(
                (tracker) =>
                  tracker.domain === domain
                    ? { ...tracker, statusCode }
                    : tracker
              )

              await storageService.saveInjectionResults(
                domain,
                existingData.author,
                tab.url,
                updatedTrackingInfo,
                tab.title || "Untitled Page"
              )
            }
          }
        } catch (err) {
          // console.error("Error handling redirect:", err)
        }
      }
    }
  },
  { urls: ["<all_urls>"] }
)

// Handle messages from content scripts
chrome.runtime.onMessage.addListener((message, sender, sendResponse) => {
  if (message.type === "GET_CURRENT_TAB_ID") {
    sendResponse(sender.tab?.id)
  }
  return true
})

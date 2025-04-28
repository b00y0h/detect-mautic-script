import { InjectionService } from "./services/InjectionService"
import { StorageService } from "./services/StorageService"

// Initialize services
const injectionService = new InjectionService()
const storageService = new StorageService()

// Configure side panel to open when clicking the extension icon
chrome.sidePanel.setPanelBehavior({ openPanelOnActionClick: true })

// Listen for URL changes
chrome.tabs.onUpdated.addListener((tabId, changeInfo, tab) => {
  if (changeInfo.status === "complete" && tab.url?.startsWith("http")) {
    injectionService.inject(tabId)
  }
})

// Store detected domains and their status codes
const domainStatusMap = new Map<string, number>()

// Set up mtc.js network request detection for initial requests and redirects
chrome.webRequest.onBeforeRequest.addListener(
  function (details) {
    if (details.url.includes("/mtc.js")) {
      const domain = new URL(details.url).origin
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
      console.log("🚀 Request completed:", details.url, statusCode)

      try {
        // Get the tab info
        if (!details.tabId || details.tabId < 0) {
          console.debug("Invalid tab ID:", details.tabId)
          return
        }

        const tab = await chrome.tabs.get(details.tabId)
        if (tab?.url) {
          // Get existing tracking info from storage
          const existingData = await storageService.getMauticData(tab.url)
          const existingTrackingInfo = existingData?.trackingInfo || []

          // Update or add status code to tracking info
          const updatedTrackingInfo = existingTrackingInfo.map((tracker) => {
            if (tracker.domain === domain) {
              return { ...tracker, statusCode }
            }
            return tracker
          })

          // If domain wasn't in the existing tracking info, add it
          if (!updatedTrackingInfo.some((t) => t.domain === domain)) {
            updatedTrackingInfo.push({ domain, statusCode })
          }

          // Save the updated tracking info
          await storageService.saveMauticData(tab.url, {
            domain,
            author: existingData?.author || "Bob Smith",
            trackingInfo: updatedTrackingInfo
          })

          // Re-run injection to update the UI
          injectionService.inject(details.tabId)
        }
      } catch (err) {
        console.error("Error handling completed request:", err)
      }
    }
  },
  { urls: ["<all_urls>"] }
)

// Handle redirects
chrome.webRequest.onBeforeRedirect.addListener(
  function (details) {
    if (details.url.includes("/mtc.js")) {
      const domain = new URL(details.url).origin
      console.log(
        "🚀 Redirect:",
        details.url,
        details.statusCode,
        "->",
        details.redirectUrl
      )
      domainStatusMap.set(domain, details.statusCode)
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

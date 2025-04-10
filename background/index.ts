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

// Set up mtc.js network request detection
chrome.webRequest.onBeforeRequest.addListener(
  function (details) {
    if (details.url.includes("/mtc.js")) {
      const domain = new URL(details.url).origin
      // Store domain information using StorageService
      chrome.tabs.get(details.tabId).then((tab) => {
        if (tab.url) {
          storageService.saveMauticData(tab.url, {
            domain: domain,
            author: "Bob Smith",
            trackingInfo: [{ domain }]
          })
        }
      })
    }
    return // Must return for the listener
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

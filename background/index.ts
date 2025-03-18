import { InjectionService } from "./services/InjectionService"

const injectionService = new InjectionService()

chrome.tabs.onActivated.addListener((e) => {
  injectionService.inject(e.tabId)
})

chrome.tabs.onUpdated.addListener((tabId, changeInfo, tab) => {
  if (changeInfo.status === "complete") {
    injectionService.inject(tabId)
  }
})

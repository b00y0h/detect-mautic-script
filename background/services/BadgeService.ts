export class BadgeService {
  setError(tabId: number) {
    chrome.action.setBadgeText({ text: "X", tabId })
    chrome.action.setBadgeBackgroundColor({ color: "#FF0000" })
    chrome.action.setTitle({ title: "No domain detected", tabId })
  }

  setSuccess(tabId: number, domain: string) {
    chrome.action.setBadgeText({ text: "✓", tabId })
    chrome.action.setBadgeBackgroundColor({ color: "#00FF00" })
    chrome.action.setTitle({ title: `ACS Domain: ${domain}`, tabId })
  }

  setNotFound(tabId: number) {
    chrome.action.setTitle({ title: "No domain detected", tabId })
  }
}

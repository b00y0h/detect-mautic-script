export class BadgeService {
  setError(tabId: number) {
    chrome.action.setBadgeText({ text: "X", tabId })
    chrome.action.setBadgeBackgroundColor({ color: "#ef4444", tabId }) // error.DEFAULT
    chrome.action.setTitle({ title: "No domain detected", tabId })
  }

  setSuccess(tabId: number, domain: string) {
    chrome.action.setBadgeText({ text: "✓", tabId })
    chrome.action.setBadgeBackgroundColor({ color: "#22c55e", tabId }) // success.DEFAULT
    chrome.action.setTitle({ title: `Mautic Domain: ${domain}`, tabId })
  }

  setNotFound(tabId: number) {
    chrome.action.setBadgeText({ text: "", tabId })
    chrome.action.setTitle({ title: "No Mautic trackers detected", tabId })
  }
}

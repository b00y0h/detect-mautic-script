import { Storage } from "@plasmohq/storage"

interface CustomWindow extends Window {
  detectMautic: {
    eab: {
      author: string
      domain: string
      title: string
      trackingInfo: Array<{
        domain: string | null
      }>
    }
    MauticDomain?: string
  }
  [key: string]: any // Allow indexing with string
}

declare let window: CustomWindow

export default function windowChanger() {
  console.debug("Starting Mautic detection in page")
  if (!window.detectMautic) {
    window.detectMautic = {} as any
  }

  const findMauticTrackers = (): Array<{ domain: string | null }> => {
    const trackingInfo: Array<{ domain: string | null }> = []

    // Find all script elements with Mautic initialization
    const scripts = Array.from(document.querySelectorAll("script"))
    console.debug("Analyzing", scripts.length, "scripts on page")

    const trackingScripts = scripts.filter((script) => {
      const content = script.textContent || ""
      const hasMautic = content.includes("MauticTrackingObject")
      if (hasMautic) {
        console.debug("Found script with MauticTrackingObject:", content)
      }
      return hasMautic
    })

    console.debug(
      "Found",
      trackingScripts.length,
      "potential Mautic tracking scripts"
    )

    // Extract information from each tracking script
    trackingScripts.forEach((script) => {
      const content = script.textContent || ""
      const domainMatch = content.match(/["'](https:\/\/[^"']+\/mtc\.js)["']/)
      const domain = domainMatch ? new URL(domainMatch[1]).origin : null

      if (domain) {
        console.debug("Extracted Mautic domain:", domain)
        trackingInfo.push({ domain })
      }
    })

    console.debug("Final tracking info:", trackingInfo)
    return trackingInfo
  }

  const trackingInfo = findMauticTrackers()

  window.detectMautic.eab = {
    author: "Bob Smith",
    domain: window.location.origin,
    title: document.title,
    trackingInfo
  }

  console.debug("Returning detection results:", window.detectMautic.eab)
  return window.detectMautic.eab
}

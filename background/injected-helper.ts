import { Storage } from "@plasmohq/storage"

interface CustomWindow extends Window {
  detectMautic: {
    eab: {
      author: string
      domain: string
      title: string
      trackingInfo: Array<{
        domain: string | null
        statusCode?: number
      }>
    }
    MauticDomain?: string
  }
  [key: string]: any // Allow indexing with string
}

declare let window: CustomWindow

export default function windowChanger() {
  // console.log("Starting Mautic detection in page")
  if (!window.detectMautic) {
    window.detectMautic = {} as any
  }

  const findMauticTrackers = async (): Promise<
    Array<{ domain: string | null; statusCode?: number }>
  > => {
    const trackingInfo: Array<{ domain: string | null; statusCode?: number }> =
      []
    const processedDomains = new Set<string>()

    // Find all script elements
    const scripts = Array.from(document.querySelectorAll("script"))
    // console.log("Analyzing", scripts.length, "scripts on page")

    // First check for src attributes containing mtc.js
    for (const script of scripts) {
      const src = script.getAttribute("src")
      if (src?.includes("/mtc.js")) {
        try {
          const domain = new URL(src).origin
          if (!processedDomains.has(domain)) {
            // console.log("Found Mautic script via src:", src)
            trackingInfo.push({ domain })
            processedDomains.add(domain)
          }
        } catch (e) {
          // console.error("Error parsing script src URL:", e)
        }
      }
    }

    // Then check script contents for Mautic initialization
    for (const script of scripts) {
      const content = script.textContent || ""
      if (content.includes("MauticTrackingObject")) {
        const domainMatch = content.match(/["'](https:\/\/[^"']+\/mtc\.js)["']/)
        if (domainMatch) {
          try {
            const domain = new URL(domainMatch[1]).origin
            if (!processedDomains.has(domain)) {
              // console.log("Found Mautic script via initialization:", domain)
              trackingInfo.push({ domain })
              processedDomains.add(domain)
            }
          } catch (e) {
            // console.error("Error parsing domain from content:", e)
          }
        }
      }
    }

    // Look for other Mautic indicators (forms, etc.)
    const forms = document.querySelectorAll("form")
    for (const form of forms) {
      const formAction = form.getAttribute("action") || ""
      const formClass = form.getAttribute("class") || ""

      if (
        formClass.includes("mauticform") ||
        formAction.includes("/form/submit") ||
        formAction.includes("/mautic/")
      ) {
        try {
          const formDomain = new URL(formAction).origin
          if (!processedDomains.has(formDomain)) {
            // console.log("Found Mautic form:", formAction)
            trackingInfo.push({ domain: formDomain })
            processedDomains.add(formDomain)
          }
        } catch (e) {
          // console.error("Error parsing form action URL:", e)
        }
      }
    }

    // Check for Mautic tracking pixel
    const images = document.querySelectorAll("img")
    for (const img of images) {
      const src = img.getAttribute("src") || ""
      if (src.includes("/mtracking.gif")) {
        try {
          const domain = new URL(src).origin
          if (!processedDomains.has(domain)) {
            // console.log("Found Mautic tracking pixel:", src)
            trackingInfo.push({ domain })
            processedDomains.add(domain)
          }
        } catch (e) {
          // console.error("Error parsing tracking pixel URL:", e)
        }
      }
    }

    // console.log("Final tracking info:", trackingInfo)
    return trackingInfo
  }

  const getTrackingInfo = async () => {
    const trackingInfo = await findMauticTrackers()
    return {
      author: "Bob Smith",
      domain: window.location.origin,
      title: document.title,
      trackingInfo
    }
  }

  return getTrackingInfo()
}

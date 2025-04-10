import { formatDistance } from "date-fns"
import { useEffect, useState } from "react"

import { Storage } from "@plasmohq/storage"

import type { CurrentPageDomains, DomainPages } from "~types/storage"

import "./style.css"

const STORAGE_KEYS = {
  currentPageDomains: "currentPageDomains",
  domainPages: "domainPages"
}

interface CurrentPage {
  domains: string[]
  timestamp: number
}

function normalizeUrl(url: string): string {
  try {
    const urlObj = new URL(url)
    return urlObj.origin + urlObj.pathname.replace(/\/+$/, "") + urlObj.search
  } catch (e) {
    console.error("Error normalizing URL:", e)
    return url
  }
}

export default function IndexPopup() {
  const [currentPage, setCurrentPage] = useState<CurrentPage | null>(null)
  const [domainPages, setDomainPages] = useState<DomainPages>({})
  const [isLoading, setIsLoading] = useState(true)
  const [error, setError] = useState("")

  const loadData = async () => {
    try {
      setIsLoading(true)
      const storage = new Storage({ area: "local" })

      // Get current tab URL
      const [tab] = await chrome.tabs.query({
        active: true,
        currentWindow: true
      })

      if (!tab.url) {
        throw new Error("No URL found for current tab")
      }

      // Normalize the URL to match storage format
      const normalizedUrl = normalizeUrl(tab.url)

      // Get current page domains
      const currentPageDomains = await storage.get<CurrentPageDomains>(
        STORAGE_KEYS.currentPageDomains
      )
      if (currentPageDomains?.[normalizedUrl]) {
        setCurrentPage(currentPageDomains[normalizedUrl])
      }

      // Get all domain pages data
      const pages = await storage.get<DomainPages>(STORAGE_KEYS.domainPages)
      if (pages) {
        setDomainPages(pages)
      }
    } catch (err) {
      setError("Error retrieving Mautic data")
      console.error(err)
    } finally {
      setIsLoading(false)
    }
  }

  useEffect(() => {
    loadData()
  }, [])

  const handleClearHistory = async () => {
    try {
      const storage = new Storage({ area: "local" })
      // Only clear the domainPages storage
      await storage.set(STORAGE_KEYS.domainPages, {})
      setDomainPages({})
      setError("")
    } catch (err) {
      setError("Error clearing history")
      console.error(err)
    }
  }

  const formatTimeAgo = (timestamp: number) => {
    return formatDistance(timestamp, Date.now(), { addSuffix: true })
  }

  if (isLoading) {
    return <div className="p-4">Loading...</div>
  }

  if (error) {
    return <div className="p-4 text-error">{error}</div>
  }

  return (
    <div className="min-w-custom max-w-custom h-full overflow-y-auto">
      <div className="p-4">
        {/* Current page trackers */}
        <section className="mb-6">
          <h2 className="text-lg font-bold mb-2 text-primary-900">
            Current Page Trackers
          </h2>
          {currentPage?.domains?.length ? (
            <>
              <ul className="space-y-2">
                {currentPage.domains.map((domain, index) => (
                  <li
                    key={index}
                    className="bg-primary-50 p-2 rounded border border-primary-200">
                    {domain}
                  </li>
                ))}
              </ul>
              <p className="text-sm text-secondary-500 mt-2">
                Detected {formatTimeAgo(currentPage.timestamp)}
              </p>
            </>
          ) : (
            <p className="text-secondary-600">
              No Mautic trackers detected on this page
            </p>
          )}
        </section>

        {/* All Mautic domains and their pages */}
        <section>
          <h2 className="text-lg font-bold mb-2 text-primary-900">
            History {/* Clear History button - only show if there is data */}
            {Object.keys(domainPages).length > 0 && (
              <button
                onClick={handleClearHistory}
                className="text-sm text-primary-600 hover:underline transition-colors">
                Clear
              </button>
            )}
          </h2>
          {Object.keys(domainPages).length > 0 ? (
            <div className="space-y-4">
              {Object.entries(domainPages).map(([domain, pages]) => (
                <div
                  key={domain}
                  className="bg-primary-50 p-3 rounded border border-primary-200">
                  <h3 className="font-semibold text-primary-700">{domain}</h3>
                  <ul className="mt-2 space-y-2">
                    {pages.slice(0, 3).map((page, index) => (
                      <li key={index} className="text-sm">
                        <span className="text-primary-700 font-medium block">
                          {page.title || "Untitled Page"}
                        </span>
                        <span className="text-secondary-700 truncate block text-xs">
                          <a
                            href={page.url}
                            target="_blank"
                            rel="noopener noreferrer"
                            className="hover:text-primary-600 hover:underline">
                            {page.url}
                          </a>
                        </span>
                        <span className="block text-secondary-400 text-xs">
                          {formatTimeAgo(page.timestamp)}
                        </span>
                      </li>
                    ))}
                    {pages.length > 3 && (
                      <li className="text-sm text-secondary-500 italic">
                        ...and {pages.length - 3} more pages
                      </li>
                    )}
                  </ul>
                </div>
              ))}
            </div>
          ) : (
            <p className="text-secondary-600">No Mautic domains detected yet</p>
          )}
        </section>
      </div>
    </div>
  )
}

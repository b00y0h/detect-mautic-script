import { formatDistance } from "date-fns"
import { useEffect, useState } from "react"

import { Storage } from "@plasmohq/storage"

import type {
  CurrentPageDomains,
  DomainPages,
  DomainStatus
} from "~types/storage"

import "./style.css"

import Header from "~components/header"
import StatusBadge from "~components/StatusBadge"

const STORAGE_KEYS = {
  currentPageDomains: "currentPageDomains",
  domainPages: "domainPages"
}

interface CurrentPage {
  domains: DomainStatus[]
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

export default function SidePanel() {
  const [currentPage, setCurrentPage] = useState<CurrentPage | null>(null)
  const [domainPages, setDomainPages] = useState<DomainPages>({})
  const [isLoading, setIsLoading] = useState(true)
  const [error, setError] = useState("")
  const [currentUrl, setCurrentUrl] = useState<string>("")

  const loadData = async () => {
    try {
      setIsLoading(true)
      const storage = new Storage({ area: "local" })

      // Get current tab URL
      const [tab] = await chrome.tabs.query({
        active: true,
        currentWindow: true
      })

      const tabUrl = tab?.url
      if (!tabUrl || !tabUrl.startsWith("http")) {
        setCurrentUrl("")
        setCurrentPage(null)
      } else {
        // Normalize the URL to match storage format
        const normalizedUrl = normalizeUrl(tabUrl)
        setCurrentUrl(normalizedUrl)

        // Get current page domains
        const currentPageDomains = await storage.get<CurrentPageDomains>(
          STORAGE_KEYS.currentPageDomains
        )

        if (currentPageDomains?.[normalizedUrl]) {
          setCurrentPage(currentPageDomains[normalizedUrl])
        } else {
          setCurrentPage(null)
        }
      }

      // Get domain pages data regardless of current URL
      const pages = await storage.get<DomainPages>(STORAGE_KEYS.domainPages)
      setDomainPages(pages || {})
      setError("") // Clear any previous errors
    } catch (err) {
      setError(err.message || "Error retrieving Mautic/ACS data")
    } finally {
      setIsLoading(false)
    }
  }

  useEffect(() => {
    loadData()

    // Set up storage change listener
    const storage = new Storage({ area: "local" })
    const handleStorageChange = (changes: { [key: string]: any }) => {
      loadData()
    }

    // Watch both storage keys
    storage.watch({
      [STORAGE_KEYS.currentPageDomains]: handleStorageChange,
      [STORAGE_KEYS.domainPages]: handleStorageChange
    })

    const tabChangeListener = () => {
      loadData()
    }

    // Listen for tab changes
    chrome.tabs.onActivated.addListener(tabChangeListener)
    chrome.tabs.onUpdated.addListener(tabChangeListener)

    // Clean up listeners on unmount
    return () => {
      storage.unwatch({
        [STORAGE_KEYS.currentPageDomains]: handleStorageChange,
        [STORAGE_KEYS.domainPages]: handleStorageChange
      })
      chrome.tabs.onActivated.removeListener(tabChangeListener)
      chrome.tabs.onUpdated.removeListener(tabChangeListener)
    }
  }, [])

  const handleClearHistory = async () => {
    try {
      const storage = new Storage({ area: "local" })
      await storage.set(STORAGE_KEYS.domainPages, {})
      setDomainPages({})
      setError("")
    } catch (err) {
      setError("Error clearing history")
    }
  }

  const formatTimeAgo = (timestamp: number) => {
    return formatDistance(timestamp, Date.now(), { addSuffix: true })
  }

  if (isLoading) {
    return <div className="p-4 dark:text-gray-200">Loading...</div>
  }

  return (
    <>
      <Header />
      <div className="h-screen overflow-y-auto bg-white dark:bg-gray-900">
        <div className="p-4">
          {/* Current page trackers */}
          <section className="mb-6">
            <h2 className="text-lg font-bold mb-2 text-primary-900 dark:text-gray-100">
              Current Page Trackers
            </h2>
            {error ? (
              <p className="text-error dark:text-red-400 mb-2">{error}</p>
            ) : currentUrl ? (
              currentPage?.domains?.length > 0 ? (
                <>
                  <ul className="space-y-2">
                    {currentPage.domains.map((domain, index) => (
                      <li
                        key={index}
                        className="bg-primary-50 dark:bg-gray-800 p-2 rounded border border-primary-200 dark:border-gray-700 dark:text-gray-200">
                        {domain.url}
                        <StatusBadge statusCode={domain.status} />
                      </li>
                    ))}
                  </ul>
                  <p className="text-sm text-secondary-500 dark:text-gray-400 mt-2">
                    Detected {formatTimeAgo(currentPage.timestamp)}
                  </p>
                </>
              ) : (
                <p className="text-secondary-600 dark:text-gray-400">
                  No Mautic/ACS trackers detected on this page
                </p>
              )
            ) : (
              <p className="text-secondary-600 dark:text-gray-400">
                Please navigate to a webpage to detect Mautic/ACS trackers
              </p>
            )}
          </section>

          {/* History */}
          <section>
            <div className="flex justify-between items-center mb-2">
              <h2 className="text-lg font-bold text-primary-900 dark:text-gray-100">
                History
              </h2>
              {Object.keys(domainPages).length > 0 && (
                <button
                  onClick={handleClearHistory}
                  className="text-sm text-primary-600 dark:text-blue-400 hover:underline transition-colors">
                  Clear History
                </button>
              )}
            </div>
            {Object.keys(domainPages).length > 0 ? (
              <div className="space-y-4">
                {Object.entries(domainPages).map(([domain, pages]) => (
                  <div
                    key={domain}
                    className="bg-primary-50 dark:bg-gray-800 p-3 rounded border border-primary-200 dark:border-gray-700">
                    <h3 className="font-semibold text-primary-700 dark:text-gray-200">
                      {domain}
                    </h3>
                    <ul className="mt-2 space-y-2">
                      {[...pages]
                        .sort((a, b) => b.timestamp - a.timestamp)
                        .slice(0, 3)
                        .map((page, index) => (
                          <li key={index} className="text-sm">
                            <span className="text-primary-700 dark:text-gray-300 font-medium block">
                              {page.title || "Untitled Page"}
                            </span>
                            <span className="text-secondary-700 dark:text-gray-400 truncate block text-xs">
                              <a
                                href={page.url}
                                target="_blank"
                                rel="noopener noreferrer"
                                className="hover:text-primary-600 dark:hover:text-blue-400 hover:underline">
                                {page.url}
                              </a>
                            </span>
                            <span className="block text-secondary-400 dark:text-gray-500 text-xs">
                              {formatTimeAgo(page.timestamp)}
                            </span>
                          </li>
                        ))}
                      {pages.length > 3 && (
                        <li className="text-sm text-secondary-500 dark:text-gray-400 italic">
                          ...and {pages.length - 3} more pages
                        </li>
                      )}
                    </ul>
                  </div>
                ))}
              </div>
            ) : (
              <p className="text-secondary-600 dark:text-gray-400">
                No history available
              </p>
            )}
          </section>

          {/* Debug info */}
          <section className="mt-4 p-2 bg-gray-100 dark:bg-gray-800 rounded text-xs">
            <details>
              <summary className="cursor-pointer">Debug Info</summary>
              <pre className="mt-2 overflow-x-auto">
                {JSON.stringify(
                  {
                    currentUrl,
                    currentPage,
                    domainPagesCount: Object.keys(domainPages).length,
                    timestamp: Date.now()
                  },
                  null,
                  2
                )}
              </pre>
            </details>
          </section>
        </div>
      </div>
    </>
  )
}

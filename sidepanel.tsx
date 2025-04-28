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
    return <div className="p-4 dark:text-gray-200">Loading...</div>
  }

  if (error) {
    return <div className="p-4 text-error dark:text-red-400">{error}</div>
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
            {currentPage?.domains?.length ? (
              <>
                <ul className="space-y-2">
                  {currentPage.domains.map((domain, index) => (
                    <li
                      key={index}
                      className="bg-primary-50 dark:bg-gray-800 p-2 rounded border border-primary-200 dark:border-gray-700 dark:text-gray-200">
                      {domain.url}
                      {/* <StatusBadge statusCode={domain.status} /> */}
                    </li>
                  ))}
                </ul>
                <p className="text-sm text-secondary-500 dark:text-gray-400 mt-2">
                  Detected {formatTimeAgo(currentPage.timestamp)}
                </p>
              </>
            ) : (
              <p className="text-secondary-600 dark:text-gray-400">
                No Mautic trackers detected on this page
              </p>
            )}
          </section>

          {/* All Mautic domains and their pages */}
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
                {Object.entries(domainPages).map(([domain, pages]) => {
                  return (
                    <div
                      key={domain}
                      className="bg-primary-50 dark:bg-gray-800 p-3 rounded border border-primary-200 dark:border-gray-700">
                      <h3 className="font-semibold text-primary-700 dark:text-gray-200">
                        {domain}
                      </h3>
                      <ul className="mt-2 space-y-2">
                        {pages.slice(0, 3).map((page, index) => {
                          return (
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
                          )
                        })}
                        {pages.length > 3 && (
                          <li className="text-sm text-secondary-500 dark:text-gray-400 italic">
                            ...and {pages.length - 3} more pages
                          </li>
                        )}
                      </ul>
                    </div>
                  )
                })}
              </div>
            ) : (
              <p className="text-secondary-600 dark:text-gray-400">
                No Mautic domains detected yet
              </p>
            )}
          </section>
        </div>
      </div>
    </>
  )
}

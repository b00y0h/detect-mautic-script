import { useCallback, useLayoutEffect, useRef, useState } from "react"

import { Storage } from "@plasmohq/storage"

import type { CurrentPageDomains, DomainPages } from "~types/storage"

import "./style.css"

import CurrentPageTrackers from "~components/CurrentPageTrackers"
import Header from "~components/header"
import History from "~components/History"

const STORAGE_KEYS = {
  currentPageDomains: "currentPageDomains",
  domainPages: "domainPages"
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
  const loadingRef = useRef(false)
  const currentUrlRef = useRef("")
  const debounceTimerRef = useRef<NodeJS.Timeout>()

  // Split state into smaller pieces to minimize re-renders
  const [currentPageState, setCurrentPageState] = useState({
    currentPage: null,
    currentUrl: "",
    error: "",
    isLoading: true
  })
  const [historyState, setHistoryState] = useState<{
    domainPages: DomainPages
  }>({
    domainPages: {}
  })

  const loadData = useCallback(async () => {
    if (loadingRef.current) {
      return
    }

    loadingRef.current = true
    setCurrentPageState((prev) => ({ ...prev, isLoading: true }))

    try {
      const storage = new Storage({ area: "local" })
      const [tab] = await chrome.tabs.query({
        active: true,
        currentWindow: true
      })

      const tabUrl = tab?.url

      if (!tabUrl || !tabUrl.startsWith("http")) {
        setCurrentPageState((prev) => ({
          ...prev,
          currentUrl: "",
          currentPage: null,
          error: "",
          isLoading: false
        }))
        return
      }

      const normalizedUrl = normalizeUrl(tabUrl)
      currentUrlRef.current = normalizedUrl

      const [currentPageDomains, pages] = await Promise.all([
        storage.get<CurrentPageDomains>(STORAGE_KEYS.currentPageDomains),
        storage.get<DomainPages>(STORAGE_KEYS.domainPages)
      ])

      if (currentUrlRef.current === normalizedUrl) {
        setCurrentPageState((prev) => ({
          currentUrl: normalizedUrl,
          currentPage: currentPageDomains?.[normalizedUrl] || null,
          error: "",
          isLoading: false
        }))

        setHistoryState({
          domainPages: pages || {}
        })
      }
    } catch (err) {
      setCurrentPageState((prev) => ({
        ...prev,
        error: err.message || "Error retrieving Mautic/ACS data",
        isLoading: false
      }))
    } finally {
      loadingRef.current = false
    }
  }, [])

  useLayoutEffect(() => {
    loadData()

    const storage = new Storage({ area: "local" })

    const handleStorageChange = () => {
      clearTimeout(debounceTimerRef.current)
      debounceTimerRef.current = setTimeout(() => {
        loadData()
      }, 150)
    }

    const handleTabChange = () => {
      if (!loadingRef.current) {
        setCurrentPageState((prev) => ({ ...prev, isLoading: true }))
      }
      handleStorageChange()
    }

    storage.watch({
      [STORAGE_KEYS.currentPageDomains]: handleStorageChange,
      [STORAGE_KEYS.domainPages]: handleStorageChange
    })

    chrome.tabs.onActivated.addListener(handleTabChange)
    chrome.tabs.onUpdated.addListener(handleTabChange)

    return () => {
      clearTimeout(debounceTimerRef.current)
      storage.unwatch({
        [STORAGE_KEYS.currentPageDomains]: handleStorageChange,
        [STORAGE_KEYS.domainPages]: handleStorageChange
      })
      chrome.tabs.onActivated.removeListener(handleTabChange)
      chrome.tabs.onUpdated.removeListener(handleTabChange)
    }
  }, [loadData])

  const handleClearHistory = useCallback(async () => {
    try {
      const storage = new Storage({ area: "local" })
      await storage.set(STORAGE_KEYS.domainPages, {})
      setHistoryState({ domainPages: {} })
    } catch (err) {
      setCurrentPageState((prev) => ({
        ...prev,
        error: "Error clearing history"
      }))
    }
  }, [])

  return (
    <>
      <Header />
      <div className="h-screen overflow-y-auto bg-white dark:bg-gray-900">
        <div className="p-4">
          <CurrentPageTrackers
            error={currentPageState.error}
            currentUrl={currentPageState.currentUrl}
            currentPage={currentPageState.currentPage}
            isLoading={currentPageState.isLoading}
          />

          <History
            domainPages={historyState.domainPages}
            onClearHistory={handleClearHistory}
          />
        </div>
      </div>
    </>
  )
}

import { formatDistance } from "date-fns"
import React, { memo, useEffect, useRef, useState } from "react"

import type { DomainStatus } from "~types/storage"

import StatusBadge from "./StatusBadge"

interface CurrentPageProps {
  domains: DomainStatus[]
  timestamp: number
}

interface CurrentPageTrackersProps {
  error: string
  currentUrl: string
  currentPage: CurrentPageProps | null
  isLoading?: boolean
}

const CurrentPageTrackers = memo(
  ({ error, currentUrl, currentPage, isLoading }: CurrentPageTrackersProps) => {
    const [displayState, setDisplayState] = useState<{
      currentPage: CurrentPageProps | null
      transitionTimeout: NodeJS.Timeout | null
    }>({
      currentPage: null,
      transitionTimeout: null
    })

    const currentUrlRef = useRef(currentUrl)

    useEffect(() => {
      currentUrlRef.current = currentUrl
    }, [currentUrl])

    useEffect(() => {
      if (displayState.transitionTimeout) {
        clearTimeout(displayState.transitionTimeout)
      }

      if (currentPage?.domains?.length > 0) {
        setDisplayState((prev) => ({
          currentPage,
          transitionTimeout: null
        }))
        return
      }

      // Keep showing existing content during loading
      if (isLoading && displayState.currentPage) {
        return
      }

      // If we're transitioning to no data, delay the transition
      if (displayState.currentPage && !currentPage?.domains?.length) {
        const timeout = setTimeout(() => {
          if (currentUrlRef.current === currentUrl) {
            setDisplayState((prev) => ({
              currentPage: null,
              transitionTimeout: null
            }))
          }
        }, 300)

        setDisplayState((prev) => ({
          ...prev,
          transitionTimeout: timeout
        }))
      } else {
        setDisplayState((prev) => ({
          currentPage: null,
          transitionTimeout: null
        }))
      }

      return () => {
        if (displayState.transitionTimeout) {
          clearTimeout(displayState.transitionTimeout)
        }
      }
    }, [currentPage, currentUrl, isLoading])

    const formatTimeAgo = (timestamp: number) => {
      return formatDistance(timestamp, Date.now(), { addSuffix: true })
    }

    // If we're loading but have existing content, keep showing it
    if (isLoading && !displayState.currentPage) {
      return (
        <section className="mb-6">
          <h2 className="text-lg font-bold mb-2 text-primary-900 dark:text-gray-100">
            Current Page Trackers
          </h2>
          <div className="text-secondary-600 dark:text-gray-400">
            Checking for trackers...
          </div>
        </section>
      )
    }

    return (
      <section className="mb-6">
        <h2 className="text-lg font-bold mb-2 text-primary-900 dark:text-gray-100">
          Current Page Trackers
        </h2>
        {error ? (
          <p className="text-error dark:text-red-400 mb-2">{error}</p>
        ) : currentUrl ? (
          displayState.currentPage?.domains?.length > 0 ? (
            <>
              <ul className="space-y-2">
                {displayState.currentPage.domains.map((domain) => (
                  <li
                    key={domain.url}
                    className="bg-primary-50 dark:bg-gray-800 p-2 rounded border border-primary-200 dark:border-gray-700 dark:text-gray-200">
                    {domain.url}
                    <StatusBadge statusCode={domain.status} />
                  </li>
                ))}
              </ul>
              <p className="text-sm text-secondary-500 dark:text-gray-400 mt-2">
                Detected {formatTimeAgo(displayState.currentPage.timestamp)}
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
    )
  }
)

CurrentPageTrackers.displayName = "CurrentPageTrackers"

export default CurrentPageTrackers

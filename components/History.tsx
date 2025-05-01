import { formatDistance } from "date-fns"
import React, { memo } from "react"

import type { DomainPages } from "~types/storage"

interface HistoryProps {
  domainPages: DomainPages
  onClearHistory: () => void
}

const History = memo(({ domainPages, onClearHistory }: HistoryProps) => {
  const formatTimeAgo = (timestamp: number) => {
    return formatDistance(timestamp, Date.now(), { addSuffix: true })
  }

  return (
    <section>
      <div className="flex justify-between items-center mb-2">
        <h2 className="text-lg font-bold text-primary-900 dark:text-gray-100">
          History
        </h2>
        {Object.keys(domainPages).length > 0 && (
          <button
            onClick={onClearHistory}
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
                  .map((page) => (
                    <li key={page.url} className="text-sm">
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
  )
})

History.displayName = "History"

export default History

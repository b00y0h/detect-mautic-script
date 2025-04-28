import React from "react"

interface StatusBadgeProps {
  statusCode: number | undefined
}

const StatusBadge: React.FC<StatusBadgeProps> = ({ statusCode }) => {
  if (!statusCode && statusCode !== 0) return null

  const getStatusColor = (code: number) => {
    if (code === 0) return "bg-gray-500" // Network error
    if (code === 399) return "bg-yellow-500" // Redirect
    if (code >= 200 && code < 300) return "bg-green-500"
    if (code >= 300 && code < 400) return "bg-yellow-500"
    if (code >= 400) return "bg-red-500"
    return "bg-gray-500"
  }

  const getStatusText = (code: number) => {
    if (code === 0) return "Error"
    if (code === 399) return "Redirect"
    return code.toString()
  }

  return (
    <span
      className={`inline-flex items-center ml-2 px-2 py-0.5 rounded text-xs font-medium text-white ${getStatusColor(statusCode)}`}>
      {getStatusText(statusCode)}
    </span>
  )
}

export default StatusBadge

import React, { useState } from "react"

const EnableDisableToggle: React.FC = () => {
  const [isEnabled, setIsEnabled] = useState(true)

  const handleToggle = () => {
    setIsEnabled(!isEnabled)
  }

  return (
    <div onClick={handleToggle}>
      {isEnabled ? (
        <svg className="w-6 h-6 text-white cursor-pointer" viewBox="0 0 24 24">
          <title data-i18n="disableOnDomain">Disable on this website</title>
          <path
            fill="currentColor"
            d="M17,7H7A5,5 0 0,0 2,12A5,5 0 0,0 7,17H17A5,5 0 0,0 22,12A5,5 0 0,0 17,7M17,15A3,3 0 0,1 14,12A3,3 0 0,1 17,9A3,3 0 0,1 20,12A3,3 0 0,1 17,15Z"></path>
        </svg>
      ) : (
        <svg className="w-6 h-6 text-white cursor-pointer" viewBox="0 0 24 24">
          <title data-i18n="disableOnDomain">Disable on this website</title>
          <path
            fill="currentColor"
            d="M17,7H7A5,5 0 0,0 2,12A5,5 0 0,0 7,17H17A5,5 0 0,0 22,12A5,5 0 0,0 17,7M7,15A3,3 0 0,1 4,12A3,3 0 0,1 7,9A3,3 0 0,1 10,12A3,3 0 0,1 7,15Z"></path>
        </svg>
      )}
    </div>
  )
}

export default EnableDisableToggle

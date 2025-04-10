import darkLogo from "data-base64:~assets/dark-logo@2x.png"
import lightLogo from "data-base64:~assets/light-logo@2x.png"
import React, { useState } from "react"

import DarkModeToggle from "./DarkModeToggle"
import EnableDisableToggle from "./EnableDisableToggle"

const Header: React.FC = () => {
  return (
    <header>
      <div className="flex items-center justify-between bg-primary-600 dark:bg-gray-400 px-4 py-2 h-14">
        <a
          href="https://chromewebstore.google.com/detail/detect-the-existence-of-a/bbeaknegaihohobilficcjkhgnmkdpol"
          className="flex items-center">
          <img
            alt="ACS Detect"
            className="h-8 w-auto block dark:hidden"
            src={lightLogo}
          />
          <img
            alt="ACS Detect"
            className="h-8 w-auto hidden dark:block"
            src={darkLogo}
          />
          <span className="text-lg pl-2 dark:text-primary-600 text-white">
            ACS Detect
          </span>
        </a>

        <div className="flex-grow"></div>

        <div className="flex items-center space-x-3">
          {/* <EnableDisableToggle /> */}

          <DarkModeToggle />
        </div>
      </div>
    </header>
  )
}

export default Header

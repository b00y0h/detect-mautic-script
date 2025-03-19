# Mautic Detector

A Chrome extension that automatically detects Mautic marketing automation installations on websites you visit.

## Features

- Automatically scans websites for Mautic installations
- Shows a green checkmark badge when Mautic is detected
- Displays the Mautic domain in the tooltip
- Stores history of detected Mautic installations
- Works in real-time as you browse

## How It Works

The extension checks for Mautic-specific indicators on web pages you visit. When a Mautic installation is detected, the extension icon will display a green checkmark (✓). You can hover over the icon to see the detected Mautic domain.

## Privacy

This extension:

- Only accesses the current webpage to detect Mautic
- Requires host permissions but only uses them with activeTab
- Never performs background scanning of websites
- Stores detected Mautic domains locally in your browser
- Does not collect or transmit any personal information
- Does not modify website content

## Permission Requirements

### Storage Permission

This permission is required to:

- Save detected Mautic domains locally in your browser
- Store a history of Mautic installations you've encountered
- Maintain a list of pages where Mautic was detected
- All data is stored locally on your device and is never transmitted externally

### Scripting Permission

This permission is required to:

- Scan web pages for Mautic-specific indicators
- Execute the detection script that identifies Mautic installations
- Update the extension badge when Mautic is detected
- No external scripts are ever loaded or executed

### ActiveTab Permission

This permission is required to:

- Access the current tab's URL to check for Mautic presence
- Only activates when you're actively viewing a webpage
- Limited to the current tab you're viewing
- Does not access browser history or other tabs

The extension uses these minimal permissions to provide its core functionality while respecting user privacy.

## For Developers and Marketers

This tool is especially useful for:

- Marketing professionals researching Mautic usage
- Developers working with Mautic installations
- Anyone interested in identifying Mautic-powered websites

## Getting Started

First, run the development server:

```bash
pnpm dev
# or
npm run dev
```

Open your browser and load the appropriate development build. For example, if you are developing for the chrome browser, using manifest v3, use: `build/chrome-mv3-dev`.

You can start editing the popup by modifying `popup.tsx`. It should auto-update as you make changes. To add an options page, simply add a `options.tsx` file to the root of the project, with a react component default exported. Likewise to add a content page, add a `content.ts` file to the root of the project, importing some module and do some logic, then reload the extension on your browser.

For further guidance, [visit our Documentation](https://docs.plasmo.com/)

## Making production build

Run the following:

```bash
pnpm build
# or
npm run build
```

This should create a production bundle for your extension, ready to be zipped and published to the stores.

## Submit to the webstores

The easiest way to deploy your Plasmo extension is to use the built-in [bpp](https://bpp.browser.market) GitHub action. Prior to using this action however, make sure to build your extension and upload the first version to the store to establish the basic credentials. Then, simply follow [this setup instruction](https://docs.plasmo.com/framework/workflows/submit) and you should be on your way for automated submission!

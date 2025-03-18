interface CustomWindow extends Window {
  eab: {
    author: string
    domain: string
  }
  MauticDomain?: string
}

declare let window: CustomWindow

export default function windowChanger() {
  const checkForMauticDomain = (): string => {
    return window.MauticDomain || ""
  }

  window.eab = {
    author: "Bob Smith",
    domain: checkForMauticDomain()
  }

  return window.eab
}

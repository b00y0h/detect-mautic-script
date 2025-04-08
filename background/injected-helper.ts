interface CustomWindow extends Window {
  detectMautic: {
    eab: {
      author: string
      domain: string
    }
    MauticDomain?: string
  }
}

declare let window: CustomWindow

export default function windowChanger() {
  if (!window.detectMautic) {
    window.detectMautic = {} as any
  }

  const checkForMauticDomain = (): string => {
    return window.detectMautic.MauticDomain || ""
  }

  window.detectMautic.eab = {
    author: "Bob Smith",
    domain: checkForMauticDomain()
  }

  return window.detectMautic.eab
}

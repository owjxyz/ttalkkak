const dark = {
  background: '#343434', panel: '#343434', input: '#454545',
  text: '#f3f3f3', border: '#f3f3f3', accent: '#f3f3f3', error: '#ff3333',
  styles: {
    '--theme-menu-panel': '#454545', '--theme-selector-background': '#454545',
    '--theme-info-shadow': '0.05em 0.05em 0.1em rgb(0, 0, 0)',
    '--theme-text-shadow': '0.05em 0.05em 0.1em rgba(0, 0, 0, 1)',
    '--theme-box-shadow': '0.1em 0.1em 0.2em rgba(0, 0, 0, 1)',
    '--theme-error-background': 'rgba(255, 75, 75, 0.22)',
    '--theme-placeholder': '#76767a', '--theme-font-hover': 'rgba(255, 255, 255, 0.12)',
    '--theme-best-hover': 'rgba(255, 255, 255, 0.12)',
    '--theme-selector-focus': 'rgba(255, 255, 255, 0.2)', '--theme-selector-outline': 'rgba(255, 255, 255, 0.4)',
    '--theme-separator': 'rgba(255, 255, 255, 0.2)',
    '--theme-selection': '#616266', '--theme-selection-text': 'var(--theme-text)',
    '--theme-preview-filter': 'brightness(1.25) contrast(1.1)',
    '--theme-preview-outline': 'rgba(255, 255, 255, 0.6)', '--theme-preview-shadow': '0 0 8px rgba(255, 255, 255, 0.4)',
  },
}

const light = {
  background: '#f3f3f3', panel: '#f3f3f3', input: '#f3f3f3',
  text: '#343434', border: '#343434', accent: '#343434', error: '#cc0000',
  styles: {
    '--theme-menu-panel': '#ffffff',
    '--theme-menu-input': 'var(--theme-menu-panel)',
    '--theme-info-shadow': '0.05em 0.05em 0.1em rgb(0, 0, 0)',
    '--theme-text-shadow': '0.05em 0.05em 0.1em rgba(0, 0, 0, 0.2)',
    '--theme-box-shadow': '0.1em 0.1em 0.2em rgba(0, 0, 0, 0.5)',
    '--theme-error-background': 'rgba(204, 0, 0, 0.16)',
    '--theme-placeholder': '#76767a',
    '--theme-selection': '#76767a', '--theme-font-hover': 'rgba(0, 0, 0, 0.08)',
    '--theme-best-hover': 'rgba(0, 0, 0, 0.08)',
    '--theme-selector-focus': 'rgba(0, 0, 0, 0.14)', '--theme-selector-outline': 'rgba(0, 0, 0, 0.3)',
    '--theme-separator': 'rgba(0, 0, 0, 0.14)',
    '--theme-preview-filter': 'brightness(0.85) contrast(1.1)',
    '--theme-preview-outline': 'rgba(0, 0, 0, 0.5)', '--theme-preview-shadow': '0 0 8px rgba(0, 0, 0, 0.3)',
  },
}

const terminal = {
  background: '#000000', panel: '#000000', input: '#000000',
  text: '#00f900', border: '#00f900', accent: '#00f900', error: '#ff0080',
  styles: {
    '--theme-info-shadow': '0.05em 0.05em 0.1em rgb(0, 0, 0)',
    '--theme-logo-shadow': '0 0 0.25em rgba(0, 249, 0, 0.75)',
    '--theme-date-shadow': '0 0 0.2em rgba(0, 249, 0, 0.7)',
    '--theme-error-background': 'rgba(255, 0, 128, 0.26)',
    '--theme-placeholder': '#76767a',
    '--theme-font-hover': 'rgba(0, 249, 0, 0.16)', '--theme-best-hover': 'rgba(0, 249, 0, 0.2)',
    '--theme-selector-focus': 'rgba(0, 249, 0, 0.28)', '--theme-selector-outline': 'rgba(0, 249, 0, 0.5)',
    '--theme-separator': 'rgba(0, 249, 0, 0.28)',
    '--theme-preview-filter': 'brightness(1.4) contrast(1.15)',
    '--theme-preview-outline': 'rgba(0, 249, 0, 0.8)', '--theme-preview-shadow': '0 0 12px rgba(0, 249, 0, 0.6)',
  },
}

const telnet = {
  background: '#00007d', panel: '#00007d', input: '#00007d',
  text: '#ffffff', border: '#ffffff', accent: '#ffffff', error: '#ff6666',
  styles: {
    '--theme-info-shadow': '0.05em 0.05em 0.1em rgb(0, 0, 0)',
    '--theme-logo-shadow': '0 0 0.2em rgba(255, 255, 255, 0.55)',
    '--theme-date-shadow': '0 0 0.18em rgba(255, 255, 255, 0.5)',
    '--theme-error-background': 'rgba(255, 102, 102, 0.28)',
    '--theme-placeholder': '#76767a',
    '--theme-font-hover': 'rgba(255, 255, 255, 0.12)', '--theme-best-hover': 'rgba(255, 255, 255, 0.2)',
    '--theme-selector-focus': 'rgba(255, 255, 255, 0.28)', '--theme-selector-outline': 'rgba(255, 255, 255, 0.5)',
    '--theme-separator': 'rgba(255, 255, 255, 0.35)',
    '--theme-preview-filter': 'brightness(1.3) contrast(1.1)',
    '--theme-preview-outline': 'rgba(255, 255, 255, 0.7)', '--theme-preview-shadow': '0 0 10px rgba(255, 255, 255, 0.5)',
  },
}

export const themeOptions = [
  { value: 'dark', label: 'Dark', colors: dark },
  { value: 'light', label: 'Light', colors: light },
  { value: 'system', label: 'System(Auto)', colors: { ...dark, styles: {
    ...dark.styles,
    '--theme-preview-background': 'linear-gradient(90deg, #343434 0%, #343434 48%, #8f8f8f 50%, #f3f3f3 52%, #f3f3f3 100%)',
    '--theme-preview-text-shadow': '0.05em 0.05em 0.1em rgba(0, 0, 0, 0.55)',
    '--theme-preview-filter': light.styles['--theme-preview-filter'],
    '--theme-preview-outline': light.styles['--theme-preview-outline'],
    '--theme-preview-shadow': light.styles['--theme-preview-shadow'],
  } } },
  { value: 'terminal', label: 'Terminal', colors: terminal },
  { value: 'telnet', label: 'Telnet', colors: telnet },
]

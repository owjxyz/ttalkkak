export const colorFields = [
  ['background', '화면 배경'],
  ['panel', '패널 배경'],
  ['input', '입력란 배경'],
  ['text', '글자'],
  ['border', '테두리'],
  ['accent', '강조색'],
  ['error', '오타색'],
]

export function readPreference(key, fallback) {
  try { return localStorage.getItem(key) ?? fallback }
  catch { return fallback }
}

export function fontURL(value) {
  if (typeof value !== 'string' || value.length > 2048) throw new Error('올바른 폰트 파일 URL을 입력해 주세요.')
  const url = new URL(value.trim())
  if (url.protocol !== 'https:' || url.username || url.password) throw new Error('HTTPS 폰트 파일 URL을 입력해 주세요.')
  return url.href
}

export function readCustomization() {
  const settings = { fonts: [], themes: [] }
  // ponytail: O(n²) duplicate checks; use Sets if saved preset lists become large.
  const validName = name => typeof name === 'string' && name.trim().length > 0 && name.length <= 60
  try {
    const saved = JSON.parse(localStorage.getItem('Customization'))
    if (Array.isArray(saved?.fonts)) {
      for (const font of saved.fonts) {
        if (!validName(font?.name) || !/^custom-font:[\da-f-]{36}$/.test(font.id)) continue
        if (settings.fonts.some(item => item.id === font.id || item.name === font.name.trim())) continue
        try { settings.fonts.push({ id: font.id, name: font.name.trim(), url: fontURL(font.url) }) }
        catch { /* One invalid local font must not hide other saved presets. */ }
      }
    }
    if (Array.isArray(saved?.themes)) {
      for (const savedTheme of saved.themes) {
        const theme = { ...savedTheme, input: savedTheme?.input === undefined ? savedTheme?.panel : savedTheme.input }
        if (!validName(theme?.name) || !/^custom-theme:[\da-f-]{36}$/.test(theme.id)) continue
        if (!colorFields.every(([key]) => /^#[\da-f]{6}$/i.test(theme[key]))) continue
        if (settings.themes.some(item => item.id === theme.id || item.name === theme.name.trim())) continue
        settings.themes.push({ id: theme.id, name: theme.name.trim(), ...Object.fromEntries(colorFields.map(([key]) => [key, theme[key]])), shadow: theme.shadow === true, textShadow: theme.textShadow === true })
      }
    }
  } catch { /* Missing or damaged local settings use the built-in options. */ }
  return settings
}

export async function loadWebFont(value) {
  let url
  try { url = fontURL(value) }
  catch { throw new Error('HTTPS 폰트 파일 URL을 입력해 주세요.') }
  const face = new FontFace(`TtalkkakCustom_${crypto.randomUUID().replaceAll('-', '')}`, `url(${JSON.stringify(url)})`)
  let timeout
  try {
    await Promise.race([
      face.load(),
      new Promise((_, reject) => { timeout = setTimeout(() => reject(new Error()), 10000) }),
    ])
    return face
  } catch {
    throw new Error('폰트를 불러오지 못했습니다. 폰트 파일 주소와 외부 사용 허용(CORS)을 확인해 주세요.')
  } finally { clearTimeout(timeout) }
}

export function themeVariables(colors) {
  return {
    ...Object.fromEntries(colorFields.map(([key]) => [`--theme-${key}`, colors[key]])),
    '--theme-menu-panel': 'var(--theme-panel)', '--theme-selector-background': 'var(--theme-panel)',
    '--theme-menu-input': 'var(--theme-input)',
    '--theme-text-shadow': colors.textShadow === true ? '0.05em 0.05em 0.1em rgba(0, 0, 0, 0.5)' : 'none',
    '--theme-info-shadow': 'var(--theme-text-shadow)',
    '--theme-box-shadow': colors.shadow === true ? '0.1em 0.1em 0.2em rgba(0, 0, 0, 0.5)' : 'none',
    '--theme-logo-shadow': 'var(--theme-text-shadow)', '--theme-date-shadow': 'var(--theme-text-shadow)',
    '--theme-error-background': 'color-mix(in srgb, var(--theme-error), transparent 80%)',
    '--theme-progress-track': 'rgba(150, 150, 150, 0.3)',
    '--theme-placeholder': 'color-mix(in srgb, var(--theme-text), transparent 45%)',
    '--theme-selection': 'var(--theme-accent)', '--theme-selection-text': 'var(--theme-background)',
    '--theme-font-hover': 'color-mix(in srgb, var(--theme-text), transparent 88%)',
    '--theme-best-hover': 'color-mix(in srgb, var(--theme-text), transparent 88%)',
    '--theme-selector-focus': 'color-mix(in srgb, var(--theme-text), transparent 80%)',
    '--theme-selector-outline': 'color-mix(in srgb, var(--theme-text), transparent 60%)',
    '--theme-separator': 'color-mix(in srgb, var(--theme-text), transparent 80%)',
    '--theme-preview-background': 'var(--theme-panel)', '--theme-preview-text-shadow': 'var(--theme-text-shadow)',
    '--theme-preview-filter': 'brightness(1.1)',
    '--theme-preview-outline': 'color-mix(in srgb, var(--theme-text), transparent 40%)',
    '--theme-preview-shadow': '0 0 8px color-mix(in srgb, var(--theme-text), transparent 60%)',
    ...colors.styles,
  }
}

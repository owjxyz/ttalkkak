export const colorFields = [
  ['background', '화면 배경'],
  ['panel', '패널 배경'],
  ['input', '텍스트 입력란 배경'],
  ['text', '기본 글자'],
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
        settings.themes.push({ id: theme.id, name: theme.name.trim(), ...Object.fromEntries(colorFields.map(([key]) => [key, theme[key]])) })
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
  return Object.fromEntries(colorFields.map(([key]) => [`--custom-${key}`, colors[key]]))
}

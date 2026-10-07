import test from 'node:test'
import assert from 'node:assert/strict'
import { readCustomization, themeVariables } from './customization.js'

test('saved themes keep separate panel and input colors, including older themes', () => {
  const theme = {
    id: 'custom-theme:00000000-0000-4000-8000-000000000001', name: 'Ocean',
    background: '#123456', panel: '#234567', text: '#ffffff',
    border: '#456789', accent: '#56789a', error: '#ff3333',
  }
  const previous = globalThis.localStorage
  let saved = { themes: [theme] }
  globalThis.localStorage = { getItem: () => JSON.stringify(saved) }
  try {
    const migrated = readCustomization().themes[0]
    assert.equal(migrated.input, theme.panel, 'Older themes must retain their input color')
    assert.equal(migrated.shadow, false, 'Older themes must retain their shadow-free panels')
    assert.equal(themeVariables(migrated)['--theme-box-shadow'], 'none')
    saved = { themes: [{ ...theme, input: '#345678' }] }
    const restored = readCustomization().themes[0]
    assert.equal(restored.panel, '#234567')
    assert.equal(restored.input, '#345678')
    assert.equal(themeVariables(restored)['--theme-input'], '#345678')
    saved = { themes: [{ ...theme, shadow: true }] }
    const withShadow = readCustomization().themes[0]
    assert.equal(withShadow.shadow, true, 'Panel shadow preference must survive storage')
    assert.notEqual(themeVariables(withShadow)['--theme-box-shadow'], 'none')
    assert.equal(themeVariables(withShadow)['--theme-text-shadow'], 'none', 'Panel shadows must not add text shadows')
    saved = { themes: [{ ...theme, textShadow: true }] }
    const withTextShadow = readCustomization().themes[0]
    assert.equal(withTextShadow.textShadow, true, 'Text shadow preference must survive storage')
    assert.notEqual(themeVariables(withTextShadow)['--theme-text-shadow'], 'none')
    assert.equal(themeVariables(withTextShadow)['--theme-box-shadow'], 'none', 'Text shadows must not add panel shadows')
    saved = { themes: [{ ...theme, shadow: 'true' }] }
    assert.equal(readCustomization().themes[0].shadow, false, 'Invalid shadow preferences must use the safe default')
    assert.equal(readCustomization().themes[0].textShadow, false, 'Older themes must retain their shadow-free text')
    saved = { themes: [{ ...theme, input: 'invalid' }] }
    assert.equal(readCustomization().themes.length, 0)
  } finally {
    if (previous === undefined) delete globalThis.localStorage
    else globalThis.localStorage = previous
  }
})

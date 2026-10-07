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
    saved = { themes: [{ ...theme, input: '#345678' }] }
    const restored = readCustomization().themes[0]
    assert.equal(restored.panel, '#234567')
    assert.equal(restored.input, '#345678')
    assert.equal(themeVariables(restored)['--custom-input'], '#345678')
    saved = { themes: [{ ...theme, input: 'invalid' }] }
    assert.equal(readCustomization().themes.length, 0)
  } finally {
    if (previous === undefined) delete globalThis.localStorage
    else globalThis.localStorage = previous
  }
})

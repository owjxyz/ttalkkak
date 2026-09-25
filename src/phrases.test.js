import test from 'node:test'
import assert from 'node:assert/strict'
import { loadPhrases, randomOtherIndex } from './phrases.js'

test('loading failure reports a usable error', async () => {
  await assert.rejects(loadPhrases('/phrase.json', undefined, async () => ({ ok: false })), /문장을 불러오지 못했습니다/)
})

test('a failed request can be retried', async () => {
  let calls = 0
  const fetcher = async () => {
    if (++calls === 1) throw new Error('offline')
    return { ok: true, json: async () => ({ quotes: ['다시 시작'] }) }
  }
  await assert.rejects(loadPhrases('/phrase.json', undefined, fetcher), /문장을 불러오지 못했습니다/)
  assert.deepEqual(await loadPhrases('/phrase.json', undefined, fetcher), ['다시 시작'])
})

test('empty or malformed data has no usable phrases', async () => {
  for (const data of [{ quotes: [] }, { quotes: [null, 0, '  '] }, {}]) {
    await assert.rejects(loadPhrases('/phrase.json', undefined, async () => ({ ok: true, json: async () => data })), /연습할 문장이 없습니다/)
  }
})

test('invalid entries are skipped and one valid phrase remains usable', async () => {
  const phrases = await loadPhrases('/phrase.json', undefined, async () => ({
    ok: true,
    json: async () => ({ quotes: [null, '', '테스트', 7] }),
  }))
  assert.deepEqual(phrases, ['테스트'])
})

test('one phrase stays selectable while multiple phrases rotate away from the current one', () => {
  assert.equal(randomOtherIndex(1, 0), 0)
  for (let i = 0; i < 20; i++) assert.notEqual(randomOtherIndex(3, 1), 1)
})

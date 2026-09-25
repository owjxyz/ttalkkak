import test from 'node:test'
import assert from 'node:assert/strict'
import { analyzeTyping, getActiveIndex, getCharacterAccuracy, stripAdvanceSpace } from './typing.js'

test('finished Korean syllable counts a missing final consonant as an error', () => {
  assert.deepEqual(analyzeTyping('강', '가'), {
    correct: 2,
    total: 3,
    wrongIndices: [0],
  })
})

test('a syllable being composed accepts a matching prefix', () => {
  assert.deepEqual(analyzeTyping('강', '가', 0), {
    correct: 2,
    total: 2,
    wrongIndices: [],
  })
})

test('composition in the middle does not forgive a later incomplete syllable', () => {
  assert.deepEqual(analyzeTyping('강강', '가가', 0), {
    correct: 4,
    total: 5,
    wrongIndices: [1],
  })
})

test('temporary next consonant is not an error while composing', () => {
  assert.deepEqual(analyzeTyping('가나', '간', 0), {
    correct: 2,
    total: 2,
    wrongIndices: [],
  })
  assert.deepEqual(analyzeTyping('가나', '간'), {
    correct: 2,
    total: 3,
    wrongIndices: [0],
  })
  assert.deepEqual(analyzeTyping('가다', '간', 0).wrongIndices, [0])
})

test('temporary next consonant after a compound vowel is not an error while composing', () => {
  assert.deepEqual(analyzeTyping('퀴나', '퀸', 0), {
    correct: 3,
    total: 3,
    wrongIndices: [],
  })
  assert.deepEqual(analyzeTyping('퀴나', '퀸').wrongIndices, [0])
  assert.deepEqual(analyzeTyping('퀴다', '퀸', 0).wrongIndices, [0])
})

test('temporary compound final from the next initial is not an error while composing', () => {
  assert.deepEqual(analyzeTyping('실험', '싫', 0), {
    correct: 3,
    total: 3,
    wrongIndices: [],
  })
  assert.deepEqual(analyzeTyping('실험', '싫').wrongIndices, [0])
  assert.deepEqual(analyzeTyping('실가', '싫', 0).wrongIndices, [0])
  assert.deepEqual(analyzeTyping('갈가', '갉', 0).wrongIndices, [])
})

test('space used to advance is excluded from the submitted phrase', () => {
  assert.equal(stripAdvanceSpace('가', '가 '), '가')
  assert.equal(stripAdvanceSpace('가 ', '가 '), '가 ')
  assert.equal(stripAdvanceSpace('가', '가  '), '가 ')
})

test('wrong and extra input produce wrong indices', () => {
  assert.deepEqual(analyzeTyping('가', '나가'), {
    correct: 1,
    total: 4,
    wrongIndices: [0, 1],
  })
})

test('accuracy counts whole typed characters, including extra input', () => {
  assert.equal(getCharacterAccuracy('가다', analyzeTyping('가나', '가다').wrongIndices), 50)
  assert.equal(getCharacterAccuracy('가', analyzeTyping('강', '가').wrongIndices), 0)
  assert.equal(getCharacterAccuracy('가가', analyzeTyping('가', '가가').wrongIndices), 50)
  assert.equal(getCharacterAccuracy('간', analyzeTyping('가나', '간', 0).wrongIndices), 100)
  assert.equal(getCharacterAccuracy('', analyzeTyping('가', '').wrongIndices), 100)
})

test('underline stays on the character at the input caret', () => {
  assert.equal(getActiveIndex(3, 0, 0), 0)
  assert.equal(getActiveIndex(3, 1, 1), 0)
  assert.equal(getActiveIndex(3, 2, 2), 1)
  assert.equal(getActiveIndex(3, 2, 1), 0)
  assert.equal(getActiveIndex(3, 5, 5), 2)
})

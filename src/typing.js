import Hangul from 'hangul-js'

export function analyzeTyping(phrase, input, composingIndex = -1) {
  let correct = 0
  let total = 0
  const wrongIndices = []

  for (let i = 0; i < input.length; i++) {
    const actual = Hangul.disassemble(input[i])
    const expected = phrase[i] === undefined ? [] : Hangul.disassemble(phrase[i])
    const nextInitial = phrase[i + 1] === undefined ? undefined : Hangul.disassemble(phrase[i + 1])[0]
    // During IME composition, the next initial consonant may briefly appear as this syllable's final consonant.
    const borrowedNextInitial = i === composingIndex && expected.length === 2 && actual.length === 3
      && actual[0] === expected[0] && actual[1] === expected[1] && actual[2] === nextInitial
    const count = borrowedNextInitial
      ? expected.length
      : i === composingIndex
      ? actual.length
      : Math.max(actual.length, expected.length)
    let wrong = expected.length === 0

    for (let j = 0; j < count; j++) {
      total++
      if (actual[j] === expected[j] && actual[j] !== undefined) correct++
      else wrong = true
    }
    if (wrong) wrongIndices.push(i)
  }

  return { correct, total, wrongIndices }
}

export function getActiveIndex(phraseLength, inputLength, selectionStart) {
  if (phraseLength === 0) return -1
  if (inputLength === 0) return 0
  return Math.min(phraseLength - 1, Math.max(0, selectionStart - 1))
}

export function stripAdvanceSpace(phrase, input) {
  return input.length > phrase.length && input.endsWith(' ') ? input.slice(0, -1) : input
}

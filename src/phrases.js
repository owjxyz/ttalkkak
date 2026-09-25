export async function loadPhrases(url, signal, fetcher = fetch) {
  let data
  try {
    const response = await fetcher(url, { signal })
    if (!response.ok) throw new Error('Request failed')
    data = await response.json()
  } catch (error) {
    if (error?.name === 'AbortError') throw error
    throw new Error('문장을 불러오지 못했습니다.')
  }

  const phrases = Array.isArray(data?.quotes)
    ? data.quotes.filter(phrase => typeof phrase === 'string' && phrase.trim())
    : []
  if (phrases.length === 0) throw new Error('연습할 문장이 없습니다.')
  return phrases
}

export function randomOtherIndex(length, currentIndex) {
  if (length < 2) return 0
  const index = Math.floor(Math.random() * (length - 1))
  return index >= currentIndex ? index + 1 : index
}

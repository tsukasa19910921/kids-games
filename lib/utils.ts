/**
 * Utility functions for text normalization and shiritori game logic
 * 文字正規化としりとりゲームロジックのためのユーティリティ関数
 */

/**
 * Remove special characters, punctuation, and spaces
 * 特殊文字、句読点、スペースを除去
 */
export function removeSpecialCharacters(text: string): string {
  return text
    .replace(/[。、！？\s　「」『』（）()［］\[\]｛｝{}〈〉《》【】〔〕・]/g, '')
    .replace(/[.,!?\-]/g, '')
}

/**
 * Normalize kana text according to shiritori rules
 * しりとりルールに従ってかなテキストを正規化
 *
 * Rules:
 * - Convert katakana to hiragana
 * - Convert small kana to regular kana
 * - Remove long vowel marks (ー)
 * - Remove punctuation and spaces
 */
export function normalizeKana(text: string): string {
  let normalized = text

  // Remove special characters first
  normalized = removeSpecialCharacters(normalized)

  // Convert katakana to hiragana (excluding special characters like ー)
  normalized = normalized.replace(/[\u30A1-\u30F6]/g, (char) => {
    // Skip the long vowel mark ー (U+30FC)
    if (char === 'ー') return char
    return String.fromCharCode(char.charCodeAt(0) - 0x60)
  })

  // Convert small kana to regular kana
  const smallKanaMap: Record<string, string> = {
    'ぁ': 'あ', 'ぃ': 'い', 'ぅ': 'う', 'ぇ': 'え', 'ぉ': 'お',
    'ゃ': 'や', 'ゅ': 'ゆ', 'ょ': 'よ',
    'ゎ': 'わ', 'ゐ': 'い', 'ゑ': 'え',
    'ァ': 'あ', 'ィ': 'い', 'ゥ': 'う', 'ェ': 'え', 'ォ': 'お',
    'ヵ': 'か', 'ヶ': 'け',
    'ャ': 'や', 'ュ': 'ゆ', 'ョ': 'よ',
    'ヮ': 'わ', 'ヰ': 'い', 'ヱ': 'え',
    'っ': 'つ', 'ッ': 'つ'
  }

  normalized = normalized.replace(
    /[ぁぃぅぇぉゃゅょゎゐゑァィゥェォヵヶャュョヮヰヱっッ]/g,
    (char) => smallKanaMap[char] || char
  )

  // Remove long vowel marks
  normalized = normalized.replace(/ー/g, '')

  return normalized
}

/**
 * Get the last kana character for shiritori
 * しりとりのための最後のかな文字を取得
 *
 * Special rules:
 * - If ends with ん, return ん
 * - If ends with っ (small tsu), return the character before it
 * - Otherwise return the last character
 */
export function getLastKana(word: string): string {
  if (!word) return ''

  // Check if the original word (not normalized) ends with っ
  const trimmed = removeSpecialCharacters(word)
  const endsWithSmallTsu = trimmed.endsWith('っ') || trimmed.endsWith('ッ')

  const normalized = normalizeKana(word)
  if (!normalized) return ''

  // If ends with ん, return it
  if (normalized.endsWith('ん')) {
    return 'ん'
  }

  // If original ended with っ, return the character before the last one
  if (endsWithSmallTsu && normalized.length >= 2) {
    // The っ was normalized to つ, so we need the character before つ
    return normalized[normalized.length - 2]
  }

  // For combinations that got normalized (like きょ -> きよ)
  // We need to return just the last character (よ -> よ)
  const lastChar = normalized[normalized.length - 1]
  return lastChar
}

/**
 * Get the first kana character for shiritori
 * しりとりのための最初のかな文字を取得
 */
export function getFirstKana(word: string): string {
  if (!word) return ''

  const normalized = normalizeKana(word)
  if (!normalized) return ''

  return normalized[0]
}

/**
 * Check if two words form a valid shiritori chain
 * 2つの単語が有効なしりとりチェーンを形成するかチェック
 */
export function isValidChain(previousWord: string, nextWord: string): boolean {
  if (!previousWord || !nextWord) return false

  const lastKana = getLastKana(previousWord)
  const firstKana = getFirstKana(nextWord)

  if (!lastKana || !firstKana) return false

  // The last kana of the previous word should match the first kana of the next word
  return lastKana === firstKana
}

/**
 * Check if text contains kanji characters
 * テキストに漢字が含まれているかチェック
 */
export function containsKanji(text: string): boolean {
  // Kanji Unicode range: U+4E00 to U+9FFF
  const kanjiRegex = /[\u4E00-\u9FFF]/
  return kanjiRegex.test(text)
}

/**
 * Check if text is only hiragana and katakana
 * テキストがひらがなとカタカナのみかチェック
 */
export function isOnlyKana(text: string): boolean {
  const cleaned = removeSpecialCharacters(text)
  // Hiragana: U+3040-U+309F, Katakana: U+30A0-U+30FF
  const kanaRegex = /^[\u3040-\u309F\u30A0-\u30FFー]+$/
  return kanaRegex.test(cleaned)
}
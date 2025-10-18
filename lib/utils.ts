/**
 * Utility functions for text normalization and shiritori game logic
 * 文字正規化としりとりゲームロジックのためのユーティリティ関数
 */

import kuromoji from 'kuromoji'

// Tokenizer singleton instance
let tokenizerInstance: kuromoji.Tokenizer<kuromoji.IpadicFeatures> | null = null
let tokenizerPromise: Promise<kuromoji.Tokenizer<kuromoji.IpadicFeatures>> | null = null

/**
 * Get or initialize the kuromoji tokenizer (singleton pattern)
 * kuromoji トークナイザーの取得または初期化（シングルトンパターン）
 */
function getTokenizer(): Promise<kuromoji.Tokenizer<kuromoji.IpadicFeatures>> {
  if (tokenizerInstance) {
    return Promise.resolve(tokenizerInstance)
  }

  if (tokenizerPromise) {
    return tokenizerPromise
  }

  tokenizerPromise = new Promise((resolve, reject) => {
    kuromoji.builder({ dicPath: '/dict' }).build((err, tokenizer) => {
      if (err) {
        tokenizerPromise = null
        reject(err)
      } else {
        tokenizerInstance = tokenizer
        resolve(tokenizer)
      }
    })
  })

  return tokenizerPromise
}

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
 * Normalize kana text for display and typing (keeps long vowel marks)
 * 表示・タイピング用のかな正規化（長音記号を保持）
 *
 * Rules:
 * - Convert katakana to hiragana
 * - Convert small kana to regular kana
 * - Keep long vowel marks (ー)
 * - Remove punctuation and spaces
 */
export function normalizeKanaKeepLongVowel(text: string): string {
  let normalized = text

  // Remove special characters first
  normalized = removeSpecialCharacters(normalized)

  // Convert katakana to hiragana (preserves ー)
  normalized = katakanaToHiragana(normalized)

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

  // Keep long vowel marks (do not remove ー)
  return normalized
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
  // Use the function that keeps long vowel marks first
  let normalized = normalizeKanaKeepLongVowel(text)

  // Remove long vowel marks for shiritori rule matching
  normalized = normalized.replace(/ー/g, '')

  return normalized
}

/**
 * Get the last kana character for shiritori
 * しりとりのための最後のかな文字を取得
 *
 * Special rules:
 * - If ends with ー (long vowel mark), remove it and get the last character
 * - If ends with ん, return ん
 * - If ends with っ (small tsu), return the character before it
 * - Otherwise return the last character
 */
export function getLastKana(word: string): string {
  if (!word) return ''

  // Check if the original word (not normalized) ends with っ
  const trimmed = removeSpecialCharacters(word)
  const endsWithSmallTsu = trimmed.endsWith('っ') || trimmed.endsWith('ッ')

  // First normalize while keeping long vowel marks
  const normalizedWithLongVowel = normalizeKanaKeepLongVowel(word)

  // If ends with ー, remove it (for shiritori rule)
  let normalized = normalizedWithLongVowel
  while (normalized.endsWith('ー') && normalized.length > 1) {
    normalized = normalized.slice(0, -1)
  }

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

/**
 * Romaji conversion table (uppercase)
 * ローマ字変換テーブル（大文字）
 */
const ROMAJI_TABLE: Record<string, string> = {
  // あ行
  'あ': 'A', 'い': 'I', 'う': 'U', 'え': 'E', 'お': 'O',
  // か行
  'か': 'KA', 'き': 'KI', 'く': 'KU', 'け': 'KE', 'こ': 'KO',
  'が': 'GA', 'ぎ': 'GI', 'ぐ': 'GU', 'げ': 'GE', 'ご': 'GO',
  // さ行
  'さ': 'SA', 'し': 'SHI', 'す': 'SU', 'せ': 'SE', 'そ': 'SO',
  'ざ': 'ZA', 'じ': 'JI', 'ず': 'ZU', 'ぜ': 'ZE', 'ぞ': 'ZO',
  // た行
  'た': 'TA', 'ち': 'CHI', 'つ': 'TSU', 'て': 'TE', 'と': 'TO',
  'だ': 'DA', 'ぢ': 'DI', 'づ': 'DU', 'で': 'DE', 'ど': 'DO',
  // な行
  'な': 'NA', 'に': 'NI', 'ぬ': 'NU', 'ね': 'NE', 'の': 'NO',
  // は行
  'は': 'HA', 'ひ': 'HI', 'ふ': 'FU', 'へ': 'HE', 'ほ': 'HO',
  'ば': 'BA', 'び': 'BI', 'ぶ': 'BU', 'べ': 'BE', 'ぼ': 'BO',
  'ぱ': 'PA', 'ぴ': 'PI', 'ぷ': 'PU', 'ぺ': 'PE', 'ぽ': 'PO',
  // ま行
  'ま': 'MA', 'み': 'MI', 'む': 'MU', 'め': 'ME', 'も': 'MO',
  // や行
  'や': 'YA', 'ゆ': 'YU', 'よ': 'YO',
  // ら行
  'ら': 'RA', 'り': 'RI', 'る': 'RU', 'れ': 'RE', 'ろ': 'RO',
  // わ行
  'わ': 'WA', 'ゐ': 'WI', 'ゑ': 'WE', 'を': 'WO', 'ん': 'N',
  // きゃ行
  'きゃ': 'KYA', 'きゅ': 'KYU', 'きょ': 'KYO',
  'ぎゃ': 'GYA', 'ぎゅ': 'GYU', 'ぎょ': 'GYO',
  // しゃ行
  'しゃ': 'SHA', 'しゅ': 'SHU', 'しょ': 'SHO',
  'じゃ': 'JA', 'じゅ': 'JU', 'じょ': 'JO',
  // ちゃ行
  'ちゃ': 'CHA', 'ちゅ': 'CHU', 'ちょ': 'CHO',
  'ぢゃ': 'DYA', 'ぢゅ': 'DYU', 'ぢょ': 'DYO',
  // にゃ行
  'にゃ': 'NYA', 'にゅ': 'NYU', 'にょ': 'NYO',
  // ひゃ行
  'ひゃ': 'HYA', 'ひゅ': 'HYU', 'ひょ': 'HYO',
  'びゃ': 'BYA', 'びゅ': 'BYU', 'びょ': 'BYO',
  'ぴゃ': 'PYA', 'ぴゅ': 'PYU', 'ぴょ': 'PYO',
  // みゃ行
  'みゃ': 'MYA', 'みゅ': 'MYU', 'みょ': 'MYO',
  // りゃ行
  'りゃ': 'RYA', 'りゅ': 'RYU', 'りょ': 'RYO',
  // 小文字（単独の場合）
  'ぁ': 'A', 'ぃ': 'I', 'ぅ': 'U', 'ぇ': 'E', 'ぉ': 'O',
  'ゃ': 'YA', 'ゅ': 'YU', 'ょ': 'YO',
  'ゎ': 'WA', 'っ': 'XTU',
}

/**
 * Convert katakana to hiragana
 * カタカナをひらがなに変換
 *
 * @param text - カタカナ文字列
 * @returns ひらがな文字列
 */
export function katakanaToHiragana(text: string): string {
  if (!text) return ''
  return text.replace(/[\u30A1-\u30F6]/g, (char) => {
    // Skip the long vowel mark ー (U+30FC)
    if (char === 'ー') return char
    return String.fromCharCode(char.charCodeAt(0) - 0x60)
  })
}

/**
 * Convert hiragana/katakana to uppercase romaji
 * ひらがな/カタカナを大文字ローマ字に変換
 *
 * @param kana - ひらがなまたはカタカナ文字列
 * @returns 大文字のローマ字文字列
 */
export function kanaToRomaji(kana: string): string {
  if (!kana) return ''

  // カタカナをひらがなに変換
  let hiragana = katakanaToHiragana(kana)

  // 長音記号は保持（タイピング用に"-"に変換）

  let result = ''
  let i = 0

  while (i < hiragana.length) {
    // 長音記号の処理
    if (hiragana[i] === 'ー') {
      result += '-'
      i++
      continue
    }

    // 促音（っ）の処理
    if (hiragana[i] === 'っ' || hiragana[i] === 'ッ') {
      // 次の文字の子音を重ねる
      if (i + 1 < hiragana.length) {
        const nextRomaji = ROMAJI_TABLE[hiragana[i + 1]] || hiragana[i + 1].toUpperCase()
        // 子音を取得（最初の文字または最初の子音文字）
        const consonant = nextRomaji.match(/^[BCDFGHJKLMNPQRSTVWXYZ]/) ? nextRomaji[0] : 'T'
        result += consonant
      } else {
        result += 'XTU'
      }
      i++
      continue
    }

    // 2文字の組み合わせをチェック（きゃ、しゃなど）
    if (i + 1 < hiragana.length) {
      const twoChar = hiragana.substring(i, i + 2)
      if (ROMAJI_TABLE[twoChar]) {
        result += ROMAJI_TABLE[twoChar]
        i += 2
        continue
      }
    }

    // 1文字の変換
    const oneChar = hiragana[i]
    if (ROMAJI_TABLE[oneChar]) {
      result += ROMAJI_TABLE[oneChar]
    } else {
      result += oneChar.toUpperCase()
    }
    i++
  }

  return result
}

/**
 * Get romaji for typing practice
 * タイピング練習用のローマ字を取得（複数のパターンを返す）
 *
 * @param kana - ひらがなまたはカタカナ文字列
 * @returns ローマ字のパターン配列（最初が推奨パターン）
 */
export function getTypingRomaji(kana: string): string[] {
  const primary = kanaToRomaji(kana)
  const alternatives: string[] = [primary]

  // 代替パターンを追加（例：SHI→SI、CHI→TI、TSU→TU）
  const alt1 = primary.replace(/SHI/g, 'SI').replace(/CHI/g, 'TI').replace(/TSU/g, 'TU')
  if (alt1 !== primary && !alternatives.includes(alt1)) {
    alternatives.push(alt1)
  }

  // JI→ZI の代替
  const alt2 = primary.replace(/JI/g, 'ZI')
  if (alt2 !== primary && !alternatives.includes(alt2)) {
    alternatives.push(alt2)
  }

  // FU→HU の代替
  const alt3 = primary.replace(/FU/g, 'HU')
  if (alt3 !== primary && !alternatives.includes(alt3)) {
    alternatives.push(alt3)
  }

  return alternatives
}

/**
 * Convert kana to romaji segments for visual grouping
 * ひらがなをローマ字セグメントに変換（視覚的グループ化用）
 *
 * @param kana - ひらがなまたはカタカナ文字列
 * @returns ひらがなとローマ字のペア配列
 */
export function kanaToRomajiSegments(kana: string): Array<{ kana: string, romaji: string }> {
  if (!kana) return []

  // カタカナをひらがなに変換
  let hiragana = katakanaToHiragana(kana)

  // 長音記号は保持

  const segments: Array<{ kana: string, romaji: string }> = []
  let i = 0

  while (i < hiragana.length) {
    // 長音記号の処理
    if (hiragana[i] === 'ー') {
      segments.push({ kana: 'ー', romaji: '-' })
      i++
      continue
    }

    // 促音（っ）の処理
    if (hiragana[i] === 'っ' || hiragana[i] === 'ッ') {
      // 次の文字の子音を重ねる
      if (i + 1 < hiragana.length) {
        const nextRomaji = ROMAJI_TABLE[hiragana[i + 1]] || hiragana[i + 1].toUpperCase()
        const consonant = nextRomaji.match(/^[BCDFGHJKLMNPQRSTVWXYZ]/) ? nextRomaji[0] : 'T'
        segments.push({ kana: hiragana[i], romaji: consonant })
      } else {
        segments.push({ kana: hiragana[i], romaji: 'XTU' })
      }
      i++
      continue
    }

    // 2文字の組み合わせをチェック（きゃ、しゃなど）
    if (i + 1 < hiragana.length) {
      const twoChar = hiragana.substring(i, i + 2)
      if (ROMAJI_TABLE[twoChar]) {
        segments.push({ kana: twoChar, romaji: ROMAJI_TABLE[twoChar] })
        i += 2
        continue
      }
    }

    // 1文字の変換
    const oneChar = hiragana[i]
    if (ROMAJI_TABLE[oneChar]) {
      segments.push({ kana: oneChar, romaji: ROMAJI_TABLE[oneChar] })
    } else {
      segments.push({ kana: oneChar, romaji: oneChar.toUpperCase() })
    }
    i++
  }

  return segments
}

/**
 * Convert numbers and full-width alphanumeric characters to hiragana
 * 数字・全角英数をひらがなに変換
 *
 * @param text - 変換する文字列
 * @returns ひらがなに変換された文字列
 */
export function convertNumbersToHiragana(text: string): string {
  if (!text) return ''

  // 全角英数字を半角に変換
  let converted = text.replace(/[Ａ-Ｚａ-ｚ０-９]/g, (char) => {
    return String.fromCharCode(char.charCodeAt(0) - 0xFEE0)
  })

  // 数字の読みマップ（0-9）
  const numberMap: Record<string, string> = {
    '0': 'ぜろ',
    '1': 'いち',
    '2': 'に',
    '3': 'さん',
    '4': 'よん',
    '5': 'ご',
    '6': 'ろく',
    '7': 'なな',
    '8': 'はち',
    '9': 'きゅう'
  }

  // 数字を1文字ずつひらがなに変換
  converted = converted.replace(/[0-9]/g, (digit) => {
    return numberMap[digit] || digit
  })

  // 全角英字を小文字化（そのまま残す or 削除するかは要件次第）
  // ここでは基本的に英字は削除する想定
  converted = converted.replace(/[A-Za-z]/g, '')

  return converted
}

/**
 * Calculate the proportion of kana characters in text
 * テキスト内のかな文字の比率を計算
 *
 * @param text - チェックする文字列
 * @returns かな文字の比率（0.0 〜 1.0）
 */
export function calculateKanaProportion(text: string): number {
  if (!text) return 0

  const cleaned = removeSpecialCharacters(text)
  if (cleaned.length === 0) return 0

  // ひらがな・カタカナの文字数をカウント
  const kanaCount = (cleaned.match(/[\u3040-\u309F\u30A0-\u30FF]/g) || []).length
  return kanaCount / cleaned.length
}

/**
 * Create a promise that rejects after a timeout
 * タイムアウト付きのPromiseを作成
 */
function withTimeout<T>(promise: Promise<T>, timeoutMs: number): Promise<T> {
  return Promise.race([
    promise,
    new Promise<T>((_, reject) =>
      setTimeout(() => reject(new Error('Timeout')), timeoutMs)
    )
  ])
}

/**
 * Preload kuromoji dictionary (call this on game initialization)
 * kuromoji辞書の事前ロード（ゲーム初期化時に呼び出す）
 *
 * @returns true if successfully loaded, false otherwise
 */
export async function preloadKuromojiDictionary(): Promise<boolean> {
  try {
    console.log('Preloading kuromoji dictionary...')
    await withTimeout(getTokenizer(), 5000)
    console.log('Dictionary loaded successfully')
    return true
  } catch (error) {
    console.warn('Failed to preload dictionary:', error)
    return false
  }
}

/**
 * Convert kanji to hiragana using morphological analysis (kuromoji)
 * 形態素解析を使った漢字→ひらがな変換
 *
 * @param text - 漢字を含む文字列
 * @param timeoutMs - タイムアウト時間（ミリ秒）デフォルト: 3000ms
 * @returns ひらがなに変換された文字列
 */
export async function convertKanjiToHiragana(
  text: string,
  timeoutMs: number = 3000
): Promise<string> {
  if (!text) return ''

  // 漢字が含まれていない場合はそのまま返す
  if (!containsKanji(text)) {
    return text
  }

  try {
    // タイムアウト付きで辞書をロード
    const tokenizer = await withTimeout(getTokenizer(), timeoutMs)
    const tokens = tokenizer.tokenize(text)

    // 各トークンの読みを連結
    const katakana = tokens
      .map(token => {
        // reading がある場合はそれを使用、なければ surface_form（元の文字列）
        return token.reading || token.surface_form
      })
      .join('')

    // カタカナをひらがなに変換
    return katakanaToHiragana(katakana)
  } catch (error) {
    if (error instanceof Error && error.message === 'Timeout') {
      console.warn('Kanji conversion timed out, using original text:', text)
    } else {
      console.error('Failed to convert kanji to hiragana:', error)
    }
    // エラー時は元のテキストを返す（フォールバック）
    // ゲームのバリデーションで漢字チェックされるため、そこで弾かれる
    return text
  }
}
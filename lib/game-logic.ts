/**
 * Game validation logic for Shiritori
 * しりとりゲームのバリデーションロジック
 */

import { normalizeKana, getLastKana, isValidChain, containsKanji } from './utils'
import type { ValidationResult, LoseReason } from './types'

/**
 * Check if a word is a duplicate (already used)
 * 既出語チェック
 */
export function checkDuplicate(word: string, usedWords: string[]): boolean {
  const normalized = normalizeKana(word)
  const normalizedUsed = usedWords.map(w => normalizeKana(w))
  return normalizedUsed.includes(normalized)
}

/**
 * Check if a word ends with 'ん'
 * 語尾「ん」チェック
 */
export function checkEndsWithN(word: string): boolean {
  const lastKana = getLastKana(word)
  return lastKana === 'ん'
}

/**
 * Check if the word forms a valid chain with the previous word
 * しりとりチェーンの検証
 */
export function checkChain(previousWord: string, nextWord: string): boolean {
  if (!previousWord || !nextWord) return false
  return isValidChain(previousWord, nextWord)
}

/**
 * Validate user input
 * ユーザー入力の総合バリデーション
 */
export function validateUserInput(
  userInput: string,
  previousWord: string,
  usedWords: string[]
): ValidationResult {
  // 空文字チェック
  if (!userInput || userInput.trim() === '') {
    return {
      isValid: false,
      reason: 'INVALID',
      message: '単語を入力してください'
    }
  }

  // 漢字チェック
  if (containsKanji(userInput)) {
    return {
      isValid: false,
      reason: 'INVALID',
      message: 'ひらがなで入力してください'
    }
  }

  // 正規化
  const normalized = normalizeKana(userInput)

  // 1文字以下チェック
  if (normalized.length <= 1) {
    return {
      isValid: false,
      reason: 'INVALID',
      message: '2文字以上の単語を入力してください'
    }
  }

  // 既出語チェック
  if (checkDuplicate(userInput, usedWords)) {
    return {
      isValid: false,
      reason: 'DUPLICATE',
      message: 'その単語はすでに使われています'
    }
  }

  // 語尾「ん」チェック
  if (checkEndsWithN(userInput)) {
    return {
      isValid: false,
      reason: 'N_END',
      message: '「ん」で終わる単語は使えません'
    }
  }

  // しりとりチェーンチェック
  if (previousWord && !checkChain(previousWord, userInput)) {
    const lastKana = getLastKana(previousWord)
    return {
      isValid: false,
      reason: 'NOT_CHAIN',
      message: `「${lastKana}」で始まる単語を入力してください`
    }
  }

  // すべてのチェックを通過
  return {
    isValid: true
  }
}

/**
 * Determine the winner based on the lose reason
 * 負け理由に基づいて勝者を決定
 */
export function determineWinner(loseReason: LoseReason): 'USER' | 'CPU' | null {
  if (!loseReason) return null

  switch (loseReason) {
    case 'DUPLICATE':
    case 'N_END':
    case 'INVALID':
    case 'NOT_CHAIN':
      return 'CPU' // ユーザーが負け、CPUの勝ち
    case 'CPU_NO_WORD':
      return 'USER' // CPUが負け、ユーザーの勝ち
    default:
      return null
  }
}

/**
 * Get lose reason message in Japanese
 * 負け理由の日本語メッセージを取得
 */
export function getLoseReasonMessage(loseReason: LoseReason): string {
  switch (loseReason) {
    case 'DUPLICATE':
      return 'すでに使われた単語です！'
    case 'N_END':
      return '「ん」で終わってしまいました！'
    case 'INVALID':
      return '無効な単語です！'
    case 'NOT_CHAIN':
      return 'しりとりが続いていません！'
    case 'CPU_NO_WORD':
      return 'コンピュータが単語を思いつきませんでした！'
    default:
      return 'ゲーム終了'
  }
}

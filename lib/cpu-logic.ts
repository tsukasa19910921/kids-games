/**
 * CPU response logic for Shiritori
 * しりとりゲームのCPU応答ロジック
 */

import { getLastKana } from './utils'
import { findWords, getRandomWord } from './dictionary'

/**
 * Generate CPU response word
 * CPU応答単語を生成
 */
export function generateCPUResponse(
  previousWord: string,
  usedWords: string[]
): string | null {
  // 前の単語の最後の文字を取得
  const lastKana = getLastKana(previousWord)

  if (!lastKana) {
    console.error('Cannot get last kana from previous word:', previousWord)
    return null
  }

  // 既出語を除外して候補を検索
  const candidates = findWords(lastKana, usedWords)

  if (candidates.length === 0) {
    console.log('No candidates found for:', lastKana)
    return null
  }

  // ランダムに選択
  const selectedWord = getRandomWord(candidates)

  console.log(`CPU selected "${selectedWord}" from ${candidates.length} candidates starting with "${lastKana}"`)

  return selectedWord
}

/**
 * Simulate thinking time for CPU (for better UX)
 * CPUの思考時間をシミュレート（UX向上のため）
 */
export async function cpuThink(minMs: number = 500, maxMs: number = 1500): Promise<void> {
  const thinkTime = Math.random() * (maxMs - minMs) + minMs
  return new Promise(resolve => setTimeout(resolve, thinkTime))
}

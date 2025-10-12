'use client'

/**
 * Speech Recognition Hook
 * 音声認識フック
 */

import { useState, useEffect, useCallback, useRef } from 'react'
import {
  normalizeKana,
  containsKanji,
  convertKanjiToHiragana,
  convertNumbersToHiragana,
  calculateKanaProportion
} from '@/lib/utils'

/**
 * Scored candidate for speech recognition result prioritization
 * 音声認識結果の優先順位付けのためのスコア付き候補
 */
interface ScoredCandidate {
  text: string
  confidence: number
  hasOnlyKana: boolean
  kanaProportion: number
}

interface UseSpeechRecognitionReturn {
  isListening: boolean
  transcript: string
  error: string | null
  isSupported: boolean
  timeLeft: number
  startListening: () => void
  stopListening: () => void
  resetTranscript: () => void
}

/**
 * Custom hook for speech recognition
 * 音声認識カスタムフック
 */
export function useSpeechRecognition(): UseSpeechRecognitionReturn {
  const [isListening, setIsListening] = useState(false)
  const [transcript, setTranscript] = useState('')
  const [error, setError] = useState<string | null>(null)
  const [isSupported, setIsSupported] = useState(false)
  const [timeLeft, setTimeLeft] = useState(5)

  const recognitionRef = useRef<SpeechRecognition | null>(null)
  const timerRef = useRef<NodeJS.Timeout | null>(null)
  const hasResultRef = useRef(false)

  // Initialize SpeechRecognition
  useEffect(() => {
    if (typeof window === 'undefined') {
      setError('ブラウザ環境でのみ動作します')
      return
    }

    // Check browser support
    const SpeechRecognition =
      window.SpeechRecognition || (window as any).webkitSpeechRecognition

    if (!SpeechRecognition) {
      setError('お使いのブラウザは音声認識に対応していません')
      setIsSupported(false)
      return
    }

    setIsSupported(true)

    // Create recognition instance
    const recognition = new SpeechRecognition()
    recognition.lang = 'ja-JP'
    recognition.interimResults = false
    recognition.maxAlternatives = 5  // 複数の候補を取得
    recognition.continuous = false

    // Event: Recognition result
    recognition.onresult = (event: SpeechRecognitionEvent) => {
      const results = event.results[0]

      // スコア付き候補を作成
      const candidates: ScoredCandidate[] = Array.from(results).map(result => ({
        text: result.transcript,
        confidence: result.confidence,
        hasOnlyKana: !containsKanji(result.transcript),
        kanaProportion: calculateKanaProportion(result.transcript)
      }))

      // 優先順位に基づいてソート
      // 1. かな完全一致（漢字なし）
      // 2. かな比率が高い
      // 3. 信頼度が高い
      candidates.sort((a, b) => {
        // かな完全一致を最優先
        if (a.hasOnlyKana && !b.hasOnlyKana) return -1
        if (!a.hasOnlyKana && b.hasOnlyKana) return 1

        // かな比率で比較
        if (Math.abs(a.kanaProportion - b.kanaProportion) > 0.1) {
          return b.kanaProportion - a.kanaProportion
        }

        // 信頼度で比較
        return b.confidence - a.confidence
      })

      let bestResult = candidates[0].text

      console.log('All candidates:', candidates.map((c, i) =>
        `[${i}] "${c.text}" (kana: ${c.hasOnlyKana ? 'yes' : 'no'}, prop: ${c.kanaProportion.toFixed(2)}, conf: ${c.confidence.toFixed(2)})`
      ))
      console.log('Selected candidate:', bestResult)

      // Clear timer
      if (timerRef.current) {
        clearInterval(timerRef.current)
        timerRef.current = null
      }

      // 重要: hasResultRefを先に立てる（onendで誤判定されないため）
      hasResultRef.current = true
      setIsListening(false)
      setTimeLeft(5)

      // 漢字が残っている場合は形態素解析で読みに変換（非同期）
      if (containsKanji(bestResult)) {
        console.log('Converting kanji to hiragana...')

        // 非同期処理を開始（Promiseとして実行）
        convertKanjiToHiragana(bestResult)
          .then(converted => {
            console.log('Converted to:', converted)
            // 数字・全角英数を変換
            const withNumbers = convertNumbersToHiragana(converted)
            // 既存の正規化を適用
            const normalized = normalizeKana(withNumbers)
            console.log('Final result:', normalized)
            setTranscript(normalized)
          })
          .catch(error => {
            console.error('Failed to convert kanji:', error)
            // エラー時は元のテキストで続行
            const withNumbers = convertNumbersToHiragana(bestResult)
            const normalized = normalizeKana(withNumbers)
            console.log('Fallback result:', normalized)
            setTranscript(normalized)
          })
      } else {
        // 漢字がない場合は同期的に処理
        const withNumbers = convertNumbersToHiragana(bestResult)
        const normalized = normalizeKana(withNumbers)
        console.log('Final result:', normalized)
        setTranscript(normalized)
      }
    }

    // Event: Recognition error
    recognition.onerror = (event: SpeechRecognitionErrorEvent) => {
      console.error('Speech recognition error:', event.error)

      // Clear timer
      if (timerRef.current) {
        clearInterval(timerRef.current)
        timerRef.current = null
      }

      switch (event.error) {
        case 'no-speech':
          setError('音声が聞き取れませんでした')
          break
        case 'audio-capture':
          setError('マイクにアクセスできません')
          break
        case 'not-allowed':
          setError('マイクの使用が許可されていません')
          break
        case 'network':
          setError('ネットワークエラーが発生しました')
          break
        default:
          setError('音声認識エラーが発生しました')
      }

      setIsListening(false)
      setTimeLeft(5)
    }

    // Event: Recognition end
    recognition.onend = () => {
      console.log('Speech recognition ended')

      // Clear timer
      if (timerRef.current) {
        clearInterval(timerRef.current)
        timerRef.current = null
      }

      setIsListening(false)
      setTimeLeft(5)

      // Check if no result was received
      if (!hasResultRef.current) {
        setError('音声が聞き取れませんでした')
      }
    }

    // Event: Recognition start
    recognition.onstart = () => {
      console.log('Speech recognition started')
      setIsListening(true)
      setError(null)
    }

    recognitionRef.current = recognition

    // Cleanup
    return () => {
      if (recognitionRef.current) {
        recognitionRef.current.abort()
      }
      if (timerRef.current) {
        clearInterval(timerRef.current)
      }
    }
  }, [])

  /**
   * Start listening
   * 音声認識を開始
   */
  const startListening = useCallback(() => {
    if (!recognitionRef.current) {
      setError('音声認識が初期化されていません')
      return
    }

    if (isListening) {
      console.warn('Already listening')
      return
    }

    try {
      setTranscript('')
      setError(null)
      setTimeLeft(5)
      hasResultRef.current = false

      // Start countdown timer
      if (timerRef.current) {
        clearInterval(timerRef.current)
        timerRef.current = null
      }

      timerRef.current = setInterval(() => {
        setTimeLeft((prev) => {
          if (prev <= 1) {
            // Timeout reached
            if (timerRef.current) {
              clearInterval(timerRef.current)
              timerRef.current = null
            }
            if (recognitionRef.current) {
              recognitionRef.current.stop()
            }
            return 0
          }
          return prev - 1
        })
      }, 1000)

      recognitionRef.current.start()
    } catch (err) {
      console.error('Failed to start recognition:', err)
      setError('音声認識の開始に失敗しました')
      if (timerRef.current) {
        clearInterval(timerRef.current)
        timerRef.current = null
      }
      setTimeLeft(5)
    }
  }, [isListening])

  /**
   * Stop listening
   * 音声認識を停止
   */
  const stopListening = useCallback(() => {
    if (!recognitionRef.current) {
      return
    }

    if (!isListening) {
      console.warn('Not currently listening')
      return
    }

    try {
      if (timerRef.current) {
        clearInterval(timerRef.current)
        timerRef.current = null
      }
      setTimeLeft(5)
      recognitionRef.current.stop()
    } catch (err) {
      console.error('Failed to stop recognition:', err)
    }
  }, [isListening])

  /**
   * Reset transcript
   * 認識結果をリセット
   */
  const resetTranscript = useCallback(() => {
    setTranscript('')
    setError(null)
  }, [])

  return {
    isListening,
    transcript,
    error,
    isSupported,
    timeLeft,
    startListening,
    stopListening,
    resetTranscript
  }
}

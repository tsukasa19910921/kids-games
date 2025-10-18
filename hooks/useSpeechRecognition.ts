'use client'

/**
 * Speech Recognition Hook
 * 音声認識フック
 */

import { useState, useEffect, useCallback, useRef } from 'react'
import {
  normalizeKanaKeepLongVowel,
  containsKanji,
  convertKanjiToHiragana,
  convertNumbersToHiragana
} from '@/lib/utils'
import { playRecordingStopSound } from '@/lib/sounds'

/**
 * Scored candidate for speech recognition result prioritization
 * 音声認識結果の優先順位付けのためのスコア付き候補
 */
interface ScoredCandidate {
  text: string
  confidence: number
  hasOnlyKana: boolean
}

interface UseSpeechRecognitionReturn {
  isListening: boolean
  isProcessing: boolean
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
  const [isProcessing, setIsProcessing] = useState(false)
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
      window.SpeechRecognition || window.webkitSpeechRecognition

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
    recognition.onresult = async (event: SpeechRecognitionEvent) => {
      const results = event.results[0]

      // スコア付き候補を作成
      const candidates: ScoredCandidate[] = Array.from(results).map(result => ({
        text: result.transcript,
        confidence: result.confidence,
        hasOnlyKana: !containsKanji(result.transcript)
      }))

      // 優先順位に基づいてソート
      // 1. かな完全一致（漢字なし）を最優先
      // 2. 信頼度が高い
      candidates.sort((a, b) => {
        // かな完全一致を最優先
        if (a.hasOnlyKana && !b.hasOnlyKana) return -1
        if (!a.hasOnlyKana && b.hasOnlyKana) return 1

        // 信頼度で比較
        return b.confidence - a.confidence
      })

      const bestResult = candidates[0].text

      console.log('All candidates:', candidates.map((c, i) =>
        `[${i}] "${c.text}" (kana: ${c.hasOnlyKana ? 'yes' : 'no'}, conf: ${c.confidence.toFixed(2)})`
      ))
      console.log('Selected candidate:', bestResult)

      // ★★★ Phase A: 音声認識完了の即時通知 ★★★

      // 1. タイマークリア
      if (timerRef.current) {
        clearInterval(timerRef.current)
        timerRef.current = null
      }

      // 2. 状態更新（onendでの誤判定を防ぐため、音を鳴らす前に設定）
      hasResultRef.current = true
      setIsListening(false)
      setTimeLeft(5)
      console.log('[Phase A] Recognition completed, flags updated')

      // 3. 録音停止音を即座に発する
      await playRecordingStopSound()
      console.log('[Phase A] Recording stop sound played')
      alert('DEBUG: 音声停止完了')  // DEBUG

      // 4. 空文字列チェック
      if (bestResult.trim() === '') {
        console.log('[Phase A] Empty result detected, showing retry dialog')
        setError('音声が認識できませんでした。もう一度お試しください。')
        return  // やり直しオプションへ
      }

      // ★★★ Phase B: PROCESSING状態への遷移（汎用設計） ★★★
      // すべての後処理をPROCESSINGに包含
      console.log('[Phase B] Starting PROCESSING state')
      alert('DEBUG: Phase B開始')  // DEBUG
      setIsProcessing(true)
      alert('DEBUG: isProcessing=true設定完了')  // DEBUG

      // ⭐ 重要：Reactの再レンダリングを確実に発生させる待機処理
      //
      // 【背景】
      // React 18の自動バッチングにより、async関数内の複数のstate更新が
      // 1つのレンダリングサイクルにまとめられてしまいます。
      //
      // 【問題】
      // await Promise.resolve() だけではマイクロタスクキューに追加されるだけで
      // Reactの再レンダリングは保証されません。結果として、GameClient側の
      // useEffectが isProcessing=true の中間状態を検知できません。
      //
      // 【解決策】
      // setTimeout(100) で100ms待機することで、以下を保証します：
      // 1. setIsProcessing(true) の状態がGameClientに反映される
      // 2. GameClientのuseEffectが発火してPROCESSING状態に遷移する
      // 3. UIに「処理中...」が表示される
      //
      // 【なぜ100msか】
      // - PCでは setTimeout(0) でも十分だが、スマホでは不足
      // - スマホでは dispatch の反映に50ms程度かかることがある
      // - 100msは人間には気づかれない程度の遅延
      // - 漢字変換（最大3000ms）と比べれば無視できる
      //
      // 【将来のメンテナーへ】
      // この待機処理を削除、または短縮すると、スマホで「聞いています...」
      // 画面のまま固着したように見える不具合が再発します。
      //
      // 【フォールバック】GameClient側で LISTENING状態でも受け入れる
      // 二重の保険により、万が一100msでも間に合わない場合に対応。
      alert('DEBUG: setTimeout(100)前')  // DEBUG
      await new Promise(resolve => setTimeout(resolve, 100))
      alert('DEBUG: setTimeout(100)後')  // DEBUG
      console.log('[Phase B] isProcessing state reflected (React re-rendered)')

      try {
        let processedText = bestResult

        // 漢字変換（必要な場合）
        if (containsKanji(processedText)) {
          alert('DEBUG: 漢字変換開始')  // DEBUG
          console.log('Converting kanji to hiragana...')
          const converted = await convertKanjiToHiragana(processedText, 3000)  // ★3秒に延長
          alert('DEBUG: 漢字変換完了')  // DEBUG
          processedText = converted !== processedText ? converted : processedText

          if (converted !== bestResult) {
            console.log('Converted to:', converted)
          } else {
            console.log('Conversion failed, using original text')
          }
        }

        // 数字変換
        processedText = convertNumbersToHiragana(processedText)

        // 正規化（長音記号を保持）
        processedText = normalizeKanaKeepLongVowel(processedText)

        // 将来のAI処理をここに追加可能
        // processedText = await enhanceWithAI(processedText)

        console.log('Final result:', processedText)

        // ★★★ Phase C: 最終結果設定 ★★★
        console.log('[Phase C] Setting transcript')
        alert(`DEBUG: Phase C - transcript設定前: ${processedText}`)  // DEBUG
        setTranscript(processedText)
        alert('DEBUG: transcript設定完了')  // DEBUG

        // ⭐ 重要：transcriptの状態反映を確実に待つ
        //
        // 【理由】
        // setTranscript() の直後に setIsProcessing(false) を実行すると、
        // React 18の自動バッチングにより、以下の状態が同時に反映されます：
        // - transcript: 'りんご'
        // - isProcessing: false
        //
        // この場合、GameClient側で transcript を受け取った時点で
        // isProcessing=false になっており、「処理中」状態を検知できません。
        //
        // イベントループのターンを待つことで：
        // 1. transcript が設定される
        // 2. GameClientが再レンダリングされ、transcriptを処理する
        // 3. その後 isProcessing=false になる
        //
        // という正しいシーケンスが保証されます。
        //
        // 【補足】PCでは問題ないが、スマホでは dispatch の反映が遅いため、
        // GameClient側で LISTENING状態でも受け入れるロバストな設計にしています。
        alert('DEBUG: Phase C setTimeout(0)前')  // DEBUG
        await new Promise(resolve => setTimeout(resolve, 0))
        alert('DEBUG: Phase C setTimeout(0)後')  // DEBUG
        console.log('[Phase C] Transcript state reflected (React re-rendered)')

      } catch (error) {
        console.error('Processing failed:', error)
        alert(`DEBUG: エラー発生: ${error}`)  // DEBUG
        // フォールバック：最小限の処理で続行
        const fallback = normalizeKanaKeepLongVowel(convertNumbersToHiragana(bestResult))
        console.log('Fallback result:', fallback)
        setTranscript(fallback)

        // フォールバック時も状態反映を待つ（同じ理由）
        await new Promise(resolve => setTimeout(resolve, 0))
        console.log('[Fallback] Transcript state reflected (React re-rendered)')
      } finally {
        // PROCESSING終了
        alert('DEBUG: finallyブロック - isProcessing=false設定前')  // DEBUG
        console.log('[Phase B] PROCESSING complete, setting isProcessing=false')
        setIsProcessing(false)
        alert('DEBUG: isProcessing=false設定完了')  // DEBUG
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
    recognition.onend = async () => {
      console.log('[onend] Speech recognition ended, hasResult:', hasResultRef.current)

      // タイムアウト時も録音停止音を発する
      if (!hasResultRef.current) {
        console.log('[onend] No result received, playing stop sound and showing error')
        await playRecordingStopSound()
        setError('音声が聞き取れませんでした')
      }

      // Clear timer
      if (timerRef.current) {
        clearInterval(timerRef.current)
        timerRef.current = null
      }

      setIsListening(false)
      setTimeLeft(5)
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
    isProcessing,
    transcript,
    error,
    isSupported,
    timeLeft,
    startListening,
    stopListening,
    resetTranscript
  }
}

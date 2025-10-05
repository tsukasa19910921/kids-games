'use client'

/**
 * Speech Recognition Hook
 * 音声認識フック
 */

import { useState, useEffect, useCallback, useRef } from 'react'
import { normalizeKana } from '@/lib/utils'

interface UseSpeechRecognitionReturn {
  isListening: boolean
  transcript: string
  error: string | null
  isSupported: boolean
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

  const recognitionRef = useRef<SpeechRecognition | null>(null)

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
    recognition.maxAlternatives = 1
    recognition.continuous = false

    // Event: Recognition result
    recognition.onresult = (event: SpeechRecognitionEvent) => {
      const result = event.results[0][0].transcript
      const normalized = normalizeKana(result)

      console.log('Speech recognized:', result, '→', normalized)
      setTranscript(normalized)
      setIsListening(false)
    }

    // Event: Recognition error
    recognition.onerror = (event: SpeechRecognitionErrorEvent) => {
      console.error('Speech recognition error:', event.error)

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
    }

    // Event: Recognition end
    recognition.onend = () => {
      console.log('Speech recognition ended')
      setIsListening(false)
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
      recognitionRef.current.start()
    } catch (err) {
      console.error('Failed to start recognition:', err)
      setError('音声認識の開始に失敗しました')
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
    startListening,
    stopListening,
    resetTranscript
  }
}

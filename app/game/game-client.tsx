'use client'

import { useEffect, useState } from 'react'
import { speak, initializeSpeechSynthesis } from '@/lib/speech'
import { useGameState } from '@/hooks/useGameState'
import { useSpeechRecognition } from '@/hooks/useSpeechRecognition'
import { validateUserInput, getLoseReasonMessage, determineWinner } from '@/lib/game-logic'
import { generateCPUResponse, cpuThink } from '@/lib/cpu-logic'
import { containsKanji, preloadKuromojiDictionary } from '@/lib/utils'
import { playRecordingStartSound, enableSounds } from '@/lib/sounds'
import { TypingPractice } from '@/components/TypingPractice'

export function GameClient() {
  const { state, dispatch } = useGameState()
  const { isListening, isProcessing, transcript, error, isSupported, timeLeft, startListening, resetTranscript } = useSpeechRecognition()

  const [showConfirm, setShowConfirm] = useState(false)
  const [userInput, setUserInput] = useState<string>('')
  const [voiceEnabled, setVoiceEnabled] = useState(true)
  const [typingPracticeEnabled, setTypingPracticeEnabled] = useState(false)
  const [typingCompleted, setTypingCompleted] = useState(false)
  const [hasSpokenInitialWord, setHasSpokenInitialWord] = useState(false)

  // Initialize speech synthesis, sounds, and preload Kuromoji dictionary
  useEffect(() => {
    initializeSpeechSynthesis()
    enableSounds()

    // ⭐ Kuromoji辞書のプリロード（バックグラウンド）
    // シングルトンパターンなので、何度呼んでもダウンロードは1回だけ
    preloadKuromojiDictionary().then((success) => {
      if (success) {
        console.log('✅ Kuromoji dictionary preloaded successfully')
      } else {
        console.warn('⚠️ Dictionary preload failed (will load on demand)')
      }
    })
  }, [])

  // ★PROCESSING状態への自動遷移
  useEffect(() => {
    if (isProcessing && state.status === 'LISTENING') {
      console.log('[GameClient] isProcessing=true detected, transitioning to PROCESSING')
      dispatch({ type: 'SET_STATUS', payload: 'PROCESSING' })
    }
  }, [isProcessing, state.status, dispatch])

  // Handle speech recognition result (LISTENING/PROCESSING対応)
  // ★重要: LISTENING状態でも受け入れる（スマホでdispatchの反映が遅い場合に対応）
  useEffect(() => {
    if (transcript && (state.status === 'LISTENING' || state.status === 'PROCESSING')) {
      console.log('[GameClient] Transcript received:', transcript, 'status:', state.status)
      // 録音停止音は既にuseSpeechRecognitionで鳴っている
      setUserInput(transcript)
      setShowConfirm(true)
      setTypingCompleted(false)  // タイピング状態をリセット
      dispatch({ type: 'SET_STATUS', payload: 'PLAYING' })
    }
  }, [transcript, state.status, dispatch])

  // Handle speech recognition timeout/error
  useEffect(() => {
    if (error && (state.status === 'LISTENING' || state.status === 'PROCESSING') && !isListening) {
      console.log('[GameClient] Error detected:', error)
      // 録音停止音は既にuseSpeechRecognitionで鳴っている
      // PLAYING状態に戻す（既存のエラー表示とマイク/テキスト入力UIが表示される）
      dispatch({ type: 'SET_STATUS', payload: 'PLAYING' })
    }
  }, [error, state.status, isListening, dispatch])

  // テキスト入力時にエラーをクリア
  useEffect(() => {
    if (userInput && error) {
      console.log('[GameClient] User typed input, clearing error')
      resetTranscript()
    }
  }, [userInput, error, resetTranscript])

  // Speak game start message (しりとり)
  useEffect(() => {
    // ゲーム開始時の「しりとり」発話のみ（1回だけ）
    if (state.status === 'PLAYING' && state.usedWords.length === 1 && state.currentWord === 'しりとり' && voiceEnabled && !hasSpokenInitialWord) {
      setHasSpokenInitialWord(true)
      speak('しりとり').catch((err) => {
        console.warn('Failed to speak:', err)
      })
    }
  }, [state.status, state.usedWords.length, state.currentWord, voiceEnabled, hasSpokenInitialWord])

  /**
   * Start game
   * ゲーム開始
   */
  const handleStartGame = () => {
    dispatch({ type: 'START_GAME' })
    // 発話はuseEffectで自動的に行われる
  }

  /**
   * Handle voice input start
   * 音声入力開始
   */
  const handleVoiceStart = async () => {
    setUserInput('')
    setShowConfirm(false)
    resetTranscript()
    dispatch({ type: 'SET_STATUS', payload: 'LISTENING' })

    // 効果音を再生して完了を待つ
    await playRecordingStartSound().catch(console.error)

    startListening()
  }

  /**
   * Handle input confirmation
   * 入力確定
   */
  const handleConfirm = async () => {
    if (!userInput.trim()) return

    // Validate user input
    const validation = validateUserInput(userInput, state.currentWord, state.usedWords)

    if (!validation.isValid) {
      // User loses
      dispatch({ type: 'GAME_OVER', payload: validation.reason || 'INVALID' })

      if (voiceEnabled && validation.message) {
        await speak(validation.message).catch((err) => {
          console.warn('Failed to speak:', err)
        })
      }

      setShowConfirm(false)
      setUserInput('')
      return
    }

    // User input is valid
    // Calculate updated usedWords to pass to CPU (React state update is async)
    const updatedUsedWords = [...state.usedWords, userInput]

    dispatch({ type: 'USER_INPUT', payload: userInput })
    setShowConfirm(false)
    setUserInput('')

    // CPU's turn
    // Pass previousWord (for getting last kana) and updatedUsedWords (for duplicate check)
    await handleCPUTurn(userInput, updatedUsedWords)
  }

  /**
   * Handle CPU turn
   * CPUターン処理
   * @param previousWord - ユーザーの入力単語（語尾文字取得用）
   * @param usedWords - 既出語リスト（previousWordを含む）
   */
  const handleCPUTurn = async (previousWord: string, usedWords: string[]) => {
    // Thinking animation
    await cpuThink()

    // Generate CPU response
    const cpuWord = generateCPUResponse(previousWord, usedWords)

    if (!cpuWord) {
      // CPU loses (no words available)
      dispatch({ type: 'GAME_OVER', payload: 'CPU_NO_WORD' })

      if (voiceEnabled) {
        await speak('ごめんね、思いつかなかったよ。きみの勝ち！').catch((err) => {
          console.warn('Failed to speak:', err)
        })
      }
      return
    }

    // CPU response - 先にdispatchしてUIを更新
    dispatch({ type: 'CPU_RESPONSE', payload: cpuWord })

    // 音声発話を待つ（モバイルでスキップされないように）
    if (voiceEnabled) {
      await speak(cpuWord).catch((err) => {
        console.warn('Failed to speak CPU response:', err)
      })
    }
  }

  /**
   * Reset game
   * ゲームリセット
   */
  const handleReset = () => {
    dispatch({ type: 'RESET' })
    setUserInput('')
    setShowConfirm(false)
    setHasSpokenInitialWord(false)
    resetTranscript()
  }

  /**
   * Retry input
   * 入力やり直し
   */
  const handleRetry = () => {
    setUserInput('')
    setShowConfirm(false)
    setTypingCompleted(false)
    resetTranscript()
  }

  /**
   * Handle typing practice completion
   * タイピング練習完了時の処理
   */
  const handleTypingComplete = () => {
    setTypingCompleted(true)
  }

  // Get winner if game is over
  const winner = state.loseReason ? determineWinner(state.loseReason) : null

  return (
    <div className="space-y-6">
      {/* Game status header */}
      <div className="text-center">
        <h2 className="text-3xl font-bold text-gray-800 mb-2">
          {state.status === 'IDLE' && 'しりとりゲーム'}
          {state.status === 'PLAYING' && 'ゲーム中'}
          {state.status === 'LISTENING' && (
            <span>
              聞いています... <span className="text-5xl font-extrabold text-red-500 mx-2">{timeLeft}</span>
            </span>
          )}
          {state.status === 'PROCESSING' && '処理中...'}
          {state.status === 'THINKING' && 'かんがえています...'}
          {state.status === 'RESULT' && 'ゲーム終了'}
        </h2>

        {state.status === 'PLAYING' && state.needHead && (
          <p className="text-xl text-blue-600">
            「<span className="font-bold text-2xl">{state.needHead}</span>」で始まる言葉を言ってね！
          </p>
        )}
      </div>

      {/* Current word display */}
      {state.currentWord && state.status !== 'IDLE' && (
        <div className="bg-gradient-to-r from-blue-50 to-green-50 rounded-2xl p-6 text-center border-2 border-blue-200">
          <p className="text-sm text-gray-600 mb-1">さいごのことば</p>
          <p className="text-4xl font-bold text-blue-600">{state.currentWord}</p>
        </div>
      )}

      {/* Messages log - Hidden as it duplicates with used words */}
      {/* Removed to simplify UI */}

      {/* 処理中インジケーター */}
      {state.status === 'PROCESSING' && (
        <div className="text-center">
          <div className="inline-block animate-pulse bg-blue-100 text-blue-700 px-6 py-4 rounded-full border-2 border-blue-300">
            <p className="text-lg font-bold">音声を処理しています...</p>
            <p className="text-sm text-gray-600 mt-1">しばらくお待ちください</p>
          </div>
        </div>
      )}

      {/* Voice/Text input controls */}
      {state.status === 'PLAYING' && state.turn === 'USER' && !showConfirm && (
        <div className="space-y-4">
          {/* Error message */}
          {error && (
            <div className="bg-red-50 border-2 border-red-300 rounded-lg p-4 text-center animate-pulse">
              <p className="text-red-700 font-bold">{error}</p>
              <p className="text-sm text-red-600 mt-2">もう一度マイクボタンを押してください</p>
            </div>
          )}

          {/* Voice input button */}
          {isSupported && (
            <div className="flex justify-center">
              <button
                onClick={handleVoiceStart}
                disabled={isListening}
                className="p-8 bg-gradient-to-br from-red-500 to-pink-500 text-white
                         rounded-full shadow-2xl hover:shadow-red-300
                         disabled:opacity-50 disabled:cursor-not-allowed
                         transform transition hover:scale-105 active:scale-95"
                aria-label="マイクボタン"
              >
                <svg className="w-12 h-12" fill="currentColor" viewBox="0 0 20 20">
                  <path fillRule="evenodd" d="M7 4a3 3 0 016 0v4a3 3 0 11-6 0V4zm4 10.93A7.001 7.001 0 0017 8a1 1 0 10-2 0A5 5 0 015 8a1 1 0 00-2 0 7.001 7.001 0 006 6.93V17H6a1 1 0 100 2h8a1 1 0 100-2h-3v-2.07z" clipRule="evenodd" />
                </svg>
              </button>
            </div>
          )}

          {/* Text input fallback */}
          <div className="space-y-2">
            <p className="text-center text-sm text-gray-500">
              {isSupported ? 'または、文字で入力できます' : '文字で入力してください'}
            </p>
            <input
              type="text"
              value={userInput}
              onChange={(e) => setUserInput(e.target.value)}
              onKeyDown={(e) => {
                if (e.key !== 'Enter') return

                // IME合成中は処理しない
                // if (e.nativeEvent.isComposing || e.keyCode === 229) return

                if (userInput.trim()) {
                  e.preventDefault()
                  setShowConfirm(true)
                  setTypingCompleted(false)
                }
              }}
              placeholder="ひらがなで入力してね"
              className="w-full px-4 py-3 text-lg border-2 border-gray-300 rounded-lg
                       focus:outline-none focus:border-blue-500"
            />
            {userInput && (
              <button
                onClick={() => {
                  setShowConfirm(true)
                  setTypingCompleted(false)
                }}
                className="w-full px-6 py-3 bg-blue-500 text-white rounded-lg
                         hover:bg-blue-600 transition-colors"
              >
                入力完了
              </button>
            )}
          </div>
        </div>
      )}

      {/* Confirmation dialog */}
      {showConfirm && userInput && (
        <div className="bg-yellow-50 border-2 border-yellow-300 rounded-2xl p-6 space-y-4">
          <p className="text-center text-lg">この言葉でいいですか？</p>
          <p className="text-center text-3xl font-bold text-yellow-800">{userInput}</p>

          {/* Warning if contains kanji */}
          {containsKanji(userInput) && (
            <div className="bg-orange-100 border-2 border-orange-400 rounded-lg p-3">
              <p className="text-orange-800 text-sm text-center">
                ⚠️ 漢字が含まれています。ひらがなで言い直してください。
              </p>
            </div>
          )}

          {/* Typing practice toggle */}
          <div className="flex justify-center">
            <button
              onClick={() => {
                setTypingPracticeEnabled(!typingPracticeEnabled)
                setTypingCompleted(false)
              }}
              className={`px-6 py-2 rounded-full font-bold transition-colors ${
                typingPracticeEnabled
                  ? 'bg-blue-500 text-white'
                  : 'bg-gray-200 text-gray-600 hover:bg-gray-300'
              }`}
            >
              {typingPracticeEnabled ? '⌨️ タイピング練習 ON' : '⌨️ タイピング練習 OFF'}
            </button>
          </div>

          {/* Typing practice component */}
          {typingPracticeEnabled && (
            <TypingPractice
              targetWord={userInput}
              onComplete={handleTypingComplete}
              onConfirm={handleConfirm}
            />
          )}

          <div className="flex gap-4 justify-center">
            <button
              onClick={handleRetry}
              className="px-6 py-3 bg-gray-400 text-white rounded-full
                       hover:bg-gray-500 transition-colors"
            >
              やりなおす
            </button>
            <button
              onClick={handleConfirm}
              disabled={typingPracticeEnabled && !typingCompleted}
              className={`px-8 py-3 rounded-full font-bold transition-colors ${
                typingPracticeEnabled && !typingCompleted
                  ? 'bg-gray-300 text-gray-500 cursor-not-allowed'
                  : 'bg-green-500 text-white hover:bg-green-600'
              }`}
            >
              こたえる
            </button>
          </div>
        </div>
      )}

      {/* Thinking indicator */}
      {state.status === 'THINKING' && (
        <div className="text-center">
          <div className="inline-block animate-pulse bg-blue-100 text-blue-700 px-6 py-4 rounded-full">
            <p className="text-lg">コンピュータがかんがえています...</p>
          </div>
        </div>
      )}

      {/* Game result */}
      {state.status === 'RESULT' && state.loseReason && (
        <div className={`rounded-2xl p-8 text-center border-4 ${
          winner === 'USER'
            ? 'bg-green-50 border-green-400'
            : 'bg-red-50 border-red-400'
        }`}>
          <p className="text-3xl font-bold mb-4">
            {winner === 'USER' ? '🎉 あなたの勝ち！' : '😢 あなたの負け...'}
          </p>
          <p className="text-xl text-gray-700 mb-2">{getLoseReasonMessage(state.loseReason)}</p>
          <p className="text-gray-600">つかったことば: {state.usedWords.length}こ</p>
        </div>
      )}

      {/* Control buttons */}
      <div className="flex justify-center gap-4 pt-4">
        {state.status === 'IDLE' && (
          <button
            onClick={handleStartGame}
            className="px-12 py-4 text-2xl font-bold text-white
                     bg-gradient-to-r from-blue-500 to-green-500
                     rounded-full shadow-xl transform transition
                     hover:scale-105 active:scale-95"
          >
            はじめる
          </button>
        )}

        {state.status !== 'IDLE' && (
          <button
            onClick={handleReset}
            className="px-8 py-3 bg-red-500 text-white rounded-full font-bold
                     hover:bg-red-600 transition-colors shadow-lg"
          >
            {state.status === 'RESULT' ? 'もう一度遊ぶ' : 'ゲームをやめる'}
          </button>
        )}

        {/* Voice toggle */}
        {state.status !== 'IDLE' && (
          <button
            onClick={() => setVoiceEnabled(!voiceEnabled)}
            className={`px-6 py-3 rounded-full font-bold transition-colors ${
              voiceEnabled
                ? 'bg-blue-500 text-white hover:bg-blue-600'
                : 'bg-gray-300 text-gray-600 hover:bg-gray-400'
            }`}
          >
            {voiceEnabled ? '🔊 音声ON' : '🔇 音声OFF'}
          </button>
        )}
      </div>

      {/* Used words display - Moved to bottom */}
      {state.usedWords.length > 0 && (
        <div className="bg-gray-50 rounded-2xl p-4 border-2 border-gray-200">
          <p className="text-sm text-gray-600 mb-3 font-semibold">
            つかったことば ({state.usedWords.length}こ)
          </p>
          <div className="flex flex-wrap gap-2">
            {state.usedWords.map((word, index) => (
              <span
                key={index}
                className="px-3 py-1 bg-white rounded-full text-sm border border-gray-300 shadow-sm"
              >
                {word}
              </span>
            ))}
          </div>
        </div>
      )}

      {/* Listening indicator (floating) - simplified */}
      {isListening && (
        <div className="fixed bottom-8 right-8 bg-red-500 text-white
                      px-6 py-4 rounded-full shadow-2xl animate-pulse z-50">
          <span className="flex items-center gap-3">
            <span className="relative flex h-4 w-4">
              <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-white opacity-75"></span>
              <span className="relative inline-flex rounded-full h-4 w-4 bg-white"></span>
            </span>
            <span className="font-bold">録音中</span>
          </span>
        </div>
      )}
    </div>
  )
}
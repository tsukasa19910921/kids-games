'use client'

import { useState, useEffect, useRef } from 'react'
import { kanaToRomaji, kanaToRomajiSegments } from '@/lib/utils'
import { playTypingSound, playSuccessSound, playErrorSound } from '@/lib/sounds'

interface TypingPracticeProps {
  targetWord: string  // 入力すべき単語（ひらがな）
  onComplete: () => void  // タイピング完了時のコールバック
  onConfirm: () => void  // Enterキーで確定時のコールバック
}

export function TypingPractice({ targetWord, onComplete, onConfirm }: TypingPracticeProps) {
  const [targetRomaji, setTargetRomaji] = useState('')
  const [romajiSegments, setRomajiSegments] = useState<Array<{ kana: string, romaji: string }>>([])
  const [typedChars, setTypedChars] = useState(0)  // 正しく入力された文字数
  const [isComplete, setIsComplete] = useState(false)
  const [isMobile, setIsMobile] = useState(false)
  const inputRef = useRef<HTMLInputElement>(null)

  // デバイス判定（確実性重視）
  useEffect(() => {
    const checkMobile = () => {
      const hasTouch = navigator.maxTouchPoints > 0
      const hasCoarsePointer = window.matchMedia('(pointer: coarse)').matches
      const smallScreen = window.matchMedia('(max-width: 768px)').matches

      // タッチデバイスかつ（粗いポインターまたは小画面）であればモバイル判定
      return hasTouch && (hasCoarsePointer || smallScreen)
    }

    setIsMobile(checkMobile())
  }, [])

  // 目標単語をローマ字に変換
  useEffect(() => {
    const romaji = kanaToRomaji(targetWord)
    const segments = kanaToRomajiSegments(targetWord)
    setTargetRomaji(romaji)
    setRomajiSegments(segments)
    setTypedChars(0)
    setIsComplete(false)
  }, [targetWord])

  // モバイルの場合のみ入力フィールドに自動フォーカス
  useEffect(() => {
    if (isMobile) {
      inputRef.current?.focus()
    }
  }, [targetWord, isMobile])

  // モバイル用：キーボード入力ハンドラー（React Event）
  const handleKeyDown = (event: React.KeyboardEvent<HTMLInputElement>) => {
    const key = event.key

    // タイピング完了後のEnterキー
    if (isComplete && key === 'Enter') {
      onConfirm()
      event.preventDefault()
      return
    }

    if (isComplete) {
      event.preventDefault()
      return
    }

    const upperKey = key.toUpperCase()

    // アルファベットキーのみ処理
    if (!/^[A-Z]$/.test(upperKey)) {
      event.preventDefault()
      return
    }

    const expectedChar = targetRomaji[typedChars]

    if (upperKey === expectedChar) {
      // 正しい入力
      playTypingSound()
      const newTypedChars = typedChars + 1
      setTypedChars(newTypedChars)

      // すべて入力完了
      if (newTypedChars >= targetRomaji.length) {
        setIsComplete(true)
        playSuccessSound()
        setTimeout(() => {
          onComplete()
        }, 300)
      }
    } else {
      // 間違った入力
      playErrorSound()
    }

    event.preventDefault()
  }

  // PC用：キーボード入力ハンドラー（Native Event）
  useEffect(() => {
    // モバイルの場合はスキップ
    if (isMobile) return

    const handleKeyPress = (event: KeyboardEvent) => {
      const key = event.key

      // タイピング完了後のEnterキー
      if (isComplete && key === 'Enter') {
        onConfirm()
        event.preventDefault()
        return
      }

      if (isComplete) return

      const upperKey = key.toUpperCase()

      // アルファベットキーのみ処理
      if (!/^[A-Z]$/.test(upperKey)) return

      const expectedChar = targetRomaji[typedChars]

      if (upperKey === expectedChar) {
        // 正しい入力
        playTypingSound()
        const newTypedChars = typedChars + 1
        setTypedChars(newTypedChars)

        // すべて入力完了
        if (newTypedChars >= targetRomaji.length) {
          setIsComplete(true)
          playSuccessSound()
          setTimeout(() => {
            onComplete()
          }, 300)
        }
      } else {
        // 間違った入力
        playErrorSound()
      }

      event.preventDefault()
    }

    window.addEventListener('keydown', handleKeyPress)
    return () => {
      window.removeEventListener('keydown', handleKeyPress)
    }
  }, [isMobile, targetRomaji, typedChars, isComplete, onComplete, onConfirm])

  if (!targetRomaji) return null

  // 各セグメントの開始位置を計算
  const getSegmentPositions = () => {
    let position = 0
    return romajiSegments.map(segment => {
      const start = position
      position += segment.romaji.length
      return { segment, start }
    })
  }

  const segmentPositions = getSegmentPositions()

  // タップで入力フィールドにフォーカス（モバイル用）
  const handleContainerClick = () => {
    if (isMobile) {
      inputRef.current?.focus()
    }
  }

  return (
    <div
      className={`mt-4 p-4 bg-blue-50 rounded-lg border-2 border-blue-300 ${isMobile ? 'cursor-pointer' : ''}`}
      onClick={handleContainerClick}
    >
      {/* 非表示の入力フィールド（モバイルのみ） */}
      {isMobile && (
        <input
          ref={inputRef}
          type="text"
          value=""
          onChange={() => {}} // 制御コンポーネントとして警告回避
          onKeyDown={handleKeyDown}
          inputMode="text"
          lang="en"
          autoComplete="off"
          autoCorrect="off"
          autoCapitalize="off"
          spellCheck="false"
          className="absolute opacity-0 pointer-events-none"
          aria-label="タイピング入力"
          tabIndex={-1}
        />
      )}

      <p className="text-center text-sm text-gray-600 mb-2">
        ⌨️ タイピング練習：ローマ字を入力してね
      </p>

      {/* ひらがな表示 */}
      <div className="text-2xl text-center mb-2 flex justify-center gap-3">
        {romajiSegments.map((segment, index) => (
          <span key={index} className="text-gray-700 font-bold">
            {segment.kana}
          </span>
        ))}
      </div>

      {/* ローマ字表示（セグメントごとに空白で区切り） */}
      <div className="text-3xl font-mono text-center py-3 flex justify-center gap-3">
        {segmentPositions.map(({ segment, start }, index) => (
          <span key={index} className="inline-block">
            {segment.romaji.split('').map((char, charIndex) => {
              const position = start + charIndex
              const isTyped = position < typedChars
              const isCurrent = position === typedChars

              return (
                <span
                  key={charIndex}
                  className={`${
                    isTyped
                      ? 'text-green-600 font-bold'
                      : isCurrent
                      ? 'text-blue-600 bg-blue-200 px-1 rounded animate-pulse'
                      : 'text-gray-400'
                  }`}
                >
                  {char}
                </span>
              )
            })}
          </span>
        ))}
      </div>

      {/* 進捗バー */}
      <div className="mt-3">
        <div className="w-full bg-gray-200 rounded-full h-2">
          <div
            className="bg-green-500 h-2 rounded-full transition-all duration-200"
            style={{ width: `${(typedChars / targetRomaji.length) * 100}%` }}
          />
        </div>
        <p className="text-center text-xs text-gray-500 mt-1">
          {typedChars} / {targetRomaji.length} ({Math.round((typedChars / targetRomaji.length) * 100)}%)
        </p>
      </div>

      {isComplete && (
        <p className="text-center text-green-600 font-bold mt-2">
          ✅ タイピング完了！<span className="ml-2 text-blue-600">Enterキーでこたえる</span>
        </p>
      )}
    </div>
  )
}

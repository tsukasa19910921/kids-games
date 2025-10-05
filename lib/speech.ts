/**
 * Speech synthesis utility functions
 * 音声合成ユーティリティ関数
 */

/**
 * Get Japanese voice from available voices
 * 利用可能な音声から日本語音声を取得
 */
export function getJapaneseVoice(): SpeechSynthesisVoice | null {
  if (typeof window === 'undefined' || !window.speechSynthesis) {
    return null
  }

  const voices = window.speechSynthesis.getVoices()

  // Find Japanese voice
  const japaneseVoice = voices.find(voice =>
    voice.lang.includes('ja') || voice.lang.includes('JP')
  )

  return japaneseVoice || null
}

/**
 * Initialize speech synthesis and load voices
 * 音声合成を初期化し、音声をロード
 */
export function initializeSpeechSynthesis(): void {
  if (typeof window === 'undefined' || !window.speechSynthesis) {
    console.warn('Speech synthesis is not available')
    return
  }

  // Load voices
  window.speechSynthesis.getVoices()

  // Set up event listener for when voices are loaded
  window.speechSynthesis.addEventListener('voiceschanged', () => {
    window.speechSynthesis.getVoices()
  })
}

/**
 * Speak the given text using speech synthesis
 * 音声合成を使用して指定されたテキストを発話
 * @param text The text to speak
 * @param options Optional speech synthesis options
 */
export async function speak(
  text: string,
  options?: {
    volume?: number
    rate?: number
    pitch?: number
  }
): Promise<void> {
  return new Promise((resolve) => {
    if (typeof window === 'undefined' || !window.speechSynthesis) {
      console.warn('Speech synthesis is not available')
      resolve()
      return
    }

    // Cancel any ongoing speech
    window.speechSynthesis.cancel()

    // Wait a bit for cancel to complete
    setTimeout(() => {
      try {
        // Create utterance
        const utterance = new SpeechSynthesisUtterance(text)

        // Set Japanese voice if available
        const japaneseVoice = getJapaneseVoice()
        if (japaneseVoice) {
          utterance.voice = japaneseVoice
        }

        // Set language to Japanese
        utterance.lang = 'ja-JP'

        // Set options
        utterance.volume = options?.volume ?? 1
        utterance.rate = options?.rate ?? 0.9
        utterance.pitch = options?.pitch ?? 1

        // Timeout fallback (10 seconds)
        const timeout = setTimeout(() => {
          console.warn('Speech timeout - continuing')
          window.speechSynthesis.cancel()
          resolve()
        }, 10000)

        // Set up event handlers
        utterance.onend = () => {
          clearTimeout(timeout)
          console.log('Speech ended successfully')
          resolve()
        }

        utterance.onerror = (event) => {
          clearTimeout(timeout)
          console.warn('Speech synthesis error:', event.error)
          // Don't reject - just resolve to continue the game
          resolve()
        }

        // Speak
        console.log('Speaking:', text)
        window.speechSynthesis.speak(utterance)
      } catch (error) {
        console.error('Error in speak function:', error)
        resolve()
      }
    }, 100)
  })
}

/**
 * Cancel any ongoing speech
 * 進行中の発話をキャンセル
 */
export function cancelSpeech(): void {
  if (typeof window !== 'undefined' && window.speechSynthesis) {
    window.speechSynthesis.cancel()
  }
}

/**
 * Check if speech synthesis is currently speaking
 * 音声合成が現在発話中かどうかを確認
 */
export function isSpeaking(): boolean {
  if (typeof window !== 'undefined' && window.speechSynthesis) {
    return window.speechSynthesis.speaking
  }
  return false
}
/**
 * Sound effects utilities using Web Audio API
 * Web Audio APIを使用した効果音ユーティリティ
 */

// Audio context singleton
let audioContext: AudioContext | null = null

/**
 * Get or create audio context
 * オーディオコンテキストを取得または作成
 */
function getAudioContext(): AudioContext | null {
  if (typeof window === 'undefined') return null

  if (!audioContext) {
    try {
      const AudioContextClass = window.AudioContext || (window as unknown as { webkitAudioContext: typeof AudioContext }).webkitAudioContext
      audioContext = new AudioContextClass()
    } catch (error) {
      console.error('Failed to create audio context:', error)
      return null
    }
  }

  return audioContext
}

/**
 * Play a beep sound with specified frequency and duration
 * 指定された周波数と長さでビープ音を再生
 */
function playBeep(frequency: number, duration: number, volume: number = 0.3): void {
  const ctx = getAudioContext()
  if (!ctx) return

  try {
    const oscillator = ctx.createOscillator()
    const gainNode = ctx.createGain()

    oscillator.connect(gainNode)
    gainNode.connect(ctx.destination)

    oscillator.frequency.value = frequency
    oscillator.type = 'sine'

    gainNode.gain.setValueAtTime(volume, ctx.currentTime)
    gainNode.gain.exponentialRampToValueAtTime(0.01, ctx.currentTime + duration)

    oscillator.start(ctx.currentTime)
    oscillator.stop(ctx.currentTime + duration)
  } catch (error) {
    console.error('Failed to play beep:', error)
  }
}

/**
 * Play recording start sound
 * 録音開始音を再生（上昇音）
 */
export function playRecordingStartSound(): Promise<void> {
  return new Promise((resolve) => {
    const ctx = getAudioContext()
    if (!ctx) {
      resolve()
      return
    }

    try {
      const oscillator = ctx.createOscillator()
      const gainNode = ctx.createGain()

      oscillator.connect(gainNode)
      gainNode.connect(ctx.destination)

      // 上昇する音（600Hz → 800Hz）
      oscillator.frequency.setValueAtTime(600, ctx.currentTime)
      oscillator.frequency.exponentialRampToValueAtTime(800, ctx.currentTime + 0.1)
      oscillator.type = 'sine'

      gainNode.gain.setValueAtTime(0.3, ctx.currentTime)
      gainNode.gain.exponentialRampToValueAtTime(0.01, ctx.currentTime + 0.15)

      oscillator.start(ctx.currentTime)
      oscillator.stop(ctx.currentTime + 0.15)

      // 音が終わるまで待機
      oscillator.onended = () => resolve()
    } catch (error) {
      console.error('Failed to play recording start sound:', error)
      resolve()
    }
  })
}

/**
 * Play recording stop sound
 * 録音終了音を再生（下降音）
 */
export function playRecordingStopSound(): Promise<void> {
  return new Promise((resolve) => {
    const ctx = getAudioContext()
    if (!ctx) {
      resolve()
      return
    }

    try {
      const oscillator = ctx.createOscillator()
      const gainNode = ctx.createGain()

      oscillator.connect(gainNode)
      gainNode.connect(ctx.destination)

      // 下降する音（800Hz → 600Hz）
      oscillator.frequency.setValueAtTime(800, ctx.currentTime)
      oscillator.frequency.exponentialRampToValueAtTime(600, ctx.currentTime + 0.1)
      oscillator.type = 'sine'

      gainNode.gain.setValueAtTime(0.3, ctx.currentTime)
      gainNode.gain.exponentialRampToValueAtTime(0.01, ctx.currentTime + 0.15)

      oscillator.start(ctx.currentTime)
      oscillator.stop(ctx.currentTime + 0.15)

      // 音が終わるまで待機
      oscillator.onended = () => resolve()
    } catch (error) {
      console.error('Failed to play recording stop sound:', error)
      resolve()
    }
  })
}

/**
 * Play success/correct sound
 * 正解音を再生（明るい和音）
 */
export function playSuccessSound(): void {
  const ctx = getAudioContext()
  if (!ctx) return

  try {
    // 和音を構成する3つの音を再生
    const frequencies = [523.25, 659.25, 783.99] // C5, E5, G5

    frequencies.forEach((freq, index) => {
      const oscillator = ctx.createOscillator()
      const gainNode = ctx.createGain()

      oscillator.connect(gainNode)
      gainNode.connect(ctx.destination)

      oscillator.frequency.value = freq
      oscillator.type = 'sine'

      const startTime = ctx.currentTime + index * 0.05
      gainNode.gain.setValueAtTime(0.2, startTime)
      gainNode.gain.exponentialRampToValueAtTime(0.01, startTime + 0.3)

      oscillator.start(startTime)
      oscillator.stop(startTime + 0.3)
    })
  } catch (error) {
    console.error('Failed to play success sound:', error)
  }
}

/**
 * Play error/incorrect sound
 * 不正解音を再生（低い音）
 */
export function playErrorSound(): void {
  const ctx = getAudioContext()
  if (!ctx) return

  try {
    const oscillator = ctx.createOscillator()
    const gainNode = ctx.createGain()

    oscillator.connect(gainNode)
    gainNode.connect(ctx.destination)

    // 低く短い音
    oscillator.frequency.value = 200
    oscillator.type = 'sawtooth'

    gainNode.gain.setValueAtTime(0.3, ctx.currentTime)
    gainNode.gain.exponentialRampToValueAtTime(0.01, ctx.currentTime + 0.2)

    oscillator.start(ctx.currentTime)
    oscillator.stop(ctx.currentTime + 0.2)
  } catch (error) {
    console.error('Failed to play error sound:', error)
  }
}

/**
 * Play typing key sound
 * タイピングキー音を再生（短いクリック音）
 */
export function playTypingSound(): void {
  playBeep(1000, 0.05, 0.1)
}

/**
 * Play game over sound
 * ゲームオーバー音を再生
 */
export function playGameOverSound(): void {
  const ctx = getAudioContext()
  if (!ctx) return

  try {
    // 下降音階
    const frequencies = [440, 392, 349.23, 329.63] // A4, G4, F4, E4

    frequencies.forEach((freq, index) => {
      const oscillator = ctx.createOscillator()
      const gainNode = ctx.createGain()

      oscillator.connect(gainNode)
      gainNode.connect(ctx.destination)

      oscillator.frequency.value = freq
      oscillator.type = 'triangle'

      const startTime = ctx.currentTime + index * 0.15
      gainNode.gain.setValueAtTime(0.2, startTime)
      gainNode.gain.exponentialRampToValueAtTime(0.01, startTime + 0.2)

      oscillator.start(startTime)
      oscillator.stop(startTime + 0.2)
    })
  } catch (error) {
    console.error('Failed to play game over sound:', error)
  }
}

/**
 * Enable sound effects
 * 効果音を有効化（ユーザーインタラクション後に呼び出す）
 */
export function enableSounds(): void {
  const ctx = getAudioContext()
  if (ctx && ctx.state === 'suspended') {
    ctx.resume().catch(error => {
      console.error('Failed to resume audio context:', error)
    })
  }
}

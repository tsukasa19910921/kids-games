/**
 * Type definitions for Shiritori game
 * しりとりゲームの型定義
 */

/**
 * Game status
 */
export type GameStatus = 'IDLE' | 'PLAYING' | 'LISTENING' | 'THINKING' | 'RESULT'

/**
 * Turn indicator
 */
export type Turn = 'USER' | 'CPU'

/**
 * Lose reason
 */
export type LoseReason = 'DUPLICATE' | 'N_END' | 'INVALID' | 'NOT_CHAIN' | 'CPU_NO_WORD' | null

/**
 * Message sender
 */
export type MessageSender = 'USER' | 'CPU' | 'SYSTEM'

/**
 * Message object
 */
export interface Message {
  sender: MessageSender
  text: string
  timestamp: number
}

/**
 * Game state
 */
export interface GameState {
  status: GameStatus
  turn: Turn
  usedWords: string[]
  currentWord: string
  needHead: string
  messages: Message[]
  loseReason: LoseReason
}

/**
 * Game actions
 */
export type GameAction =
  | { type: 'START_GAME' }
  | { type: 'SET_STATUS'; payload: GameStatus }
  | { type: 'USER_INPUT'; payload: string }
  | { type: 'CPU_RESPONSE'; payload: string }
  | { type: 'GAME_OVER'; payload: LoseReason }
  | { type: 'RESET' }
  | { type: 'ADD_MESSAGE'; payload: Message }

/**
 * Validation result
 */
export interface ValidationResult {
  isValid: boolean
  reason?: LoseReason
  message?: string
}

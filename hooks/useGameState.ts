'use client'

/**
 * Game state management hook
 * ゲーム状態管理フック
 */

import { useReducer } from 'react'
import type { GameState, GameAction } from '@/lib/types'
import { getLastKana } from '@/lib/utils'

/**
 * Initial game state
 * 初期ゲーム状態
 */
const initialState: GameState = {
  status: 'IDLE',
  turn: 'CPU',
  usedWords: [],
  currentWord: '',
  needHead: '',
  messages: [],
  loseReason: null
}

/**
 * Game state reducer
 * ゲーム状態リデューサー
 */
function gameReducer(state: GameState, action: GameAction): GameState {
  console.log('Action:', action.type, action)

  switch (action.type) {
    case 'START_GAME': {
      // ゲーム開始：CPUが「しりとり」を発話
      const firstWord = 'しりとり'
      const needHead = getLastKana(firstWord)

      return {
        ...initialState,
        status: 'PLAYING',
        turn: 'USER',
        currentWord: firstWord,
        needHead,
        usedWords: [firstWord],
        messages: [
          {
            sender: 'SYSTEM',
            text: 'ゲームを開始します！',
            timestamp: Date.now()
          },
          {
            sender: 'CPU',
            text: firstWord,
            timestamp: Date.now()
          }
        ]
      }
    }

    case 'SET_STATUS': {
      return {
        ...state,
        status: action.payload
      }
    }

    case 'USER_INPUT': {
      const userWord = action.payload
      const needHead = getLastKana(userWord)

      return {
        ...state,
        status: 'THINKING',
        turn: 'CPU',
        currentWord: userWord,
        needHead,
        usedWords: [...state.usedWords, userWord],
        messages: [
          ...state.messages,
          {
            sender: 'USER',
            text: userWord,
            timestamp: Date.now()
          }
        ]
      }
    }

    case 'CPU_RESPONSE': {
      const cpuWord = action.payload
      const needHead = getLastKana(cpuWord)

      return {
        ...state,
        status: 'PLAYING',
        turn: 'USER',
        currentWord: cpuWord,
        needHead,
        usedWords: [...state.usedWords, cpuWord],
        messages: [
          ...state.messages,
          {
            sender: 'CPU',
            text: cpuWord,
            timestamp: Date.now()
          }
        ]
      }
    }

    case 'GAME_OVER': {
      return {
        ...state,
        status: 'RESULT',
        loseReason: action.payload,
        messages: [
          ...state.messages,
          {
            sender: 'SYSTEM',
            text: 'ゲーム終了！',
            timestamp: Date.now()
          }
        ]
      }
    }

    case 'RESET': {
      return initialState
    }

    case 'ADD_MESSAGE': {
      return {
        ...state,
        messages: [...state.messages, action.payload]
      }
    }

    default:
      return state
  }
}

/**
 * Use game state hook
 * ゲーム状態管理フック
 */
export function useGameState() {
  const [state, dispatch] = useReducer(gameReducer, initialState)

  return {
    state,
    dispatch
  }
}

import { GameBoard } from '@/components/GameBoard'
import { GameClient } from './game-client'

export default function GamePage() {
  return (
    <GameBoard>
      <GameClient />
    </GameBoard>
  )
}
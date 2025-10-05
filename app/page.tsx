import Link from 'next/link'
import { GameBoard } from '@/components/GameBoard'

export default function HomePage() {
  return (
    <GameBoard>
      <div className="flex flex-col items-center justify-center min-h-[400px] space-y-8">
        <div className="text-center space-y-4">
          <h2 className="text-2xl font-bold text-gray-700">
            こえでしりとりをしよう！
          </h2>
          <p className="text-gray-600">
            マイクボタンをおして、ことばをいってね
          </p>
        </div>

        <Link
          href="/game"
          className="px-12 py-6 text-2xl font-bold text-white
                     bg-gradient-to-r from-blue-500 to-green-500
                     rounded-full shadow-lg transform transition
                     hover:scale-105 active:scale-95"
        >
          はじめる
        </Link>
      </div>
    </GameBoard>
  )
}

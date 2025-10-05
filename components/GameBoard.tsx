'use client'

import React from 'react'

interface GameBoardProps {
  children: React.ReactNode
}

export function GameBoard({ children }: GameBoardProps) {
  return (
    <div className="min-h-screen bg-gradient-to-b from-blue-50 to-green-50 p-4">
      <div className="max-w-4xl mx-auto">
        <header className="text-center py-6">
          <h1 className="text-4xl font-bold text-transparent bg-clip-text
                       bg-gradient-to-r from-blue-500 to-green-500">
            こどもしりとり
          </h1>
        </header>
        <main className="bg-white rounded-3xl shadow-xl p-6 md:p-8">
          {children}
        </main>
      </div>
    </div>
  )
}
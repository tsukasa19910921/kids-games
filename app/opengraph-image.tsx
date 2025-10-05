import { ImageResponse } from 'next/og'

// Image metadata
export const alt = 'こどもしりとり - 音声で遊ぶしりとりゲーム'
export const size = {
  width: 1200,
  height: 630,
}
export const contentType = 'image/png'

// OG Image generation
export default async function Image() {
  return new ImageResponse(
    (
      <div
        style={{
          background: 'linear-gradient(135deg, #667eea 0%, #764ba2 100%)',
          width: '100%',
          height: '100%',
          display: 'flex',
          flexDirection: 'column',
          alignItems: 'center',
          justifyContent: 'center',
          color: 'white',
          fontFamily: 'sans-serif',
        }}
      >
        <div
          style={{
            display: 'flex',
            flexDirection: 'column',
            alignItems: 'center',
            justifyContent: 'center',
            gap: '20px',
          }}
        >
          <div
            style={{
              fontSize: 120,
              fontWeight: 'bold',
              textShadow: '4px 4px 8px rgba(0,0,0,0.3)',
            }}
          >
            🎤 しりとり 🎮
          </div>
          <div
            style={{
              fontSize: 48,
              fontWeight: 'normal',
              opacity: 0.9,
            }}
          >
            こどもしりとり
          </div>
          <div
            style={{
              fontSize: 32,
              fontWeight: 'normal',
              opacity: 0.8,
            }}
          >
            音声で遊ぶしりとりゲーム
          </div>
        </div>
        <div
          style={{
            position: 'absolute',
            bottom: '40px',
            right: '40px',
            fontSize: 24,
            opacity: 0.7,
          }}
        >
          Next.js 15 × Web Speech API
        </div>
      </div>
    ),
    {
      ...size,
    }
  )
}

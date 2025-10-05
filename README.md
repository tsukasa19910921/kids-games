# kids-games

子供向けしりとりWebアプリケーション

## 機能

- 🎤 音声入力対応（Web Speech API）
- 🔊 音声合成でCPU応答
- ✍️ テキスト入力フォールバック
- 🎮 CPU対戦モード
- ✅ しりとりルールバリデーション
- 📊 ゲーム履歴表示

## 技術スタック

- Next.js 15.5.4 (App Router + Turbopack)
- TypeScript
- Tailwind CSS
- Web Speech API

## セットアップ

```bash
npm install
npm run dev
```

ブラウザで http://localhost:3000 にアクセス

## 開発

```bash
# 開発サーバー起動
npm run dev

# ビルド
npm run build

# プロダクション起動
npm run start

# Lintチェック
npm run lint
```

## プロジェクト構成

```
shiritori-app/
├── app/                 # Next.js App Router
│   ├── game/           # ゲーム画面
│   └── page.tsx        # トップページ
├── components/         # Reactコンポーネント
├── hooks/             # カスタムフック
│   ├── useGameState.ts
│   └── useSpeechRecognition.ts
├── lib/               # ユーティリティ・ロジック
│   ├── types.ts
│   ├── dictionary.ts
│   ├── game-logic.ts
│   ├── cpu-logic.ts
│   ├── speech.ts
│   └── utils.ts
└── public/            # 静的ファイル
```

## デプロイ

Vercelへのデプロイに最適化されています。

[![Deploy with Vercel](https://vercel.com/button)](https://vercel.com/new)

## ブラウザ対応

- Chrome/Edge (推奨)
- Safari (iOS/macOS)
- Firefox (音声機能制限あり)

※ 音声機能を使用するにはHTTPS環境が必要です（localhost除く）

## ライセンス

MIT

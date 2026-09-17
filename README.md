# One Jump

簡單直覺的一鍵跳躍網頁遊戲。使用滑鼠點擊、手機觸控、空白鍵或方向鍵跳過紅色尖刺，速度會隨分數逐漸提高。

線上遊玩：<https://pang-yiyi.github.io/abyss-protocol/>

## 開始使用

需要 Node.js 22.13 以上版本。

```bash
npm install
npm run dev
```

## 常用指令

- `npm run dev`：啟動本機開發環境
- `npm run build`：建立正式部署版本
- `npm run lint`：檢查程式碼品質

## 遊戲參數

`components/JumpGame.tsx` 中的 `GRAVITY` 與 `JUMP_FORCE` 控制跳躍手感；障礙生成間距與移動速度會依分數動態調整。

## 技術

Next.js、React、TypeScript、Canvas、Vinext / Cloudflare Workers。

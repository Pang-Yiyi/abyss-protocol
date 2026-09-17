# Abyss Protocol

可直接在瀏覽器遊玩的程序生成 Roguelike 地牢遊戲。地圖使用 BSP 切割空間，再連接所有房間中心，因此每一層都保證有可通行的起點到出口路徑。

## 開始使用

需要 Node.js 22.13 以上版本。

```bash
npm install
npm run dev
```

使用 WASD、方向鍵或手機畫面按鈕移動。

## 常用指令

- `npm run dev`：啟動本機開發環境
- `npm run build`：建立正式部署版本
- `npm run lint`：檢查程式碼品質

## 調整手感

地圖尺寸與 BSP 切割次數在 `lib/dungeon.ts`。提高切割次數會增加房間數；`3 + level * 2` 控制每層敵人數。敵人移動機率、分數與生命值在 `components/DungeonGame.tsx`，目前追蹤機率上限為 68%。

## 技術

Next.js、React、TypeScript、Canvas、Vinext / Cloudflare Workers。

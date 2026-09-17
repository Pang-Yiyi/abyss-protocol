'use client';

import { useCallback, useEffect, useRef, useState } from 'react';
import { COLS, Dungeon, Enemy, Point, ROWS, generateDungeon, isWalkable } from '@/lib/dungeon';

const TILE = 28;
const directions: Record<string, Point> = {
  ArrowUp: { x: 0, y: -1 }, w: { x: 0, y: -1 }, W: { x: 0, y: -1 },
  ArrowDown: { x: 0, y: 1 }, s: { x: 0, y: 1 }, S: { x: 0, y: 1 },
  ArrowLeft: { x: -1, y: 0 }, a: { x: -1, y: 0 }, A: { x: -1, y: 0 },
  ArrowRight: { x: 1, y: 0 }, d: { x: 1, y: 0 }, D: { x: 1, y: 0 },
};
const same = (a: Point, b: Point) => a.x === b.x && a.y === b.y;

export default function DungeonGame() {
  const [level, setLevel] = useState(1);
  const [score, setScore] = useState(0);
  const [health, setHealth] = useState(5);
  const [best, setBest] = useState(1);
  const [message, setMessage] = useState('找到出口，深入下一層');
  const [dungeon, setDungeon] = useState<Dungeon>(() => generateDungeon(1));
  const canvasRef = useRef<HTMLCanvasElement>(null);

  const reset = useCallback(() => {
    setLevel(1); setScore(0); setHealth(5); setMessage('新的地牢已生成'); setDungeon(generateDungeon(1));
  }, []);

  const nextLevel = useCallback((currentLevel: number) => {
    const next = currentLevel + 1;
    setLevel(next); setScore((value) => value + 100 * currentLevel); setHealth((value) => Math.min(7, value + 1));
    setDungeon(generateDungeon(next)); setMessage(`第 ${next} 層：敵人變多了`);
    setBest((value) => { const updated = Math.max(value, next); localStorage.setItem('abyss-best', String(updated)); return updated; });
  }, []);

  const move = useCallback((delta: Point) => {
    setDungeon((current) => {
      const target = { x: current.player.x + delta.x, y: current.player.y + delta.y };
      if (!isWalkable(current, target)) return current;
      const enemy = current.enemies.find((item) => same(item, target));
      let enemies = current.enemies;
      if (enemy) { enemies = current.enemies.filter((item) => item.id !== enemy.id); setScore((value) => value + 25); setMessage('擊退守衛！'); }
      if (same(target, current.exit)) { queueMicrotask(() => nextLevel(level)); return current; }

      let nextEnemies = enemies;
      // 越深入，守衛每回合追蹤玩家的機率越高，但上限避免難度失控。
      if (level >= 2 && Math.random() < Math.min(0.3 + level * 0.035, 0.68)) {
        const occupied = new Set(enemies.map((item) => `${item.x},${item.y}`));
        nextEnemies = enemies.map((item): Enemy => {
          const dx = Math.sign(target.x - item.x), dy = Math.sign(target.y - item.y);
          const options = Math.random() > 0.5 ? [{ x: item.x + dx, y: item.y }, { x: item.x, y: item.y + dy }] : [{ x: item.x, y: item.y + dy }, { x: item.x + dx, y: item.y }];
          const step = options.find((point) => isWalkable(current, point) && !same(point, current.exit) && !occupied.has(`${point.x},${point.y}`));
          return step ? { ...item, ...step } : item;
        });
      }
      if (nextEnemies.some((item) => same(item, target))) {
        setHealth((value) => { const remaining = value - 1; if (remaining <= 0) queueMicrotask(reset); return Math.max(0, remaining); });
        setMessage('受到攻擊！繼續移動');
      }
      return { ...current, player: target, enemies: nextEnemies };
    });
  }, [level, nextLevel, reset]);

  useEffect(() => {
    const onKey = (event: KeyboardEvent) => { const direction = directions[event.key]; if (!direction) return; event.preventDefault(); move(direction); };
    window.addEventListener('keydown', onKey); return () => window.removeEventListener('keydown', onKey);
  }, [move]);

  useEffect(() => {
    const canvas = canvasRef.current, context = canvas?.getContext('2d');
    if (!canvas || !context) return;
    const scale = window.devicePixelRatio || 1;
    canvas.width = COLS * TILE * scale; canvas.height = ROWS * TILE * scale; context.scale(scale, scale);
    context.fillStyle = '#090b10'; context.fillRect(0, 0, COLS * TILE, ROWS * TILE);
    dungeon.tiles.forEach((row, y) => row.forEach((tile, x) => { if (tile) { context.fillStyle = (x + y) % 2 ? '#181c24' : '#1b2029'; context.fillRect(x * TILE, y * TILE, TILE - 1, TILE - 1); } }));
    const glow = (point: Point, color: string, radius: number) => { context.save(); context.shadowColor = color; context.shadowBlur = 16; context.fillStyle = color; context.beginPath(); context.arc(point.x * TILE + TILE / 2, point.y * TILE + TILE / 2, radius, 0, Math.PI * 2); context.fill(); context.restore(); };
    glow(dungeon.exit, '#f5c451', 7);
    dungeon.enemies.forEach((enemy) => { context.fillStyle = '#e85858'; context.fillRect(enemy.x * TILE + 7, enemy.y * TILE + 7, 14, 14); context.fillStyle = '#fff0df'; context.fillRect(enemy.x * TILE + 10, enemy.y * TILE + 10, 3, 3); context.fillRect(enemy.x * TILE + 16, enemy.y * TILE + 10, 3, 3); });
    glow(dungeon.player, '#58e8c1', 9); context.strokeStyle = '#d8fff5'; context.lineWidth = 2; context.strokeRect(dungeon.player.x * TILE + 7, dungeon.player.y * TILE + 7, 14, 14);
  }, [dungeon]);

  return <main className="shell">
    <header className="topbar"><div className="brand"><span className="brand-mark">A</span><span>ABYSS PROTOCOL</span></div><div className="status-dot"><span /> 系統上線</div></header>
    <section className="game-layout">
      <aside className="intro-panel"><p className="eyebrow">程序生成探索遊戲</p><h1>深入。<br /><em>活著回來。</em></h1><p className="lede">每一層都由演算法重新構築。擊退紅色守衛，找到金色出口，看看你能抵達多深。</p><div className="keys"><div><kbd>W</kbd><kbd>↑</kbd></div><div><kbd>A</kbd><kbd>S</kbd><kbd>D</kbd></div><small>WASD 或方向鍵移動</small></div><button className="text-button" onClick={reset}>↻ 重新開始</button></aside>
      <section className="board-wrap" aria-label="遊戲區域"><div className="scanline" /><canvas ref={canvasRef} style={{ aspectRatio: `${COLS}/${ROWS}` }} /><div className="mobile-controls"><button onClick={() => move({ x: 0, y: -1 })} aria-label="向上">↑</button><div><button onClick={() => move({ x: -1, y: 0 })} aria-label="向左">←</button><button onClick={() => move({ x: 0, y: 1 })} aria-label="向下">↓</button><button onClick={() => move({ x: 1, y: 0 })} aria-label="向右">→</button></div></div></section>
      <aside className="stats-panel"><div className="stat"><span>目前層數</span><strong>{String(level).padStart(2, '0')}</strong></div><div className="stat"><span>探索分數</span><strong>{score.toLocaleString()}</strong></div><div className="stat"><span>生命訊號</span><div className="health">{Array.from({ length: 7 }, (_, i) => <i key={i} className={i < health ? 'alive' : ''} />)}</div></div><div className="legend"><p><i className="you" /> 探索者</p><p><i className="foe" /> 守衛</p><p><i className="gate" /> 出口</p></div><div className="message"><span>任務簡報</span><p>{message}</p></div><div className="best">最深紀錄 <strong>{best}F</strong></div></aside>
    </section>
    <footer><span>地圖以 BSP 演算法即時生成</span><span>路徑連通性：已驗證</span></footer>
  </main>;
}

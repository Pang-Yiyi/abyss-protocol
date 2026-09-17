'use client';

import { useCallback, useEffect, useRef, useState } from 'react';

type GameState = 'ready' | 'playing' | 'over';
type Obstacle = { x: number; width: number; height: number; counted: boolean };

const WORLD_W = 900;
const WORLD_H = 460;
const GROUND_Y = 370;
const PLAYER_X = 120;
const PLAYER_SIZE = 42;
const GRAVITY = 0.82;
const JUMP_FORCE = -15.5;

export default function JumpGame() {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const frameRef = useRef<number | null>(null);
  const stateRef = useRef<GameState>('ready');
  const playerRef = useRef({ y: GROUND_Y - PLAYER_SIZE, velocity: 0, rotation: 0 });
  const obstaclesRef = useRef<Obstacle[]>([]);
  const lastSpawnRef = useRef(0);
  const distanceRef = useRef(0);
  const scoreRef = useRef(0);
  const [state, setState] = useState<GameState>('ready');
  const [score, setScore] = useState(0);
  const [best, setBest] = useState(0);

  const resetWorld = useCallback(() => {
    playerRef.current = { y: GROUND_Y - PLAYER_SIZE, velocity: 0, rotation: 0 };
    obstaclesRef.current = [];
    lastSpawnRef.current = 0;
    distanceRef.current = 0;
    scoreRef.current = 0;
    setScore(0);
  }, []);

  const jump = useCallback(() => {
    if (stateRef.current === 'over') {
      resetWorld(); stateRef.current = 'playing'; setState('playing'); playerRef.current.velocity = JUMP_FORCE; return;
    }
    if (stateRef.current === 'ready') { stateRef.current = 'playing'; setState('playing'); }
    const player = playerRef.current;
    if (player.y >= GROUND_Y - PLAYER_SIZE - 2) player.velocity = JUMP_FORCE;
  }, [resetWorld]);

  useEffect(() => {
    const saved = Number(localStorage.getItem('one-jump-best') || 0);
    const timer = window.setTimeout(() => setBest(saved), 0);
    return () => window.clearTimeout(timer);
  }, []);

  useEffect(() => {
    const onKey = (event: KeyboardEvent) => {
      if (event.code === 'Space' || event.code === 'ArrowUp') { event.preventDefault(); jump(); }
    };
    window.addEventListener('keydown', onKey); return () => window.removeEventListener('keydown', onKey);
  }, [jump]);

  useEffect(() => {
    const canvas = canvasRef.current, ctx = canvas?.getContext('2d');
    if (!canvas || !ctx) return;
    const scale = Math.min(window.devicePixelRatio || 1, 2);
    canvas.width = WORLD_W * scale; canvas.height = WORLD_H * scale; ctx.scale(scale, scale);

    const draw = () => {
      if (stateRef.current === 'playing') {
        const speed = 7 + Math.min(scoreRef.current * 0.14, 7);
        distanceRef.current += speed;
        const player = playerRef.current;
        player.velocity += GRAVITY; player.y += player.velocity;
        if (player.y >= GROUND_Y - PLAYER_SIZE) { player.y = GROUND_Y - PLAYER_SIZE; player.velocity = 0; player.rotation = 0; }
        else player.rotation = Math.min(player.rotation + 0.055, 0.35);

        const spawnGap = Math.max(760, 1120 - scoreRef.current * 11);
        if (distanceRef.current - lastSpawnRef.current > spawnGap) {
          const height = 42 + Math.random() * Math.min(38, 12 + scoreRef.current * 1.2);
          obstaclesRef.current.push({ x: WORLD_W + 30, width: 30 + Math.random() * 22, height, counted: false });
          lastSpawnRef.current = distanceRef.current;
        }
        obstaclesRef.current.forEach((obstacle) => { obstacle.x -= speed; });
        obstaclesRef.current = obstaclesRef.current.filter((obstacle) => obstacle.x + obstacle.width > -20);
        for (const obstacle of obstaclesRef.current) {
          if (!obstacle.counted && obstacle.x + obstacle.width < PLAYER_X) { obstacle.counted = true; scoreRef.current += 1; setScore(scoreRef.current); }
          const hit = PLAYER_X + PLAYER_SIZE - 7 > obstacle.x && PLAYER_X + 7 < obstacle.x + obstacle.width && player.y + PLAYER_SIZE - 5 > GROUND_Y - obstacle.height;
          if (hit) {
            stateRef.current = 'over'; setState('over');
            setBest((current) => { const next = Math.max(current, scoreRef.current); localStorage.setItem('one-jump-best', String(next)); return next; });
          }
        }
      }

      const sky = ctx.createLinearGradient(0, 0, 0, GROUND_Y);
      sky.addColorStop(0, '#f8d8c7'); sky.addColorStop(.55, '#f8e9d4'); sky.addColorStop(1, '#fff4dd');
      ctx.fillStyle = sky; ctx.fillRect(0, 0, WORLD_W, WORLD_H);
      ctx.fillStyle = '#e9ad91'; ctx.beginPath(); ctx.arc(720, 96, 44, 0, Math.PI * 2); ctx.fill();
      ctx.globalAlpha = .28; ctx.fillStyle = '#bd806f';
      for (let i = 0; i < 7; i += 1) { const x = ((i * 190 - distanceRef.current * .08) % 1200) - 100; ctx.beginPath(); ctx.moveTo(x, GROUND_Y); ctx.lineTo(x + 130, 205 + (i % 2) * 30); ctx.lineTo(x + 280, GROUND_Y); ctx.fill(); }
      ctx.globalAlpha = 1; ctx.fillStyle = '#26313a'; ctx.fillRect(0, GROUND_Y, WORLD_W, WORLD_H - GROUND_Y); ctx.fillStyle = '#38434b';
      for (let x = -((distanceRef.current * .7) % 54); x < WORLD_W; x += 54) ctx.fillRect(x, GROUND_Y + 20, 28, 3);
      obstaclesRef.current.forEach((obstacle) => { ctx.fillStyle = '#d35f50'; ctx.beginPath(); ctx.moveTo(obstacle.x, GROUND_Y); ctx.lineTo(obstacle.x + obstacle.width / 2, GROUND_Y - obstacle.height); ctx.lineTo(obstacle.x + obstacle.width, GROUND_Y); ctx.closePath(); ctx.fill(); ctx.fillStyle = '#f4a076'; ctx.fillRect(obstacle.x + obstacle.width / 2 - 3, GROUND_Y - obstacle.height + 11, 6, 11); });
      const player = playerRef.current;
      ctx.save(); ctx.translate(PLAYER_X + PLAYER_SIZE / 2, player.y + PLAYER_SIZE / 2); ctx.rotate(player.rotation); ctx.fillStyle = '#188f84'; ctx.fillRect(-21, -21, 42, 42); ctx.fillStyle = '#f8e9d4'; ctx.fillRect(5, -10, 7, 7); ctx.fillStyle = '#17252b'; ctx.fillRect(8, -8, 3, 3); ctx.fillStyle = '#f2b04b'; ctx.fillRect(18, -2, 13, 8); ctx.restore();
      if (stateRef.current !== 'playing') { ctx.fillStyle = '#17252bd9'; ctx.fillRect(0, 0, WORLD_W, WORLD_H); ctx.textAlign = 'center'; ctx.fillStyle = '#fff8e9'; ctx.font = '700 34px sans-serif'; ctx.fillText(stateRef.current === 'ready' ? '準備好了嗎？' : '撞到了！', WORLD_W / 2, 180); ctx.fillStyle = '#f5c66c'; ctx.font = '600 18px sans-serif'; ctx.fillText(stateRef.current === 'ready' ? '點一下就開始跳' : '再點一下重新挑戰', WORLD_W / 2, 222); }
      frameRef.current = requestAnimationFrame(draw);
    };
    frameRef.current = requestAnimationFrame(draw);
    return () => { if (frameRef.current) cancelAnimationFrame(frameRef.current); };
  }, []);

  return <main className="jump-shell"><header className="jump-header"><div className="jump-logo"><span>↑</span> ONE JUMP</div><p>一鍵跳躍 · 無限挑戰</p></header><section className="jump-stage"><div className="scoreboard"><div><small>分數</small><strong>{String(score).padStart(2, '0')}</strong></div><div><small>最高</small><strong>{String(best).padStart(2, '0')}</strong></div></div><button className="canvas-button" onClick={jump} aria-label={state === 'playing' ? '跳躍' : '開始遊戲'}><canvas ref={canvasRef} /></button><div className="jump-instruction"><span className="pulse-dot" /><strong>{state === 'playing' ? '點擊畫面跳躍' : state === 'over' ? '再試一次' : '開始遊戲'}</strong><span>滑鼠點擊 · 觸控 · 空白鍵</span></div></section><footer className="jump-footer"><span>避開紅色尖刺</span><span>速度會隨分數提升</span></footer></main>;
}

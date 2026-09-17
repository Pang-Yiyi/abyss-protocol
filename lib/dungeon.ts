export type Point = { x: number; y: number };
export type Room = { x: number; y: number; w: number; h: number };
export type Enemy = Point & { id: number; hp: number };
export type Dungeon = { tiles: number[][]; rooms: Room[]; player: Point; exit: Point; enemies: Enemy[] };

export const COLS = 31;
export const ROWS = 21;
const key = ({ x, y }: Point) => `${x},${y}`;
const center = (room: Room): Point => ({ x: Math.floor(room.x + room.w / 2), y: Math.floor(room.y + room.h / 2) });

function carveRoom(tiles: number[][], room: Room) {
  for (let y = room.y; y < room.y + room.h; y += 1) {
    for (let x = room.x; x < room.x + room.w; x += 1) tiles[y][x] = 1;
  }
}

function carveCorridor(tiles: number[][], a: Point, b: Point, horizontalFirst: boolean) {
  if (horizontalFirst) {
    for (let x = Math.min(a.x, b.x); x <= Math.max(a.x, b.x); x += 1) tiles[a.y][x] = 1;
    for (let y = Math.min(a.y, b.y); y <= Math.max(a.y, b.y); y += 1) tiles[y][b.x] = 1;
  } else {
    for (let y = Math.min(a.y, b.y); y <= Math.max(a.y, b.y); y += 1) tiles[y][a.x] = 1;
    for (let x = Math.min(a.x, b.x); x <= Math.max(a.x, b.x); x += 1) tiles[b.y][x] = 1;
  }
}

// BSP 反覆切割空間，再在每個葉節點放置房間。
// 依序連接房間中心，因此起點到出口一定存在可通行路徑。
export function generateDungeon(level: number): Dungeon {
  const tiles = Array.from({ length: ROWS }, () => Array(COLS).fill(0));
  let leaves: Room[] = [{ x: 1, y: 1, w: COLS - 2, h: ROWS - 2 }];

  for (let pass = 0; pass < 3; pass += 1) {
    const next: Room[] = [];
    for (const leaf of leaves) {
      const vertical = leaf.w / leaf.h > 1.25 || (leaf.w / leaf.h > 0.8 && Math.random() > 0.5);
      const span = vertical ? leaf.w : leaf.h;
      if (span < 10) { next.push(leaf); continue; }
      const cut = Math.floor(span * (0.38 + Math.random() * 0.24));
      if (vertical) next.push({ ...leaf, w: cut }, { x: leaf.x + cut, y: leaf.y, w: leaf.w - cut, h: leaf.h });
      else next.push({ ...leaf, h: cut }, { x: leaf.x, y: leaf.y + cut, w: leaf.w, h: leaf.h - cut });
    }
    leaves = next;
  }

  const rooms = leaves.map((leaf) => {
    const marginX = 1 + Math.floor(Math.random() * Math.max(1, Math.min(3, leaf.w - 5)));
    const marginY = 1 + Math.floor(Math.random() * Math.max(1, Math.min(3, leaf.h - 5)));
    return { x: leaf.x + marginX, y: leaf.y + marginY, w: Math.max(3, leaf.w - marginX - 1 - Math.floor(Math.random() * 2)), h: Math.max(3, leaf.h - marginY - 1 - Math.floor(Math.random() * 2)) };
  });

  rooms.forEach((room) => carveRoom(tiles, room));
  for (let i = 1; i < rooms.length; i += 1) carveCorridor(tiles, center(rooms[i - 1]), center(rooms[i]), Math.random() > 0.5);

  const player = center(rooms[0]);
  const exit = center(rooms[rooms.length - 1]);
  const blocked = new Set([key(player), key(exit)]);
  const candidates = rooms.slice(1).flatMap((room) => {
    const spots: Point[] = [];
    for (let y = room.y; y < room.y + room.h; y += 1) for (let x = room.x; x < room.x + room.w; x += 1) spots.push({ x, y });
    return spots;
  }).sort(() => Math.random() - 0.5);
  const enemies = candidates.filter((spot) => !blocked.has(key(spot))).slice(0, 3 + level * 2).map((spot, id) => ({ ...spot, id, hp: 1 }));
  return { tiles, rooms, player, exit, enemies };
}

export function isWalkable(dungeon: Dungeon, point: Point) {
  return point.x >= 0 && point.x < COLS && point.y >= 0 && point.y < ROWS && dungeon.tiles[point.y][point.x] === 1;
}

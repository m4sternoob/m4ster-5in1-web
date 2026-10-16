/* 2048 board logic, ported from the Android app (Twenty48Game.kt).
   A board is 16 cells in row-major order; 0 means empty.
   Rules: swipe merges equal tiles, each merge scores its new value,
   a 2 (90%) or 4 (10%) spawns after every move that changes the board. */

export const GRID = 4;
export type Direction = "up" | "down" | "left" | "right";

export interface MoveResult {
  board: number[];
  gained: number;
  moved: boolean;
}

/** Fresh board with two starting tiles. */
export function newBoard(): number[] {
  let b = Array<number>(16).fill(0);
  b = spawnTile(b);
  b = spawnTile(b);
  return b;
}

/** Drop a 2 (90%) or 4 (10%) on a random empty cell. */
export function spawnTile(board: number[]): number[] {
  const empty: number[] = [];
  board.forEach((v, i) => {
    if (v === 0) empty.push(i);
  });
  if (empty.length === 0) return board;
  const cell = empty[Math.floor(Math.random() * empty.length)];
  const next = [...board];
  next[cell] = Math.random() < 0.9 ? 2 : 4;
  return next;
}

/* Cell-index lines in swipe order for a direction. Merges pull
   toward the front of each line. */
function linesFor(dir: Direction): number[][] {
  const rows = [0, 1, 2, 3].map((r) => [0, 1, 2, 3].map((c) => r * 4 + c));
  const cols = [0, 1, 2, 3].map((c) => [0, 1, 2, 3].map((r) => r * 4 + c));
  if (dir === "left") return rows;
  if (dir === "right") return rows.map((r) => [...r].reverse());
  if (dir === "up") return cols;
  return cols.map((c) => [...c].reverse());
}

/** Slide and merge toward dir. Returns the new board and points gained. */
export function move(board: number[], dir: Direction): MoveResult {
  const next = Array<number>(16).fill(0);
  let gained = 0;
  for (const line of linesFor(dir)) {
    const tiles = line.map((i) => board[i]).filter((v) => v !== 0);
    const placed: number[] = [];
    let i = 0;
    while (i < tiles.length) {
      if (i + 1 < tiles.length && tiles[i + 1] === tiles[i]) {
        const merged = tiles[i] * 2;
        gained += merged;
        placed.push(merged);
        i += 2;
      } else {
        placed.push(tiles[i]);
        i += 1;
      }
    }
    line.forEach((cell, idx) => {
      next[cell] = placed[idx] ?? 0;
    });
  }
  const moved = next.some((v, i) => v !== board[i]);
  return { board: moved ? spawnTile(next) : next, gained, moved };
}

/** Any legal move left: an empty cell, or two equal neighbours. */
export function canMove(board: number[]): boolean {
  if (board.some((v) => v === 0)) return true;
  for (let r = 0; r < 4; r++) {
    for (let c = 0; c < 4; c++) {
      const v = board[r * 4 + c];
      if (c + 1 < 4 && board[r * 4 + c + 1] === v) return true;
      if (r + 1 < 4 && board[(r + 1) * 4 + c] === v) return true;
    }
  }
  return false;
}

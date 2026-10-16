/* Connect 4 logic, ported from the Android app (FourInARowGame.kt).
   7-wide, 6-tall board in row-major order, row 0 is the top.
   'X' is the player, 'O' is the CPU, ' ' is empty. */

export const COLS = 7;
export const ROWS = 6;
export const PLAYER = "X";
export const CPU = "O";
export const EMPTY = " ";

export type Mark = typeof PLAYER | typeof CPU | typeof EMPTY;

/** Lowest empty row in a column, or -1 when full. */
export function dropRow(board: Mark[], col: number): number {
  for (let row = ROWS - 1; row >= 0; row--) {
    if (board[row * COLS + col] === EMPTY) return row;
  }
  return -1;
}

/** Board copy with mark dropped into the column, or null when full. */
export function dropDisc(board: Mark[], col: number, mark: Mark): Mark[] | null {
  const row = dropRow(board, col);
  if (row < 0) return null;
  const next = [...board];
  next[row * COLS + col] = mark;
  return next;
}

/** The four winning cells, or null. */
export function winningLineOf(board: Mark[]): number[] | null {
  for (let r = 0; r < ROWS; r++) {
    for (let c = 0; c < COLS; c++) {
      const i = r * COLS + c;
      const mark = board[i];
      if (mark === EMPTY) continue;
      if (c + 3 < COLS && [1, 2, 3].every((k) => board[i + k] === mark))
        return [i, i + 1, i + 2, i + 3];
      if (r + 3 < ROWS && [1, 2, 3].every((k) => board[i + k * COLS] === mark))
        return [i, i + COLS, i + 2 * COLS, i + 3 * COLS];
      if (
        c + 3 < COLS &&
        r + 3 < ROWS &&
        [1, 2, 3].every((k) => board[i + k * (COLS + 1)] === mark)
      )
        return [i, i + COLS + 1, i + 2 * (COLS + 1), i + 3 * (COLS + 1)];
      if (
        c - 3 >= 0 &&
        r + 3 < ROWS &&
        [1, 2, 3].every((k) => board[i + k * (COLS - 1)] === mark)
      )
        return [i, i + COLS - 1, i + 2 * (COLS - 1), i + 3 * (COLS - 1)];
    }
  }
  return null;
}

export function boardFull(board: Mark[]): boolean {
  return !board.includes(EMPTY);
}

/** A column that completes four for mark right now, or -1. */
function winningMove(board: Mark[], mark: Mark): number {
  for (let col = 0; col < COLS; col++) {
    const next = dropDisc(board, col, mark);
    if (next && winningLineOf(next)) return col;
  }
  return -1;
}

/** The brain: take the win, block the opponent's win, else prefer center. */
export function suggestColumn(board: Mark[], mark: Mark): number {
  const open = Array.from({ length: COLS }, (_, c) => c).filter(
    (c) => dropRow(board, c) >= 0,
  );
  if (open.length === 0) return -1;
  const foe = mark === PLAYER ? CPU : PLAYER;
  const win = winningMove(board, mark);
  if (win >= 0) return win;
  const block = winningMove(board, foe);
  if (block >= 0) return block;
  return open.reduce((a, b) =>
    Math.abs(b - COLS / 2) < Math.abs(a - COLS / 2) ? b : a,
  );
}

/** CPU: Easy drops anywhere, Hard plays the brain. */
export function pickCpuMove(board: Mark[], hard: boolean): number {
  if (!hard) {
    const open = Array.from({ length: COLS }, (_, c) => c).filter(
      (c) => dropRow(board, c) >= 0,
    );
    return open.length ? open[Math.floor(Math.random() * open.length)] : -1;
  }
  return suggestColumn(board, CPU);
}

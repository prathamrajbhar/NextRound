export function detectBlobsFromCanvas(
  video: HTMLVideoElement,
  canvas: HTMLCanvasElement
): number {
  const ctx = canvas.getContext('2d');
  if (!ctx || video.paused || video.ended) return 0;

  ctx.drawImage(video, 0, 0, 160, 120);
  const imgData = ctx.getImageData(0, 0, 160, 120);
  const data = imgData.data;

  const gridCols = 8;
  const gridRows = 6;
  const cellWidth = 20;
  const cellHeight = 20;
  const grid: number[][] = Array(gridRows)
    .fill(0)
    .map(() => Array(gridCols).fill(0));

  for (let y = 0; y < 120; y += 2) {
    for (let x = 0; x < 160; x += 2) {
      const idx = (y * 160 + x) * 4;
      const r = data[idx];
      const g = data[idx + 1];
      const b = data[idx + 2];

      const Y = 0.299 * r + 0.587 * g + 0.114 * b;
      const Cb = -0.1687 * r - 0.3313 * g + 0.5 * b + 128;
      const Cr = 0.5 * r - 0.4187 * g - 0.0813 * b + 128;

      if (Y > 40 && Cb > 85 && Cb < 135 && Cr > 135 && Cr < 180) {
        const col = Math.floor(x / cellWidth);
        const row = Math.floor(y / cellHeight);
        if (col < gridCols && row < gridRows) {
          grid[row][col]++;
        }
      }
    }
  }

  const threshold = 30;
  const visited: boolean[][] = Array(gridRows)
    .fill(0)
    .map(() => Array(gridCols).fill(false));
  let blobs = 0;

  for (let r = 0; r < gridRows; r++) {
    for (let c = 0; c < gridCols; c++) {
      if (grid[r][c] >= threshold && !visited[r][c]) {
        blobs++;
        const queue: [number, number][] = [[r, c]];
        visited[r][c] = true;
        while (queue.length > 0) {
          const [currR, currC] = queue.shift()!;
          const directions = [
            [-1, 0],
            [1, 0],
            [0, -1],
            [0, 1],
          ];
          for (const [dr, dc] of directions) {
            const newR = currR + dr;
            const newC = currC + dc;
            if (
              newR >= 0 &&
              newR < gridRows &&
              newC >= 0 &&
              newC < gridCols &&
              grid[newR][newC] >= threshold &&
              !visited[newR][newC]
            ) {
              visited[newR][newC] = true;
              queue.push([newR, newC]);
            }
          }
        }
      }
    }
  }

  return blobs;
}

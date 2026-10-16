const QR_SIZE = 29;

function seedFromPayload(payload: string): number {
  let hash = 2166136261;
  for (let index = 0; index < payload.length; index++) {
    hash ^= payload.charCodeAt(index);
    hash = Math.imul(hash, 16777619);
  }
  return (hash >>> 0) || 1;
}

export function qrModules(payload: string, size: number = QR_SIZE): boolean[][] {
  const grid: boolean[][] = Array.from({ length: size }, () =>
    Array.from({ length: size }, () => false),
  );

  let state = seedFromPayload(payload);
  const next = () => {
    state ^= state << 13;
    state >>>= 0;
    state ^= state >>> 17;
    state ^= state << 5;
    state >>>= 0;
    return state;
  };

  const finderZones: Array<[number, number]> = [
    [0, 0],
    [0, size - 7],
    [size - 7, 0],
  ];
  const insideFinder = (row: number, col: number) =>
    finderZones.some(
      ([zoneRow, zoneCol]) =>
        row >= zoneRow - 1 &&
        row <= zoneRow + 7 &&
        col >= zoneCol - 1 &&
        col <= zoneCol + 7,
    );

  for (let row = 0; row < size; row++) {
    for (let col = 0; col < size; col++) {
      if (insideFinder(row, col)) continue;
      if (row === 6) {
        grid[row][col] = col % 2 === 0;
        continue;
      }
      if (col === 6) {
        grid[row][col] = row % 2 === 0;
        continue;
      }
      grid[row][col] = next() % 100 < 46;
    }
  }

  const drawBlock = (
    startRow: number,
    startCol: number,
    blockSize: number,
    core: (row: number, col: number) => boolean,
  ) => {
    for (let row = 0; row < blockSize; row++) {
      for (let col = 0; col < blockSize; col++) {
        const ring =
          row === 0 ||
          row === blockSize - 1 ||
          col === 0 ||
          col === blockSize - 1;
        grid[startRow + row][startCol + col] = ring || core(row, col);
      }
    }
  };

  for (const [zoneRow, zoneCol] of finderZones) {
    drawBlock(
      zoneRow,
      zoneCol,
      7,
      (row, col) => row >= 2 && row <= 4 && col >= 2 && col <= 4,
    );
  }
  drawBlock(size - 9, size - 9, 5, (row, col) => row === 2 && col === 2);

  return grid;
}

// Minimal QR encoder: byte mode, error-correction level M, versions 1–10.
// Produces the module matrix and an inline SVG string.

const VERSION_MAX = 10;

// ── Galois field GF(256), primitive polynomial 0x11d ────────────────────────
const EXP = new Uint8Array(512);
const LOG = new Uint8Array(256);
{
  let x = 1;
  for (let i = 0; i < 255; i += 1) {
    EXP[i] = x;
    LOG[x] = i;
    x <<= 1;
    if (x & 0x100) x ^= 0x11d;
  }
  for (let i = 255; i < 512; i += 1) EXP[i] = EXP[i - 255];
}

function gfMul(a: number, b: number): number {
  if (a === 0 || b === 0) return 0;
  return EXP[LOG[a] + LOG[b]];
}

// ── Version / EC-level tables (EC level M) ──────────────────────────────────
interface EcBlock {
  count: number;
  data: number;
}

interface VersionSpec {
  ecPerBlock: number;
  dataCodewords: number;
  blocks: EcBlock[];
  align: number[];
}

const VERSIONS: Record<number, VersionSpec> = {
  1: { ecPerBlock: 10, dataCodewords: 16, blocks: [{ count: 1, data: 16 }], align: [] },
  2: { ecPerBlock: 16, dataCodewords: 28, blocks: [{ count: 1, data: 28 }], align: [6, 18] },
  3: { ecPerBlock: 26, dataCodewords: 44, blocks: [{ count: 1, data: 44 }], align: [6, 22] },
  4: { ecPerBlock: 18, dataCodewords: 64, blocks: [{ count: 2, data: 32 }], align: [6, 26] },
  5: { ecPerBlock: 24, dataCodewords: 86, blocks: [{ count: 2, data: 43 }], align: [6, 30] },
  6: { ecPerBlock: 16, dataCodewords: 108, blocks: [{ count: 4, data: 27 }], align: [6, 34] },
  7: { ecPerBlock: 18, dataCodewords: 124, blocks: [{ count: 4, data: 31 }], align: [6, 22, 38] },
  8: { ecPerBlock: 22, dataCodewords: 154, blocks: [{ count: 2, data: 38 }, { count: 2, data: 39 }], align: [6, 24, 42] },
  9: { ecPerBlock: 22, dataCodewords: 182, blocks: [{ count: 3, data: 36 }, { count: 2, data: 37 }], align: [6, 26, 46] },
  10: { ecPerBlock: 26, dataCodewords: 216, blocks: [{ count: 4, data: 43 }, { count: 1, data: 44 }], align: [6, 28, 50] },
};

const FORMAT_MASK = 0x5412;
const EC_M_FORMAT_BITS = 0; // 0b00

// ── Reed–Solomon ─────────────────────────────────────────────────────────────
// Polynomials are stored highest-degree-first (coefficient of x^n at index 0),
// the same convention used by the QR spec's reference implementations.
function polyMultiply(a: number[], b: number[]): number[] {
  const out = new Array(a.length + b.length - 1).fill(0);
  for (let i = 0; i < a.length; i += 1) {
    for (let j = 0; j < b.length; j += 1) {
      out[i + j] ^= gfMul(a[i], b[j]);
    }
  }
  return out;
}

function buildGeneratorPoly(degree: number): number[] {
  let poly = [1];
  for (let i = 0; i < degree; i += 1) {
    // multiply by (x + α^i)
    poly = polyMultiply(poly, [1, EXP[i]]);
  }
  return poly;
}

function computeEc(data: number[], ecLen: number): number[] {
  const gen = buildGeneratorPoly(ecLen);
  const remainder = new Array(ecLen).fill(0);
  for (const byte of data) {
    const factor = byte ^ remainder[0];
    remainder.copyWithin(0, 1);
    remainder[ecLen - 1] = 0;
    for (let i = 0; i < ecLen; i += 1) {
      remainder[i] ^= gfMul(gen[i + 1], factor);
    }
  }
  return remainder;
}

// ── Bit buffer ───────────────────────────────────────────────────────────────
class BitBuffer {
  bits: number[] = [];

  push(value: number, length: number): void {
    for (let i = length - 1; i >= 0; i -= 1) {
      this.bits.push((value >>> i) & 1);
    }
  }

  toCodewords(): number[] {
    const out: number[] = [];
    for (let i = 0; i + 7 < this.bits.length; i += 8) {
      let byte = 0;
      for (let j = 0; j < 8; j += 1) byte = (byte << 1) | this.bits[i + j];
      out.push(byte);
    }
    return out;
  }
}

function buildDataCodewords(bytes: Uint8Array, version: number, dataCodewords: number): number[] {
  const buffer = new BitBuffer();
  buffer.push(0b0100, 4); // byte mode
  const countBits = version < 10 ? 8 : 16;
  buffer.push(bytes.length, countBits);
  for (const byte of bytes) buffer.push(byte, 8);

  const capacityBits = dataCodewords * 8;
  const terminator = Math.min(4, capacityBits - buffer.bits.length);
  for (let i = 0; i < terminator; i += 1) buffer.bits.push(0);
  while (buffer.bits.length % 8 !== 0) buffer.bits.push(0);
  const pad = [0xec, 0x11];
  let i = 0;
  while (buffer.bits.length < capacityBits) {
    buffer.push(pad[i % 2], 8);
    i += 1;
  }
  return buffer.toCodewords();
}

function interleave(blocks: { data: number[]; ec: number[] }[]): number[] {
  const dataLen = Math.max(...blocks.map((block) => block.data.length));
  const ecLen = blocks[0].ec.length;
  const out: number[] = [];
  for (let i = 0; i < dataLen; i += 1) {
    for (const block of blocks) if (i < block.data.length) out.push(block.data[i]);
  }
  for (let i = 0; i < ecLen; i += 1) {
    for (const block of blocks) if (i < block.ec.length) out.push(block.ec[i]);
  }
  return out;
}

// ── Mask functions (true → flip) ────────────────────────────────────────────
function maskCondition(mask: number, x: number, y: number): boolean {
  switch (mask) {
    case 0:
      return (x + y) % 2 === 0;
    case 1:
      return y % 2 === 0;
    case 2:
      return x % 3 === 0;
    case 3:
      return (x + y) % 3 === 0;
    case 4:
      return (Math.floor(x / 3) + Math.floor(y / 2)) % 2 === 0;
    case 5:
      return ((x * y) % 2) + ((x * y) % 3) === 0;
    case 6:
      return (((x * y) % 2) + ((x * y) % 3)) % 2 === 0;
    case 7:
      return (((x + y) % 2) + ((x * y) % 3)) % 2 === 0;
    default:
      return false;
  }
}

// ── Encoder ──────────────────────────────────────────────────────────────────
export interface QrMatrix {
  size: number;
  modules: boolean[][]; // modules[row][col], true = dark
}

export function encodeQr(text: string): QrMatrix {
  const bytes = new TextEncoder().encode(text);
  const version = chooseVersion(bytes.length);
  if (version === 0) throw new Error("QR payload too large (versions 1–10 only)");

  const spec = VERSIONS[version];
  const dataCodewords = buildDataCodewords(bytes, version, spec.dataCodewords);

  const blocks: { data: number[]; ec: number[] }[] = [];
  let offset = 0;
  for (const block of spec.blocks) {
    for (let i = 0; i < block.count; i += 1) {
      const data = dataCodewords.slice(offset, offset + block.data);
      offset += block.data;
      blocks.push({ data, ec: computeEc(data, spec.ecPerBlock) });
    }
  }
  const codewords = interleave(blocks);

  const size = 17 + 4 * version;
  const matrix = matrixOf(size);
  const isFunction = matrixOf(size);

  drawFunctionPatterns(matrix, isFunction, version);

  const dataBits = codewordsToBits(codewords);
  placeData(matrix, isFunction, dataBits);

  const mask = chooseMask(matrix, isFunction);
  applyMask(matrix, isFunction, mask);
  drawFormatBits(matrix, isFunction, mask);

  return { size, modules: matrix };
}

function chooseVersion(byteLength: number): number {
  for (let v = 1; v <= VERSION_MAX; v += 1) {
    const countBits = v < 10 ? 8 : 16;
    const requiredBits = 4 + countBits + byteLength * 8;
    if (requiredBits <= VERSIONS[v].dataCodewords * 8) return v;
  }
  return 0;
}

function matrixOf(size: number): boolean[][] {
  return Array.from({ length: size }, () => new Array(size).fill(false));
}

function codewordsToBits(codewords: number[]): boolean[] {
  const bits: boolean[] = [];
  for (const cw of codewords) {
    for (let i = 7; i >= 0; i -= 1) bits.push(((cw >>> i) & 1) === 1);
  }
  return bits;
}

function setFunction(modules: boolean[][], isFunction: boolean[][], x: number, y: number, dark: boolean): void {
  modules[y][x] = dark;
  isFunction[y][x] = true;
}

function drawFunctionPatterns(modules: boolean[][], isFunction: boolean[][], version: number): void {
  const size = modules.length;
  for (let i = 0; i < size; i += 1) {
    setFunction(modules, isFunction, 6, i, i % 2 === 0);
    setFunction(modules, isFunction, i, 6, i % 2 === 0);
  }
  drawFinder(modules, isFunction, 3, 3);
  drawFinder(modules, isFunction, size - 4, 3);
  drawFinder(modules, isFunction, 3, size - 4);

  const positions = VERSIONS[version].align;
  const num = positions.length;
  for (let i = 0; i < num; i += 1) {
    for (let j = 0; j < num; j += 1) {
      if (
        (i === 0 && j === 0) ||
        (i === 0 && j === num - 1) ||
        (i === num - 1 && j === 0)
      ) {
        continue;
      }
      drawAlignment(modules, isFunction, positions[i], positions[j]);
    }
  }

  drawVersion(modules, isFunction, version);

  // Reserve the format-information cells (with a placeholder mask) so data
  // placement skips them; the real mask overwrites them later.
  drawFormatBits(modules, isFunction, 0);
}

function drawFinder(modules: boolean[][], isFunction: boolean[][], cx: number, cy: number): void {
  const size = modules.length;
  for (let dy = -4; dy <= 4; dy += 1) {
    for (let dx = -4; dx <= 4; dx += 1) {
      const dist = Math.max(Math.abs(dx), Math.abs(dy));
      const x = cx + dx;
      const y = cy + dy;
      if (x >= 0 && x < size && y >= 0 && y < size) {
        setFunction(modules, isFunction, x, y, dist !== 2 && dist !== 4);
      }
    }
  }
}

function drawAlignment(modules: boolean[][], isFunction: boolean[][], cx: number, cy: number): void {
  for (let dy = -2; dy <= 2; dy += 1) {
    for (let dx = -2; dx <= 2; dx += 1) {
      const dark = Math.max(Math.abs(dx), Math.abs(dy)) !== 1;
      setFunction(modules, isFunction, cx + dx, cy + dy, dark);
    }
  }
}

function drawFormatBits(modules: boolean[][], isFunction: boolean[][], mask: number): void {
  const size = modules.length;
  const data = (EC_M_FORMAT_BITS << 3) | mask;
  let rem = data;
  for (let i = 0; i < 10; i += 1) rem = (rem << 1) ^ ((rem >>> 9) * 0x537);
  const bits = ((data << 10) | rem) ^ FORMAT_MASK;

  for (let i = 0; i <= 5; i += 1) setFunction(modules, isFunction, 8, i, getBit(bits, i));
  setFunction(modules, isFunction, 8, 7, getBit(bits, 6));
  setFunction(modules, isFunction, 8, 8, getBit(bits, 7));
  setFunction(modules, isFunction, 7, 8, getBit(bits, 8));
  for (let i = 9; i < 15; i += 1) setFunction(modules, isFunction, 14 - i, 8, getBit(bits, i));

  for (let i = 0; i < 8; i += 1) setFunction(modules, isFunction, size - 1 - i, 8, getBit(bits, i));
  for (let i = 8; i < 15; i += 1) setFunction(modules, isFunction, 8, size - 15 + i, getBit(bits, i));
  setFunction(modules, isFunction, 8, size - 8, true);
}

function drawVersion(modules: boolean[][], isFunction: boolean[][], version: number): void {
  if (version < 7) return;
  const size = modules.length;
  let rem = version;
  for (let i = 0; i < 12; i += 1) rem = (rem << 1) ^ ((rem >>> 11) * 0x1f25);
  const bits = (version << 12) | rem;
  for (let i = 0; i < 18; i += 1) {
    const dark = getBit(bits, i);
    const a = size - 11 + (i % 3);
    const b = Math.floor(i / 3);
    setFunction(modules, isFunction, a, b, dark);
    setFunction(modules, isFunction, b, a, dark);
  }
}

function getBit(value: number, i: number): boolean {
  return ((value >>> i) & 1) === 1;
}

function placeData(modules: boolean[][], isFunction: boolean[][], data: boolean[]): void {
  const size = modules.length;
  let bit = 0;
  for (let right = size - 1; right >= 1; right -= 2) {
    if (right === 6) right = 5;
    for (let vert = 0; vert < size; vert += 1) {
      for (let j = 0; j < 2; j += 1) {
        const x = right - j;
        const upward = ((right + 1) & 2) === 0;
        const y = upward ? size - 1 - vert : vert;
        if (!isFunction[y][x] && bit < data.length) {
          modules[y][x] = data[bit];
          bit += 1;
        }
      }
    }
  }
}

function chooseMask(modules: boolean[][], isFunction: boolean[][]): number {
  let bestMask = 0;
  let bestPenalty = Number.POSITIVE_INFINITY;
  for (let mask = 0; mask < 8; mask += 1) {
    applyMask(modules, isFunction, mask);
    drawFormatBits(modules, isFunction, mask);
    const penalty = penaltyScore(modules);
    if (penalty < bestPenalty) {
      bestPenalty = penalty;
      bestMask = mask;
    }
    applyMask(modules, isFunction, mask); // un-apply
  }
  return bestMask;
}

function applyMask(modules: boolean[][], isFunction: boolean[][], mask: number): void {
  const size = modules.length;
  for (let y = 0; y < size; y += 1) {
    for (let x = 0; x < size; x += 1) {
      if (!isFunction[y][x]) {
        modules[y][x] = modules[y][x] !== maskCondition(mask, x, y);
      }
    }
  }
}

function penaltyScore(modules: boolean[][]): number {
  const size = modules.length;
  let result = 0;

  for (let y = 0; y < size; y += 1) {
    let runColor = false;
    let runLen = 0;
    for (let x = 0; x < size; x += 1) {
      if (x === 0 || modules[y][x] !== runColor) {
        runColor = modules[y][x];
        runLen = 1;
      } else {
        runLen += 1;
        if (runLen === 5) result += 3;
        else if (runLen > 5) result += 1;
      }
    }
  }
  for (let x = 0; x < size; x += 1) {
    let runColor = false;
    let runLen = 0;
    for (let y = 0; y < size; y += 1) {
      if (y === 0 || modules[y][x] !== runColor) {
        runColor = modules[y][x];
        runLen = 1;
      } else {
        runLen += 1;
        if (runLen === 5) result += 3;
        else if (runLen > 5) result += 1;
      }
    }
  }

  for (let y = 0; y < size - 1; y += 1) {
    for (let x = 0; x < size - 1; x += 1) {
      const c = modules[y][x];
      if (c === modules[y][x + 1] && c === modules[y + 1][x] && c === modules[y + 1][x + 1]) {
        result += 3;
      }
    }
  }

  for (let y = 0; y < size; y += 1) {
    for (let x = 0; x < size - 6; x += 1) {
      if (
        modules[y][x] &&
        !modules[y][x + 1] &&
        modules[y][x + 2] &&
        modules[y][x + 3] &&
        modules[y][x + 4] &&
        !modules[y][x + 5] &&
        modules[y][x + 6]
      ) {
        result += 40;
      }
    }
  }
  for (let x = 0; x < size; x += 1) {
    for (let y = 0; y < size - 6; y += 1) {
      if (
        modules[y][x] &&
        !modules[y + 1][x] &&
        modules[y + 2][x] &&
        modules[y + 3][x] &&
        modules[y + 4][x] &&
        !modules[y + 5][x] &&
        modules[y + 6][x]
      ) {
        result += 40;
      }
    }
  }

  let dark = 0;
  for (let y = 0; y < size; y += 1) {
    for (let x = 0; x < size; x += 1) if (modules[y][x]) dark += 1;
  }
  const total = size * size;
  const k = Math.ceil(Math.abs(dark * 20 - total * 10) / total) - 1;
  result += k * 10;

  return result;
}

// ── SVG rendering ────────────────────────────────────────────────────────────
export interface QrSvgOptions {
  moduleSize?: number;
  margin?: number;
  dark?: string;
  light?: string;
}

export function qrToSvg(text: string, options: QrSvgOptions = {}): string {
  const { moduleSize = 4, margin = 4, dark = "currentColor", light = "none" } = options;
  const { size, modules } = encodeQr(text);
  const dim = (size + margin * 2) * moduleSize;

  let paths = "";
  for (let y = 0; y < size; y += 1) {
    let x = 0;
    while (x < size) {
      if (!modules[y][x]) {
        x += 1;
        continue;
      }
      const start = x;
      while (x < size && modules[y][x]) x += 1;
      const px = (margin + start) * moduleSize;
      const py = (margin + y) * moduleSize;
      paths += `M${px} ${py}h${(x - start) * moduleSize}v${moduleSize}H${px}z`;
    }
  }

  return [
    `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 ${dim} ${dim}" width="${dim}" height="${dim}" shape-rendering="crispEdges">`,
    light !== "none" ? `<rect width="${dim}" height="${dim}" fill="${light}"/>` : "",
    `<path d="${paths}" fill="${dark}"/>`,
    `</svg>`,
  ].join("");
}

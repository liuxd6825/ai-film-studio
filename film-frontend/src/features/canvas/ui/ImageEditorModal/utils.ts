const RADIX_BASE36 = 36;
const ID_SKIP_CHARS = 2;
const ID_LENGTH = 9;
const HEX_DIGITS = 2;

export function generateLayerName(index: number): string {
  return `图层 ${index}`;
}

export function generateLayerId(): string {
  return `layer_${Date.now()}_${Math.random().toString(RADIX_BASE36).substr(ID_SKIP_CHARS, ID_LENGTH)}`;
}

export function rgbaToHex(rgba: string): string {
  const match = rgba.match(/rgba?\((\d+),\s*(\d+),\s*(\d+)/);
  if (!match) return '#000000';
  const r = parseInt(match[1]).toString(16).padStart(HEX_DIGITS, '0');
  const g = parseInt(match[2]).toString(16).padStart(HEX_DIGITS, '0');
  const b = parseInt(match[3]).toString(16).padStart(HEX_DIGITS, '0');
  return `#${r}${g}${b}`;
}
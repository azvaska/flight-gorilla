export function hexToRgba(hex: string, alpha: number): string {
  let r = 0, g = 0, b = 0;
  // Handle hex color formats
  if (hex.length === 7) { // #RRGGBB
    r = parseInt(hex.slice(1, 3), 16);
    g = parseInt(hex.slice(3, 5), 16);
    b = parseInt(hex.slice(5, 7), 16);
  } else if (hex.length === 4) { // #RGB (shorthand)
    r = parseInt(hex.slice(1, 2) + hex.slice(1, 2), 16);
    g = parseInt(hex.slice(2, 3) + hex.slice(2, 3), 16);
    b = parseInt(hex.slice(3, 4) + hex.slice(3, 4), 16);
  }
  return `rgba(${r}, ${g}, ${b}, ${alpha})`;
}

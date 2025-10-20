export function stringToHue(str: string): number {
  let h = 0;
  for (let i = 0; i < str.length; i++) {
    h = (h * 31 + str.charCodeAt(i)) % 360;
  }
  return h;
}

export function hsl(h: number, s = 70, l = 55) {
  return `hsl(${h} ${s}% ${l}%)`;
}


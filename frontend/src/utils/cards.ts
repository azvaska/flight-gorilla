export function luhnCheck(num: string): boolean {
  let sum = 0;
  let flip = false;
  for (let i = num.length - 1; i >= 0; i--) {
    let d = parseInt(num[i], 10);
    if (flip) {
      d *= 2;
      if (d > 9) d -= 9;
    }
    sum += d;
    flip = !flip;
  }
  return sum % 10 === 0;
}

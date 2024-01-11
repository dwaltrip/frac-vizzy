function logNow(str: string): void;
function logNow(fn: (tStr: string) => string): void;
function logNow(fnOrStr: ((tStr: string) => string) | string): void {
  const d = new Date();
  const mins = d.getMinutes();
  const secs = d.getSeconds();
  const ms = d.getMilliseconds();
  const tStr = `${zeroPad(mins, 2)}:${zeroPad(secs, 2)}.${zeroPad(ms, 3)}`;

  if (typeof fnOrStr === 'string') {
    console.log(`[${tStr}] ${fnOrStr}`);
  } else {
    console.log(fnOrStr(tStr));
  }
}

const ff = (num: number, digits: number): string => num.toFixed(digits);
const f3 = (num: number): string => num.toFixed(3);
const f5 = (num: number): string => num.toFixed(5);
const f6 = (num: number): string => num.toFixed(6);
const f7 = (num: number): string => num.toFixed(7);

function zeroPad(num: number, places: number): string {
  return String(num).padStart(places, '0');
}

const space = (num: number): string => ' '.repeat(num);

export { ff, f3, f5, f6, f7, logNow, space };

// utils/format.ts

/**
 * Định dạng số nguyên: 10000 → "10,000"
 */
export function intcomma(x: number | string | null | undefined): string {
  if (x === null || x === undefined || x === "" || Number.isNaN(Number(x))) {
    return "0";
  }

  const num = Math.round(Number(x));

  return num
    .toString()
    .replace(/\B(?=(\d{3})+(?!\d))/g, ",");
}

/**
 * Định dạng số tổng quát (có phần thập phân 2 số)
 * 10000.5 → "10,000.50"
 */
export function intcommaGeneral(x: number | string | null | undefined): string {
  if (x === null || x === undefined || x === "" || Number.isNaN(Number(x))) {
    return "0";
  }

  const num = Number(x);
  const [integer, decimal] = num.toFixed(2).split(".");

  const intFormatted = integer.replace(/\B(?=(\d{3})+(?!\d))/g, ",");

  return `${intFormatted}.${decimal}`;
}

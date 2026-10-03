const ruInt = new Intl.NumberFormat("ru-RU", { maximumFractionDigits: 0 });
const ru1 = new Intl.NumberFormat("ru-RU", {
  minimumFractionDigits: 0,
  maximumFractionDigits: 1,
});
const ru2 = new Intl.NumberFormat("ru-RU", {
  minimumFractionDigits: 2,
  maximumFractionDigits: 2,
});

export function mm(n: number): string {
  return `${ruInt.format(Math.round(n))} мм`;
}

export function meters(mmValue: number): string {
  return `${ru2.format(mmValue / 1000)} м.п.`;
}

export function pct(n: number): string {
  return `${ru1.format(n)}%`;
}

const BASE_UNITS_PER_TEST = Number(process.env.NEXT_PUBLIC_VND_PER_TEST || 1000000);

function trimZeros(value: string) {
  return value.replace(/0+$/, "").replace(/\.$/, "");
}

export function baseAmountToTest(amount: number | string | null | undefined) {
  const number = Number(amount || 0);
  if (!Number.isFinite(number) || number <= 0) return 0;
  return number > 10000 ? number / BASE_UNITS_PER_TEST : number;
}

export function formatTestAmount(amount: number | string | null | undefined) {
  const number = Number(amount || 0);
  if (!Number.isFinite(number) || number <= 0) return "0 TEST";

  const decimals = number >= 10 ? 2 : number >= 1 ? 4 : 6;
  return `${trimZeros(number.toFixed(decimals))} TEST`;
}

export function formatBaseAsTest(amount: number | string | null | undefined) {
  return formatTestAmount(baseAmountToTest(amount));
}

export function paymentAmountToTest({
  baseAmount,
  tokenAmount,
}: {
  baseAmount?: number | string | null;
  tokenAmount?: number | string | null;
}) {
  const token = Number(tokenAmount || 0);
  if (Number.isFinite(token) && token > 0) return formatTestAmount(token);
  return formatBaseAsTest(baseAmount);
}

export function compactAddress(value?: string | null, start = 6, end = 4) {
  if (!value) return "-";
  if (value.length <= start + end + 3) return value;
  return `${value.slice(0, start)}...${value.slice(-end)}`;
}

export function formatDateTime(value?: string | null) {
  if (!value) return "-";
  const date = new Date(value);
  if (Number.isNaN(date.getTime())) return "-";
  return new Intl.DateTimeFormat("vi-VN", {
    dateStyle: "short",
    timeStyle: "short",
  }).format(date);
}

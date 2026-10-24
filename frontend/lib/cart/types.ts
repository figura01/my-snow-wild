export type QuoteLine = {
  variantId: string;
  materialName: string;
  size: string;
  quantity: number;
  available: number;
  dailyPriceCents: number;
  lineTotalCents: number;
  ok: boolean;
  message: string | null;
};

export type Quote = {
  startDate: string;
  endDate: string;
  days: number;
  totalCents: number;
  valid: boolean;
  lines: QuoteLine[];
};

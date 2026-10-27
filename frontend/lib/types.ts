export type Variant = {
  id: string;
  size: string;
  stock: number;
  /** Exemplaires actuellement en maintenance. */
  inMaintenance: number;
  /** Exemplaires louables : stock − maintenance. */
  inService: number;
};

export type Maintenance = {
  id: string;
  quantity: number;
  reason: string;
  expectedReturnDate: string | null;
  startedAt: string;
  endedAt: string | null;
  isActive: boolean;
  variant: { id: string; size: string };
  material: { id: string; name: string };
};

export type SizeAvailability = { variantId: string; size: string; available: number };

export type Category = {
  id: string;
  name: string;
  slug: string;
  description: string | null;
  materialCount: number;
};

export type Material = {
  id: string;
  name: string;
  slug: string;
  description: string | null;
  imageUrl: string | null;
  dailyPriceCents: number;
  totalStock: number;
  variants: Variant[];
  isActive: boolean;
  category: { id: string; name: string; slug: string };
};

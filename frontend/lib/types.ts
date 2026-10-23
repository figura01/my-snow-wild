export type Variant = { id: string; size: string; stock: number };

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

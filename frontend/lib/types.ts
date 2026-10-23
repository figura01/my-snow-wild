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
  stock: number;
  isActive: boolean;
  category: { id: string; name: string; slug: string };
};

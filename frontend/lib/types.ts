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

export type MaterialLevel = "ALL" | "BEGINNER" | "INTERMEDIATE" | "EXPERT";

export const LEVEL_LABELS: Record<MaterialLevel, string> = {
  ALL: "Tous niveaux",
  BEGINNER: "Débutant",
  INTERMEDIATE: "Intermédiaire",
  EXPERT: "Confirmé",
};

export type MaterialImage = { id: string; url: string; alt: string; position: number };

export type Material = {
  id: string;
  name: string;
  slug: string;
  description: string | null;
  imageUrl: string | null;
  /** Photo principale (première de la galerie), ou ancienne URL d'image. */
  coverUrl: string | null;
  images: MaterialImage[];
  level: MaterialLevel | null;
  features: string[];
  dailyPriceCents: number;
  totalStock: number;
  variants: Variant[];
  isActive: boolean;
  category: { id: string; name: string; slug: string };
};

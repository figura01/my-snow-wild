import { Footprints, Glasses, HardHat, MountainSnow, Package, Snowflake } from "lucide-react";

const icons: Record<string, typeof Package> = {
  skis: MountainSnow,
  snowboards: Snowflake,
  chaussures: Footprints,
  casques: HardHat,
  accessoires: Glasses,
};

export function CategoryIcon({ slug, className }: { slug: string; className?: string }) {
  const Icon = icons[slug] ?? Package;
  return <Icon className={className} aria-hidden="true" />;
}

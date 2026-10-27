import { ArrowRight } from "lucide-react";
import Link from "next/link";
import { MaterialCard } from "@/components/catalog/MaterialCard";
import { buttonVariants } from "@/components/ui/button";
import type { Material } from "@/lib/types";

export function FeaturedMaterials({ materials }: { materials: Material[] }) {
  if (materials.length === 0) return null;
  return (
    <section className="flex flex-col gap-8" aria-labelledby="featured-title">
      <div className="flex flex-wrap items-end justify-between gap-4">
        <div className="flex flex-col gap-2">
          <span className="text-sm font-semibold uppercase tracking-wide text-glacier">Sélection</span>
          <h2 id="featured-title" className="text-3xl font-extrabold tracking-tight">Le matériel du moment</h2>
        </div>
        <Link href="/catalogue" className={buttonVariants({ variant: "outline" })}>
          Tout le catalogue <ArrowRight className="h-4 w-4" aria-hidden="true" />
        </Link>
      </div>
      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
        {materials.map((material) => (
          <MaterialCard key={material.id} material={material} sizes={null} days={null} query="" />
        ))}
      </div>
    </section>
  );
}

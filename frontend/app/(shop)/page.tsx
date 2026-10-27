import { CategoryGrid } from "@/components/home/CategoryGrid";
import { Faq } from "@/components/home/Faq";
import { FeaturedMaterials } from "@/components/home/FeaturedMaterials";
import { FinalCta } from "@/components/home/FinalCta";
import { Hero } from "@/components/home/Hero";
import { HowItWorks } from "@/components/home/HowItWorks";
import { WhyUs } from "@/components/home/WhyUs";
import { MATERIAL_FIELDS } from "@/lib/graphql/catalog";
import { serverGraphql } from "@/lib/server/graphql";
import type { Material } from "@/lib/types";

export const dynamic = "force-dynamic";

/** Une référence par catégorie, pour une sélection variée. */
function pickFeatured(materials: Material[], count = 4): Material[] {
  const seen = new Set<string>();
  const picked: Material[] = [];
  for (const material of materials) {
    if (seen.has(material.category.slug)) continue;
    seen.add(material.category.slug);
    picked.push(material);
    if (picked.length === count) break;
  }
  return picked;
}

// Page d'accueil organisée comme une landing page ; la recherche reste dans le premier écran.
export default async function HomePage() {
  const { categories, catalog } = await serverGraphql<{
    categories: { slug: string; name: string; materialCount: number }[];
    catalog: { items: { material: Material }[] };
  }>(`{
    categories { slug name materialCount }
    catalog { items { material { ${MATERIAL_FIELDS} } } }
  }`);

  return (
    <div className="flex flex-col gap-16 md:gap-24">
      <Hero categories={categories} />
      <HowItWorks />
      <CategoryGrid categories={categories} />
      <FeaturedMaterials materials={pickFeatured(catalog.items.map((item) => item.material))} />
      <WhyUs />
      <Faq />
      <FinalCta />
    </div>
  );
}

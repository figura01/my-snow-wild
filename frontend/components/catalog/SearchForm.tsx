import { Search } from "lucide-react";
import { buttonVariants } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select } from "@/components/ui/select";
import { todayIso, type CatalogParams } from "@/lib/catalog";
import { cn } from "@/lib/utils";

// Formulaire GET classique : fonctionne sans JavaScript et l'URL de recherche
// est partageable (ex. /catalogue?q=ski&du=2026-12-20&au=2026-12-26).
export function SearchForm({
  categories,
  params = {},
}: {
  categories: { slug: string; name: string }[];
  params?: CatalogParams;
}) {
  const today = todayIso();
  return (
    <form
      action="/catalogue"
      method="get"
      className="grid grid-cols-2 gap-3 rounded-3xl border border-line bg-surface p-4 shadow-sm md:grid-cols-[2fr_1.3fr_1fr_1fr_auto] md:items-end"
    >
      <div className="col-span-2 flex flex-col gap-1.5 md:col-span-1">
        <Label htmlFor="q">Que cherchez-vous ?</Label>
        <Input id="q" name="q" placeholder="Ski, casque, chaussures…" defaultValue={params.q} maxLength={100} />
      </div>
      <div className="col-span-2 flex flex-col gap-1.5 md:col-span-1">
        <Label htmlFor="categorie">Catégorie</Label>
        <Select id="categorie" name="categorie" defaultValue={params.categorie ?? ""}>
          <option value="">Toutes</option>
          {categories.map((c) => (
            <option key={c.slug} value={c.slug}>{c.name}</option>
          ))}
        </Select>
      </div>
      <div className="flex min-w-0 flex-col gap-1.5">
        <Label htmlFor="du">Du</Label>
        <Input id="du" name="du" type="date" min={today} defaultValue={params.du} className="min-w-0 px-3" />
      </div>
      <div className="flex min-w-0 flex-col gap-1.5">
        <Label htmlFor="au">Au</Label>
        <Input id="au" name="au" type="date" min={today} defaultValue={params.au} className="min-w-0 px-3" />
      </div>
      <button type="submit" className={cn(buttonVariants({ variant: "accent" }), "col-span-2 md:col-span-1 md:h-11")}>
        <Search className="h-4 w-4" />
        Rechercher
      </button>
    </form>
  );
}

"use client";

import { useState } from "react";
import { CategoryIcon } from "@/components/catalog/CategoryIcon";
import { cn } from "@/lib/utils";
import type { MaterialImage } from "@/lib/types";

// Galerie de la fiche produit : grande photo et vignettes cliquables.
export function Gallery({ images, name, categorySlug }: { images: MaterialImage[]; name: string; categorySlug: string }) {
  const [current, setCurrent] = useState(0);
  const image = images[current];

  return (
    <div className="flex flex-col gap-3">
      <div className="flex aspect-[4/3] items-center justify-center overflow-hidden rounded-3xl border border-line bg-gradient-to-br from-sky-50 to-slate-100 dark:from-[#15284c] dark:to-[#101a2c]">
        {image ? (
          // eslint-disable-next-line @next/next/no-img-element
          <img src={image.url} alt={image.alt || name} className="h-full w-full object-cover" />
        ) : (
          <CategoryIcon slug={categorySlug} className="h-20 w-20 text-glacier/70 lg:h-28 lg:w-28" />
        )}
      </div>
      {images.length > 1 && (
        <ul className="flex gap-2 overflow-x-auto pb-1" aria-label="Photos">
          {images.map((img, index) => (
            <li key={img.id} className="shrink-0">
              <button
                type="button"
                onClick={() => setCurrent(index)}
                aria-label={`Photo ${index + 1} sur ${images.length}`}
                aria-current={index === current ? "true" : undefined}
                className={cn(
                  "block h-16 w-20 overflow-hidden rounded-xl border-2 transition sm:h-20 sm:w-24",
                  index === current ? "border-glacier" : "border-transparent opacity-70 hover:opacity-100",
                )}
              >
                {/* eslint-disable-next-line @next/next/no-img-element */}
                <img src={img.url} alt="" className="h-full w-full object-cover" />
              </button>
            </li>
          ))}
        </ul>
      )}
    </div>
  );
}

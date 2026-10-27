"use client";

import { useMutation } from "@apollo/client/react";
import { ArrowLeft, ArrowRight, ImagePlus, Trash2 } from "lucide-react";
import { useRouter } from "next/navigation";
import { useRef, useState } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { DELETE_MATERIAL_IMAGE, REORDER_MATERIAL_IMAGES, UPDATE_MATERIAL_IMAGE_ALT } from "@/lib/graphql/catalog";
import type { MaterialImage } from "@/lib/types";

const MAX_IMAGES = 8;
const MAX_BYTES = 5 * 1024 * 1024;
const TYPES = ["image/jpeg", "image/png", "image/webp"];

// Galerie d'un matériel dans le back-office : envoi, ordre (la première est la photo
// principale), texte alternatif et suppression.
export function ImageManager({ materialId, materialName, images }: { materialId: string; materialName: string; images: MaterialImage[] }) {
  const router = useRouter();
  const input = useRef<HTMLInputElement>(null);
  const [error, setError] = useState<string | null>(null);
  const [uploading, setUploading] = useState<string | null>(null);
  const [remove] = useMutation(DELETE_MATERIAL_IMAGE);
  const [reorder] = useMutation(REORDER_MATERIAL_IMAGES);
  const [saveAlt] = useMutation(UPDATE_MATERIAL_IMAGE_ALT);

  async function upload(files: FileList) {
    setError(null);
    const list = [...files].slice(0, MAX_IMAGES - images.length);
    for (const [index, file] of list.entries()) {
      if (!TYPES.includes(file.type)) {
        setError(`« ${file.name} » : JPEG, PNG ou WebP uniquement.`);
        continue;
      }
      if (file.size > MAX_BYTES) {
        setError(`« ${file.name} » : 5 Mo au maximum.`);
        continue;
      }
      setUploading(`Envoi ${index + 1} / ${list.length}…`);
      const response = await fetch(`/api/materials/${materialId}/images?alt=${encodeURIComponent(materialName)}`, {
        method: "POST",
        headers: { "Content-Type": file.type },
        body: file,
      });
      if (!response.ok) {
        const body = await response.json().catch(() => null);
        setError(body?.error ?? "Envoi impossible.");
        break;
      }
    }
    setUploading(null);
    if (input.current) input.current.value = "";
    router.refresh();
  }

  async function run(action: () => Promise<unknown>) {
    setError(null);
    try {
      await action();
      router.refresh();
    } catch (e) {
      setError(e instanceof Error ? e.message : "Opération impossible.");
    }
  }

  const move = (index: number, delta: number) => {
    const ids = images.map((i) => i.id);
    [ids[index], ids[index + delta]] = [ids[index + delta], ids[index]];
    return run(() => reorder({ variables: { materialId, ids } }));
  };

  return (
    <section className="flex max-w-2xl flex-col gap-5 rounded-3xl border border-line bg-surface p-5 md:p-6" aria-labelledby="photos-title">
      <div className="flex flex-wrap items-start justify-between gap-3">
        <div className="flex flex-col gap-1">
          <h2 id="photos-title" className="text-xl font-bold">Photos</h2>
          <p className="text-sm text-muted">
            JPEG, PNG ou WebP, 5 Mo au maximum, {MAX_IMAGES} photos par matériel. La première est la photo principale.
          </p>
        </div>
        <input
          ref={input}
          type="file"
          accept={TYPES.join(",")}
          multiple
          className="sr-only"
          id="photo-input"
          onChange={(e) => e.target.files?.length && upload(e.target.files)}
        />
        <Button
          type="button"
          variant="outline"
          size="sm"
          disabled={!!uploading || images.length >= MAX_IMAGES}
          onClick={() => input.current?.click()}
        >
          <ImagePlus className="h-4 w-4" aria-hidden="true" />
          {uploading ?? "Ajouter des photos"}
        </Button>
      </div>

      {error && <p role="alert" className="text-sm text-red-600 dark:text-red-400">{error}</p>}

      {images.length === 0 ? (
        <p className="rounded-2xl border border-dashed border-line px-4 py-8 text-center text-sm text-muted">
          Aucune photo : le catalogue affiche une icône à la place.
        </p>
      ) : (
        <ul className="grid grid-cols-2 gap-4 sm:grid-cols-3">
          {images.map((image, index) => (
            <li key={image.id} className="flex flex-col gap-2">
              <div className="relative aspect-[4/3] overflow-hidden rounded-xl border border-line bg-snow">
                {/* eslint-disable-next-line @next/next/no-img-element */}
                <img src={image.url} alt={image.alt} className="h-full w-full object-cover" />
                {index === 0 && (
                  <span className="absolute left-2 top-2 rounded-full bg-brand px-2 py-0.5 text-xs font-semibold text-white">
                    Principale
                  </span>
                )}
              </div>
              <Input
                aria-label={`Texte alternatif de la photo ${index + 1}`}
                defaultValue={image.alt}
                maxLength={200}
                placeholder="Description de la photo"
                className="h-9 text-xs"
                onBlur={(e) => e.target.value !== image.alt && run(() => saveAlt({ variables: { id: image.id, alt: e.target.value } }))}
              />
              <div className="flex items-center justify-between">
                <div className="flex">
                  <Button type="button" variant="ghost" size="sm" aria-label={`Avancer la photo ${index + 1}`} disabled={index === 0} onClick={() => move(index, -1)}>
                    <ArrowLeft className="h-4 w-4" aria-hidden="true" />
                  </Button>
                  <Button type="button" variant="ghost" size="sm" aria-label={`Reculer la photo ${index + 1}`} disabled={index === images.length - 1} onClick={() => move(index, 1)}>
                    <ArrowRight className="h-4 w-4" aria-hidden="true" />
                  </Button>
                </div>
                <Button
                  type="button"
                  variant="ghost"
                  size="sm"
                  className="text-red-600 dark:text-red-400"
                  aria-label={`Supprimer la photo ${index + 1}`}
                  onClick={() => window.confirm("Supprimer cette photo ?") && run(() => remove({ variables: { id: image.id } }))}
                >
                  <Trash2 className="h-4 w-4" aria-hidden="true" />
                </Button>
              </div>
            </li>
          ))}
        </ul>
      )}
    </section>
  );
}

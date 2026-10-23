"use client";

import { Plus, X } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";

export type SizeRow = { key: string; id?: string; size: string; stock: number };

let counter = 0;
export const newRow = (size = "", stock = 1): SizeRow => ({ key: `new-${counter++}`, size, stock });

// Tableau éditable « taille / stock » du formulaire matériel.
export function SizesEditor({ rows, onChange }: { rows: SizeRow[]; onChange: (rows: SizeRow[]) => void }) {
  const update = (key: string, patch: Partial<SizeRow>) =>
    onChange(rows.map((row) => (row.key === key ? { ...row, ...patch } : row)));

  return (
    <fieldset className="flex flex-col gap-3">
      <legend className="mb-1 text-sm font-medium">Tailles et stock par taille</legend>
      <div className="flex flex-col gap-2">
        {rows.map((row, index) => (
          <div key={row.key} className="flex items-center gap-2">
            <Input
              aria-label={`Taille ${index + 1}`}
              placeholder="160 cm, 42, M, Taille unique…"
              value={row.size}
              maxLength={40}
              required
              onChange={(e) => update(row.key, { size: e.target.value })}
            />
            <Input
              aria-label={`Stock de la taille ${index + 1}`}
              type="number"
              min={0}
              step={1}
              className="w-28"
              value={row.stock}
              required
              onChange={(e) => update(row.key, { stock: Number(e.target.value) })}
            />
            <Button
              type="button"
              variant="ghost"
              size="sm"
              aria-label={`Retirer la taille ${index + 1}`}
              disabled={rows.length === 1}
              onClick={() => onChange(rows.filter((r) => r.key !== row.key))}
            >
              <X className="h-4 w-4" />
            </Button>
          </div>
        ))}
      </div>
      <div>
        <Button type="button" variant="outline" size="sm" onClick={() => onChange([...rows, newRow()])}>
          <Plus className="h-4 w-4" />
          Ajouter une taille
        </Button>
      </div>
      <p className="text-xs text-muted">
        Total : {rows.reduce((sum, r) => sum + (Number.isFinite(r.stock) ? r.stock : 0), 0)} exemplaire(s).
      </p>
    </fieldset>
  );
}

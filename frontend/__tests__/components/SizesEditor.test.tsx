import { render, screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { useState } from "react";
import { SizesEditor, type SizeRow } from "@/components/admin/SizesEditor";

// Le composant est contrôlé : on l'enveloppe dans un petit état pour le tester comme dans le formulaire.
function Harness({ initial, onRows }: { initial: SizeRow[]; onRows?: (rows: SizeRow[]) => void }) {
  const [rows, setRows] = useState(initial);
  return (
    <SizesEditor
      rows={rows}
      onChange={(next) => {
        setRows(next);
        onRows?.(next);
      }}
    />
  );
}

const row = (key: string, size: string, stock: number): SizeRow => ({ key, size, stock });

describe("SizesEditor", () => {
  it("affiche le total des exemplaires", () => {
    render(<Harness initial={[row("a", "160 cm", 3), row("b", "170 cm", 2)]} />);
    expect(screen.getByText("Total : 5 exemplaire(s).")).toBeInTheDocument();
  });

  it("ajoute une taille puis met à jour la saisie", async () => {
    const user = userEvent.setup();
    const onRows = jest.fn();
    render(<Harness initial={[row("a", "160 cm", 3)]} onRows={onRows} />);

    await user.click(screen.getByRole("button", { name: /ajouter une taille/i }));
    await user.type(screen.getByLabelText("Taille 2"), "M");

    expect(screen.getByLabelText("Taille 2")).toHaveValue("M");
    expect(onRows).toHaveBeenLastCalledWith([
      row("a", "160 cm", 3),
      expect.objectContaining({ size: "M", stock: 1 }),
    ]);
    expect(screen.getByText("Total : 4 exemplaire(s).")).toBeInTheDocument();
  });

  it("empêche de retirer la dernière taille", async () => {
    const user = userEvent.setup();
    render(<Harness initial={[row("a", "160 cm", 3), row("b", "170 cm", 2)]} />);

    await user.click(screen.getByRole("button", { name: "Retirer la taille 1" }));
    expect(screen.getByLabelText("Taille 1")).toHaveValue("170 cm");
    expect(screen.getByRole("button", { name: "Retirer la taille 1" })).toBeDisabled();
  });
});

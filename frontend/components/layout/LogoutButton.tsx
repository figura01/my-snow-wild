"use client";

import { gql } from "@apollo/client";
import { useMutation } from "@apollo/client/react";
import { LogOut } from "lucide-react";
import { useRouter } from "next/navigation";
import { Button } from "@/components/ui/button";
import { useCart } from "@/lib/cart/store";

const LOGOUT = gql`
  mutation Logout {
    logout
  }
`;

// Déconnexion partagée par le bouton, le menu utilisateur et le menu mobile.
export function useLogout() {
  const router = useRouter();
  const [logout, { loading }] = useMutation(LOGOUT);

  const run = async () => {
    await logout();
    // Le panier reste enregistré sur le compte ; on le retire de ce navigateur (ordinateur partagé).
    useCart.getState().clear();
    router.push("/");
    router.refresh();
  };

  return { logout: run, loading };
}

export function LogoutButton() {
  const { logout, loading } = useLogout();

  return (
    <Button variant="ghost" size="sm" disabled={loading} onClick={logout}>
      <LogOut className="h-4 w-4" />
      Déconnexion
    </Button>
  );
}

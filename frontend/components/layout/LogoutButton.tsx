"use client";

import { gql } from "@apollo/client";
import { useMutation } from "@apollo/client/react";
import { LogOut } from "lucide-react";
import { useRouter } from "next/navigation";
import { Button } from "@/components/ui/button";

const LOGOUT = gql`
  mutation Logout {
    logout
  }
`;

export function LogoutButton() {
  const router = useRouter();
  const [logout, { loading }] = useMutation(LOGOUT);

  return (
    <Button
      variant="ghost"
      size="sm"
      disabled={loading}
      onClick={async () => {
        await logout();
        router.push("/");
        router.refresh();
      }}
    >
      <LogOut className="h-4 w-4" />
      Déconnexion
    </Button>
  );
}

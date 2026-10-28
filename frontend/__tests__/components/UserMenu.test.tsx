import { render, screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { UserMenu, type MenuUser } from "@/components/layout/UserMenu";

const logout = jest.fn();

jest.mock("next/navigation", () => ({ usePathname: () => "/" }));
jest.mock("@/components/layout/LogoutButton", () => ({
  useLogout: () => ({ logout, loading: false }),
}));

const camille: MenuUser = { firstName: "Camille", lastName: "Durand", email: "camille@test.dev", role: "USER" };

beforeEach(() => logout.mockReset());

describe("UserMenu", () => {
  it("propose connexion et inscription à un visiteur", async () => {
    render(<UserMenu user={null} />);
    await userEvent.click(screen.getByRole("button", { name: /se connecter/i }));
    expect(screen.getByRole("menuitem", { name: "Connexion" })).toHaveAttribute("href", "/login");
    expect(screen.getByRole("menuitem", { name: "Créer un compte" })).toHaveAttribute("href", "/inscription");
    expect(screen.queryByRole("menuitem", { name: /déconnexion/i })).not.toBeInTheDocument();
  });

  it("affiche les initiales et les liens du compte, sans back-office pour un client", async () => {
    render(<UserMenu user={camille} />);
    const button = screen.getByRole("button", { name: /compte de camille/i });
    expect(button).toHaveTextContent("CD");
    await userEvent.click(button);
    expect(screen.getByText("camille@test.dev")).toBeInTheDocument();
    expect(screen.getByRole("menuitem", { name: "Mes réservations" })).toHaveAttribute("href", "/compte");
    expect(screen.getByRole("menuitem", { name: "Mon profil" })).toHaveAttribute("href", "/compte/profil");
    expect(screen.queryByRole("menuitem", { name: "Back-office" })).not.toBeInTheDocument();
  });

  it("montre le back-office à un admin", async () => {
    render(<UserMenu user={{ ...camille, role: "ADMIN" }} />);
    await userEvent.click(screen.getByRole("button", { name: /compte de/i }));
    expect(screen.getByRole("menuitem", { name: "Back-office" })).toHaveAttribute("href", "/admin");
  });

  it("se pilote au clavier et rend le focus au bouton avec Échap", async () => {
    const user = userEvent.setup();
    render(<UserMenu user={camille} />);
    const button = screen.getByRole("button", { name: /compte de/i });
    button.focus();

    await user.keyboard("{ArrowDown}");
    expect(button).toHaveAttribute("aria-expanded", "true");
    expect(screen.getByRole("menuitem", { name: "Mes réservations" })).toHaveFocus();

    await user.keyboard("{ArrowDown}");
    expect(screen.getByRole("menuitem", { name: "Mon profil" })).toHaveFocus();

    await user.keyboard("{End}");
    expect(screen.getByRole("menuitem", { name: "Déconnexion" })).toHaveFocus();

    await user.keyboard("{ArrowDown}");
    expect(screen.getByRole("menuitem", { name: "Mes réservations" })).toHaveFocus();

    await user.keyboard("{Escape}");
    expect(screen.queryByRole("menu")).not.toBeInTheDocument();
    expect(button).toHaveFocus();
  });

  it("se referme sur un clic extérieur", async () => {
    render(
      <>
        <p>dehors</p>
        <UserMenu user={camille} />
      </>,
    );
    await userEvent.click(screen.getByRole("button", { name: /compte de/i }));
    expect(screen.getByRole("menu")).toBeInTheDocument();
    await userEvent.click(screen.getByText("dehors"));
    expect(screen.queryByRole("menu")).not.toBeInTheDocument();
  });

  it("déconnecte depuis le menu", async () => {
    render(<UserMenu user={camille} />);
    await userEvent.click(screen.getByRole("button", { name: /compte de/i }));
    await userEvent.click(screen.getByRole("menuitem", { name: "Déconnexion" }));
    expect(logout).toHaveBeenCalledTimes(1);
  });
});

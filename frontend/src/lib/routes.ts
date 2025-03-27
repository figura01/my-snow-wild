export type Route = {
    pathname: string;
    title: string;
    protected: Protected;
  };
  
  export type Protected = "ADMIN" | "PRIVATE" | "PUBLIC";
  
  export const routes: { [key: string]: Route } = {
    home: {
      pathname: "/",
      title: "Accueil",
      protected: "PUBLIC",
    },
    login: {
      pathname: "/auth/login",
      title: "Connexion",
      protected: "PUBLIC",
    },
    logout: {
      pathname: "/auth/logout",
      title: "Déconnexion",
      protected: "PUBLIC",
    },
    register: {
      pathname: "/auth/register",
      title: "Créer un compte",
      protected: "PUBLIC",
    },
    admin: {
      pathname: "/admin",
      title: "Admin",
      protected: "ADMIN",
    },
    about: {
        pathname: "/about",
        title: "About",
        protected: "PRIVATE",
    },
    "my-profike": {
        pathname: "/profile",
        title: "User Profile",
        protected: "PRIVATE",
    }
  }    
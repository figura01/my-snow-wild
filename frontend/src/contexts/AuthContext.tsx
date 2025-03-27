import React from "react";

type UserType = {
    userId: string;
    email: string;
    role: string;
}

interface AuthContextType {
  user: UserType | undefined | null;
  updateUser: (user: UserType) => void;
  logout: () => void;
}

export const AuthContext = React.createContext<AuthContextType | undefined | null>(undefined);


interface AuthProviderProps {
  children: React.ReactNode;
}

export const AuthProvider: React.FC<AuthProviderProps> = ({children} : { children: React.ReactNode }) => {
  const [user, setUser] = React.useState<UserType | undefined | null>(null);

  const updateUser = (user: UserType) => {
    console.log('got user: ', user)
    setUser(user)
  }

  const logout = () => {
    setUser(null)
  }

  return <AuthContext.Provider 
      value={{ 
        user,
        updateUser,
        logout
      }}
    >
      {children}
    </AuthContext.Provider>;
}
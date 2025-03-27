"use client";

import { ThemeProvider } from "@/components/theme/theme-provider";
import { CartProvider } from "@/contexts/CartContext";
import { AuthProvider } from "@/contexts/AuthContext";
import { AuthContext } from "@/contexts/AuthContext"; 

import { ApolloClient, ApolloProvider, InMemoryCache } from "@apollo/client";
import SiteHeader from "@/components/site-header";
import TailwindIndicator from "@/components/tailwind-indicator";

import "./globals.css";
import Footer from "@/components/Footer";
import { Toaster } from "@/components/ui/sonner";
import Cookies from 'js-cookie';
import { useContext, useEffect } from "react";
import { usePathname } from 'next/navigation'
import LayoutAdmin from "@/components/layouts/admin/LayoutAdmin";

// const geistSans = Geist({
//   variable: "--font-geist-sans",
//   subsets: ["latin"],
// });

// const geistMono = Geist_Mono({
//   variable: "--font-geist-mono",
//   subsets: ["latin"],
// });



export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {

  const client = new ApolloClient({
    uri: `${process.env.NEXT_PUBLIC_BACK_URL}`,
    cache: new InMemoryCache({ addTypename: false }),
    credentials: "include",
  });

  const pathname = usePathname();
  const authCtx = useContext(AuthContext);

  console.log('pathname: ', pathname )

  useEffect(() =>{
    const roleCookie = Cookies.get("role");
    const userIdCookie = Cookies.get("userId");
    const emailCookie = Cookies.get("email");
    console.log("cookies in RootLayout: ", "roleCookie: ", roleCookie, "userIdCookie: ", userIdCookie, "emailCookie: ", emailCookie )

    if(roleCookie && userIdCookie && emailCookie ) {
      authCtx?.updateUser({
        userId: userIdCookie,
        role: roleCookie,
        email: emailCookie
      })
    }

  }, [authCtx])

  console.log()

  return (
    <ApolloProvider client={client}>
      <AuthProvider>
        <CartProvider>
            <html lang="en" suppressHydrationWarning>
              <head />
              <body className={`flex flex-col h-full justify-center items-center`}>
                <ThemeProvider
                  attribute="class"
                  defaultTheme="dark"
                  enableSystem
                  disableTransitionOnChange
                >
                  {!pathname.startsWith('/admin') ? (
                    <>
                      <SiteHeader />
                      <main className="flex bg-yellow-100 w-full h-full">  
                        {children}
                      </main>
                      <TailwindIndicator />
                      <Footer />
                      <Toaster />
                    </>
                  ) : (
                    <>
                      <LayoutAdmin>
                        { children }
                      </LayoutAdmin>
                     
                    </>
                  )}
                </ThemeProvider>
                
              </body>
            </html>
        </CartProvider>
      </AuthProvider>      
    </ApolloProvider>
  );
}


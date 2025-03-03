

"use client";
import { ThemeProvider } from "@/components/theme/theme-provider";
import { CartProvider } from "@/contexts/CartContext";

import { ApolloClient, ApolloProvider, InMemoryCache } from "@apollo/client";
import SiteHeader from "@/components/site-header";
import TailwindIndicator from "@/components/tailwind-indicator";

import "./globals.css";
import Footer from "@/components/Footer";
import { Toaster } from "@/components/ui/sonner";

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

  return (
    <ApolloProvider client={client}>
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
                <SiteHeader />
                <main className="flex bg-yellow-100 w-full h-full">
                  {children}
                </main>
                <TailwindIndicator />
                <Footer />
                <Toaster />
              </ThemeProvider>
              
            </body>
          </html>
      </CartProvider>      
    </ApolloProvider>
  );
}

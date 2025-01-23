

"use client";
import { ThemeProvider } from "@/components/theme/theme-provider";
import CartProvider from "@/contexts/CartContext";

import { ApolloClient, ApolloProvider, InMemoryCache } from "@apollo/client";
import SiteHeader from "@/components/site-header";
import TailwindIndicator from "@/components/tailwind-indicator";

import "./globals.css";

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
    uri: `${process.env.NEXT_PUBLIC_APOLLO_CLIENT_URI}`,
    cache: new InMemoryCache({ addTypename: false }),
    credentials: "include",
  });

  return (
    <ApolloProvider client={client}>
      <CartProvider>
          <html lang="en" suppressHydrationWarning>
            <head />
            <body className={`flex flex-col h-screen justify-center items-center`}>
              <ThemeProvider
                attribute="class"
                defaultTheme="dark"
                enableSystem
                disableTransitionOnChange
              >
                <SiteHeader />
                {children}
                <TailwindIndicator />
                <div>site-footer</div>
              </ThemeProvider>
            </body>
          </html>
      </CartProvider>      
    </ApolloProvider>
  );
}

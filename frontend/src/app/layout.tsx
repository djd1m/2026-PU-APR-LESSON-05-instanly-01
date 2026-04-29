"use client";

import { Inter } from "next/font/google";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { useState } from "react";
import { GlobalSidebar } from "@/components/GlobalSidebar";
import "./globals.css";

const inter = Inter({ subsets: ["latin", "cyrillic"] });

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const [queryClient] = useState(
    () =>
      new QueryClient({
        defaultOptions: {
          queries: { staleTime: 30_000, retry: 1 },
        },
      })
  );

  return (
    <html lang="ru" className="dark">
      <body className={`${inter.className} bg-bg-primary text-text-primary antialiased`}>
        <QueryClientProvider client={queryClient}>
          <div className="flex min-h-screen">
            <GlobalSidebar />
            <main className="ml-16 flex-1">{children}</main>
          </div>
        </QueryClientProvider>
      </body>
    </html>
  );
}

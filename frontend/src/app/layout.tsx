"use client";

import { Inter } from "next/font/google";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { useState, useEffect } from "react";
import { usePathname, useRouter } from "next/navigation";
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

  const pathname = usePathname();
  const router = useRouter();
  const [isAuth, setIsAuth] = useState<boolean | null>(null);

  useEffect(() => {
    const user = localStorage.getItem("user");
    if (!user && pathname !== "/login") {
      router.push("/login");
      setIsAuth(false);
    } else {
      setIsAuth(true);
    }
  }, [pathname, router]);

  const isLoginPage = pathname === "/login";

  return (
    <html lang="ru" className="dark">
      <body className={`${inter.className} bg-bg-primary text-text-primary antialiased`}>
        <QueryClientProvider client={queryClient}>
          {isLoginPage ? (
            <>{children}</>
          ) : (
            <div className="flex min-h-screen">
              <GlobalSidebar />
              <main className="ml-16 flex-1">{children}</main>
            </div>
          )}
        </QueryClientProvider>
      </body>
    </html>
  );
}

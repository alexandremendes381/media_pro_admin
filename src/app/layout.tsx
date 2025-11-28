import type { Metadata } from "next";
import "./globals.css";
import { Providers } from "@/components/providers";
import { LayoutContent } from "../components/layout-content";

export const metadata: Metadata = {
  title: "Media Pro Admin",
  description: "Painel administrativo Media Pro",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="pt-BR" suppressHydrationWarning>
      <body>
        <Providers>
          <LayoutContent>
            {children}
          </LayoutContent>
        </Providers>
      </body>
    </html>
  );
}
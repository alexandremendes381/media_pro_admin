"use client";

import { usePathname } from "next/navigation";
import { Sidebar } from "@/components/sidebar";
import { useAuthContext } from "@/contexts/AuthContext";

interface LayoutContentProps {
  children: React.ReactNode;
}

export function LayoutContent({ children }: LayoutContentProps) {
  const pathname = usePathname();
  const { isAuthenticated } = useAuthContext();

  // Se não estiver autenticado e não estiver na página de login, redirecionar
  if (!isAuthenticated && pathname !== '/login') {
    return (
      <main className="flex-1 overflow-auto">
        {children}
      </main>
    );
  }

  // Layout padrão com sidebar para usuários autenticados ou página de login
  return (
    <div className="flex h-screen">
      <Sidebar />
      <main className={`flex-1 overflow-auto ${isAuthenticated ? 'md:ml-64' : ''}`}>
        {children}
      </main>
    </div>
  );
}
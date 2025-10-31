"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { cn } from "@/lib/utils";
import { Button } from "@/components/ui/button";
import { 
  Home, 
  UserCheck, 
  Gavel,
  Menu,
  X,
  LogIn,
  LogOut,
  User,
  Shield,
  FileText
} from "lucide-react";
import { useState } from "react";
import { useAuthContext } from "@/contexts/AuthContext";

const sidebarItems = [
  {
    title: "Dashboard",
    href: "/",
    icon: Home,
  },
  {
    title: "Validar Usuários",
    href: "/validar-usuarios",
    icon: UserCheck,
  },
  {
    title: "Posts dos Creators",
    href: "/posts",
    icon: FileText,
  },
  {
    title: "Validar Leilão",
    href: "/validar-leilao",
    icon: Gavel,
  },
];

export function Sidebar() {
  const pathname = usePathname();
  const [isCollapsed, setIsCollapsed] = useState(false);
  const { admin, isAuthenticated, logout } = useAuthContext();

  const handleLogout = async () => {
    try {
      await logout();
    } catch (error) {
      console.error("Erro ao fazer logout:", error);
    }
  };

  // Se não estiver autenticado e não estiver na página de login, não mostrar a sidebar
  if (!isAuthenticated && pathname !== '/login') {
    return null;
  }

  return (
    <>
      {/* Mobile menu button */}
      <Button
        variant="ghost"
        size="icon"
        className="fixed top-4 left-4 z-50 md:hidden"
        onClick={() => setIsCollapsed(!isCollapsed)}
      >
        {isCollapsed ? <Menu className="h-4 w-4" /> : <X className="h-4 w-4" />}
      </Button>

      {/* Sidebar */}
      <div
        className={cn(
          "fixed left-0 top-0 z-40 h-screen w-64 transform border-r bg-background transition-transform duration-200 ease-in-out",
          isCollapsed ? "-translate-x-full md:translate-x-0" : "translate-x-0"
        )}
      >
        <div className="flex h-full flex-col">
          {/* Header */}
          <div className="flex h-16 items-center border-b px-6">
            <h2 className="text-lg font-semibold">Media Pro Admin</h2>
          </div>

          {/* Navigation */}
          {isAuthenticated && (
            <nav className="flex-1 space-y-2 p-4">
              {sidebarItems.map((item) => {
                const Icon = item.icon;
                const isActive = pathname === item.href;

                return (
                  <Link key={item.href} href={item.href}>
                    <Button
                      variant={isActive ? "secondary" : "ghost"}
                      className={cn(
                        "w-full justify-start",
                        isActive && "bg-secondary"
                      )}
                    >
                      <Icon className="mr-2 h-4 w-4" />
                      {item.title}
                    </Button>
                  </Link>
                );
              })}
            </nav>
          )}

          {/* Footer */}
          <div className="border-t p-4 space-y-3">
            {isAuthenticated ? (
              <>
                <div className="flex items-center space-x-2 p-2 rounded-lg bg-secondary/50">
                  <User className="h-4 w-4" />
                  <div className="flex-1 min-w-0">
                    <p className="text-sm font-medium truncate">
                      {admin?.nome || "Administrador"}
                    </p>
                    <p className="text-xs text-muted-foreground truncate">
                      {admin?.email}
                    </p>
                  </div>
                </div>
                <Button
                  variant="ghost"
                  size="sm"
                  className="w-full justify-start text-red-600 hover:text-red-700 hover:bg-red-50"
                  onClick={handleLogout}
                >
                  <LogOut className="mr-2 h-4 w-4" />
                  Sair
                </Button>
              </>
            ) : (
              <Link href="/login">
                <Button
                  variant="ghost"
                  size="sm"
                  className="w-full justify-start"
                >
                  <LogIn className="mr-2 h-4 w-4" />
                  Entrar
                </Button>
              </Link>
            )}
            <p className="text-xs text-muted-foreground text-center">
              Media Pro Admin v1.0
            </p>
          </div>
        </div>
      </div>

      {/* Overlay for mobile */}
      {!isCollapsed && (
        <div
          className="fixed inset-0 z-30 bg-background/80 backdrop-blur-sm md:hidden"
          onClick={() => setIsCollapsed(true)}
        />
      )}
    </>
  );
}
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
  FileText,
  Coins
} from "lucide-react";
import { ModeToggle } from "@/components/mode-toggle";
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
  {
    title: "Transferir MediaCoins",
    href: "/transferir-mediacoins",
    icon: Coins,
  },
  {
    title: "Gerenciar Creators",
    href: "/validar-creators",
    icon: Shield,
  },
];

export function Sidebar() {
  const pathname = usePathname();
  const [isCollapsed, setIsCollapsed] = useState(false);
  const { admin, isAuthenticated, logout } = useAuthContext();

  const handleLogout = async () => {
    try {
      await logout();
      window.location.href = "/login";
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
          "fixed left-0 top-0 z-40 h-screen w-64 transform border-r bg-card/95 backdrop-blur-sm transition-transform duration-200 ease-in-out shadow-lg",
          isCollapsed ? "-translate-x-full md:translate-x-0" : "translate-x-0"
        )}
      >
        <div className="flex h-full flex-col">
          {/* Header */}
          <div className="flex h-16 items-center justify-between border-b border-border/50 px-6 bg-gradient-to-r from-primary/5 to-transparent">
            <div className="flex items-center gap-2">
              <div className="w-8 h-8 bg-gradient-to-br from-primary to-primary/60 rounded-lg flex items-center justify-center">
                <span className="text-primary-foreground font-bold text-sm">MP</span>
              </div>
              <h2 className="text-lg font-bold bg-gradient-to-r from-foreground to-muted-foreground bg-clip-text text-transparent">
                MediaPro
              </h2>
            </div>
            <ModeToggle />
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
                        "w-full justify-start transition-all duration-200 hover:translate-x-1",
                        isActive && "bg-primary/10 border-l-4 border-primary shadow-md"
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
          <div className="border-t border-border/50 p-4 space-y-3 bg-gradient-to-t from-muted/20 to-transparent">
            {isAuthenticated ? (
              <>
                <div className="flex items-center space-x-3 p-3 rounded-lg bg-gradient-to-r from-primary/5 to-secondary/30 border border-border/30">
                  <div className="flex-shrink-0 w-8 h-8 bg-primary/10 rounded-full flex items-center justify-center">
                    <User className="h-4 w-4 text-primary" />
                  </div>
                  <div className="flex-1 min-w-0">
                    <p className="text-sm font-semibold truncate">
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
                  className="w-full justify-start text-red-600 hover:text-red-700 hover:bg-red-50 dark:hover:bg-red-950/20 transition-all duration-200"
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
            <div className="text-center">
              <p className="text-xs text-muted-foreground/60">
                MediaPro Admin v1.0
              </p>
              <div className="mt-1 w-8 h-0.5 bg-gradient-to-r from-transparent via-primary/30 to-transparent mx-auto"></div>
            </div>
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
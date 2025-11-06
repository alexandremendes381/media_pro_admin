"use client";

import React, { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { useAuthContext } from "@/contexts/AuthContext";
import { ModeToggle } from "@/components/mode-toggle";
import { Loader2, LogIn } from "lucide-react";

export default function LoginPage() {
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [isLoading, setIsLoading] = useState(false);
  const { login, isAuthenticated, error, admin } = useAuthContext();
  const router = useRouter();

  // Usar useEffect para redirecionamento após autenticação
  useEffect(() => {
    if (isAuthenticated && admin) {
      console.log('Usuário autenticado, redirecionando...', admin);
      setIsLoading(false);
      setTimeout(() => {
        router.push("/");
      }, 100); // Pequeno delay para garantir que o estado foi atualizado
    }
  }, [isAuthenticated, admin, router]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!email || !password) {
      return;
    }

    setIsLoading(true);
    
    try {
      console.log('Tentando fazer login...');
      await login(email, password);
      console.log('Login realizado com sucesso');
      // O redirecionamento será feito no useEffect quando isAuthenticated mudar
    } catch (error) {
      console.error("Erro no login:", error);
      setIsLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-background via-background to-secondary/20 flex flex-col lg:flex-row">
      {/* Botão de tema no canto superior direito */}
      <div className="absolute top-4 right-4 z-10">
        <ModeToggle />
      </div>
      
      {/* Lado esquerdo - Branding */}
      <div className="hidden lg:flex lg:flex-1 lg:flex-col lg:justify-center lg:px-20 xl:px-24">
        <div className="mx-auto max-w-xl">
          <div className="space-y-6">
            <div className="space-y-2">
              <h1 className="text-4xl font-bold text-foreground">
                MediaPro Admin
              </h1>
              <p className="text-xl text-muted-foreground">
                Sistema de administração completo para gerenciar criadores, leilões e conteúdo.
              </p>
            </div>
            <div className="space-y-4 text-muted-foreground">
              <div className="flex items-center space-x-3">
                <div className="flex-shrink-0 w-2 h-2 bg-primary rounded-full"></div>
                <span>Validação de usuários e criadores</span>
              </div>
              <div className="flex items-center space-x-3">
                <div className="flex-shrink-0 w-2 h-2 bg-primary rounded-full"></div>
                <span>Gerenciamento de leilões</span>
              </div>
              <div className="flex items-center space-x-3">
                <div className="flex-shrink-0 w-2 h-2 bg-primary rounded-full"></div>
                <span>Moderação de conteúdo</span>
              </div>
            </div>
          </div>
        </div>
      </div>
      
      {/* Lado direito - Formulário de Login */}
      <div className="flex flex-1 flex-col justify-center py-12 px-4 sm:px-6 lg:px-20 xl:px-24">
        <div className="mx-auto w-full max-w-sm lg:w-96">
          {/* Logo/Título para mobile */}
          <div className="lg:hidden text-center mb-8">
            <h2 className="text-3xl font-bold text-foreground">
              MediaPro Admin
            </h2>
            <p className="mt-2 text-sm text-muted-foreground">
              Sistema de administração
            </p>
          </div>

          <Card className="shadow-xl border-0 bg-card/50 backdrop-blur">
            <CardHeader className="space-y-1">
              <CardTitle className="text-2xl font-bold text-center">Bem-vindo</CardTitle>
              <CardDescription className="text-center">
                Digite suas credenciais para acessar o sistema
              </CardDescription>
            </CardHeader>
          <CardContent>
            <form onSubmit={handleSubmit} className="space-y-4">
              {error && (
                <Alert variant="destructive">
                  <AlertDescription>{error}</AlertDescription>
                </Alert>
              )}

              <div className="space-y-2">
                <Label htmlFor="email">Email</Label>
                <Input
                  id="email"
                  type="email"
                  placeholder="admin@test.com"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  required
                  disabled={isLoading}
                />
              </div>

              <div className="space-y-2">
                <Label htmlFor="password">Senha</Label>
                <Input
                  id="password"
                  type="password"
                  placeholder="••••••••"
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  required
                  disabled={isLoading}
                />
              </div>

              <Button
                type="submit"
                className="w-full"
                disabled={isLoading || !email || !password}
              >
                {isLoading ? (
                  <>
                    <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                    Entrando...
                  </>
                ) : (
                  <>
                    <LogIn className="mr-2 h-4 w-4" />
                    Entrar
                  </>
                )}
              </Button>
            </form>

            <div className="mt-6 text-center">
              <p className="text-xs text-muted-foreground">
                Para testar, use: admin@mediapro.com / Teste123
              </p>
            </div>
          </CardContent>
        </Card>
        </div>
      </div>
    </div>
  );
}
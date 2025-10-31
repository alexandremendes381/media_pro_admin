# Media Pro Admin

Um painel administrativo moderno construído com Next.js, Tailwind CSS, shadcn/ui e TanStack Query, integrado com a API MediaPro para validação de logins e leilões.

## 🚀 Stack Tecnológica

- **Next.js 15** - Framework React com App Router
- **TypeScript** - Tipagem estática
- **Tailwind CSS** - Framework CSS utilitário
- **shadcn/ui** - Componentes de interface reutilizáveis
- **TanStack Query** - Gerenciamento de estado e cache de dados
- **ESLint** - Linting de código
- **Radix UI** - Componentes acessíveis

## 📁 Estrutura do Projeto

```
src/
├── app/                    # App Router do Next.js
│   ├── login/             # Página de login
│   ├── validar-login/     # Validação de tentativas de login
│   ├── validar-leilao/    # Validação de leilões
│   ├── globals.css        # Estilos globais
│   ├── layout.tsx         # Layout principal
│   └── page.tsx          # Dashboard principal
├── components/            # Componentes reutilizáveis
│   ├── providers.tsx      # Providers (TanStack Query + Auth)
│   ├── sidebar.tsx        # Sidebar de navegação
│   └── ui/               # Componentes shadcn/ui
├── contexts/             # Contextos React
│   └── AuthContext.tsx   # Contexto de autenticação
├── hooks/                # Custom hooks
│   └── useAuth.ts        # Hook de autenticação
├── lib/                  # Utilitários
│   ├── api.ts           # Funções da API MediaPro
│   └── utils.ts         # Função cn e outros utilitários
└── types/               # Definições de tipos
    └── api.ts           # Tipos da API
```

## 🛠️ Começando

### Pré-requisitos

- Node.js 18.17 ou superior
- npm, pnpm, yarn ou bun
- **Servidor MediaPro API** rodando em `http://localhost:8000`

### Instalação

1. Clone o repositório
2. Instale as dependências:

```bash
npm install
# ou
yarn install
# ou
pnpm install
```

3. Configure a API:
   - Certifique-se que o servidor MediaPro API está rodando na porta 8000
   - A URL base está configurada em `src/lib/api.ts`
   - Para alterar, modifique a constante `API_BASE_URL`

4. Execute o servidor de desenvolvimento:

```bash
npm run dev
# ou
yarn dev
# ou
pnpm dev
```

5. Acesse o painel:
   - Admin Panel: [http://localhost:3001](http://localhost:3001)
   - Página de Login: [http://localhost:3001/login](http://localhost:3001/login)

### 🔐 Credenciais de Teste

Para acessar o painel administrativo, use:
- **Email**: `test@mediapro.com`
- **Senha**: `123456`

> **Nota**: Essas são as credenciais fornecidas na documentação da API MediaPro

## 📝 Scripts Disponíveis

- `npm run dev` - Inicia o servidor de desenvolvimento
- `npm run build` - Cria a build de produção
- `npm run start` - Inicia o servidor de produção
- `npm run lint` - Executa o ESLint

## 🎨 Componentes

Este projeto vem pré-configurado com componentes do shadcn/ui:

- **Button** - Componente de botão com variantes
- **Card** - Componente de cartão com header, content e footer
- **Badge** - Badges para status e categorias
- **Input** - Campos de entrada de texto
- **Label** - Labels para formulários
- **Alert** - Componentes de alerta

Para adicionar mais componentes shadcn/ui, consulte a [documentação oficial](https://ui.shadcn.com/).

## 🔄 TanStack Query

O projeto já está configurado com TanStack Query para:

- Cache inteligente de dados
- Sincronização automática
- Estados de loading, error e success
- DevTools para desenvolvimento
- Refetch automático a cada 30 segundos nas páginas de validação

## 🔐 Integração com API MediaPro

### Funcionalidades Implementadas

#### 1. **Autenticação**
- Login com JWT
- Gerenciamento automático de tokens
- Contexto de autenticação compartilhado
- Logout com limpeza de sessão

#### 2. **Validação de Login** (`/validar-login`)
- Lista tentativas de login pendentes/aprovadas/rejeitadas
- Filtros por status
- Informações detalhadas: IP, User Agent, localização
- Sistema de pontuação de risco
- Aprovação/rejeição de tentativas
- Proteção de informações sensíveis

#### 3. **Dashboard**
- Estatísticas em tempo real
- Alertas para itens pendentes
- Atividades recentes
- Métricas de performance

### Endpoints Utilizados

```typescript
// Autenticação
POST /api/v1/auth/login
POST /api/v1/auth/logout
GET  /api/v1/auth/me

// Validação de Login (Admin)
GET  /api/v1/admin/login-attempts
POST /api/v1/admin/login-attempts/{id}/validate
```

## 🚀 Deploy

Este projeto pode ser facilmente implantado na Vercel:

[![Deploy with Vercel](https://vercel.com/button)](https://vercel.com/new)

## � Como Usar

### 1. **Fazer Login**
1. Acesse `/login`
2. Use as credenciais: `test@mediapro.com` / `123456`
3. Após o login, você será redirecionado para o dashboard

### 2. **Validar Tentativas de Login**
1. Navegue para "Validar Login" no sidebar
2. Visualize todas as tentativas pendentes
3. Use os filtros para ver apenas pendentes/aprovadas/rejeitadas
4. Clique em "Ver Detalhes" para informações completas
5. Aprove ou rejeite tentativas pendentes

### 3. **Monitorar Dashboard**
- Veja estatísticas em tempo real
- Acompanhe alertas de itens pendentes
- Monitore atividades recentes

### 🔧 Personalização

Para modificar a URL da API, edite o arquivo `src/lib/api.ts`:

```typescript
// Altere esta linha para apontar para sua API
const API_BASE_URL = 'http://localhost:8000';
```

### 🔍 Debug

- **TanStack Query DevTools**: Habilitado em desenvolvimento
- **Console logs**: Erros da API são logados no console
- **Network tab**: Monitore as requisições HTTP

## �📚 Recursos

- [Documentação do Next.js](https://nextjs.org/docs)
- [Documentação do Tailwind CSS](https://tailwindcss.com/docs)
- [Documentação do shadcn/ui](https://ui.shadcn.com)
- [Documentação do TanStack Query](https://tanstack.com/query/latest)
- [API MediaPro - Documentação](README-API.md)

## 🤝 Contribuição

Contribuições são bem-vindas! Sinta-se à vontade para abrir issues e pull requests.

## 📄 Licença

Este projeto está sob a licença MIT.
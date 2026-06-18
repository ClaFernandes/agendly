# Agendly

Plataforma de agendamentos online para prestadores de serviços. Permite que negócios locais (barbearias, salões, clínicas, etc.) partilhem um link público com os seus clientes e recebam agendamentos de forma automática, sem necessidade de conta por parte do cliente.

---

## Índice

- [Descrição](#descrição)
- [Funcionalidades](#funcionalidades)
- [Tecnologias](#tecnologias)
- [Estrutura do Projeto](#estrutura-do-projeto)
- [Variáveis de Ambiente](#variáveis-de-ambiente)
- [Base de Dados](#base-de-dados)
- [Autenticação e Roles](#autenticação-e-roles)
- [Fluxo de Agendamento Público](#fluxo-de-agendamento-público)
- [Painel do Prestador](#painel-do-prestador)
- [Painel de Administração](#painel-de-administração)
- [Autores](#autores)

---

## Descrição

O Agendly é uma aplicação web full-stack construída com React e Supabase. Tem três áreas distintas com acesso controlado por roles:

- **Área pública** — página de agendamento acessível por link único (`/p/:slug`), sem login
- **Dashboard do prestador** — painel de gestão do negócio (agenda, clientes, financeiro, serviços)
- **Painel de administração** — gestão global da plataforma (negócios, administradores, estatísticas)

---

## Funcionalidades

### Área Pública (Cliente)
- Agendamento em 5 passos: serviço → data → horário → dados pessoais → confirmação
- Calendário com dias disponíveis baseado nos horários reais do negócio
- Deteção automática de colisões de horários
- Barra de progresso por etapas
- Sem necessidade de criar conta

### Dashboard do Prestador
- **Início** — resumo do negócio: receita mensal, agendamentos do dia/semana, serviços ativos, link público
- **Agenda** — calendário interativo (mês/semana/dia) com react-big-calendar; sidebar com agendamentos do dia selecionado
- **Gestão** — lista de agendamentos com filtros (em aberto, concluído, cancelado); ações de concluir, cancelar, reabrir; criação manual de agendamentos com autocomplete de clientes
- **Clientes** — CRM com histórico, valor gasto, nº de visitas por cliente; sistema de favoritos; pesquisa; exportação CSV
- **Financeiro** — receita total e mensal, receita prevista, serviço mais popular; gráfico de evolução mensal; gráfico por serviço; tabela de transações; exportação CSV
- **Serviços** — criação, edição e remoção de serviços; toggle de ativo/inativo; destaque na página pública (estrela)
- **Horários** — configuração de dias e intervalos de funcionamento por dia da semana; suporte a múltiplos turnos por dia; validação de sobreposições
- **Perfil** — edição de dados do negócio (nome, slug, descrição, telefone, logo); zona de perigo (apagar conta)

### Painel de Administração
- Estatísticas globais: negócios, agendamentos totais, receita total, negócio mais ativo
- Gestão de negócios: ativar/desativar, editar, apagar (cascade completo), reset de password
- Gestão de administradores: aprovar/rejeitar pedidos de acesso, remover admins, auto-logout ao remover a própria conta
- Super admin protegido (não pode ser removido)

### Segurança e Auth
- Autenticação via Supabase Auth (email + password)
- Roles: `provider` e `admin`, com status: `active`, `pending`, `suspended`, `rejected`
- Proteção de rotas por role e status
- Logout automático por inatividade (60 minutos)
- Admins requerem aprovação manual antes de aceder ao painel
- Recuperação de password por email com link temporário

---

## Tecnologias

| Camada | Tecnologia |
|---|---|
| Frontend | React 18 + Vite |
| Routing | React Router v6 |
| Backend / DB | Supabase (PostgreSQL + Auth + Realtime) |
| Gráficos | Recharts |
| Calendário | react-big-calendar + date-fns |
| Ícones | react-icons (Feather + Remix) |
| Estilos | CSS modular (sem framework) |
| Exportação | CSV gerado no cliente (com BOM UTF-8) |

---

## Estrutura do Projeto

```
src/
├── assets/               # Logo e imagens estáticas
├── components/
│   ├── admin-panel/      # BusinessTable
│   ├── layout/           # AdminLayout, DashboardLayout, BookingLayout
│   └── service-panel/    # CalendarView, ClientTable, AppointmentList, AppointmentFormModal
├── context/
│   ├── AuthContext.jsx   # Autenticação, roles, inatividade
│   ├── BusinessContext.jsx
│   └── BookingContext.jsx
├── hooks/
│   ├── useAdmin.js
│   ├── useAppointments.js
│   ├── useFavorites.js
│   ├── useRealtime.js
│   └── useServices.js
├── lib/
│   ├── exportCsv.js      # Geração e download de CSV
│   ├── slots.js          # Geração de slots e deteção de colisões
│   └── supabase.js       # Cliente Supabase
├── pages/
│   ├── admin/            # AdminDashboard, AdminProviders, AdminUsers
│   ├── auth/             # Login, Register, AdminLogin, AdminRegister, UpdatePassword
│   ├── dashboard/        # Dashboard, Appointments, BookingsPage, Clients, Financial, Profile, Schedule, Services
│   ├── onboarding/       # Onboarding
│   ├── public-booking/   # ServicePage, DatePage, TimePage, FormPage, SummaryPage, BookingConfirm
│   ├── Home.jsx
│   └── NotFound.jsx
└── routes/
    ├── AppRoutes.jsx
    └── ProtectedRoute.jsx
```

---

## Base de Dados

Tabelas principais no Supabase:

| Tabela | Descrição |
|---|---|
| `profiles` | Perfis dos utilizadores com `role` e `status` |
| `business` | Dados do negócio (nome, slug, logo, descrição) |
| `services` | Serviços oferecidos por cada negócio |
| `working_hours` | Horários de funcionamento por dia da semana |
| `appointments` | Agendamentos com estado (`em_aberto`, `concluido`, `cancelado`, `nao_compareceu`) |
| `client_favorites` | Relação entre negócio e emails de clientes favoritos |

Funções RPC utilizadas:
- `get_business_with_email` — lista negócios com email do proprietário
- `get_admin_list` — lista admins ativos
- `get_pending_admins` — lista pedidos de acesso pendentes
- `approve_admin` — aprova um admin (altera status para `active`)
- `delete_user_by_id` — remove utilizador do Supabase Auth
- `delete_user_self` — auto-remoção do utilizador autenticado

---

## Autenticação e Roles

O sistema tem dois tipos de utilizadores:

**Provider (Prestador)**
- Registo livre em `/register`
- Após registo, passa pelo onboarding para configurar o negócio
- Acede ao dashboard em `/dashboard`
- Conta pode ser suspensa pelo admin

**Admin**
- Registo em `/admin/register` — cria conta com status `pending`
- Aguarda aprovação do super admin
- Após aprovação, acede ao painel em `/admin`
- Pode ser removido (perde acesso imediato); pode voltar a pedir acesso
- O super admin (`is_super: true`) não pode ser removido

---

## Fluxo de Agendamento Público

Acessível em `/p/:slug` (sem login):

```
1. Serviço     → cliente escolhe o serviço pretendido
2. Data        → calendário com dias disponíveis (baseado nos working_hours do negócio)
3. Horário     → slots gerados dinamicamente; slots ocupados ficam desativados
4. Informações → nome, email, telefone, notas (opcionais)
5. Resumo      → confirmação final antes de guardar
6. Concluído   → agendamento inserido na BD com status "em_aberto"
```

A geração de slots (`src/lib/slots.js`) respeita:
- Os turnos de trabalho definidos pelo prestador
- A duração do serviço selecionado
- Agendamentos já existentes (sem sobreposição)

---

## Painel do Prestador

Rota base: `/dashboard` (requer login com role `provider` e status `active`)

A sidebar lateral é sempre visível e permite navegar entre todas as secções. O logo ou iniciais do negócio são mostrados no topo da sidebar.

Funcionalidades de destaque:
- **Realtime** — agendamentos atualizam automaticamente via Supabase Realtime (`useRealtime.js`)
- **Optimistic updates** — toggle de favoritos, ativo/inativo e destaque de serviços atualizam o UI antes de confirmar na DB, com rollback em caso de erro
- **Exportação CSV** — disponível em Clientes e Financeiro; inclui BOM UTF-8 para compatibilidade com Excel em pt-PT

---

## Painel de Administração

Rota base: `/admin` (requer login com role `admin` e status `active`)

A sidebar fixa mostra as três secções: Início, Negócios e Administradores.

Funcionalidades de destaque:
- Ao desativar um negócio, o perfil do prestador é automaticamente suspenso (e vice-versa)
- Ao apagar um negócio, todos os dados relacionados são removidos em cascade (agendamentos, serviços, horários, favoritos, perfil, utilizador Auth)
- Um admin pode remover-se a si próprio — o sistema deteta essa situação e faz logout imediato
- O super admin é identificado por `is_super: true` e está protegido de remoção tanto no frontend como nas regras de negócio

---

## Autores

Projeto desenvolvido em dupla para conclusão do módulo de Front-End do curso de Full-Stack da [TechOf](https://www.techof.pt), sob orientação do Prof. Nuno Marques — 2025/2026.

- [Clarice Fernandes](https://github.com/ClaFernandes)
- [Glauber Carlos](https://github.com/GlauberCarlos)

# CronoCita 🏥

Plataforma SaaS **multi-tenant** (marketplace) de agendamento e gestão para **clínicas multidisciplinares** de pequeno e médio porte.

A plataforma tem três frentes:

- **Marketplace público** (estilo Doctoralia): pacientes encontram clínicas por nome/cidade/especialidade, veem o perfil da clínica e agendam online.
- **Painel da clínica** (multi-tenant): cada clínica gerencia seus próprios profissionais, salas, equipamentos, serviços, agenda, financeiro e indicadores — com isolamento total de dados por `clinicId`.
- **Plataforma (Super Admin)**: cadastro e gestão de clínicas, administradores, assinaturas e métricas globais.

Resolve os principais problemas operacionais de uma clínica:

- Agendamentos manuais e conflitos de salas/equipamentos
- Falta de lembretes automáticos (WhatsApp/SMS)
- Controle financeiro de profissionais parceiros (comissões)
- Baixa ocupação de agenda
- Falta de indicadores gerenciais (KPIs)

---

## 🚀 Execução rápida (Docker)

Pré-requisito: Docker + Docker Compose.

```bash
# IMPORTANTE: na primeira execução após a evolução multi-tenant,
# remova o volume antigo do MySQL (o esquema mudou: clinicId NOT NULL).
docker compose down -v

docker compose up --build
```

| Serviço            | URL                          |
| ------------------ | ---------------------------- |
| Home pública (marketplace) | http://localhost:5173 |
| Página da clínica  | http://localhost:5173/clinica/clinica-viver-bem |
| Portal do paciente | http://localhost:5173/minha-conta |
| Painel da clínica  | http://localhost:5173/painel |
| Plataforma (Super Admin) | http://localhost:5173/admin |
| API                | http://localhost:3333/api    |
| Healthcheck        | http://localhost:3333/api/health |
| MySQL              | localhost:3307 (user: `cronocita` / senha: `cronocita`) |

O backend aplica as migrations e executa o **seed de demonstração** automaticamente na inicialização (1 Super Admin + 3 clínicas completas). O seed é **idempotente**: ele só popula o banco quando está vazio (primeira subida). Nas reinicializações seguintes os dados criados por você (cadastros, agendamentos, chat) são **preservados**. Para forçar o reset ao estado demo, suba o backend com `FORCE_SEED=true`.

### Credenciais de demonstração (senha: `123456`)

| Perfil               | E-mail                    | Após login |
| -------------------- | ------------------------- | ---------- |
| Super Admin          | super@cronocita.com       | `/admin` |
| Admin (Viver Bem)    | admin@viverbem.com        | `/painel` |
| Admin (Espaço Saúde) | admin@espacosaude.com     | `/painel` |
| Admin (Vida Plena)   | admin@vidaplena.com       | `/painel` |
| Profissional         | ana@viverbem.com          | `/painel/agenda` |
| Paciente             | joao@cliente.com          | `/minha-conta` |

Pacientes podem **agendar sem login** (Home pública → página da clínica → **Agendar Consulta**) ou **criar uma conta** em `/register` para acompanhar agendamentos, histórico, notificações e conversar com os profissionais. O paciente demo `joao@cliente.com` tem prontuários em duas clínicas (agregação cross-clínica), notificações e um chat de exemplo.

---

## 🧱 Stack

**Frontend:** React 19 · TypeScript · Vite · React Router · Axios · React Hook Form · Zod · TailwindCSS · Shadcn/UI · Lucide Icons · React Query · Recharts

**Backend:** Node.js · Express · TypeScript · Prisma ORM · MySQL · JWT + Refresh Token · BCrypt · Zod · Socket.IO (chat) · Multer (upload) · node-cron (lembretes)

**Testes:** Jest · Supertest · Cypress

**Infra:** Docker · Docker Compose · `.env`

---

## 🏗️ Arquitetura

Arquitetura em camadas com separação obrigatória de **Routes → Controllers → Services → Repositories**, com **DTOs** e **Validators** (Zod) em cada módulo. Princípios aplicados: SOLID, Clean Code, Clean Architecture, Repository Pattern e injeção de dependência por construtor.

```
backend/src/
├── modules/
│   ├── auth/            # login (JWT carrega clinicId/clinicSlug), refresh, recuperação
│   ├── clinics/         # CRUD de clínicas (SUPER_ADMIN): slug, especialidades, ativar/desativar, admin inicial
│   ├── subscriptions/   # CRUD básico de assinaturas por clínica (SUPER_ADMIN)
│   ├── platform/        # métricas globais da plataforma (SUPER_ADMIN)
│   ├── users/           # gestão de usuários por clínica
│   ├── patients/        # CRUD de pacientes (escopado por clinicId)
│   ├── professionals/   # CRUD de profissionais + % comissão (escopado)
│   ├── rooms/           # CRUD de salas (escopado)
│   ├── equipments/      # CRUD de equipamentos (escopado)
│   ├── services/        # CRUD de serviços (escopado)
│   ├── appointments/    # agendamentos + disponibilidade + API pública por clínica
│   ├── commissions/     # cálculo automático de comissões (escopado)
│   ├── dashboard/       # KPIs e gráficos (escopados por clínica)
│   ├── patient-portal/  # /api/me: dashboard, agendamentos cross-clínica, perfil, avatar, notificações
│   ├── messages/        # chat paciente ↔ profissional (REST + Socket.IO)
│   └── notifications/   # notificações in-app (UserNotification) + cron de lembretes
└── shared/
    ├── middleware/      # ensureAuthenticated, ensureRole, ensureClinic (tenancy), validação, errors
    ├── errors/          # AppError, ConflictError, etc.
    ├── database/        # Prisma Client singleton
    ├── notifications/   # camada desacoplada (WhatsApp, Twilio, Evolution API)
    ├── realtime/        # instância Socket.IO + emitToUser
    ├── upload/          # multer (upload de avatar)
    └── utils/           # datas, slug, asyncHandler, config de auth
```

```
frontend/src/
├── pages/public/        # Home (marketplace), ClinicPage (/clinica/:slug), Booking (wizard)
├── pages/admin/         # Super Admin: Dashboard, Clínicas, Usuários, Assinaturas, Relatórios, Configurações
├── pages/patient/       # Portal do paciente: Dashboard, Profile (abas), Appointments, History, Notifications
├── pages/               # Login, Register, ForgotPassword, Chat + Painel da clínica (Dashboard, Agenda, CRUDs...)
├── components/ui/       # componentes Shadcn/UI (Button, Dialog, Table...)
├── components/layout/   # AppLayout (clínica), SuperAdminLayout (plataforma), PatientLayout (paciente), ProtectedRoute
├── hooks/               # useCrud (React Query genérico)
└── lib/                 # api (Axios + refresh), auth (contexto), socket (Socket.IO client), utils
```

---

## 👥 Perfis de usuário

| Perfil            | Permissões                                                            |
| ----------------- | --------------------------------------------------------------------- |
| **SUPER_ADMIN**   | Plataforma: cadastra/gerencia clínicas, administradores e assinaturas; vê métricas globais |
| **CLINIC_ADMIN**  | Gerencia sua clínica: profissionais, salas, equipamentos, serviços; dashboards e financeiro |
| **SECRETÁRIA**    | Cadastra pacientes; agenda, remarca e cancela consultas (na sua clínica) |
| **PROFISSIONAL**  | Visualiza a própria agenda, confirma atendimentos, vê comissões, conversa com pacientes |
| **PACIENTE**      | Cria conta, agenda online, cancela consultas, vê histórico cross-clínica, notificações e chat com profissionais |

> **Multi-tenancy:** todo recurso pertence a uma clínica via `clinicId`. O `clinicId` viaja no JWT e é aplicado nos repositories (isolamento total entre clínicas). O `SUPER_ADMIN` não tem clínica e pode operar sobre uma clínica específica via `?clinicId=`.

---

## ⚙️ Regras de negócio principais

### Algoritmo de disponibilidade — `checkAvailability()`

Antes de salvar qualquer agendamento o sistema verifica, no mesmo intervalo de tempo:

1. **Profissional disponível** → senão: `409 "Horário indisponível."`
2. **Sala disponível** (alocada automaticamente quando o serviço exige)
3. **Equipamento disponível** (alocado conforme os requisitos do serviço)
4. Conflito de sala/equipamento → `409 "Sala ou equipamento já reservado."`

**Nenhum agendamento é salvo em conflito.**

### Comissões — `calculateCommission()`

Ao finalizar um atendimento a comissão é gerada automaticamente:

> Consulta R$ 200 · profissional 70% → **R$ 140 profissional / R$ 60 clínica**

### Cancelamento — `canCancel()`

Não é permitido cancelar com **menos de 2 horas** de antecedência (`422`).

### Notificações (desacopladas)

Interface `NotificationProvider` com implementações para **WhatsApp Cloud API**, **Twilio** e **Evolution API** (stubs prontos para receber credenciais via `.env`). Eventos: agendamento criado, lembrete de consulta, consulta cancelada — todos persistidos na tabela `notifications`.

Além desse log de canal, existem **notificações in-app** (tabela `user_notifications`, tipos `APPOINTMENT/REMINDER/CHAT/PROMOTION/SYSTEM`) exibidas na Central de Notificações do paciente. Um job **node-cron** (a cada 5 min) gera lembretes **24h / 2h / 30min** antes da consulta e o convite de avaliação **após** o atendimento, de forma idempotente.

---

## 🙋 Portal do Paciente

- **Conta global do paciente** (`User role=PATIENT` com CPF, telefone e avatar). Registro em `/register`, login em `/login`, recuperação em `/recuperar-senha`.
- **Identidade cross-clínica:** os prontuários `Patient` (um por clínica) são vinculados à conta por **CPF**. As telas de **Meus Agendamentos** e **Histórico** agregam consultas de todas as clínicas.
- **Telas:** dashboard (`/minha-conta`), perfil com abas e upload de foto (`/perfil`), agendamentos com filtros e cancelamento (`/meus-agendamentos`), histórico (tabela), central de notificações (`/notificacoes`) e chat (`/mensagens`).
- **Chat em tempo real (Socket.IO):** paciente ↔ profissional, com handshake autenticado por JWT. O profissional acessa o chat em `/painel/mensagens`. Cada mensagem gera uma notificação in-app do tipo `CHAT`.
- **Upload de avatar (Multer):** arquivos servidos em `/uploads` pelo backend e persistidos no volume Docker `uploads_data`.

---

## 📊 Dashboard (KPIs)

1. **Tempo médio de agendamento** (antecedência entre criação e consulta)
2. **Taxa de ocupação** da agenda
3. **Taxa de faltas (No-show)**
4. **Taxa de cancelamento**
5. **Satisfação do paciente** (avaliação 1–5)

Gráficos com Recharts: linha (agendamentos/dia), pizza (status) e barras (receita por profissional).

---

## 🌐 Marketplace público

- **Home (`/`)** — hero "Encontre a clínica ideal para você" + busca por nome/cidade/especialidade + grid de cards de clínica.
- **Página da clínica (`/clinica/:slug`)** — logo, descrição, endereço, telefone, lista de profissionais e serviços, botão **Agendar Consulta**.
- **Agendamento (`/clinica/:slug/agendar`)** — sem login: **especialidade → profissional → data → horário → confirmar**. Os horários exibidos consideram a disponibilidade real de profissional, sala e equipamento, escopada por clínica (`GET /api/public/clinics/:slug/availability`).

---

## 🔌 API REST (principais rotas)

| Método | Rota                              | Descrição                              | Acesso |
| ------ | --------------------------------- | -------------------------------------- | ------ |
| POST   | `/api/auth/login`                 | Login (JWT com clinicId/clinicSlug)    | público |
| POST   | `/api/auth/refresh`               | Rotação de refresh token               | público |
| CRUD   | `/api/clinics`                    | Clínicas (slug, especialidades, status, admin inicial) | SUPER_ADMIN |
| PATCH  | `/api/clinics/:id/status`         | Ativar/desativar clínica               | SUPER_ADMIN |
| CRUD   | `/api/subscriptions`              | Assinaturas por clínica                | SUPER_ADMIN |
| GET    | `/api/admin/metrics`              | Métricas globais da plataforma         | SUPER_ADMIN |
| CRUD   | `/api/users?clinicId=`            | Usuários da clínica                    | CLINIC_ADMIN, SUPER_ADMIN |
| CRUD   | `/api/patients`                   | Pacientes (escopado por clínica)       | CLINIC_ADMIN, SECRETÁRIA |
| CRUD   | `/api/professionals`              | Profissionais (escopado)               | CLINIC_ADMIN |
| CRUD   | `/api/rooms` · `/api/equipments` · `/api/services` | Recursos da clínica   | CLINIC_ADMIN |
| GET/POST | `/api/appointments`             | Listar/criar agendamentos (escopado)   | conforme perfil |
| PATCH  | `/api/appointments/:id/status`    | Confirmar/cancelar/finalizar/no-show   | conforme perfil |
| GET    | `/api/commissions` · `/summary`   | Comissões (escopado)                   | CLINIC_ADMIN, PROFISSIONAL |
| GET    | `/api/dashboard/kpis` · `/charts` | Indicadores (escopado)                 | CLINIC_ADMIN |
| GET    | `/api/public/clinics?name=&city=&specialty=` | Lista de clínicas ativas    | público |
| GET    | `/api/public/clinics/:slug`       | Detalhe da clínica + profissionais + serviços | público |
| GET    | `/api/public/clinics/:slug/availability` | Horários livres na clínica      | público |
| POST   | `/api/public/clinics/:slug/appointments` | Agendamento online na clínica   | público |
| POST   | `/api/auth/register`              | Cadastro de paciente (CPF/e-mail únicos) | público |
| GET    | `/api/me/dashboard` · `/appointments` | Dashboard e agendamentos cross-clínica | PACIENTE |
| PATCH  | `/api/me/appointments/:id/cancel` | Cancelar a própria consulta            | PACIENTE |
| GET/PUT | `/api/me/profile` · `/password`  | Perfil e troca de senha                | PACIENTE |
| POST   | `/api/me/avatar`                  | Upload de foto (multipart)             | PACIENTE |
| GET/PATCH | `/api/me/notifications`        | Central de notificações (listar/ler)   | PACIENTE |
| GET/POST | `/api/messages` · `/threads` · `/:withUserId` | Chat (REST + Socket.IO) | PACIENTE, PROFISSIONAL |

---

## 🧪 Testes

### Backend (Jest + Supertest)

```bash
cd backend
npm test
```

Cobertura dos pontos críticos:

- `checkAvailability()` — conflitos de profissional, sala e equipamento
- `calculateCommission()` — cálculo correto (200 × 70% → 140/60)
- `canCancel()` — validação das 2 horas de antecedência
- Integração HTTP (Supertest): autenticação, validação e conflito `409`

### E2E (Cypress)

Com a aplicação rodando (`docker-compose up`):

```bash
cd frontend
npx cypress install   # primeira vez
npm run cy:run
```

- **Fluxo feliz:** login (admin da clínica) → agendar → salvar → aparecer na agenda
- **Fluxo de erro:** agendar horário/sala ocupados → exibir mensagem de erro
- **Marketplace:** Home → buscar/abrir clínica → agendar consulta online

---

## 💻 Desenvolvimento local (sem Docker)

1. Suba um MySQL e configure `backend/.env` (copie de `.env.example`).
2. Backend:

```bash
cd backend
npm install
npx prisma migrate deploy
npm run seed
npm run dev          # http://localhost:3333
```

3. Frontend:

```bash
cd frontend
npm install
npm run dev          # http://localhost:5173
```

---

## 📦 Banco de dados (Prisma)

Modelos: `Clinic` (slug único, status), `ClinicSpecialty`, `Subscription` (plano/status), `User` (roles + `clinicId`), `RefreshToken`, `PasswordResetToken`, `Patient`, `Professional`, `Room`, `Equipment`, `Service`, `ServiceEquipment`, `Appointment` (status: `SCHEDULED`, `CONFIRMED`, `CANCELED`, `FINISHED`, `NO_SHOW`), `Commission`, `Notification`. Todos os recursos da clínica carregam `clinicId`; pacientes e profissionais têm unicidade composta por clínica (`@@unique([clinicId, cpf])`, `@@unique([clinicId, email])`).

Schema completo em [`backend/prisma/schema.prisma`](backend/prisma/schema.prisma).

> ⚠️ O seed roda a cada inicialização do container do backend, mas é **idempotente**: só popula o banco quando ele está vazio. Assim, dados criados por você **persistem** entre reinicializações (o volume `mysql_data` mantém o banco). Para recriar os dados de demonstração do zero, suba o backend com `FORCE_SEED=true` (reseta apenas o conteúdo) ou rode `docker compose down -v` (apaga o volume do MySQL inteiro). Ao atualizar de uma versão anterior cujo esquema seja incompatível, use `docker compose down -v` antes do `up`.

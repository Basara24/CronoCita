# CronoCita 🏥

Plataforma SaaS **multi-tenant** (marketplace) de agendamento e gestão para **clínicas multidisciplinares** de pequeno e médio porte.

A plataforma tem **quatro portais**:

- **Marketplace público** (estilo Doctoralia): pacientes encontram clínicas por nome/cidade/especialidade/serviço/profissional (busca inteligente), veem clínicas em destaque, abrem o perfil completo da clínica (capa, galeria, mapa) e agendam online. Inclui seção **Fale Conosco**.
- **Portal do paciente**: dashboard com clínicas em destaque e favoritas (❤️), agendamentos cross-clínica, histórico, notificações e chat com os profissionais.
- **Portal do profissional**: dashboard pessoal, agenda semanal (bloquear/liberar/remarcar/cancelar), serviços próprios, pacientes atendidos, mensagens e perfil.
- **Painel da clínica** (multi-tenant): cada clínica gerencia seus próprios profissionais, salas, equipamentos, serviços, agenda, financeiro, indicadores e **identidade visual** (logo, capa, galeria, redes sociais, localização) — com isolamento total de dados por `clinicId`.
- **Plataforma (Super Admin)**: cadastro e gestão de clínicas, administradores, assinaturas, métricas globais e **mensagens do Fale Conosco**.

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
| Portal do profissional | http://localhost:5173/profissional |
| Painel da clínica  | http://localhost:5173/painel |
| Configurações da clínica | http://localhost:5173/painel/configuracoes |
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
| Profissional         | ana@viverbem.com          | `/profissional` |
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
│   ├── clinics/         # CRUD de clínicas (SUPER_ADMIN) + /api/clinics/me (CLINIC_ADMIN: identidade visual, galeria, localização)
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
│   ├── patient-portal/  # /api/me: dashboard, agendamentos cross-clínica, perfil, avatar, notificações, favoritos
│   ├── professional-portal/ # /api/professional: dashboard, agenda, blocks, serviços próprios, pacientes atendidos, perfil
│   ├── favorites/       # /api/me/favorites: clínicas favoritas do paciente (❤️)
│   ├── contacts/        # Fale Conosco: POST público + listagem/status (SUPER_ADMIN)
│   ├── messages/        # chat paciente ↔ profissional (REST + Socket.IO) + anexos PDF/imagem + isImportant
│   └── notifications/   # notificações in-app (UserNotification) + cron de lembretes
└── shared/
    ├── middleware/      # ensureAuthenticated, ensureRole, ensureClinic (tenancy), validação, errors
    ├── errors/          # AppError, ConflictError, etc.
    ├── database/        # Prisma Client singleton
    ├── notifications/   # camada desacoplada (WhatsApp, Twilio, Evolution API)
    ├── realtime/        # instância Socket.IO + emitToUser
    ├── upload/          # multer (avatar, clínica logo/capa/galeria, serviço, anexos de mensagem PDF/imagem)
    └── utils/           # datas, slug, asyncHandler, config de auth
```

```
frontend/src/
├── pages/public/        # Home (marketplace + busca inteligente + destaques + Fale Conosco), ClinicPage (capa/galeria/mapa), Booking
├── pages/admin/         # Super Admin: Dashboard, Clínicas, Usuários, Assinaturas, Relatórios, Configurações, Contatos
├── pages/patient/       # Portal do paciente: Dashboard, Profile (abas), Appointments, History, Notifications, Favorites, ClinicsBrowse
├── pages/professional/  # Portal do profissional: Dashboard, Agenda (semanal), Services, Patients, Profile
├── pages/               # Login, Register, ForgotPassword, Chat, Settings (clínica) + Painel da clínica (Dashboard, Agenda, CRUDs...)
├── components/ui/        # componentes Shadcn/UI (Button, Dialog, Table...) + toast, skeleton
├── components/layout/   # AppLayout (clínica), SuperAdminLayout, PatientLayout, ProfessionalLayout, ProtectedRoute
├── hooks/               # useCrud (React Query genérico), useFavorites
└── lib/                 # api (Axios + refresh), auth (contexto), socket (Socket.IO client), theme (dark mode), utils
```

---

## 👥 Perfis de usuário

| Perfil            | Permissões                                                            |
| ----------------- | --------------------------------------------------------------------- |
| **SUPER_ADMIN**   | Plataforma: cadastra/gerencia clínicas, administradores e assinaturas; vê métricas globais |
| **CLINIC_ADMIN**  | Gerencia sua clínica: profissionais, salas, equipamentos, serviços; dashboards e financeiro |
| **SECRETÁRIA**    | Cadastra pacientes; agenda, remarca e cancela consultas (na sua clínica) |
| **PROFISSIONAL**  | Portal próprio (`/profissional`): dashboard, agenda semanal (bloquear/liberar/remarcar/cancelar), serviços próprios, pacientes atendidos, mensagens e perfil |
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

### Notificações WhatsApp (Evolution API)

As **notificações automáticas** do CronoCita (confirmação de agendamento, cancelamento, lembretes 24h/2h/30min) são enviadas via **Evolution API** para o telefone do paciente (`Patient.phone`). O **chat in-app** (`/mensagens`, Socket.IO) **não** usa WhatsApp — permanece só no portal.

| Evento | Canal WhatsApp | Canal in-app |
| ------ | -------------- | ------------ |
| Agendamento confirmado | Sim | Sim (`APPOINTMENT`) |
| Consulta cancelada | Sim | Sim (`APPOINTMENT`) |
| Lembrete 24h / 2h / 30min | Sim | Sim (`REMINDER`) |
| Avalie seu atendimento | Não | Sim (`REMINDER`) |
| Mensagem do chat | **Não** | Sim (`CHAT`) |

Configure no `backend/.env` (ou variáveis do serviço `backend` no Docker):

```env
NOTIFICATION_PROVIDER=evolution
EVOLUTION_API_URL=http://localhost:8080
EVOLUTION_API_KEY=sua-chave-da-evolution
EVOLUTION_INSTANCE=cronocita
```

**Passos para ativar:**

1. Suba uma instância da [Evolution API](https://doc.evolution-api.com/) e crie a instância `cronocita` (ou outro nome em `EVOLUTION_INSTANCE`).
2. Conecte o WhatsApp (QR Code) na instância até o status ficar **open/connected**.
3. Copie a **API Key global** para `EVOLUTION_API_KEY`.
4. Reinicie o backend. Sem credenciais, o provider opera em **modo stub** (só log no console).

> **Docker:** se a Evolution roda na máquina host e o backend no container, use `EVOLUTION_API_URL=http://host.docker.internal:8080` (padrão no `docker-compose.yml`).

Registros de envio ficam na tabela `notifications` (status `SENT` / `FAILED`). Falhas de WhatsApp **não** interrompem o fluxo de agendamento.

Além do WhatsApp, existem **notificações in-app** (`user_notifications`) na Central de Notificações do paciente. Um job **node-cron** (a cada 5 min) gera lembretes in-app de forma idempotente.

---

## 🙋 Portal do Paciente

- **Conta global do paciente** (`User role=PATIENT` com CPF, telefone e avatar). Registro em `/register`, login em `/login`, recuperação em `/recuperar-senha`.
- **Identidade cross-clínica:** os prontuários `Patient` (um por clínica) são vinculados à conta por **CPF**. As telas de **Meus Agendamentos** e **Histórico** agregam consultas de todas as clínicas.
- **Telas:** dashboard (`/minha-conta`) com saudação, cards rápidos, **clínicas em destaque** e busca inteligente; perfil com abas e upload de foto (`/perfil`); agendamentos com filtros e cancelamento (`/meus-agendamentos`); histórico (tabela); central de notificações (`/notificacoes`); **favoritos** (`/favoritos`); navegação de clínicas (`/clinicas`); e chat (`/mensagens`).
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

- **Home (`/`)** — hero "Encontre a clínica ideal para você" + **busca inteligente** (nome/cidade/especialidade/serviço/profissional), seções de **clínicas em destaque** (populares, mais bem avaliadas ⭐, próximas) e seção final **Fale Conosco** (form Nome/E-mail/Assunto/Mensagem → `POST /api/public/contact`).
- **Página da clínica (`/clinica/:slug`)** — capa + logo + nome + ⭐ rating + cidade + telefone + descrição, redes sociais, especialidades, cards de profissionais e serviços, **galeria de fotos**, **Google Maps sem chave** (iframe `?q=endereço` + botão "Como chegar") e botão **Agendar Consulta**.
- **Agendamento (`/clinica/:slug/agendar`)** — sem login: **especialidade → profissional → data → horário → confirmar**. Os horários exibidos consideram a disponibilidade real de profissional, sala, equipamento e **bloqueios de agenda** (`ScheduleBlock`) do profissional, escopada por clínica (`GET /api/public/clinics/:slug/availability`).

---

## 🩺 Portal do Profissional

Rotas `/profissional/*` (role `PROFESSIONAL`, escopo por `professional.userId`):

- **Dashboard** — consultas de hoje, pacientes atendidos, próximas consultas e avaliação média.
- **Agenda semanal** — visão estilo calendário; criar/remover **bloqueios** de horário (`ScheduleBlock`), remarcar e cancelar consultas.
- **Serviços** — CRUD dos próprios serviços (descrição, imagem, status).
- **Pacientes** — apenas pacientes já atendidos (com histórico e atalho de mensagem).
- **Mensagens** — chat com anexos (PDF/imagem) e marcação de mensagens importantes; o profissional só conversa com pacientes já atendidos.
- **Perfil** — nome, telefone, especialidade e avatar.

---

## ⭐ Identidade visual, galeria e favoritos

- **Configurações da clínica (`/painel/configuracoes`, CLINIC_ADMIN)** — abas **Identidade Visual** (logo, capa, descrição, telefone, e-mail, site, Instagram, Facebook), **Fotos** (galeria por categoria com upload/remoção) e **Localização** (CEP/endereço + latitude/longitude para o mapa). API: `GET/PUT /api/clinics/me` e `POST/DELETE /api/clinics/me/photos`.
- **Favoritos (PATIENT)** — botão de coração nos cards e aba dedicada; persistidos na tabela `Favorite` (`GET /api/me/favorites`, `POST/DELETE /api/me/favorites/:clinicId`). A contagem aparece no dashboard do paciente.
- **Fale Conosco** — mensagens públicas vão para a tabela `Contact`; o `SUPER_ADMIN` gerencia em `/admin/contatos` (`GET/PATCH /api/contacts`, status `NEW/READ/RESOLVED`).

---

## 🎨 Infra de UX (frontend)

- **Toasts** in-house (`ToastProvider`/`useToast`) com variantes success/error/info.
- **Skeleton loading** com efeito shimmer nos carregamentos (home, dashboards, listas).
- **Dark mode** (`darkMode: 'class'` no Tailwind + `ThemeProvider` com persistência em `localStorage` + toggle sol/lua nos layouts).
- Revisão de **responsividade** de grids e navbars.

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
| GET/PUT | `/api/clinics/me` · `POST/DELETE /photos` | Identidade visual + galeria da própria clínica | CLINIC_ADMIN |
| GET    | `/api/public/clinics?q=&name=&city=&specialty=` | Lista de clínicas (busca inteligente) | público |
| GET    | `/api/public/clinics/featured`    | Clínicas em destaque (popular/topRated/nearby) | público |
| GET    | `/api/public/clinics/:slug`       | Detalhe enriquecido (capa, social, mapa, galeria, profissionais/serviços) | público |
| GET    | `/api/public/clinics/:slug/availability` | Horários livres (considera bloqueios) | público |
| POST   | `/api/public/clinics/:slug/appointments` | Agendamento online na clínica   | público |
| POST   | `/api/public/contact`             | Fale Conosco (cria mensagem de contato) | público |
| GET/PATCH | `/api/contacts`                | Listar/atualizar status das mensagens  | SUPER_ADMIN |
| POST   | `/api/auth/register`              | Cadastro de paciente (CPF/e-mail únicos) | público |
| GET    | `/api/me/dashboard` · `/appointments` | Dashboard e agendamentos cross-clínica | PACIENTE |
| PATCH  | `/api/me/appointments/:id/cancel` | Cancelar a própria consulta            | PACIENTE |
| GET/PUT | `/api/me/profile` · `/password`  | Perfil e troca de senha                | PACIENTE |
| POST   | `/api/me/avatar`                  | Upload de foto (multipart)             | PACIENTE |
| GET/PATCH | `/api/me/notifications`        | Central de notificações (listar/ler)   | PACIENTE |
| GET/POST/DELETE | `/api/me/favorites`      | Clínicas favoritas (listar/favoritar/remover) | PACIENTE |
| GET    | `/api/professional/dashboard`     | Métricas pessoais do profissional      | PROFISSIONAL |
| GET    | `/api/professional/appointments`  | Agenda + remarcar/cancelar             | PROFISSIONAL |
| GET/POST/DELETE | `/api/professional/blocks`| Bloquear/liberar horários (ScheduleBlock) | PROFISSIONAL |
| CRUD   | `/api/professional/services`      | Serviços próprios (imagem/descrição/status) | PROFISSIONAL |
| GET    | `/api/professional/patients`      | Pacientes já atendidos                 | PROFISSIONAL |
| GET/PUT | `/api/professional/profile`      | Perfil do profissional                 | PROFISSIONAL |
| GET/POST | `/api/messages` · `/threads` · `/:withUserId` · `/upload` | Chat + anexos PDF/imagem (REST + Socket.IO) | PACIENTE, PROFISSIONAL |
| PATCH  | `/api/messages/:id/important`     | Marcar/desmarcar mensagem importante   | PACIENTE, PROFISSIONAL |

---

## 🧪 Testes

### Backend (Jest + Supertest)

```bash
cd backend
npm test
```

Cobertura dos pontos críticos:

- `checkAvailability()` — conflitos de profissional, sala, equipamento e **bloqueios de agenda** (`ScheduleBlock`)
- `calculateCommission()` — cálculo correto (200 × 70% → 140/60)
- `canCancel()` — validação das 2 horas de antecedência
- `ContactsService` e `FavoritesService` — criação/listagem/status e favoritar/remover
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

Modelos: `Clinic` (slug único, status, capa/redes sociais, latitude/longitude, rating), `ClinicSpecialty`, `ClinicPhoto` (galeria por categoria), `Subscription` (plano/status), `User` (roles + `clinicId`), `RefreshToken`, `PasswordResetToken`, `Patient`, `Professional`, `Room`, `Equipment`, `Service` (com `professionalId`/descrição/imagem/status), `ServiceEquipment`, `Appointment` (status: `SCHEDULED`, `CONFIRMED`, `CANCELED`, `FINISHED`, `NO_SHOW`), `ScheduleBlock` (bloqueios de agenda), `Commission`, `Notification`, `UserNotification`, `Message` (com `attachmentUrl`/`isImportant`), `Favorite`, `Contact`. Todos os recursos da clínica carregam `clinicId`; pacientes e profissionais têm unicidade composta por clínica (`@@unique([clinicId, cpf])`, `@@unique([clinicId, email])`); favoritos são únicos por `@@unique([userId, clinicId])`.

Schema completo em [`backend/prisma/schema.prisma`](backend/prisma/schema.prisma).

> ⚠️ O seed roda a cada inicialização do container do backend, mas é **idempotente**: só popula o banco quando ele está vazio. Assim, dados criados por você **persistem** entre reinicializações (o volume `mysql_data` mantém o banco). Para recriar os dados de demonstração do zero, suba o backend com `FORCE_SEED=true` (reseta apenas o conteúdo) ou rode `docker compose down -v` (apaga o volume do MySQL inteiro). Ao atualizar de uma versão anterior cujo esquema seja incompatível, use `docker compose down -v` antes do `up`.

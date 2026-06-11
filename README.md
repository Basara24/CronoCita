# CronoCita 🏥

Plataforma SaaS de agendamento e gestão para **clínicas multidisciplinares** de pequeno e médio porte.

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
docker-compose up --build
```

| Serviço            | URL                          |
| ------------------ | ---------------------------- |
| Frontend (painel)  | http://localhost:5173        |
| Portal público     | http://localhost:5173/agendar |
| API                | http://localhost:3333/api    |
| Healthcheck        | http://localhost:3333/api/health |
| MySQL              | localhost:3307 (user: `cronocita` / senha: `cronocita`) |

O backend aplica as migrations e executa o **seed de demonstração** automaticamente na inicialização.

### Credenciais de demonstração (senha: `123456`)

| Perfil       | E-mail                    |
| ------------ | ------------------------- |
| Admin        | admin@cronocita.com       |
| Secretária   | secretaria@cronocita.com  |
| Profissional | ana@cronocita.com         |
| Paciente     | paciente@cronocita.com    |

---

## 🧱 Stack

**Frontend:** React 19 · TypeScript · Vite · React Router · Axios · React Hook Form · Zod · TailwindCSS · Shadcn/UI · Lucide Icons · React Query · Recharts

**Backend:** Node.js · Express · TypeScript · Prisma ORM · MySQL · JWT + Refresh Token · BCrypt · Zod

**Testes:** Jest · Supertest · Cypress

**Infra:** Docker · Docker Compose · `.env`

---

## 🏗️ Arquitetura

Arquitetura em camadas com separação obrigatória de **Routes → Controllers → Services → Repositories**, com **DTOs** e **Validators** (Zod) em cada módulo. Princípios aplicados: SOLID, Clean Code, Clean Architecture, Repository Pattern e injeção de dependência por construtor.

```
backend/src/
├── modules/
│   ├── auth/            # login, registro, refresh token, recuperação de senha
│   ├── users/           # gestão de usuários (ADMIN)
│   ├── patients/        # CRUD de pacientes
│   ├── professionals/   # CRUD de profissionais + % comissão
│   ├── rooms/           # CRUD de salas
│   ├── equipments/      # CRUD de equipamentos
│   ├── services/        # CRUD de serviços (duração, valor, sala, equipamentos)
│   ├── appointments/    # agendamentos + algoritmo de disponibilidade + portal público
│   ├── commissions/     # cálculo automático de comissões
│   └── dashboard/       # KPIs e gráficos
└── shared/
    ├── middleware/      # autenticação JWT, roles, validação, error handler
    ├── errors/          # AppError, ConflictError, etc.
    ├── database/        # Prisma Client singleton
    ├── notifications/   # camada desacoplada (WhatsApp, Twilio, Evolution API)
    └── utils/           # datas, asyncHandler, config de auth
```

```
frontend/src/
├── pages/               # Login, Dashboard, Agenda, CRUDs, Financeiro, Relatórios, Portal
├── components/ui/       # componentes Shadcn/UI (Button, Dialog, Table...)
├── components/layout/   # AppLayout (sidebar), ProtectedRoute (roles)
├── hooks/               # useCrud (React Query genérico)
└── lib/                 # api (Axios + refresh automático), auth (contexto), utils
```

---

## 👥 Perfis de usuário

| Perfil           | Permissões                                                            |
| ---------------- | --------------------------------------------------------------------- |
| **ADMIN**        | Gerencia clínica, profissionais, salas, equipamentos, serviços; dashboards e financeiro |
| **SECRETÁRIA**   | Cadastra pacientes; agenda, remarca e cancela consultas               |
| **PROFISSIONAL** | Visualiza a própria agenda, confirma atendimentos, vê comissões       |
| **PACIENTE**     | Agenda online, cancela consultas, consulta histórico                  |

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

---

## 📊 Dashboard (KPIs)

1. **Tempo médio de agendamento** (antecedência entre criação e consulta)
2. **Taxa de ocupação** da agenda
3. **Taxa de faltas (No-show)**
4. **Taxa de cancelamento**
5. **Satisfação do paciente** (avaliação 1–5)

Gráficos com Recharts: linha (agendamentos/dia), pizza (status) e barras (receita por profissional).

---

## 🌐 Portal público de agendamento

`/agendar` — sem login: **especialidade → profissional → data → horário → confirmar**. Os horários exibidos consideram a disponibilidade real de profissional, sala e equipamento (`GET /api/public/availability`).

---

## 🔌 API REST (principais rotas)

| Método | Rota                              | Descrição                              | Acesso |
| ------ | --------------------------------- | -------------------------------------- | ------ |
| POST   | `/api/auth/login`                 | Login (JWT + refresh token)            | público |
| POST   | `/api/auth/register`              | Cadastro de paciente                   | público |
| POST   | `/api/auth/refresh`               | Rotação de refresh token               | público |
| POST   | `/api/auth/forgot-password`       | Recuperação de senha                   | público |
| CRUD   | `/api/patients`                   | Pacientes                              | ADMIN, SECRETÁRIA |
| CRUD   | `/api/professionals`              | Profissionais                          | ADMIN |
| CRUD   | `/api/rooms` · `/api/equipments` · `/api/services` | Recursos da clínica   | ADMIN |
| GET/POST | `/api/appointments`             | Listar/criar agendamentos              | conforme perfil |
| PUT    | `/api/appointments/:id/reschedule`| Remarcar (drag-and-drop na agenda)     | ADMIN, SECRETÁRIA |
| PATCH  | `/api/appointments/:id/status`    | Confirmar/cancelar/finalizar/no-show   | conforme perfil |
| GET    | `/api/commissions` · `/summary`   | Comissões                              | ADMIN, PROFISSIONAL |
| GET    | `/api/dashboard/kpis` · `/charts` | Indicadores                            | ADMIN |
| GET    | `/api/public/specialties` · `/professionals` · `/services` · `/availability` | Portal público | público |
| POST   | `/api/public/appointments`        | Agendamento online                     | público |

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

- **Fluxo feliz:** login → agendar → salvar → aparecer na agenda
- **Fluxo de erro:** agendar horário/sala ocupados → exibir mensagem de erro

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

Modelos: `User` (roles), `RefreshToken`, `PasswordResetToken`, `Patient`, `Professional`, `Room`, `Equipment`, `Service`, `ServiceEquipment`, `Appointment` (status: `SCHEDULED`, `CONFIRMED`, `CANCELED`, `FINISHED`, `NO_SHOW`), `Commission`, `Notification`.

Schema completo em [`backend/prisma/schema.prisma`](backend/prisma/schema.prisma).

> ⚠️ O seed é reexecutado a cada inicialização do container do backend e **recria os dados de demonstração**. Para ambientes reais, remova `npm run seed` do `CMD` do `backend/Dockerfile`.

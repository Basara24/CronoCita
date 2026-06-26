# Roteiro de Apresentação e Justificativa Técnica

Material de apoio para demo e perguntas da banca.

---

## 1. Roteiro de demo (10–15 min)

### 1.1 Marketplace público (2 min)

1. Abrir `http://localhost:5173`
2. Buscar clínica por especialidade ou cidade
3. Abrir página da clínica (`/clinica/clinica-viver-bem`)
4. Mostrar galeria, rating, mapa Google (sem chave) e botão Agendar

### 1.2 Agendamento online (2 min)

1. Wizard de agendamento sem login
2. Destacar máscaras de CPF/telefone e validação em tempo real
3. Confirmar horário disponível (algoritmo de conflito)

### 1.3 Portal do paciente (2 min)

1. Login: `joao@cliente.com` / `123456`
2. Dashboard com favoritos e clínicas em destaque
3. Meus Agendamentos (cross-clínica) e notificações

### 1.4 Portal do profissional (2 min)

1. Login: `ana@viverbem.com` / `123456`
2. Agenda semanal, bloqueio de horários, serviços próprios

### 1.5 Painel da clínica (2 min)

1. Login: `admin@viverbem.com` / `123456`
2. CRUD de pacientes (máscaras + validação CPF)
3. Configurações → identidade visual, galeria, localização

### 1.6 Super Admin (1 min)

1. Login: `super@cronocita.com` / `123456`
2. Gestão de clínicas, contatos (Fale Conosco)

---

## 2. Respostas-modelo para a banca

### Por que multi-tenant?

Cada clínica é um tenant isolado por `clinicId` no JWT e nos repositories. O SUPER_ADMIN opera sobre qualquer clínica via query param. Isso permite escalar o marketplace sem vazamento de dados entre clínicas.

### Como funciona a disponibilidade de horários?

Antes de salvar um agendamento, o `AvailabilityChecker` verifica conflitos de profissional, sala, equipamento e bloqueios de agenda (`ScheduleBlock`). Retorna `409` se houver conflito — nenhum agendamento inválido é persistido.

### Quais princípios SOLID foram aplicados?

**SRP:** cada camada tem uma responsabilidade — Routes roteiam, Controllers adaptam HTTP, Services contêm regra de negócio, Repositories acessam dados.

**DIP:** services dependem de interfaces (`IPatientsRepository`, `NotificationProvider`), não de implementações concretas. Isso facilita testes unitários com mocks e troca de providers de notificação.

Ver diagrama em [`docs/modelagem.md`](modelagem.md).

### Como garantem segurança?

- Autenticação JWT com refresh token
- RBAC (`ensureRole`) e isolamento por clínica (`ensureClinic`)
- Senhas com bcrypt
- Validação de entrada com Zod (backend) e react-hook-form + Zod (frontend)
- Helmet para headers HTTP seguros
- Upload com filtro de MIME type no multer

### Quais tipos de teste existem?

**Pirâmide de testes:**

1. **Unitários** — regras puras (`availability`, `canCancel`, `calculateCommission`, `PatientsService`)
2. **Integração HTTP** — Supertest com mocks Prisma (`patients.int.spec.ts`, `appointments.int.spec.ts`)
3. **E2E** — Cypress (`happy-path`, `marketplace`, `patient-portal`)

O CRUD de Pacientes cobre unitário + integração em todas as operações (list, get, create, update, delete).

### Como funciona a observabilidade?

Logger **Pino** estruturado:

- Middleware `requestLogger` registra cada requisição (método, rota, status, tempo)
- `PatientsService` loga operações de create/update/delete com `clinicId` e `patientId`
- `errorHandler` loga erros 500 com stack trace
- Nível configurável via `LOG_LEVEL` (debug, info, warn, error)

### Validação e máscaras de CPF/CNPJ

- Algoritmo de dígitos verificadores em `brDocuments.ts` (backend e frontend)
- Zod reutilizável: `zCpf()`, `zCnpj()`, `zPhone()`, `zCep()`
- Componente `MaskedInput` formata CPF, CNPJ, telefone, CEP e data (DD/MM/AAAA) durante a digitação
- Backend recebe apenas dígitos (normalização antes de persistir)

### O problema foi resolvido?

Sim. O CronoCita automatiza:

- Agendamento online com verificação de conflitos
- Lembretes WhatsApp (Evolution API) e notificações in-app
- Gestão multi-clínica com comissões automáticas
- Marketplace para descoberta de clínicas
- Portais dedicados para paciente, profissional e administrador

---

## 3. Credenciais de demonstração

| Perfil | E-mail | Senha | Rota |
|---|---|---|---|
| Super Admin | super@cronocita.com | 123456 | `/admin` |
| Admin Clínica | admin@viverbem.com | 123456 | `/painel` |
| Profissional | ana@viverbem.com | 123456 | `/profissional` |
| Paciente | joao@cliente.com | 123456 | `/minha-conta` |

---

## 4. Comandos úteis durante a apresentação

```bash
docker compose up -d --build    # subir tudo
cd backend && npm test          # mostrar testes passando
cd backend && LOG_LEVEL=debug npm run dev   # logs detalhados
```

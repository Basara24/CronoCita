# Checklist — Rubrica de Avaliação

Referência rápida para correção acadêmica. Cada item aponta para a evidência no repositório.

---

## Qualidade de Software e Observabilidade (4,00 pts)

### 2 tipos de teste em CRUD completo (2,00)

| Tipo | Arquivo | Comando |
|---|---|---|
| **Unitário** | [`backend/src/modules/patients/__tests__/patients.service.spec.ts`](../backend/src/modules/patients/__tests__/patients.service.spec.ts) | `cd backend && npm test` |
| **Integração (HTTP)** | [`backend/src/modules/patients/__tests__/patients.int.spec.ts`](../backend/src/modules/patients/__tests__/patients.int.spec.ts) | idem |
| **E2E (Cypress)** | [`frontend/cypress/e2e/`](../frontend/cypress/e2e/) | `cd frontend && npm run cy:run` |

CRUD coberto: `GET`, `GET/:id`, `POST`, `PUT/:id`, `DELETE` em [`patients.routes.ts`](../backend/src/modules/patients/patients.routes.ts).

### Logger em execução (2,00)

| Evidência | Arquivo |
|---|---|
| Logger Pino (singleton) | [`backend/src/shared/logger/logger.ts`](../backend/src/shared/logger/logger.ts) |
| Log por requisição HTTP | [`backend/src/shared/middleware/requestLogger.ts`](../backend/src/shared/middleware/requestLogger.ts) |
| Log de negócio (create/update/delete paciente) | [`backend/src/modules/patients/patients.service.ts`](../backend/src/modules/patients/patients.service.ts) |
| Log de erros 500 | [`backend/src/shared/middleware/errorHandler.ts`](../backend/src/shared/middleware/errorHandler.ts) |
| Variável de configuração | `LOG_LEVEL` em [`backend/.env.example`](../backend/.env.example) |

---

## Prática em Desenvolvimento de Software II (6,00 pts)

### Modelagem — DER e Diagrama de Classes (1,00)

- [`docs/modelagem.md`](modelagem.md) — DER Mermaid + Diagrama de Classes do módulo Pacientes

### Segurança (1,00)

| Mecanismo | Arquivo |
|---|---|
| JWT + refresh token | [`backend/src/shared/middleware/ensureAuthenticated.ts`](../backend/src/shared/middleware/ensureAuthenticated.ts) |
| RBAC por role | [`backend/src/shared/middleware/ensureRole.ts`](../backend/src/shared/middleware/ensureRole.ts) |
| Multi-tenancy (`clinicId`) | [`backend/src/shared/middleware/ensureClinic.ts`](../backend/src/shared/middleware/ensureClinic.ts) |
| Senhas bcrypt | [`backend/src/modules/auth/auth.service.ts`](../backend/src/modules/auth/auth.service.ts) |
| Validação Zod | validators em cada módulo |
| Headers HTTP (Helmet) | [`backend/src/app.ts`](../backend/src/app.ts) |

### Apresentação do Produto (1,00)

- Roteiro de demo: [`docs/APRESENTACAO-BANCA.md`](APRESENTACAO-BANCA.md)
- URLs: Home `http://localhost:5173`, API `http://localhost:3333/api`

### Funcionalidade (2,00)

- Marketplace público + agendamento online
- Portal paciente, profissional, clínica e super admin
- Chat Socket.IO, notificações WhatsApp (Evolution API), comissões, KPIs

### Experiência do Usuário (1,00)

- Dark mode: [`frontend/src/lib/theme.tsx`](../frontend/src/lib/theme.tsx)
- Toasts: [`frontend/src/components/ui/toast.tsx`](../frontend/src/components/ui/toast.tsx)
- Skeleton: [`frontend/src/components/ui/skeleton.tsx`](../frontend/src/components/ui/skeleton.tsx)
- Máscaras de input: [`frontend/src/components/ui/masked-input.tsx`](../frontend/src/components/ui/masked-input.tsx)

### Justificativa Técnica (1,00)

- Respostas-modelo para banca: [`docs/APRESENTACAO-BANCA.md`](APRESENTACAO-BANCA.md)

---

## Tech Forge (4,00 pts)

### 2 princípios SOLID (2,00)

Documentados em [`docs/modelagem.md`](modelagem.md):

- **SRP** — camadas separadas (Controller / Service / Repository)
- **DIP** — `IPatientsRepository`, `NotificationProvider`

### Validação CPF, CNPJ, e-mail, campos em branco (1,00)

| Camada | Arquivo |
|---|---|
| Backend — algoritmos | [`backend/src/shared/validators/brDocuments.ts`](../backend/src/shared/validators/brDocuments.ts) |
| Backend — Zod | [`backend/src/shared/validators/zodBr.ts`](../backend/src/shared/validators/zodBr.ts) |
| Aplicado em | `patients.validators.ts`, `auth.validators.ts`, `clinics.validators.ts`, `appointments.validators.ts` |
| Frontend — espelho | [`frontend/src/lib/validators/brDocuments.ts`](../frontend/src/lib/validators/brDocuments.ts) |

### Máscaras CPF, Telefone, Data, CNPJ, CEP (1,00)

| Componente | Arquivo |
|---|---|
| Formatadores | [`frontend/src/lib/masks.ts`](../frontend/src/lib/masks.ts) |
| Componente UI | [`frontend/src/components/ui/masked-input.tsx`](../frontend/src/components/ui/masked-input.tsx) |
| Formulários | `Register.tsx`, `Patients.tsx`, `Booking.tsx`, `Clinics.tsx`, `Settings.tsx`, `Profile.tsx` |

---

## Comandos de verificação

```bash
# Testes backend (inclui CRUD Pacientes)
cd backend && npm test

# Build frontend (TypeScript + Vite)
cd frontend && npm run build

# E2E (com app rodando)
cd frontend && npm run cy:run
```

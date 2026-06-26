# Modelagem — CronoCita

Documentação acadêmica de modelagem de dados e arquitetura de classes do sistema.

Schema completo: [`backend/prisma/schema.prisma`](../backend/prisma/schema.prisma)

---

## DER — Diagrama Entidade-Relacionamento

```mermaid
erDiagram
  Clinic ||--o{ User : possui
  Clinic ||--o{ Patient : possui
  Clinic ||--o{ Professional : possui
  Clinic ||--o{ Service : possui
  Clinic ||--o{ Room : possui
  Clinic ||--o{ Equipment : possui
  Clinic ||--o{ Appointment : possui
  Clinic ||--o{ ClinicPhoto : possui
  Clinic ||--o{ Favorite : recebe
  Clinic ||--o| Subscription : tem
  Clinic ||--o{ ClinicSpecialty : tem

  User ||--o{ Favorite : cria
  User ||--o{ Message : envia
  User ||--o{ UserNotification : recebe
  User ||--o| Patient : vincula

  Patient ||--o{ Appointment : agenda
  Professional ||--o{ Appointment : atende
  Professional ||--o{ Service : oferece
  Professional ||--o{ ScheduleBlock : bloqueia
  Service ||--o{ Appointment : utiliza
  Room ||--o{ Appointment : aloca
  Equipment ||--o{ Appointment : aloca

  Appointment ||--o| Commission : gera

  Contact {
    uuid id PK
    string name
    string email
    string subject
    text message
    enum status
  }

  Favorite {
    uuid id PK
    uuid userId FK
    uuid clinicId FK
  }

  ScheduleBlock {
    uuid id PK
    uuid professionalId FK
    datetime startsAt
    datetime endsAt
  }
```

### Entidades principais

| Entidade | Descrição |
|---|---|
| **Clinic** | Clínica multi-tenant (CNPJ, endereço, rating, identidade visual) |
| **User** | Conta global com role (SUPER_ADMIN, CLINIC_ADMIN, PROFESSIONAL, PATIENT) |
| **Patient** | Prontuário do paciente por clínica (CPF único por clínica) |
| **Professional** | Profissional vinculado a uma clínica |
| **Appointment** | Agendamento com status, sala, equipamento e avaliação |
| **Service** | Serviço oferecido (duração, preço, profissional opcional) |
| **Favorite** | Clínica favoritada por um paciente |
| **Contact** | Mensagem do formulário Fale Conosco |
| **ScheduleBlock** | Bloqueio de horário na agenda do profissional |

---

## Diagrama de Classes — Módulo Pacientes (SOLID)

Exemplo de **SRP** (cada camada uma responsabilidade) e **DIP** (service depende de interface, não de Prisma).

```mermaid
classDiagram
  class PatientsController {
    +list(req, res)
    +getById(req, res)
    +create(req, res)
    +update(req, res)
    +delete(req, res)
  }

  class PatientsService {
    -repository IPatientsRepository
    +list(clinicId, search)
    +getById(clinicId, id)
    +create(clinicId, data)
    +update(clinicId, id, data)
    +delete(clinicId, id)
  }

  class IPatientsRepository {
    <<interface>>
    +findAll(clinicId, search)
    +findById(clinicId, id)
    +findByCpf(clinicId, cpf)
    +create(clinicId, data)
    +update(id, data)
    +delete(id)
  }

  class PatientsRepository {
    +findAll(clinicId, search)
    +findById(clinicId, id)
    +create(clinicId, data)
    +update(id, data)
    +delete(id)
  }

  class createPatientSchema {
    <<validator>>
    +zCpf()
    +zPhone()
    +email()
  }

  PatientsController --> PatientsService : delega
  PatientsService --> IPatientsRepository : DIP
  PatientsRepository ..|> IPatientsRepository : implementa
  PatientsController ..> createPatientSchema : valida via middleware
```

### Princípios SOLID aplicados

| Princípio | Onde | Evidência |
|---|---|---|
| **S — Single Responsibility** | Camadas Routes → Controller → Service → Repository | Cada classe tem uma única razão para mudar |
| **D — Dependency Inversion** | `IPatientsRepository`, `IServicesRepository`, `NotificationProvider` | Services recebem interfaces via construtor |
| **O — Open/Closed** | `NotificationProvider` | Novos providers (Evolution, Twilio) sem alterar regra de negócio |

---

## Fluxo CRUD Pacientes (referência para testes)

```mermaid
sequenceDiagram
  participant Client
  participant Routes as patientsRoutes
  participant Controller as PatientsController
  participant Service as PatientsService
  participant Repo as PatientsRepository
  participant DB as MySQL

  Client->>Routes: POST /api/patients
  Routes->>Controller: create
  Controller->>Service: create(clinicId, dto)
  Service->>Repo: findByCpf / findByEmail
  Service->>Repo: create
  Repo->>DB: INSERT
  Service-->>Client: 201 Created
```

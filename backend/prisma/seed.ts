/* eslint-disable no-console */
import {
  PrismaClient,
  AppointmentStatus,
  SubscriptionPlan,
} from '@prisma/client';
import bcrypt from 'bcryptjs';

const prisma = new PrismaClient();

function at(daysFromToday: number, hour: number, minute = 0): Date {
  const d = new Date();
  d.setDate(d.getDate() + daysFromToday);
  d.setHours(hour, minute, 0, 0);
  return d;
}

function addMinutes(date: Date, minutes: number): Date {
  return new Date(date.getTime() + minutes * 60_000);
}

interface SeedProfessional {
  name: string;
  specialty: string;
  commissionPercentage: number;
  email: string;
}

interface SeedService {
  name: string;
  durationMinutes: number;
  price: number;
  requiresRoom: boolean;
  equipmentIndexes: number[];
}

interface SeedClinic {
  name: string;
  slug: string;
  cnpj: string;
  email: string;
  phone: string;
  description: string;
  logoUrl: string;
  address: string;
  city: string;
  state: string;
  zipCode: string;
  plan: SubscriptionPlan;
  price: number;
  specialties: string[];
  adminName: string;
  adminEmail: string;
  professionals: SeedProfessional[];
  rooms: { name: string; description: string; capacity: number }[];
  equipments: { name: string; description: string }[];
  services: SeedService[];
  patients: { name: string; cpf: string; email: string; phone: string; birthDate: Date }[];
}

const PASSWORD = '123456';

const CLINICS: SeedClinic[] = [
  {
    name: 'Clínica Viver Bem',
    slug: 'clinica-viver-bem',
    cnpj: '11.111.111/0001-11',
    email: 'contato@viverbem.com',
    phone: '(44) 3333-0001',
    description:
      'Clínica multidisciplinar focada em reabilitação, nutrição e bem-estar, com atendimento humanizado em Campo Mourão.',
    logoUrl: 'https://api.dicebear.com/7.x/initials/svg?seed=Viver%20Bem&backgroundColor=1d6fc0',
    address: 'Rua das Acácias, 100',
    city: 'Campo Mourão',
    state: 'PR',
    zipCode: '87300-000',
    plan: 'PRO',
    price: 299.9,
    specialties: ['Fisioterapia', 'Nutrição', 'Estética'],
    adminName: 'Marina Admin',
    adminEmail: 'admin@viverbem.com',
    professionals: [
      { name: 'Dra. Ana Souza', specialty: 'Fisioterapia', commissionPercentage: 70, email: 'ana@viverbem.com' },
      { name: 'Dr. Bruno Lima', specialty: 'Nutrição', commissionPercentage: 65, email: 'bruno@viverbem.com' },
      { name: 'Dra. Carla Mendes', specialty: 'Estética', commissionPercentage: 60, email: 'carla@viverbem.com' },
    ],
    rooms: [
      { name: 'Sala 1 - Fisioterapia', description: 'Sala equipada para fisioterapia', capacity: 2 },
      { name: 'Sala 2 - Consultório', description: 'Consultório para consultas clínicas', capacity: 3 },
    ],
    equipments: [
      { name: 'Ultrassom Terapêutico', description: 'Equipamento de ultrassom para fisioterapia' },
      { name: 'Laser Estético', description: 'Laser para procedimentos estéticos' },
    ],
    services: [
      { name: 'Sessão de Fisioterapia', durationMinutes: 60, price: 200, requiresRoom: true, equipmentIndexes: [0] },
      { name: 'Consulta de Nutrição', durationMinutes: 45, price: 180, requiresRoom: true, equipmentIndexes: [] },
      { name: 'Limpeza de Pele a Laser', durationMinutes: 90, price: 350, requiresRoom: true, equipmentIndexes: [1] },
    ],
    patients: [
      { name: 'João Pereira', cpf: '111.111.111-11', email: 'joao@email.com', phone: '(44) 97777-0001', birthDate: new Date('1990-03-15') },
      { name: 'Maria Oliveira', cpf: '222.222.222-22', email: 'maria@email.com', phone: '(44) 97777-0002', birthDate: new Date('1985-07-22') },
      { name: 'Pedro Santos', cpf: '333.333.333-33', email: 'pedro@email.com', phone: '(44) 97777-0003', birthDate: new Date('1978-11-02') },
      { name: 'Lucia Costa', cpf: '444.444.444-44', email: 'lucia@email.com', phone: '(44) 97777-0004', birthDate: new Date('1995-01-30') },
      { name: 'Fernanda Alves', cpf: '555.555.555-55', email: 'fernanda@email.com', phone: '(44) 97777-0005', birthDate: new Date('2000-09-10') },
    ],
  },
  {
    name: 'Espaço Saúde Integrada',
    slug: 'espaco-saude-integrada',
    cnpj: '22.222.222/0001-22',
    email: 'contato@espacosaude.com',
    phone: '(44) 3333-0002',
    description:
      'Centro de saúde integrada com psicologia, cardiologia e odontologia, oferecendo cuidado completo em Maringá.',
    logoUrl: 'https://api.dicebear.com/7.x/initials/svg?seed=Espaco%20Saude&backgroundColor=2fb88a',
    address: 'Avenida Brasil, 1500',
    city: 'Maringá',
    state: 'PR',
    zipCode: '87010-000',
    plan: 'ENTERPRISE',
    price: 599.9,
    specialties: ['Psicologia', 'Cardiologia', 'Odontologia'],
    adminName: 'Roberto Admin',
    adminEmail: 'admin@espacosaude.com',
    professionals: [
      { name: 'Dra. Helena Dias', specialty: 'Psicologia', commissionPercentage: 75, email: 'helena@espacosaude.com' },
      { name: 'Dr. Marcos Reis', specialty: 'Cardiologia', commissionPercentage: 70, email: 'marcos@espacosaude.com' },
      { name: 'Dra. Paula Nunes', specialty: 'Odontologia', commissionPercentage: 65, email: 'paula@espacosaude.com' },
    ],
    rooms: [
      { name: 'Consultório A', description: 'Consultório de psicologia', capacity: 2 },
      { name: 'Consultório B', description: 'Consultório cardiológico', capacity: 2 },
      { name: 'Sala Odontológica', description: 'Sala equipada para odontologia', capacity: 1 },
    ],
    equipments: [
      { name: 'Eletrocardiógrafo', description: 'Equipamento para exames cardíacos' },
      { name: 'Cadeira Odontológica', description: 'Cadeira completa para procedimentos' },
    ],
    services: [
      { name: 'Sessão de Psicologia', durationMinutes: 50, price: 220, requiresRoom: true, equipmentIndexes: [] },
      { name: 'Consulta Cardiológica', durationMinutes: 40, price: 300, requiresRoom: true, equipmentIndexes: [0] },
      { name: 'Avaliação Odontológica', durationMinutes: 45, price: 160, requiresRoom: true, equipmentIndexes: [1] },
    ],
    patients: [
      { name: 'Carlos Eduardo', cpf: '666.666.666-66', email: 'carlos@email.com', phone: '(44) 96666-0001', birthDate: new Date('1982-05-12') },
      { name: 'Beatriz Rocha', cpf: '777.777.777-77', email: 'beatriz@email.com', phone: '(44) 96666-0002', birthDate: new Date('1991-08-19') },
      { name: 'Rafael Gomes', cpf: '888.888.888-88', email: 'rafael@email.com', phone: '(44) 96666-0003', birthDate: new Date('1975-12-25') },
      { name: 'Juliana Martins', cpf: '999.999.999-99', email: 'juliana@email.com', phone: '(44) 96666-0004', birthDate: new Date('1998-02-08') },
    ],
  },
  {
    name: 'Vida Plena Clínica',
    slug: 'vida-plena-clinica',
    cnpj: '33.333.333/0001-33',
    email: 'contato@vidaplena.com',
    phone: '(41) 3333-0003',
    description:
      'Clínica dedicada à saúde da pele e qualidade de vida, com dermatologia, nutrição e estética avançada em Curitiba.',
    logoUrl: 'https://api.dicebear.com/7.x/initials/svg?seed=Vida%20Plena&backgroundColor=7c5cd6',
    address: 'Rua XV de Novembro, 800',
    city: 'Curitiba',
    state: 'PR',
    zipCode: '80020-000',
    plan: 'BASIC',
    price: 149.9,
    specialties: ['Dermatologia', 'Nutrição', 'Estética'],
    adminName: 'Sofia Admin',
    adminEmail: 'admin@vidaplena.com',
    professionals: [
      { name: 'Dra. Renata Castro', specialty: 'Dermatologia', commissionPercentage: 70, email: 'renata@vidaplena.com' },
      { name: 'Dr. Tiago Moraes', specialty: 'Nutrição', commissionPercentage: 60, email: 'tiago@vidaplena.com' },
    ],
    rooms: [{ name: 'Sala Dermatológica', description: 'Sala para procedimentos dermatológicos', capacity: 1 }],
    equipments: [{ name: 'Dermatoscópio Digital', description: 'Equipamento para análise de pele' }],
    services: [
      { name: 'Consulta Dermatológica', durationMinutes: 40, price: 280, requiresRoom: true, equipmentIndexes: [0] },
      { name: 'Acompanhamento Nutricional', durationMinutes: 45, price: 190, requiresRoom: true, equipmentIndexes: [] },
    ],
    patients: [
      { name: 'André Lopes', cpf: '101.101.101-01', email: 'andre@email.com', phone: '(41) 95555-0001', birthDate: new Date('1988-04-04') },
      { name: 'Camila Ferreira', cpf: '202.202.202-02', email: 'camila@email.com', phone: '(41) 95555-0002', birthDate: new Date('1993-10-17') },
      { name: 'Diego Almeida', cpf: '303.303.303-03', email: 'diego@email.com', phone: '(41) 95555-0003', birthDate: new Date('1980-06-29') },
    ],
  },
];

async function clearDatabase(): Promise<void> {
  await prisma.message.deleteMany();
  await prisma.userNotification.deleteMany();
  await prisma.notification.deleteMany();
  await prisma.commission.deleteMany();
  await prisma.appointment.deleteMany();
  await prisma.serviceEquipment.deleteMany();
  await prisma.service.deleteMany();
  await prisma.equipment.deleteMany();
  await prisma.room.deleteMany();
  await prisma.patient.deleteMany();
  await prisma.professional.deleteMany();
  await prisma.refreshToken.deleteMany();
  await prisma.passwordResetToken.deleteMany();
  await prisma.subscription.deleteMany();
  await prisma.clinicSpecialty.deleteMany();
  await prisma.user.deleteMany();
  await prisma.clinic.deleteMany();
}

async function seedClinic(data: SeedClinic, password: string): Promise<void> {
  const clinic = await prisma.clinic.create({
    data: {
      name: data.name,
      slug: data.slug,
      cnpj: data.cnpj,
      email: data.email,
      phone: data.phone,
      description: data.description,
      logoUrl: data.logoUrl,
      address: data.address,
      city: data.city,
      state: data.state,
      zipCode: data.zipCode,
      status: 'ACTIVE',
      specialties: { create: data.specialties.map((specialty) => ({ specialty })) },
      subscription: {
        create: { plan: data.plan, status: 'ACTIVE', price: data.price, startsAt: at(-30, 9) },
      },
    },
  });

  // Admin da clínica
  await prisma.user.create({
    data: {
      name: data.adminName,
      email: data.adminEmail,
      password,
      role: 'CLINIC_ADMIN',
      clinicId: clinic.id,
    },
  });

  // Profissionais (com usuário vinculado)
  const professionals = [];
  for (const p of data.professionals) {
    const professionalUser = await prisma.user.create({
      data: { name: p.name, email: p.email, password, role: 'PROFESSIONAL', clinicId: clinic.id },
    });
    const created = await prisma.professional.create({
      data: {
        clinicId: clinic.id,
        name: p.name,
        specialty: p.specialty,
        commissionPercentage: p.commissionPercentage,
        phone: '(00) 90000-0000',
        email: p.email,
        userId: professionalUser.id,
      },
    });
    professionals.push(created);
  }

  // Salas
  const rooms = [];
  for (const r of data.rooms) {
    rooms.push(
      await prisma.room.create({
        data: { clinicId: clinic.id, name: r.name, description: r.description, capacity: r.capacity, status: 'ACTIVE' },
      }),
    );
  }

  // Equipamentos
  const equipments = [];
  for (const e of data.equipments) {
    equipments.push(
      await prisma.equipment.create({
        data: { clinicId: clinic.id, name: e.name, description: e.description, status: 'ACTIVE' },
      }),
    );
  }

  // Serviços
  const services = [];
  for (const s of data.services) {
    services.push(
      await prisma.service.create({
        data: {
          clinicId: clinic.id,
          name: s.name,
          durationMinutes: s.durationMinutes,
          price: s.price,
          requiresRoom: s.requiresRoom,
          equipments: { create: s.equipmentIndexes.map((i) => ({ equipmentId: equipments[i].id })) },
        },
      }),
    );
  }

  // Pacientes
  const patients = [];
  for (const p of data.patients) {
    patients.push(
      await prisma.patient.create({
        data: {
          clinicId: clinic.id,
          name: p.name,
          cpf: p.cpf,
          email: p.email,
          phone: p.phone,
          birthDate: p.birthDate,
          address: 'Rua Principal, 123',
          city: data.city,
          state: data.state,
          zipCode: data.zipCode,
        },
      }),
    );
  }

  // Agendamentos variados (passado finalizado/no-show/cancelado + futuro)
  const plan: {
    patientIdx: number;
    profIdx: number;
    svcIdx: number;
    day: number;
    hour: number;
    status: AppointmentStatus;
    rating?: number;
  }[] = [
    { patientIdx: 0, profIdx: 0, svcIdx: 0, day: -7, hour: 9, status: 'FINISHED', rating: 5 },
    { patientIdx: 1, profIdx: 0, svcIdx: 0, day: -7, hour: 11, status: 'FINISHED', rating: 4 },
    { patientIdx: 2, profIdx: 1, svcIdx: 1, day: -6, hour: 10, status: 'FINISHED', rating: 5 },
    { patientIdx: 0, profIdx: 1, svcIdx: 1, day: -4, hour: 9, status: 'NO_SHOW' },
    { patientIdx: 1, profIdx: 0, svcIdx: 0, day: -3, hour: 15, status: 'CANCELED' },
    { patientIdx: 2, profIdx: 0, svcIdx: 0, day: -2, hour: 16, status: 'FINISHED', rating: 4 },
    { patientIdx: 0, profIdx: 0, svcIdx: 0, day: 1, hour: 9, status: 'SCHEDULED' },
    { patientIdx: 1, profIdx: 0, svcIdx: 0, day: 1, hour: 10, status: 'CONFIRMED' },
    { patientIdx: 2, profIdx: 1, svcIdx: 1, day: 2, hour: 14, status: 'SCHEDULED' },
    { patientIdx: 0, profIdx: 1, svcIdx: 1, day: 3, hour: 11, status: 'SCHEDULED' },
  ];

  for (const a of plan) {
    const professional = professionals[a.profIdx];
    const service = services[a.svcIdx];
    if (!professional || !service) continue;

    const startsAt = at(a.day, a.hour);
    const endsAt = addMinutes(startsAt, service.durationMinutes);
    const room = rooms.length > 0 ? rooms[a.svcIdx % rooms.length] : null;

    const appointment = await prisma.appointment.create({
      data: {
        clinicId: clinic.id,
        patientId: patients[a.patientIdx % patients.length].id,
        professionalId: professional.id,
        serviceId: service.id,
        roomId: room?.id ?? null,
        startsAt,
        endsAt,
        status: a.status,
        rating: a.rating ?? null,
        createdAt: addMinutes(startsAt, -60 * 24 * 2),
      },
    });

    if (a.status === 'FINISHED') {
      const price = Number(service.price);
      const percentage = Number(professional.commissionPercentage);
      const professionalValue = Number(((price * percentage) / 100).toFixed(2));
      const clinicValue = Number((price - professionalValue).toFixed(2));
      await prisma.commission.create({
        data: {
          clinicId: clinic.id,
          appointmentId: appointment.id,
          professionalId: professional.id,
          totalValue: price,
          percentage,
          professionalValue,
          clinicValue,
        },
      });
    }
  }

  console.log(`  ✓ ${data.name} (${data.slug}) — admin: ${data.adminEmail}`);
}

/**
 * Cria contas de paciente (User role=PATIENT) vinculadas aos Patient por CPF.
 * João existe em duas clínicas (mesmo CPF) para demonstrar a agregação cross-clínica
 * do Portal do Paciente, além de notificações e um thread de chat com a profissional.
 */
async function seedPatientPortal(password: string): Promise<void> {
  const joao = await prisma.user.create({
    data: {
      name: 'João Pereira',
      email: 'joao@cliente.com',
      cpf: '111.111.111-11',
      phone: '(44) 97777-0001',
      password,
      role: 'PATIENT',
    },
  });

  const maria = await prisma.user.create({
    data: {
      name: 'Maria Oliveira',
      email: 'maria@cliente.com',
      cpf: '222.222.222-22',
      phone: '(44) 97777-0002',
      password,
      role: 'PATIENT',
    },
  });

  // Auto-link dos Patient existentes (por CPF) às novas contas globais
  await prisma.patient.updateMany({ where: { cpf: joao.cpf! }, data: { userId: joao.id } });
  await prisma.patient.updateMany({ where: { cpf: maria.cpf! }, data: { userId: maria.id } });

  // João também é paciente do Espaço Saúde Integrada (cross-clínica)
  const espaco = await prisma.clinic.findUnique({ where: { slug: 'espaco-saude-integrada' } });
  if (espaco) {
    const joaoEspaco = await prisma.patient.create({
      data: {
        clinicId: espaco.id,
        name: joao.name,
        cpf: joao.cpf!,
        email: 'joao.pereira@email.com',
        phone: joao.phone!,
        birthDate: new Date('1990-03-15'),
        userId: joao.id,
      },
    });

    const psicologo = await prisma.professional.findFirst({ where: { clinicId: espaco.id, specialty: 'Psicologia' } });
    const sessao = await prisma.service.findFirst({ where: { clinicId: espaco.id, name: { contains: 'Psicologia' } } });
    const salaEspaco = await prisma.room.findFirst({ where: { clinicId: espaco.id } });
    if (psicologo && sessao) {
      // Consulta finalizada (entra no histórico) + consulta futura (agendamentos ativos)
      const past = at(-10, 14);
      await prisma.appointment.create({
        data: {
          clinicId: espaco.id,
          patientId: joaoEspaco.id,
          professionalId: psicologo.id,
          serviceId: sessao.id,
          roomId: salaEspaco?.id ?? null,
          startsAt: past,
          endsAt: addMinutes(past, sessao.durationMinutes),
          status: 'FINISHED',
          rating: 5,
        },
      });
      const future = at(5, 16);
      await prisma.appointment.create({
        data: {
          clinicId: espaco.id,
          patientId: joaoEspaco.id,
          professionalId: psicologo.id,
          serviceId: sessao.id,
          roomId: salaEspaco?.id ?? null,
          startsAt: future,
          endsAt: addMinutes(future, sessao.durationMinutes),
          status: 'CONFIRMED',
        },
      });
    }
  }

  // Notificações in-app para João
  await prisma.userNotification.createMany({
    data: [
      {
        userId: joao.id,
        title: 'Lembrete de consulta',
        message: '📅 Sua consulta de Fisioterapia está marcada para amanhã às 09h.',
        type: 'REMINDER',
      },
      {
        userId: joao.id,
        title: 'Mensagem do profissional',
        message: '💬 Dra. Ana Souza enviou uma mensagem.',
        type: 'CHAT',
      },
      {
        userId: joao.id,
        title: 'Promoção da clínica',
        message: '🎁 Pacote de fisioterapia com desconto disponível na Clínica Viver Bem.',
        type: 'PROMOTION',
        isRead: true,
      },
    ],
  });

  // Thread de chat entre João e a profissional Ana (Viver Bem)
  const ana = await prisma.professional.findFirst({ where: { email: 'ana@viverbem.com' } });
  if (ana?.userId) {
    await prisma.message.create({
      data: {
        senderId: ana.userId,
        receiverId: joao.id,
        content: 'Olá João! Lembre-se de trazer seus exames para nossa consulta.',
        createdAt: at(-1, 10),
      },
    });
    await prisma.message.create({
      data: {
        senderId: joao.id,
        receiverId: ana.userId,
        content: 'Certo, doutora. Levarei todos os exames.',
        createdAt: at(-1, 11),
        readAt: at(-1, 12),
      },
    });
  }

  console.log('  ✓ Pacientes demo: joao@cliente.com, maria@cliente.com');
}

async function main() {
  console.log('🌱 Iniciando seed do CronoCita (marketplace multi-tenant)...');

  // Idempotência: se o banco já tem dados, preserva o que foi criado pelos usuários
  // e não reaplica o seed. Use FORCE_SEED=true para forçar o reset ao estado demo.
  const forceSeed = process.env.FORCE_SEED === 'true';
  const existingClinics = await prisma.clinic.count();
  if (existingClinics > 0 && !forceSeed) {
    console.log(
      `ℹ️  Banco já populado (${existingClinics} clínica(s)). Seed ignorado para preservar os dados existentes.`,
    );
    console.log('   Defina FORCE_SEED=true para recriar os dados de demonstração.');
    return;
  }

  await clearDatabase();

  const password = await bcrypt.hash(PASSWORD, 10);

  // SUPER ADMIN global (sem clínica)
  await prisma.user.create({
    data: { name: 'Super Admin', email: 'super@cronocita.com', password, role: 'SUPER_ADMIN', clinicId: null },
  });

  console.log('Criando clínicas de demonstração:');
  for (const clinic of CLINICS) {
    await seedClinic(clinic, password);
  }

  await seedPatientPortal(password);

  console.log('✅ Seed concluído com sucesso!');
  console.log('---------------------------------------------');
  console.log(`Credenciais de demonstração (senha: ${PASSWORD}):`);
  console.log('  SUPER ADMIN:    super@cronocita.com');
  console.log('  ADMIN CLÍNICA:  admin@viverbem.com');
  console.log('  PROFISSIONAL:   ana@viverbem.com');
  console.log('  ADMIN CLÍNICA:  admin@espacosaude.com');
  console.log('  PACIENTE:       joao@cliente.com');
  console.log('---------------------------------------------');
}

main()
  .catch((e) => {
    console.error(e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });

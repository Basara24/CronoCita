/* eslint-disable no-console */
import { PrismaClient, AppointmentStatus } from '@prisma/client';
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

async function main() {
  console.log('🌱 Iniciando seed do CronoCita...');

  // Limpeza (ordem respeita FKs)
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
  await prisma.user.deleteMany();

  const password = await bcrypt.hash('123456', 10);

  // ── Usuários ──────────────────────────────────────────────
  const admin = await prisma.user.create({
    data: { name: 'Administrador', email: 'admin@cronocita.com', password, role: 'ADMIN' },
  });
  await prisma.user.create({
    data: { name: 'Sandra Secretária', email: 'secretaria@cronocita.com', password, role: 'SECRETARY' },
  });

  // ── Profissionais ─────────────────────────────────────────
  const proFisio = await prisma.professional.create({
    data: {
      name: 'Dra. Ana Souza',
      specialty: 'Fisioterapia',
      commissionPercentage: 70,
      phone: '(11) 98888-0001',
      email: 'ana@cronocita.com',
      user: {
        create: { name: 'Dra. Ana Souza', email: 'ana@cronocita.com', password, role: 'PROFESSIONAL' },
      },
    },
  });
  const proNutri = await prisma.professional.create({
    data: {
      name: 'Dr. Bruno Lima',
      specialty: 'Nutrição',
      commissionPercentage: 65,
      phone: '(11) 98888-0002',
      email: 'bruno@cronocita.com',
      user: {
        create: { name: 'Dr. Bruno Lima', email: 'bruno@cronocita.com', password, role: 'PROFESSIONAL' },
      },
    },
  });
  const proEstetica = await prisma.professional.create({
    data: {
      name: 'Dra. Carla Mendes',
      specialty: 'Estética',
      commissionPercentage: 60,
      phone: '(11) 98888-0003',
      email: 'carla@cronocita.com',
      user: {
        create: { name: 'Dra. Carla Mendes', email: 'carla@cronocita.com', password, role: 'PROFESSIONAL' },
      },
    },
  });

  // ── Pacientes ─────────────────────────────────────────────
  const patientsData = [
    { name: 'João Pereira', cpf: '111.111.111-11', email: 'joao@email.com', phone: '(11) 97777-0001', birthDate: new Date('1990-03-15') },
    { name: 'Maria Oliveira', cpf: '222.222.222-22', email: 'maria@email.com', phone: '(11) 97777-0002', birthDate: new Date('1985-07-22') },
    { name: 'Pedro Santos', cpf: '333.333.333-33', email: 'pedro@email.com', phone: '(11) 97777-0003', birthDate: new Date('1978-11-02') },
    { name: 'Lucia Costa', cpf: '444.444.444-44', email: 'lucia@email.com', phone: '(11) 97777-0004', birthDate: new Date('1995-01-30') },
    { name: 'Fernanda Alves', cpf: '555.555.555-55', email: 'fernanda@email.com', phone: '(11) 97777-0005', birthDate: new Date('2000-09-10') },
  ];
  const patients = [] as { id: string; name: string }[];
  for (const p of patientsData) {
    const created = await prisma.patient.create({
      data: {
        ...p,
        address: 'Rua das Flores, 100',
        city: 'São Paulo',
        state: 'SP',
        zipCode: '01000-000',
      },
    });
    patients.push(created);
  }

  // Paciente com login no portal
  await prisma.patient.create({
    data: {
      name: 'Paulo Paciente',
      cpf: '666.666.666-66',
      email: 'paciente@cronocita.com',
      phone: '(11) 97777-0006',
      birthDate: new Date('1992-05-05'),
      address: 'Av. Central, 200',
      city: 'São Paulo',
      state: 'SP',
      zipCode: '02000-000',
      user: {
        create: { name: 'Paulo Paciente', email: 'paciente@cronocita.com', password, role: 'PATIENT' },
      },
    },
  });

  // ── Salas ─────────────────────────────────────────────────
  const room1 = await prisma.room.create({
    data: { name: 'Sala 1 - Fisioterapia', description: 'Sala equipada para fisioterapia', capacity: 2, status: 'ACTIVE' },
  });
  const room2 = await prisma.room.create({
    data: { name: 'Sala 2 - Consultório', description: 'Consultório para consultas clínicas', capacity: 3, status: 'ACTIVE' },
  });
  await prisma.room.create({
    data: { name: 'Sala 3 - Estética', description: 'Sala de procedimentos estéticos', capacity: 1, status: 'MAINTENANCE' },
  });

  // ── Equipamentos ──────────────────────────────────────────
  const eqUltrassom = await prisma.equipment.create({
    data: { name: 'Ultrassom Terapêutico', description: 'Equipamento de ultrassom para fisioterapia', status: 'ACTIVE' },
  });
  const eqLaser = await prisma.equipment.create({
    data: { name: 'Laser Estético', description: 'Laser para procedimentos estéticos', status: 'ACTIVE' },
  });
  await prisma.equipment.create({
    data: { name: 'Esteira Ergométrica', description: 'Esteira para avaliação física', status: 'INACTIVE' },
  });

  // ── Serviços ──────────────────────────────────────────────
  const svcFisio = await prisma.service.create({
    data: {
      name: 'Sessão de Fisioterapia',
      durationMinutes: 60,
      price: 200,
      requiresRoom: true,
      equipments: { create: [{ equipmentId: eqUltrassom.id }] },
    },
  });
  const svcNutri = await prisma.service.create({
    data: { name: 'Consulta de Nutrição', durationMinutes: 45, price: 180, requiresRoom: true },
  });
  const svcEstetica = await prisma.service.create({
    data: {
      name: 'Limpeza de Pele a Laser',
      durationMinutes: 90,
      price: 350,
      requiresRoom: true,
      equipments: { create: [{ equipmentId: eqLaser.id }] },
    },
  });

  // ── Agendamentos ──────────────────────────────────────────
  type Appt = {
    patientIdx: number;
    professionalId: string;
    serviceId: string;
    roomId: string | null;
    equipmentId: string | null;
    day: number;
    hour: number;
    duration: number;
    status: AppointmentStatus;
    rating?: number;
    price: number;
    percentage: number;
  };

  const appts: Appt[] = [
    // Passado: finalizados (geram comissão), no-show e cancelado
    { patientIdx: 0, professionalId: proFisio.id, serviceId: svcFisio.id, roomId: room1.id, equipmentId: eqUltrassom.id, day: -7, hour: 9, duration: 60, status: 'FINISHED', rating: 5, price: 200, percentage: 70 },
    { patientIdx: 1, professionalId: proFisio.id, serviceId: svcFisio.id, roomId: room1.id, equipmentId: eqUltrassom.id, day: -7, hour: 11, duration: 60, status: 'FINISHED', rating: 4, price: 200, percentage: 70 },
    { patientIdx: 2, professionalId: proNutri.id, serviceId: svcNutri.id, roomId: room2.id, equipmentId: null, day: -6, hour: 10, duration: 45, status: 'FINISHED', rating: 5, price: 180, percentage: 65 },
    { patientIdx: 3, professionalId: proEstetica.id, serviceId: svcEstetica.id, roomId: room2.id, equipmentId: eqLaser.id, day: -5, hour: 14, duration: 90, status: 'FINISHED', rating: 3, price: 350, percentage: 60 },
    { patientIdx: 4, professionalId: proFisio.id, serviceId: svcFisio.id, roomId: room1.id, equipmentId: eqUltrassom.id, day: -4, hour: 9, duration: 60, status: 'NO_SHOW', price: 200, percentage: 70 },
    { patientIdx: 0, professionalId: proNutri.id, serviceId: svcNutri.id, roomId: room2.id, equipmentId: null, day: -3, hour: 15, duration: 45, status: 'CANCELED', price: 180, percentage: 65 },
    { patientIdx: 1, professionalId: proEstetica.id, serviceId: svcEstetica.id, roomId: room2.id, equipmentId: eqLaser.id, day: -2, hour: 10, duration: 90, status: 'FINISHED', rating: 5, price: 350, percentage: 60 },
    { patientIdx: 2, professionalId: proFisio.id, serviceId: svcFisio.id, roomId: room1.id, equipmentId: eqUltrassom.id, day: -1, hour: 16, duration: 60, status: 'NO_SHOW', price: 200, percentage: 70 },
    // Futuro: agendados/confirmados
    { patientIdx: 0, professionalId: proFisio.id, serviceId: svcFisio.id, roomId: room1.id, equipmentId: eqUltrassom.id, day: 1, hour: 9, duration: 60, status: 'SCHEDULED', price: 200, percentage: 70 },
    { patientIdx: 1, professionalId: proFisio.id, serviceId: svcFisio.id, roomId: room1.id, equipmentId: eqUltrassom.id, day: 1, hour: 10, duration: 60, status: 'CONFIRMED', price: 200, percentage: 70 },
    { patientIdx: 2, professionalId: proNutri.id, serviceId: svcNutri.id, roomId: room2.id, equipmentId: null, day: 1, hour: 14, duration: 45, status: 'SCHEDULED', price: 180, percentage: 65 },
    { patientIdx: 3, professionalId: proEstetica.id, serviceId: svcEstetica.id, roomId: room2.id, equipmentId: eqLaser.id, day: 2, hour: 10, duration: 90, status: 'SCHEDULED', price: 350, percentage: 60 },
    { patientIdx: 4, professionalId: proNutri.id, serviceId: svcNutri.id, roomId: room2.id, equipmentId: null, day: 2, hour: 16, duration: 45, status: 'SCHEDULED', price: 180, percentage: 65 },
    { patientIdx: 3, professionalId: proFisio.id, serviceId: svcFisio.id, roomId: room1.id, equipmentId: eqUltrassom.id, day: 3, hour: 11, duration: 60, status: 'SCHEDULED', price: 200, percentage: 70 },
  ];

  for (const a of appts) {
    const startsAt = at(a.day, a.hour);
    const endsAt = addMinutes(startsAt, a.duration);
    const appointment = await prisma.appointment.create({
      data: {
        patientId: patients[a.patientIdx].id,
        professionalId: a.professionalId,
        serviceId: a.serviceId,
        roomId: a.roomId,
        equipmentId: a.equipmentId,
        startsAt,
        endsAt,
        status: a.status,
        rating: a.rating ?? null,
        createdAt: addMinutes(startsAt, -60 * 24 * 2), // agendado 2 dias antes (para KPI de lead time)
      },
    });

    if (a.status === 'FINISHED') {
      const professionalValue = Number(((a.price * a.percentage) / 100).toFixed(2));
      const clinicValue = Number((a.price - professionalValue).toFixed(2));
      await prisma.commission.create({
        data: {
          appointmentId: appointment.id,
          professionalId: a.professionalId,
          totalValue: a.price,
          percentage: a.percentage,
          professionalValue,
          clinicValue,
        },
      });
    }
  }

  console.log('✅ Seed concluído com sucesso!');
  console.log('---------------------------------------------');
  console.log('Credenciais de demonstração (senha: 123456):');
  console.log('  ADMIN:        admin@cronocita.com');
  console.log('  SECRETÁRIA:   secretaria@cronocita.com');
  console.log('  PROFISSIONAL: ana@cronocita.com');
  console.log('  PACIENTE:     paciente@cronocita.com');
  console.log('---------------------------------------------');
  void admin;
}

main()
  .catch((e) => {
    console.error(e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });

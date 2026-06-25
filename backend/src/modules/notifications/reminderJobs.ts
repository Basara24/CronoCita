/* eslint-disable no-console */
import cron from 'node-cron';
import { prisma } from '../../shared/database/prisma';
import { makeNotificationService } from '../../shared/notifications/NotificationService';
import { userNotificationService } from './userNotification.service';

const notificationService = makeNotificationService();

function addMinutes(date: Date, minutes: number): Date {
  return new Date(date.getTime() + minutes * 60_000);
}

/** Marcadores persistidos em UserNotification.title garantem idempotência entre execuções. */
const TAGS = {
  h24: 'Lembrete: consulta amanhã',
  h2: 'Lembrete: consulta em 2 horas',
  m30: 'Lembrete: consulta em breve',
  rate: 'Avalie seu atendimento',
} as const;

async function alreadySent(appointmentId: string, title: string): Promise<boolean> {
  const existing = await prisma.userNotification.findFirst({
    where: { appointmentId, type: 'REMINDER', title },
  });
  return existing !== null;
}

async function sendReminder(params: {
  userId: string;
  appointmentId: string;
  title: string;
  message: string;
  patientName: string;
  patientPhone: string;
  serviceName: string;
  startsAt: Date;
}): Promise<void> {
  if (await alreadySent(params.appointmentId, params.title)) return;

  await userNotificationService.create({
    userId: params.userId,
    title: params.title,
    message: params.message,
    type: 'REMINDER',
    appointmentId: params.appointmentId,
  });

  notificationService
    .notifyAppointmentReminder({
      appointmentId: params.appointmentId,
      patientName: params.patientName,
      patientPhone: params.patientPhone,
      serviceName: params.serviceName,
      startsAt: params.startsAt,
    })
    .catch((err) => console.error('Erro ao enviar lembrete WhatsApp:', err));
}

export async function runReminderSweep(): Promise<void> {
  const now = new Date();

  // Lembretes para consultas futuras (até 24h05 à frente) de pacientes com conta
  const upcoming = await prisma.appointment.findMany({
    where: {
      status: { in: ['SCHEDULED', 'CONFIRMED'] },
      startsAt: { gte: now, lte: addMinutes(now, 24 * 60 + 5) },
      patient: { userId: { not: null } },
    },
    include: { patient: true, service: true },
  });

  for (const a of upcoming) {
    const userId = a.patient.userId;
    if (!userId) continue;
    const minutesUntil = (a.startsAt.getTime() - now.getTime()) / 60_000;
    const base = {
      userId,
      appointmentId: a.id,
      patientName: a.patient.name,
      patientPhone: a.patient.phone,
      serviceName: a.service.name,
      startsAt: a.startsAt,
    };

    if (minutesUntil <= 24 * 60) {
      await sendReminder({ ...base, title: TAGS.h24, message: `📅 Sua consulta de ${a.service.name} ocorrerá amanhã.` });
    }
    if (minutesUntil <= 120) {
      await sendReminder({ ...base, title: TAGS.h2, message: `⏰ Sua consulta de ${a.service.name} ocorrerá em 2 horas.` });
    }
    if (minutesUntil <= 30) {
      await sendReminder({ ...base, title: TAGS.m30, message: `⏰ Sua consulta de ${a.service.name} começará em breve.` });
    }
  }

  // Pós-consulta: pedir avaliação (consultas finalizadas nas últimas 24h)
  const finished = await prisma.appointment.findMany({
    where: {
      status: 'FINISHED',
      startsAt: { gte: addMinutes(now, -24 * 60), lte: now },
      patient: { userId: { not: null } },
    },
    include: { patient: true, service: true },
  });

  for (const a of finished) {
    const userId = a.patient.userId;
    if (!userId) continue;
    if (await alreadySent(a.id, TAGS.rate)) continue;
    await userNotificationService.create({
      userId,
      title: TAGS.rate,
      message: `⭐ Como foi sua consulta de ${a.service.name}? Avalie seu atendimento.`,
      type: 'REMINDER',
      appointmentId: a.id,
    });
  }
}

/** Agenda a varredura a cada 5 minutos (e executa uma vez no boot). */
export function startReminderJobs(): void {
  cron.schedule('*/5 * * * *', () => {
    runReminderSweep().catch((err) => console.error('Erro no job de lembretes:', err));
  });
  runReminderSweep().catch((err) => console.error('Erro no job de lembretes (boot):', err));
  console.log('⏰ Jobs de lembrete agendados (a cada 5 min).');
}

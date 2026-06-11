import { NotificationChannel, NotificationEvent } from '@prisma/client';
import { prisma } from '../database/prisma';
import { NotificationProvider } from './NotificationProvider';
import { WhatsAppProvider } from './providers/WhatsAppProvider';
import { TwilioProvider } from './providers/TwilioProvider';
import { EvolutionProvider } from './providers/EvolutionProvider';

interface NotifyParams {
  appointmentId?: string;
  recipient: string;
  event: NotificationEvent;
  message: string;
  channel?: NotificationChannel;
}

export class NotificationService {
  constructor(private readonly provider: NotificationProvider) {}

  /**
   * Dispara a notificação pelo provider configurado e persiste o registro.
   * Falhas de envio não interrompem o fluxo de negócio.
   */
  async notify(params: NotifyParams): Promise<void> {
    const notification = await prisma.notification.create({
      data: {
        appointmentId: params.appointmentId ?? null,
        recipient: params.recipient,
        event: params.event,
        message: params.message,
        channel: params.channel ?? 'WHATSAPP',
      },
    });

    try {
      await this.provider.send(params.recipient, params.message);
      await prisma.notification.update({
        where: { id: notification.id },
        data: { status: 'SENT', sentAt: new Date() },
      });
    } catch (err) {
      console.error('Falha ao enviar notificação:', err);
      await prisma.notification.update({
        where: { id: notification.id },
        data: { status: 'FAILED' },
      });
    }
  }

  async notifyAppointmentCreated(input: {
    appointmentId: string;
    patientName: string;
    patientPhone: string;
    serviceName: string;
    startsAt: Date;
  }): Promise<void> {
    const when = input.startsAt.toLocaleString('pt-BR');
    await this.notify({
      appointmentId: input.appointmentId,
      recipient: input.patientPhone,
      event: 'APPOINTMENT_CREATED',
      message: `Olá ${input.patientName}! Seu agendamento de ${input.serviceName} foi confirmado para ${when}. — CronoCita`,
    });
  }

  async notifyAppointmentCanceled(input: {
    appointmentId: string;
    patientName: string;
    patientPhone: string;
    serviceName: string;
    startsAt: Date;
  }): Promise<void> {
    const when = input.startsAt.toLocaleString('pt-BR');
    await this.notify({
      appointmentId: input.appointmentId,
      recipient: input.patientPhone,
      event: 'APPOINTMENT_CANCELED',
      message: `Olá ${input.patientName}, seu agendamento de ${input.serviceName} em ${when} foi cancelado. — CronoCita`,
    });
  }

  async notifyAppointmentReminder(input: {
    appointmentId: string;
    patientName: string;
    patientPhone: string;
    serviceName: string;
    startsAt: Date;
  }): Promise<void> {
    const when = input.startsAt.toLocaleString('pt-BR');
    await this.notify({
      appointmentId: input.appointmentId,
      recipient: input.patientPhone,
      event: 'APPOINTMENT_REMINDER',
      message: `Olá ${input.patientName}! Lembrete: você tem ${input.serviceName} amanhã, ${when}. — CronoCita`,
    });
  }
}

export function makeNotificationProvider(): NotificationProvider {
  switch ((process.env.NOTIFICATION_PROVIDER ?? 'whatsapp').toLowerCase()) {
    case 'twilio':
      return new TwilioProvider();
    case 'evolution':
      return new EvolutionProvider();
    default:
      return new WhatsAppProvider();
  }
}

export function makeNotificationService(): NotificationService {
  return new NotificationService(makeNotificationProvider());
}

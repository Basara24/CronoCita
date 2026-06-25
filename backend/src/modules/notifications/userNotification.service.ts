import { NotificationType } from '@prisma/client';
import { prisma } from '../../shared/database/prisma';

interface CreateUserNotificationInput {
  userId: string;
  title: string;
  message: string;
  type?: NotificationType;
  appointmentId?: string | null;
}

/**
 * Notificações in-app exibidas na Central de Notificações do Portal do Paciente.
 * Independente do log de canal (WhatsApp/SMS) representado por `Notification`.
 */
export class UserNotificationService {
  async create(input: CreateUserNotificationInput) {
    return prisma.userNotification.create({
      data: {
        userId: input.userId,
        title: input.title,
        message: input.message,
        type: input.type ?? 'SYSTEM',
        appointmentId: input.appointmentId ?? null,
      },
    });
  }

  async listForUser(userId: string) {
    return prisma.userNotification.findMany({
      where: { userId },
      orderBy: { createdAt: 'desc' },
      take: 100,
    });
  }

  async countUnread(userId: string): Promise<number> {
    return prisma.userNotification.count({ where: { userId, isRead: false } });
  }

  async markAsRead(userId: string, id: string): Promise<void> {
    await prisma.userNotification.updateMany({
      where: { id, userId },
      data: { isRead: true },
    });
  }

  async markAllAsRead(userId: string): Promise<void> {
    await prisma.userNotification.updateMany({
      where: { userId, isRead: false },
      data: { isRead: true },
    });
  }
}

export const userNotificationService = new UserNotificationService();

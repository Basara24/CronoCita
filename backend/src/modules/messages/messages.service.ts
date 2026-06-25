import { prisma } from '../../shared/database/prisma';
import { NotFoundError } from '../../shared/errors/AppError';
import { emitToUser } from '../../shared/realtime/io';
import { userNotificationService } from '../notifications/userNotification.service';

const userSelect = {
  id: true,
  name: true,
  role: true,
  avatarUrl: true,
} as const;

export class MessagesService {
  /** Lista de conversas do usuário: contraparte, última mensagem e não lidas. */
  async listThreads(userId: string) {
    const messages = await prisma.message.findMany({
      where: { OR: [{ senderId: userId }, { receiverId: userId }] },
      orderBy: { createdAt: 'desc' },
      include: { sender: { select: userSelect }, receiver: { select: userSelect } },
    });

    const threads = new Map<
      string,
      {
        user: { id: string; name: string; role: string; avatarUrl: string | null };
        lastMessage: string;
        lastAt: Date;
        unread: number;
      }
    >();

    for (const m of messages) {
      const other = m.senderId === userId ? m.receiver : m.sender;
      const existing = threads.get(other.id);
      const isUnreadForMe = m.receiverId === userId && !m.readAt;
      if (!existing) {
        threads.set(other.id, {
          user: other,
          lastMessage: m.content,
          lastAt: m.createdAt,
          unread: isUnreadForMe ? 1 : 0,
        });
      } else if (isUnreadForMe) {
        existing.unread += 1;
      }
    }

    return Array.from(threads.values());
  }

  /** Histórico entre o usuário e a contraparte; marca como lidas as recebidas. */
  async getConversation(userId: string, withUserId: string) {
    const other = await prisma.user.findUnique({ where: { id: withUserId }, select: userSelect });
    if (!other) throw new NotFoundError('Usuário não encontrado');

    const messages = await prisma.message.findMany({
      where: {
        OR: [
          { senderId: userId, receiverId: withUserId },
          { senderId: withUserId, receiverId: userId },
        ],
      },
      orderBy: { createdAt: 'asc' },
    });

    await prisma.message.updateMany({
      where: { senderId: withUserId, receiverId: userId, readAt: null },
      data: { readAt: new Date() },
    });

    return { user: other, messages };
  }

  async send(senderId: string, receiverId: string, content: string, appointmentId?: string | null) {
    const receiver = await prisma.user.findUnique({ where: { id: receiverId }, select: userSelect });
    if (!receiver) throw new NotFoundError('Destinatário não encontrado');

    const sender = await prisma.user.findUnique({ where: { id: senderId }, select: userSelect });

    const message = await prisma.message.create({
      data: { senderId, receiverId, content, appointmentId: appointmentId ?? null },
    });

    // Emite em tempo real para ambas as pontas
    emitToUser(receiverId, 'message:new', message);
    emitToUser(senderId, 'message:new', message);

    // Notificação in-app para o destinatário
    await userNotificationService.create({
      userId: receiverId,
      title: 'Nova mensagem',
      message: `💬 ${sender?.name ?? 'Alguém'} enviou uma mensagem.`,
      type: 'CHAT',
    });

    return message;
  }
}

export const messagesService = new MessagesService();

import { Prisma, SubscriptionPlan, SubscriptionStatus } from '@prisma/client';
import { AppError, NotFoundError } from '../../shared/errors/AppError';
import { prisma } from '../../shared/database/prisma';

const include = { clinic: { select: { id: true, name: true, slug: true, city: true } } } as const;

export type SubscriptionWithClinic = Prisma.SubscriptionGetPayload<{ include: typeof include }>;

interface CreateInput {
  clinicId: string;
  plan: SubscriptionPlan;
  status?: SubscriptionStatus;
  price: number;
  startsAt?: string;
  renewsAt?: string;
}

interface UpdateInput {
  plan?: SubscriptionPlan;
  status?: SubscriptionStatus;
  price?: number;
  startsAt?: string;
  renewsAt?: string;
}

export class SubscriptionsService {
  async list(): Promise<SubscriptionWithClinic[]> {
    return prisma.subscription.findMany({ include, orderBy: { createdAt: 'desc' } });
  }

  async getById(id: string): Promise<SubscriptionWithClinic> {
    const subscription = await prisma.subscription.findUnique({ where: { id }, include });
    if (!subscription) throw new NotFoundError('Assinatura não encontrada');
    return subscription;
  }

  async create(data: CreateInput): Promise<SubscriptionWithClinic> {
    const clinic = await prisma.clinic.findUnique({ where: { id: data.clinicId } });
    if (!clinic) throw new NotFoundError('Clínica não encontrada');

    const existing = await prisma.subscription.findUnique({ where: { clinicId: data.clinicId } });
    if (existing) throw new AppError('Esta clínica já possui uma assinatura', 409);

    return prisma.subscription.create({
      data: {
        clinicId: data.clinicId,
        plan: data.plan,
        status: data.status ?? 'ACTIVE',
        price: data.price,
        startsAt: data.startsAt ? new Date(data.startsAt) : undefined,
        renewsAt: data.renewsAt ? new Date(data.renewsAt) : undefined,
      },
      include,
    });
  }

  async update(id: string, data: UpdateInput): Promise<SubscriptionWithClinic> {
    await this.getById(id);
    return prisma.subscription.update({
      where: { id },
      data: {
        plan: data.plan,
        status: data.status,
        price: data.price,
        startsAt: data.startsAt ? new Date(data.startsAt) : undefined,
        renewsAt: data.renewsAt ? new Date(data.renewsAt) : undefined,
      },
      include,
    });
  }

  async delete(id: string): Promise<void> {
    await this.getById(id);
    await prisma.subscription.delete({ where: { id } });
  }
}

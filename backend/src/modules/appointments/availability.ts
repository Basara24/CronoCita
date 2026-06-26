import { Appointment } from '@prisma/client';
import { ConflictError } from '../../shared/errors/AppError';
import { diffInHours } from '../../shared/utils/date';
import { AvailabilityCheckDTO } from './appointments.dtos';

export const MIN_CANCEL_HOURS = 2;

interface ConflictFinder {
  findConflicts(input: AvailabilityCheckDTO): Promise<Appointment[]>;
  /** Conta bloqueios de agenda do profissional que se sobrepõem ao intervalo. */
  countScheduleBlocks?(professionalId: string, startsAt: Date, endsAt: Date): Promise<number>;
}

/**
 * Algoritmo central de disponibilidade.
 * Garante que NENHUM agendamento seja salvo em conflito de
 * profissional, sala ou equipamento.
 */
export class AvailabilityChecker {
  constructor(private readonly repository: ConflictFinder) {}

  async checkAvailability(input: AvailabilityCheckDTO): Promise<void> {
    if (input.endsAt <= input.startsAt) {
      throw new ConflictError('Horário inválido: o término deve ser após o início.');
    }

    // Bloqueios de agenda do profissional (férias, ausências, horário bloqueado)
    if (this.repository.countScheduleBlocks) {
      const blocked = await this.repository.countScheduleBlocks(
        input.professionalId,
        input.startsAt,
        input.endsAt,
      );
      if (blocked > 0) {
        throw new ConflictError('Horário bloqueado na agenda do profissional.');
      }
    }

    const conflicts = await this.repository.findConflicts(input);
    if (conflicts.length === 0) return;

    const professionalBusy = conflicts.some((c) => c.professionalId === input.professionalId);
    if (professionalBusy) {
      throw new ConflictError('Horário indisponível.');
    }

    const roomBusy = input.roomId
      ? conflicts.some((c) => c.roomId === input.roomId)
      : false;
    const equipmentBusy = input.equipmentId
      ? conflicts.some((c) => c.equipmentId === input.equipmentId)
      : false;

    if (roomBusy || equipmentBusy) {
      throw new ConflictError('Sala ou equipamento já reservado.');
    }
  }
}

/**
 * Regra de cancelamento: não é permitido cancelar com menos
 * de 2 horas de antecedência do início da consulta.
 */
export function canCancel(startsAt: Date, now: Date = new Date()): boolean {
  return diffInHours(startsAt, now) >= MIN_CANCEL_HOURS;
}

import { AppError, ConflictError, NotFoundError } from '../../shared/errors/AppError';
import { addMinutes } from '../../shared/utils/date';
import { NotificationService } from '../../shared/notifications/NotificationService';
import { IServicesRepository } from '../services/services.repository';
import { IPatientsRepository } from '../patients/patients.repository';
import { IProfessionalsRepository } from '../professionals/professionals.repository';
import { CommissionsService } from '../commissions/commissions.service';
import {
  AppointmentWithRelations,
  IAppointmentsRepository,
} from './appointments.repository';
import { AvailabilityChecker, canCancel } from './availability';
import {
  CreateAppointmentDTO,
  ListAppointmentsFilterDTO,
  PublicBookingDTO,
  RescheduleAppointmentDTO,
  UpdateStatusDTO,
} from './appointments.dtos';

const WORK_START_HOUR = 8;
const WORK_END_HOUR = 18;
const SLOT_STEP_MINUTES = 30;

export class AppointmentsService {
  private readonly availability: AvailabilityChecker;

  constructor(
    private readonly repository: IAppointmentsRepository,
    private readonly servicesRepository: IServicesRepository,
    private readonly patientsRepository: IPatientsRepository,
    private readonly professionalsRepository: IProfessionalsRepository,
    private readonly commissionsService: CommissionsService,
    private readonly notificationService: NotificationService,
  ) {
    this.availability = new AvailabilityChecker(repository);
  }

  async list(filter: ListAppointmentsFilterDTO): Promise<AppointmentWithRelations[]> {
    return this.repository.findMany(filter);
  }

  async getById(id: string): Promise<AppointmentWithRelations> {
    const appointment = await this.repository.findById(id);
    if (!appointment) throw new NotFoundError('Agendamento não encontrado');
    return appointment;
  }

  async create(data: CreateAppointmentDTO): Promise<AppointmentWithRelations> {
    const service = await this.servicesRepository.findById(data.serviceId);
    if (!service) throw new NotFoundError('Serviço não encontrado');

    const professional = await this.professionalsRepository.findById(data.professionalId);
    if (!professional) throw new NotFoundError('Profissional não encontrado');

    const patient = await this.patientsRepository.findById(data.patientId);
    if (!patient) throw new NotFoundError('Paciente não encontrado');

    const startsAt = new Date(data.startsAt);
    const endsAt = addMinutes(startsAt, service.durationMinutes);

    if (startsAt < new Date()) {
      throw new AppError('Não é possível agendar em horário passado');
    }

    // Alocação automática de sala quando o serviço exige e nenhuma foi informada
    let roomId = data.roomId ?? null;
    if (service.requiresRoom && !roomId) {
      const freeRoom = await this.repository.findFreeRoom(startsAt, endsAt);
      if (!freeRoom) throw new ConflictError('Sala ou equipamento já reservado.');
      roomId = freeRoom.id;
    }

    // Alocação automática de equipamento exigido pelo serviço
    const requiredEquipmentIds = service.equipments.map((e) => e.equipmentId);
    let equipmentId = data.equipmentId ?? null;
    if (requiredEquipmentIds.length > 0 && !equipmentId) {
      const freeEquipment = await this.repository.findFreeEquipment(
        requiredEquipmentIds,
        startsAt,
        endsAt,
      );
      if (!freeEquipment) throw new ConflictError('Sala ou equipamento já reservado.');
      equipmentId = freeEquipment.id;
    }

    await this.availability.checkAvailability({
      professionalId: data.professionalId,
      roomId,
      equipmentId,
      startsAt,
      endsAt,
    });

    const appointment = await this.repository.create({
      patientId: data.patientId,
      professionalId: data.professionalId,
      serviceId: data.serviceId,
      roomId,
      equipmentId,
      startsAt,
      endsAt,
      notes: data.notes,
    });

    this.notificationService
      .notifyAppointmentCreated({
        appointmentId: appointment.id,
        patientName: appointment.patient.name,
        patientPhone: appointment.patient.phone,
        serviceName: appointment.service.name,
        startsAt: appointment.startsAt,
      })
      .catch((err) => console.error('Erro ao notificar:', err));

    return appointment;
  }

  async reschedule(id: string, data: RescheduleAppointmentDTO): Promise<AppointmentWithRelations> {
    const appointment = await this.getById(id);

    if (appointment.status === 'CANCELED' || appointment.status === 'FINISHED') {
      throw new AppError('Não é possível remarcar um agendamento cancelado ou finalizado');
    }

    const startsAt = new Date(data.startsAt);
    const endsAt = addMinutes(startsAt, appointment.service.durationMinutes);
    const roomId = data.roomId ?? appointment.roomId;
    const equipmentId = data.equipmentId ?? appointment.equipmentId;

    await this.availability.checkAvailability({
      professionalId: appointment.professionalId,
      roomId,
      equipmentId,
      startsAt,
      endsAt,
      excludeAppointmentId: id,
    });

    return this.repository.update(id, { startsAt, endsAt, roomId, equipmentId });
  }

  async updateStatus(id: string, data: UpdateStatusDTO): Promise<AppointmentWithRelations> {
    const appointment = await this.getById(id);

    if (data.status === 'CANCELED') {
      if (!canCancel(appointment.startsAt)) {
        throw new AppError(
          'Não é permitido cancelar com menos de 2 horas de antecedência.',
          422,
        );
      }

      this.notificationService
        .notifyAppointmentCanceled({
          appointmentId: appointment.id,
          patientName: appointment.patient.name,
          patientPhone: appointment.patient.phone,
          serviceName: appointment.service.name,
          startsAt: appointment.startsAt,
        })
        .catch((err) => console.error('Erro ao notificar:', err));
    }

    if (data.status === 'FINISHED') {
      await this.commissionsService.createForAppointment({
        appointmentId: appointment.id,
        professionalId: appointment.professionalId,
        totalValue: Number(appointment.service.price),
        percentage: Number(appointment.professional.commissionPercentage),
      });
    }

    return this.repository.update(id, {
      status: data.status,
      rating: data.rating,
    });
  }

  /**
   * Slots livres para o portal público: varre o expediente (08h–18h)
   * em passos de 30min e mantém apenas horários sem conflito.
   */
  async getAvailableSlots(
    professionalId: string,
    serviceId: string,
    dateISO: string,
  ): Promise<string[]> {
    const service = await this.servicesRepository.findById(serviceId);
    if (!service) throw new NotFoundError('Serviço não encontrado');

    const day = new Date(`${dateISO}T00:00:00`);
    if (Number.isNaN(day.getTime())) throw new AppError('Data inválida');

    const dayStart = new Date(day);
    dayStart.setHours(WORK_START_HOUR, 0, 0, 0);
    const dayEnd = new Date(day);
    dayEnd.setHours(WORK_END_HOUR, 0, 0, 0);

    const appointments = await this.repository.findMany({
      from: dayStart,
      to: dayEnd,
      professionalId,
    });
    const busy = appointments.filter((a) => a.status !== 'CANCELED');

    const now = new Date();
    const slots: string[] = [];

    for (
      let slotStart = new Date(dayStart);
      addMinutes(slotStart, service.durationMinutes) <= dayEnd;
      slotStart = addMinutes(slotStart, SLOT_STEP_MINUTES)
    ) {
      const slotEnd = addMinutes(slotStart, service.durationMinutes);

      if (slotStart < now) continue;

      const professionalBusy = busy.some(
        (a) => a.startsAt < slotEnd && a.endsAt > slotStart,
      );
      if (professionalBusy) continue;

      if (service.requiresRoom) {
        const freeRoom = await this.repository.findFreeRoom(slotStart, slotEnd);
        if (!freeRoom) continue;
      }

      const requiredEquipmentIds = service.equipments.map((e) => e.equipmentId);
      if (requiredEquipmentIds.length > 0) {
        const freeEquipment = await this.repository.findFreeEquipment(
          requiredEquipmentIds,
          slotStart,
          slotEnd,
        );
        if (!freeEquipment) continue;
      }

      slots.push(slotStart.toISOString());
    }

    return slots;
  }

  /** Agendamento online sem login: localiza ou cadastra o paciente pelo CPF/e-mail. */
  async publicBooking(data: PublicBookingDTO): Promise<AppointmentWithRelations> {
    let patient = await this.patientsRepository.findByCpf(data.patient.cpf);
    if (!patient) {
      patient = await this.patientsRepository.findByEmail(data.patient.email);
    }
    if (!patient) {
      patient = await this.patientsRepository.create({
        name: data.patient.name,
        cpf: data.patient.cpf,
        email: data.patient.email,
        phone: data.patient.phone,
        birthDate: data.patient.birthDate ? new Date(data.patient.birthDate) : new Date('1990-01-01'),
      });
    }

    return this.create({
      patientId: patient.id,
      professionalId: data.professionalId,
      serviceId: data.serviceId,
      startsAt: data.startsAt,
      notes: 'Agendamento online (portal público)',
    });
  }
}

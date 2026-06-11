import { makeNotificationService } from '../../shared/notifications/NotificationService';
import { ServicesRepository } from '../services/services.repository';
import { PatientsRepository } from '../patients/patients.repository';
import { ProfessionalsRepository } from '../professionals/professionals.repository';
import { CommissionsRepository } from '../commissions/commissions.repository';
import { CommissionsService } from '../commissions/commissions.service';
import { AppointmentsRepository } from './appointments.repository';
import { AppointmentsService } from './appointments.service';

/** Composição de dependências do módulo de agendamentos. */
export function makeAppointmentsService(): AppointmentsService {
  return new AppointmentsService(
    new AppointmentsRepository(),
    new ServicesRepository(),
    new PatientsRepository(),
    new ProfessionalsRepository(),
    new CommissionsService(new CommissionsRepository()),
    makeNotificationService(),
  );
}

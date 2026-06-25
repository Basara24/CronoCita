/// <reference types="cypress" />

/**
 * Fluxo de Erro:
 *  tentar agendar em horário/sala ocupados → exibir erro
 */
describe('Fluxo de Erro — conflito de agendamento', () => {
  function tomorrowISO(): string {
    const d = new Date();
    d.setDate(d.getDate() + 1);
    return d.toISOString().slice(0, 10);
  }

  function createAppointment(professionalIndex: number, time: string) {
    cy.get('[data-cy=new-appointment]').click();
    cy.get('[data-cy=select-patient]').select(1);
    cy.get('[data-cy=select-professional]').select(professionalIndex);
    cy.get('[data-cy=select-service]').select(1);
    cy.get('[data-cy=input-date]').type(tomorrowISO());
    cy.get('[data-cy=input-time]').type(time);
    cy.get('[data-cy=save-appointment]').click();
  }

  it('exibe erro ao tentar agendar profissional em horário já ocupado', () => {
    cy.login('admin@viverbem.com', '123456');
    cy.url().should('include', '/painel/agenda');

    // O seed já possui agendamento da Dra. Ana amanhã às 09:00
    createAppointment(1, '09:00');

    cy.get('[data-cy=appointment-error]')
      .should('be.visible')
      .and('contain.text', 'Horário indisponível');
  });

  it('exibe erro quando a sala/equipamento já está reservado', () => {
    cy.login('admin@viverbem.com', '123456');
    cy.url().should('include', '/painel/agenda');

    // Ocupa as salas ativas às 16:00 com profissionais diferentes
    createAppointment(1, '16:00');
    cy.get('[data-cy=appointment-error]').should('not.exist');

    createAppointment(2, '16:00');
    cy.get('[data-cy=appointment-error]').should('not.exist');

    // Terceiro agendamento no mesmo horário: sem sala livre → erro
    createAppointment(3, '16:00');
    cy.get('[data-cy=appointment-error]')
      .should('be.visible')
      .and('contain.text', 'Sala ou equipamento já reservado');
  });
});

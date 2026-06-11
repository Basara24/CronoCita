/// <reference types="cypress" />

/**
 * Fluxo Feliz:
 *  login → agendar → salvar → aparecer na agenda
 */
describe('Fluxo Feliz — agendamento', () => {
  function tomorrowISO(): string {
    const d = new Date();
    d.setDate(d.getDate() + 1);
    return d.toISOString().slice(0, 10);
  }

  it('realiza login, agenda uma consulta e vê o agendamento na agenda', () => {
    cy.login('secretaria@cronocita.com', '123456');

    // Após o login a secretária é direcionada para a agenda
    cy.url().should('include', '/agenda');

    // Abre o formulário de novo agendamento
    cy.get('[data-cy=new-appointment]').click();

    // Preenche o formulário
    cy.get('[data-cy=select-patient] option').eq(1).then((opt) => {
      cy.get('[data-cy=select-patient]').select(opt.val() as string);
    });
    cy.get('[data-cy=select-professional]').select(1);
    cy.get('[data-cy=select-service]').select(1);
    cy.get('[data-cy=input-date]').type(tomorrowISO());
    cy.get('[data-cy=input-time]').type('12:00');

    // Salva
    cy.get('[data-cy=save-appointment]').click();

    // O agendamento aparece na agenda
    cy.get('[data-cy=appointment-error]').should('not.exist');
    cy.get('[data-cy=appointment-card]').should('have.length.greaterThan', 0);
  });
});

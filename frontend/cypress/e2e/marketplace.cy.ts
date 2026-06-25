/// <reference types="cypress" />

/**
 * Fluxo do marketplace público:
 *  Home → buscar clínica → ver clínica → agendar consulta online
 */
describe('Marketplace público', () => {
  it('lista clínicas na Home e abre a página de uma clínica', () => {
    cy.visit('/');
    cy.get('[data-cy=clinic-card]').should('have.length.greaterThan', 0);
    cy.get('[data-cy=clinic-view]').first().click();
    cy.url().should('include', '/clinica/');
    cy.get('[data-cy=schedule-button]').should('be.visible');
  });

  it('filtra clínicas por cidade', () => {
    cy.visit('/');
    cy.get('[data-cy=search-city]').type('Curitiba');
    cy.get('[data-cy=search-submit]').click();
    cy.get('[data-cy=clinic-card]').should('have.length.greaterThan', 0);
  });

  it('realiza um agendamento online a partir da página da clínica', () => {
    cy.visit('/clinica/clinica-viver-bem/agendar');

    // Passo 1 — especialidade
    cy.get('[data-cy=specialty-option]').first().click();

    // Passo 2 — profissional + serviço
    cy.get('[data-cy=professional-option]').first().click();
    cy.get('[data-cy=service-option]').first().click();
    cy.contains('button', 'Continuar').click();

    // Passo 3 — data e horário
    cy.get('[data-cy=date-option]').eq(2).click();
    cy.get('[data-cy=slot-option]').first().click();
    cy.contains('button', 'Continuar').click();

    // Passo 4 — dados do paciente
    cy.get('[data-cy=patient-name]').type('Paciente Teste E2E');
    cy.get('[data-cy=patient-cpf]').type('123.456.789-09');
    cy.get('[data-cy=patient-phone]').type('(44) 99999-0000');
    cy.get('[data-cy=patient-email]').type('paciente.e2e@example.com');
    cy.get('[data-cy=confirm-booking]').click();

    // Confirmação
    cy.get('[data-cy=booking-success]').should('be.visible');
  });
});

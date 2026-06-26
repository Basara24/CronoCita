/// <reference types="cypress" />

import { generateValidCpf } from '../support/br';

/**
 * Portal do Paciente:
 *  registrar → dashboard → agendar consulta → ver em "Meus Agendamentos" → notificações
 */
describe('Portal do Paciente', () => {
  it('registra um novo paciente e acessa o dashboard', () => {
    const unique = Date.now();
    const cpf = generateValidCpf(unique);

    cy.visit('/register');
    cy.get('[data-cy=register-name]').type('Paciente Portal E2E');
    cy.get('[data-cy=register-cpf]').type(cpf);
    cy.get('[data-cy=register-birth]').type('20051990');
    cy.get('[data-cy=register-phone]').type('(44) 98888-0000');
    cy.get('[data-cy=register-email]').type(`portal.e2e.${unique}@example.com`);
    cy.get('[data-cy=register-password]').type('senha12345');
    cy.get('[data-cy=register-confirm]').type('senha12345');
    cy.get('[data-cy=register-terms]').check();
    cy.get('[data-cy=register-submit]').click();

    cy.url().should('include', '/minha-conta');
    cy.contains('Olá').should('be.visible');
  });

  it('login do paciente demo exibe agendamentos e notificações', () => {
    cy.visit('/login');
    cy.get('#email').type('joao@cliente.com');
    cy.get('#password').type('123456');
    cy.get('[data-cy=login-submit]').click();

    cy.url().should('include', '/minha-conta');

    // Meus Agendamentos (agrega clínicas)
    cy.visit('/meus-agendamentos');
    cy.get('[data-cy=patient-appointment]').should('have.length.greaterThan', 0);

    // Central de Notificações
    cy.visit('/notificacoes');
    cy.get('[data-cy=notification]').should('have.length.greaterThan', 0);
  });
});

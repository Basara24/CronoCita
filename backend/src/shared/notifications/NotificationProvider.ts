/**
 * Contrato de envio de notificações.
 * Qualquer integração (WhatsApp Cloud API, Twilio, Evolution API)
 * deve implementar esta interface — a camada de negócio não conhece detalhes.
 */
export interface NotificationProvider {
  readonly name: string;
  send(recipient: string, message: string): Promise<void>;
}

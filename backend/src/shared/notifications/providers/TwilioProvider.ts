import { NotificationProvider } from '../NotificationProvider';

/**
 * Integração com Twilio (SMS/WhatsApp).
 * Stub: pronto para usar o SDK oficial quando TWILIO_ACCOUNT_SID /
 * TWILIO_AUTH_TOKEN forem configurados.
 */
export class TwilioProvider implements NotificationProvider {
  readonly name = 'twilio';

  async send(recipient: string, message: string): Promise<void> {
    const sid = process.env.TWILIO_ACCOUNT_SID;
    const token = process.env.TWILIO_AUTH_TOKEN;

    if (!sid || !token) {
      console.log(`[Twilio:stub] → ${recipient}: ${message}`);
      return;
    }

    // Chamada real via SDK do Twilio:
    // const client = twilio(sid, token);
    // await client.messages.create({ to: recipient, from: ..., body: message });
    console.log(`[Twilio] → ${recipient}: ${message}`);
  }
}
